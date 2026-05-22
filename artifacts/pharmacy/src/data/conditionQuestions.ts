// Consumer (Consultation.tsx) needs migration to new question kinds — see session plan T003.
//
// Per-condition clinical questionnaire schemas for the patient pharmacy app.
// Data-only module. Strict types, no `any`. Single source of truth for clinical
// + eligibility questions used during the consultation flow.

export type QuestionKind =
  | 'radio'
  | 'yesno'
  | 'checkbox-multi'
  | 'number'
  | 'date'
  | 'text'
  | 'textarea'
  | 'select';

export interface QOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface BaseQuestion {
  id: string;
  text: string;
  subtext?: string;
  kind: QuestionKind;
  required?: boolean;
}

export interface RadioQuestion extends BaseQuestion {
  kind: 'radio';
  options: QOption[];
}

export interface YesNoQuestion extends BaseQuestion {
  kind: 'yesno';
}

export interface CheckboxMultiQuestion extends BaseQuestion {
  kind: 'checkbox-multi';
  options: QOption[];
  noneValue?: string;
}

export interface NumberQuestion extends BaseQuestion {
  kind: 'number';
  unit?: string;
  unitToggle?: { options: { value: string; label: string }[]; default: string };
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface DateQuestion extends BaseQuestion {
  kind: 'date';
  min?: string;
  max?: string;
}

export interface TextQuestion extends BaseQuestion {
  kind: 'text' | 'textarea';
  placeholder?: string;
  maxLength?: number;
}

export interface SelectQuestion extends BaseQuestion {
  kind: 'select';
  options: QOption[];
  placeholder?: string;
}

export type ClinicalQuestion =
  | RadioQuestion
  | YesNoQuestion
  | CheckboxMultiQuestion
  | NumberQuestion
  | DateQuestion
  | TextQuestion
  | SelectQuestion;

export type EligibilitySeverity = 'soft' | 'hard';

export interface EligibilityQuestion {
  id: string;
  text: string;
  subtext?: string;
  blockingAnswer: 'yes' | 'no';
  severity: EligibilitySeverity;
  blockMessage: string;
  blockTitle?: string;
}

export interface ConditionQuestionnaire {
  eligibilityQuestions: EligibilityQuestion[];
  clinicalQuestions: ClinicalQuestion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const softReview = (reason: string): string =>
  `Thanks for telling us. Because of ${reason}, our pharmacist will need to review this carefully before prescribing. You can still continue and we'll route it to a clinician — or change your answer if you've thought again.`;

// ─────────────────────────────────────────────────────────────────────────────
// Common eligibility templates
// ─────────────────────────────────────────────────────────────────────────────

const softPregnancy = (drugContext = 'this treatment'): EligibilityQuestion => ({
  id: 'pregnant_or_breastfeeding',
  text: 'Are you pregnant, trying to conceive, or breastfeeding?',
  blockingAnswer: 'yes',
  severity: 'soft',
  blockMessage: softReview(`${drugContext} needs careful review in pregnancy or while breastfeeding`),
  blockTitle: 'Pharmacist review needed',
});

// ─────────────────────────────────────────────────────────────────────────────
// Questionnaires
// ─────────────────────────────────────────────────────────────────────────────

const erectileDysfunction: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'chest_pain_now',
      text: 'Are you experiencing chest pain, severe breathlessness, or symptoms of a heart attack right now?',
      blockingAnswer: 'yes',
      severity: 'hard',
      blockMessage: 'Please call 999 or go to A&E immediately. Do not continue with this consultation.',
      blockTitle: 'Medical emergency',
    },
    {
      id: 'nitrates',
      text: 'Do you take any nitrate medicines (e.g. GTN spray, isosorbide mononitrate/dinitrate) for chest pain?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('PDE5 inhibitors are contraindicated with nitrates'),
    },
    {
      id: 'riociguat',
      text: 'Do you take riociguat (Adempas) for pulmonary hypertension?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('riociguat must not be combined with PDE5 inhibitors'),
    },
    {
      id: 'recent_cardiac_event',
      text: 'Have you had a heart attack, stroke, or unstable angina in the last 6 months?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('a recent cardiac event'),
    },
    {
      id: 'recreational_nitrates',
      text: 'Do you use recreational drugs such as amyl nitrate ("poppers")?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('amyl nitrate interacts dangerously with ED medicines'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'duration',
      text: 'How long have you been experiencing erection problems?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_3mo', label: 'Less than 3 months' },
        { value: '3_12mo', label: '3 – 12 months' },
        { value: '1_3yr', label: '1 – 3 years' },
        { value: 'over_3yr', label: 'More than 3 years' },
      ],
    },
    {
      id: 'onset',
      text: 'Did the problem come on gradually or suddenly?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'gradual', label: 'Gradually over weeks or months' },
        { value: 'sudden', label: 'Suddenly' },
      ],
    },
    {
      id: 'morning_erections',
      text: 'Do you still get spontaneous erections in the morning or at night?',
      kind: 'yesno',
      required: true,
    },
    {
      id: 'context',
      text: 'Does the difficulty seem more related to physical or psychological factors?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'physical', label: 'Mostly physical (always, in any situation)' },
        { value: 'psychological', label: 'Mostly psychological (varies with partner / stress)' },
        { value: 'mixed', label: 'A mix of both' },
        { value: 'unsure', label: 'Not sure' },
      ],
    },
    {
      id: 'previous_pde5',
      text: 'Have you taken ED medicines before (sildenafil, tadalafil, vardenafil, avanafil)?',
      kind: 'yesno',
    },
    {
      id: 'previous_pde5_which',
      text: 'If yes, which medicine(s) and dose worked best for you?',
      kind: 'text',
      placeholder: 'e.g. Sildenafil 100mg worked well',
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'sildenafil', label: 'Sildenafil (generic Viagra) — on-demand' },
        { value: 'tadalafil_prn', label: 'Tadalafil on-demand — works up to 36 hours' },
        { value: 'tadalafil_daily', label: 'Tadalafil daily 5mg — for spontaneity' },
        { value: 'vardenafil', label: 'Vardenafil (Levitra)' },
        { value: 'avanafil', label: 'Avanafil (Spedra) — fast onset' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'cv_conditions',
      text: 'Do you have any of the following cardiovascular conditions?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'high_bp', label: 'High blood pressure' },
        { value: 'angina', label: 'Angina (stable)' },
        { value: 'previous_mi', label: 'Previous heart attack (>6 months ago)' },
        { value: 'previous_stroke', label: 'Previous stroke (>6 months ago)' },
        { value: 'heart_failure', label: 'Heart failure' },
        { value: 'arrhythmia', label: 'Irregular heartbeat / arrhythmia' },
        { value: 'pulmonary_htn', label: 'Pulmonary hypertension' },
        { value: 'none', label: 'None of these' },
      ],
    },
    {
      id: 'systolic_bp',
      text: 'If you know it, what is your systolic blood pressure (top number)?',
      kind: 'number',
      unit: 'mmHg',
      min: 70,
      max: 250,
      placeholder: 'e.g. 128',
    },
    {
      id: 'diastolic_bp',
      text: 'If you know it, what is your diastolic blood pressure (bottom number)?',
      kind: 'number',
      unit: 'mmHg',
      min: 40,
      max: 150,
      placeholder: 'e.g. 82',
    },
    {
      id: 'alpha_blockers',
      text: 'Do you take an alpha-blocker (e.g. tamsulosin, doxazosin, alfuzosin) for prostate or blood pressure?',
      kind: 'yesno',
    },
    {
      id: 'current_meds',
      text: 'Please list any other prescription or over-the-counter medicines you take.',
      kind: 'textarea',
      placeholder: 'Include doses if you know them',
    },
    {
      id: 'allergies',
      text: 'Do you have any medicine allergies?',
      kind: 'text',
      placeholder: 'e.g. penicillin — rash',
    },
  ],
};

