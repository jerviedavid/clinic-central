import express from 'express';
import db from '../db.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all clinics and their staff
router.get('/clinics', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const clinics = db.prepare(`
            SELECT c.*, 
            (SELECT json_group_array(json_object(
                'id', u.id, 
                'fullName', u.fullName, 
                'email', u.email, 
                'role', GROUP_CONCAT(r.name, ', ')
            ))
             FROM ClinicUser cu 
             JOIN User u ON cu.userId = u.id 
             JOIN Role r ON cu.roleId = r.id
             WHERE cu.clinicId = c.id
             GROUP BY u.id) as staff
            FROM Clinic c
        `).all();

        // Parse staff JSON strings
        const formattedClinics = clinics.map(clinic => ({
            ...clinic,
            staff: JSON.parse(clinic.staff)
        }));

        res.json(formattedClinics);
    } catch (error) {
        console.error('Error fetching clinics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update clinic
router.patch('/clinics/:id', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, email } = req.body;

        db.prepare(`
            UPDATE Clinic 
            SET name = COALESCE(?, name),
                address = COALESCE(?, address),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email)
            WHERE id = ?
        `).run(name, address, phone, email, id);

        res.json({ message: 'Clinic updated successfully' });
    } catch (error) {
        console.error('Error updating clinic:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete clinic
router.delete('/clinics/:id', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;

        // Better-sqlite3 handles ON DELETE CASCADE if configured in schema, 
        // but PRISMA-generated SQLite doesn't always have PRAGMA foreign_keys = ON;
        // The server/db.js should handle it.
        db.prepare('DELETE FROM Clinic WHERE id = ?').run(id);

        res.json({ message: 'Clinic removed successfully' });
    } catch (error) {
        console.error('Error deleting clinic:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all users
router.get('/users', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const users = db.prepare(`
            SELECT u.id, u.email, u.fullName, u.createdAt, u.lastLogin,
            (SELECT json_group_array(json_object(
                'clinicId', c.id,
                'clinicName', c.name,
                'role', r.name
            ))
             FROM ClinicUser cu
             JOIN Clinic c ON cu.clinicId = c.id
             JOIN Role r ON cu.roleId = r.id
             WHERE cu.userId = u.id) as associations
            FROM User u
        `).all();

        const formattedUsers = users.map(user => ({
            ...user,
            associations: JSON.parse(user.associations)
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user
router.patch('/users/:id', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email } = req.body;

        db.prepare(`
            UPDATE User
            SET fullName = COALESCE(?, fullName),
                email = COALESCE(?, email)
            WHERE id = ?
        `).run(fullName, email, id);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete user
router.delete('/users/:id', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM User WHERE id = ?').run(id);
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Assign Super Admin role to a user (only Super Admin can do this)
router.post('/make-superadmin', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const { userId } = req.body;
        const superAdminRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('SUPER_ADMIN');

        if (!superAdminRole) {
            return res.status(500).json({ message: 'SUPER_ADMIN role not found' });
        }

        // Technically SUPER_ADMIN doesn't need to be tied to a clinic for system-wide access,
        // but the current schema uses ClinicUser. We'll use a virtual/system clinic id 0 or similar if needed,
        // or just check for existence in ANY clinic with SUPER_ADMIN role.
        // For simplicity, let's just use a dedicated table or a field in User if we want it system-wide.
        // Given the current schema, we'll use clinicId: 0 or a special System clinic.

        let systemClinic = db.prepare('SELECT id FROM Clinic WHERE id = 0').get();
        if (!systemClinic) {
            db.prepare("INSERT INTO Clinic (id, name) VALUES (0, 'System')").run();
        }

        db.prepare(`
            INSERT OR IGNORE INTO ClinicUser (userId, clinicId, roleId)
            VALUES (?, 0, ?)
        `).run(userId, superAdminRole.id);

        res.json({ message: 'User is now a Super Admin' });
    } catch (error) {
        console.error('Error making superadmin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Associate user with a clinic
router.post('/users/:userId/clinics', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const { userId } = req.params;
        const { clinicId, role } = req.body;

        if (!clinicId || !role) {
            return res.status(400).json({ message: 'Clinic ID and role are required' });
        }

        const roleData = db.prepare('SELECT id FROM Role WHERE name = ?').get(role);
        if (!roleData) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        db.prepare(`
            INSERT OR REPLACE INTO ClinicUser (userId, clinicId, roleId)
            VALUES (?, ?, ?)
        `).run(userId, clinicId, roleData.id);

        res.json({ message: 'User associated with clinic successfully' });
    } catch (error) {
        console.error('Error associating user with clinic:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Remove user association with a clinic
router.delete('/users/:userId/clinics/:clinicId', requireAuth, requireSuperAdmin, (req, res) => {
    try {
        const { userId, clinicId } = req.params;

        db.prepare(`
            DELETE FROM ClinicUser 
            WHERE userId = ? AND clinicId = ?
        `).run(userId, clinicId);

        res.json({ message: 'User association removed successfully' });
    } catch (error) {
        console.error('Error removing user association:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
