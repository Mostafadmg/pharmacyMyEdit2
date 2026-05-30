/* ============================================================================
   Email macro library — de-branded, generic clinical templates.
   All provider-specific branding, phone numbers, and customer-support lines
   have been removed so these can be used by any business. Patient name uses
   the <<Patient Name>> placeholder.
   ============================================================================ */

export const MACRO_CATEGORIES = [
  "SCR / Clinical",
  "Transfer / PUE",
  "ID / Photos",
  "Weight Changes",
  "Side Effects",
  "Wegovy 7.2mg",
  "Gap in Treatment",
  "Rejection",
] as const;

export type MacroCategory = (typeof MACRO_CATEGORIES)[number];

export type EmailMacro = {
  id: string;
  category: MacroCategory;
  name: string;
  description: string;
  content: string;
};

const SIGN_OFF = "Kind regards,\nThe Clinical Team";
const AUTO_SIGN_OFF = "Kind regards,\nThe Team";

/**
 * Turn a stored macro into a ready-to-send message:
 *  • strip the `Subject:` / `[Automated…]` title lines so it reads straight
 *    from the patient greeting,
 *  • swap the generic team sign-off for the prescriber's name (username),
 *  • optionally fill the patient-name placeholder when a name is known.
 */
export function frameMacroEmail(
  content: string,
  username: string,
  patientName?: string,
): string {
  let text = content
    .split("\n")
    .filter((line) => !/^\s*subject:/i.test(line) && !/^\s*\[automated/i.test(line))
    .join("\n")
    .replace(/^[\s\n]+/, "");

  const replaced = text.replace(
    /(Kind [Rr]egards,\s*\n)[^\n]*\s*$/,
    (_m, prefix: string) => `${prefix}${username}`,
  );
  text = replaced !== text ? replaced : `${text.trimEnd()}\n\nKind regards,\n${username}`;

  const name = patientName?.trim();
  if (name) {
    text = text
      .replace(/<<\s*Patient Name\s*>>/gi, name)
      .replace(/\[\s*Patient Name\s*\]/gi, name)
      .replace(/\{\s*Patient Name\s*\}/gi, name);
  }
  return text;
}

export const EMAIL_MACROS: EmailMacro[] = [
  /* ───────────── SCR / Clinical ───────────── */
  {
    id: "scr-time-sensitive",
    category: "SCR / Clinical",
    name: "Time-sensitive conditions",
    description: "Confirm timing of a condition from the medical history.",
    content: `Subject: Request for Further Information About Your Medical History

Dear <<Patient Name>>,

I can see from your records that you have had [X condition]. Could you please provide us with a bit more information about when this occurred and any relevant details you feel may be important?

Your response will help us ensure that we have an accurate and up-to-date understanding of your medical history when reviewing your request.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-gallbladder",
    category: "SCR / Clinical",
    name: "Gallbladder problem — cholecystectomy check",
    description: "Records show a gallbladder problem; confirm if removed.",
    content: `Subject: Follow-Up on Your Medical History

Dear <<Patient Name>>,

From your records, I can see you have had a gallbladder problem noted. Could you please confirm if you have had a cholecystectomy (gallbladder removal surgery) following this, and if so, when the surgery took place?

This information will help us ensure your medical history is accurate and up to date.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-cancer",
    category: "SCR / Clinical",
    name: "Cancer — request status details",
    description: "Records show a cancer diagnosis; request status.",
    content: `Subject: Follow-Up on Your Medical History

Dear <<Patient Name>>,

We would be grateful if you could provide us with some further details about your medical history:

• Have you ever had a cancer diagnosis (excluding MEN2 or medullary thyroid cancer)?
• Are you currently on, or awaiting, any treatment such as surgery, chemotherapy, or radiotherapy?
• Is the cancer in remission?
• Have you been discharged from the oncology team? If so, please send a copy of your discharge letter or your most recent letter from the oncology team.

Your response will help us make sure we have an accurate and up-to-date understanding of your medical history.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-cancer-general",
    category: "SCR / Clinical",
    name: "History of cancer (general template)",
    description: "General clarification for any cancer history.",
    content: `Subject: Follow-Up on Your Cancer Medical History

Dear <<Patient Name>>,

During our routine clinical review, we noted a history of cancer recorded in your medical records.

To ensure we can assess your suitability for treatment safely, we need to gather some additional information, as it is not always clear from records alone whether a condition is active or resolved.

We would be grateful if you could please confirm the following:

• What type of cancer were you diagnosed with?
• When were you diagnosed with this condition?
• Are you currently under the care of a specialist (e.g. oncology team)?
• Are you currently receiving, or awaiting, any cancer-related treatment such as surgery, chemotherapy, radiotherapy, immunotherapy, or targeted therapy?
• Is the cancer considered to be in remission?
• Have you been formally discharged from the oncology team? If so, please provide a copy of your discharge letter or your most recent clinic correspondence.
• Are you currently taking any medication related to cancer treatment or remission maintenance?

Once we receive this information, we will be able to continue reviewing your request.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-breast-cancer",
    category: "SCR / Clinical",
    name: "Breast cancer history clarification",
    description: "Clarify breast cancer status before prescribing.",
    content: `Subject: Follow-Up on Your Breast Cancer Medical History

Dear <<Patient Name>>,

We have reviewed your medical history and would like to clarify some information regarding your breast cancer diagnosis before we can proceed with your prescription.

Could you please confirm the following:

1. Are you currently under the care of an oncology team for your breast cancer?
2. Are you receiving any active cancer treatments now or planned soon? (e.g., chemotherapy, radiotherapy, targeted therapy)
3. Are you on long-term hormone therapy only (e.g., tamoxifen, Zoladex)? If so, has there been any recent recurrence or spread of the cancer?

Please note that being on long-term hormone therapy alone does not prevent us from prescribing GLP-1 medication, as long as you are not receiving active cancer treatment and are not currently under oncology care.

${SIGN_OFF}`,
  },
  {
    id: "scr-heart-failure",
    category: "SCR / Clinical",
    name: "Heart failure — request stage info",
    description: "Records show heart failure; request cardiology details.",
    content: `Subject: Request for Information on Heart Failure Diagnosis

Dear <<Patient Name>>,

We can see a coded diagnosis of heart failure in your records. To ensure we have the most accurate and up-to-date information about your condition, could you please provide us with either:

• A copy of your most recent cardiology letter, or
• Any additional details regarding your diagnosis that you feel are relevant.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-ckd",
    category: "SCR / Clinical",
    name: "CKD — request eGFR / stage",
    description: "Records show chronic kidney disease; request eGFR.",
    content: `Subject: Request for Information on CKD Diagnosis

Dear <<Patient Name>>,

We can see a diagnosis of chronic kidney disease (CKD) noted in your records. To ensure we have the most accurate and up-to-date information about your condition, could you please provide us with at least one of the following:

• Your most recent eGFR result, and/or
• A copy of the latest letter from your specialist with further details about your CKD.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-pregnancy",
    category: "SCR / Clinical",
    name: "Pregnancy / breastfeeding / TTC status",
    description: "Confirm current pregnancy status.",
    content: `Subject: Follow-Up on Your Current Status

Dear <<Patient Name>>,

To help us provide the most appropriate care, could you please confirm your current status regarding the following:

• Are you currently pregnant?
• Are you breastfeeding?
• Are you trying to conceive?

Your response will ensure we have accurate and up-to-date information for your care.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-dementia",
    category: "SCR / Clinical",
    name: "Dementia / cognitive impairment",
    description: "Assess home support and safe use.",
    content: `Subject: Follow-Up on Your Care and Support

Dear <<Patient Name>>,

We can see that dementia is noted in your records. To help us understand your needs and provide the best support, could you please let us know:

• How do you manage at home on a day-to-day basis?
• Do you have any help or support at home?

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-malabsorption",
    category: "SCR / Clinical",
    name: "Chronic malabsorption",
    description: "Request evidence of formal diagnosis.",
    content: `Subject: Request for Information on Chronic Malabsorption

Dear <<Patient Name>>,

We can see a note of chronic malabsorption in your records. To ensure we have accurate and up-to-date information about your condition, could you please provide us with:

• Evidence of a formal diagnosis, or
• A letter from your specialist with further details regarding your condition.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-mental-health",
    category: "SCR / Clinical",
    name: "Mental health — assess current state",
    description: "Records show depression/anxiety/suicidal ideation.",
    content: `Subject: Mental Health and Wellbeing Check

Dear <<Patient Name>>,

We've noticed from your records that you may have experienced symptoms of depression or anxiety before, and we want to make sure you're receiving the best possible care.

To help us look after you safely, could you please let us know a little about how you've been feeling recently?

• Have you noticed any changes in your mood over the past few weeks or months?
• Have you had any thoughts of self-harm?
• Have you had any thoughts about ending your life?

If you are currently experiencing any thoughts of self-harm or of ending your life, please reach out for help straight away. You can contact your GP or local crisis service for urgent support. In the UK, you can also contact Samaritans on 116 123, any time, day or night.

Thank you for taking the time to share how you've been feeling. This information helps us ensure your care is safe, in your best interests, and tailored to your needs.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-alcohol",
    category: "SCR / Clinical",
    name: "Alcohol use (CAGE screening)",
    description: "Records show alcohol concerns; CAGE questions.",
    content: `Subject: Follow-Up on Alcohol Use

Dear <<Patient Name>>,

As part of your care with us, we've noticed that there may be a history of alcohol use or concerns noted in your records. To make sure we're supporting you in the best and safest way possible, we'd be grateful if you could share a little more about your current situation:

• How much alcohol you're currently drinking.
• Whether you've ever felt you should cut down on your drinking.
• Whether you've ever felt annoyed by criticism of your drinking.
• Whether you've ever felt guilty about your drinking.
• Whether you ever have a drink first thing in the morning (an "eye-opener") to start the day or ease a hangover.

There's no judgment here — our goal is simply to ensure your care is safe, respectful, and tailored to your needs.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-retinopathy",
    category: "SCR / Clinical",
    name: "Retinopathy — request clinic information",
    description: "Records show retinopathy; assess status.",
    content: `Subject: Request for Information on Retinopathy

Dear <<Patient Name>>,

As part of our routine clinical safety checks, we can see a note referring to retinopathy. To ensure this treatment is safe and appropriate for you, we just need a little more information before we can proceed.

Could you please let us know:

• Whether this condition is currently active or stable
• Whether you are under ongoing follow-up with an optician or eye specialist
• Whether you have ever required treatment, such as eye injections or laser therapy
• Whether you have been discharged from ophthalmology care, and if so, when
• Whether you have noticed any recent changes in your vision

This information helps us assess suitability for treatment and ensure your safety before issuing a prescription.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-access-declined",
    category: "SCR / Clinical",
    name: "SCR access declined",
    description: "Patient has not granted Summary Care Record access.",
    content: `Subject: Update Regarding Access to Summary Care Records (SCR)

Dear <<Patient Name>>,

We wanted to let you know about an important part of our prescribing process.

We are unable to prescribe medication if access to the Summary Care Record (SCR) is declined. Access to the SCR is essential to ensure that we can prescribe safely and in line with clinical guidance.

It appears that you have not granted us access to your SCR. If you would like to review this decision or have any questions about what the SCR is, we would be happy to provide more information.

If you wish to change your mind and allow us access to your SCR, we would be happy to move forward with your prescription. However, if you choose not to grant access, we will need to reject your prescription request, and you will receive a full refund.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },
  {
    id: "scr-suspicious-bmi",
    category: "SCR / Clinical",
    name: "Suspicious BMI — photo verification required",
    description: "Request a side-profile full-length photo.",
    content: `Subject: Additional Photo Required for BMI Verification

Dear <<Patient Name>>,

Thank you for providing your recent photo.

Unfortunately, we're unable to verify your BMI based on the image provided, as it does not clearly align with the height and weight information submitted.

To allow us to proceed safely, could you please provide the following:

• A side-profile, full-length photo, taken in fitted clothing
• A clear, well-lit image showing your full body
• Confirmation of your most recent weight and height (measured as accurately as possible)

Once we receive this information, we'll reassess your order and update you accordingly.

${SIGN_OFF}`,
  },

  /* ───────────── Transfer / PUE ───────────── */
  {
    id: "pue-combined",
    category: "Transfer / PUE",
    name: "Combined PUE & previous weight photo",
    description: "Need both PUE and starting-BMI photo (below-licence BMI).",
    content: `Subject: Additional Verification Required for Your Order

Dear <<Patient Name>>,

As you are transferring from another provider and your current BMI is below the standard licensing threshold, we need to verify both your previous treatment and that you met the BMI criteria when you first started GLP-1 therapy.

Please provide the following TWO items:

1. PROOF OF PREVIOUS USE (PUE)
Evidence must clearly show ALL of the following:
• Patient name or email
• Medication and dose
• Date
• From a regulated provider

2. PREVIOUS WEIGHT VERIFICATION PHOTO
Please provide a photo from when you FIRST started GLP-1 treatment that:
• Was taken within 30 days of starting GLP-1 treatment
• Shows you full-length in fitted clothing
• Is well lit and clear

Once we receive both items, we will review your order.

${SIGN_OFF}`,
  },
  {
    id: "pue-incomplete",
    category: "Transfer / PUE",
    name: "Previous use evidence — missing info",
    description: "PUE submitted but missing required information.",
    content: `Subject: Additional Evidence Required

Dear <<Patient Name>>,

Thank you for providing evidence of your previous GLP-1 treatment.

Unfortunately, the evidence submitted does not currently meet our verification requirements. For the evidence to be acceptable it must include all of the following:

• Patient name or email — your full name (not a nickname) or the email address used with the previous provider
• Medication and dose — the exact medication name and strength prescribed
• Date — order date, prescription date, or dispatch date
• Regulated provider — the name of the healthcare provider, clinic, or pharmacy that supplied the treatment

At present, the evidence provided is missing [INSERT MISSING DETAILS].

Please provide updated evidence that includes all of the above information so we can continue with your review.

${SIGN_OFF}`,
  },
  {
    id: "pue-starting-bmi",
    category: "Transfer / PUE",
    name: "Previous BMI photo (starting BMI)",
    description: "Below-licence BMI; need starting-BMI photo.",
    content: `Subject: Previous Weight Photo Required

Dear <<Patient Name>>,

Your current BMI is below the standard licensing threshold for this medication. To continue treatment, we need to verify that you met the licence criteria when you first started GLP-1 therapy.

Please provide a previous BMI weight-verification photo that:

• Was taken within 30 days of starting GLP-1 treatment with your previous provider
• Shows you full-length or nearly full-length in fitted clothing
• Is well lit and clear enough for us to see your body shape
• Allows us to confirm that you met the licensed BMI at that time

If possible, please also provide the approximate date the photo was taken.

Once we receive acceptable evidence, we'll reassess your order.

${SIGN_OFF}`,
  },
  {
    id: "pue-2-weeks",
    category: "Transfer / PUE",
    name: "PUE gap >2 weeks since last dose",
    description: "Determine restart dose after a gap.",
    content: `Subject: Clarification on Treatment Gap

Dear <<Patient Name>>,

We can see from your previous use evidence that there has been a gap of more than 2 weeks since your last GLP-1 injection.

For safety reasons, if you have missed more than 2 consecutive weeks of treatment, we may need to restart you at a lower dose rather than your previous maintenance dose.

Please confirm:
1. When did you take your last injection?
2. How long have you been without medication?

Once we have this information, we can determine the appropriate dose for you to restart on.

${SIGN_OFF}`,
  },
  {
    id: "pue-weight-verification",
    category: "Transfer / PUE",
    name: "Repeat customer weight/height verification",
    description: "Photo inconsistent with declared weight.",
    content: `Subject: Weight Verification Required

Dear <<Patient Name>>,

To continue processing your prescription, we need to verify your current weight. Please provide:

• A clear, full-length photo taken within the last 30 days
• The photo should show you in fitted clothing
• Good lighting so we can clearly see your body shape

Alternatively, you can provide a photo showing your weight on scales.

${SIGN_OFF}`,
  },
  {
    id: "transfer-dose-offer",
    category: "Transfer / PUE",
    name: "Transfer dose adjustment offer",
    description: "Offer correct start dose with proceed/cancel options.",
    content: `Subject: Dose Adjustment for Your Order

Dear <<Patient Name>>,

Following our clinical review of the information available, we have determined that the most appropriate dose to start treatment with us would be [MEDICATION] [DOSE].

We understand that this may differ from the dose you originally ordered. To support you, we would like to offer the following two options:

1. If you are happy to proceed with [MEDICATION] [DOSE], please reply to this email to confirm. Any difference in price compared to what you originally ordered will be refunded.
2. If you would prefer not to proceed at this dose, we can cancel your order and provide a full refund.

Please let us know how you would like to proceed so we can take the appropriate next steps.

${SIGN_OFF}`,
  },

  /* ───────────── ID / Photos ───────────── */
  {
    id: "id-failed-auto",
    category: "ID / Photos",
    name: "Failed ID (automated)",
    description: "Automated email when ID verification fails.",
    content: `[Automated system email — sent when ID verification fails]

Subject: ID Verification Required

Dear Customer,

Unfortunately, we were unable to verify your identity from the documents you provided. This may be because the image was unclear, the document was expired, or the details didn't match our records.

Please log in to your account and upload a new photo of a valid ID document (passport, driving licence, or national ID card).

${AUTO_SIGN_OFF}`,
  },
  {
    id: "id-missing",
    category: "ID / Photos",
    name: "ID missing — no ID uploaded",
    description: "Patient has not uploaded any ID document.",
    content: `Subject: ID Document Required

Dear <<Patient Name>>,

Before we can process your prescription, we require a copy of a valid photo ID for verification purposes. This is a regulatory requirement to ensure we are prescribing safely and to the correct person.

Please log in to your account and upload a clear photo of one of the following documents:
• Passport
• Driving licence
• National ID card

Please ensure:
• The document is valid and not expired
• The photo is clear and all details are legible
• Your full name and photo are visible

Once we receive your ID document, we will continue processing your order.

${SIGN_OFF}`,
  },
  {
    id: "id-name-mismatch",
    category: "ID / Photos",
    name: "Account name not matching ID",
    description: "Account name differs from the ID document.",
    content: `Subject: Account Name Verification Required

Dear <<Patient Name>>,

During our routine identity verification checks, we noticed that the name on your account does not exactly match the name shown on the identification document you provided.

To proceed safely and ensure our records are accurate, could you please confirm your full legal name as it appears on official documents.

• If your name has changed (for example, due to marriage or deed poll), please upload either an updated photo ID showing your current legal name, or your marriage certificate / deed poll document confirming the change.
• If the discrepancy is due to an error on your account, please reply confirming your correct legal name so we can update our records.

Once we receive confirmation or the relevant documentation, we'll continue reviewing your order.

${SIGN_OFF}`,
  },
  {
    id: "weight-failed-auto",
    category: "ID / Photos",
    name: "Weight verification failed (automated)",
    description: "Automated email when weight photo fails.",
    content: `[Automated system email — sent when weight photo fails verification]

Subject: Weight Verification Photo Required

Dear Customer,

Unfortunately, we were unable to verify your weight from the photo you provided. For us to proceed with your order, we need a clear photo that shows your full body.

Please upload a new photo that:
• Shows your full body (head to toe)
• Is taken in fitted clothing
• Has good lighting
• Is clear and not blurry

${AUTO_SIGN_OFF}`,
  },
  {
    id: "photo-requirements",
    category: "ID / Photos",
    name: "Photo requirements not met",
    description: "Uploaded photo doesn't meet prescribing requirements.",
    content: `Subject: New Photo Required for Your Order

Hello <<Patient Name>>,

Unfortunately the photo uploaded did not meet our requirements to prescribe. Please respond to this email with a new photo which meets the following requirements:

• Shows your current body shape in fitted clothing — please do not wear oversized clothing.
• Pictures you standing, facing the camera, head to toes.
• Shows your face clearly in good lighting and without sunglasses.
• Is not edited or retouched.

You may also wish to include a photo showing your side profile as well as one facing forward.

Please reply directly to this email with the attached photo(s), and we will promptly upload it to your patient account.

Your order will be placed on hold whilst we await your response.

${SIGN_OFF}`,
  },

  /* ───────────── Weight Changes ───────────── */
  {
    id: "weight-increased",
    category: "Weight Changes",
    name: "Weight has increased",
    description: "Repeat patient's weight increased since last order.",
    content: `Subject: Follow-Up on Your Recent Weight Change

Dear <<Patient Name>>,

We noticed that your weight has increased since your last order. Before we proceed with your prescription, we wanted to check in with you:

• Have you experienced any changes in your lifestyle or diet recently?
• Have you been taking your medication as prescribed?
• Have you experienced any issues with the medication?

Please let us know so we can ensure your treatment plan is still appropriate for you.

${SIGN_OFF}`,
  },
  {
    id: "weight-rapid-loss",
    category: "Weight Changes",
    name: "Rapid weight loss query",
    description: "Patient losing weight too rapidly.",
    content: `Subject: Checking In on Your Weight Loss Progress

Dear <<Patient Name>>,

We noticed that you appear to be losing weight quite rapidly. While this medication can be very effective, we want to make sure your weight loss is healthy and sustainable.

Could you please let us know:

• Are you eating regular meals?
• Are you experiencing any side effects such as nausea, vomiting, or loss of appetite?
• How are you feeling generally?

Healthy weight loss is typically around 1–2 lbs per week. If you're losing more than this, we may need to review your treatment plan.

${SIGN_OFF}`,
  },

  /* ───────────── Side Effects ───────────── */
  {
    id: "se-query",
    category: "Side Effects",
    name: "Side effects query — guidance",
    description: "Patient reports side effects; provide guidance.",
    content: `Subject: Response to Your Side Effects Query

Dear <<Patient Name>>,

Thank you for letting us know about the side effects you're experiencing.

The side effects you've described ([INSERT SIDE EFFECTS]) are [common/less common] with this medication.

[For common side effects:]
These usually improve within the first few weeks. We recommend:
• Eating smaller, more frequent meals
• Staying hydrated
• Avoiding fatty or spicy foods
• Taking your medication in the evening if nausea is an issue

[For concerning side effects:]
Given the symptoms you've described, we recommend speaking with your GP or contacting NHS 111.

Please let us know if your symptoms persist or worsen.

${SIGN_OFF}`,
  },
  {
    id: "se-injection-site",
    category: "Side Effects",
    name: "Injection site reaction",
    description: "Redness / swelling / pain at injection site.",
    content: `Subject: Advice for Injection Site Reactions

Dear <<Patient Name>>,

Thank you for getting in touch about your injection site reaction.

Mild reactions at the injection site such as redness, swelling, or discomfort are common and usually resolve on their own within a few days.

To help reduce injection site reactions:
• Rotate your injection sites (thigh, abdomen, upper arm)
• Allow the medication to reach room temperature before injecting
• Ensure the injection site is clean and dry
• Apply a cold compress after injecting if needed

If the reaction persists for more than a week, spreads beyond the injection site, or you develop signs of infection (increasing redness, warmth, pus, or fever), please contact your GP.

${SIGN_OFF}`,
  },

  /* ───────────── Wegovy 7.2mg ───────────── */
  {
    id: "w72-approved",
    category: "Wegovy 7.2mg",
    name: "7.2mg approved — 3×2.4mg pen guidance",
    description: "Wegovy 7.2mg approved; triple-pen guidance.",
    content: `Subject: Your Wegovy 7.2mg Prescription Has Been Approved

Dear <<Patient Name>>,

Your prescription for Wegovy 7.2 mg has now been approved and sent for dispensing.

Please read the following guidance carefully before starting your next dose:

• Your total weekly dose is given as three 2.4 mg injections
• Inject one dose from each pen on the same day each week
• Use a new needle for every injection
• Rotate injection sites to reduce irritation

At this dose, side effects such as nausea or altered skin sensations are common, particularly during the early weeks. These usually improve as your body adjusts.

Please seek medical advice if you experience:
• Severe or persistent vomiting
• Signs of dehydration
• Severe or worsening pain
• Signs of infection at injection sites

If you have any questions or concerns while taking this medication, please contact us before making any changes.

${SIGN_OFF}`,
  },
  {
    id: "w72-dysesthesia-hold",
    category: "Wegovy 7.2mg",
    name: "7.2mg dysesthesia — hold dose increase",
    description: "Skin sensations reported; do not increase dose.",
    content: `Subject: Important Safety Information About Your Dose

Dear <<Patient Name>>,

We can see that you have reported altered skin sensations while using Wegovy 2.4 mg.

As a safety measure, we do not recommend increasing your dose at this time, as higher doses are associated with a greater likelihood of these symptoms.

To proceed safely, we advise:
• Remaining on your current dose
• Allowing symptoms to settle before any dose increase
• Reassessing dose escalation once symptoms have resolved

Please let us know once symptoms have improved so we can review your treatment plan.

${SIGN_OFF}`,
  },
  {
    id: "w72-dysesthesia-warning",
    category: "Wegovy 7.2mg",
    name: "7.2mg dysesthesia warning",
    description: "Inform patient about dysesthesia at 7.2mg.",
    content: `Subject: Important Information About Wegovy 7.2mg Side Effects

Dear <<Patient Name>>,

We would like to make you aware of a possible side effect associated with higher doses of Wegovy, including the 7.2 mg dose.

Some patients experience changes in skin sensation, known as dysesthesia. This can include:
• Tingling
• Burning sensations
• Pins and needles
• Altered skin sensitivity

At the 7.2 mg dose, this side effect is considered common. Importantly:
• This is not nerve damage
• Symptoms are usually temporary
• Most cases resolve without stopping treatment

Please confirm that you understand this information and are happy to proceed. If you are currently experiencing similar symptoms at a lower dose, please inform us before increasing your dose.

${SIGN_OFF}`,
  },
  {
    id: "w72-gi",
    category: "Wegovy 7.2mg",
    name: "7.2mg GI side effects awareness",
    description: "Confirm understanding of GI side effects at 7.2mg.",
    content: `Subject: Wegovy 7.2mg Treatment Information

Dear <<Patient Name>>,

As part of your treatment review, we would like to ensure you are aware of the expected side effects associated with Wegovy 7.2 mg.

At this dose, gastrointestinal side effects are common, particularly during the early weeks. These may include:
• Nausea
• Vomiting
• Abdominal discomfort
• Reduced appetite

Most symptoms are mild to moderate and usually improve as your body adjusts.

Please confirm that you understand these potential effects and that you are happy to proceed with treatment at this dose. If you experience severe or persistent symptoms, you should contact us promptly.

${SIGN_OFF}`,
  },
  {
    id: "w72-triple-pen",
    category: "Wegovy 7.2mg",
    name: "7.2mg triple pen confirmation",
    description: "Confirm understanding of 3×2.4mg protocol.",
    content: `Subject: Confirmation Required for Wegovy 7.2mg Treatment

Dear <<Patient Name>>,

We are reviewing your request for Wegovy at a total weekly dose of 7.2 mg.

At present, this dose is administered using three separate 2.4 mg pens, as a single 7.2 mg pen is not yet available. To safely receive the full dose, you will need to inject one dose from each pen on the same day each week.

To ensure safe and effective use, please confirm that you understand the following:
• You will be giving three injections per week
• You must use a new needle for each injection
• Injection sites must be rotated each time
• Needles should never be reused, due to infection risk and reduced effectiveness

This method reflects how Wegovy 7.2 mg was used in clinical trials. If you have any concerns about administering multiple injections, please let us know before proceeding.

${SIGN_OFF}`,
  },

  /* ───────────── Gap in Treatment ───────────── */
  {
    id: "gap-generic",
    category: "Gap in Treatment",
    name: "Gap in treatment (generic)",
    description: "Universal gap template with placeholders.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

We've noticed a gap in your <<Medication>> treatment since your last order. If you have obtained a prescription with another provider during this period, please provide photo evidence of your prescription. This can be a dispatch notification or prescription and should clearly show the medication name, dosage, date, and your name.

Additionally, if you have received treatment from another provider during this time, please let us know if you experienced any side effects that were not well tolerated, required medical attention (such as attending A&E), or led to hospital admission.

If you have not received treatment from another provider during this period, we may need to adjust your prescription request based on the length of the treatment gap.

Based on the length of the gap identified (<<Gap Duration>>), you can safely continue treatment at your last tolerated dose, up to a maximum of <<Maximum Dose>>, which supports safe titration and minimises the risk of side effects.

Please note: we calculate any gap in treatment based strictly on the date of your previous order and the date of your most recent order. This ensures a clear, auditable record and that we operate within safe prescribing guidelines.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-mounjaro-8-12",
    category: "Gap in Treatment",
    name: "Gap 8–12 weeks — Mounjaro (max 10mg)",
    description: "Continue at last tolerated dose, max 10mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your previous order was placed 8–12 weeks ago, you can continue treatment at your last tolerated dose, up to a maximum of 10mg Mounjaro, which supports safe titration and minimises the risk of side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-mounjaro-12-24",
    category: "Gap in Treatment",
    name: "Gap 12–24 weeks — Mounjaro (max 5mg)",
    description: "Maximum dose 5mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your previous order was placed 12–24 weeks ago, the maximum dose we can prescribe is 5mg Mounjaro to ensure safe titration and minimise side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-mounjaro-24",
    category: "Gap in Treatment",
    name: "Gap >24 weeks — Mounjaro (restart 2.5mg)",
    description: "Restart at lowest dose 2.5mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your last order was placed more than 24 weeks ago, you will need to restart treatment at the lowest dose, 2.5mg Mounjaro, to ensure safe titration and reduce the risk of side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-wegovy-8-12",
    category: "Gap in Treatment",
    name: "Gap 8–12 weeks — Wegovy (max 1mg)",
    description: "Continue at last tolerated dose, max 1mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your previous order was placed 8–12 weeks ago, you can continue treatment at your last tolerated dose, up to a maximum of 1mg Wegovy, which supports safe titration and minimises the risk of side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-wegovy-12-24",
    category: "Gap in Treatment",
    name: "Gap 12–24 weeks — Wegovy (max 1mg)",
    description: "Maximum dose 1mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your previous order was placed 12–24 weeks ago, the maximum dose we can prescribe is 1mg Wegovy to ensure safe titration and minimise side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-wegovy-24",
    category: "Gap in Treatment",
    name: "Gap >24 weeks — Wegovy (restart 0.25mg)",
    description: "Restart at lowest dose 0.25mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your last order was placed more than 24 weeks ago, you will need to restart treatment at the lowest dose, 0.25mg Wegovy, to ensure safe titration and reduce the risk of side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-nevolat-8-12",
    category: "Gap in Treatment",
    name: "Gap 8–12 weeks — Nevolat (max 1.8mg)",
    description: "Continue at last tolerated dose, max 1.8mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your previous order was placed 8–12 weeks ago, you can continue treatment at your last tolerated dose, up to a maximum of 1.8mg Nevolat, which supports safe titration and minimises the risk of side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-nevolat-12-24",
    category: "Gap in Treatment",
    name: "Gap 12–24 weeks — Nevolat (max 1.2mg)",
    description: "Maximum dose 1.2mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your previous order was placed 12–24 weeks ago, the maximum dose we can prescribe is 1.2mg Nevolat to ensure safe titration and minimise side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-nevolat-24",
    category: "Gap in Treatment",
    name: "Gap >24 weeks — Nevolat (restart 0.6mg)",
    description: "Restart at lowest dose 0.6mg.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

As your last order was placed more than 24 weeks ago, you will need to restart treatment at the lowest dose, 0.6mg Nevolat, to ensure safe titration and reduce the risk of side effects.

If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },
  {
    id: "gap-12-months",
    category: "Gap in Treatment",
    name: "Gap >12 months (all medications)",
    description: "Treat as new patient; restart at lowest dose.",
    content: `Subject: Follow-Up on Your Treatment Gap

Hello <<Patient Name>>,

We've noticed a significant gap in your GLP-1 treatment since your last order. If you have obtained a prescription with another provider during this period, please provide photo evidence showing the dosage, date and your name, and let us know about any side effects, A&E attendance, or hospital admission.

As your last order was placed more than 12 months ago, you will be treated as a new patient and will need to restart treatment at the lowest dose:
• Mounjaro: 2.5mg
• Wegovy: 0.25mg
• Nevolat: 0.6mg

This is to ensure safe titration and reduce the risk of side effects after such a significant treatment break.

If you are happy to proceed, please let us know and we will amend your current order and credit your account with the price difference.

Your order will be placed on hold whilst we await your response.

Kind Regards,
The Clinical Team`,
  },

  /* ───────────── Rejection ───────────── */
  {
    id: "rej-repeat-scr",
    category: "Rejection",
    name: "Rejection — repeat patient (SCR findings)",
    description: "Decline a repeat patient based on SCR findings.",
    content: `Subject: An important update on your treatment plan

Hi <<Patient Name>>,

We're getting in touch to let you know that, following an updated review of your medical records, we're no longer able to prescribe weight-loss treatments such as Wegovy, Mounjaro or Nevolat.

This means your current order will be automatically cancelled and refunded.

This decision is based on new information from your Summary Care Record (SCR), which includes details like your current medication, allergies, diagnoses, and previous reactions to medicines. During these checks, we noted [add information about contraindication(s) found].

For your safety, please stop using your injectable treatment and take any remaining pens to your local pharmacy for safe disposal.

${SIGN_OFF}`,
  },
  {
    id: "rej-gallstone",
    category: "Rejection",
    name: "Rejection — gallstones, no cholecystectomy",
    description: "GLP-1 contraindicated with active gallstones.",
    content: `Subject: Important Information Regarding Gallstones and Your Prescription

Dear <<Patient Name>>,

After carefully reviewing your medical history, we can see that you have a history of gallstones and have not had your gallbladder removed.

Unfortunately, this means we are unable to safely prescribe injectable weight-loss treatment online at this time, because these medications can increase the risk of gallbladder-related complications in people who have gallstones, and this requires closer medical supervision than we can provide through an online service.

For your safety, we recommend discussing weight-management options with your GP or specialist, who can assess your individual circumstances.

Your order will be cancelled and a full refund will be processed automatically.

${SIGN_OFF}`,
  },
  {
    id: "rej-cholecystectomy-12m",
    category: "Rejection",
    name: "Rejection — cholecystectomy <12 months",
    description: "GLP-1 contraindicated for 12 months post-surgery.",
    content: `Subject: Prescription Update Following Recent Gallbladder Surgery

Dear <<Patient Name>>,

Thank you for providing your discharge letter confirming your gallbladder removal (cholecystectomy) surgery.

After reviewing this information, we're unfortunately unable to prescribe GLP-1 weight-loss treatment at this time. In line with our prescribing guidance, these medications cannot be prescribed within 12 months of gallbladder removal, as there is an increased risk of gastrointestinal and biliary complications during the first year following surgery.

You would be welcome to reapply once 12 months have passed since your surgery, provided there are no other contraindications at that time. If you wish to discuss alternative weight-management options in the meantime, we recommend speaking with your GP.

${SIGN_OFF}`,
  },
];
