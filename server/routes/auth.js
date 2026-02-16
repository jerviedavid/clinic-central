import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Signup - Now creates clinic and assigns roles automatically
router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        // Basic validation - role is no longer required
        if (!email || !password || !fullName) {
            return res.status(400).json({
                message: 'Email, password, and full name are required',
                missingFields: {
                    email: !email,
                    password: !password,
                    fullName: !fullName
                }
            });
        }

        const existingUser = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

        // Create user
        const userInfo = db.prepare(
            'INSERT INTO User (email, password, fullName, verificationToken, verificationExpires) VALUES (?, ?, ?, ?, ?)'
        ).run(email, hashedPassword, fullName, verificationToken, verificationExpires.toISOString());

        const userId = userInfo.lastInsertRowid;

        // Create clinic for the user
        const clinicInfo = db.prepare(
            'INSERT INTO Clinic (name) VALUES (?)'
        ).run(`${fullName}'s Clinic`);

        const clinicId = clinicInfo.lastInsertRowid;

        // Get role IDs
        const doctorRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('DOCTOR');
        const adminRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('ADMIN');

        // Assign both DOCTOR and ADMIN roles to the user
        db.prepare(
            'INSERT INTO ClinicUser (userId, clinicId, roleId) VALUES (?, ?, ?)'
        ).run(userId, clinicId, doctorRole.id);

        db.prepare(
            'INSERT INTO ClinicUser (userId, clinicId, roleId) VALUES (?, ?, ?)'
        ).run(userId, clinicId, adminRole.id);

        // Create trial subscription for the new clinic
        const starterPlan = db.prepare('SELECT id FROM Plan WHERE name = ?').get('STARTER');

        if (starterPlan) {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days from now

            db.prepare(`
                INSERT INTO Subscription (clinicId, planId, status, trialEndsAt)
                VALUES (?, ?, 'trialing', ?)
            `).run(clinicId, starterPlan.id, trialEndsAt.toISOString());

            console.log(`✅ Created 14-day trial subscription for clinic ${clinicId}`);
        }

        // Send verification email
        try {
            await sendVerificationEmail(email, fullName, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email during signup:', emailError);
            // We continue anyway, they can resend it later
        }

        // Send welcome email
        try {
            await sendWelcomeEmail(email, fullName, `${fullName}'s Clinic`);
        } catch (emailError) {
            console.error('Failed to send welcome email during signup:', emailError);
            // Continue anyway, email failure shouldn't block signup
        }

        const user = {
            id: userId,
            email,
            fullName
        };

        // Generate JWT with clinic context and roles
        const token = jwt.sign(
            {
                userId: user.id,
                clinicId: clinicId,
                roles: ['DOCTOR', 'ADMIN']
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie for web
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return user with clinic info
        res.status(201).json({
            user,
            clinic: {
                id: clinicId,
                name: `${fullName}'s Clinic`
            },
            roles: ['DOCTOR', 'ADMIN'],
            token // Also return token for mobile clients
        });
    } catch (error) {
        console.error('Signup error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/auth/verify-email
 * Verifies a user's email using a token
 */
router.get('/verify-email', (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const user = db.prepare('SELECT * FROM User WHERE verificationToken = ?').get(token);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        const now = new Date();
        const expires = new Date(user.verificationExpires);

        if (now > expires) {
            return res.status(400).json({ message: 'Verification token has expired' });
        }

        // Update user
        db.prepare('UPDATE User SET emailVerified = 1, verificationToken = NULL, verificationExpires = NULL WHERE id = ?')
            .run(user.id);

        // Redirect to a success page or return JSON
        // For development, redirect to frontend login with a success param
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * POST /api/auth/resend-verification
 * Resends the verification email
 */
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = db.prepare('SELECT * FROM User WHERE email = ?').get(email);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        // Update user
        db.prepare('UPDATE User SET verificationToken = ?, verificationExpires = ? WHERE id = ?')
            .run(verificationToken, verificationExpires.toISOString(), user.id);

        // Send email
        await sendVerificationEmail(user.email, user.fullName, verificationToken);

        res.json({ message: 'Verification email resent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Google OAuth Signup - Creates account from Google credential
router.post('/google-signup', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        // Verify Google token and extract user info
        // In production, you should verify the token with Google's API
        // For now, we'll decode the JWT (it's base64 encoded)
        const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

        const email = payload.email;
        const fullName = payload.name;
        const googleId = payload.sub;
        const emailVerified = payload.email_verified;

        if (!email || !fullName) {
            return res.status(400).json({ message: 'Invalid Google credential' });
        }

        // Check if user already exists
        let existingUser = db.prepare('SELECT * FROM User WHERE email = ?').get(email);

        if (existingUser) {
            // User exists, just log them in
            // Get all clinics and roles for this user
            const clinicRoles = db.prepare(`
                SELECT 
                    c.id as clinicId,
                    c.name as clinicName,
                    r.name as roleName
                FROM ClinicUser cu
                JOIN Clinic c ON cu.clinicId = c.id
                JOIN Role r ON cu.roleId = r.id
                WHERE cu.userId = ?
            `).all(existingUser.id);

            if (clinicRoles.length === 0) {
                return res.status(403).json({
                    message: 'Your account is not associated with any clinic. Please contact your system administrator.'
                });
            }

            // Group roles by clinic
            const clinicsMap = {};
            clinicRoles.forEach(cr => {
                if (!clinicsMap[cr.clinicId]) {
                    clinicsMap[cr.clinicId] = {
                        clinicId: cr.clinicId,
                        clinicName: cr.clinicName,
                        roles: []
                    };
                }
                clinicsMap[cr.clinicId].roles.push(cr.roleName);
            });

            const clinics = Object.values(clinicsMap);
            const defaultClinic = clinics.find(c => c.clinicId !== 0) || clinics[0];
            const isSuperAdmin = clinicRoles.some(cr => cr.roleName === 'SUPER_ADMIN');
            const tokenRoles = [...defaultClinic.roles];
            if (isSuperAdmin && !tokenRoles.includes('SUPER_ADMIN')) {
                tokenRoles.push('SUPER_ADMIN');
            }

            const token = jwt.sign(
                {
                    userId: existingUser.id,
                    clinicId: defaultClinic.clinicId,
                    roles: tokenRoles
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.json({
                user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    fullName: existingUser.fullName
                },
                clinic: {
                    id: defaultClinic.clinicId,
                    name: defaultClinic.clinicName
                },
                roles: tokenRoles,
                token
            });
        }

        // Create new user with Google OAuth (no password needed)
        const userInfo = db.prepare(
            'INSERT INTO User (email, password, fullName, emailVerified) VALUES (?, ?, ?, ?)'
        ).run(email, '', fullName, emailVerified ? 1 : 0);

        const userId = userInfo.lastInsertRowid;

        // Create clinic for the user
        const clinicInfo = db.prepare(
            'INSERT INTO Clinic (name) VALUES (?)'
        ).run(`${fullName}'s Clinic`);

        const clinicId = clinicInfo.lastInsertRowid;

        // Get role IDs
        const doctorRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('DOCTOR');
        const adminRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('ADMIN');

        // Assign both DOCTOR and ADMIN roles to the user
        db.prepare(
            'INSERT INTO ClinicUser (userId, clinicId, roleId) VALUES (?, ?, ?)'
        ).run(userId, clinicId, doctorRole.id);

        db.prepare(
            'INSERT INTO ClinicUser (userId, clinicId, roleId) VALUES (?, ?, ?)'
        ).run(userId, clinicId, adminRole.id);

        // Create trial subscription for the new clinic
        const starterPlan = db.prepare('SELECT id FROM Plan WHERE name = ?').get('STARTER');

        if (starterPlan) {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 14);

            db.prepare(`
                INSERT INTO Subscription (clinicId, planId, status, trialEndsAt)
                VALUES (?, ?, 'trialing', ?)
            `).run(clinicId, starterPlan.id, trialEndsAt.toISOString());

            console.log(`✅ Created 14-day trial subscription for clinic ${clinicId} (Google OAuth)`);
        }

        const user = {
            id: userId,
            email,
            fullName
        };

        // Generate JWT with clinic context and roles
        const token = jwt.sign(
            {
                userId: user.id,
                clinicId: clinicId,
                roles: ['DOCTOR', 'ADMIN']
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie for web
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Return user with clinic info
        res.status(201).json({
            user,
            clinic: {
                id: clinicId,
                name: `${fullName}'s Clinic`
            },
            roles: ['DOCTOR', 'ADMIN'],
            token
        });
    } catch (error) {
        console.error('Google signup error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login - Returns all clinics and roles for the user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        db.prepare('UPDATE User SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        // Get all clinics and roles for this user
        const clinicRoles = db.prepare(`
            SELECT 
                c.id as clinicId,
                c.name as clinicName,
                r.name as roleName
            FROM ClinicUser cu
            JOIN Clinic c ON cu.clinicId = c.id
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.userId = ?
        `).all(user.id);

        if (clinicRoles.length === 0) {
            // Fallback for edge cases: check if we should auto-create a clinic or return specific error
            // For now, return a clearer error message
            console.error(`Login failed: User ${user.id} (${user.email}) has no clinic assignments.`);
            return res.status(403).json({
                message: 'Your account is not associated with any clinic. Please contact your system administrator or sign up again.'
            });
        }

        // Group roles by clinic
        const clinicsMap = {};
        clinicRoles.forEach(cr => {
            if (!clinicsMap[cr.clinicId]) {
                clinicsMap[cr.clinicId] = {
                    clinicId: cr.clinicId,
                    clinicName: cr.clinicName,
                    roles: []
                };
            }
            clinicsMap[cr.clinicId].roles.push(cr.roleName);
        });

        const clinics = Object.values(clinicsMap);

        // Check if user is a Super Admin (has SUPER_ADMIN role in ANY clinic)
        const isSuperAdmin = clinicRoles.some(cr => cr.roleName === 'SUPER_ADMIN');

        // Use first clinic as default (prefer one that isn't the System clinic if possible)
        const defaultClinic = clinics.find(c => c.clinicId !== 0) || clinics[0];

        // Prepare roles for the token
        const tokenRoles = [...defaultClinic.roles];
        if (isSuperAdmin && !tokenRoles.includes('SUPER_ADMIN')) {
            tokenRoles.push('SUPER_ADMIN');
        }

        // Generate JWT with selected clinic context
        const token = jwt.sign(
            {
                userId: user.id,
                clinicId: defaultClinic.clinicId,
                roles: tokenRoles
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie for web
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            },
            clinics, // All clinics and roles
            selectedClinic: defaultClinic, // Currently selected clinic
            token // Also return token for mobile clients
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user with all clinics and roles
router.get('/me', async (req, res) => {
    try {
        // Try to get token from cookie first (web)
        let token = req.cookies.token;

        // If not in cookie, try Authorization header (mobile)
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, email, fullName, emailVerified FROM User WHERE id = ?').get(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get all clinics and roles for this user
        const clinicRoles = db.prepare(`
            SELECT 
                c.id as clinicId,
                c.name as clinicName,
                r.name as roleName
            FROM ClinicUser cu
            JOIN Clinic c ON cu.clinicId = c.id
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.userId = ?
        `).all(user.id);

        // Group roles by clinic
        const clinicsMap = {};
        clinicRoles.forEach(cr => {
            if (!clinicsMap[cr.clinicId]) {
                clinicsMap[cr.clinicId] = {
                    clinicId: cr.clinicId,
                    clinicName: cr.clinicName,
                    roles: []
                };
            }
            clinicsMap[cr.clinicId].roles.push(cr.roleName);
        });

        const clinics = Object.values(clinicsMap);

        // Check if user is a Super Admin
        const isSuperAdmin = clinicRoles.some(cr => cr.roleName === 'SUPER_ADMIN');

        // Get roles for current clinic from the fresh DB data
        const currentClinicData = clinics.find(c => c.clinicId === decoded.clinicId);
        let currentClinicRoles = currentClinicData ? [...currentClinicData.roles] : [];

        // Ensure SUPER_ADMIN role is preserved if user has it anywhere
        if (isSuperAdmin && !currentClinicRoles.includes('SUPER_ADMIN')) {
            currentClinicRoles.push('SUPER_ADMIN');
        }

        console.log(`[/auth/me] User: ${user.id}, Clinic: ${decoded.clinicId} (${typeof decoded.clinicId}), Roles:`, currentClinicRoles);

        // Generate new JWT with fresh roles to keep backend token in sync with DB
        const refreshedToken = jwt.sign(
            {
                userId: user.id,
                clinicId: decoded.clinicId,
                roles: currentClinicRoles
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update cookie with the refreshed token
        res.cookie('token', refreshedToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        try {
            const fs = await import('fs');
            fs.appendFileSync('auth-debug.log', `\n--- DEBUG ${new Date().toISOString()} ---\n`);
            fs.appendFileSync('auth-debug.log', `User: ${user.id}\n`);
            fs.appendFileSync('auth-debug.log', `Decoded ClinicId: ${decoded.clinicId} (${typeof decoded.clinicId})\n`);
            fs.appendFileSync('auth-debug.log', `Full Clinics Array: ${JSON.stringify(clinics, null, 2)}\n`);
            fs.appendFileSync('auth-debug.log', `Returned Roles: ${JSON.stringify(currentClinicRoles)}\n`);
        } catch (e) { }

        res.json({
            user,
            clinics,
            currentClinic: {
                clinicId: decoded.clinicId,
                roles: currentClinicRoles
            },
            serverTime: new Date().toISOString(),
            requestId: Math.random().toString(36).substring(7)
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Unauthorized' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

/**
 * POST /api/auth/accept-invite
 * Accept an invitation to join a clinic
 * Creates user if doesn't exist, or adds role to existing user
 */
router.post('/accept-invite', async (req, res) => {
    try {
        const { token, password, fullName } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Invitation token is required' });
        }

        // Hash the token to match stored version
        const crypto = await import('crypto');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find invite
        const invite = db.prepare(`
            SELECT i.*, c.name as clinicName, r.name as roleName
            FROM Invite i
            JOIN Clinic c ON i.clinicId = c.id
            JOIN Role r ON i.roleId = r.id
            WHERE i.token = ? AND i.acceptedAt IS NULL
        `).get(hashedToken);

        if (!invite) {
            return res.status(404).json({ message: 'Invalid or already used invitation' });
        }

        // Check if expired
        const now = new Date();
        const expiresAt = new Date(invite.expiresAt);
        if (now > expiresAt) {
            return res.status(400).json({ message: 'Invitation has expired' });
        }

        // Check if user exists
        let user = db.prepare('SELECT * FROM User WHERE email = ?').get(invite.email);

        if (user) {
            // User exists - just add role to clinic
            // Check if user already has this role in this clinic
            const existingRole = db.prepare(`
                SELECT * FROM ClinicUser 
                WHERE userId = ? AND clinicId = ? AND roleId = ?
            `).get(user.id, invite.clinicId, invite.roleId);

            if (existingRole) {
                return res.status(400).json({
                    message: 'You already have this role in this clinic'
                });
            }

            // Add role to clinic
            db.prepare(`
                INSERT INTO ClinicUser (userId, clinicId, roleId)
                VALUES (?, ?, ?)
            `).run(user.id, invite.clinicId, invite.roleId);

        } else {
            // User doesn't exist - create new user
            if (!password || !fullName) {
                return res.status(400).json({
                    message: 'Password and full name are required for new users'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const userInfo = db.prepare(`
                INSERT INTO User (email, password, fullName)
                VALUES (?, ?, ?)
            `).run(invite.email, hashedPassword, fullName);

            const userId = userInfo.lastInsertRowid;

            // Add role to clinic
            db.prepare(`
                INSERT INTO ClinicUser (userId, clinicId, roleId)
                VALUES (?, ?, ?)
            `).run(userId, invite.clinicId, invite.roleId);

            user = {
                id: userId,
                email: invite.email,
                fullName
            };
        }

        // Mark invite as accepted
        db.prepare(`
            UPDATE Invite SET acceptedAt = CURRENT_TIMESTAMP WHERE id = ?
        `).run(invite.id);

        // Generate JWT
        const jwtToken = jwt.sign(
            {
                userId: user.id,
                clinicId: invite.clinicId,
                roles: [invite.roleName]
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie for web
        res.cookie('token', jwtToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Invitation accepted successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            },
            clinic: {
                id: invite.clinicId,
                name: invite.clinicName
            },
            role: invite.roleName,
            token: jwtToken // Also return token for mobile clients
        });
    } catch (error) {
        console.error('Accept invite error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * GET /api/auth/profile
 * Get full profile details including doctor profile if exists
 */
router.get('/profile', async (req, res) => {
    try {
        let token = req.cookies.token;
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, email, fullName, emailVerified, profileImage FROM User WHERE id = ?').get(decoded.userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const doctorProfile = db.prepare('SELECT * FROM DoctorProfile WHERE userId = ?').get(user.id);
        const receptionistProfile = db.prepare('SELECT * FROM ReceptionistProfile WHERE userId = ?').get(user.id);

        res.json({
            user,
            doctorProfile: doctorProfile || null,
            receptionistProfile: receptionistProfile || null
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * POST /api/auth/profile
 * Update user and doctor profile
 */
router.post('/profile', async (req, res) => {
    try {
        let token = req.cookies.token;
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const {
            fullName,
            email,
            specialization,
            subspecialty,
            licenseNumber,
            prcId,
            bio,
            consultationFee,
            clinicHours,
            digitalSignature,
            ptrTaxId,
            ePrescriptionId,
            education,
            experience,
            profileImage,
            dateOfBirth,
            address,
            phone,
            emergencyContactName,
            emergencyContactPhone,
            position,
            yearsOfExperience,
            skills
        } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({ message: 'Full name and email are required' });
        }

        // Start transaction
        const transaction = db.transaction(() => {
            // Update User (including profileImage)
            db.prepare('UPDATE User SET fullName = ?, email = ?, profileImage = ? WHERE id = ?').run(
                fullName, 
                email, 
                profileImage || null, 
                decoded.userId
            );

            // Update or Create Doctor Profile
            const existingProfile = db.prepare('SELECT id FROM DoctorProfile WHERE userId = ?').get(decoded.userId);

            if (existingProfile) {
                db.prepare(`
                    UPDATE DoctorProfile 
                    SET specialization = ?, subspecialty = ?, licenseNumber = ?, prcId = ?,
                        bio = ?, consultationFee = ?, clinicHours = ?,
                        digitalSignature = ?, ptrTaxId = ?, ePrescriptionId = ?,
                        education = ?, experience = ?, updatedAt = CURRENT_TIMESTAMP
                    WHERE userId = ?
                `).run(
                    specialization || null,
                    subspecialty || null,
                    licenseNumber || null,
                    prcId || null,
                    bio || null,
                    consultationFee ? parseFloat(consultationFee) : null,
                    clinicHours || null,
                    digitalSignature || null,
                    ptrTaxId || null,
                    ePrescriptionId || null,
                    education || null,
                    experience ? parseInt(experience) : null,
                    decoded.userId
                );
            } else if (specialization || licenseNumber || bio) {
                db.prepare(`
                    INSERT INTO DoctorProfile (userId, specialization, subspecialty, licenseNumber, prcId, bio, consultationFee, clinicHours, digitalSignature, ptrTaxId, ePrescriptionId, education, experience)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    decoded.userId,
                    specialization || null,
                    subspecialty || null,
                    licenseNumber || null,
                    prcId || null,
                    bio || null,
                    consultationFee ? parseFloat(consultationFee) : null,
                    clinicHours || null,
                    digitalSignature || null,
                    ptrTaxId || null,
                    ePrescriptionId || null,
                    education || null,
                    experience ? parseInt(experience) : null
                );
            }

            // Update or Create Receptionist Profile
            const existingReceptionistProfile = db.prepare('SELECT id FROM ReceptionistProfile WHERE userId = ?').get(decoded.userId);

            if (existingReceptionistProfile) {
                db.prepare(`
                    UPDATE ReceptionistProfile 
                    SET dateOfBirth = ?, address = ?, phone = ?, emergencyContactName = ?, 
                        emergencyContactPhone = ?, position = ?, yearsOfExperience = ?, skills = ?, 
                        updatedAt = CURRENT_TIMESTAMP
                    WHERE userId = ?
                `).run(
                    dateOfBirth || null,
                    address || null,
                    phone || null,
                    emergencyContactName || null,
                    emergencyContactPhone || null,
                    position || null,
                    yearsOfExperience ? parseInt(yearsOfExperience) : null,
                    skills || null,
                    decoded.userId
                );
            } else if (dateOfBirth || address || phone || position) {
                db.prepare(`
                    INSERT INTO ReceptionistProfile (userId, dateOfBirth, address, phone, emergencyContactName, 
                        emergencyContactPhone, position, yearsOfExperience, skills)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    decoded.userId,
                    dateOfBirth || null,
                    address || null,
                    phone || null,
                    emergencyContactName || null,
                    emergencyContactPhone || null,
                    position || null,
                    yearsOfExperience ? parseInt(yearsOfExperience) : null,
                    skills || null
                );
            }
        });

        transaction();

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ message: 'Email already in use or constraint violation' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
