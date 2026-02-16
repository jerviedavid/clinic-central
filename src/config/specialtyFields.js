/**
 * Specialty-specific field definitions for the Modular Dynamic Form Builder.
 * Each specialty key maps to a config with label, icon, color, and field sections.
 * 
 * Field types: text, textarea, number, select, date, file, scale, computed
 * 
 * The specialty key is matched against the doctor's `specialization` field (case-insensitive, partial match).
 */

const SPECIALTY_FIELDS = {
  dental: {
    label: 'Dental Clinic',
    icon: '🦷',
    color: 'cyan',
    matchTerms: ['dental', 'dentist', 'orthodont', 'endodont', 'periodont', 'prosthodont', 'oral surgery'],
    sections: [
      {
        title: 'Dental Assessment',
        fields: [
          { key: 'chiefComplaint', label: 'Chief Complaint (Tooth #)', type: 'text', placeholder: 'e.g., Pain on tooth #36' },
          { key: 'dentalChart', label: 'Dental Chart Notes', type: 'textarea', placeholder: 'Tooth map findings, conditions per quadrant...', rows: 4 },
          { key: 'periodontalCharting', label: 'Periodontal Charting', type: 'textarea', placeholder: 'Pocket depths, bleeding on probing, gingival recession...', rows: 3 },
          { key: 'occlusionType', label: 'Occlusion Type', type: 'select', options: ['', 'Class I', 'Class II Div 1', 'Class II Div 2', 'Class III'] },
          { key: 'previousDentalWork', label: 'Previous Dental Work', type: 'textarea', placeholder: 'Fillings, crowns, root canals, implants...', rows: 2 },
          { key: 'orthodonticHistory', label: 'Orthodontic History', type: 'text', placeholder: 'Braces, retainers, aligners...' },
        ]
      },
      {
        title: 'Dental Prescription Notes',
        fields: [
          { key: 'dentalAntibiotics', label: 'Dental Antibiotics', type: 'text', placeholder: 'e.g., Amoxicillin 500mg' },
          { key: 'analgesics', label: 'Analgesics', type: 'text', placeholder: 'e.g., Ibuprofen 400mg' },
          { key: 'postExtractionInstructions', label: 'Post-extraction Instructions', type: 'textarea', placeholder: 'Bite on gauze, avoid spitting, cold compress...', rows: 3 },
          { key: 'mouthRinseInstructions', label: 'Mouth Rinse Instructions', type: 'textarea', placeholder: 'Chlorhexidine 0.12%, rinse twice daily...', rows: 2 },
        ]
      }
    ]
  },

  pediatrics: {
    label: 'Pediatrics',
    icon: '👶',
    color: 'pink',
    matchTerms: ['pediatric', 'paediatric', 'child', 'neonatal'],
    sections: [
      {
        title: 'Pediatric Assessment',
        fields: [
          { key: 'birthWeight', label: 'Birth Weight (kg)', type: 'number', step: '0.01', placeholder: 'e.g., 3.2' },
          { key: 'deliveryType', label: 'Delivery Type', type: 'select', options: ['', 'Normal Vaginal Delivery', 'Cesarean Section', 'Assisted (Forceps)', 'Assisted (Vacuum)', 'Water Birth'] },
          { key: 'apgarScore', label: 'APGAR Score', type: 'text', placeholder: 'e.g., 8/9 (1min/5min)' },
          { key: 'growthChart', label: 'Growth Chart (Height/Weight Percentile)', type: 'textarea', placeholder: 'Height: 50th percentile, Weight: 45th percentile...', rows: 2 },
          { key: 'developmentalMilestones', label: 'Developmental Milestones', type: 'textarea', placeholder: 'Sitting, crawling, walking, first words...', rows: 3 },
          { key: 'immunizationRecords', label: 'Immunization Records', type: 'textarea', placeholder: 'BCG, Hepatitis B, DPT, OPV, MMR...', rows: 3 },
          { key: 'parentGuardianInfo', label: 'Parent/Guardian Info', type: 'textarea', placeholder: 'Name, contact, relationship, blood type...', rows: 2 },
        ]
      },
      {
        title: 'Pediatric Prescription Notes',
        fields: [
          { key: 'weightBasedDosing', label: 'Weight-based Dosing Notes', type: 'textarea', placeholder: 'Drug: dose per kg, patient weight, calculated dose...', rows: 2 },
          { key: 'syrupFormulation', label: 'Syrup Formulation', type: 'text', placeholder: 'e.g., Amoxicillin 125mg/5ml suspension' },
          { key: 'vaccineScheduleReminders', label: 'Vaccine Schedule Reminders', type: 'textarea', placeholder: 'Next vaccines due, schedule...', rows: 2 },
        ]
      }
    ]
  },

  ent: {
    label: 'ENT (Ear, Nose & Throat)',
    icon: '👂',
    color: 'amber',
    matchTerms: ['ent', 'ear nose', 'otolaryngolog', 'otorhinolaryngolog'],
    sections: [
      {
        title: 'ENT Assessment',
        fields: [
          { key: 'hearingTestResults', label: 'Hearing Test Results', type: 'textarea', placeholder: 'Audiogram findings, hearing levels...', rows: 2 },
          { key: 'hearingTestUpload', label: 'Audiogram Upload', type: 'file' },
          { key: 'nasalEndoscopyNotes', label: 'Nasal Endoscopy Notes', type: 'textarea', placeholder: 'Turbinate hypertrophy, septal deviation, polyps...', rows: 3 },
          { key: 'throatExamination', label: 'Throat Examination', type: 'textarea', placeholder: 'Tonsillar hypertrophy, erythema, exudates...', rows: 2 },
          { key: 'sinusHistory', label: 'Sinus History', type: 'textarea', placeholder: 'Chronic sinusitis, previous sinus surgery...', rows: 2 },
          { key: 'allergyHistory', label: 'Allergy History (ENT)', type: 'textarea', placeholder: 'Seasonal, perennial, triggers...', rows: 2 },
        ]
      },
      {
        title: 'ENT Prescription Notes',
        fields: [
          { key: 'nasalSprays', label: 'Nasal Sprays', type: 'text', placeholder: 'e.g., Fluticasone, Oxymetazoline' },
          { key: 'earDrops', label: 'Ear Drops', type: 'text', placeholder: 'e.g., Ciprofloxacin otic' },
          { key: 'decongestants', label: 'Decongestants', type: 'text', placeholder: 'e.g., Pseudoephedrine' },
          { key: 'entAntibiotics', label: 'Antibiotics', type: 'text', placeholder: 'e.g., Amoxicillin-Clavulanate' },
        ]
      }
    ]
  },

  ophthalmology: {
    label: 'Ophthalmology',
    icon: '👁',
    color: 'blue',
    matchTerms: ['ophthalmolog', 'eye', 'optom', 'oculist'],
    sections: [
      {
        title: 'Eye Assessment',
        fields: [
          { key: 'visualAcuityOD', label: 'Visual Acuity (OD - Right)', type: 'text', placeholder: 'e.g., 20/20' },
          { key: 'visualAcuityOS', label: 'Visual Acuity (OS - Left)', type: 'text', placeholder: 'e.g., 20/40' },
          { key: 'refractionResults', label: 'Refraction Results', type: 'textarea', placeholder: 'OD: -2.00 -0.50 x 180, OS: -1.75 -0.75 x 170', rows: 2 },
          { key: 'intraocularPressure', label: 'Intraocular Pressure (mmHg)', type: 'text', placeholder: 'OD: 14, OS: 15' },
          { key: 'fundusExamNotes', label: 'Fundus Exam Notes', type: 'textarea', placeholder: 'Disc, cup-to-disc ratio, macular findings...', rows: 3 },
          { key: 'contactLensPrescription', label: 'Contact Lens Prescription', type: 'textarea', placeholder: 'Base curve, diameter, power, brand...', rows: 2 },
        ]
      },
      {
        title: 'Ophthalmology Prescription Notes',
        fields: [
          { key: 'eyeDropFrequency', label: 'Eye Drop Frequency Template', type: 'textarea', placeholder: 'Drug, dosing schedule, duration...', rows: 2 },
          { key: 'glassesPrescription', label: 'Glasses Prescription', type: 'textarea', placeholder: 'OD/OS sphere, cylinder, axis, add, PD...', rows: 2 },
          { key: 'postSurgeryEyeMeds', label: 'Post-surgery Eye Medication', type: 'textarea', placeholder: 'Antibiotic drops, steroid drops, schedule...', rows: 2 },
        ]
      }
    ]
  },

  dermatology: {
    label: 'Dermatology',
    icon: '💆',
    color: 'rose',
    matchTerms: ['dermatolog', 'skin', 'cosmetic dermat'],
    sections: [
      {
        title: 'Dermatology Assessment',
        fields: [
          { key: 'skinType', label: 'Skin Type (Fitzpatrick Scale)', type: 'select', options: ['', 'Type I - Very Fair', 'Type II - Fair', 'Type III - Medium', 'Type IV - Olive', 'Type V - Brown', 'Type VI - Dark Brown/Black'] },
          { key: 'lesionMapping', label: 'Lesion Mapping', type: 'textarea', placeholder: 'Location, size, shape, borders, color of lesions...', rows: 3 },
          { key: 'photoBeforeAfter', label: 'Photo Upload (Before/After)', type: 'file' },
          { key: 'acneGrading', label: 'Acne Grading', type: 'select', options: ['', 'Grade I - Comedonal', 'Grade II - Mild Papulopustular', 'Grade III - Moderate Papulopustular', 'Grade IV - Severe/Nodulocystic'] },
          { key: 'cosmeticProcedureHistory', label: 'Cosmetic Procedure History', type: 'textarea', placeholder: 'Botox, fillers, chemical peels, laser treatments...', rows: 2 },
        ]
      },
      {
        title: 'Dermatology Prescription Notes',
        fields: [
          { key: 'topicalCreamTemplate', label: 'Topical Cream Template', type: 'textarea', placeholder: 'Cream name, application area, amount...', rows: 2 },
          { key: 'applicationFrequency', label: 'Application Frequency', type: 'text', placeholder: 'e.g., Twice daily, thin layer' },
          { key: 'treatmentDuration', label: 'Treatment Duration / Auto-reminder', type: 'text', placeholder: 'e.g., 4 weeks, then reassess' },
        ]
      }
    ]
  },

  orthopedics: {
    label: 'Orthopedics',
    icon: '🦴',
    color: 'orange',
    matchTerms: ['orthoped', 'orthopaed', 'bone', 'musculoskeletal', 'spine', 'sports medicine'],
    sections: [
      {
        title: 'Orthopedic Assessment',
        fields: [
          { key: 'injuryMechanism', label: 'Injury Mechanism', type: 'textarea', placeholder: 'How did the injury occur? Fall, twist, impact...', rows: 2 },
          { key: 'rangeOfMotion', label: 'Range of Motion', type: 'textarea', placeholder: 'Joint: flexion/extension degrees, compared to normal...', rows: 2 },
          { key: 'imagingUpload', label: 'X-ray / MRI Upload', type: 'file' },
          { key: 'painScale', label: 'Pain Scale (1–10)', type: 'scale', min: 1, max: 10 },
          { key: 'fractureType', label: 'Fracture Type', type: 'select', options: ['', 'Simple/Closed', 'Compound/Open', 'Comminuted', 'Greenstick', 'Stress', 'Pathological', 'Avulsion', 'Spiral', 'N/A'] },
        ]
      },
      {
        title: 'Orthopedic Prescription Notes',
        fields: [
          { key: 'nsaids', label: 'NSAIDs', type: 'text', placeholder: 'e.g., Celecoxib 200mg, Ibuprofen 400mg' },
          { key: 'muscleRelaxants', label: 'Muscle Relaxants', type: 'text', placeholder: 'e.g., Methocarbamol 500mg' },
          { key: 'physicalTherapyReferral', label: 'Physical Therapy Referral', type: 'textarea', placeholder: 'Goals, exercises, frequency, duration...', rows: 2 },
          { key: 'immobilizationInstructions', label: 'Immobilization Instructions', type: 'textarea', placeholder: 'Cast care, sling instructions, weight-bearing status...', rows: 2 },
        ]
      }
    ]
  },

  cardiology: {
    label: 'Cardiology',
    icon: '❤️',
    color: 'red',
    matchTerms: ['cardiolog', 'heart', 'cardiovascular'],
    sections: [
      {
        title: 'Cardiac Assessment',
        fields: [
          { key: 'bloodPressureHistory', label: 'Blood Pressure History', type: 'textarea', placeholder: 'Date: Systolic/Diastolic, tracking trends...', rows: 3 },
          { key: 'ecgUpload', label: 'ECG Upload', type: 'file' },
          { key: 'echoResults', label: 'Echocardiogram Results', type: 'textarea', placeholder: 'EF%, wall motion, valvular findings...', rows: 3 },
          { key: 'cholesterolLevels', label: 'Cholesterol Levels', type: 'textarea', placeholder: 'Total: LDL: HDL: Triglycerides:', rows: 2 },
          { key: 'riskScore', label: 'Cardiovascular Risk Score', type: 'text', placeholder: 'e.g., Framingham 10-year risk: 15%' },
        ]
      },
      {
        title: 'Cardiology Prescription Notes',
        fields: [
          { key: 'antihypertensives', label: 'Antihypertensives', type: 'text', placeholder: 'e.g., Amlodipine 5mg, Losartan 50mg' },
          { key: 'bloodThinners', label: 'Blood Thinners', type: 'text', placeholder: 'e.g., Aspirin 81mg, Rivaroxaban 20mg' },
          { key: 'statins', label: 'Statins', type: 'text', placeholder: 'e.g., Atorvastatin 20mg' },
          { key: 'lifestyleRecommendations', label: 'Lifestyle Recommendations', type: 'textarea', placeholder: 'Diet, exercise, salt restriction, smoking cessation...', rows: 2 },
        ]
      }
    ]
  },

  obgyn: {
    label: 'OB-GYN',
    icon: '🤰',
    color: 'fuchsia',
    matchTerms: ['ob-gyn', 'obgyn', 'obstetric', 'gynecolog', 'reproductive', 'maternal'],
    sections: [
      {
        title: 'OB-GYN Assessment',
        fields: [
          { key: 'lmp', label: 'LMP (Last Menstrual Period)', type: 'date' },
          { key: 'gravidaPara', label: 'Gravida / Para', type: 'text', placeholder: 'e.g., G3P2 (3 pregnancies, 2 deliveries)' },
          {
            key: 'eddCalculated', label: 'EDD (Estimated Due Date)', type: 'computed',
            computeFrom: 'lmp',
            computeFn: 'edd' // special handler in the component
          },
          { key: 'ultrasoundRecords', label: 'Ultrasound Records', type: 'textarea', placeholder: 'Gestational age, fetal measurements, findings...', rows: 3 },
          { key: 'contraceptiveHistory', label: 'Contraceptive History', type: 'textarea', placeholder: 'Current/past methods: pills, IUD, implant...', rows: 2 },
          { key: 'papSmearResults', label: 'Pap Smear Results', type: 'textarea', placeholder: 'Date, result, HPV status...', rows: 2 },
        ]
      },
      {
        title: 'OB-GYN Prescription Notes',
        fields: [
          { key: 'prenatalVitamins', label: 'Prenatal Vitamins', type: 'text', placeholder: 'e.g., Folic acid 400mcg, Iron 60mg' },
          { key: 'hormonalTherapy', label: 'Hormonal Therapy', type: 'text', placeholder: 'e.g., Progesterone, Estradiol' },
          { key: 'ironSupplements', label: 'Iron Supplements', type: 'text', placeholder: 'e.g., Ferrous sulfate 325mg' },
        ]
      }
    ]
  },

  mentalHealth: {
    label: 'Mental Health / Psychiatry',
    icon: '🧠',
    color: 'violet',
    matchTerms: ['mental health', 'psychiatr', 'psycholog', 'psychotherapy', 'behavioral'],
    sections: [
      {
        title: 'Mental Health Assessment',
        fields: [
          { key: 'psychAssessmentScores', label: 'Psychological Assessment Scores', type: 'textarea', placeholder: 'PHQ-9, GAD-7, MMSE, Beck Depression Inventory...', rows: 2 },
          { key: 'dsmDiagnosisCode', label: 'DSM Diagnosis Code', type: 'text', placeholder: 'e.g., F32.1 Major Depressive Disorder, moderate' },
          { key: 'therapyNotes', label: 'Therapy Notes (Private/Restricted)', type: 'textarea', placeholder: 'Session notes, observations, progress...', rows: 4 },
          { key: 'suicideRiskAssessment', label: 'Suicide Risk Assessment', type: 'select', options: ['', 'No Risk Identified', 'Low Risk', 'Moderate Risk', 'High Risk', 'Imminent Risk'] },
          { key: 'treatmentPlan', label: 'Treatment Plan', type: 'textarea', placeholder: 'Goals, interventions, frequency, expected outcomes...', rows: 3 },
        ]
      },
      {
        title: 'Psychiatric Prescription Notes',
        fields: [
          { key: 'psychiatricMedication', label: 'Psychiatric Medication', type: 'textarea', placeholder: 'SSRI, SNRI, benzodiazepines, antipsychotics...', rows: 2 },
          { key: 'controlledDrugLogging', label: 'Controlled Drug Logging', type: 'textarea', placeholder: 'Drug, schedule, quantity, refill date...', rows: 2 },
          { key: 'followUpSchedule', label: 'Follow-up Reminder Schedule', type: 'text', placeholder: 'e.g., Weekly for 4 weeks, then bi-weekly' },
        ]
      }
    ]
  },

  physicalTherapy: {
    label: 'Physical Therapy',
    icon: '💪',
    color: 'lime',
    matchTerms: ['physical therapy', 'physiotherapy', 'rehabilitation', 'rehab'],
    sections: [
      {
        title: 'Physical Therapy Assessment',
        fields: [
          { key: 'functionalAssessment', label: 'Functional Assessment', type: 'textarea', placeholder: 'Mobility, strength, balance, ADL limitations...', rows: 3 },
          { key: 'romMeasurements', label: 'Range of Motion Measurements', type: 'textarea', placeholder: 'Joint: Active/Passive ROM degrees...', rows: 2 },
          { key: 'therapyPlan', label: 'Therapy Plan', type: 'textarea', placeholder: 'Short-term and long-term goals, modalities...', rows: 3 },
          { key: 'sessionCount', label: 'Session Count Tracking', type: 'text', placeholder: 'e.g., Session 5 of 12' },
          { key: 'progressNotes', label: 'Progress Notes', type: 'textarea', placeholder: 'Improvements, setbacks, modified plan...', rows: 3 },
        ]
      },
      {
        title: 'PT Prescription Notes',
        fields: [
          { key: 'exercisePrograms', label: 'Exercise Programs', type: 'textarea', placeholder: 'Exercises, sets, reps, frequency...', rows: 3 },
          { key: 'homeTherapyPrintout', label: 'Home Therapy Instructions', type: 'textarea', placeholder: 'Exercises, precautions, do/don\'t...', rows: 3 },
          { key: 'sessionFrequency', label: 'Session Frequency', type: 'text', placeholder: 'e.g., 3x/week for 6 weeks' },
        ]
      }
    ]
  },

  endocrinology: {
    label: 'Endocrinology / Diabetes',
    icon: '🩸',
    color: 'teal',
    matchTerms: ['endocrinolog', 'diabetes', 'thyroid', 'metabolic'],
    sections: [
      {
        title: 'Endocrinology Assessment',
        fields: [
          { key: 'hba1cTracking', label: 'HbA1c Tracking', type: 'textarea', placeholder: 'Date: HbA1c %, target, trend...', rows: 2 },
          { key: 'bloodSugarLogs', label: 'Blood Sugar Logs', type: 'textarea', placeholder: 'Fasting, pre-meal, post-meal, bedtime readings...', rows: 3 },
          { key: 'insulinDosing', label: 'Insulin Dosing', type: 'textarea', placeholder: 'Basal: units, bolus: correction factor, I:C ratio...', rows: 2 },
          { key: 'thyroidPanelResults', label: 'Thyroid Panel Results', type: 'textarea', placeholder: 'TSH, Free T3, Free T4, results and dates...', rows: 2 },
        ]
      },
      {
        title: 'Endocrinology Prescription Notes',
        fields: [
          { key: 'insulinSchedule', label: 'Insulin Schedule', type: 'textarea', placeholder: 'Type, units, timing, adjustments...', rows: 2 },
          { key: 'oralHypoglycemics', label: 'Oral Hypoglycemics', type: 'text', placeholder: 'e.g., Metformin 500mg BID, Glimepiride 2mg' },
          { key: 'lifestyleTracking', label: 'Lifestyle Tracking', type: 'textarea', placeholder: 'Diet plan, exercise goals, weight log...', rows: 2 },
        ]
      }
    ]
  },

  gastroenterology: {
    label: 'Gastroenterology',
    icon: '🧪',
    color: 'yellow',
    matchTerms: ['gastroenterolog', 'gastro', 'gi specialist', 'digestive'],
    sections: [
      {
        title: 'GI Assessment',
        fields: [
          { key: 'endoscopyReport', label: 'Endoscopy Report', type: 'textarea', placeholder: 'Findings, biopsies taken, diagnosis...', rows: 3 },
          { key: 'endoscopyUpload', label: 'Endoscopy Report Upload', type: 'file' },
          { key: 'colonoscopyPrepChecklist', label: 'Colonoscopy Prep Checklist', type: 'textarea', placeholder: 'Prep instructions, diet, timing of laxatives...', rows: 3 },
          { key: 'stoolTestResults', label: 'Stool Test Results', type: 'textarea', placeholder: 'Occult blood, calprotectin, culture results...', rows: 2 },
          { key: 'gerdHistory', label: 'GERD History', type: 'textarea', placeholder: 'Symptoms, triggers, response to treatment...', rows: 2 },
        ]
      },
      {
        title: 'GI Prescription Notes',
        fields: [
          { key: 'protonPumpInhibitors', label: 'Proton Pump Inhibitors', type: 'text', placeholder: 'e.g., Omeprazole 20mg, Pantoprazole 40mg' },
          { key: 'bowelPrepInstructions', label: 'Bowel Prep Instructions', type: 'textarea', placeholder: 'Step-by-step prep protocol...', rows: 3 },
        ]
      }
    ]
  },

  allergyImmunology: {
    label: 'Allergy & Immunology',
    icon: '🌿',
    color: 'emerald',
    matchTerms: ['allergy', 'immunolog', 'allergist'],
    sections: [
      {
        title: 'Allergy & Immunology Assessment',
        fields: [
          { key: 'allergyTestResults', label: 'Allergy Test Results', type: 'textarea', placeholder: 'Skin prick test, IgE levels, specific allergens...', rows: 3 },
          { key: 'triggerList', label: 'Trigger List', type: 'textarea', placeholder: 'Foods, environmental, medications, occupational...', rows: 2 },
          { key: 'immunotherapySchedule', label: 'Immunotherapy Schedule', type: 'textarea', placeholder: 'Build-up phase, maintenance dose, injection dates...', rows: 2 },
        ]
      },
      {
        title: 'Allergy Prescription Notes',
        fields: [
          { key: 'antihistamines', label: 'Antihistamines', type: 'text', placeholder: 'e.g., Cetirizine 10mg, Loratadine 10mg' },
          { key: 'epinephrineAutoInjector', label: 'Epinephrine Auto-injector', type: 'text', placeholder: 'e.g., EpiPen 0.3mg, carry at all times' },
          { key: 'immunotherapyRx', label: 'Immunotherapy Schedule Rx', type: 'textarea', placeholder: 'Allergen extract, concentration, dose progression...', rows: 2 },
        ]
      }
    ]
  },

  radiology: {
    label: 'Radiology / Imaging',
    icon: '📷',
    color: 'slate',
    matchTerms: ['radiolog', 'imaging', 'x-ray', 'mri', 'ct scan'],
    sections: [
      {
        title: 'Imaging Assessment',
        fields: [
          { key: 'imagingType', label: 'Imaging Type', type: 'select', options: ['', 'X-ray', 'MRI', 'CT Scan', 'Ultrasound', 'Fluoroscopy', 'PET Scan', 'Mammography', 'DEXA Scan'] },
          { key: 'referringPhysician', label: 'Referring Physician', type: 'text', placeholder: 'Dr. name, specialty' },
          { key: 'reportUpload', label: 'Report Upload', type: 'file' },
          { key: 'contrastUsed', label: 'Contrast Used', type: 'select', options: ['', 'None', 'IV Iodinated Contrast', 'Oral Contrast', 'Gadolinium (MRI)', 'Barium'] },
          { key: 'radiologyFindings', label: 'Findings / Report', type: 'textarea', placeholder: 'Detailed imaging findings and impression...', rows: 4 },
        ]
      }
    ]
  }
}

/**
 * Match a doctor's specialization string to one or more specialty configs.
 * Returns an array of matched specialty keys.
 */
export function matchSpecialties(specialization) {
  if (!specialization) return []
  const lower = specialization.toLowerCase()
  const matches = []

  for (const [key, config] of Object.entries(SPECIALTY_FIELDS)) {
    for (const term of config.matchTerms) {
      if (lower.includes(term)) {
        matches.push(key)
        break
      }
    }
  }

  return matches
}

/**
 * Get the config for a specific specialty key.
 */
export function getSpecialtyConfig(key) {
  return SPECIALTY_FIELDS[key] || null
}

/**
 * Get all available specialty keys and labels (for manual selection).
 */
export function getAllSpecialties() {
  return Object.entries(SPECIALTY_FIELDS).map(([key, config]) => ({
    key,
    label: config.label,
    icon: config.icon
  }))
}

export default SPECIALTY_FIELDS