const prematureEjaculation: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'maoi',
      text: 'Are you taking a MAOI antidepressant (e.g. phenelzine, isocarboxazid, moclobemide, selegiline)?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('MAOIs interact dangerously with dapoxetine/SSRIs'),
    },
    {
      id: 'ssri',
      text: 'Are you currently taking an SSRI or SNRI antidepressant?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('combining serotonergic medicines can be risky'),
    },
    {
      id: 'fainting',
      text: 'Have you ever fainted, or do you have a history of orthostatic hypotension?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('dapoxetine can cause fainting in susceptible patients'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'duration',
      text: 'How long has premature ejaculation been a concern for you?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'lifelong', label: 'Since I became sexually active (lifelong)' },
        { value: 'over_1yr', label: 'Over a year' },
        { value: '6_12mo', label: '6 – 12 months' },
        { value: 'under_6mo', label: 'Less than 6 months' },
      ],
    },
    {
      id: 'ielt',
      text: 'On average, roughly how long from penetration to ejaculation?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_1', label: 'Less than 1 minute' },
        { value: '1_3', label: '1 – 3 minutes' },
        { value: '3_5', label: '3 – 5 minutes' },
        { value: 'over_5', label: 'More than 5 minutes (but still distressing)' },
      ],
    },
    {
      id: 'distress',
      text: 'How much distress does this cause you or your partner?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'mild', label: 'Mild' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'severe', label: 'Severe — significantly affects relationships or confidence' },
      ],
    },
    {
      id: 'previous_treatments',
      text: 'Have you tried any treatments for PE before?',
      kind: 'text',
      placeholder: 'e.g. lidocaine spray, dapoxetine 30mg',
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'dapoxetine', label: 'Dapoxetine (Priligy) — on-demand tablet' },
        { value: 'ssri', label: 'Off-label daily SSRI' },
        { value: 'lidocaine', label: 'Lidocaine/prilocaine spray or cream (topical)' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const hairLoss: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'female_or_trans_female',
      text: 'Were you assigned female at birth?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('finasteride is not licensed for female-pattern hair loss and needs specialist review'),
    },
    {
      id: 'prostate_cancer',
      text: 'Do you have, or have you had, prostate cancer?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('finasteride affects PSA monitoring in prostate cancer'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'onset_age',
      text: 'At what age did you first notice hair loss?',
      kind: 'number',
      min: 10,
      max: 100,
      unit: 'years',
      placeholder: 'e.g. 28',
    },
    {
      id: 'duration',
      text: 'How long have you been losing hair?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_6mo', label: 'Less than 6 months' },
        { value: '6_12mo', label: '6 – 12 months' },
        { value: '1_3yr', label: '1 – 3 years' },
        { value: 'over_3yr', label: 'Over 3 years' },
      ],
    },
    {
      id: 'pattern',
      text: 'Which pattern best describes your hair loss?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'receding', label: 'Receding hairline / temples' },
        { value: 'crown', label: 'Thinning at the crown' },
        { value: 'both', label: 'Both receding and crown thinning' },
        { value: 'diffuse', label: 'Diffuse thinning all over' },
      ],
    },
    {
      id: 'family_history',
      text: 'Is there a family history of male-pattern baldness?',
      kind: 'yesno',
    },
    {
      id: 'rate',
      text: 'Has the loss been gradual or sudden?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'gradual', label: 'Gradual' },
        { value: 'sudden', label: 'Sudden (over weeks)' },
      ],
    },
    {
      id: 'other_hair_changes',
      text: 'Have you noticed other body hair changes, beard thinning, or patchy bald spots?',
      kind: 'yesno',
    },
    {
      id: 'previous_treatments',
      text: 'Have you used finasteride or minoxidil before?',
      kind: 'yesno',
    },
    {
      id: 'previous_duration',
      text: 'If yes, which one(s) and for how long?',
      kind: 'text',
      placeholder: 'e.g. Minoxidil 5% topical for 8 months',
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'finasteride', label: 'Finasteride 1mg tablet' },
        { value: 'minoxidil', label: 'Minoxidil 5% topical' },
        { value: 'both', label: 'Both finasteride and minoxidil' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'prostate_issues',
      text: 'Do you have any known prostate issues (e.g. enlarged prostate)?',
      kind: 'yesno',
    },
    {
      id: 'allergies',
      text: 'Do you have any medicine allergies?',
      kind: 'text',
    },
    {
      id: 'photo_prompt',
      text: 'Please upload a clear photo of the affected area (top of head and hairline).',
      subtext: 'You will be prompted to upload at the end of this consultation.',
      kind: 'textarea',
      placeholder: 'Any extra context about your photos (optional)',
    },
  ],
};

const acneVulgaris: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'isotretinoin',
      text: 'Are you currently taking, or have you taken isotretinoin (Roaccutane) in the last 6 months?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('recent isotretinoin requires dermatology follow-up'),
    },
    softPregnancy('acne treatments such as retinoids and some antibiotics'),
  ],
  clinicalQuestions: [
    {
      id: 'duration',
      text: 'How long have you been experiencing acne?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_3mo', label: 'Less than 3 months' },
        { value: '3_12mo', label: '3 – 12 months' },
        { value: '1_3yr', label: '1 – 3 years' },
        { value: 'over_3yr', label: 'Over 3 years' },
      ],
    },
    {
      id: 'severity',
      text: 'How would you rate your acne overall?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'mild', label: 'Mild — mostly blackheads/whiteheads, a few spots' },
        { value: 'moderate', label: 'Moderate — many inflamed spots, some pus-filled' },
        { value: 'severe', label: 'Severe — widespread, painful nodules or cysts' },
      ],
    },
    {
      id: 'location',
      text: 'Where is your acne located?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'face', label: 'Face' },
        { value: 'back', label: 'Back' },
        { value: 'chest', label: 'Chest' },
        { value: 'shoulders', label: 'Shoulders' },
        { value: 'neck', label: 'Neck' },
      ],
    },
    {
      id: 'previous_treatments',
      text: 'Which acne treatments have you tried?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'benzoyl_peroxide', label: 'Benzoyl peroxide' },
        { value: 'topical_retinoid', label: 'Topical retinoid (e.g. adapalene, tretinoin)' },
        { value: 'topical_antibiotic', label: 'Topical antibiotic (e.g. clindamycin)' },
        { value: 'oral_antibiotic', label: 'Oral antibiotic (e.g. lymecycline, doxycycline)' },
        { value: 'cocp', label: 'Combined contraceptive pill (for acne)' },
        { value: 'none', label: 'None of these' },
      ],
    },
    {
      id: 'scarring',
      text: 'Has your acne caused any scarring?',
      kind: 'yesno',
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'topical_only', label: 'Topical only (gel/cream)' },
        { value: 'topical_combo', label: 'Topical combination (e.g. adapalene + benzoyl peroxide)' },
        { value: 'oral_antibiotic', label: 'Oral antibiotic + topical' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'photo_prompt',
      text: 'Please upload clear photos of the affected areas.',
      subtext: 'You will be prompted to upload at the end of this consultation.',
      kind: 'textarea',
      placeholder: 'Any extra context (optional)',
    },
  ],
};

