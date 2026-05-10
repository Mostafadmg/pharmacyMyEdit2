import nodemailer from "nodemailer";

async function sendViaResend(data: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: data.from,
      to: [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }
}

interface ConsultationEmailData {
  patientName: string;
  patientEmail: string;
  conditionName: string;
  status: string;
  pharmacistNote?: string | null;
  prescription?: string | null;
  referralInfo?: string | null;
  consultationId: string;
}

function getStatusInfo(status: string): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  headline: string;
  description: string;
} {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        color: "#0F6B4F",
        bgColor: "#D1FAE5",
        icon: "✓",
        headline: "Great news — your prescription is ready",
        description: "Our pharmacist has reviewed your consultation and approved your treatment.",
      };
    case "rejected":
      return {
        label: "Not Suitable",
        color: "#9B1C1C",
        bgColor: "#FEE2E2",
        icon: "✕",
        headline: "Consultation outcome: treatment not suitable",
        description: "After careful clinical review, our pharmacist has determined that this treatment is not appropriate at this time.",
      };
    case "more_info_needed":
      return {
        label: "More Information Needed",
        color: "#92400E",
        bgColor: "#FEF3C7",
        icon: "?",
        headline: "We need a little more information",
        description: "Our pharmacist has reviewed your consultation and requires some additional information before proceeding.",
      };
    case "referred":
      return {
        label: "Referred",
        color: "#1E40AF",
        bgColor: "#DBEAFE",
        icon: "→",
        headline: "You have been referred for further care",
        description: "Based on your consultation, our pharmacist recommends you seek further medical care.",
      };
    default:
      return {
        label: "Reviewed",
        color: "#374151",
        bgColor: "#F3F4F6",
        icon: "•",
        headline: "Your consultation has been reviewed",
        description: "Our pharmacist has completed their review of your consultation.",
      };
  }
}

