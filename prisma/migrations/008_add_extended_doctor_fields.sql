-- Add extended doctor profile fields
ALTER TABLE DoctorProfile ADD COLUMN subspecialty TEXT;
ALTER TABLE DoctorProfile ADD COLUMN prcId TEXT;
ALTER TABLE DoctorProfile ADD COLUMN digitalSignature TEXT;
ALTER TABLE DoctorProfile ADD COLUMN ptrTaxId TEXT;
ALTER TABLE DoctorProfile ADD COLUMN ePrescriptionId TEXT;