const cystitis: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'male_at_birth',
      text: 'Were you assigned male at birth?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('UTIs in men require a pharmacist to confirm differential diagnosis'),
    },
    {
      id: 'fever_high',
      text: 'Do you have a temperature of 38°C or higher, or feel shivery/very unwell?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('these symptoms may suggest the infection has reached the kidneys'),
    },
    {
      id: 'flank_pain',
      text: 'Do you have pain in your back/flank, or feel nauseous or have been vomiting?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('upper-tract symptoms need careful pharmacist review'),
    },
    {
      id: 'pregnancy_possible',
      text: 'Is there any chance you could be pregnant?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('several UTI antibiotics need to be avoided in pregnancy'),
    },
    {
      id: 'kidney_disease',
      text: 'Do you have moderate or severe kidney disease (eGFR < 45)?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('nitrofurantoin must be avoided in reduced kidney function'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'age_band',
      text: 'Are you aged between 16 and 65?',
      kind: 'yesno',
      required: true,
    },
    {
      id: 'symptoms',
      text: 'Which symptoms do you have?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'dysuria', label: 'Burning or stinging when you wee' },
        { value: 'frequency', label: 'Needing to wee more often' },
        { value: 'urgency', label: 'Sudden urgent need to wee' },
        { value: 'suprapubic', label: 'Lower tummy pain or pressure' },
        { value: 'cloudy', label: 'Cloudy urine' },
        { value: 'smelly', label: 'Strong-smelling urine' },
        { value: 'blood', label: 'Blood in urine' },
      ],
    },
    {
      id: 'duration',
      text: 'How long have you had these symptoms?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_48h', label: 'Less than 48 hours' },
        { value: '2_7d', label: '2 – 7 days' },
        { value: 'over_7d', label: 'More than 7 days' },
      ],
    },
    {
      id: 'recurrent',
      text: 'Have you had 3 or more UTIs in the last year?',
      kind: 'yesno',
    },
    {
      id: 'recent_antibiotic',
      text: 'Have you taken an antibiotic for a UTI in the last 6 weeks?',
      kind: 'yesno',
    },
    {
      id: 'preferred_antibiotic',
      text: 'Which antibiotic would you prefer (if suitable)?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'nitrofurantoin', label: 'Nitrofurantoin 100mg (3-day course)' },
        { value: 'trimethoprim', label: 'Trimethoprim 200mg (3-day course)' },
        { value: 'fosfomycin', label: 'Fosfomycin 3g (single dose)' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'penicillin_allergy',
      text: 'Are you allergic to penicillin or any other antibiotic?',
      kind: 'yesno',
    },
  ],
};

const allergicRhinitis: ConditionQuestionnaire = {
  eligibilityQuestions: [
    softPregnancy('some hay fever treatments'),
    {
      id: 'severe_asthma',
      text: 'Do you have severe or poorly-controlled asthma?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('uncontrolled asthma needs review before adding new treatments'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'age',
      text: 'How old are you?',
      kind: 'number',
      min: 0,
      max: 120,
      unit: 'years',
      required: true,
    },
    {
      id: 'triggers',
      text: 'What triggers your symptoms?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'pollen', label: 'Pollen (grass, tree, weed)' },
        { value: 'dust', label: 'House dust / dust mites' },
        { value: 'pets', label: 'Pets / animal dander' },
        { value: 'mould', label: 'Mould' },
        { value: 'unknown', label: 'Not sure / unknown' },
      ],
    },
    {
      id: 'symptoms',
      text: 'Which symptoms do you have?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'sneezing', label: 'Sneezing' },
        { value: 'runny_nose', label: 'Runny nose' },
        { value: 'blocked_nose', label: 'Blocked nose' },
        { value: 'itchy_eyes', label: 'Itchy / watery eyes' },
        { value: 'post_nasal_drip', label: 'Post-nasal drip / cough' },
      ],
    },
    {
      id: 'duration_year',
      text: 'How long have your symptoms been bothering you this year?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_2wk', label: 'Less than 2 weeks' },
        { value: '2_8wk', label: '2 – 8 weeks' },
        { value: 'over_8wk', label: 'Over 2 months' },
      ],
    },
    {
      id: 'severity',
      text: 'How severe are your symptoms?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'mild', label: 'Mild — annoying but manageable' },
        { value: 'moderate', label: 'Moderate — affects work or sleep' },
        { value: 'severe', label: 'Severe — stops normal activities' },
      ],
    },
    {
      id: 'previous_treatments',
      text: 'Which treatments have you already tried?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'oral_antihistamine', label: 'OTC oral antihistamine (cetirizine, loratadine)' },
        { value: 'nasal_steroid', label: 'Nasal corticosteroid spray' },
        { value: 'eye_drops', label: 'Antihistamine eye drops' },
        { value: 'none', label: 'None of these' },
      ],
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'oral_antihistamine', label: 'Stronger oral antihistamine (e.g. fexofenadine)' },
        { value: 'nasal_steroid', label: 'Nasal corticosteroid spray' },
        { value: 'eye_drops', label: 'Eye drops' },
        { value: 'combination', label: 'Combination' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const periodDelay: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'on_cocp',
      text: 'Are you currently taking the combined contraceptive pill?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('there are better ways to delay your period if you are on the COCP — our pharmacist can advise'),
    },
    {
      id: 'pregnant_possible',
      text: 'Is there any chance you could be pregnant?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('pregnancy needs to be ruled out before prescribing'),
    },
    {
      id: 'dvt_pe',
      text: 'Have you ever had a DVT, pulmonary embolism, or other blood clot?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('norethisterone has clot risk and needs careful review'),
    },
    {
      id: 'breast_cancer',
      text: 'Do you have, or have you ever had, breast cancer?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('hormone treatments need specialist review with a personal cancer history'),
    },
    {
      id: 'liver_disease',
      text: 'Do you have liver disease?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('norethisterone is metabolised by the liver'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'expected_period_date',
      text: 'When is your next period expected to start?',
      kind: 'date',
      required: true,
    },
    {
      id: 'days_to_delay',
      text: 'How many days would you like to delay your period?',
      kind: 'radio',
      required: true,
      options: [
        { value: '3', label: '3 days' },
        { value: '5', label: '5 days' },
        { value: '7', label: '7 days' },
        { value: '10', label: '10 days' },
        { value: '14', label: '14 days' },
        { value: '17', label: '17 days (maximum)' },
      ],
    },
    {
      id: 'reason',
      text: 'What is the reason for delaying?',
      kind: 'select',
      placeholder: 'Choose one',
      options: [
        { value: 'holiday', label: 'Holiday' },
        { value: 'event', label: 'Wedding or special event' },
        { value: 'exam', label: 'Exam' },
        { value: 'sport', label: 'Sport / competition' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'regular_cycles',
      text: 'Are your periods usually regular?',
      kind: 'yesno',
      required: true,
    },
    {
      id: 'smoker',
      text: 'Do you smoke?',
      kind: 'yesno',
    },
    {
      id: 'cigarettes_per_day',
      text: 'If yes, how many cigarettes per day?',
      kind: 'number',
      min: 0,
      max: 60,
      placeholder: 'e.g. 10',
    },
    {
      id: 'height',
      text: 'What is your height?',
      kind: 'number',
      unit: 'cm',
      unitToggle: {
        options: [
          { value: 'cm', label: 'cm' },
          { value: 'ft_in', label: 'ft/in' },
        ],
        default: 'cm',
      },
      min: 120,
      max: 230,
    },
    {
      id: 'weight',
      text: 'What is your weight?',
      kind: 'number',
      unit: 'kg',
      unitToggle: {
        options: [
          { value: 'kg', label: 'kg' },
          { value: 'lb', label: 'lb' },
        ],
        default: 'kg',
      },
      min: 30,
      max: 250,
    },
  ],
};

