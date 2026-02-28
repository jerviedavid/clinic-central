import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../db.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Signup - Creates user, clinic, and assigns roles
router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

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

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        // Create user, clinic, and assignments in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    fullName,
                    verificationToken,
                    verificationExpires
                }
            });

            // Create clinic
            const clinic = await tx.clinic.create({
                data: {
                    name: `${fullName}'s Clinic`
                }
            });

            // Get role IDs
            const doctorRole = await tx.role.findUnique({ where: { name: 'DOCTOR' } });
            const adminRole = await tx.role.findUnique({ where: { name: 'ADMIN' } });

            // Assign roles
            await tx.clinicUser.createMany({
                data: [
                    { userId: user.id, clinicId: clinic.id, roleId: doctorRole.id },
                    { userId: user.id, clinicId: clinic.id, roleId: adminRole.id }
                ]
            });

            // Create trial subscription
            const starterPlan = await tx.subscriptionPlan.findUnique({ where: { name: 'STARTER' } });
            if (starterPlan) {
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + 14);

                await tx.subscription.create({
                    data: {
                        clinicId: clinic.id,
                        planId: starterPlan.id,
                        status: 'trialing',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: trialEndsAt
                    }
                });
            }

            return { user, clinic };
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, fullName, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        // Send welcome email
        try {
            await sendWelcomeEmail(email, fullName, `${fullName}'s Clinic`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        const token = jwt.sign(
            {
                userId: result.user.id,
                clinicId: result.clinic.id,
                roles: ['DOCTOR', 'ADMIN']
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            user: {
                id: result.user.id,
                email: result.user.email,
                fullName: result.user.fullName
            },
            clinic: {
                id: result.clinic.id,
                name: result.clinic.name
            },
            roles: ['DOCTOR', 'ADMIN'],
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Email verification
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const user = await prisma.user.findFirst({ where: { verificationToken: token } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        const now = new Date();
        if (now > user.verificationExpires) {
            return res.status(400).json({ message: 'Verification token has expired' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationExpires: null
            }
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken, verificationExpires }
        });

        await sendVerificationEmail(user.email, user.fullName, verificationToken);

        res.json({ message: 'Verification email resent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Google OAuth Signup
router.post('/google-signup', async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: 'Google credential is required' });
        }

        const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
        const email = payload.email;
        const fullName = payload.name;

        if (!email || !fullName) {
            return res.status(400).json({ message: 'Invalid Google credential' });
        }

        let existingUser = await prisma.user.findUnique({
            where: { email },
            include: {
                clinics: {
                    include: {
                        clinic: true,
                        role: true
                    }
                }
            }
        });

        if (existingUser) {
            if (existingUser.clinics.length > 0) {
                return res.status(400).json({
                    message: 'Account already exists. Please login instead.',
                    hasClinic: true
                });
            }

            // User exists but no clinic assigned
            const clinic = await prisma.clinic.create({
                data: { name: `${fullName}'s Clinic` }
            });

            const doctorRole = await prisma.role.findUnique({ where: { name: 'DOCTOR' } });
            const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });

            await prisma.clinicUser.createMany({
                data: [
                    { userId: existingUser.id, clinicId: clinic.id, roleId: doctorRole.id },
                    { userId: existingUser.id, clinicId: clinic.id, roleId: adminRole.id }
                ]
            });

            const token = jwt.sign(
                {
                    userId: existingUser.id,
                    clinicId: clinic.id,
                    roles: ['DOCTOR', 'ADMIN']
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
                    id: clinic.id,
                    name: clinic.name
                },
                roles: ['DOCTOR', 'ADMIN'],
                token
            });
        }

        // Create new user with clinic
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
                    fullName,
                    emailVerified: payload.email_verified || true
                }
            });

            const clinic = await tx.clinic.create({
                data: { name: `${fullName}'s Clinic` }
            });

            const doctorRole = await tx.role.findUnique({ where: { name: 'DOCTOR' } });
            const adminRole = await tx.role.findUnique({ where: { name: 'ADMIN' } });

            await tx.clinicUser.createMany({
                data: [
                    { userId: user.id, clinicId: clinic.id, roleId: doctorRole.id },
                    { userId: user.id, clinicId: clinic.id, roleId: adminRole.id }
                ]
            });

            const starterPlan = await tx.subscriptionPlan.findUnique({ where: { name: 'STARTER' } });
            if (starterPlan) {
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + 14);

                await tx.subscription.create({
                    data: {
                        clinicId: clinic.id,
                        planId: starterPlan.id,
                        status: 'trialing',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: trialEndsAt
                    }
                });
            }

            return { user, clinic };
        });

        try {
            await sendWelcomeEmail(email, fullName, result.clinic.name);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        const token = jwt.sign(
            {
                userId: result.user.id,
                clinicId: result.clinic.id,
                roles: ['DOCTOR', 'ADMIN']
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            user: {
                id: result.user.id,
                email: result.user.email,
                fullName: result.user.fullName
            },
            clinic: {
                id: result.clinic.id,
                name: result.clinic.name
            },
            roles: ['DOCTOR', 'ADMIN'],
            token
        });
    } catch (error) {
        console.error('Google signup error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const clinicRoles = await prisma.clinicUser.findMany({
            where: { userId: user.id },
            include: {
                clinic: true,
                role: true
            }
        });

        if (clinicRoles.length === 0) {
            console.error(`User ${user.id} (${user.email}) has no clinic assignments`);
            return res.status(403).json({
                message: 'Your account is not associated with any clinic. Please contact your system administrator.'
            });
        }

        const clinicsMap = {};
        clinicRoles.forEach(cr => {
            if (!clinicsMap[cr.clinicId]) {
                clinicsMap[cr.clinicId] = {
                    clinicId: cr.clinicId,
                    clinicName: cr.clinic.name,
                    roles: []
                };
            }
            clinicsMap[cr.clinicId].roles.push(cr.role.name);
        });

        const clinics = Object.values(clinicsMap);
        const isSuperAdmin = clinicRoles.some(cr => cr.role.name === 'SUPER_ADMIN');
        const defaultClinic = clinics.find(c => c.clinicId !== 0) || clinics[0];

        const tokenRoles = [...defaultClinic.roles];
        if (isSuperAdmin && !tokenRoles.includes('SUPER_ADMIN')) {
            tokenRoles.push('SUPER_ADMIN');
        }

        const token = jwt.sign(
            {
                userId: user.id,
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

        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            },
            clinics,
            selectedClinic: defaultClinic,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        let token = req.cookies.token;

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
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, fullName: true, emailVerified: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const clinicRoles = await prisma.clinicUser.findMany({
            where: { userId: user.id },
            include: {
                clinic: true,
                role: true
            }
        });

        const clinicsMap = {};
        clinicRoles.forEach(cr => {
            if (!clinicsMap[cr.clinicId]) {
                clinicsMap[cr.clinicId] = {
                    clinicId: cr.clinicId,
                    clinicName: cr.clinic.name,
                    roles: []
                };
            }
            clinicsMap[cr.clinicId].roles.push(cr.role.name);
        });

        const clinics = Object.values(clinicsMap);
        const selectedClinic = clinics.find(c => c.clinicId === decoded.clinicId) || clinics[0];

        res.json({
            user,
            clinics,
            selectedClinic
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Unauthorized' });
    }
});

// Switch clinic - omitted for brevity, can be added
// Accept invite - omitted for brevity, can be added
// Profile routes - omitted for brevity, can be added

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

export default router;
