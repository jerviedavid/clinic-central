import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { requireAuth, requireRole, requireClinicAccess } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST /api/clinics/:clinicId/invite
 * Create an invitation to join a clinic
 * Requires: ADMIN or DOCTOR role
 */
router.post('/:clinicId/invite', requireAuth, requireRole(['ADMIN', 'DOCTOR']), async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { email, role } = req.body;
        console.log('Invite Request Body:', req.body);

        // Validate input
        if (!email || !role) {
            console.error('Validation failed:', { email, role, body: req.body });
            return res.status(400).json({
                message: 'Email and role are required',
                debug: {
                    sentEmail: email,
                    sentRole: role,
                    receivedBody: req.body,
                    contentType: req.headers['content-type']
                }
            });
        }

        // Verify user has access to this clinic
        const userClinic = db.prepare(`
            SELECT * FROM ClinicUser 
            WHERE userId = ? AND clinicId = ?
        `).get(req.user.userId, clinicId);

        if (!userClinic) {
            return res.status(403).json({
                message: 'You do not have access to this clinic'
            });
        }

        // Get clinic info
        const clinic = db.prepare('SELECT * FROM Clinic WHERE id = ?').get(clinicId);
        if (!clinic) {
            return res.status(404).json({ message: 'Clinic not found' });
        }

        // Get role info - handle either roleId or role name
        const roleObj = db.prepare('SELECT * FROM Role WHERE id = ? OR name = ?').get(role, role);
        if (!roleObj) {
            return res.status(404).json({ message: 'Role not found' });
        }
        const finalRoleId = roleObj.id;

        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');

        // Hash token before storing
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Store invite
        const inviteInfo = db.prepare(`
            INSERT INTO Invite (email, clinicId, roleId, token, expiresAt, createdBy)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(email, clinicId, finalRoleId, hashedToken, expiresAt.toISOString(), req.user.userId);

        // Generate invite link
        const inviteLink = `${process.env.VITE_LIVE_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;

        res.status(201).json({
            message: 'Invitation created successfully',
            invite: {
                id: inviteInfo.lastInsertRowid,
                email,
                clinicName: clinic.name,
                roleName: roleObj.name,
                expiresAt,
                inviteLink
            }
        });
    } catch (error) {
        console.error('Create invite error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * POST /api/clinics/:clinicId/add-staff
 * Directly add a staff member (creates user if needed and links to clinic)
 * Requires: ADMIN or DOCTOR role
 */
router.post('/:clinicId/add-staff', requireAuth, requireRole(['ADMIN', 'DOCTOR']), async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { email, role, fullName } = req.body;

        if (!email || !role || !fullName) {
            return res.status(400).json({ message: 'Email, role, and full name are required' });
        }

        // Verify user has access to this clinic
        const userClinic = db.prepare(`
            SELECT * FROM ClinicUser 
            WHERE userId = ? AND clinicId = ?
        `).get(req.user.userId, clinicId);

        if (!userClinic) {
            return res.status(403).json({ message: 'You do not have access to this clinic' });
        }

        // Get role info
        const roleObj = db.prepare('SELECT * FROM Role WHERE name = ?').get(role);
        if (!roleObj) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Check if user already exists
        let user = db.prepare('SELECT * FROM User WHERE email = ?').get(email);
        let password = null;

        if (!user) {
            // Create user with a generated password
            password = crypto.randomBytes(6).toString('hex'); // 12 chars
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const result = db.prepare(`
                INSERT INTO User (email, password, fullName, tempPassword)
                VALUES (?, ?, ?, ?)
            `).run(email, hashedPassword, fullName, password);

            user = { id: result.lastInsertRowid, email, fullName, tempPassword: password };
        } else {
            // Update existing user with tempPassword if we are "re-adding" them with a new role
            // This is optional, but helps if an admin wants to reset/share password again.
            // For now, let's just use what's there.
        }

        // Check if already in this clinic-role
        const existingClinicUser = db.prepare(`
            SELECT * FROM ClinicUser 
            WHERE userId = ? AND clinicId = ? AND roleId = ?
        `).get(user.id, clinicId, roleObj.id);

        if (existingClinicUser) {
            return res.status(400).json({ message: 'Staff member already exists in this clinic with this role' });
        }

        // Link user to clinic
        db.prepare(`
            INSERT INTO ClinicUser (userId, clinicId, roleId)
            VALUES (?, ?, ?)
        `).run(user.id, clinicId, roleObj.id);

        res.status(201).json({
            message: 'Staff member added successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: roleObj.name
            },
            temporaryPassword: password
        });
    } catch (error) {
        console.error('Add staff error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * GET /api/clinics/:clinicId/staff
 * Get all staff members for a clinic
 */
router.get('/:clinicId/staff', requireAuth, requireClinicAccess, requireRole(['ADMIN', 'DOCTOR']), async (req, res) => {
    try {
        const staff = db.prepare(`
            SELECT u.id, u.email, u.fullName, u.tempPassword, 
                   GROUP_CONCAT(r.name, ', ') as roleName
            FROM User u
            JOIN ClinicUser cu ON u.id = cu.userId
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.clinicId = ?
            GROUP BY u.id
        `).all(req.params.clinicId);

        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ message: 'Error fetching staff' });
    }
});

/**
 * PATCH /api/clinics/:clinicId/staff/:userId
 * Update staff member details and role
 */
router.patch('/:clinicId/staff/:userId', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { clinicId, userId } = req.params;
        const { fullName, email, role } = req.body;

        // Start transaction
        db.prepare('BEGIN').run();

        try {
            // Update User details if provided
            if (fullName || email) {
                db.prepare(`
                    UPDATE User 
                    SET fullName = COALESCE(?, fullName),
                        email = COALESCE(?, email)
                    WHERE id = ?
                `).run(fullName, email, userId);
            }

            // Update Role if provided
            if (role) {
                const roleObj = db.prepare('SELECT id FROM Role WHERE name = ?').get(role);
                if (!roleObj) {
                    throw new Error('Role not found');
                }
                db.prepare(`
                    UPDATE ClinicUser 
                    SET roleId = ?
                    WHERE userId = ? AND clinicId = ?
                `).run(roleObj.id, userId, clinicId);
            }

            db.prepare('COMMIT').run();
            res.json({ message: 'Staff member updated successfully' });
        } catch (innerError) {
            db.prepare('ROLLBACK').run();
            throw innerError;
        }
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(error.message === 'Role not found' ? 404 : 500).json({
            message: error.message || 'Internal server error'
        });
    }
});

/**
 * DELETE /api/clinics/:clinicId/staff/:userId
 * Remove a staff member from a clinic
 */
router.delete('/:clinicId/staff/:userId', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { clinicId, userId } = req.params;
        // Just remove from this clinic. The User stays if associated with other clinics.
        db.prepare('DELETE FROM ClinicUser WHERE userId = ? AND clinicId = ?').run(userId, clinicId);
        res.json({ message: 'Staff member removed from clinic' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * POST /api/clinics/:clinicId/staff/:userId/reset-password
 * Reset a staff member's password
 */
router.post('/:clinicId/staff/:userId/reset-password', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists in this clinic
        const clinicUser = db.prepare('SELECT 1 FROM ClinicUser WHERE userId = ? AND clinicId = ?').get(userId, req.params.clinicId);
        if (!clinicUser) {
            return res.status(404).json({ message: 'Staff member not found in this clinic' });
        }

        const newTempPassword = crypto.randomBytes(6).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newTempPassword, salt);

        db.prepare(`
            UPDATE User 
            SET password = ?, 
                tempPassword = ? 
            WHERE id = ?
        `).run(hashedPassword, newTempPassword, userId);

        res.json({
            message: 'Password reset successfully',
            temporaryPassword: newTempPassword
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * POST /api/clinics/switch
 * Switch to a different clinic context
 * Generates new JWT with selected clinic and roles
 */
router.post('/switch', requireAuth, async (req, res) => {
    try {
        const { clinicId } = req.body;

        if (!clinicId) {
            return res.status(400).json({ message: 'Clinic ID is required' });
        }

        // Verify user has access to this clinic
        const clinicRoles = db.prepare(`
            SELECT r.name as roleName
            FROM ClinicUser cu
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.userId = ? AND cu.clinicId = ?
        `).all(req.user.userId, clinicId);

        if (clinicRoles.length === 0) {
            return res.status(403).json({
                message: 'You do not have access to this clinic'
            });
        }

        const roles = clinicRoles.map(cr => cr.roleName);

        // Preserve SUPER_ADMIN role if user has it anywhere
        const allUserRoles = db.prepare(`
            SELECT r.name 
            FROM ClinicUser cu 
            JOIN Role r ON cu.roleId = r.id 
            WHERE cu.userId = ? AND r.name = 'SUPER_ADMIN'
        `).get(req.user.userId);

        if (allUserRoles && !roles.includes('SUPER_ADMIN')) {
            roles.push('SUPER_ADMIN');
        }

        // Get clinic info
        const clinic = db.prepare('SELECT * FROM Clinic WHERE id = ?').get(clinicId);

        // Generate new JWT with selected clinic
        const token = jwt.sign(
            {
                userId: req.user.userId,
                clinicId: clinicId,
                roles: roles
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
            message: 'Clinic switched successfully',
            clinic: {
                id: clinic.id,
                name: clinic.name
            },
            roles,
            token // Also return token for mobile clients
        });
    } catch (error) {
        console.error('Switch clinic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

/**
 * GET /api/clinics/:clinicId
 * Get clinic details
 */
router.get('/:clinicId', requireAuth, requireClinicAccess, async (req, res) => {
    try {
        const clinic = db.prepare('SELECT * FROM Clinic WHERE id = ?').get(req.params.clinicId);
        if (!clinic) return res.status(404).json({ message: 'Clinic not found' });
        res.json(clinic);
    } catch (error) {
        console.error('Error fetching clinic details:', error);
        res.status(500).json({ message: 'Error fetching clinic details' });
    }
});

/**
 * GET /api/clinics/:clinicId/invites
 * Get all invites for a clinic (Admin only)
 */
router.get('/:clinicId/invites', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const invites = db.prepare(`
            SELECT i.*, r.name as roleName 
            FROM Invite i 
            JOIN Role r ON i.roleId = r.id 
            WHERE i.clinicId = ? 
            ORDER BY i.createdAt DESC
        `).all(req.params.clinicId);

        res.json(invites);
    } catch (error) {
        console.error('Error fetching invites:', error);
        res.status(500).json({ message: 'Error fetching invites' });
    }
});

/**
 * PATCH /api/clinics/:clinicId
 * Update clinic details
 * Requires: ADMIN role
 */
router.patch('/:clinicId', requireAuth, requireClinicAccess, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { name, address, phone, email } = req.body;
        console.log(`[PATCH] Clinic ${clinicId} update request:`, req.body);

        db.prepare(`
            UPDATE Clinic 
            SET name = COALESCE(?, name),
                address = COALESCE(?, address),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email)
            WHERE id = ?
        `).run(name, address, phone, email, clinicId);

        res.json({ message: 'Clinic updated successfully' });
    } catch (error) {
        console.error('Error updating clinic:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