const emergencyContraception: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'over_120h',
      text: 'Has it been more than 120 hours (5 days) since unprotected sex?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('oral emergency contraception is less effective beyond 120 hours — a copper IUD may be required'),
    },
    {
      id: 'already_pregnant',
      text: 'Could you already be pregnant from before this episode?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('emergency contraception will not work if you are already pregnant'),
    },
    {
      id: 'enzyme_inducer',
      text: 'Do you take liver enzyme-inducing medicines (e.g. carbamazepine, phenytoin, rifampicin, St John\'s Wort)?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('these reduce the effectiveness of oral emergency contraception'),
    },
    {
      id: 'severe_asthma',
      text: 'Do you have severe asthma controlled by oral steroids?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('ulipristal acetate is cautioned in severe steroid-dependent asthma'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'hours_since',
      text: 'How long ago was the unprotected sex?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_72', label: 'Less than 72 hours' },
        { value: '72_120', label: '72 – 120 hours' },
        { value: 'over_120', label: 'More than 120 hours' },
      ],
    },
    {
      id: 'date_upsi',
      text: 'On what date did unprotected sex happen?',
      kind: 'date',
      required: true,
    },
    {
      id: 'regular_cycle',
      text: 'Are your periods usually regular?',
      kind: 'yesno',
      required: true,
    },
    {
      id: 'last_period',
      text: 'When did your last period start?',
      kind: 'date',
      required: true,
    },
    {
      id: 'current_contraception',
      text: 'What contraception (if any) are you currently using?',
      kind: 'select',
      placeholder: 'Choose one',
      options: [
        { value: 'none', label: 'None' },
        { value: 'condoms', label: 'Condoms' },
        { value: 'cocp', label: 'Combined pill' },
        { value: 'pop', label: 'Progestogen-only pill' },
        { value: 'iud', label: 'Copper IUD' },
        { value: 'ius', label: 'Hormonal IUS' },
        { value: 'implant', label: 'Implant' },
        { value: 'injection', label: 'Injection' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'weight',
      text: 'What is your weight?',
      kind: 'number',
      unit: 'kg',
      min: 30,
      max: 250,
      required: true,
    },
    {
      id: 'preferred',
      text: 'Which option would you prefer (if suitable)?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'levonorgestrel', label: 'Levonorgestrel 1.5mg (effective up to 72h)' },
        { value: 'ulipristal', label: 'Ulipristal acetate 30mg (ellaOne, effective up to 120h)' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'allergies',
      text: 'Do you have any medicine allergies?',
      kind: 'text',
    },
  ],
};

const chlamydia: ConditionQuestionnaire = {
  eligibilityQuestions: [
    softPregnancy('doxycycline is contraindicated in pregnancy'),
    {
      id: 'severe_pelvic',
      text: 'Do you have severe pelvic pain or a fever?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('these may indicate pelvic inflammatory disease which needs urgent review'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'test_date',
      text: 'When did you have the positive chlamydia test?',
      kind: 'date',
      required: true,
    },
    {
      id: 'test_type',
      text: 'Where did you get the test?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'home', label: 'Home self-test kit' },
        { value: 'clinic', label: 'GP / sexual health clinic' },
      ],
    },
    {
      id: 'symptoms',
      text: 'Do you have any current symptoms?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'discharge', label: 'Unusual discharge' },
        { value: 'dysuria', label: 'Pain on weeing' },
        { value: 'pelvic_pain', label: 'Mild pelvic pain' },
        { value: 'bleeding', label: 'Bleeding between periods or after sex' },
        { value: 'none', label: 'No symptoms' },
      ],
    },
    {
      id: 'partners_notified',
      text: 'Have your recent sexual partners been notified so they can also test/treat?',
      kind: 'yesno',
      required: true,
    },
    {
      id: 'allergy',
      text: 'Are you allergic to penicillin or macrolide antibiotics (e.g. erythromycin, azithromycin)?',
      kind: 'yesno',
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer (if suitable)?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'doxycycline', label: 'Doxycycline 100mg twice daily for 7 days (first line)' },
        { value: 'azithromycin', label: 'Azithromycin 1g single dose then 500mg daily for 2 days' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const genitalHerpes: ConditionQuestionnaire = {
  eligibilityQuestions: [
    softPregnancy('genital herpes in pregnancy needs specialist input near term'),
    {
      id: 'kidney_disease',
      text: 'Do you have moderate or severe kidney disease?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('antiviral doses may need adjusting in kidney disease'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'previously_diagnosed',
      text: 'Have you been diagnosed with genital herpes before?',
      kind: 'yesno',
      required: true,
    },
    {
      id: 'treatment_type',
      text: 'What kind of treatment do you need today?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'first', label: 'First outbreak' },
        { value: 'recurrent', label: 'Treatment for a recurrent flare' },
        { value: 'suppressive', label: 'Daily suppressive treatment' },
      ],
    },
    {
      id: 'outbreaks_per_year',
      text: 'How many outbreaks have you had in the past year?',
      kind: 'radio',
      required: true,
      options: [
        { value: '0_1', label: '0 – 1' },
        { value: '2', label: '2' },
        { value: '3_5', label: '3 – 5' },
        { value: '6_plus', label: '6 or more' },
      ],
    },
    {
      id: 'symptoms',
      text: 'What symptoms do you have right now?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'blisters', label: 'Blisters or sores' },
        { value: 'pain', label: 'Pain or tingling' },
        { value: 'dysuria', label: 'Pain on weeing' },
        { value: 'fever', label: 'Fever or flu-like symptoms' },
        { value: 'none', label: 'No symptoms (suppressive only)' },
      ],
    },
    {
      id: 'preferred_medicine',
      text: 'Which medicine would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'aciclovir', label: 'Aciclovir' },
        { value: 'valaciclovir', label: 'Valaciclovir' },
        { value: 'famciclovir', label: 'Famciclovir' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const acidReflux: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'red_flags',
      text: 'Do you have any of: unintentional weight loss, difficulty swallowing, vomiting blood, or black/tarry stools?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('these alarm symptoms need urgent assessment'),
    },
    {
      id: 'duration_long',
      text: 'Have your symptoms lasted more than 8 weeks despite OTC treatment?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('persistent symptoms need pharmacist or GP review'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'frequency',
      text: 'How often do you get heartburn/reflux symptoms?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_2wk', label: 'Less than 2 times a week' },
        { value: '2_4wk', label: '2 – 4 times a week' },
        { value: 'daily', label: 'Daily or almost daily' },
      ],
    },
    {
      id: 'duration',
      text: 'How long have you had these symptoms?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_4wk', label: 'Less than 4 weeks' },
        { value: '4_8wk', label: '4 – 8 weeks' },
        { value: 'over_8wk', label: 'More than 8 weeks' },
      ],
    },
    {
      id: 'triggers_known',
      text: 'Have you identified any trigger foods or drinks?',
      kind: 'yesno',
    },
    {
      id: 'triggers_detail',
      text: 'If yes, which ones?',
      kind: 'textarea',
      placeholder: 'e.g. spicy food, alcohol, coffee, fatty meals',
    },
    {
      id: 'lifestyle',
      text: 'Which lifestyle changes have you tried?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'smaller_meals', label: 'Smaller, more frequent meals' },
        { value: 'avoid_late', label: 'Avoiding eating late at night' },
        { value: 'raise_bed', label: 'Raising the head of the bed' },
        { value: 'lose_weight', label: 'Losing weight' },
        { value: 'reduce_alcohol', label: 'Reducing alcohol/coffee' },
        { value: 'stop_smoking', label: 'Stopping smoking' },
        { value: 'none', label: 'None of these' },
      ],
    },
    {
      id: 'otc_tried',
      text: 'Have you tried OTC PPI/H2 medicines?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'not_tried', label: 'Not tried' },
        { value: 'under_2wk', label: 'Tried for less than 2 weeks' },
        { value: '2_4wk', label: 'Tried for 2 – 4 weeks' },
      ],
    },
    {
      id: 'preferred_medicine',
      text: 'Which medicine would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'omeprazole_20', label: 'Omeprazole 20mg' },
        { value: 'esomeprazole_20', label: 'Esomeprazole 20mg' },
        { value: 'lansoprazole_30', label: 'Lansoprazole 30mg' },
        { value: 'pantoprazole_40', label: 'Pantoprazole 40mg' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'aspirin_nsaid',
      text: 'Do you take aspirin, an NSAID (e.g. ibuprofen, naproxen), or clopidogrel?',
      kind: 'yesno',
    },
  ],
};

