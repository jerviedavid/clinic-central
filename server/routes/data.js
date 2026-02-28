import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Doctors - Clinic-aware
router.get('/doctors', requireAuth, async (req, res) => {
    try {
        const clinicUserDoctors = await prisma.clinicUser.findMany({
            where: { clinicId: req.user.clinicId, role: { name: 'DOCTOR' } },
            include: { user: { select: { id: true, fullName: true, email: true } }, role: { select: { name: true } } }
        });
        const doctors = clinicUserDoctors.map(cu => ({
            id: cu.user.id, fullName: cu.user.fullName, email: cu.user.email, role: cu.role.name
        }));
        res.json(doctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ message: 'Error fetching doctors' });
    }
});

// Appointments
router.get('/appointments', requireAuth, async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(appointments.map(a => ({
            ...a,
            vitalSigns: a.vitalSigns ? JSON.parse(a.vitalSigns) : { bloodPressure: '', heartRate: '', temperature: '', weight: '' }
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments' });
    }
});

router.get('/appointments/:id', requireAuth, async (req, res) => {
    try {
        const appointment = await prisma.appointment.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        res.json({
            ...appointment,
            vitalSigns: appointment.vitalSigns ? JSON.parse(appointment.vitalSigns) : { bloodPressure: '', heartRate: '', temperature: '', weight: '' }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointment' });
    }
});

router.post('/appointments', requireAuth, async (req, res) => {
    try {
        const {
            patientName, patientPhone, patientEmail, patientAge, patientGender,
            doctorName, appointmentDate, appointmentTime, appointmentType,
            status, tokenNumber, notes, symptoms, medicalHistory, medications, vitalSigns
        } = req.body;
        const result = await prisma.appointment.create({
            data: {
                patientName, patientPhone, patientEmail, patientAge, patientGender,
                doctorName, appointmentDate, appointmentTime, appointmentType,
                status, tokenNumber, notes, symptoms, medicalHistory, medications,
                vitalSigns: vitalSigns ? JSON.stringify(vitalSigns) : null
            }
        });
        res.status(201).json({ id: result.id, ...req.body });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Error creating appointment' });
    }
});

router.patch('/appointments/:id', requireAuth, async (req, res) => {
    try {
        const {
            patientName, patientPhone, patientEmail, patientAge, patientGender,
            doctorName, appointmentDate, appointmentTime, appointmentType,
            status, tokenNumber, notes, symptoms, medicalHistory, medications, vitalSigns
        } = req.body;
        // Build data object with only defined fields (COALESCE equivalent)
        const data = {};
        if (patientName !== undefined) data.patientName = patientName;
        if (patientPhone !== undefined) data.patientPhone = patientPhone;
        if (patientEmail !== undefined) data.patientEmail = patientEmail;
        if (patientAge !== undefined) data.patientAge = patientAge;
        if (patientGender !== undefined) data.patientGender = patientGender;
        if (doctorName !== undefined) data.doctorName = doctorName;
        if (appointmentDate !== undefined) data.appointmentDate = appointmentDate;
        if (appointmentTime !== undefined) data.appointmentTime = appointmentTime;
        if (appointmentType !== undefined) data.appointmentType = appointmentType;
        if (status !== undefined) data.status = status;
        if (tokenNumber !== undefined) data.tokenNumber = tokenNumber;
        if (notes !== undefined) data.notes = notes;
        if (symptoms !== undefined) data.symptoms = symptoms;
        if (medicalHistory !== undefined) data.medicalHistory = medicalHistory;
        if (medications !== undefined) data.medications = medications;
        if (vitalSigns !== undefined) data.vitalSigns = JSON.stringify(vitalSigns);

        await prisma.appointment.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'Error updating appointment' });
    }
});

// Prescriptions
router.get('/prescriptions', requireAuth, async (req, res) => {
    try {
        const prescriptions = await prisma.prescription.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(prescriptions.map(p => ({ ...p, medicines: p.medicines ? JSON.parse(p.medicines) : [] })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching prescriptions' });
    }
});

router.get('/prescriptions/:id', requireAuth, async (req, res) => {
    try {
        const prescription = await prisma.prescription.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
        res.json({ ...prescription, medicines: prescription.medicines ? JSON.parse(prescription.medicines) : [] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching prescription' });
    }
});

router.post('/prescriptions', requireAuth, requireRole(['DOCTOR']), async (req, res) => {
    try {
        const {
            patientName, patientAge, patientGender, patientPhone, patientEmail,
            prescriptionDate, diagnosis, symptoms, doctorId, doctorName, medicines,
            instructions, followUpDate, status, notes
        } = req.body;
        const result = await prisma.prescription.create({
            data: {
                patientName, patientAge, patientGender, patientPhone, patientEmail,
                prescriptionDate, diagnosis, symptoms, doctorId, doctorName,
                medicines: JSON.stringify(medicines || []),
                instructions, followUpDate, status, notes
            }
        });
        res.status(201).json({ id: result.id, ...req.body });
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ message: 'Error creating prescription' });
    }
});

router.patch('/prescriptions/:id', requireAuth, requireRole(['DOCTOR']), async (req, res) => {
    try {
        const {
            patientName, patientAge, patientGender, patientPhone, patientEmail,
            prescriptionDate, diagnosis, symptoms, doctorId, doctorName, medicines,
            instructions, followUpDate, status, notes
        } = req.body;
        // Build data object with only defined fields
        const data = {};
        if (patientName !== undefined) data.patientName = patientName;
        if (patientAge !== undefined) data.patientAge = patientAge;
        if (patientGender !== undefined) data.patientGender = patientGender;
        if (patientPhone !== undefined) data.patientPhone = patientPhone;
        if (patientEmail !== undefined) data.patientEmail = patientEmail;
        if (prescriptionDate !== undefined) data.prescriptionDate = prescriptionDate;
        if (diagnosis !== undefined) data.diagnosis = diagnosis;
        if (symptoms !== undefined) data.symptoms = symptoms;
        if (doctorId !== undefined) data.doctorId = doctorId;
        if (doctorName !== undefined) data.doctorName = doctorName;
        if (medicines !== undefined) data.medicines = JSON.stringify(medicines);
        if (instructions !== undefined) data.instructions = instructions;
        if (followUpDate !== undefined) data.followUpDate = followUpDate;
        if (status !== undefined) data.status = status;
        if (notes !== undefined) data.notes = notes;

        await prisma.prescription.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({ message: 'Error updating prescription' });
    }
});

router.delete('/prescriptions/:id', requireAuth, requireRole(['DOCTOR']), async (req, res) => {
    try {
        await prisma.prescription.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Prescription deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting prescription' });
    }
});

// Medicines
router.get('/medicines', async (req, res) => {
    try {
        const medicines = await prisma.medicine.findMany({ orderBy: { name: 'asc' } });
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
        const result = await prisma.medicine.create({
            data: {
                name, category, strength, form, manufacturer, description,
                sideEffects, contraindications, dosageInstructions,
                storageInstructions, price, stockQuantity, reorderLevel,
                isActive, createdBy
            }
        });
        res.status(201).json({ id: result.id, ...req.body });
    } catch (error) {
        console.error('Error creating medicine:', error);
        res.status(500).json({ message: 'Error creating medicine' });
    }
});

router.patch('/medicines/:id', async (req, res) => {
    try {
        // Dynamic field update - filter allowed fields from req.body
        const allowedFields = ['name', 'category', 'strength', 'form', 'manufacturer', 'description', 'sideEffects', 'contraindications', 'dosageInstructions', 'storageInstructions', 'price', 'stockQuantity', 'reorderLevel', 'isActive', 'createdBy'];
        const data = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                data[field] = req.body[field];
            }
        }
        await prisma.medicine.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Error updating medicine:', error);
        res.status(500).json({ message: 'Error updating medicine' });
    }
});

router.delete('/medicines/:id', async (req, res) => {
    try {
        await prisma.medicine.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Medicine deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting medicine' });
    }
});

// Invoices
router.get('/invoices', requireAuth, async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(invoices.map(i => ({ ...i, items: i.items ? JSON.parse(i.items) : [] })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices' });
    }
});

router.get('/invoices/:id', requireAuth, async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(req.params.id) } });
        if (invoice) {
            res.json({ ...invoice, items: invoice.items ? JSON.parse(invoice.items) : [] });
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice' });
    }
});

