import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../db.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Signup - Now creates clinic and assigns roles automatically
router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;
        if (!email || !password || !fullName) {
            return res.status(400).json({
                message: 'Email, password, and full name are required',
                missingFields: { email: !email, password: !password, fullName: !fullName }
            });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                verificationToken,
                verificationExpires
            }
        });
        const userId = user.id;

        const clinic = await prisma.clinic.create({
            data: { name: `${fullName}'s Clinic` }
        });
        const clinicId = clinic.id;

        const doctorRole = await prisma.role.findFirst({ where: { name: 'DOCTOR' } });
        const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });

        await prisma.clinicUser.create({ data: { userId, clinicId, roleId: doctorRole.id } });
        await prisma.clinicUser.create({ data: { userId, clinicId, roleId: adminRole.id } });

        const starterPlan = await prisma.plan.findFirst({ where: { name: 'STARTER' } });
        if (starterPlan) {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 14);
            await prisma.subscription.create({
                data: { clinicId, planId: starterPlan.id, status: 'trialing', trialEndsAt }
            });
            console.log(`✅ Created 14-day trial subscription for clinic ${clinicId}`);
        }

        try { await sendVerificationEmail(email, fullName, verificationToken); } catch (emailError) { console.error('Failed to send verification email during signup:', emailError); }
        try { await sendWelcomeEmail(email, fullName, `${fullName}'s Clinic`); } catch (emailError) { console.error('Failed to send welcome email during signup:', emailError); }

        const token = jwt.sign({ userId, clinicId, roles: ['DOCTOR', 'ADMIN'] }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.status(201).json({ user: { id: userId, email, fullName }, clinic: { id: clinicId, name: `${fullName}'s Clinic` }, roles: ['DOCTOR', 'ADMIN'], token });
    } catch (error) {
        console.error('Signup error details:', { message: error.message, stack: error.stack, code: error.code });
        res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});