const migraine: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'gp_diagnosed',
      text: 'Has your migraine been formally diagnosed by a GP?',
      blockingAnswer: 'no',
      severity: 'soft',
      blockMessage: softReview('a confirmed migraine diagnosis is needed before triptan prescribing'),
    },
    softPregnancy('triptans need careful review in pregnancy'),
    {
      id: 'severe_liver_kidney',
      text: 'Do you have severe liver or kidney disease?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('triptan dosing needs adjusting in severe organ disease'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'age',
      text: 'How old are you?',
      kind: 'number',
      min: 12,
      max: 100,
      unit: 'years',
      required: true,
    },
    {
      id: 'aura_type',
      text: 'Do you experience aura before or with your migraine?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'none', label: 'No aura' },
        { value: 'visual', label: 'Typical visual aura (zigzags, flashing lights)' },
        { value: 'sensory', label: 'Sensory aura (tingling/numbness)' },
        { value: 'motor', label: 'Motor weakness (hemiplegic)' },
        { value: 'brainstem', label: 'Brainstem aura (vertigo, double vision, slurred speech)' },
      ],
    },
    {
      id: 'monthly_frequency',
      text: 'How many migraine attacks do you typically have per month?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_1', label: 'Less than 1' },
        { value: '1_3', label: '1 – 3' },
        { value: '4_8', label: '4 – 8' },
        { value: 'over_8', label: 'More than 8' },
      ],
    },
    {
      id: 'preferred_triptan',
      text: 'Which triptan would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'sumatriptan', label: 'Sumatriptan 50mg/100mg' },
        { value: 'rizatriptan', label: 'Rizatriptan 10mg' },
        { value: 'zolmitriptan', label: 'Zolmitriptan 2.5mg' },
        { value: 'almotriptan', label: 'Almotriptan 12.5mg' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'cv_conditions',
      text: 'Do you have any of the following?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'ihd', label: 'Ischaemic heart disease / angina' },
        { value: 'uncontrolled_htn', label: 'Uncontrolled high blood pressure' },
        { value: 'pvd', label: 'Peripheral vascular disease' },
        { value: 'recent_mi', label: 'Heart attack in the last 6 months' },
        { value: 'previous_stroke', label: 'Previous stroke or TIA' },
        { value: 'none', label: 'None of these' },
      ],
    },
    {
      id: 'ssri',
      text: 'Are you taking an SSRI/SNRI antidepressant?',
      kind: 'yesno',
    },
    {
      id: 'ssri_which',
      text: 'If yes, which one?',
      kind: 'text',
    },
  ],
};

const smokingCessation: ConditionQuestionnaire = {
  eligibilityQuestions: [
    softPregnancy('NRT in pregnancy needs review and some treatments (varenicline, bupropion) are contraindicated'),
    {
      id: 'recent_cardiac',
      text: 'Have you had a heart attack, stroke, or unstable angina in the last 4 weeks?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('recent cardiovascular events need pharmacist review before NRT'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'cigarettes_per_day',
      text: 'How many cigarettes do you smoke per day?',
      kind: 'number',
      min: 1,
      max: 80,
      required: true,
    },
    {
      id: 'years_smoking',
      text: 'How many years have you been smoking?',
      kind: 'number',
      min: 0,
      max: 80,
      unit: 'years',
      required: true,
    },
    {
      id: 'first_cigarette_30min',
      text: 'Do you smoke your first cigarette within 30 minutes of waking?',
      kind: 'yesno',
      required: true,
    },
    {
      id: 'previous_attempts',
      text: 'How many serious quit attempts have you made before?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'none', label: 'None' },
        { value: '1_2', label: '1 – 2' },
        { value: '3_plus', label: '3 or more' },
      ],
    },
    {
      id: 'preferred_therapy',
      text: 'Which therapy would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'patches', label: 'Nicotine patches' },
        { value: 'gum', label: 'Nicotine gum' },
        { value: 'lozenge', label: 'Nicotine lozenges' },
        { value: 'inhalator', label: 'Inhalator' },
        { value: 'varenicline', label: 'Varenicline (Champix)' },
        { value: 'bupropion', label: 'Bupropion (Zyban)' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'current_meds',
      text: 'Please list any medicines you currently take.',
      kind: 'textarea',
    },
  ],
};

const athletesFoot: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'diabetic',
      text: 'Do you have diabetes?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('foot infections in diabetes need careful review'),
    },
    {
      id: 'immunosuppressed',
      text: 'Do you have a weakened immune system (e.g. chemotherapy, transplant, HIV, high-dose steroids)?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('immunosuppression changes infection management'),
    },
    {
      id: 'nails_involved',
      text: 'Are your toenails also affected (yellow, thick, crumbly)?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('nail involvement needs a different treatment — our pharmacist can route you'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'duration',
      text: 'How long have you had athlete\'s foot?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_1wk', label: 'Less than 1 week' },
        { value: '1_4wk', label: '1 – 4 weeks' },
        { value: '1_3mo', label: '1 – 3 months' },
        { value: 'over_3mo', label: 'Over 3 months' },
      ],
    },
    {
      id: 'symptoms',
      text: 'Which of these symptoms do you have?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'itching', label: 'Itching' },
        { value: 'scaling', label: 'Scaling / flaking' },
        { value: 'cracks', label: 'Cracks in the skin' },
        { value: 'blisters', label: 'Blisters' },
        { value: 'smell', label: 'Unpleasant smell' },
        { value: 'between_toes', label: 'Affects between the toes' },
        { value: 'sole', label: 'Affects the sole of the foot' },
      ],
    },
    {
      id: 'tried_otc',
      text: 'Have you tried an OTC topical antifungal already?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'not_tried', label: 'Not tried' },
        { value: '1_2wk', label: 'Tried for 1 – 2 weeks' },
        { value: 'over_2wk', label: 'Tried for more than 2 weeks' },
      ],
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'terbinafine', label: 'Terbinafine cream' },
        { value: 'clotrimazole', label: 'Clotrimazole cream' },
        { value: 'miconazole', label: 'Miconazole cream' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const jetLag: ConditionQuestionnaire = {
  eligibilityQuestions: [
    softPregnancy('melatonin in pregnancy is not recommended'),
    {
      id: 'epilepsy',
      text: 'Do you have epilepsy?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('melatonin can interact with seizure medicines'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'age',
      text: 'How old are you?',
      kind: 'number',
      min: 0,
      max: 120,
      unit: 'years',
      required: true,
    },
    {
      id: 'time_diff',
      text: 'How many hours time difference at your destination?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_3', label: 'Less than 3 hours' },
        { value: '3_6', label: '3 – 6 hours' },
        { value: '6_12', label: '6 – 12 hours' },
        { value: 'over_12', label: 'More than 12 hours' },
      ],
    },
    {
      id: 'travel_date',
      text: 'When do you travel?',
      kind: 'date',
      required: true,
    },
    {
      id: 'trip_duration',
      text: 'How long is your trip?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_3', label: 'Less than 3 days' },
        { value: '3_7', label: '3 – 7 days' },
        { value: 'over_7', label: 'More than 7 days' },
      ],
    },
    {
      id: 'preferred',
      text: 'Which would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'melatonin', label: 'Melatonin (prescription)' },
        { value: 'advice_only', label: 'Sleep & light advice only' },
      ],
    },
  ],
};

