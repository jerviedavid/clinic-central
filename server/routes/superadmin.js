import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /clinics - complex query with nested JSON
router.get('/clinics', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        // Use Prisma includes instead of SQLite json_group_array
        const clinics = await prisma.clinic.findMany({
            include: {
                users: {
                    include: {
                        user: { select: { id: true, fullName: true, email: true } },
                        role: { select: { name: true } }
                    }
                }
            }
        });
        // Format to match original response: each clinic has a `staff` array
        const formattedClinics = clinics.map(clinic => {
            const staffMap = {};
            clinic.users.forEach(cu => {
                if (cu.role.name === 'SUPER_ADMIN') return; // exclude SUPER_ADMIN
                if (!staffMap[cu.userId]) {
                    staffMap[cu.userId] = { id: cu.user.id, fullName: cu.user.fullName, email: cu.user.email, role: '' };
                    staffMap[cu.userId]._roles = [];
                }
                staffMap[cu.userId]._roles.push(cu.role.name);
            });
            const staff = Object.values(staffMap).map(s => {
                const { _roles, ...rest } = s;
                return { ...rest, role: _roles.join(', ') };
            });
            const { users, ...clinicData } = clinic;
            return { ...clinicData, staff };
        });
        res.json(formattedClinics);
    } catch (error) {
        console.error('Error fetching clinics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PATCH /clinics/:id
router.patch('/clinics/:id', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, email } = req.body;
        const data = {};
        if (name !== undefined) data.name = name;
        if (address !== undefined) data.address = address;
        if (phone !== undefined) data.phone = phone;
        if (email !== undefined) data.email = email;
        await prisma.clinic.update({ where: { id: parseInt(id) }, data });
        res.json({ message: 'Clinic updated successfully' });
    } catch (error) {
        console.error('Error updating clinic:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /clinics/:id
router.delete('/clinics/:id', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.clinic.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Clinic removed successfully' });
    } catch (error) {
        console.error('Error deleting clinic:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /users - complex query with associations
router.get('/users', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        // Use Prisma includes instead of nested subqueries
        const users = await prisma.user.findMany({
            select: {
                id: true, email: true, fullName: true, emailVerified: true, createdAt: true, lastLogin: true,
                clinics: {
                    include: {
                        clinic: {
                            include: { subscription: { include: { plan: true } } }
                        },
                        role: { select: { name: true } }
                    }
                }
            }
        });
        // Format to match original response shape
        const formattedUsers = users.map(user => {
            const clinicMap = {};
            user.clinics.forEach(cu => {
                if (cu.role.name === 'SUPER_ADMIN') return;
                if (!clinicMap[cu.clinicId]) {
                    const sub = cu.clinic.subscription;
                    clinicMap[cu.clinicId] = {
                        clinicId: cu.clinic.id,
                        clinicName: cu.clinic.name,
                        role: '',
                        planId: sub?.planId || null,
                        planName: sub?.plan?.name || null,
                        subscriptionStatus: sub?.status || null,
                        priceMonthly: sub?.plan?.priceMonthly || null
                    };
                    clinicMap[cu.clinicId]._roles = [];
                }
                clinicMap[cu.clinicId]._roles.push(cu.role.name);
            });
            const associations = Object.values(clinicMap).map(a => {
                const { _roles, ...rest } = a;
                return { ...rest, role: _roles.join(', ') };
            });
            const { clinics, ...userData } = user;
            return { ...userData, associations };
        });
        res.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PATCH /users/:id
router.patch('/users/:id', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email } = req.body;
        const data = {};
        if (fullName) data.fullName = fullName;
        if (email) data.email = email;
        await prisma.user.update({ where: { id: parseInt(id) }, data });
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /users/:id/verify-email
router.post('/users/:id/verify-email', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { emailVerified: true } });
        res.json({ message: 'User email verified successfully' });
    } catch (error) {
        console.error('Error verifying user email:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /users/:id
router.delete('/users/:id', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /make-superadmin
router.post('/make-superadmin', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
        if (!superAdminRole) return res.status(500).json({ message: 'SUPER_ADMIN role not found' });
        
        // Ensure System clinic exists (id: 0 is tricky for autoincrement, use upsert or findFirst)
        let systemClinic = await prisma.clinic.findFirst({ where: { name: 'System' } });
        if (!systemClinic) {
            systemClinic = await prisma.clinic.create({ data: { name: 'System' } });
        }
        
        try {
            await prisma.clinicUser.create({ data: { userId: parseInt(userId), clinicId: systemClinic.id, roleId: superAdminRole.id } });
        } catch (e) {
            if (e.code !== 'P2002') throw e; // ignore if already exists
        }
        res.json({ message: 'User is now a Super Admin' });
    } catch (error) {
        console.error('Error making superadmin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /users/:userId/clinics
router.post('/users/:userId/clinics', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { clinicId, role } = req.body;
        if (!clinicId || !role) return res.status(400).json({ message: 'Clinic ID and role are required' });
        const roleData = await prisma.role.findUnique({ where: { name: role } });
        if (!roleData) return res.status(400).json({ message: 'Invalid role' });
        // Upsert to handle INSERT OR REPLACE
        await prisma.clinicUser.upsert({
            where: { userId_clinicId_roleId: { userId: parseInt(userId), clinicId: parseInt(clinicId), roleId: roleData.id } },
            create: { userId: parseInt(userId), clinicId: parseInt(clinicId), roleId: roleData.id },
            update: {} // no-op
        });
        res.json({ message: 'User associated with clinic successfully' });
    } catch (error) {
        console.error('Error associating user with clinic:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /users/:userId/clinics/:clinicId
router.delete('/users/:userId/clinics/:clinicId', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { userId, clinicId } = req.params;
        await prisma.clinicUser.deleteMany({ where: { userId: parseInt(userId), clinicId: parseInt(clinicId) } });
        res.json({ message: 'User association removed successfully' });
    } catch (error) {
        console.error('Error removing user association:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /plans
router.get('/plans', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } });
        const formattedPlans = plans.map(plan => ({
            ...plan,
            features: plan.features ? JSON.parse(plan.features) : []
        }));
        res.json(formattedPlans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PATCH /clinics/:clinicId/subscription
router.patch('/clinics/:clinicId/subscription', requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { planId } = req.body;
        if (!planId) return res.status(400).json({ message: 'Plan ID is required' });
        const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        // Upsert subscription (clinicId is unique)
        await prisma.subscription.upsert({
            where: { clinicId: parseInt(clinicId) },
            create: { clinicId: parseInt(clinicId), planId: parseInt(planId), status: 'active' },
            update: { planId: parseInt(planId), status: 'active' }
        });
        res.json({ message: 'Subscription plan updated successfully' });
    } catch (error) {
        console.error('Error updating subscription plan:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