function buildEmailHtml(data: ConsultationEmailData): string {
  const { patientName, conditionName, status, pharmacistNote, prescription, referralInfo, consultationId } = data;
  const statusInfo = getStatusInfo(status);
  const appUrl = process.env.APP_URL || "https://pharmacare.replit.app";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PharmaCare — Consultation Update</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#F0F4F8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4F8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F3460 0%,#0A7EA4 100%);border-radius:16px 16px 0 0;padding:40px 48px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;font-size:28px;margin-bottom:16px;">+</div>
                    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">PharmaCare</h1>
                    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Clinical Pharmacy Service</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="background-color:${statusInfo.bgColor};padding:28px 48px;text-align:center;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
              <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background-color:${statusInfo.color};color:#ffffff;font-size:22px;font-weight:bold;text-align:center;margin-bottom:12px;">${statusInfo.icon}</div>
              <h2 style="margin:0 0 8px;color:${statusInfo.color};font-size:22px;font-weight:700;">${statusInfo.headline}</h2>
              <span style="display:inline-block;background-color:${statusInfo.color};color:#ffffff;padding:4px 16px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.5px;">${statusInfo.label}</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 48px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:17px;line-height:1.6;color:#1A202C;">
                Dear <strong>${patientName}</strong>,
              </p>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#4A5568;">
                ${statusInfo.description}
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(to right,#E2E8F0,#CBD5E0,#E2E8F0);margin-bottom:32px;"></div>

              <!-- Consultation Details Card -->
              <div style="background-color:#F7FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin-bottom:28px;">
                <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#718096;letter-spacing:1.5px;text-transform:uppercase;">Consultation Summary</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #EDF2F7;">
                      <span style="font-size:13px;color:#718096;font-weight:500;">Patient</span>
                    </td>
                    <td style="padding:8px 0;border-bottom:1px solid #EDF2F7;text-align:right;">
                      <span style="font-size:14px;color:#2D3748;font-weight:600;">${patientName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #EDF2F7;">
                      <span style="font-size:13px;color:#718096;font-weight:500;">Condition</span>
                    </td>
                    <td style="padding:8px 0;border-bottom:1px solid #EDF2F7;text-align:right;">
                      <span style="font-size:14px;color:#2D3748;font-weight:600;">${conditionName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;">
                      <span style="font-size:13px;color:#718096;font-weight:500;">Reference</span>
                    </td>
                    <td style="padding:8px 0;text-align:right;">
                      <span style="font-size:12px;color:#718096;font-family:monospace;">${consultationId.toUpperCase().slice(0, 8)}</span>
                    </td>
                  </tr>
                </table>
              </div>

              ${pharmacistNote ? `
              <!-- Pharmacist Note -->
              <div style="border-left:4px solid #0A7EA4;padding:16px 20px;background:#EBF8FF;border-radius:0 8px 8px 0;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#0A7EA4;letter-spacing:1px;text-transform:uppercase;">Pharmacist's Note</p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#2D3748;">${pharmacistNote}</p>
              </div>
              ` : ""}

              ${prescription ? `
              <!-- Prescription -->
              <div style="background:linear-gradient(135deg,#D1FAE5 0%,#A7F3D0 100%);border:1px solid #6EE7B7;border-radius:12px;padding:24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#065F46;letter-spacing:1px;text-transform:uppercase;">✓ Prescription Issued</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#064E3B;font-weight:500;">${prescription}</p>
                <a href="${appUrl}/api/consultations/${consultationId}/prescription.pdf" style="display:inline-block;background-color:#065F46;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:0.3px;">📄 Download Prescription PDF</a>
              </div>
              ` : ""}

              ${referralInfo ? `
              <!-- Referral -->
              <div style="background:#EBF4FF;border:1px solid #BEE3F8;border-radius:12px;padding:24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#2C5282;letter-spacing:1px;text-transform:uppercase;">→ Referral Information</p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#2A4365;">${referralInfo}</p>
              </div>
              ` : ""}

              <!-- CTA -->
              <div style="text-align:center;margin:36px 0 8px;">
                <a href="${appUrl}/my-consultations" style="display:inline-block;background:linear-gradient(135deg,#0F3460 0%,#0A7EA4 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:999px;font-size:15px;font-weight:700;letter-spacing:0.3px;">View Your Consultation Portal →</a>
                <p style="margin:16px 0 0;font-size:13px;color:#A0AEC0;">You can also track your order at <a href="${appUrl}/track" style="color:#0A7EA4;">pharmacare.co.uk/track</a></p>
              </div>
            </td>
          </tr>

          <!-- Important Notice -->
          <tr>
            <td style="background-color:#FFFBEB;border:1px solid #FDE68A;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;padding:20px 48px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#92400E;">
                <strong>⚠ Important:</strong> If you are experiencing a medical emergency, please call <strong>999</strong> immediately or attend your nearest A&amp;E. For urgent medical advice, call <strong>NHS 111</strong>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F7FAFC;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 16px 16px;padding:32px 48px;text-align:center;">
              <div style="display:inline-block;margin-bottom:16px;">
                <span style="font-size:18px;font-weight:800;color:#0F3460;">Pharma</span><span style="font-size:18px;font-weight:600;color:#0A7EA4;">Care</span>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#718096;line-height:1.6;">
                Registered with the General Pharmaceutical Council (GPhC) · Registration No. 1234567<br>
                PharmaCare Ltd · 100 Harley Street · London · W1G 7JA
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#A0AEC0;">
                This email was sent to you because you submitted a consultation request.<br>
                <a href="${appUrl}/my-consultations" style="color:#0A7EA4;text-decoration:none;">Manage your account</a> · <a href="mailto:support@pharmacare.co.uk" style="color:#0A7EA4;text-decoration:none;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface DispatchEmailData {
  patientName: string;
  patientEmail: string;
  orderNumber: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  estimatedDelivery: Date | string | null;
  shippingAddress: { line1: string; line2?: string | null; city: string; postcode: string };
}

function buildDispatchHtml(d: DispatchEmailData): string {
  const appUrl = process.env.APP_URL || "https://pharmacare.replit.app";
  const eta = d.estimatedDelivery
    ? new Date(d.estimatedDelivery).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "within 1–2 working days";
  const fullTrackingUrl = d.trackingUrl.startsWith("http")
    ? d.trackingUrl
    : `${appUrl}${d.trackingUrl}`;
  const internalUrl = `${appUrl}/track-order/${d.orderId}`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Your PharmaCare order is on its way</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#F0F4F8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#0F3460,#0A7EA4);border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;color:#fff;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:14px;">🚚</div>
    <h1 style="margin:0;font-size:26px;font-weight:800;">Your order is on its way</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Order ${d.orderNumber}</p>
  </td></tr>
  <tr><td style="background:#fff;padding:36px 48px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
    <p style="margin:0 0 20px;font-size:16px;color:#1A202C;">Hi <strong>${d.patientName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A5568;">
      Good news — your PharmaCare order has just been dispatched and is now with our delivery partner. You can track it in real time using the link below.
    </p>
    <div style="background:#F7FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#718096;font-size:13px;">Carrier</td>
            <td style="padding:6px 0;text-align:right;color:#2D3748;font-weight:600;font-size:14px;">${d.carrier}</td></tr>
        <tr><td style="padding:6px 0;color:#718096;font-size:13px;border-top:1px solid #EDF2F7;">Tracking number</td>
            <td style="padding:6px 0;text-align:right;color:#2D3748;font-weight:600;font-size:13px;font-family:monospace;border-top:1px solid #EDF2F7;">${d.trackingNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#718096;font-size:13px;border-top:1px solid #EDF2F7;">Estimated delivery</td>
            <td style="padding:6px 0;text-align:right;color:#2D3748;font-weight:600;font-size:14px;border-top:1px solid #EDF2F7;">${eta}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${fullTrackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#0F3460,#0A7EA4);color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:700;font-size:15px;">Track my delivery →</a>
      <p style="margin:14px 0 0;font-size:12px;color:#A0AEC0;">Or view full order details: <a href="${internalUrl}" style="color:#0A7EA4;">${internalUrl}</a></p>
    </div>
    <div style="border-top:1px solid #EDF2F7;padding-top:20px;font-size:13px;color:#718096;line-height:1.6;">
      <strong style="color:#2D3748;">Delivering to</strong><br>
      ${d.shippingAddress.line1}${d.shippingAddress.line2 ? `, ${d.shippingAddress.line2}` : ""}<br>
      ${d.shippingAddress.city}, ${d.shippingAddress.postcode}
    </div>
  </td></tr>
  <tr><td style="background:#FFFBEB;border:1px solid #FDE68A;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;padding:18px 48px;font-size:13px;color:#92400E;line-height:1.6;">
    <strong>Need help?</strong> Reply to this email or message your pharmacist via your PharmaCare account. For medical emergencies, call <strong>999</strong> or NHS 111.
  </td></tr>
  <tr><td style="background:#F7FAFC;border:1px solid #E2E8F0;border-top:0;border-radius:0 0 16px 16px;padding:24px 48px;text-align:center;font-size:12px;color:#718096;">
    PharmaCare Ltd · Registered with the GPhC<br>
    <a href="${appUrl}/my-orders" style="color:#0A7EA4;">Manage your orders</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendDispatchEmail(d: DispatchEmailData): Promise<void> {
  const appUrl = process.env.APP_URL || "https://pharmacare.replit.app";
  const fullTrackingUrl = d.trackingUrl.startsWith("http") ? d.trackingUrl : `${appUrl}${d.trackingUrl}`;
  const html = buildDispatchHtml(d);
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pharmacare.co.uk";
  const subject = `📦 Your PharmaCare order ${d.orderNumber} has been dispatched`;
  const text = `Hi ${d.patientName},\n\nYour PharmaCare order ${d.orderNumber} has been dispatched.\n\nCarrier: ${d.carrier}\nTracking number: ${d.trackingNumber}\nTrack your delivery: ${fullTrackingUrl}\n\nFull order details: ${appUrl}/track-order/${d.orderId}\n\nPharmaCare Team`;

  if (process.env.RESEND_API_KEY) {
    await sendViaResend({
      from: `PharmaCare <${fromAddress}>`,
      to: d.patientEmail,
      subject,
      html,
      text,
    });
    console.log(`📧 [Resend] Dispatch email sent to ${d.patientEmail} for order ${d.orderNumber}`);
    return;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"PharmaCare" <${fromAddress}>`,
      to: d.patientEmail,
      subject,
      html,
      text,
    });
    console.log(`📧 [SMTP] Dispatch email sent to ${d.patientEmail} for order ${d.orderNumber}`);
    return;
  }

  console.log(`\n📧 [DISPATCH EMAIL NOT SENT — no provider configured]
  To:       ${d.patientEmail}
  Subject:  ${subject}
  Tracking: ${d.carrier} ${d.trackingNumber}
  URL:      ${fullTrackingUrl}\n`);
}

export async function sendConsultationOutcomeEmail(data: ConsultationEmailData): Promise<void> {
  const { patientEmail, patientName, conditionName, status, consultationId } = data;
  const statusInfo = getStatusInfo(status);
  const html = buildEmailHtml(data);
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pharmacare.co.uk";
  const subject = `${statusInfo.icon} Your PharmaCare consultation update — ${conditionName}`;
  const appUrlPlain = process.env.APP_URL || "https://pharmacare.replit.app";
  const text = `Dear ${patientName},\n\nYour consultation for ${conditionName} has been ${statusInfo.label}.\n\n${data.pharmacistNote ? `Pharmacist note: ${data.pharmacistNote}\n\n` : ""}${data.prescription ? `Prescription: ${data.prescription}\n\nDownload your prescription PDF: ${appUrlPlain}/api/consultations/${consultationId}/prescription.pdf\n\n` : ""}${data.referralInfo ? `Referral: ${data.referralInfo}\n\n` : ""}Track your consultation at: ${appUrlPlain}/my-consultations\n\nPharmaCare Team\n\nIf this is a medical emergency, call 999. For urgent advice, call NHS 111.`;

  // Try Resend first (no SMTP setup required, free tier available)
  if (process.env.RESEND_API_KEY) {
    await sendViaResend({
      from: `PharmaCare <${fromAddress}>`,
      to: patientEmail,
      subject,
      html,
      text,
    });
    console.log(`📧 [Resend] Email sent to ${patientEmail} for consultation ${consultationId} (status: ${status})`);
    return;
  }

  // Fall back to SMTP (Nodemailer)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: `"PharmaCare" <${fromAddress}>`,
      to: patientEmail,
      subject,
      html,
      text,
    });
    console.log(`📧 [SMTP] Email sent to ${patientEmail} for consultation ${consultationId} (status: ${status})`);
    return;
  }

  // No email provider configured — log for development
  console.log(`\n📧 [EMAIL NOT SENT — no provider configured]
  To:      ${patientEmail}
  Subject: ${subject}
  Status:  ${status}
  Ref:     ${consultationId}

  To send real emails, add one of:
  • RESEND_API_KEY  (resend.com — free, no domain setup needed for testing)
  • SMTP_HOST + SMTP_USER + SMTP_PASS  (any SMTP provider)\n`);
}