const bacterialVaginosis: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'male_at_birth',
      text: 'Were you assigned male at birth?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('BV affects people with a vagina — please check with our pharmacist'),
    },
    softPregnancy('BV in pregnancy needs special attention'),
  ],
  clinicalQuestions: [
    {
      id: 'symptoms',
      text: 'Which symptoms do you have?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'thin_grey_discharge', label: 'Thin, grey or watery discharge' },
        { value: 'fishy_odour', label: 'Fishy odour (especially after sex)' },
        { value: 'itch', label: 'Itching' },
        { value: 'burning', label: 'Burning' },
      ],
    },
    {
      id: 'previous_episodes',
      text: 'How many BV episodes have you had in the past year?',
      kind: 'radio',
      required: true,
      options: [
        { value: '0', label: 'None — first episode' },
        { value: '1_2', label: '1 – 2' },
        { value: '3_plus', label: '3 or more (recurrent)' },
      ],
    },
    {
      id: 'previous_treatments',
      text: 'Which BV treatments have you used before?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'oral_metronidazole', label: 'Oral metronidazole' },
        { value: 'gel_metronidazole', label: 'Metronidazole vaginal gel' },
        { value: 'clindamycin_cream', label: 'Clindamycin cream' },
        { value: 'lactic_acid', label: 'Lactic acid gel' },
        { value: 'none', label: 'None of these' },
      ],
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'metronidazole_oral', label: 'Metronidazole oral tablets' },
        { value: 'metronidazole_gel', label: 'Metronidazole vaginal gel' },
        { value: 'clindamycin_cream', label: 'Clindamycin cream' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
    {
      id: 'alcohol_during',
      text: 'Will you be able to avoid alcohol during treatment (relevant for metronidazole)?',
      kind: 'yesno',
    },
    {
      id: 'penicillin_allergy',
      text: 'Are you allergic to any antibiotics?',
      kind: 'yesno',
    },
  ],
};

const rosacea: ConditionQuestionnaire = {
  eligibilityQuestions: [
    softPregnancy('some rosacea treatments (e.g. ivermectin, doxycycline) need review in pregnancy'),
  ],
  clinicalQuestions: [
    {
      id: 'subtype',
      text: 'Which subtype best describes your rosacea?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'erythematotelangiectatic', label: 'Persistent redness and visible vessels' },
        { value: 'papulopustular', label: 'Spots and pustules (acne-like)' },
        { value: 'ocular', label: 'Eye symptoms (dry, gritty, red eyes)' },
        { value: 'phymatous', label: 'Skin thickening (e.g. nose)' },
        { value: 'unsure', label: 'Not sure' },
      ],
    },
    {
      id: 'triggers',
      text: 'Which triggers make your rosacea worse?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'sun', label: 'Sun' },
        { value: 'heat', label: 'Heat / hot drinks' },
        { value: 'spicy', label: 'Spicy food' },
        { value: 'alcohol', label: 'Alcohol' },
        { value: 'stress', label: 'Stress' },
        { value: 'exercise', label: 'Exercise' },
        { value: 'skincare', label: 'Certain skincare products' },
        { value: 'none', label: 'No clear triggers' },
      ],
    },
    {
      id: 'severity',
      text: 'How severe is your rosacea?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'mild', label: 'Mild' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'severe', label: 'Severe' },
      ],
    },
    {
      id: 'previous_treatments',
      text: 'Which treatments have you tried?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'metronidazole_cream', label: 'Metronidazole cream/gel' },
        { value: 'ivermectin', label: 'Ivermectin (Soolantra)' },
        { value: 'azelaic_acid', label: 'Azelaic acid' },
        { value: 'brimonidine', label: 'Brimonidine gel (Mirvaso)' },
        { value: 'oral_antibiotic', label: 'Oral antibiotic (e.g. doxycycline)' },
        { value: 'none', label: 'None of these' },
      ],
    },
    {
      id: 'photo_prompt',
      text: 'Please upload clear photos of your face in natural light.',
      subtext: 'You will be prompted to upload at the end of this consultation.',
      kind: 'textarea',
      placeholder: 'Any extra context (optional)',
    },
  ],
};