// Verify email
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: 'Token is required' });
        const user = await prisma.user.findFirst({ where: { verificationToken: token } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });
        const now = new Date();
        const expires = new Date(user.verificationExpires);
        if (now > expires) return res.status(400).json({ message: 'Verification token has expired' });
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, verificationToken: null, verificationExpires: null }
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Resend verification
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.emailVerified) return res.status(400).json({ message: 'Email is already verified' });
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
        if (!credential) return res.status(400).json({ message: 'Google credential is required' });
        const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
        const email = payload.email;
        const fullName = payload.name;
        const emailVerified = payload.email_verified;
        if (!email || !fullName) return res.status(400).json({ message: 'Invalid Google credential' });

        let existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            // User exists, log them in
            const clinicUserData = await prisma.clinicUser.findMany({
                where: { userId: existingUser.id },
                include: { clinic: true, role: true }
            });
            const clinicRoles = clinicUserData.map(cu => ({
                clinicId: cu.clinic.id,
                clinicName: cu.clinic.name,
                roleName: cu.role.name
            }));
            if (clinicRoles.length === 0) return res.status(403).json({ message: 'Your account is not associated with any clinic. Please contact your system administrator.' });
            const clinicsMap = {};
            clinicRoles.forEach(cr => {
                if (!clinicsMap[cr.clinicId]) clinicsMap[cr.clinicId] = { clinicId: cr.clinicId, clinicName: cr.clinicName, roles: [] };
                clinicsMap[cr.clinicId].roles.push(cr.roleName);
            });
            const clinics = Object.values(clinicsMap);
            const defaultClinic = clinics.find(c => c.clinicId !== 0) || clinics[0];
            const isSuperAdmin = clinicRoles.some(cr => cr.roleName === 'SUPER_ADMIN');
            const tokenRoles = [...defaultClinic.roles];
            if (isSuperAdmin && !tokenRoles.includes('SUPER_ADMIN')) tokenRoles.push('SUPER_ADMIN');
            const token = jwt.sign({ userId: existingUser.id, clinicId: defaultClinic.clinicId, roles: tokenRoles }, JWT_SECRET, { expiresIn: '7d' });
            res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.json({ user: { id: existingUser.id, email: existingUser.email, fullName: existingUser.fullName }, clinic: { id: defaultClinic.clinicId, name: defaultClinic.clinicName }, roles: tokenRoles, token });
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: { email, password: '', fullName, emailVerified: emailVerified ? true : false }
        });
        const userId = newUser.id;
        const clinic = await prisma.clinic.create({ data: { name: `${fullName}'s Clinic` } });
        const clinicId = clinic.id;
        const doctorRole = await prisma.role.findFirst({ where: { name: 'DOCTOR' } });
        const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
        await prisma.clinicUser.create({ data: { userId, clinicId, roleId: doctorRole.id } });
        await prisma.clinicUser.create({ data: { userId, clinicId, roleId: adminRole.id } });
        const starterPlan = await prisma.plan.findFirst({ where: { name: 'STARTER' } });
        if (starterPlan) {
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 14);
            await prisma.subscription.create({
                data: { clinicId, planId: starterPlan.id, status: 'trialing', trialEndsAt }
            });
        }
        const user = { id: userId, email, fullName };
        const token = jwt.sign({ userId: user.id, clinicId, roles: ['DOCTOR', 'ADMIN'] }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.status(201).json({ user, clinic: { id: clinicId, name: `${fullName}'s Clinic` }, roles: ['DOCTOR', 'ADMIN'], token });
    } catch (error) {
        console.error('Google signup error details:', { message: error.message, stack: error.stack, code: error.code });
        res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
        const clinicUserData = await prisma.clinicUser.findMany({
            where: { userId: user.id },
            include: { clinic: true, role: true }
        });
        const clinicRoles = clinicUserData.map(cu => ({
            clinicId: cu.clinic.id,
            clinicName: cu.clinic.name,
            roleName: cu.role.name
        }));
        if (clinicRoles.length === 0) {
            console.error(`Login failed: User ${user.id} (${user.email}) has no clinic assignments.`);
            return res.status(403).json({ message: 'Your account is not associated with any clinic. Please contact your system administrator or sign up again.' });
        }
        const clinicsMap = {};
        clinicRoles.forEach(cr => {
            if (!clinicsMap[cr.clinicId]) clinicsMap[cr.clinicId] = { clinicId: cr.clinicId, clinicName: cr.clinicName, roles: [] };
            clinicsMap[cr.clinicId].roles.push(cr.roleName);
        });
        const clinics = Object.values(clinicsMap);
        const isSuperAdmin = clinicRoles.some(cr => cr.roleName === 'SUPER_ADMIN');
        const defaultClinic = clinics.find(c => c.clinicId !== 0) || clinics[0];
        const tokenRoles = [...defaultClinic.roles];
        if (isSuperAdmin && !tokenRoles.includes('SUPER_ADMIN')) tokenRoles.push('SUPER_ADMIN');
        const token = jwt.sign({ userId: user.id, clinicId: defaultClinic.clinicId, roles: tokenRoles }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ user: { id: user.id, email: user.email, fullName: user.fullName }, clinics, selectedClinic: defaultClinic, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user - /me
router.get('/me', async (req, res) => {
    try {
        let token = req.cookies.token;
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
        }
        if (!token) return res.status(401).json({ message: 'Unauthorized' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, fullName: true, emailVerified: true }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const clinicUserData = await prisma.clinicUser.findMany({
            where: { userId: user.id },
            include: { clinic: true, role: true }
        });
        const clinicRoles = clinicUserData.map(cu => ({
            clinicId: cu.clinic.id,
            clinicName: cu.clinic.name,
            roleName: cu.role.name
        }));
        const clinicsMap = {};
        clinicRoles.forEach(cr => {
            if (!clinicsMap[cr.clinicId]) clinicsMap[cr.clinicId] = { clinicId: cr.clinicId, clinicName: cr.clinicName, roles: [] };
            clinicsMap[cr.clinicId].roles.push(cr.roleName);
        });
        const clinics = Object.values(clinicsMap);
        const isSuperAdmin = clinicRoles.some(cr => cr.roleName === 'SUPER_ADMIN');
        const currentClinicData = clinics.find(c => c.clinicId === decoded.clinicId);
        let currentClinicRoles = currentClinicData ? [...currentClinicData.roles] : [];
        if (isSuperAdmin && !currentClinicRoles.includes('SUPER_ADMIN')) currentClinicRoles.push('SUPER_ADMIN');
        console.log(`[/auth/me] User: ${user.id}, Clinic: ${decoded.clinicId} (${typeof decoded.clinicId}), Roles:`, currentClinicRoles);
        const refreshedToken = jwt.sign({ userId: user.id, clinicId: decoded.clinicId, roles: currentClinicRoles }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', refreshedToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        try {
            const fs = await import('fs');
            fs.appendFileSync('auth-debug.log', `\n--- DEBUG ${new Date().toISOString()} ---\n`);
            fs.appendFileSync('auth-debug.log', `User: ${user.id}\nDecoded ClinicId: ${decoded.clinicId} (${typeof decoded.clinicId})\nFull Clinics Array: ${JSON.stringify(clinics, null, 2)}\nReturned Roles: ${JSON.stringify(currentClinicRoles)}\n`);
        } catch (e) { }
        res.json({ user, clinics, currentClinic: { clinicId: decoded.clinicId, roles: currentClinicRoles }, serverTime: new Date().toISOString(), requestId: Math.random().toString(36).substring(7) });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Unauthorized' });
    }
});

// Logout
router.post('/logout', (req, res) => { res.clearCookie('token'); res.json({ message: 'Logged out' }); });

// Accept invite
router.post('/accept-invite', async (req, res) => {
    try {
        const { token, password, fullName } = req.body;
        if (!token) return res.status(400).json({ message: 'Invitation token is required' });
        const cryptoMod = await import('crypto');
        const hashedToken = cryptoMod.createHash('sha256').update(token).digest('hex');

        const invite = await prisma.invite.findFirst({
            where: { token: hashedToken, acceptedAt: null },
            include: { clinic: true, role: true }
        });
        if (!invite) return res.status(404).json({ message: 'Invalid or already used invitation' });
        const now = new Date();
        const expiresAt = new Date(invite.expiresAt);
        if (now > expiresAt) return res.status(400).json({ message: 'Invitation has expired' });

        let user = await prisma.user.findUnique({ where: { email: invite.email } });
        if (user) {
            const existingRole = await prisma.clinicUser.findFirst({
                where: { userId: user.id, clinicId: invite.clinicId, roleId: invite.roleId }
            });
            if (existingRole) return res.status(400).json({ message: 'You already have this role in this clinic' });
            await prisma.clinicUser.create({ data: { userId: user.id, clinicId: invite.clinicId, roleId: invite.roleId } });
        } else {
            if (!password || !fullName) return res.status(400).json({ message: 'Password and full name are required for new users' });
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.create({
                data: { email: invite.email, password: hashedPassword, fullName }
            });
            await prisma.clinicUser.create({ data: { userId: user.id, clinicId: invite.clinicId, roleId: invite.roleId } });
        }
        await prisma.invite.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() }
        });
        const jwtToken = jwt.sign({ userId: user.id, clinicId: invite.clinicId, roles: [invite.role.name] }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', jwtToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ message: 'Invitation accepted successfully', user: { id: user.id, email: user.email, fullName: user.fullName }, clinic: { id: invite.clinicId, name: invite.clinic.name }, role: invite.role.name, token: jwtToken });
    } catch (error) {
        console.error('Accept invite error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get profile
router.get('/profile', async (req, res) => {
    try {
        let token = req.cookies.token;
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
        }
        if (!token) return res.status(401).json({ message: 'Unauthorized' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, fullName: true, emailVerified: true, profileImage: true }
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: decoded.userId } });
        const receptionistProfile = await prisma.receptionistProfile.findUnique({ where: { userId: decoded.userId } });
        res.json({ user, doctorProfile: doctorProfile || null, receptionistProfile: receptionistProfile || null });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update profile
router.post('/profile', async (req, res) => {
    try {
        let token = req.cookies.token;
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
        }
        if (!token) return res.status(401).json({ message: 'Unauthorized' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const { fullName, email, specialization, subspecialty, licenseNumber, prcId, bio, consultationFee, clinicHours, digitalSignature, ptrTaxId, ePrescriptionId, education, experience, profileImage, dateOfBirth, address, phone, emergencyContactName, emergencyContactPhone, position, yearsOfExperience, skills } = req.body;
        if (!fullName || !email) return res.status(400).json({ message: 'Full name and email are required' });

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: decoded.userId },
                data: { fullName, email, profileImage: profileImage || null }
            });

            // Doctor profile
            const existingDoctorProfile = await tx.doctorProfile.findUnique({ where: { userId: decoded.userId } });
            if (existingDoctorProfile) {
                await tx.doctorProfile.update({
                    where: { userId: decoded.userId },
                    data: {
                        specialization: specialization || null, subspecialty: subspecialty || null,
                        licenseNumber: licenseNumber || null, prcId: prcId || null,
                        bio: bio || null, consultationFee: consultationFee ? parseFloat(consultationFee) : null,
                        clinicHours: clinicHours || null, digitalSignature: digitalSignature || null,
                        ptrTaxId: ptrTaxId || null, ePrescriptionId: ePrescriptionId || null,
                        education: education || null, experience: experience ? parseInt(experience) : null
                    }
                });
            } else if (specialization || licenseNumber || bio) {
                await tx.doctorProfile.create({
                    data: {
                        userId: decoded.userId, specialization: specialization || null, subspecialty: subspecialty || null,
                        licenseNumber: licenseNumber || null, prcId: prcId || null, bio: bio || null,
                        consultationFee: consultationFee ? parseFloat(consultationFee) : null,
                        clinicHours: clinicHours || null, digitalSignature: digitalSignature || null,
                        ptrTaxId: ptrTaxId || null, ePrescriptionId: ePrescriptionId || null,
                        education: education || null, experience: experience ? parseInt(experience) : null
                    }
                });
            }

            // Receptionist profile
            const existingReceptionistProfile = await tx.receptionistProfile.findUnique({ where: { userId: decoded.userId } });
            if (existingReceptionistProfile) {
                await tx.receptionistProfile.update({
                    where: { userId: decoded.userId },
                    data: {
                        dateOfBirth: dateOfBirth || null, address: address || null, phone: phone || null,
                        emergencyContactName: emergencyContactName || null, emergencyContactPhone: emergencyContactPhone || null,
                        position: position || null, yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
                        skills: skills || null
                    }
                });
            } else if (dateOfBirth || address || phone || position) {
                await tx.receptionistProfile.create({
                    data: {
                        userId: decoded.userId, dateOfBirth: dateOfBirth || null, address: address || null,
                        phone: phone || null, emergencyContactName: emergencyContactName || null,
                        emergencyContactPhone: emergencyContactPhone || null, position: position || null,
                        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null, skills: skills || null
                    }
                });
            }
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Email already in use or constraint violation' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
