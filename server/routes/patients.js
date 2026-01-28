import express from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

console.log('[DEBUG] patients.js router file loaded');

// Diagnostic route
router.get('/ping', (req, res) => {
    res.json({ message: 'patients router is active', timestamp: new Date().toISOString() });
});

// GET /api/patients - Fetch all patients for the current clinic
router.get('/', requireAuth, async (req, res) => {
    try {
        const patients = db.prepare('SELECT * FROM Patient WHERE clinicId = ? ORDER BY createdAt DESC').all(req.user.clinicId);
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Error fetching patients' });
    }
});

// GET /api/patients/:id/history - Fetch appointment, prescription, and billing history
router.get('/:id/history', requireAuth, async (req, res) => {
    console.log(`[DEBUG] Patient History hit. ID: ${req.params.id}, ClinicID: ${req.user.clinicId}`);
    try {
        const { id } = req.params;
        const patientId = parseInt(id);

        if (isNaN(patientId)) {
            return res.status(400).json({ message: 'Invalid patient ID' });
        }

        // 1. Verify patient belongs to the clinic
        const patient = db.prepare('SELECT * FROM Patient WHERE id = ? AND clinicId = ?').get(patientId, req.user.clinicId);
        if (!patient) {
            console.log(`[DEBUG] Patient not found or unauthorized. ID: ${patientId}, ClinicID: ${req.user.clinicId}`);
            return res.status(404).json({ message: 'Patient not found or unauthorized' });
        }

        // 2. Fetch Appointments
        const appointments = db.prepare(`
            SELECT * FROM Appointment 
            WHERE patientName = ? AND (patientPhone = ? OR patientEmail = ?)
            ORDER BY appointmentDate DESC, appointmentTime DESC
        `).all(patient.fullName, patient.phone, patient.email);

        // 3. Fetch Prescriptions
        const prescriptions = db.prepare(`
            SELECT * FROM Prescription 
            WHERE patientName = ? AND (patientPhone = ? OR patientEmail = ?)
            ORDER BY createdAt DESC
        `).all(patient.fullName, patient.phone, patient.email);

        // 4. Fetch Invoices
        const invoices = db.prepare(`
            SELECT * FROM Invoice 
            WHERE patientName = ? AND (patientPhone = ? OR patientEmail = ?)
            ORDER BY createdAt DESC
        `).all(patient.fullName, patient.phone, patient.email);

        console.log(`[DEBUG] History results: Appts: ${appointments.length}, Presc: ${prescriptions.length}, Invoices: ${invoices.length}`);

        res.json({
            patient,
            appointments: appointments.map(a => ({
                ...a,
                vitalSigns: a.vitalSigns ? JSON.parse(a.vitalSigns) : null
            })),
            prescriptions: prescriptions.map(p => ({
                ...p,
                medicines: p.medicines ? JSON.parse(p.medicines) : []
            })),
            invoices: invoices.map(i => ({
                ...i,
                items: i.items ? JSON.parse(i.items) : []
            }))
        });
    } catch (error) {
        console.error('Error fetching patient history:', error);
        res.status(500).json({ message: 'Error fetching patient history' });
    }
});

// POST /api/patients - Create a new patient
router.post('/', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const {
            fullName,
            dateOfBirth,
            gender,
            phone,
            email,
            address,
            emergencyContactName,
            emergencyContactPhone,
            bloodType,
            allergies,
            medicalHistory
        } = req.body;

        if (!fullName) {
            return res.status(400).json({ message: 'Full name is required' });
        }

        const result = db.prepare(`
            INSERT INTO Patient (
                fullName, dateOfBirth, gender, phone, email, address,
                emergencyContactName, emergencyContactPhone, bloodType,
                allergies, medicalHistory, clinicId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            fullName, dateOfBirth, gender, phone, email, address,
            emergencyContactName, emergencyContactPhone, bloodType,
            allergies, medicalHistory, req.user.clinicId
        );

        res.status(201).json({ id: result.lastInsertRowid, message: 'Patient created successfully' });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ message: 'Error creating patient' });
    }
});

// PATCH /api/patients/:id - Update patient details
router.patch('/:id', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verify patient belongs to the clinic
        const patient = db.prepare('SELECT id FROM Patient WHERE id = ? AND clinicId = ?').get(id, req.user.clinicId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found or unauthorized' });
        }

        const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'clinicId' && key !== 'createdAt');
        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updates[field]);
        values.push(new Date().toISOString()); // updatedAt
        values.push(id);

        db.prepare(`UPDATE Patient SET ${setClause}, updatedAt = ? WHERE id = ?`).run(...values);

        res.json({ message: 'Patient updated successfully' });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ message: 'Error updating patient' });
    }
});

// DELETE /api/patients/:id - Delete a patient
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;

        // Verify patient belongs to the clinic
        const patient = db.prepare('SELECT id FROM Patient WHERE id = ? AND clinicId = ?').get(id, req.user.clinicId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found or unauthorized' });
        }

        db.prepare('DELETE FROM Patient WHERE id = ?').run(id);
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ message: 'Error deleting patient' });
    }
});


export default router;