const nailInfection: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'gp_confirmed',
      text: 'Has the infection been confirmed by a GP or nail scraping?',
      blockingAnswer: 'no',
      severity: 'soft',
      blockMessage: softReview('confirming fungal infection avoids treating a different problem'),
    },
    {
      id: 'diabetic',
      text: 'Do you have diabetes?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('nail infections in diabetes need closer follow-up'),
    },
    {
      id: 'liver_disease',
      text: 'Do you have liver disease?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('oral terbinafine is metabolised by the liver'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'nails_affected',
      text: 'How many nails are affected?',
      kind: 'number',
      min: 1,
      max: 20,
      required: true,
    },
    {
      id: 'location',
      text: 'Where are the affected nails?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'toenails', label: 'Toenails only' },
        { value: 'fingernails', label: 'Fingernails only' },
        { value: 'both', label: 'Both' },
      ],
    },
    {
      id: 'duration',
      text: 'How long have the nails been affected?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_3mo', label: 'Less than 3 months' },
        { value: '3_12mo', label: '3 – 12 months' },
        { value: 'over_1yr', label: 'More than a year' },
      ],
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'amorolfine', label: 'Amorolfine 5% nail lacquer (topical)' },
        { value: 'terbinafine_oral', label: 'Terbinafine oral tablets' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const genitalWarts: ConditionQuestionnaire = {
  eligibilityQuestions: [
    softPregnancy('podophyllotoxin and imiquimod need review in pregnancy'),
    {
      id: 'internal',
      text: 'Are any warts internal (inside the vagina, urethra or rectum)?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('internal warts need clinic-based treatment'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'duration',
      text: 'How long have you had the warts?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_1mo', label: 'Less than 1 month' },
        { value: '1_3mo', label: '1 – 3 months' },
        { value: 'over_3mo', label: 'More than 3 months' },
      ],
    },
    {
      id: 'location',
      text: 'Where are the warts?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'penis', label: 'Penis / scrotum' },
        { value: 'vulva', label: 'Vulva' },
        { value: 'perianal', label: 'Around the anus' },
        { value: 'groin', label: 'Groin / thigh' },
      ],
    },
    {
      id: 'count',
      text: 'Roughly how many warts do you have?',
      kind: 'number',
      min: 1,
      max: 100,
    },
    {
      id: 'size_mm',
      text: 'What is the size of the largest wart?',
      kind: 'number',
      unit: 'mm',
      min: 1,
      max: 50,
    },
    {
      id: 'previous_treatments',
      text: 'Which treatments have you tried before?',
      kind: 'checkbox-multi',
      noneValue: 'none',
      options: [
        { value: 'podophyllotoxin', label: 'Podophyllotoxin (Warticon/Condyline)' },
        { value: 'imiquimod', label: 'Imiquimod (Aldara)' },
        { value: 'cryotherapy', label: 'Cryotherapy / freezing' },
        { value: 'none', label: 'None of these' },
      ],
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'podophyllotoxin', label: 'Podophyllotoxin solution/cream' },
        { value: 'imiquimod', label: 'Imiquimod cream' },
        { value: 'cryotherapy_referral', label: 'Refer for cryotherapy at a clinic' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const antiMalaria: ConditionQuestionnaire = {
  eligibilityQuestions: [
    softPregnancy('antimalarial choice depends on trimester and destination'),
    {
      id: 'epilepsy',
      text: 'Do you have epilepsy?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('mefloquine is contraindicated in epilepsy'),
    },
    {
      id: 'psychiatric',
      text: 'Do you have a history of depression, anxiety or psychosis?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('mefloquine can worsen mental health conditions'),
    },
    {
      id: 'g6pd',
      text: 'Do you have G6PD deficiency?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('some antimalarials (primaquine) are unsafe in G6PD deficiency'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'destination',
      text: 'Which country are you travelling to?',
      kind: 'select',
      placeholder: 'Choose country',
      required: true,
      options: [
        { value: 'india', label: 'India' },
        { value: 'thailand', label: 'Thailand' },
        { value: 'kenya', label: 'Kenya' },
        { value: 'tanzania', label: 'Tanzania' },
        { value: 'south_africa', label: 'South Africa' },
        { value: 'nigeria', label: 'Nigeria' },
        { value: 'gambia', label: 'The Gambia' },
        { value: 'ghana', label: 'Ghana' },
        { value: 'uganda', label: 'Uganda' },
        { value: 'indonesia', label: 'Indonesia' },
        { value: 'vietnam', label: 'Vietnam' },
        { value: 'cambodia', label: 'Cambodia' },
        { value: 'brazil', label: 'Brazil' },
        { value: 'peru', label: 'Peru' },
        { value: 'mexico', label: 'Mexico' },
        { value: 'other', label: 'Other (please tell us)' },
      ],
    },
    {
      id: 'travel_start',
      text: 'When does your trip start?',
      kind: 'date',
      required: true,
    },
    {
      id: 'trip_length',
      text: 'How many days will you be in the malaria zone?',
      kind: 'number',
      unit: 'days',
      min: 1,
      max: 365,
      required: true,
    },
    {
      id: 'preferred',
      text: 'Which antimalarial would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'atovaquone_proguanil', label: 'Atovaquone/proguanil (Malarone)' },
        { value: 'doxycycline', label: 'Doxycycline' },
        { value: 'mefloquine', label: 'Mefloquine (Lariam)' },
        { value: 'unsure', label: 'Not sure — recommend based on my destination' },
      ],
    },
  ],
};

const arthritis: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'hot_swollen',
      text: 'Is any joint red, hot, very swollen, or did the pain come on suddenly?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('this may indicate septic arthritis or gout flare'),
    },
    {
      id: 'ulcer_history',
      text: 'Have you ever had a stomach or duodenal ulcer or GI bleed?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('NSAIDs can trigger another bleed'),
    },
    {
      id: 'nsaid_asthma',
      text: 'Has aspirin or ibuprofen ever made your asthma worse?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('NSAID-sensitive asthma can be triggered by these medicines'),
    },
    {
      id: 'anticoagulant',
      text: 'Do you take warfarin or a DOAC (e.g. apixaban, rivaroxaban, edoxaban, dabigatran)?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('NSAIDs interact with anticoagulants'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'joints',
      text: 'Which joint(s) are affected?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'knee', label: 'Knee' },
        { value: 'hip', label: 'Hip' },
        { value: 'hand', label: 'Hands / fingers' },
        { value: 'shoulder', label: 'Shoulder' },
        { value: 'ankle_foot', label: 'Ankle / foot' },
        { value: 'spine', label: 'Spine / back' },
      ],
    },
    {
      id: 'duration',
      text: 'How long has the pain been a problem?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_4wk', label: 'Less than 4 weeks' },
        { value: '1_3mo', label: '1 – 3 months' },
        { value: 'over_3mo', label: 'Over 3 months' },
      ],
    },
    {
      id: 'severity',
      text: 'How bad is the pain on average?',
      kind: 'radio',
      required: true,
      options: [
        { value: '1_3', label: '1 – 3 / 10 (mild)' },
        { value: '4_6', label: '4 – 6 / 10 (moderate)' },
        { value: '7_10', label: '7 – 10 / 10 (severe)' },
      ],
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'ibuprofen_gel', label: 'Ibuprofen gel (topical)' },
        { value: 'naproxen', label: 'Naproxen tablets' },
        { value: 'co_codamol', label: 'Paracetamol + codeine (co-codamol)' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const ibs: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'gp_diagnosed',
      text: 'Has IBS been formally diagnosed by a GP?',
      blockingAnswer: 'no',
      severity: 'soft',
      blockMessage: softReview('a diagnosis is needed to rule out other bowel conditions'),
    },
    {
      id: 'red_flags',
      text: 'Do you have any of: unintentional weight loss, blood in stool, family history of bowel cancer, anaemia, or new bowel changes after age 50?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('these warrant investigation before symptomatic IBS treatment'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'subtype',
      text: 'Which IBS subtype matches your symptoms most?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'ibs_c', label: 'IBS with constipation (IBS-C)' },
        { value: 'ibs_d', label: 'IBS with diarrhoea (IBS-D)' },
        { value: 'mixed', label: 'Mixed (alternating)' },
      ],
    },
    {
      id: 'preferred_treatment',
      text: 'Which treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'mebeverine', label: 'Mebeverine (antispasmodic)' },
        { value: 'hyoscine', label: 'Hyoscine butylbromide (Buscopan)' },
        { value: 'loperamide', label: 'Loperamide (for diarrhoea)' },
        { value: 'ispaghula', label: 'Ispaghula husk (Fybogel, for constipation)' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const flu: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'over_72h',
      text: 'Did your symptoms start more than 48 hours ago?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('antivirals are most effective within 48 hours of symptom onset'),
    },
    {
      id: 'pregnant',
      text: 'Are you pregnant?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('flu in pregnancy needs review — oseltamivir is usually offered to at-risk pregnant patients'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'onset',
      text: 'When did your symptoms start?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_48h', label: 'Less than 48 hours ago' },
        { value: '48_72h', label: '48 – 72 hours ago' },
        { value: 'over_72h', label: 'More than 72 hours ago' },
      ],
    },
    {
      id: 'symptoms',
      text: 'Which symptoms do you have?',
      kind: 'checkbox-multi',
      required: true,
      options: [
        { value: 'fever', label: 'Fever / chills' },
        { value: 'cough', label: 'Cough' },
        { value: 'sore_throat', label: 'Sore throat' },
        { value: 'body_aches', label: 'Body aches' },
        { value: 'fatigue', label: 'Severe fatigue' },
        { value: 'headache', label: 'Headache' },
      ],
    },
    {
      id: 'high_risk',
      text: 'Are you in a clinical at-risk group (e.g. asthma, COPD, heart disease, diabetes, immunocompromised, pregnant, age >65)?',
      kind: 'yesno',
      required: true,
    },
  ],
};

