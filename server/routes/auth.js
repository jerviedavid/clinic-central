import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

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

        // Create user
        const userInfo = db.prepare(
            'INSERT INTO User (email, password, fullName) VALUES (?, ?, ?)'
        ).run(email, hashedPassword, fullName);

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
        const user = db.prepare('SELECT id, email, fullName FROM User WHERE id = ?').get(decoded.userId);

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

        const currentClinicRoles = [...(decoded.roles || [])];
        if (isSuperAdmin && !currentClinicRoles.includes('SUPER_ADMIN')) {
            currentClinicRoles.push('SUPER_ADMIN');
        }

        res.json({
            user,
            clinics,
            currentClinic: {
                clinicId: decoded.clinicId,
                roles: currentClinicRoles
            }
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
        const user = db.prepare('SELECT id, email, fullName FROM User WHERE id = ?').get(decoded.userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const doctorProfile = db.prepare('SELECT * FROM DoctorProfile WHERE userId = ?').get(user.id);

        res.json({
            user,
            doctorProfile: doctorProfile || null
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
            licenseNumber,
            bio,
            consultationFee,
            clinicHours,
            education,
            experience
        } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({ message: 'Full name and email are required' });
        }

        // Start transaction
        const transaction = db.transaction(() => {
            // Update User
            db.prepare('UPDATE User SET fullName = ?, email = ? WHERE id = ?').run(fullName, email, decoded.userId);

            // Update or Create Doctor Profile
            const existingProfile = db.prepare('SELECT id FROM DoctorProfile WHERE userId = ?').get(decoded.userId);

            if (existingProfile) {
                db.prepare(`
                    UPDATE DoctorProfile 
                    SET specialization = ?, licenseNumber = ?, bio = ?, consultationFee = ?, 
                        clinicHours = ?, education = ?, experience = ?, updatedAt = CURRENT_TIMESTAMP
                    WHERE userId = ?
                `).run(
                    specialization || null,
                    licenseNumber || null,
                    bio || null,
                    consultationFee ? parseFloat(consultationFee) : null,
                    clinicHours || null,
                    education || null,
                    experience ? parseInt(experience) : null,
                    decoded.userId
                );
            } else {
                db.prepare(`
                    INSERT INTO DoctorProfile (userId, specialization, licenseNumber, bio, consultationFee, clinicHours, education, experience)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    decoded.userId,
                    specialization || null,
                    licenseNumber || null,
                    bio || null,
                    consultationFee ? parseFloat(consultationFee) : null,
                    clinicHours || null,
                    education || null,
                    experience ? parseInt(experience) : null
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
