import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { requireAuth, requireRole, requireClinicAccess } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /:clinicId/invite
router.post('/:clinicId/invite', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { email, role } = req.body;
        console.log('Invite Request Body:', req.body);
        if (!email || !role) {
            console.error('Validation failed:', { email, role, body: req.body });
            return res.status(400).json({ message: 'Email and role are required', debug: { sentEmail: email, sentRole: role, receivedBody: req.body, contentType: req.headers['content-type'] } });
        }

        const userClinic = await prisma.clinicUser.findFirst({
            where: { userId: req.user.userId, clinicId: parseInt(clinicId) }
        });
        if (!userClinic) return res.status(403).json({ message: 'You do not have access to this clinic' });

        const clinic = await prisma.clinic.findUnique({ where: { id: parseInt(clinicId) } });
        if (!clinic) return res.status(404).json({ message: 'Clinic not found' });

        let roleObj;
        if (!isNaN(parseInt(role))) {
            roleObj = await prisma.role.findUnique({ where: { id: parseInt(role) } });
        }
        if (!roleObj) {
            roleObj = await prisma.role.findUnique({ where: { name: role } });
        }
        if (!roleObj) return res.status(404).json({ message: 'Role not found' });

        const finalRoleId = roleObj.id;
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invite = await prisma.invite.create({
            data: {
                email,
                clinicId: parseInt(clinicId),
                roleId: finalRoleId,
                token: hashedToken,
                expiresAt,
                createdBy: req.user.userId
            }
        });

        const inviteLink = `${process.env.VITE_LIVE_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;
        res.status(201).json({ message: 'Invitation created successfully', invite: { id: invite.id, email, clinicName: clinic.name, roleName: roleObj.name, expiresAt, inviteLink } });
    } catch (error) {
        console.error('Create invite error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /:clinicId/add-staff
router.post('/:clinicId/add-staff', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { email, role, fullName, alsoMakeAdmin } = req.body;
        if (!email || !role || !fullName) return res.status(400).json({ message: 'Email, role, and full name are required' });

        const userClinic = await prisma.clinicUser.findFirst({
            where: { userId: req.user.userId, clinicId: parseInt(clinicId) }
        });
        if (!userClinic) return res.status(403).json({ message: 'You do not have access to this clinic' });

        const roleObj = await prisma.role.findUnique({ where: { name: role } });
        if (!roleObj) return res.status(404).json({ message: 'Role not found' });

        let user = await prisma.user.findUnique({ where: { email } });
        let password = null;
        if (!user) {
            password = crypto.randomBytes(6).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user = await prisma.user.create({
                data: { email, password: hashedPassword, fullName, tempPassword: password }
            });
        }

        const existingClinicUser = await prisma.clinicUser.findFirst({
            where: { userId: user.id, clinicId: parseInt(clinicId), roleId: roleObj.id }
        });
        if (existingClinicUser) return res.status(400).json({ message: 'Staff member already exists in this clinic with this role' });

        await prisma.clinicUser.create({
            data: { userId: user.id, clinicId: parseInt(clinicId), roleId: roleObj.id }
        });

        if (alsoMakeAdmin && role !== 'ADMIN') {
            const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
            if (adminRole) {
                const existingAdmin = await prisma.clinicUser.findFirst({
                    where: { userId: user.id, clinicId: parseInt(clinicId), roleId: adminRole.id }
                });
                if (!existingAdmin) {
                    await prisma.clinicUser.create({
                        data: { userId: user.id, clinicId: parseInt(clinicId), roleId: adminRole.id }
                    });
                }
            }
        }

        res.status(201).json({ message: 'Staff member added successfully', user: { id: user.id, email: user.email, fullName: user.fullName, role: roleObj.name }, temporaryPassword: password });
    } catch (error) {
        console.error('Add staff error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /:clinicId/staff - uses GROUP_CONCAT equivalent via JS grouping
router.get('/:clinicId/staff', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const clinicUsers = await prisma.clinicUser.findMany({
            where: { clinicId: parseInt(req.params.clinicId) },
            include: {
                user: { select: { id: true, email: true, fullName: true, tempPassword: true, profileImage: true } },
                role: { select: { name: true } }
            }
        });

        const staffMap = {};
        clinicUsers.forEach(cu => {
            if (!staffMap[cu.userId]) {
                staffMap[cu.userId] = { ...cu.user, roleName: '' };
                staffMap[cu.userId]._roles = [];
            }
            staffMap[cu.userId]._roles.push(cu.role.name);
        });
        const staff = Object.values(staffMap).map(s => {
            const { _roles, ...rest } = s;
            return { ...rest, roleName: _roles.join(', ') };
        });

        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ message: 'Error fetching staff' });
    }
});

// PATCH /:clinicId/staff/:userId - uses prisma.$transaction with upsert-like logic
router.patch('/:clinicId/staff/:userId', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const clinicId = parseInt(req.params.clinicId);
        const userId = parseInt(req.params.userId);
        const { fullName, email, role, alsoMakeAdmin, profileImage } = req.body;
        console.log(`[UPDATE STAFF] Clinic: ${clinicId}, User: ${userId}`, { fullName, email, role, alsoMakeAdmin, hasProfileImage: !!profileImage });

        await prisma.$transaction(async (tx) => {
            // Update user details
            if (fullName || email || profileImage !== undefined) {
                const data = {};
                if (fullName) data.fullName = fullName;
                if (email) data.email = email;
                data.profileImage = profileImage;
                await tx.user.update({ where: { id: userId }, data });
            }

            const adminRoleObj = await tx.role.findUnique({ where: { name: 'ADMIN' } });

            if (role) {
                // Find the new role
                let newRoleObj;
                if (!isNaN(parseInt(role))) {
                    newRoleObj = await tx.role.findUnique({ where: { id: parseInt(role) } });
                }
                if (!newRoleObj) {
                    newRoleObj = await tx.role.findUnique({ where: { name: role } });
                }
                if (!newRoleObj) throw new Error('Role not found');

                if (newRoleObj.name !== 'ADMIN') {
                    // Delete existing primary roles
                    await tx.clinicUser.deleteMany({
                        where: { userId, clinicId, role: { name: { in: ['DOCTOR', 'RECEPTIONIST'] } } }
                    });
                    // Insert new role (catch unique constraint violation to mimic INSERT OR IGNORE)
                    try {
                        await tx.clinicUser.create({ data: { userId, clinicId, roleId: newRoleObj.id } });
                    } catch (e) {
                        if (e.code !== 'P2002') throw e;
                    }
                } else {
                    try {
                        await tx.clinicUser.create({ data: { userId, clinicId, roleId: newRoleObj.id } });
                    } catch (e) {
                        if (e.code !== 'P2002') throw e;
                    }
                }
            }

            // Handle alsoMakeAdmin toggle
            if (typeof alsoMakeAdmin !== 'undefined' && adminRoleObj) {
                if (alsoMakeAdmin) {
                    try {
                        await tx.clinicUser.create({ data: { userId, clinicId, roleId: adminRoleObj.id } });
                    } catch (e) {
                        if (e.code !== 'P2002') throw e;
                    }
                } else {
                    await tx.clinicUser.deleteMany({ where: { userId, clinicId, roleId: adminRoleObj.id } });
                }
            }
        });

        res.json({ message: 'Staff member updated successfully' });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(error.message === 'Role not found' ? 404 : 500).json({ message: error.message || 'Internal server error' });
    }
});

// DELETE /:clinicId/staff/:userId
router.delete('/:clinicId/staff/:userId', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { clinicId, userId } = req.params;
        await prisma.clinicUser.deleteMany({
            where: { userId: parseInt(userId), clinicId: parseInt(clinicId) }
        });
        res.json({ message: 'Staff member removed from clinic' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /:clinicId/staff/:userId/reset-password
router.post('/:clinicId/staff/:userId/reset-password', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { userId } = req.params;

        const clinicUser = await prisma.clinicUser.findFirst({
            where: { userId: parseInt(userId), clinicId: parseInt(req.params.clinicId) }
        });
        if (!clinicUser) return res.status(404).json({ message: 'Staff member not found in this clinic' });

        const newTempPassword = crypto.randomBytes(6).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newTempPassword, salt);

        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { password: hashedPassword, tempPassword: newTempPassword }
        });

        res.json({ message: 'Password reset successfully', temporaryPassword: newTempPassword });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /switch - switch clinic context
router.post('/switch', requireAuth, async (req, res) => {
    try {
        const { clinicId } = req.body;
        if (!clinicId) return res.status(400).json({ message: 'Clinic ID is required' });

        const clinicRoles = await prisma.clinicUser.findMany({
            where: { userId: req.user.userId, clinicId: parseInt(clinicId) },
            include: { role: { select: { name: true } } }
        });
        if (clinicRoles.length === 0) return res.status(403).json({ message: 'You do not have access to this clinic' });

        const roles = clinicRoles.map(cr => cr.role.name);

        const superAdminRole = await prisma.clinicUser.findFirst({
            where: { userId: req.user.userId, role: { name: 'SUPER_ADMIN' } }
        });
        if (superAdminRole && !roles.includes('SUPER_ADMIN')) roles.push('SUPER_ADMIN');

        const clinic = await prisma.clinic.findUnique({ where: { id: parseInt(clinicId) } });

        const token = jwt.sign({ userId: req.user.userId, clinicId: parseInt(clinicId), roles }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ message: 'Clinic switched successfully', clinic: { id: clinic.id, name: clinic.name }, roles, token });
    } catch (error) {
        console.error('Switch clinic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /:clinicId
router.get('/:clinicId', requireAuth, requireClinicAccess, async (req, res) => {
    try {
        const clinic = await prisma.clinic.findUnique({ where: { id: parseInt(req.params.clinicId) } });
        if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
        res.json(clinic);
    } catch (error) {
        console.error('Error fetching clinic details:', error);
        res.status(500).json({ message: 'Error fetching clinic details' });
    }
});

// GET /:clinicId/invites
router.get('/:clinicId/invites', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const invites = await prisma.invite.findMany({
            where: { clinicId: parseInt(req.params.clinicId) },
            include: { role: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        const result = invites.map(inv => {
            const { role, ...rest } = inv;
            return { ...rest, roleName: role.name };
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching invites:', error);
        res.status(500).json({ message: 'Error fetching invites' });
    }
});

// PATCH /:clinicId - update clinic
router.patch('/:clinicId', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { name, address, phone, email } = req.body;
        console.log(`[PATCH] Clinic ${clinicId} update request:`, req.body);
        const data = {};
        if (name !== undefined) data.name = name;
        if (address !== undefined) data.address = address;
        if (phone !== undefined) data.phone = phone;
        if (email !== undefined) data.email = email;
        await prisma.clinic.update({ where: { id: parseInt(clinicId) }, data });
        res.json({ message: 'Clinic updated successfully' });
    } catch (error) {
        console.error('Error updating clinic:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