router.post('/invoices', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const { invoiceNumber, patientName, patientPhone, patientEmail, items, totalAmount, status, paymentMethod } = req.body;
        const result = await prisma.invoice.create({
            data: {
                invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
                patientName, patientPhone, patientEmail,
                items: JSON.stringify(items || []),
                totalAmount,
                status: status || 'pending',
                paymentMethod
            }
        });
        res.status(201).json({ id: result.id, ...req.body });
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Error creating invoice' });
    }
});

router.patch('/invoices/:id', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const { status, paymentMethod, paymentDate, paymentReference, paymentNotes } = req.body;
        // Build data object with only defined fields
        const data = {};
        if (status !== undefined) data.status = status;
        if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
        if (paymentDate !== undefined) data.paymentDate = paymentDate;
        if (paymentReference !== undefined) data.paymentReference = paymentReference;
        if (paymentNotes !== undefined) data.paymentNotes = paymentNotes;

        await prisma.invoice.update({ where: { id: parseInt(req.params.id) }, data });
        res.json({ id: req.params.id, ...req.body });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Error updating invoice' });
    }
});

// Payments
router.get('/payments', requireAuth, async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({ orderBy: { processedAt: 'desc' } });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payments' });
    }
});

router.post('/payments', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const { invoiceId, invoiceNumber, patientName, patientPhone, amount, method, reference, notes, processedBy } = req.body;
        const result = await prisma.payment.create({
            data: {
                invoiceId, invoiceNumber, patientName, patientPhone,
                amount, method, reference, notes, processedBy
            }
        });
        res.status(201).json({ id: result.id, ...req.body });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Error creating payment' });
    }
});

export default router;
