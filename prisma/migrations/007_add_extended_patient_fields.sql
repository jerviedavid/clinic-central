-- Add extended patient information fields
ALTER TABLE Patient ADD COLUMN civilStatus TEXT;
ALTER TABLE Patient ADD COLUMN nationalId TEXT;
ALTER TABLE Patient ADD COLUMN emergencyContactRelationship TEXT;

-- Administrative fields
ALTER TABLE Patient ADD COLUMN insuranceProvider TEXT;
ALTER TABLE Patient ADD COLUMN insurancePolicyNumber TEXT;
ALTER TABLE Patient ADD COLUMN hmoAccount TEXT;
ALTER TABLE Patient ADD COLUMN referredBy TEXT;
ALTER TABLE Patient ADD COLUMN firstVisitDate TEXT;
ALTER TABLE Patient ADD COLUMN preferredCommunication TEXT;

-- Medical basics
ALTER TABLE Patient ADD COLUMN currentMedications TEXT;
ALTER TABLE Patient ADD COLUMN surgicalHistory TEXT;
ALTER TABLE Patient ADD COLUMN familyHistory TEXT;
ALTER TABLE Patient ADD COLUMN smokingAlcoholUse TEXT;
ALTER TABLE Patient ADD COLUMN height REAL;
ALTER TABLE Patient ADD COLUMN weight REAL;
ALTER TABLE Patient ADD COLUMN vaccinationStatus TEXT;
