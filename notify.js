// Street Sweeper SF — Email Notification Engine
// Runs on a schedule, sends reminders 1 hour before each street cleaning

const { Resend } = require('resend');

const RESEND_KEY = process.env.RESEND_API_KEY || 're_2YMwr6cN_Hk6cPRcX2nb4SRfqj2AkvdBm';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Street Sweeper SF <onboarding@resend.dev>';
const BASE_URL = process.env.BASE_URL || 'https://sweeping.blakecross.io';

// ── KILL SWITCH ───────────────────────────────────────────────────────────────
// Set NOTIFICATIONS_PAUSED=true as an env var to stop ALL notifications instantly
// Lea X can say "stop all notifications" and Cleo will set this flag immediately
const NOTIFICATIONS_PAUSED = process.env.NOTIFICATIONS_PAUSED === 'true';

const resend = new Resend(RESEND_KEY);

// Email HTML template
function buildEmail({ street, side, day, fromTime, toTime, unsubscribeUrl, feedbackUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <tr><td style="background:#2563EB;border-radius:12px 12px 0 0;padding:28px 32px 24px;">
          <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.65);">Street Sweeper SF</p>
          <h1 style="margin:10px 0 0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em;line-height:1.2;">
            🧹 Street cleaning in 1 hour
          </h1>
        </td></tr>

        <tr><td style="background:#fff;padding:28px 32px 24px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
            Time to move your car. Street cleaning is starting soon on <strong style="color:#0F172A;">${street}</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2563EB;">${side} side</p>
                    <p style="margin:0;font-size:22px;font-weight:800;color:#0F172A;letter-spacing:-0.02em;">${day}</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:500;color:#334155;">${fromTime} – ${toTime}</p>
                  </td>
                  <td align="right" valign="middle"><span style="font-size:36px;">🚗</span></td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">
            We'll remind you before every street cleaning at this location until you unsubscribe.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr><td>
              <p style="margin:0 0 10px;font-size:13px;color:#94A3B8;">Did this reminder save you from a ticket?</p>
              <a href="${feedbackUrl}" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">Yes, saved me!</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background:#F1F5F9;border-radius:0 0 12px 12px;border:1px solid #E2E8F0;border-top:none;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                You signed up at <a href="${BASE_URL}" style="color:#2563EB;text-decoration:none;">sweeping.blakecross.io</a>.<br>
              </p></td>
              <td align="right" valign="middle" style="white-space:nowrap;padding-left:16px;">
                <a href="${unsubscribeUrl}" style="font-size:12px;color:#94A3B8;text-decoration:underline;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Send a single reminder email
async function sendReminder(sub, scheduleEntry) {
  if (NOTIFICATIONS_PAUSED) {
    console.log('[PAUSED] Skipping email to', sub.contact);
    return;
  }

  const unsubscribeUrl = `${BASE_URL}/unsubscribe/${sub.token}`;
  const feedbackUrl = `${BASE_URL}/api/feedback?token=${sub.token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: sub.contact,
    subject: `🧹 Street cleaning in 1 hour — ${sub.street}`,
    html: buildEmail({
      street: sub.street,
      side: scheduleEntry.side,
      day: scheduleEntry.day,
      fromTime: scheduleEntry.fromTime,
      toTime: scheduleEntry.toTime,
      unsubscribeUrl,
      feedbackUrl
    }),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  });

  if (error) {
    console.error(`Failed to send to ${sub.contact}:`, error);
    return false;
  }

  console.log(`Sent reminder to ${sub.contact} for ${sub.street} (${scheduleEntry.side} side, ${scheduleEntry.day} ${scheduleEntry.fromTime}) — id: ${data.id}`);
  return true;
}

// Confirmation email HTML template
function buildConfirmationEmail({ street, unsubscribeUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <tr><td style="background:#2563EB;border-radius:12px 12px 0 0;padding:28px 32px 24px;">
          <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.65);">Street Sweeper SF</p>
          <h1 style="margin:10px 0 0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em;line-height:1.2;">
            You're on the list
          </h1>
        </td></tr>

        <tr><td style="background:#fff;padding:28px 32px 24px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
            We'll send you a reminder <strong style="color:#0F172A;">1 hour before every street cleaning</strong> on:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2563EB;">Your street</p>
              <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#0F172A;letter-spacing:-0.02em;">${street}</p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">
            No action needed — we'll reach out automatically before each cleaning. Move your car and you're golden.
          </p>
        </td></tr>

        <tr><td style="background:#F1F5F9;border-radius:0 0 12px 12px;border:1px solid #E2E8F0;border-top:none;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
                You signed up at <a href="${BASE_URL}" style="color:#2563EB;text-decoration:none;">sweeping.blakecross.io</a>.
              </p></td>
              <td align="right" valign="middle" style="white-space:nowrap;padding-left:16px;">
                <a href="${unsubscribeUrl}" style="font-size:12px;color:#94A3B8;text-decoration:underline;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Send a confirmation email on sign-up
async function sendConfirmation(sub) {
  if (NOTIFICATIONS_PAUSED) {
    console.log('[PAUSED] Skipping confirmation to', sub.contact);
    return;
  }

  const unsubscribeUrl = `${BASE_URL}/unsubscribe/${sub.token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: sub.contact,
    subject: `You're set — we'll remind you before street cleaning on ${sub.street}`,
    html: buildConfirmationEmail({ street: sub.street, unsubscribeUrl }),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  });

  if (error) {
    console.error(`Failed to send confirmation to ${sub.contact}:`, error);
    return false;
  }

  console.log(`Sent confirmation to ${sub.contact} for ${sub.street} — id: ${data.id}`);
  return true;
}

module.exports = { sendReminder, sendConfirmation, buildEmail, buildConfirmationEmail, NOTIFICATIONS_PAUSED };
