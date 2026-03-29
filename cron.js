// Street Sweeper SF — Cron job
// Called by Vercel Cron every 30 minutes
// Finds all subscriptions where a cleaning starts in the next 60-90 minutes
// and sends reminder emails

const { sendReminder, NOTIFICATIONS_PAUSED } = require('./notify');

// In-memory subscription store (imported from server)
// In production this would be a database
let _subs = null;
function setSubscriptions(subs) { _subs = subs; }
function getSubscriptions() { return _subs || []; }

async function runCron() {
  if (NOTIFICATIONS_PAUSED) {
    console.log('[CRON] Notifications paused — skipping run');
    return { sent: 0, skipped: 0, paused: true };
  }

  const subs = getSubscriptions();
  const activeSubs = subs.filter(s => s.active && s.type === 'email');

  if (!activeSubs.length) {
    console.log('[CRON] No active email subscriptions');
    return { sent: 0, skipped: 0 };
  }

  // Load schedule data
  let streetDb;
  try {
    streetDb = require('./data/streets.json');
  } catch(e) {
    console.error('[CRON] Could not load street database');
    return { sent: 0, error: 'No database' };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000);  // 55 min from now
  const windowEnd   = new Date(now.getTime() + 90 * 60 * 1000);  // 90 min from now

  let sent = 0, skipped = 0;

  for (const sub of activeSubs) {
    const streetKey = sub.street.toUpperCase();
    const entries = streetDb[streetKey] || [];

    for (const entry of entries) {
      if (!entry.nextCleaning) continue;
      const cleaningTime = new Date(entry.nextCleaning);

      if (cleaningTime >= windowStart && cleaningTime <= windowEnd) {
        // This cleaning falls in our 1-hour window — send reminder
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const fmt = (d) => new Date(d).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles'
        });

        const schedEntry = {
          side: entry.side,
          day: days[cleaningTime.getDay()],
          fromTime: fmt(entry.nextCleaning),
          toTime: fmt(entry.nextCleaningEnd || entry.nextCleaning)
        };

        const ok = await sendReminder(sub, schedEntry);
        if (ok) sent++;
        else skipped++;
        break; // one email per subscription per cron run
      }
    }
  }

  console.log(`[CRON] Done — sent: ${sent}, skipped: ${skipped}`);
  return { sent, skipped };
}

module.exports = { runCron, setSubscriptions, getSubscriptions };
