// Questionnaires for conditions linked from the treatments menu but not yet in
// conditionQuestions.ts. Wording adapted from common UK online pharmacy flows.

import type { ConditionQuestionnaire, EligibilityQuestion } from './conditionQuestions';

const softReview = (reason: string): string =>
  `Thanks for telling us. Because of ${reason}, our pharmacist will need to review this carefully before prescribing. You can still continue and we'll route it to a clinician — or change your answer if you've thought again.`;

const softPregnancy = (drugContext = 'this treatment'): EligibilityQuestion => ({
  id: 'pregnant_or_breastfeeding',
  text: 'Are you pregnant, trying to conceive, or breastfeeding?',
  blockingAnswer: 'yes',
  severity: 'soft',
  blockMessage: softReview(`${drugContext} needs careful review in pregnancy or while breastfeeding`),
  blockTitle: 'Pharmacist review needed',
});

const medsAllergiesBlock: EligibilityQuestion[] = [
  {
    id: 'severe_allergy',
    text: 'Have you ever had a severe allergic reaction (anaphylaxis) to any medicine?',
    blockingAnswer: 'yes',
    severity: 'soft',
    blockMessage: softReview('severe allergy history'),
  },
];

export const extendedConditionQuestions = {
  'back-pain': {
    eligibilityQuestions: [
      {
        id: 'numbness_weakness',
        text: 'Do you have numbness, tingling or weakness in your legs, or problems controlling your bladder or bowels?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('these can be signs of a serious spinal problem'),
      },
      {
        id: 'fever_weight_loss',
        text: 'Do you have fever, unexplained weight loss, or night sweats with this pain?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('systemic symptoms need urgent assessment'),
      },
      softPregnancy('NSAIDs'),
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'pain_location',
        text: 'Where is your back pain mainly?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'lower', label: 'Lower back' },
          { value: 'upper', label: 'Upper back' },
          { value: 'neck', label: 'Neck / shoulders' },
          { value: 'radiating', label: 'Pain radiating into leg or arm' },
        ],
      },
      {
        id: 'duration',
        text: 'How long have you had this pain?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'under_1wk', label: 'Less than 1 week' },
          { value: '1_4wk', label: '1 – 4 weeks' },
          { value: 'over_4wk', label: 'More than 4 weeks' },
        ],
      },
      {
        id: 'severity',
        text: 'How would you rate your pain today (0 = none, 10 = worst)?',
        kind: 'number',
        min: 0,
        max: 10,
        required: true,
      },
      {
        id: 'injury',
        text: 'Did the pain start after an injury or heavy lifting?',
        kind: 'yesno',
      },
      {
        id: 'previous_treatments',
        text: 'What have you already tried (e.g. paracetamol, ibuprofen, heat, physio)?',
        kind: 'textarea',
      },
      {
        id: 'preferred_treatment',
        text: 'Which treatment would you prefer if suitable?',
        kind: 'radio',
        options: [
          { value: 'naproxen', label: 'Naproxen with stomach protection' },
          { value: 'codeine_combo', label: 'Codeine combination (short course)' },
          { value: 'topical', label: 'Topical anti-inflammatory gel' },
          { value: 'unsure', label: 'Not sure — pharmacist to advise' },
        ],
      },
      {
        id: 'current_meds',
        text: 'List any prescription or OTC medicines you take.',
        kind: 'textarea',
      },
    ],
  },
  'cold-sores': {
    eligibilityQuestions: [
      softPregnancy('aciclovir'),
      {
        id: 'eye_involvement',
        text: 'Is the rash near or in your eye, or affecting your vision?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('ocular herpes needs urgent referral'),
      },
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'outbreak_stage',
        text: 'What stage is your cold sore at?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'tingle', label: 'Tingling / burning only (no blister yet)' },
          { value: 'blister', label: 'Blister or weeping sore' },
          { value: 'crusting', label: 'Crusting / healing' },
        ],
      },
      {
        id: 'hours_since_tingle',
        text: 'How many hours since you first noticed tingling or a blister?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'under_72h', label: 'Within 72 hours' },
          { value: 'over_72h', label: 'More than 72 hours ago' },
        ],
      },
      {
        id: 'frequency',
        text: 'How often do you get cold sores?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'first', label: 'First outbreak / rare' },
          { value: 'occasional', label: 'A few times a year' },
          { value: 'frequent', label: 'Very frequent (consider suppression)' },
        ],
      },
      {
        id: 'immunosuppressed',
        text: 'Are you immunosuppressed (e.g. chemotherapy, transplant medicines)?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'Preferred treatment if suitable?',
        kind: 'radio',
        options: [
          { value: 'aciclovir_cream', label: 'Aciclovir cream' },
          { value: 'aciclovir_tablets', label: 'Aciclovir tablets (episodic)' },
          { value: 'valaciclovir', label: 'Valaciclovir tablets' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  'dry-skin': {
    eligibilityQuestions: [
      {
        id: 'infected_eczema',
        text: 'Is the skin weeping, very hot, swollen or spreading quickly (possible infection)?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('infected eczema may need antibiotics'),
      },
      softPregnancy('topical steroids'),
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'body_areas',
        text: 'Which areas are affected?',
        kind: 'checkbox-multi',
        required: true,
        options: [
          { value: 'face', label: 'Face' },
          { value: 'hands', label: 'Hands' },
          { value: 'flexures', label: 'Inside elbows / behind knees' },
          { value: 'trunk', label: 'Trunk / limbs' },
          { value: 'widespread', label: 'Widespread' },
        ],
      },
      {
        id: 'duration',
        text: 'How long have you had dry or itchy skin?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'under_2wk', label: 'Less than 2 weeks' },
          { value: '2_12wk', label: '2 – 12 weeks' },
          { value: 'over_12wk', label: 'More than 12 weeks' },
        ],
      },
      {
        id: 'previous_steroid',
        text: 'Have you used prescription steroid creams before for this?',
        kind: 'yesno',
      },
      {
        id: 'asthma_hayfever',
        text: 'Do you also have asthma or hay fever (atopic tendency)?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'What would you like to try?',
        kind: 'radio',
        options: [
          { value: 'emollient', label: 'Intensive emollient / moisturiser' },
          { value: 'mild_steroid', label: 'Mild steroid cream (e.g. hydrocortisone)' },
          { value: 'moderate_steroid', label: 'Moderate steroid (pharmacist to confirm strength)' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  'vaginal-thrush': {
    eligibilityQuestions: [
      softPregnancy('oral fluconazole'),
      {
        id: 'abnormal_bleeding',
        text: 'Do you have abnormal vaginal bleeding, pelvic pain or fever?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('these symptoms may not be simple thrush'),
      },
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'symptoms',
        text: 'Which symptoms do you have?',
        kind: 'checkbox-multi',
        required: true,
        options: [
          { value: 'itch', label: 'Itching' },
          { value: 'discharge', label: 'Thick white discharge' },
          { value: 'soreness', label: 'Soreness / burning' },
          { value: 'sex_pain', label: 'Pain during sex' },
        ],
      },
      {
        id: 'previous_thrush',
        text: 'Have you had thrush diagnosed by a doctor or pharmacist before?',
        kind: 'yesno',
        required: true,
      },
      {
        id: 'recent_antibiotic',
        text: 'Have you taken antibiotics in the last 4 weeks?',
        kind: 'yesno',
      },
      {
        id: 'diabetes',
        text: 'Do you have diabetes?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'Preferred treatment?',
        kind: 'radio',
        options: [
          { value: 'pessary', label: 'Clotrimazole pessary + cream' },
          { value: 'oral', label: 'Single-dose fluconazole capsule' },
          { value: 'both', label: 'Oral + topical combination' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  'sore-throat': {
    eligibilityQuestions: [
      {
        id: 'breathing_swallow',
        text: 'Are you drooling, unable to swallow fluids, or struggling to breathe?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('airway difficulty needs emergency care'),
      },
      {
        id: 'weeks_duration',
        text: 'Have symptoms lasted more than 3 weeks?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('persistent sore throat needs GP assessment'),
      },
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had a sore throat?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'under_3d', label: 'Less than 3 days' },
          { value: '3_7d', label: '3 – 7 days' },
          { value: 'over_7d', label: 'More than 7 days' },
        ],
      },
      {
        id: 'symptoms',
        text: 'Do you also have any of the following?',
        kind: 'checkbox-multi',
        options: [
          { value: 'fever', label: 'Fever' },
          { value: 'pus_tonsils', label: 'White patches / pus on tonsils' },
          { value: 'cough', label: 'Cough' },
          { value: 'hoarse', label: 'Hoarse voice' },
          { value: 'none', label: 'None of these' },
        ],
        noneValue: 'none',
      },
      {
        id: 'fever_pain',
        text: 'Do you have fever or feel very unwell?',
        kind: 'yesno',
      },
      {
        id: 'recent_strep',
        text: 'Have you had strep throat or tonsillitis in the last 3 months?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'What are you hoping for?',
        kind: 'radio',
        options: [
          { value: 'spray_lozenge', label: 'Spray / lozenges for symptom relief' },
          { value: 'antibiotic', label: 'Antibiotic if pharmacist agrees it is bacterial' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  constipation: {
    eligibilityQuestions: [
      {
        id: 'blood_weight_loss',
        text: 'Have you noticed blood in your stool, black stools, or unexplained weight loss?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('alarm bowel symptoms need GP review'),
      },
      softPregnancy('laxatives'),
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you been constipated?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'under_1wk', label: 'Less than 1 week' },
          { value: '1_4wk', label: '1 – 4 weeks' },
          { value: 'over_4wk', label: 'More than 4 weeks' },
        ],
      },
      {
        id: 'bowel_habit',
        text: 'How often do you usually open your bowels?',
        kind: 'radio',
        options: [
          { value: 'less_than_3_week', label: 'Fewer than 3 times per week' },
          { value: '3_6_week', label: '3 – 6 times per week' },
          { value: 'daily', label: 'Daily but still difficult' },
        ],
      },
      {
        id: 'laxative_use',
        text: 'Have you used laxatives recently?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'Preferred approach?',
        kind: 'radio',
        options: [
          { value: 'osmotic', label: 'Lactulose / macrogol (osmotic)' },
          { value: 'stimulant', label: 'Short-course stimulant laxative' },
          { value: 'suppository', label: 'Glycerin suppository' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  diarrhoea: {
    eligibilityQuestions: [
      {
        id: 'blood_fever',
        text: 'Do you have blood in your stool, high fever, or severe tummy pain?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('these symptoms may need antibiotics or urgent care'),
      },
      softPregnancy('loperamide'),
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'duration',
        text: 'How long have you had diarrhoea?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'under_48h', label: 'Less than 48 hours' },
          { value: '2_7d', label: '2 – 7 days' },
          { value: 'over_7d', label: 'More than 7 days' },
        ],
      },
      {
        id: 'travel',
        text: 'Have you travelled abroad in the last 4 weeks?',
        kind: 'yesno',
      },
      {
        id: 'dehydration',
        text: 'Are you dizzy, passing little urine, or very thirsty?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'What would you like?',
        kind: 'radio',
        options: [
          { value: 'rehydration', label: 'Oral rehydration sachets' },
          { value: 'loperamide', label: 'Loperamide (short course)' },
          { value: 'both', label: 'Both' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  threadworms: {
    eligibilityQuestions: [
      softPregnancy('mebendazole'),
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'symptoms',
        text: 'What symptoms have you noticed?',
        kind: 'checkbox-multi',
        required: true,
        options: [
          { value: 'anal_itch', label: 'Itchy bottom (especially at night)' },
          { value: 'seen_worms', label: 'Seen worms in stool or underwear' },
          { value: 'household', label: 'Someone else at home has threadworms' },
        ],
      },
      {
        id: 'who_for',
        text: 'Who needs treatment?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'self', label: 'Just me' },
          { value: 'household', label: 'Whole household (recommended)' },
        ],
      },
      {
        id: 'age',
        text: 'Age of the person being treated',
        kind: 'number',
        min: 2,
        max: 120,
        unit: 'years',
        required: true,
      },
      {
        id: 'under_2',
        text: 'Is anyone in the household under 2 years old?',
        kind: 'yesno',
      },
    ],
  },
  chickenpox: {
    eligibilityQuestions: [
      {
        id: 'adult_severe',
        text: 'Are you an adult with widespread rash, chest pain or difficulty breathing?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('adult chickenpox can be serious'),
      },
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'who_for',
        text: 'Who is this treatment for?',
        kind: 'radio',
        required: true,
        options: [
          { value: 'child', label: 'Child' },
          { value: 'adult', label: 'Adult' },
        ],
      },
      {
        id: 'age',
        text: 'Age of the person with chickenpox',
        kind: 'number',
        min: 0,
        max: 99,
        unit: 'years',
        required: true,
      },
      {
        id: 'rash_stage',
        text: 'How long since the rash appeared?',
        kind: 'radio',
        options: [
          { value: 'under_24h', label: 'Less than 24 hours' },
          { value: '1_5d', label: '1 – 5 days' },
          { value: 'over_5d', label: 'More than 5 days' },
        ],
      },
      {
        id: 'itch_fever',
        text: 'Is itching or fever the main problem?',
        kind: 'radio',
        options: [
          { value: 'itch', label: 'Itching' },
          { value: 'fever', label: 'Fever' },
          { value: 'both', label: 'Both' },
        ],
      },
    ],
  },
  'head-lice': {
    eligibilityQuestions: [...medsAllergiesBlock],
    clinicalQuestions: [
      {
        id: 'confirmed',
        text: 'Have you seen live lice or nits (eggs) in the hair?',
        kind: 'yesno',
        required: true,
      },
      {
        id: 'tried_before',
        text: 'Have you used a head lice treatment in the last 2 weeks?',
        kind: 'yesno',
      },
      {
        id: 'household',
        text: 'Does anyone else in the household have head lice?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'Preferred treatment type?',
        kind: 'radio',
        options: [
          { value: 'dimeticone', label: 'Dimeticone lotion (physical action)' },
          { value: 'permethrin', label: 'Permethrin / malathion lotion' },
          { value: 'comb', label: 'Detection comb only' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  'nappy-rash': {
    eligibilityQuestions: [
      {
        id: 'unwell_fever',
        text: 'Is your baby unwell with fever, not feeding, or very irritable?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('an unwell baby needs medical assessment'),
      },
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'baby_age',
        text: "Baby's age in months",
        kind: 'number',
        min: 0,
        max: 36,
        unit: 'months',
        required: true,
      },
      {
        id: 'rash_type',
        text: 'What does the rash look like?',
        kind: 'radio',
        options: [
          { value: 'red_dry', label: 'Red, dry patches' },
          { value: 'spotty', label: 'Spotty with satellite lesions (possible thrush)' },
          { value: 'broken', label: 'Broken / weeping skin' },
        ],
      },
      {
        id: 'duration',
        text: 'How long has the rash been present?',
        kind: 'radio',
        options: [
          { value: 'under_3d', label: 'Less than 3 days' },
          { value: 'over_3d', label: 'More than 3 days' },
        ],
      },
      {
        id: 'antifungal_tried',
        text: 'Have you tried a barrier cream or antifungal cream already?',
        kind: 'textarea',
      },
    ],
  },
  teething: {
    eligibilityQuestions: [
      {
        id: 'high_fever',
        text: 'Does your baby have a temperature of 38°C or higher?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('fever in young babies needs medical review'),
      },
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'baby_age',
        text: "Baby's age in months",
        kind: 'number',
        min: 3,
        max: 36,
        unit: 'months',
        required: true,
      },
      {
        id: 'symptoms',
        text: 'Which symptoms are bothering them most?',
        kind: 'checkbox-multi',
        options: [
          { value: 'gum_pain', label: 'Sore gums / chewing everything' },
          { value: 'drooling', label: 'Drooling / flushed cheek' },
          { value: 'sleep', label: 'Disturbed sleep' },
          { value: 'none', label: 'None of these' },
        ],
        noneValue: 'none',
      },
      {
        id: 'preferred_treatment',
        text: 'What would you like?',
        kind: 'radio',
        options: [
          { value: 'gel', label: 'Teething gel (sugar-free)' },
          { value: 'suspension', label: 'Paracetamol or ibuprofen suspension' },
          { value: 'both', label: 'Both' },
        ],
      },
    ],
  },
  'infantile-colic': {
    eligibilityQuestions: [
      {
        id: 'vomiting_green',
        text: 'Is your baby vomiting green fluid, not gaining weight, or very lethargic?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('these are not typical colic symptoms'),
      },
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'baby_age',
        text: "Baby's age in weeks",
        kind: 'number',
        min: 0,
        max: 26,
        unit: 'weeks',
        required: true,
      },
      {
        id: 'crying_pattern',
        text: 'When does crying mainly happen?',
        kind: 'radio',
        options: [
          { value: 'evening', label: 'Same time each evening' },
          { value: 'after_feeds', label: 'After feeds' },
          { value: 'unpredictable', label: 'Unpredictable' },
        ],
      },
      {
        id: 'feeding',
        text: 'Breast or bottle fed?',
        kind: 'radio',
        options: [
          { value: 'breast', label: 'Breast' },
          { value: 'bottle', label: 'Bottle' },
          { value: 'mixed', label: 'Mixed' },
        ],
      },
      {
        id: 'tried_simeticone',
        text: 'Have you tried simeticone (Infacol / Colief) before?',
        kind: 'yesno',
      },
    ],
  },
  conjunctivitis: {
    eligibilityQuestions: [
      {
        id: 'contact_lens',
        text: 'Do you wear contact lenses?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('contact lens wearers need specialist eye assessment'),
      },
      {
        id: 'vision_loss',
        text: 'Is your vision reduced or is there severe pain?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('serious eye symptoms need urgent care'),
      },
      softPregnancy('chloramphenicol'),
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'eye',
        text: 'Which eye(s) are affected?',
        kind: 'radio',
        options: [
          { value: 'one', label: 'One eye' },
          { value: 'both', label: 'Both eyes' },
        ],
      },
      {
        id: 'discharge',
        text: 'Is there sticky yellow/green discharge, especially on waking?',
        kind: 'yesno',
        required: true,
      },
      {
        id: 'duration',
        text: 'How long have you had symptoms?',
        kind: 'radio',
        options: [
          { value: 'under_3d', label: 'Less than 3 days' },
          { value: 'over_3d', label: 'More than 3 days' },
        ],
      },
      {
        id: 'preferred_treatment',
        text: 'Preferred treatment?',
        kind: 'radio',
        options: [
          { value: 'drops', label: 'Chloramphenicol eye drops' },
          { value: 'ointment', label: 'Chloramphenicol eye ointment' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  'dry-eye': {
    eligibilityQuestions: [
      {
        id: 'severe_pain',
        text: 'Do you have severe eye pain, light sensitivity or reduced vision?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('these symptoms need urgent eye assessment'),
      },
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'symptoms',
        text: 'Which symptoms do you have?',
        kind: 'checkbox-multi',
        options: [
          { value: 'gritty', label: 'Gritty / sandy feeling' },
          { value: 'burning', label: 'Burning' },
          { value: 'watering', label: 'Watering' },
          { value: 'redness', label: 'Mild redness' },
        ],
      },
      {
        id: 'screen_use',
        text: 'Do symptoms worsen with screen use or air conditioning?',
        kind: 'yesno',
      },
      {
        id: 'contact_lens',
        text: 'Do you wear contact lenses?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'Preferred product?',
        kind: 'radio',
        options: [
          { value: 'drops', label: 'Preservative-free drops' },
          { value: 'gel', label: 'Gel / ointment for night' },
          { value: 'hygiene', label: 'Lid hygiene gel' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  'mouth-ulcers': {
    eligibilityQuestions: [
      {
        id: 'persistent',
        text: 'Have ulcers lasted more than 3 weeks or keep coming back?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('persistent ulcers need GP or dental review'),
      },
      softPregnancy('topical treatments'),
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'ulcer_count',
        text: 'How many ulcers do you have now?',
        kind: 'radio',
        options: [
          { value: 'one', label: 'One' },
          { value: 'few', label: 'A few' },
          { value: 'many', label: 'Many / widespread' },
        ],
      },
      {
        id: 'pain_eating',
        text: 'Is pain stopping you eating or drinking?',
        kind: 'yesno',
      },
      {
        id: 'triggers',
        text: 'Any recent stress, dental work, or new toothpaste?',
        kind: 'textarea',
      },
      {
        id: 'preferred_treatment',
        text: 'Preferred treatment?',
        kind: 'radio',
        options: [
          { value: 'gel', label: 'Corticosteroid dental paste / gel' },
          { value: 'rinse', label: 'Antiseptic mouthwash' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
  'oral-candidiasis': {
    eligibilityQuestions: [
      {
        id: 'swallowing',
        text: 'Do you have pain or white patches when swallowing (possible oesophageal thrush)?',
        blockingAnswer: 'yes',
        severity: 'soft',
        blockMessage: softReview('deeper infection needs medical assessment'),
      },
      softPregnancy('oral antifungals'),
      ...medsAllergiesBlock,
    ],
    clinicalQuestions: [
      {
        id: 'symptoms',
        text: 'What are your symptoms?',
        kind: 'checkbox-multi',
        options: [
          { value: 'white_patches', label: 'White patches that scrape off' },
          { value: 'soreness', label: 'Soreness / burning' },
          { value: 'taste', label: 'Loss of taste / cotton wool feeling' },
        ],
      },
      {
        id: 'inhaler_steroid',
        text: 'Do you use a steroid inhaler without rinsing your mouth afterwards?',
        kind: 'yesno',
      },
      {
        id: 'dentures',
        text: 'Do you wear dentures?',
        kind: 'yesno',
      },
      {
        id: 'preferred_treatment',
        text: 'Preferred treatment?',
        kind: 'radio',
        options: [
          { value: 'gel', label: 'Miconazole oral gel' },
          { value: 'lozenge', label: 'Nystatin oral suspension' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
    ],
  },
} as const satisfies Record<string, ConditionQuestionnaire>;
