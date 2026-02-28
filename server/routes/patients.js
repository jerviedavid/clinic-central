import express from 'express';
import prisma from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

console.log('[DEBUG] patients.js router file loaded');

router.get('/ping', (req, res) => {
    res.json({ message: 'patients router is active', timestamp: new Date().toISOString() });
});

// GET all patients for clinic
router.get('/', requireAuth, async (req, res) => {
    try {
        const patients = await prisma.patient.findMany({
            where: { clinicId: req.user.clinicId },
            orderBy: { createdAt: 'desc' }
        });
        const parsedPatients = patients.map(p => ({
            ...p,
            attachments: p.attachments ? JSON.parse(p.attachments) : [],
            specialtyData: p.specialtyData ? JSON.parse(p.specialtyData) : {}
        }));
        res.json(parsedPatients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Error fetching patients' });
    }
});

// GET clinic specialty
router.get('/clinic-specialty', requireAuth, async (req, res) => {
    try {
        const clinicDoctors = await prisma.clinicUser.findMany({
            where: { clinicId: req.user.clinicId, role: { name: 'DOCTOR' } },
            include: { user: { include: { doctorProfile: true } } }
        });
        const specializations = clinicDoctors
            .filter(cu => cu.user.doctorProfile)
            .map(cu => [cu.user.doctorProfile.specialization, cu.user.doctorProfile.subspecialty].filter(Boolean))
            .flat();
        res.json({ specializations });
    } catch (error) {
        console.error('Error fetching clinic specialty:', error);
        res.status(500).json({ message: 'Error fetching clinic specialty' });
    }
});

// GET patient history
router.get('/:id/history', requireAuth, async (req, res) => {
    console.log(`[DEBUG] Patient History hit. ID: ${req.params.id}, ClinicID: ${req.user.clinicId}`);
    try {
        const { id } = req.params;
        const patientId = parseInt(id);
        if (isNaN(patientId)) return res.status(400).json({ message: 'Invalid patient ID' });

        const patient = await prisma.patient.findFirst({
            where: { id: patientId, clinicId: req.user.clinicId }
        });
        if (!patient) {
            console.log(`[DEBUG] Patient not found or unauthorized. ID: ${patientId}, ClinicID: ${req.user.clinicId}`);
            return res.status(404).json({ message: 'Patient not found or unauthorized' });
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                patientName: patient.fullName,
                OR: [
                    { patientPhone: patient.phone },
                    { patientEmail: patient.email }
                ]
            },
            orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }]
        });

        const prescriptions = await prisma.prescription.findMany({
            where: {
                patientName: patient.fullName,
                OR: [
                    { patientPhone: patient.phone },
                    { patientEmail: patient.email }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        const invoices = await prisma.invoice.findMany({
            where: {
                patientName: patient.fullName,
                OR: [
                    { patientPhone: patient.phone },
                    { patientEmail: patient.email }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[DEBUG] History results: Appts: ${appointments.length}, Presc: ${prescriptions.length}, Invoices: ${invoices.length}`);

        res.json({
            patient: { ...patient, attachments: patient.attachments ? JSON.parse(patient.attachments) : [] },
            appointments: appointments.map(a => ({ ...a, vitalSigns: a.vitalSigns ? JSON.parse(a.vitalSigns) : null })),
            prescriptions: prescriptions.map(p => ({ ...p, medicines: p.medicines ? JSON.parse(p.medicines) : [] })),
            invoices: invoices.map(i => ({ ...i, items: i.items ? JSON.parse(i.items) : [] }))
        });
    } catch (error) {
        console.error('Error fetching patient history:', error);
        res.status(500).json({ message: 'Error fetching patient history' });
    }
});

// POST create patient
router.post('/', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const {
            fullName, dateOfBirth, gender, civilStatus, nationalId, phone, email, address,
            emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
            insuranceProvider, insurancePolicyNumber, hmoAccount, referredBy,
            firstVisitDate, preferredCommunication,
            bloodType, allergies, currentMedications, medicalHistory,
            surgicalHistory, familyHistory, smokingAlcoholUse,
            height, weight, vaccinationStatus, profileImage, attachments, specialtyData
        } = req.body;
        if (!fullName) return res.status(400).json({ message: 'Full name is required' });

        const patient = await prisma.patient.create({
            data: {
                fullName,
                dateOfBirth,
                gender,
                civilStatus,
                nationalId,
                phone,
                email,
                address,
                emergencyContactName,
                emergencyContactPhone,
                emergencyContactRelationship,
                insuranceProvider,
                insurancePolicyNumber,
                hmoAccount,
                referredBy,
                firstVisitDate,
                preferredCommunication,
                bloodType,
                allergies,
                currentMedications,
                medicalHistory,
                surgicalHistory,
                familyHistory,
                smokingAlcoholUse,
                height: height || null,
                weight: weight || null,
                vaccinationStatus,
                profileImage: profileImage || null,
                attachments: attachments ? JSON.stringify(attachments) : null,
                specialtyData: specialtyData ? JSON.stringify(specialtyData) : null,
                clinicId: req.user.clinicId
            }
        });
        res.status(201).json({ id: patient.id, message: 'Patient created successfully' });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ message: 'Error creating patient' });
    }
});

// PATCH update patient
router.patch('/:id', requireAuth, requireRole(['RECEPTIONIST', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const patient = await prisma.patient.findFirst({
            where: { id: parseInt(id), clinicId: req.user.clinicId }
        });
        if (!patient) return res.status(404).json({ message: 'Patient not found or unauthorized' });

        if (updates.attachments && Array.isArray(updates.attachments)) {
            updates.attachments = JSON.stringify(updates.attachments);
        }
        if (updates.specialtyData && typeof updates.specialtyData === 'object') {
            updates.specialtyData = JSON.stringify(updates.specialtyData);
        }

        const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'clinicId' && key !== 'createdAt');
        if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });

        const data = {};
        fields.forEach(field => { data[field] = updates[field]; });

        await prisma.patient.update({ where: { id: parseInt(id) }, data });
        res.json({ message: 'Patient updated successfully' });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ message: 'Error updating patient' });
    }
});

// DELETE patient
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await prisma.patient.findFirst({
            where: { id: parseInt(id), clinicId: req.user.clinicId }
        });
        if (!patient) return res.status(404).json({ message: 'Patient not found or unauthorized' });

        await prisma.patient.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ message: 'Error deleting patient' });
    }
});

export default router;
