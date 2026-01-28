import express from 'express';
import db from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Doctors - Clinic-aware
router.get('/doctors', requireAuth, async (req, res) => {
    try {
        const doctors = db.prepare(`
            SELECT u.id, u.fullName, u.email, r.name as role
            FROM User u
            JOIN ClinicUser cu ON u.id = cu.userId
            JOIN Role r ON cu.roleId = r.id
            WHERE cu.clinicId = ? AND r.name = 'DOCTOR'
        `).all(req.user.clinicId);
        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Error fetching doctors' });
    }
});

// Appointments - Requires authentication
router.get('/appointments', requireAuth, async (req, res) => {
    try {
        const appointments = db.prepare('SELECT * FROM Appointment ORDER BY createdAt DESC').all();
        res.json(appointments.map(a => ({
            ...a,
            vitalSigns: a.vitalSigns ? JSON.parse(a.vitalSigns) : {
                bloodPressure: '',
                heartRate: '',
                temperature: '',
                weight: ''
            }
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments' });
    }
});

router.get('/appointments/:id', requireAuth, async (req, res) => {
    try {
        const appointment = db.prepare('SELECT * FROM Appointment WHERE id = ?').get(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        res.json({
            ...appointment,
            vitalSigns: appointment.vitalSigns ? JSON.parse(appointment.vitalSigns) : {
                bloodPressure: '',
                heartRate: '',
                temperature: '',
                weight: ''
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointment' });
    }
});

// Any authenticated user can create appointments
router.post('/appointments', requireAuth, async (req, res) => {
    try {
        const {
            patientName, patientPhone, patientEmail, patientAge, patientGender,
            doctorName, appointmentDate, appointmentTime, appointmentType,
            status, tokenNumber, notes, symptoms, medicalHistory, medications, vitalSigns
        } = req.body;

        const info = db.prepare(
            `INSERT INTO Appointment (
                patientName, patientPhone, patientEmail, patientAge, patientGender,
                doctorName, appointmentDate, appointmentTime, appointmentType,
                status, tokenNumber, notes, symptoms, medicalHistory, medications, vitalSigns
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            patientName, patientPhone, patientEmail, patientAge, patientGender,
            doctorName, appointmentDate, appointmentTime, appointmentType,
            status, tokenNumber, notes, symptoms, medicalHistory, medications,
            vitalSigns ? JSON.stringify(vitalSigns) : null
        );

        res.status(201).json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Error creating appointment' });
    }
});

// Any authenticated user can update appointments
router.patch('/appointments/:id', requireAuth, async (req, res) => {
    try {
        const {
            patientName, patientPhone, patientEmail, patientAge, patientGender,
            doctorName, appointmentDate, appointmentTime, appointmentType,
            status, tokenNumber, notes, symptoms, medicalHistory, medications, vitalSigns
        } = req.body;

        db.prepare(`
            UPDATE Appointment SET 
                patientName = COALESCE(?, patientName),
                patientPhone = COALESCE(?, patientPhone),
                patientEmail = COALESCE(?, patientEmail),
                patientAge = COALESCE(?, patientAge),
                patientGender = COALESCE(?, patientGender),
                doctorName = COALESCE(?, doctorName),
                appointmentDate = COALESCE(?, appointmentDate),
                appointmentTime = COALESCE(?, appointmentTime),
                appointmentType = COALESCE(?, appointmentType),
                status = COALESCE(?, status),
                tokenNumber = COALESCE(?, tokenNumber),
                notes = COALESCE(?, notes),
                symptoms = COALESCE(?, symptoms),
                medicalHistory = COALESCE(?, medicalHistory),
                medications = COALESCE(?, medications),
                vitalSigns = COALESCE(?, vitalSigns),
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            patientName, patientPhone, patientEmail, patientAge, patientGender,
            doctorName, appointmentDate, appointmentTime, appointmentType,
            status, tokenNumber, notes, symptoms, medicalHistory, medications,
            vitalSigns ? JSON.stringify(vitalSigns) : null,
            req.params.id
        );

        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'Error updating appointment' });
    }
});

// Prescriptions - Requires authentication
router.get('/prescriptions', requireAuth, async (req, res) => {
    try {
        const prescriptions = db.prepare('SELECT * FROM Prescription ORDER BY createdAt DESC').all();
        res.json(prescriptions.map(p => ({
            ...p,
            medicines: p.medicines ? JSON.parse(p.medicines) : []
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching prescriptions' });
    }
});

router.get('/prescriptions/:id', requireAuth, async (req, res) => {
    try {
        const prescription = db.prepare('SELECT * FROM Prescription WHERE id = ?').get(req.params.id);
        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
        res.json({
            ...prescription,
            medicines: prescription.medicines ? JSON.parse(prescription.medicines) : []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching prescription' });
    }
});

// Only DOCTOR can create prescriptions
router.post('/prescriptions', requireAuth, requireRole(['DOCTOR']), async (req, res) => {
    try {
        const {
            patientName, patientAge, patientGender, patientPhone, patientEmail,
            prescriptionDate, diagnosis, symptoms, doctorId, doctorName, medicines,
            instructions, followUpDate, status, notes
        } = req.body;

        const info = db.prepare(
            `INSERT INTO Prescription (
                patientName, patientAge, patientGender, patientPhone, patientEmail,
                prescriptionDate, diagnosis, symptoms, doctorId, doctorName, medicines, 
                instructions, followUpDate, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            patientName, patientAge, patientGender, patientPhone, patientEmail,
            prescriptionDate, diagnosis, symptoms, doctorId, doctorName,
            JSON.stringify(medicines || []),
            instructions, followUpDate, status, notes
        );

        res.status(201).json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ message: 'Error creating prescription' });
    }
});

// Only DOCTOR can update prescriptions
router.patch('/prescriptions/:id', requireAuth, requireRole(['DOCTOR']), async (req, res) => {
    try {
        const {
            patientName, patientAge, patientGender, patientPhone, patientEmail,
            prescriptionDate, diagnosis, symptoms, doctorId, doctorName, medicines,
            instructions, followUpDate, status, notes
        } = req.body;

        db.prepare(`
            UPDATE Prescription SET 
                patientName = COALESCE(?, patientName),
                patientAge = COALESCE(?, patientAge),
                patientGender = COALESCE(?, patientGender),
                patientPhone = COALESCE(?, patientPhone),
                patientEmail = COALESCE(?, patientEmail),
                prescriptionDate = COALESCE(?, prescriptionDate),
                diagnosis = COALESCE(?, diagnosis),
                symptoms = COALESCE(?, symptoms),
                doctorId = COALESCE(?, doctorId),
                doctorName = COALESCE(?, doctorName),
                medicines = COALESCE(?, medicines),
                instructions = COALESCE(?, instructions),
                followUpDate = COALESCE(?, followUpDate),
                status = COALESCE(?, status),
                notes = COALESCE(?, notes),
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            patientName, patientAge, patientGender, patientPhone, patientEmail,
            prescriptionDate, diagnosis, symptoms, doctorId, doctorName,
            medicines ? JSON.stringify(medicines) : null,
            instructions, followUpDate, status, notes,
            req.params.id
        );

        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({ message: 'Error updating prescription' });
    }
});

// Only DOCTOR can delete prescriptions
router.delete('/prescriptions/:id', requireAuth, requireRole(['DOCTOR']), async (req, res) => {
    try {
        db.prepare('DELETE FROM Prescription WHERE id = ?').run(req.params.id);
        res.json({ message: 'Prescription deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting prescription' });
    }
});

// Medicines
router.get('/medicines', async (req, res) => {
    try {
        const medicines = db.prepare('SELECT * FROM Medicine ORDER BY name ASC').all();
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching medicines' });
    }
});

router.post('/medicines', async (req, res) => {
    try {
        const {
            name, category, strength, form, manufacturer, description,
            sideEffects, contraindications, dosageInstructions,
            storageInstructions, price, stockQuantity, reorderLevel,
            isActive, createdBy
        } = req.body;

        const info = db.prepare(`
            INSERT INTO Medicine (
                name, category, strength, form, manufacturer, description,
                sideEffects, contraindications, dosageInstructions,
                storageInstructions, price, stockQuantity, reorderLevel,
                isActive, createdBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            name, category, strength, form, manufacturer, description,
            sideEffects, contraindications, dosageInstructions,
            storageInstructions, price, stockQuantity, reorderLevel,
            isActive ? 1 : 0, createdBy
        );

        res.status(201).json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
        console.error('Error creating medicine:', error);
        res.status(500).json({ message: 'Error creating medicine' });
    }
});

router.patch('/medicines/:id', async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        const updates = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => {
            if (field === 'isActive') return req.body[field] ? 1 : 0;
            return req.body[field];
        });

        db.prepare(`
            UPDATE Medicine SET 
                ${updates},
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(...values, req.params.id);

        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Error updating medicine:', error);
        res.status(500).json({ message: 'Error updating medicine' });
    }
});

router.delete('/medicines/:id', async (req, res) => {
    try {
        db.prepare('DELETE FROM Medicine WHERE id = ?').run(req.params.id);
        res.json({ message: 'Medicine deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting medicine' });
    }
});

// Invoices - Requires authentication
router.get('/invoices', requireAuth, async (req, res) => {
    try {
        const invoices = db.prepare('SELECT * FROM Invoice ORDER BY createdAt DESC').all();
        res.json(invoices.map(i => ({ ...i, items: i.items ? JSON.parse(i.items) : [] })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices' });
    }
});

router.get('/invoices/:id', requireAuth, async (req, res) => {
    try {
        const invoice = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(req.params.id);
        if (invoice) {
            res.json({ ...invoice, items: invoice.items ? JSON.parse(invoice.items) : [] });
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice' });
    }
});

// Only RECEPTIONIST or ADMIN can create invoices
router.post('/invoices', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const { invoiceNumber, patientName, patientPhone, patientEmail, items, totalAmount, status, paymentMethod } = req.body;
        const info = db.prepare(
            `INSERT INTO Invoice (
                invoiceNumber, patientName, patientPhone, patientEmail, 
                items, totalAmount, status, paymentMethod
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            invoiceNumber || `INV-${Date.now()}`,
            patientName, patientPhone, patientEmail,
            JSON.stringify(items || []),
            totalAmount,
            status || 'pending',
            paymentMethod
        );

        res.status(201).json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Error creating invoice' });
    }
});

// Only RECEPTIONIST or ADMIN can update invoices
router.patch('/invoices/:id', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const { status, paymentMethod, paymentDate, paymentReference, paymentNotes } = req.body;
        db.prepare(`
            UPDATE Invoice SET 
                status = COALESCE(?, status), 
                paymentMethod = COALESCE(?, paymentMethod),
                paymentDate = COALESCE(?, paymentDate),
                paymentReference = COALESCE(?, paymentReference),
                paymentNotes = COALESCE(?, paymentNotes),
                updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(status, paymentMethod, paymentDate, paymentReference, paymentNotes, req.params.id);
        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Error updating invoice' });
    }
});

// Payments - Requires authentication
router.get('/payments', requireAuth, async (req, res) => {
    try {
        const payments = db.prepare('SELECT * FROM Payment ORDER BY processedAt DESC').all();
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payments' });
    }
});

// Only RECEPTIONIST or ADMIN can process payments
router.post('/payments', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const { invoiceId, invoiceNumber, patientName, patientPhone, amount, method, reference, notes, processedBy } = req.body;
        const info = db.prepare(
            `INSERT INTO Payment (
                invoiceId, invoiceNumber, patientName, patientPhone, 
                amount, method, reference, notes, processedBy
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(invoiceId, invoiceNumber, patientName, patientPhone, amount, method, reference, notes, processedBy);

        res.status(201).json({ id: info.lastInsertRowid, ...req.body });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Error creating payment' });
    }
});

export default router;