const covidTests: ConditionQuestionnaire = {
  eligibilityQuestions: [],
  clinicalQuestions: [
    {
      id: 'symptom_timeline',
      text: 'When did your symptoms or exposure occur?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'today', label: 'Today' },
        { value: '1_3d', label: '1 – 3 days ago' },
        { value: '4_7d', label: '4 – 7 days ago' },
        { value: 'no_symptoms', label: 'No symptoms — pre-travel / pre-event' },
      ],
    },
    {
      id: 'at_risk_household',
      text: 'Is anyone in your household clinically at risk (e.g. immunocompromised, elderly, pregnant)?',
      kind: 'yesno',
    },
  ],
};

const sleep: ConditionQuestionnaire = {
  eligibilityQuestions: [
    {
      id: 'suicidal_now',
      text: 'Are you having thoughts of harming yourself or ending your life right now?',
      blockingAnswer: 'yes',
      severity: 'hard',
      blockMessage: 'Please call 999 or the Samaritans on 116 123 right away. Help is available — do not continue with this consultation.',
      blockTitle: 'Urgent support needed',
    },
    {
      id: 'severe_depression',
      text: 'Are you currently experiencing severe depression, or being treated for a serious mental health condition?',
      blockingAnswer: 'yes',
      severity: 'soft',
      blockMessage: softReview('sleep problems with serious mental health conditions need joined-up care'),
    },
  ],
  clinicalQuestions: [
    {
      id: 'duration',
      text: 'How long have you had insomnia?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_2wk', label: 'Less than 2 weeks' },
        { value: '2_4wk', label: '2 – 4 weeks' },
        { value: 'over_4wk', label: 'More than 4 weeks' },
      ],
    },
    {
      id: 'pattern',
      text: 'Which pattern best describes your sleep problem?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'onset', label: 'Trouble falling asleep' },
        { value: 'maintenance', label: 'Waking through the night' },
        { value: 'early_waking', label: 'Waking too early and unable to get back to sleep' },
      ],
    },
    {
      id: 'preferred',
      text: 'Which short-course OTC treatment would you prefer?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'nytol', label: 'Diphenhydramine (Nytol)' },
        { value: 'promethazine', label: 'Promethazine (Sominex/Phenergan)' },
        { value: 'unsure', label: 'Not sure — recommend based on my answers' },
      ],
    },
  ],
};

const numbingCream: ConditionQuestionnaire = {
  eligibilityQuestions: [],
  clinicalQuestions: [
    {
      id: 'purpose',
      text: 'What will you use the numbing cream for?',
      kind: 'select',
      placeholder: 'Choose one',
      required: true,
      options: [
        { value: 'tattoo', label: 'Tattoo' },
        { value: 'cosmetic', label: 'Cosmetic procedure (e.g. laser, micro-needling)' },
        { value: 'medical', label: 'Medical procedure (e.g. blood test)' },
      ],
    },
    {
      id: 'area_size',
      text: 'Approximately how large is the area you want to numb?',
      kind: 'number',
      unit: 'cm²',
      min: 1,
      max: 2000,
      required: true,
    },
    {
      id: 'area_location',
      text: 'Where on the body is the area?',
      kind: 'text',
      required: true,
      placeholder: 'e.g. forearm, lower back',
    },
    {
      id: 'age',
      text: 'How old are you?',
      kind: 'number',
      min: 0,
      max: 120,
      unit: 'years',
      required: true,
    },
  ],
};

const weightLossPlaceholder: ConditionQuestionnaire = {
  eligibilityQuestions: [],
  clinicalQuestions: [
    {
      id: 'redirect_note',
      text: 'Weight-loss prescribing uses our dedicated flow.',
      subtext: 'Please continue via /injectable-weight-loss for the full BMI, contraindication and follow-up assessment.',
      kind: 'textarea',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Map + aliases
// ─────────────────────────────────────────────────────────────────────────────

export const conditionQuestions = {
  'erectile-dysfunction': erectileDysfunction,
  'premature-ejaculation': prematureEjaculation,
  'hair-loss': hairLoss,
  'acne-vulgaris': acneVulgaris,
  'cystitis': cystitis,
  'allergic-rhinitis': allergicRhinitis,
  'period-delay': periodDelay,
  'emergency-contraception': emergencyContraception,
  'chlamydia': chlamydia,
  'genital-herpes': genitalHerpes,
  'acid-reflux': acidReflux,
  'migraine': migraine,
  'smoking-cessation': smokingCessation,
  'athletes-foot': athletesFoot,
  'jet-lag': jetLag,
  'bacterial-vaginosis': bacterialVaginosis,
  'rosacea': rosacea,
  'nail-infection': nailInfection,
  'genital-warts': genitalWarts,
  'anti-malaria': antiMalaria,
  'arthritis': arthritis,
  'ibs': ibs,
  'flu': flu,
  'covid-19-tests': covidTests,
  'sleep': sleep,
  'numbing-cream': numbingCream,
  'weight-loss': weightLossPlaceholder,
} as const satisfies Record<string, ConditionQuestionnaire>;

export const conditionAliases: Record<string, string> = {
  // Weight-loss legacy aliases
  weight_loss: 'weight-loss',
  'weight-management': 'weight-loss',
  weightloss: 'weight-loss',
  // Hay fever
  hayfever: 'allergic-rhinitis',
  'hay-fever': 'allergic-rhinitis',
  // Other common spellings
  uti: 'cystitis',
  'urinary-tract-infection': 'cystitis',
  ed: 'erectile-dysfunction',
  pe: 'premature-ejaculation',
  bv: 'bacterial-vaginosis',
  herpes: 'genital-herpes',
  warts: 'genital-warts',
  malaria: 'anti-malaria',
  'morning-after-pill': 'emergency-contraception',
  gerd: 'acid-reflux',
  reflux: 'acid-reflux',
  heartburn: 'acid-reflux',
  insomnia: 'sleep',
  'period-delay-pill': 'period-delay',
  'fungal-nail': 'nail-infection',
  onychomycosis: 'nail-infection',
  'mens-hair-loss': 'hair-loss',
  acne: 'acne-vulgaris',
  influenza: 'flu',
  tamiflu: 'flu',
};

const defaultQuestionnaire: ConditionQuestionnaire = {
  eligibilityQuestions: [],
  clinicalQuestions: [
    {
      id: 'duration',
      text: 'How long have you had these symptoms?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'under_1wk', label: 'Less than 1 week' },
        { value: '1_4wk', label: '1 – 4 weeks' },
        { value: '1_3mo', label: '1 – 3 months' },
        { value: 'over_3mo', label: 'More than 3 months' },
      ],
    },
    {
      id: 'severity',
      text: 'How severe are your symptoms?',
      kind: 'radio',
      required: true,
      options: [
        { value: 'mild', label: 'Mild' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'severe', label: 'Severe' },
      ],
    },
    {
      id: 'previously_diagnosed',
      text: 'Have you been diagnosed with this condition before?',
      kind: 'yesno',
    },
    {
      id: 'previous_treatments',
      text: 'What treatments have you tried so far?',
      kind: 'textarea',
    },
    {
      id: 'allergies',
      text: 'Do you have any medicine allergies?',
      kind: 'text',
    },
    {
      id: 'current_meds',
      text: 'Please list any prescription or OTC medicines you take.',
      kind: 'textarea',
    },
  ],
};

export function getConditionQuestions(conditionId: string): ConditionQuestionnaire {
  const lower = (conditionId ?? '').trim().toLowerCase();
  const aliasResolved = conditionAliases[lower] ?? lower;
  const map = conditionQuestions as Record<string, ConditionQuestionnaire>;
  return map[aliasResolved] ?? map[lower] ?? defaultQuestionnaire;
}
