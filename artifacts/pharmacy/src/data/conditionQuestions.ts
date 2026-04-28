import { newConditionQuestions, conditionAliases } from './newConditionsData';

export type QuestionType = 'radio' | 'textarea' | 'checkbox_group';

export interface Option {
  value: string;
  label: string;
}

export interface ClinicalQuestion {
  id: string;
  text: string;
  subtext?: string;
  type: QuestionType;
  options?: Option[];
  required?: boolean;
}

export interface EligibilityQuestion {
  id: string;
  text: string;
  subtext?: string;
  blockingAnswer: 'yes' | 'no';
  blockingMessage: string;
}

export interface ConditionQuestionnaire {
  eligibilityQuestions: EligibilityQuestion[];
  clinicalQuestions: ClinicalQuestion[];
}

const YES_NO: Option[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const conditionQuestions: Record<string, ConditionQuestionnaire> = {

  'acne-vulgaris': {
    eligibilityQuestions: [
      {
        id: 'fever_with_acne',
        text: 'Do you have a high temperature (above 38°C) alongside your acne?',
        blockingAnswer: 'yes',
        blockingMessage: 'A fever with acne may indicate a serious skin infection. Please see your GP or call NHS 111 for advice.',
      },
      {
        id: 'isotretinoin',
        text: 'Are you currently taking or have you taken isotretinoin (Roaccutane) in the past 6 months?',
        blockingAnswer: 'yes',
        blockingMessage: 'We are unable to treat patients currently on or recently off isotretinoin online. Please speak to your dermatologist or GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you been experiencing acne?',
        type: 'radio',
        options: [
          { value: 'less_3mo', label: 'Less than 3 months' },
          { value: '3_to_12mo', label: '3 to 12 months' },
          { value: 'over_1yr', label: 'Over 1 year' },
        ],
        required: true,
      },
      {
        id: 'severity',
        text: 'How would you rate the severity of your acne?',
        type: 'radio',
        options: [
          { value: 'mild', label: 'Mild – a few blackheads or small spots' },
          { value: 'moderate', label: 'Moderate – many spots with some redness and inflammation' },
          { value: 'severe', label: 'Severe – widespread inflamed spots, but no large cysts' },
        ],
        required: true,
      },
      {
        id: 'location',
        text: 'Where on your body is the acne mainly located?',
        type: 'radio',
        options: [
          { value: 'face', label: 'Face only' },
          { value: 'face_neck', label: 'Face and neck' },
          { value: 'back_chest', label: 'Back and chest' },
          { value: 'multiple', label: 'Multiple areas' },
        ],
        required: true,
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any acne treatments before?',
        subtext: 'Include any creams, gels, antibiotics or other treatments, and whether they helped.',
        type: 'textarea',
      },
      {
        id: 'skincare',
        text: 'Are you currently using any skincare products?',
        subtext: 'E.g. cleansers, moisturisers, SPF, makeup. Some products can worsen acne.',
        type: 'textarea',
      },
      {
        id: 'contraception',
        text: 'Do you use any hormonal contraception?',
        subtext: 'This is relevant as some contraceptives can affect acne.',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes – combined pill or patch' },
          { value: 'progesterone_only', label: 'Yes – progesterone-only pill or implant' },
          { value: 'no', label: 'No' },
          { value: 'not_applicable', label: 'Not applicable' },
        ],
      },
    ],
  },

  'allergic-rhinitis': {
    eligibilityQuestions: [
      {
        id: 'breathing_difficulty',
        text: 'Do you experience difficulty breathing, severe shortness of breath, or wheezing?',
        blockingAnswer: 'yes',
        blockingMessage: 'These symptoms may indicate asthma or a serious allergic reaction. Please see your GP or call NHS 111 immediately.',
      },
      {
        id: 'anaphylaxis',
        text: 'Have you ever had a severe allergic reaction (anaphylaxis) with facial swelling or throat tightness?',
        blockingAnswer: 'yes',
        blockingMessage: 'A history of anaphylaxis requires specialist allergy management. Please see your GP who can refer you to an allergy clinic.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you experienced hayfever or allergic rhinitis?',
        type: 'radio',
        options: [
          { value: 'first', label: 'This is a new problem' },
          { value: 'under_1yr', label: 'Less than 1 year' },
          { value: '1_5yr', label: '1–5 years' },
          { value: 'over_5yr', label: 'Over 5 years' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'Which symptoms do you experience?',
        type: 'checkbox_group',
        options: [
          { value: 'sneezing', label: 'Sneezing' },
          { value: 'runny_nose', label: 'Runny nose' },
          { value: 'blocked_nose', label: 'Blocked nose' },
          { value: 'itchy_eyes', label: 'Itchy eyes' },
          { value: 'watery_eyes', label: 'Watery eyes' },
          { value: 'itchy_throat', label: 'Itchy throat' },
          { value: 'loss_of_smell', label: 'Loss of smell' },
        ],
        required: true,
      },
      {
        id: 'triggers',
        text: 'When do your symptoms typically occur?',
        type: 'radio',
        options: [
          { value: 'year_round', label: 'Year round (perennial)' },
          { value: 'seasonal', label: 'Mainly spring/summer – pollen season' },
          { value: 'animals', label: 'Around animals' },
          { value: 'dusty', label: 'In dusty or damp environments' },
          { value: 'multiple', label: 'Multiple triggers' },
        ],
        required: true,
      },
      {
        id: 'impact',
        text: 'How much do the symptoms affect your daily life?',
        type: 'radio',
        options: [
          { value: 'mild', label: 'Mild – annoying but manageable' },
          { value: 'moderate', label: 'Moderate – significantly affects work, sleep or quality of life' },
          { value: 'severe', label: 'Severe – prevents normal daily activities' },
        ],
        required: true,
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any allergy treatments?',
        subtext: 'Including antihistamines, nasal sprays, or eye drops – and how well they worked.',
        type: 'textarea',
      },
    ],
  },

  'athletes-foot': {
    eligibilityQuestions: [
      {
        id: 'infection_signs',
        text: 'Is the skin broken, severely cracked, or showing signs of spreading infection (redness spreading up the foot, pus, increasing warmth)?',
        blockingAnswer: 'yes',
        blockingMessage: 'These signs may indicate a bacterial infection (cellulitis) that requires antibiotics. Please see your GP or visit an urgent care centre.',
      },
      {
        id: 'diabetes',
        text: 'Do you have diabetes or a condition that affects your immune system?',
        blockingAnswer: 'yes',
        blockingMessage: 'Fungal foot infections in people with diabetes or immune conditions require closer medical supervision. Please see your GP or diabetic foot team.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had athlete\'s foot?',
        type: 'radio',
        options: [
          { value: 'under_1wk', label: 'Less than 1 week' },
          { value: '1_4wk', label: '1–4 weeks' },
          { value: '1_3mo', label: '1–3 months' },
          { value: 'over_3mo', label: 'Over 3 months' },
        ],
        required: true,
      },
      {
        id: 'location',
        text: 'Where on your foot is it mainly located?',
        type: 'radio',
        options: [
          { value: 'between_toes', label: 'Between the toes' },
          { value: 'sole', label: 'Sole of the foot' },
          { value: 'heel', label: 'Around the heel' },
          { value: 'multiple', label: 'Multiple areas' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'What symptoms are you experiencing?',
        type: 'checkbox_group',
        options: [
          { value: 'itching', label: 'Itching or burning between toes' },
          { value: 'peeling', label: 'Peeling or flaking skin' },
          { value: 'red_raw', label: 'Red, raw skin' },
          { value: 'blisters', label: 'Small blisters' },
          { value: 'thickened', label: 'Thickened or dry skin' },
          { value: 'odour', label: 'Unpleasant odour' },
        ],
        required: true,
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any antifungal treatments?',
        subtext: 'Please include what you used, for how long, and whether it helped.',
        type: 'textarea',
      },
      {
        id: 'lifestyle',
        text: 'Do you regularly use communal changing areas such as gyms or swimming pools?',
        type: 'radio',
        options: YES_NO,
      },
    ],
  },

  'back-pain': {
    eligibilityQuestions: [
      {
        id: 'cauda_equina',
        text: 'Do you have any problems with bladder or bowel control, or numbness/tingling in your groin or inner thighs?',
        blockingAnswer: 'yes',
        blockingMessage: 'These symptoms may indicate cauda equina syndrome — a medical emergency. Please call 999 or go to A&E immediately.',
      },
      {
        id: 'trauma',
        text: 'Did your back pain start after a significant fall, road traffic accident, or direct impact?',
        blockingAnswer: 'yes',
        blockingMessage: 'Back pain following trauma requires physical examination to rule out fractures. Please go to A&E or an urgent care centre.',
      },
      {
        id: 'cancer_weightloss',
        text: 'Do you have unexplained weight loss, or a personal history of cancer?',
        blockingAnswer: 'yes',
        blockingMessage: 'Back pain with these features requires urgent investigation. Please see your GP today or call NHS 111.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'location',
        text: 'Where is your pain located?',
        type: 'radio',
        options: [
          { value: 'lower', label: 'Lower back' },
          { value: 'middle', label: 'Middle back' },
          { value: 'upper', label: 'Upper back / between shoulder blades' },
          { value: 'radiating', label: 'Back with pain radiating into the leg (sciatica)' },
          { value: 'multiple', label: 'Multiple areas' },
        ],
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have you had this pain?',
        type: 'radio',
        options: [
          { value: 'under_1wk', label: 'Less than 1 week' },
          { value: '1_4wk', label: '1–4 weeks' },
          { value: '1_3mo', label: '1–3 months' },
          { value: 'over_3mo', label: 'Over 3 months (chronic)' },
        ],
        required: true,
      },
      {
        id: 'nature',
        text: 'How would you describe the pain?',
        type: 'checkbox_group',
        options: [
          { value: 'aching', label: 'Aching or dull' },
          { value: 'sharp', label: 'Sharp or stabbing' },
          { value: 'burning', label: 'Burning' },
          { value: 'shooting', label: 'Shooting down into the leg' },
          { value: 'stiffness', label: 'Stiffness' },
          { value: 'spasm', label: 'Muscle spasm' },
        ],
        required: true,
      },
      {
        id: 'severity',
        text: 'How would you rate your pain on average?',
        type: 'radio',
        options: [
          { value: '1_3', label: '1–3 out of 10 – Mild (background discomfort)' },
          { value: '4_6', label: '4–6 out of 10 – Moderate (noticeably affects daily life)' },
          { value: '7_10', label: '7–10 out of 10 – Severe (difficult to function)' },
        ],
        required: true,
      },
      {
        id: 'aggravating',
        text: 'What makes your pain worse?',
        type: 'checkbox_group',
        options: [
          { value: 'sitting', label: 'Sitting for long periods' },
          { value: 'standing', label: 'Standing' },
          { value: 'walking', label: 'Walking' },
          { value: 'bending', label: 'Bending or lifting' },
          { value: 'morning', label: 'Morning stiffness' },
          { value: 'nothing', label: 'No particular trigger' },
        ],
      },
      {
        id: 'previous_treatments',
        text: 'What have you tried so far for the pain?',
        subtext: 'Include any painkillers, physiotherapy, or other treatments and their effectiveness.',
        type: 'textarea',
      },
    ],
  },

  'chickenpox': {
    eligibilityQuestions: [
      {
        id: 'adult',
        text: 'Is this consultation for an adult aged 18 or over?',
        blockingAnswer: 'yes',
        blockingMessage: 'Chickenpox in adults is often more severe and may require antiviral medication. Please contact your GP today for advice.',
      },
      {
        id: 'immunocompromised',
        text: 'Does the child have a weakened immune system, or are they taking steroids or chemotherapy?',
        blockingAnswer: 'yes',
        blockingMessage: 'Chickenpox in immunocompromised children is a medical emergency. Call your GP or NHS 111 immediately.',
      },
      {
        id: 'eye_rash',
        text: 'Is there a rash involving or around the eyes?',
        blockingAnswer: 'yes',
        blockingMessage: 'A rash near the eyes requires urgent ophthalmological assessment. Please go to A&E or an eye emergency department.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'age',
        text: 'How old is the child?',
        type: 'radio',
        options: [
          { value: 'under_1', label: 'Under 1 year' },
          { value: '1_5', label: '1–5 years' },
          { value: '6_10', label: '6–10 years' },
          { value: '11_17', label: '11–17 years' },
        ],
        required: true,
      },
      {
        id: 'rash_onset',
        text: 'When did the rash appear?',
        type: 'radio',
        options: [
          { value: 'today', label: 'Today' },
          { value: '1_2d', label: '1–2 days ago' },
          { value: '3_5d', label: '3–5 days ago' },
          { value: 'over_5d', label: 'Over 5 days ago' },
        ],
        required: true,
      },
      {
        id: 'wellbeing',
        text: 'How is the child feeling generally?',
        type: 'radio',
        options: [
          { value: 'well', label: 'Well – eating, drinking and playing normally' },
          { value: 'unwell', label: 'Unwell – off food but no significant distress' },
          { value: 'very_unwell', label: 'Very unwell – high fever and significant distress' },
        ],
        required: true,
      },
      {
        id: 'rash_description',
        text: 'What does the rash look like?',
        type: 'checkbox_group',
        options: [
          { value: 'red_spots', label: 'Small red or pink spots' },
          { value: 'blisters', label: 'Fluid-filled blisters' },
          { value: 'scabs', label: 'Scabbed or crusted spots' },
          { value: 'widespread', label: 'Spots all over the body' },
          { value: 'trunk_mainly', label: 'Mainly on the trunk/body' },
        ],
        required: true,
      },
      {
        id: 'vaccinated',
        text: 'Has the child had the chickenpox vaccine?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' },
        ],
      },
    ],
  },

  'cold-sores': {
    eligibilityQuestions: [
      {
        id: 'eye_involvement',
        text: 'Is the cold sore near your eye, or do you have any redness, pain, or visual changes in the eye?',
        blockingAnswer: 'yes',
        blockingMessage: 'Cold sores near the eye can cause serious vision damage (ocular herpes). Please see your GP or go to an eye emergency department today.',
      },
      {
        id: 'immunocompromised',
        text: 'Do you have a weakened immune system (e.g. HIV, cancer treatment, organ transplant, high-dose steroids)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Cold sores in immunocompromised individuals can be severe and require medical management. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'stage',
        text: 'Which stage is your cold sore currently at?',
        type: 'radio',
        options: [
          { value: 'tingling', label: 'Tingling, itching or burning (no visible sore yet)' },
          { value: 'blisters', label: 'Small blisters have appeared' },
          { value: 'weeping', label: 'Blisters have burst and are weeping' },
          { value: 'scabbing', label: 'Scabbing over and healing' },
        ],
        required: true,
      },
      {
        id: 'onset',
        text: 'When did symptoms first start?',
        type: 'radio',
        options: [
          { value: 'under_24h', label: 'In the last 24 hours' },
          { value: '1_3d', label: '1–3 days ago' },
          { value: '4_7d', label: '4–7 days ago' },
          { value: 'over_7d', label: 'Over 7 days ago' },
        ],
        required: true,
      },
      {
        id: 'frequency',
        text: 'How often do you get cold sores?',
        type: 'radio',
        options: [
          { value: 'first', label: 'This is my first cold sore' },
          { value: 'few_yr', label: 'A few times a year' },
          { value: 'monthly', label: 'Monthly or more frequently' },
        ],
        required: true,
      },
      {
        id: 'previous_treatments',
        text: 'Have you used antiviral cold sore treatments before (e.g. aciclovir cream)?',
        subtext: 'Please include how effective they were.',
        type: 'textarea',
      },
      {
        id: 'triggers',
        text: 'Do you know what triggered this outbreak?',
        type: 'textarea',
        subtext: 'E.g. stress, sun exposure, illness, tiredness.',
      },
    ],
  },

  'conjunctivitis': {
    eligibilityQuestions: [
      {
        id: 'vision_changes',
        text: 'Are you experiencing any changes in your vision, or significant pain inside the eye (not just surface discomfort)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Vision changes or severe eye pain require urgent assessment. Please go to an eye emergency department or A&E immediately.',
      },
      {
        id: 'contact_lens',
        text: 'Are you a contact lens wearer whose symptoms have not improved after 24 hours of not wearing your lenses?',
        blockingAnswer: 'yes',
        blockingMessage: 'Contact lens-related eye infections need prompt assessment by an optometrist or GP. Please remove your lenses and seek advice today.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'eye_affected',
        text: 'Which eye(s) are affected?',
        type: 'radio',
        options: [
          { value: 'left', label: 'Left eye only' },
          { value: 'right', label: 'Right eye only' },
          { value: 'both', label: 'Both eyes' },
        ],
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have you had the symptoms?',
        type: 'radio',
        options: [
          { value: 'under_24h', label: 'Less than 24 hours' },
          { value: '1_3d', label: '1–3 days' },
          { value: '3_7d', label: '3–7 days' },
          { value: 'over_1wk', label: 'Over 1 week' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'What symptoms do you have?',
        type: 'checkbox_group',
        options: [
          { value: 'discharge', label: 'Sticky yellow or green discharge' },
          { value: 'red', label: 'Red or pink eye' },
          { value: 'crusty', label: 'Crusted or sticky eyelids on waking' },
          { value: 'watery', label: 'Watery or runny eyes' },
          { value: 'gritty', label: 'Gritty or sandy feeling' },
          { value: 'light_sensitive', label: 'Sensitivity to light' },
        ],
        required: true,
      },
      {
        id: 'contact',
        text: 'Have you been in contact with someone who has had an eye infection recently?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' },
        ],
      },
      {
        id: 'household',
        text: 'Does anyone else in your household have similar eye symptoms?',
        type: 'radio',
        options: YES_NO,
      },
    ],
  },

  'constipation': {
    eligibilityQuestions: [
      {
        id: 'blood_in_stool',
        text: 'Have you noticed any blood in your stools or on the toilet paper?',
        blockingAnswer: 'yes',
        blockingMessage: 'Blood in the stool requires medical assessment to identify the cause. Please see your GP today or call NHS 111.',
      },
      {
        id: 'weight_loss',
        text: 'Have you had unexplained weight loss alongside your constipation?',
        blockingAnswer: 'yes',
        blockingMessage: 'Constipation with unexplained weight loss requires urgent investigation. Please see your GP.',
      },
      {
        id: 'new_over_50',
        text: 'Are you over 50 and experiencing a significant change in bowel habit for the first time?',
        blockingAnswer: 'yes',
        blockingMessage: 'New or changing bowel habits in people over 50 need medical assessment to rule out serious causes. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you been experiencing constipation?',
        type: 'radio',
        options: [
          { value: 'few_days', label: 'A few days' },
          { value: '1_2wk', label: '1–2 weeks' },
          { value: '2_4wk', label: '2–4 weeks' },
          { value: 'over_1mo', label: 'Over 1 month' },
        ],
        required: true,
      },
      {
        id: 'frequency',
        text: 'How many times per week are you opening your bowels?',
        type: 'radio',
        options: [
          { value: 'less_1', label: 'Less than once a week' },
          { value: '1_2', label: 'Once or twice a week' },
          { value: '3_4', label: 'Three or four times a week' },
          { value: 'varies', label: 'It varies greatly' },
        ],
        required: true,
      },
      {
        id: 'stool_type',
        text: 'What are your stools typically like?',
        type: 'radio',
        options: [
          { value: 'hard_pellets', label: 'Very hard, separate pellets' },
          { value: 'hard', label: 'Hard lumps, difficult to pass' },
          { value: 'soft_infrequent', label: 'Normal consistency but infrequent' },
          { value: 'incomplete', label: 'Formed but I feel like I can\'t fully empty my bowels' },
        ],
        required: true,
      },
      {
        id: 'straining',
        text: 'Do you experience pain or significant straining when passing stools?',
        type: 'radio',
        options: [
          { value: 'yes_significant', label: 'Yes – significant pain' },
          { value: 'yes_mild', label: 'Yes – mild discomfort' },
          { value: 'no', label: 'No' },
        ],
        required: true,
      },
      {
        id: 'diet_fluid',
        text: 'How would you describe your diet and fluid intake?',
        subtext: 'E.g. fibre-rich foods, water intake, any recent dietary changes.',
        type: 'textarea',
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any laxatives or other treatments?',
        subtext: 'Include what you tried and whether it helped.',
        type: 'textarea',
      },
    ],
  },

  'diarrhoea': {
    eligibilityQuestions: [
      {
        id: 'blood_mucus',
        text: 'Do you have any blood or mucus in your stools?',
        blockingAnswer: 'yes',
        blockingMessage: 'Blood or mucus in diarrhoea can indicate a serious infection or inflammatory bowel condition. Please see your GP today or call NHS 111.',
      },
      {
        id: 'prolonged_or_dehydrated',
        text: 'Has your diarrhoea lasted over 7 days, or are you unable to keep fluids down?',
        blockingAnswer: 'yes',
        blockingMessage: 'Prolonged diarrhoea or significant dehydration needs medical attention. Please contact your GP or call NHS 111.',
      },
      {
        id: 'travel',
        text: 'Have you returned from abroad within the last 4 weeks, particularly from a developing country?',
        blockingAnswer: 'yes',
        blockingMessage: 'Diarrhoea after overseas travel may be caused by a specific infection requiring targeted treatment. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had diarrhoea?',
        type: 'radio',
        options: [
          { value: 'under_24h', label: 'Less than 24 hours' },
          { value: '1_3d', label: '1–3 days' },
          { value: '4_7d', label: '4–7 days' },
        ],
        required: true,
      },
      {
        id: 'frequency',
        text: 'How many loose stools are you passing per day?',
        type: 'radio',
        options: [
          { value: '1_2', label: '1–2 per day' },
          { value: '3_5', label: '3–5 per day' },
          { value: '6_10', label: '6–10 per day' },
          { value: 'over_10', label: 'More than 10 per day' },
        ],
        required: true,
      },
      {
        id: 'other_symptoms',
        text: 'Do you have any other symptoms?',
        type: 'checkbox_group',
        options: [
          { value: 'cramps', label: 'Stomach cramps' },
          { value: 'nausea', label: 'Nausea' },
          { value: 'vomiting', label: 'Vomiting' },
          { value: 'fever', label: 'Fever or chills' },
          { value: 'headache', label: 'Headache' },
        ],
      },
      {
        id: 'fluids',
        text: 'Are you able to keep fluids down?',
        type: 'radio',
        options: [
          { value: 'yes_well', label: 'Yes – drinking well' },
          { value: 'yes_difficult', label: 'Yes – with difficulty' },
          { value: 'no', label: 'No – unable to keep fluids down' },
        ],
        required: true,
      },
      {
        id: 'contact',
        text: 'Has anyone around you had similar symptoms or could you identify a suspect food or event?',
        type: 'textarea',
      },
    ],
  },

  'dry-eye': {
    eligibilityQuestions: [
      {
        id: 'vision_loss',
        text: 'Have you experienced sudden or significant vision loss or vision changes?',
        blockingAnswer: 'yes',
        blockingMessage: 'Sudden vision changes are a medical emergency. Please call 999 or go to A&E immediately.',
      },
      {
        id: 'eye_injury',
        text: 'Did your eye symptoms start following an injury, foreign body, or chemical entering the eye?',
        blockingAnswer: 'yes',
        blockingMessage: 'Eye injuries require urgent assessment. Please go to an eye emergency department immediately.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you experienced dry eye symptoms?',
        type: 'radio',
        options: [
          { value: 'few_days', label: 'A few days' },
          { value: 'few_wk', label: 'A few weeks' },
          { value: 'several_mo', label: 'Several months' },
          { value: 'over_1yr', label: 'Over 1 year' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'Which symptoms do you experience?',
        type: 'checkbox_group',
        options: [
          { value: 'dryness', label: 'Dryness or scratchiness' },
          { value: 'burning', label: 'Burning or stinging' },
          { value: 'gritty', label: 'Gritty or sandy feeling' },
          { value: 'blurred', label: 'Blurred vision that clears when you blink' },
          { value: 'redness', label: 'Redness' },
          { value: 'watery', label: 'Paradoxically watery or running eyes' },
        ],
        required: true,
      },
      {
        id: 'triggers',
        text: 'When are your symptoms worst?',
        type: 'radio',
        options: [
          { value: 'morning', label: 'In the morning on waking' },
          { value: 'screens', label: 'During prolonged screen use' },
          { value: 'dry_air', label: 'In dry or air-conditioned environments' },
          { value: 'windy', label: 'In wind or outdoors' },
          { value: 'all_time', label: 'All the time' },
        ],
        required: true,
      },
      {
        id: 'screen_time',
        text: 'How much screen time do you typically have per day?',
        type: 'radio',
        options: [
          { value: 'under_4h', label: 'Less than 4 hours' },
          { value: '4_8h', label: '4–8 hours' },
          { value: 'over_8h', label: 'Over 8 hours' },
        ],
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any eye drops or treatments for dry eyes?',
        subtext: 'Include what you used and how effective it was.',
        type: 'textarea',
      },
    ],
  },

  'dry-skin': {
    eligibilityQuestions: [
      {
        id: 'infection',
        text: 'Does the skin show signs of infection (yellow crusting, weeping, spreading redness, or fever)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Infected eczema or dermatitis needs antibiotic treatment. Please see your GP or attend an urgent care centre.',
      },
      {
        id: 'severe_widespread',
        text: 'Is your eczema severe and widespread, covering a large proportion of your body and unresponsive to treatment?',
        blockingAnswer: 'yes',
        blockingMessage: 'Severe or widespread eczema may need specialist dermatology care. Please see your GP for a referral.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had this skin condition?',
        type: 'radio',
        options: [
          { value: 'under_1mo', label: 'Less than 1 month (new flare)' },
          { value: '1_6mo', label: '1–6 months' },
          { value: '6_12mo', label: '6–12 months' },
          { value: 'over_1yr', label: 'Over 1 year (ongoing condition)' },
        ],
        required: true,
      },
      {
        id: 'location',
        text: 'Where is the affected skin?',
        type: 'checkbox_group',
        options: [
          { value: 'face', label: 'Face' },
          { value: 'neck', label: 'Neck' },
          { value: 'arms', label: 'Arms / elbows' },
          { value: 'hands', label: 'Hands' },
          { value: 'legs', label: 'Legs / behind the knees' },
          { value: 'body', label: 'Body / trunk' },
        ],
        required: true,
      },
      {
        id: 'description',
        text: 'Which best describes the affected skin?',
        type: 'checkbox_group',
        options: [
          { value: 'dry_flaky', label: 'Dry and flaky' },
          { value: 'red', label: 'Red and inflamed' },
          { value: 'cracked', label: 'Cracked' },
          { value: 'itchy', label: 'Intensely itchy' },
          { value: 'thickened', label: 'Thickened (lichenified)' },
          { value: 'weeping', label: 'Slightly weeping or oozing' },
        ],
        required: true,
      },
      {
        id: 'triggers',
        text: 'What triggers or worsens your condition?',
        type: 'checkbox_group',
        options: [
          { value: 'soaps', label: 'Soaps, detergents or cleaning products' },
          { value: 'stress', label: 'Stress' },
          { value: 'heat', label: 'Heat or sweating' },
          { value: 'fabrics', label: 'Certain fabrics (wool, synthetic)' },
          { value: 'dust', label: 'Dust or pet dander' },
          { value: 'unknown', label: 'Unknown / no clear trigger' },
        ],
      },
      {
        id: 'previous_treatments',
        text: 'Have you used any emollient creams or steroid creams?',
        subtext: 'Please include what you used, for how long, and how effective it was.',
        type: 'textarea',
      },
    ],
  },

  'dyspepsia': {
    eligibilityQuestions: [
      {
        id: 'dysphagia',
        text: 'Do you have difficulty swallowing food or fluids?',
        blockingAnswer: 'yes',
        blockingMessage: 'Difficulty swallowing requires urgent investigation. Please see your GP immediately — do not delay.',
      },
      {
        id: 'bleeding',
        text: 'Have you vomited any blood, or noticed black, tarry stools?',
        blockingAnswer: 'yes',
        blockingMessage: 'These symptoms suggest gastrointestinal bleeding. Call 999 or go to A&E immediately.',
      },
      {
        id: 'over55_new',
        text: 'Are you over 55 and experiencing new or worsening indigestion for the first time?',
        blockingAnswer: 'yes',
        blockingMessage: 'New indigestion in people over 55 requires prompt investigation. Please see your GP urgently.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'location',
        text: 'Where is the discomfort mainly felt?',
        type: 'radio',
        options: [
          { value: 'upper_abdomen', label: 'Upper abdomen (just below the ribs)' },
          { value: 'breastbone', label: 'Behind the breastbone / chest' },
          { value: 'both', label: 'Both areas' },
          { value: 'hard_to_say', label: 'Difficult to pinpoint' },
        ],
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have you had these symptoms?',
        type: 'radio',
        options: [
          { value: 'few_days', label: 'A few days' },
          { value: '1_4wk', label: '1–4 weeks' },
          { value: '1_3mo', label: '1–3 months' },
          { value: 'over_3mo', label: 'Over 3 months' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'Which symptoms do you experience?',
        type: 'checkbox_group',
        options: [
          { value: 'heartburn', label: 'Burning or heartburn' },
          { value: 'bloating', label: 'Bloating' },
          { value: 'belching', label: 'Belching / burping' },
          { value: 'nausea', label: 'Nausea' },
          { value: 'full_quickly', label: 'Feeling full very quickly when eating' },
          { value: 'regurgitation', label: 'Regurgitation (acid coming up into the mouth)' },
          { value: 'upper_pain', label: 'Upper abdominal pain or discomfort' },
        ],
        required: true,
      },
      {
        id: 'timing',
        text: 'When do symptoms tend to occur?',
        type: 'radio',
        options: [
          { value: 'after_meals', label: 'After meals' },
          { value: 'lying_down', label: 'When lying down or bending over' },
          { value: 'morning', label: 'In the morning before eating' },
          { value: 'throughout', label: 'Throughout the day regardless of meals' },
        ],
        required: true,
      },
      {
        id: 'nsaids',
        text: 'Do you regularly take ibuprofen, aspirin, or other anti-inflammatory painkillers?',
        type: 'radio',
        options: [
          { value: 'yes_daily', label: 'Yes – daily or near daily' },
          { value: 'yes_occasionally', label: 'Yes – occasionally' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'lifestyle',
        text: 'Do you smoke or drink alcohol regularly?',
        type: 'radio',
        options: [
          { value: 'both', label: 'Both' },
          { value: 'smoke_only', label: 'Smoke only' },
          { value: 'drink_only', label: 'Drink only' },
          { value: 'neither', label: 'Neither' },
        ],
      },
    ],
  },

  'haemorrhoids': {
    eligibilityQuestions: [
      {
        id: 'rectal_bleeding',
        text: 'Do you have rectal bleeding that has not been examined by a doctor and is not clearly from known haemorrhoids?',
        blockingAnswer: 'yes',
        blockingMessage: 'Unexamined rectal bleeding needs medical assessment to rule out other causes. Please see your GP.',
      },
      {
        id: 'bowel_change',
        text: 'Have you noticed a persistent change in your bowel habit lasting over 6 weeks?',
        blockingAnswer: 'yes',
        blockingMessage: 'A persistent change in bowel habit requires investigation. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had haemorrhoid symptoms?',
        type: 'radio',
        options: [
          { value: 'few_days', label: 'A few days' },
          { value: 'few_wk', label: 'A few weeks' },
          { value: 'several_mo', label: 'Several months' },
          { value: 'over_1yr', label: 'Over 1 year (recurring)' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'What symptoms do you have?',
        type: 'checkbox_group',
        options: [
          { value: 'bleeding', label: 'Bright red blood on paper or in toilet bowl' },
          { value: 'itching', label: 'Itching or irritation around the anus' },
          { value: 'pain', label: 'Pain or discomfort' },
          { value: 'lump', label: 'A lump or swelling near the anus' },
          { value: 'mucus', label: 'Mucus discharge' },
          { value: 'incomplete', label: 'Feeling of incomplete bowel emptying' },
        ],
        required: true,
      },
      {
        id: 'type',
        text: 'Are your haemorrhoids internal or external?',
        type: 'radio',
        options: [
          { value: 'internal', label: 'Internal (cannot see a lump)' },
          { value: 'external', label: 'External (visible lump outside)' },
          { value: 'both', label: 'Both' },
          { value: 'unsure', label: 'Unsure' },
        ],
        required: true,
      },
      {
        id: 'constipation',
        text: 'Do you suffer from constipation or regularly strain at the toilet?',
        type: 'radio',
        options: [
          { value: 'yes_significant', label: 'Yes – significant problem' },
          { value: 'occasionally', label: 'Occasionally' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any treatments such as creams, suppositories or dietary changes?',
        subtext: 'Please describe what you used and how effective it was.',
        type: 'textarea',
      },
    ],
  },

  'head-lice': {
    eligibilityQuestions: [
      {
        id: 'secondary_infection',
        text: 'Are there signs of secondary infection on the scalp (sores, yellow crusting, weeping)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Signs of secondary skin infection may require antibiotic treatment. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'who_affected',
        text: 'Who is affected?',
        type: 'radio',
        options: [
          { value: 'myself', label: 'Myself' },
          { value: 'child', label: 'My child' },
          { value: 'multiple', label: 'Multiple family members' },
        ],
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have you noticed lice or eggs (nits)?',
        type: 'radio',
        options: [
          { value: 'just_noticed', label: 'Just noticed' },
          { value: 'few_days', label: 'A few days' },
          { value: '1_2wk', label: '1–2 weeks' },
          { value: 'several_wk', label: 'Several weeks or longer' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'What symptoms or signs are present?',
        type: 'checkbox_group',
        options: [
          { value: 'visible_lice', label: 'Visible live lice' },
          { value: 'nits', label: 'Visible white or yellow eggs (nits) attached to hair' },
          { value: 'itching', label: 'Itching of the scalp' },
          { value: 'neck_itch', label: 'Itching at the back of the neck or behind ears' },
          { value: 'red_marks', label: 'Red marks or scratch marks on the scalp' },
        ],
        required: true,
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any head lice treatments? What did you use?',
        type: 'textarea',
      },
      {
        id: 'close_contact',
        text: 'Has a close contact (school, nursery, household) also been confirmed with head lice?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' },
        ],
      },
    ],
  },

  'infantile-colic': {
    eligibilityQuestions: [
      {
        id: 'fever',
        text: 'Does the baby have a temperature above 38°C?',
        blockingAnswer: 'yes',
        blockingMessage: 'Fever in a young infant requires urgent medical assessment. Please call your GP or NHS 111 (111) immediately.',
      },
      {
        id: 'vomiting',
        text: 'Is the baby vomiting repeatedly or is there any green or yellow vomit?',
        blockingAnswer: 'yes',
        blockingMessage: 'Repeated or bile-stained vomiting in a baby requires urgent assessment. Please call NHS 111 immediately.',
      },
      {
        id: 'weight',
        text: 'Is the baby failing to gain weight or has lost weight recently?',
        blockingAnswer: 'yes',
        blockingMessage: 'Poor weight gain requires urgent attention from your health visitor or GP. Please contact them today.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'age',
        text: 'How old is the baby?',
        type: 'radio',
        options: [
          { value: '0_6wk', label: '0–6 weeks' },
          { value: '7_12wk', label: '7–12 weeks' },
          { value: '3_6mo', label: '3–6 months' },
          { value: 'over_6mo', label: 'Over 6 months' },
        ],
        required: true,
      },
      {
        id: 'crying_pattern',
        text: 'When does the crying typically occur?',
        type: 'radio',
        options: [
          { value: 'evening', label: 'Mainly in the evenings' },
          { value: 'throughout', label: 'Throughout the day' },
          { value: 'after_feeding', label: 'After or during feeding' },
          { value: 'unpredictable', label: 'At unpredictable times' },
        ],
        required: true,
      },
      {
        id: 'crying_duration',
        text: 'How long do the crying episodes typically last?',
        type: 'radio',
        options: [
          { value: 'under_1h', label: 'Less than 1 hour' },
          { value: '1_3h', label: '1–3 hours' },
          { value: 'over_3h', label: 'Over 3 hours' },
        ],
        required: true,
      },
      {
        id: 'feeding',
        text: 'How is the baby fed?',
        type: 'radio',
        options: [
          { value: 'breastfed', label: 'Breastfed' },
          { value: 'formula', label: 'Formula fed' },
          { value: 'mixed', label: 'Mixed feeding' },
        ],
        required: true,
      },
      {
        id: 'tried_remedies',
        text: 'Have you tried anything to help with the colic?',
        subtext: 'E.g. winding techniques, different formula, dietary changes for breastfeeding mum.',
        type: 'textarea',
      },
    ],
  },

  'ingrowing-toenail': {
    eligibilityQuestions: [
      {
        id: 'diabetes',
        text: 'Do you have diabetes, or a circulatory condition affecting your feet?',
        blockingAnswer: 'yes',
        blockingMessage: 'Ingrowing toenails in people with diabetes or poor circulation require specialist foot care assessment. Please see your GP or podiatrist.',
      },
      {
        id: 'spreading_infection',
        text: 'Is there significant spreading infection such as red streaks going up the foot, swollen lymph nodes, or severe pus?',
        blockingAnswer: 'yes',
        blockingMessage: 'Signs of spreading infection require urgent antibiotic treatment. Please see your GP today or go to an urgent care centre.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'which_toe',
        text: 'Which toe is affected?',
        type: 'radio',
        options: [
          { value: 'big_left', label: 'Big toe (left foot)' },
          { value: 'big_right', label: 'Big toe (right foot)' },
          { value: 'both_big', label: 'Both big toes' },
          { value: 'other', label: 'A different toe' },
        ],
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have you had this problem?',
        type: 'radio',
        options: [
          { value: 'few_days', label: 'A few days' },
          { value: '1_4wk', label: '1–4 weeks' },
          { value: '1_3mo', label: '1–3 months' },
          { value: 'over_3mo', label: 'Over 3 months (recurring problem)' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'What symptoms are you experiencing?',
        type: 'checkbox_group',
        options: [
          { value: 'pain', label: 'Pain when wearing shoes or walking' },
          { value: 'redness', label: 'Redness around the toenail' },
          { value: 'swelling', label: 'Swelling of the toe' },
          { value: 'discharge', label: 'Discharge or pus' },
          { value: 'granulation', label: 'Overgrowth of skin at the side of the nail' },
        ],
        required: true,
      },
      {
        id: 'severity',
        text: 'How would you rate the pain?',
        type: 'radio',
        options: [
          { value: 'mild', label: 'Mild – noticeable but manageable' },
          { value: 'moderate', label: 'Moderate – affecting daily activities' },
          { value: 'severe', label: 'Severe – very painful, limiting movement' },
        ],
        required: true,
      },
      {
        id: 'home_treatment',
        text: 'Have you tried any home treatments or soaking?',
        type: 'textarea',
      },
    ],
  },

  'mouth-ulcers': {
    eligibilityQuestions: [
      {
        id: 'lasting_over_3wk',
        text: 'Has this ulcer been present for more than 3 weeks?',
        blockingAnswer: 'yes',
        blockingMessage: 'Mouth ulcers lasting over 3 weeks require investigation to rule out serious causes. Please see your GP or dentist promptly.',
      },
      {
        id: 'dysphagia',
        text: 'Do you have difficulty swallowing, or unexplained weight loss?',
        blockingAnswer: 'yes',
        blockingMessage: 'These symptoms alongside mouth ulcers require urgent medical assessment. Please see your GP.',
      },
      {
        id: 'white_patches',
        text: 'Do you have white patches in your mouth that cannot be rubbed off?',
        blockingAnswer: 'yes',
        blockingMessage: 'Persistent white patches in the mouth require investigation. Please see your dentist or GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had the current ulcer(s)?',
        type: 'radio',
        options: [
          { value: 'under_1wk', label: 'Less than 1 week' },
          { value: '1_2wk', label: '1–2 weeks' },
          { value: '2_3wk', label: '2–3 weeks' },
        ],
        required: true,
      },
      {
        id: 'number',
        text: 'How many ulcers do you currently have?',
        type: 'radio',
        options: [
          { value: '1', label: '1 ulcer' },
          { value: '2_4', label: '2–4 ulcers' },
          { value: 'over_4', label: 'More than 4 ulcers' },
        ],
        required: true,
      },
      {
        id: 'location',
        text: 'Where in the mouth are the ulcers?',
        type: 'checkbox_group',
        options: [
          { value: 'inner_cheek', label: 'Inner cheek' },
          { value: 'tongue', label: 'Tongue' },
          { value: 'gum', label: 'Gum' },
          { value: 'lip', label: 'Inner lip' },
          { value: 'palate', label: 'Roof of mouth' },
        ],
        required: true,
      },
      {
        id: 'pain',
        text: 'How painful are the ulcers?',
        type: 'radio',
        options: [
          { value: 'mild', label: 'Mild – barely noticeable' },
          { value: 'moderate', label: 'Moderate – painful but manageable' },
          { value: 'severe', label: 'Severe – affecting eating and talking' },
        ],
        required: true,
      },
      {
        id: 'triggers',
        text: 'What do you think may have triggered the ulcers?',
        type: 'checkbox_group',
        options: [
          { value: 'injury', label: 'Minor mouth injury or biting the cheek' },
          { value: 'stress', label: 'Stress or illness' },
          { value: 'foods', label: 'Certain foods (citrus, spicy, salty)' },
          { value: 'hormonal', label: 'Hormonal changes' },
          { value: 'unknown', label: 'Unknown' },
        ],
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any treatments for the ulcers?',
        type: 'textarea',
      },
    ],
  },

  'nappy-rash': {
    eligibilityQuestions: [
      {
        id: 'spreading',
        text: 'Has the rash spread beyond the nappy area (e.g. up the back, onto the tummy, or down the legs)?',
        blockingAnswer: 'yes',
        blockingMessage: 'A rash spreading beyond the nappy area may indicate a different skin condition. Please see your GP.',
      },
      {
        id: 'fever',
        text: 'Does the baby have a fever (temperature above 38°C)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Fever alongside a skin rash in a baby requires medical assessment. Please contact your GP or call NHS 111.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long has the nappy rash been present?',
        type: 'radio',
        options: [
          { value: '1_3d', label: '1–3 days' },
          { value: '4_7d', label: '4–7 days' },
          { value: 'over_1wk', label: 'Over 1 week' },
        ],
        required: true,
      },
      {
        id: 'appearance',
        text: 'How does the rash look?',
        type: 'checkbox_group',
        options: [
          { value: 'red', label: 'Red and inflamed skin' },
          { value: 'blisters', label: 'Blisters or spots' },
          { value: 'white_patches', label: 'White patches or spots (possible thrush)' },
          { value: 'broken', label: 'Broken or cracked skin' },
          { value: 'dry', label: 'Dry and peeling skin' },
        ],
        required: true,
      },
      {
        id: 'skin_folds',
        text: 'Is the rash mainly in skin folds and creases?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes – mainly in the folds' },
          { value: 'no', label: 'No – on the flat surfaces' },
          { value: 'both', label: 'Both folds and flat surfaces' },
        ],
        required: true,
      },
      {
        id: 'nappy_frequency',
        text: 'How often are nappies changed?',
        type: 'radio',
        options: [
          { value: 'every_1_2h', label: 'Every 1–2 hours' },
          { value: 'every_2_4h', label: 'Every 2–4 hours' },
          { value: 'less', label: 'Less frequently than every 4 hours' },
        ],
        required: true,
      },
      {
        id: 'products',
        text: 'What nappy products are you currently using?',
        subtext: 'Include wipes, creams, barrier creams or any new products recently introduced.',
        type: 'textarea',
      },
    ],
  },

  'oral-candidiasis': {
    eligibilityQuestions: [
      {
        id: 'dysphagia',
        text: 'Do you have any difficulty or pain when swallowing?',
        blockingAnswer: 'yes',
        blockingMessage: 'Difficulty swallowing with oral thrush suggests the infection has spread to the oesophagus. Please see your GP urgently.',
      },
      {
        id: 'recurrent',
        text: 'Have you had more than 3 episodes of oral thrush without a clearly identified cause?',
        blockingAnswer: 'yes',
        blockingMessage: 'Recurrent oral thrush without an obvious cause requires investigation. Please see your GP who may want to run some tests.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had these symptoms?',
        type: 'radio',
        options: [
          { value: 'under_1wk', label: 'Less than 1 week' },
          { value: '1_2wk', label: '1–2 weeks' },
          { value: '2_4wk', label: '2–4 weeks' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'What symptoms do you have?',
        type: 'checkbox_group',
        options: [
          { value: 'white_patches', label: 'White or creamy patches inside the mouth' },
          { value: 'redness', label: 'Redness or soreness inside the mouth' },
          { value: 'corner_cracks', label: 'Cracking or soreness at the corners of the mouth' },
          { value: 'burning', label: 'Burning or sore mouth' },
          { value: 'taste_loss', label: 'Loss of taste' },
        ],
        required: true,
      },
      {
        id: 'inhaler',
        text: 'Do you use an inhaled steroid (e.g. for asthma or COPD)?',
        type: 'radio',
        options: YES_NO,
        required: true,
      },
      {
        id: 'antibiotics',
        text: 'Have you recently taken a course of antibiotics?',
        type: 'radio',
        options: [
          { value: 'yes_recent', label: 'Yes – in the last month' },
          { value: 'yes_3mo', label: 'Yes – 1–3 months ago' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'dentures',
        text: 'Do you wear dentures?',
        type: 'radio',
        options: YES_NO,
      },
    ],
  },

  'ringworm': {
    eligibilityQuestions: [
      {
        id: 'scalp',
        text: 'Is the affected area on your scalp?',
        blockingAnswer: 'yes',
        blockingMessage: 'Ringworm of the scalp (tinea capitis) requires prescription oral antifungal tablets that cannot be prescribed online. Please see your GP.',
      },
      {
        id: 'nails',
        text: 'Are your nails mainly affected (thickened, discoloured, crumbling nails)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Fungal nail infections typically require long courses of oral antifungals. Please see your GP for appropriate treatment.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had the rash?',
        type: 'radio',
        options: [
          { value: 'under_1wk', label: 'Less than 1 week' },
          { value: '1_4wk', label: '1–4 weeks' },
          { value: '1_3mo', label: '1–3 months' },
          { value: 'over_3mo', label: 'Over 3 months' },
        ],
        required: true,
      },
      {
        id: 'location',
        text: 'Where on the body is the rash?',
        type: 'checkbox_group',
        options: [
          { value: 'arm', label: 'Arm or hand' },
          { value: 'leg', label: 'Leg or foot' },
          { value: 'body', label: 'Body or trunk' },
          { value: 'groin', label: 'Groin (jock itch / tinea cruris)' },
          { value: 'face', label: 'Face' },
        ],
        required: true,
      },
      {
        id: 'appearance',
        text: 'What does the rash look like?',
        type: 'checkbox_group',
        options: [
          { value: 'ring_shaped', label: 'Ring-shaped or circular' },
          { value: 'scaly', label: 'Scaly or flaky' },
          { value: 'itchy', label: 'Itchy' },
          { value: 'red', label: 'Red and inflamed' },
          { value: 'clear_centre', label: 'Clear or healing in the centre' },
        ],
        required: true,
      },
      {
        id: 'contact',
        text: 'Have you been in contact with animals or a person with a similar rash recently?',
        type: 'radio',
        options: [
          { value: 'animals', label: 'Yes – animals' },
          { value: 'person', label: 'Yes – another person' },
          { value: 'both', label: 'Both' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any antifungal creams or treatments?',
        type: 'textarea',
      },
    ],
  },

  'scabies': {
    eligibilityQuestions: [
      {
        id: 'crusted',
        text: 'Do you have widespread thickened or crusty skin across large areas of your body (crusted/Norwegian scabies)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Crusted scabies is highly contagious and requires specialist treatment. Please see your GP immediately.',
      },
      {
        id: 'immunocompromised',
        text: 'Do you have a weakened immune system (e.g. HIV, chemotherapy, organ transplant)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Scabies in immunocompromised individuals can be more severe and may require specialist management. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had symptoms?',
        type: 'radio',
        options: [
          { value: 'few_days', label: 'A few days' },
          { value: '1_2wk', label: '1–2 weeks' },
          { value: '2_4wk', label: '2–4 weeks' },
          { value: 'over_1mo', label: 'Over 1 month' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'Which symptoms do you have?',
        type: 'checkbox_group',
        options: [
          { value: 'intense_itch', label: 'Intense itching, especially worse at night' },
          { value: 'spots', label: 'Small raised red spots or a rash' },
          { value: 'burrow_lines', label: 'Thin, wavy burrow lines on skin' },
          { value: 'fingers', label: 'Rash between fingers or on wrists' },
          { value: 'genitals', label: 'Spots on the genitals or buttocks' },
          { value: 'widespread', label: 'Widespread body rash' },
        ],
        required: true,
      },
      {
        id: 'close_contact',
        text: 'Have any close contacts (household members, partner) had similar symptoms?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' },
        ],
        required: true,
      },
      {
        id: 'previous_treatment',
        text: 'Have you already started any treatment?',
        type: 'textarea',
      },
      {
        id: 'communal_living',
        text: 'Have you or close contacts recently been in a care home, hospital ward, or other communal living environment?',
        type: 'radio',
        options: YES_NO,
      },
    ],
  },

  'sore-throat': {
    eligibilityQuestions: [
      {
        id: 'airway',
        text: 'Do you have any difficulty breathing, or is swallowing so painful you cannot manage even saliva?',
        blockingAnswer: 'yes',
        blockingMessage: 'These are signs of a potentially life-threatening condition. Call 999 immediately.',
      },
      {
        id: 'meningitis',
        text: 'Do you have a stiff neck, severe headache, sensitivity to light, or a non-blanching rash?',
        blockingAnswer: 'yes',
        blockingMessage: 'These symptoms may indicate meningitis or sepsis. Call 999 immediately.',
      },
      {
        id: 'abscess',
        text: 'Do you have a visible one-sided swelling at the back of your throat, or is your voice sounding muffled?',
        blockingAnswer: 'yes',
        blockingMessage: 'This may indicate a peritonsillar abscess requiring urgent drainage. Please go to A&E or call 999.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had your sore throat?',
        type: 'radio',
        options: [
          { value: 'under_24h', label: 'Less than 24 hours' },
          { value: '1_3d', label: '1–3 days' },
          { value: '4_7d', label: '4–7 days' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'Which symptoms do you have?',
        type: 'checkbox_group',
        options: [
          { value: 'pain_swallowing', label: 'Pain on swallowing' },
          { value: 'white_patches', label: 'White patches or pus on tonsils' },
          { value: 'swollen_glands', label: 'Swollen glands in the neck' },
          { value: 'fever', label: 'Fever or chills' },
          { value: 'voice_change', label: 'Change in voice or very hoarse' },
          { value: 'ear_pain', label: 'Ear pain' },
        ],
        required: true,
      },
      {
        id: 'temperature',
        text: 'What is your temperature?',
        type: 'radio',
        options: [
          { value: 'normal', label: 'Normal – below 38°C' },
          { value: 'mild_fever', label: 'Mildly raised – 38–38.9°C' },
          { value: 'high_fever', label: 'High – 39°C or above' },
          { value: 'not_checked', label: 'I haven\'t checked' },
        ],
        required: true,
      },
      {
        id: 'cold_symptoms',
        text: 'Do you also have cold-like symptoms such as a runny nose or cough?',
        type: 'radio',
        options: YES_NO,
      },
      {
        id: 'contact',
        text: 'Do you know if you have been in contact with someone with strep throat or similar illness?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' },
        ],
      },
    ],
  },

  'teething': {
    eligibilityQuestions: [
      {
        id: 'high_fever',
        text: 'Does the baby have a high fever (temperature above 38°C)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Teething does not cause high fevers. A high temperature in a baby requires medical assessment. Please call your GP or NHS 111.',
      },
      {
        id: 'refusing_feeds',
        text: 'Is the baby refusing all feeds or showing signs of significant distress?',
        blockingAnswer: 'yes',
        blockingMessage: 'A baby refusing all feeds requires medical assessment. Please contact your GP or call NHS 111.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'age',
        text: 'How old is the baby?',
        type: 'radio',
        options: [
          { value: '3_6mo', label: '3–6 months' },
          { value: '6_12mo', label: '6–12 months' },
          { value: '12_24mo', label: '12–24 months' },
          { value: 'over_24mo', label: 'Over 24 months' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'What symptoms is the baby showing?',
        type: 'checkbox_group',
        options: [
          { value: 'drooling', label: 'Increased drooling' },
          { value: 'chewing', label: 'Chewing or gnawing on things' },
          { value: 'swollen_gums', label: 'Red or swollen gums' },
          { value: 'irritable', label: 'Irritability and crying more than usual' },
          { value: 'sleep', label: 'Disturbed sleep' },
          { value: 'mild_temp', label: 'Mildly raised temperature (below 38°C)' },
        ],
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have symptoms been present?',
        type: 'radio',
        options: [
          { value: 'few_days', label: 'A few days' },
          { value: '1_2wk', label: '1–2 weeks' },
          { value: 'over_2wk', label: 'Over 2 weeks' },
        ],
        required: true,
      },
      {
        id: 'tooth_visible',
        text: 'Can you see a tooth coming through the gum?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes – clearly visible' },
          { value: 'almost', label: 'Not quite through yet, but visible under the gum' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'remedies_tried',
        text: 'Have you tried any teething remedies?',
        subtext: 'E.g. teething rings, gel, infant paracetamol.',
        type: 'textarea',
      },
    ],
  },

  'threadworms': {
    eligibilityQuestions: [
      {
        id: 'blood_in_stool',
        text: 'Have you noticed blood in the stools or severe abdominal pain?',
        blockingAnswer: 'yes',
        blockingMessage: 'These symptoms are not typical of threadworms and require medical assessment. Please see your GP.',
      },
      {
        id: 'immunocompromised',
        text: 'Is the patient immunocompromised (e.g. HIV, chemotherapy, on immunosuppressants)?',
        blockingAnswer: 'yes',
        blockingMessage: 'Threadworm treatment in immunocompromised individuals requires medical supervision. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'who_affected',
        text: 'Who is affected?',
        type: 'radio',
        options: [
          { value: 'myself_adult', label: 'Myself (adult)' },
          { value: 'child_under_2', label: 'My child (under 2 years old)' },
          { value: 'child_over_2', label: 'My child (over 2 years old)' },
          { value: 'multiple', label: 'Multiple family members' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'What symptoms are present?',
        type: 'checkbox_group',
        options: [
          { value: 'itch_night', label: 'Itching around the bottom, especially at night' },
          { value: 'worms_visible', label: 'Visible small white worms in stool or around the anus' },
          { value: 'sleep_disturbed', label: 'Disturbed sleep' },
          { value: 'irritable', label: 'Irritability (especially in children)' },
          { value: 'abdominal', label: 'Mild abdominal discomfort' },
        ],
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have symptoms been present?',
        type: 'radio',
        options: [
          { value: 'few_days', label: 'A few days' },
          { value: '1_2wk', label: '1–2 weeks' },
          { value: 'several_wk', label: 'Several weeks' },
        ],
        required: true,
      },
      {
        id: 'household',
        text: 'Have any other household members been affected?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Unsure' },
        ],
      },
      {
        id: 'treatment_started',
        text: 'Have you started any treatment yet?',
        type: 'textarea',
      },
    ],
  },

  'uti': {
    eligibilityQuestions: [
      {
        id: 'fever_loin_pain',
        text: 'Do you have a fever (above 38°C), shivering/rigors, or pain in your back or side (loin pain)?',
        blockingAnswer: 'yes',
        blockingMessage: 'These symptoms may indicate a kidney infection (pyelonephritis). Please see your GP today or go to A&E if symptoms are severe. Do not delay.',
      },
      {
        id: 'pregnant',
        text: 'Are you currently pregnant?',
        blockingAnswer: 'yes',
        blockingMessage: 'UTIs during pregnancy require immediate medical treatment. Please contact your GP or midwife today — do not use online pharmacy treatments.',
      },
      {
        id: 'male',
        text: 'Are you male?',
        blockingAnswer: 'yes',
        blockingMessage: 'UTIs are uncommon in men and may indicate another urinary condition requiring investigation. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had urinary symptoms?',
        type: 'radio',
        options: [
          { value: 'today', label: 'Started today' },
          { value: '1_2d', label: '1–2 days' },
          { value: '3_5d', label: '3–5 days' },
          { value: 'over_5d', label: 'Over 5 days' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'Which symptoms do you have?',
        type: 'checkbox_group',
        options: [
          { value: 'burning', label: 'Burning or stinging sensation when urinating' },
          { value: 'frequency', label: 'Needing to urinate much more frequently than usual' },
          { value: 'small_amounts', label: 'Passing only small amounts of urine each time' },
          { value: 'cloudy', label: 'Cloudy, dark or strong-smelling urine' },
          { value: 'blood', label: 'Blood in the urine (pink, red, or brown)' },
          { value: 'pressure', label: 'Lower abdominal pain, pressure or discomfort' },
        ],
        required: true,
      },
      {
        id: 'previous_uti',
        text: 'Have you had a UTI before?',
        type: 'radio',
        options: [
          { value: 'yes_frequent', label: 'Yes – frequently (3 or more times in the past year)' },
          { value: 'yes_occasional', label: 'Yes – occasionally' },
          { value: 'no', label: 'No – this is my first' },
        ],
        required: true,
      },
      {
        id: 'antibiotics_6mo',
        text: 'Have you taken antibiotics for a UTI in the past 6 months?',
        type: 'radio',
        options: YES_NO,
        required: true,
      },
      {
        id: 'catheter',
        text: 'Do you have a urinary catheter or known abnormality of the urinary tract?',
        type: 'radio',
        options: YES_NO,
        required: true,
      },
      {
        id: 'sexually_active',
        text: 'Are you sexually active?',
        type: 'radio',
        options: YES_NO,
      },
    ],
  },

  'vaginal-thrush': {
    eligibilityQuestions: [
      {
        id: 'first_episode',
        text: 'Is this your first ever episode of vaginal thrush?',
        blockingAnswer: 'yes',
        blockingMessage: 'For your first episode, we recommend confirming the diagnosis with your GP before starting treatment, as other conditions can present similarly.',
      },
      {
        id: 'pregnant',
        text: 'Are you currently pregnant?',
        blockingAnswer: 'yes',
        blockingMessage: 'Vaginal thrush during pregnancy requires specific treatment. Please see your GP or midwife.',
      },
      {
        id: 'recurrent',
        text: 'Have you had more than 4 episodes of thrush in the past year?',
        blockingAnswer: 'yes',
        blockingMessage: 'Recurrent thrush (4+ episodes per year) requires investigation to find an underlying cause. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had symptoms?',
        type: 'radio',
        options: [
          { value: 'under_24h', label: 'Less than 24 hours' },
          { value: '1_3d', label: '1–3 days' },
          { value: '3_7d', label: '3–7 days' },
          { value: 'over_1wk', label: 'Over 1 week' },
        ],
        required: true,
      },
      {
        id: 'symptoms',
        text: 'Which symptoms do you have?',
        type: 'checkbox_group',
        options: [
          { value: 'discharge', label: 'White, thick, cottage cheese-like discharge' },
          { value: 'itching', label: 'Itching and irritation' },
          { value: 'soreness', label: 'Soreness and burning' },
          { value: 'redness', label: 'Redness or swelling around the vaginal area' },
          { value: 'pain_sex', label: 'Pain or discomfort during sex' },
          { value: 'pain_urine', label: 'Burning when urinating' },
        ],
        required: true,
      },
      {
        id: 'severity',
        text: 'How severe are your symptoms?',
        type: 'radio',
        options: [
          { value: 'mild', label: 'Mild – mildly uncomfortable' },
          { value: 'moderate', label: 'Moderate – noticeably uncomfortable' },
          { value: 'severe', label: 'Severe – very sore and uncomfortable' },
        ],
        required: true,
      },
      {
        id: 'previous_episodes',
        text: 'How have you managed previous episodes?',
        subtext: 'Please include any treatments you\'ve used before and whether they worked.',
        type: 'textarea',
      },
      {
        id: 'contraception',
        text: 'Are you currently using hormonal contraception?',
        type: 'radio',
        options: [
          { value: 'yes_combined', label: 'Yes – combined pill or patch' },
          { value: 'yes_other', label: 'Yes – other hormonal method' },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },

  'warts-verrucae': {
    eligibilityQuestions: [
      {
        id: 'uncertain_diagnosis',
        text: 'Are you unsure if this is actually a wart or verruca — does it look unusual, bleed easily, or have irregular edges?',
        blockingAnswer: 'yes',
        blockingMessage: 'Unusual skin lesions need clinical assessment to rule out other causes. Please see your GP or dermatologist.',
      },
      {
        id: 'face_or_genital',
        text: 'Are the warts on your face or in the genital area?',
        blockingAnswer: 'yes',
        blockingMessage: 'Facial and genital warts require specialist assessment and treatment. Please see your GP.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'type',
        text: 'What type of lesion do you have?',
        type: 'radio',
        options: [
          { value: 'common_wart', label: 'Common wart (on hands, fingers, or knees)' },
          { value: 'plantar', label: 'Plantar verruca (on the sole of the foot)' },
          { value: 'flat', label: 'Flat warts (smooth, flat-topped)' },
          { value: 'multiple', label: 'Multiple warts in different locations' },
        ],
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have you had it?',
        type: 'radio',
        options: [
          { value: 'under_1mo', label: 'Less than 1 month' },
          { value: '1_6mo', label: '1–6 months' },
          { value: '6_12mo', label: '6–12 months' },
          { value: 'over_1yr', label: 'Over 1 year' },
        ],
        required: true,
      },
      {
        id: 'number',
        text: 'How many warts or verrucae do you have?',
        type: 'radio',
        options: [
          { value: '1', label: '1' },
          { value: '2_4', label: '2–4' },
          { value: '5_plus', label: '5 or more' },
        ],
        required: true,
      },
      {
        id: 'pain',
        text: 'Does it cause any pain or discomfort?',
        type: 'radio',
        options: [
          { value: 'no', label: 'No – painless' },
          { value: 'mild', label: 'Yes – mild discomfort when pressed' },
          { value: 'significant', label: 'Yes – significant pain affecting walking or grip' },
        ],
        required: true,
      },
      {
        id: 'previous_treatments',
        text: 'Have you tried any treatments?',
        subtext: 'E.g. salicylic acid, cryotherapy, duct tape. How effective were they?',
        type: 'textarea',
      },
    ],
  },

};

export function getConditionQuestions(conditionId: string): ConditionQuestionnaire {
  const aliasResolved = conditionAliases[conditionId] ?? conditionId;
  return (
    conditionQuestions[aliasResolved] ??
    newConditionQuestions[aliasResolved] ??
    conditionQuestions[conditionId] ??
    newConditionQuestions[conditionId] ??
  {
    eligibilityQuestions: [
      {
        id: 'general_emergency',
        text: 'Are you experiencing a medical emergency such as severe pain, difficulty breathing, or loss of consciousness?',
        blockingAnswer: 'yes',
        blockingMessage: 'Please call 999 immediately for a medical emergency.',
      },
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had these symptoms?',
        type: 'radio',
        options: [
          { value: 'under_1wk', label: 'Less than 1 week' },
          { value: '1_4wk', label: '1–4 weeks' },
          { value: 'over_1mo', label: 'Over 1 month' },
        ],
        required: true,
      },
      {
        id: 'symptom_description',
        text: 'Please describe your symptoms in detail.',
        type: 'textarea',
        required: true,
      },
      {
        id: 'previous_treatments',
        text: 'What treatments have you tried so far?',
        type: 'textarea',
      },
    ],
  });
}
