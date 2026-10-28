import nodemailer from 'nodemailer';

// ─── Transporter ────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,   // info@divinecoretech.com (Google Workspace)
    pass: process.env.SMTP_PASS,   // App password from Google Account
  },
});

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'info@divinecoretech.com';
const FROM_NAME   = process.env.COMPANY_NAME || 'Enterprise HRMS';
const FROM_ADDR   = process.env.SMTP_USER    || 'info@divinecoretech.com';

// ─── Generic admin notification ─────────────────────────────────────────────
export interface AdminNotificationPayload {
  subject: string;
  employeeName: string;
  employeeId: string;
  eventType: string;          // e.g. "Leave Application", "Regularisation Request"
  details: Record<string, string | number>;
  actionUrl?: string;         // deep link into HRMS
}

export async function sendAdminNotification(payload: AdminNotificationPayload): Promise<void> {
  const { subject, employeeName, employeeId, eventType, details, actionUrl } = payload;

  const detailRows = Object.entries(details)
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:6px 12px;font-size:13px;color:#64748b;width:40%;border-bottom:1px solid #f1f5f9;">${k}</td>
        <td style="padding:6px 12px;font-size:13px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">${v}</td>
      </tr>`
    )
    .join('');

  const actionButton = actionUrl
    ? `<a href="${actionUrl}" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#2563eb;color:#fff;font-size:13px;font-weight:700;border-radius:8px;text-decoration:none;">Review in HRMS →</a>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af 0%,#2563eb 100%);padding:28px 32px;">
            <p style="margin:0;font-size:11px;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;">Enterprise HRMS · Admin Alert</p>
            <h1 style="margin:6px 0 0;font-size:20px;color:#ffffff;font-weight:700;">${eventType}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;">New request submitted by</p>
            <p style="margin:0 0 20px;font-size:17px;font-weight:700;color:#0f172a;">
              ${employeeName} <span style="font-size:12px;font-weight:400;color:#94a3b8;">(${employeeId})</span>
            </p>

            <!-- Details table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th colspan="2" style="padding:10px 12px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;font-weight:600;border-bottom:1px solid #e2e8f0;">Request Details</th>
                </tr>
              </thead>
              <tbody>${detailRows}</tbody>
            </table>

            ${actionButton}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated notification from <strong>${FROM_NAME}</strong>. Please do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_ADDR}>`,
      to: ADMIN_EMAIL,
      subject: `[HRMS] ${subject}`,
      html,
    });
    console.log(`[Mailer] ✅ Admin notification sent → ${ADMIN_EMAIL} | ${subject}`);
  } catch (err) {
    // Log but never crash the API call due to mail failure
    console.error('[Mailer] ❌ Failed to send email:', err);
  }
}
