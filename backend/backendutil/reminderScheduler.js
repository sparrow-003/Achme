"use strict";
/**
 * Reminder Scheduler — runs every 15 minutes automatically
 * Marks overdue reminders as Missed, triggers escalation at 3+ missed
 */
const schedule = require("node-schedule");
const db = require("../config/database");

const toDateOnly = (val) => (!val ? null : val.toString().slice(0, 10));

function runCheckMissed() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentTime = now.toTimeString().slice(0, 8);

  // 1. Mark overdue Pending reminders as Missed + increment missed_count
  db.query(
    `UPDATE lead_reminders SET status='Missed', missed_count = missed_count + 1
     WHERE status='Pending' AND (
       reminder_date < ?
       OR (reminder_date = ? AND reminder_time IS NOT NULL AND TIME(reminder_time) < ?)
     )`,
    [today, today, currentTime],
    (err, result) => {
      if (err) { console.error("[Scheduler] check-missed error:", err.message); return; }
      if (result.affectedRows > 0) {
        console.log(`[Scheduler] Marked ${result.affectedRows} reminders as Missed`);
      }

      // 2. Find leads with 3+ missed reminders → escalate
      const escalateSql = `
        SELECT lr.lead_id, lr.lead_type, COUNT(*) as total_missed,
               COALESCE(t.customer_name, w.customer_name, f.customer_name) as customer_name,
               COALESCE(t.mobile_number, w.mobile_number, f.mobile_number) as mobile_number,
               COALESCE(t.staff_name, w.staff_name, f.staff_name) as staff_name,
               COALESCE(t.followup_date, w.followup_date, f.followup_date) as followup_date,
               MAX(lr.reminder_date) as last_reminder_date
        FROM lead_reminders lr
        LEFT JOIN Telecalls t ON t.id = lr.lead_id AND lr.lead_type = 'telecall'
        LEFT JOIN Walkins w ON w.id = lr.lead_id AND lr.lead_type = 'walkin'
        LEFT JOIN fields f ON f.id = lr.lead_id AND lr.lead_type = 'field'
        WHERE lr.status = 'Missed'
        GROUP BY lr.lead_id, lr.lead_type
        HAVING total_missed >= 3
      `;

      db.query(escalateSql, (err2, leads) => {
        if (err2 || !leads.length) return;

        leads.forEach(lead => {
          db.query(
            "SELECT id FROM lead_escalations WHERE lead_id=? AND lead_type=? AND status='Open'",
            [lead.lead_id, lead.lead_type],
            (e, existing) => {
              if (existing && existing.length > 0) {
                // Update missed count
                db.query(
                  "UPDATE lead_escalations SET missed_count=?, last_followup_date=? WHERE id=?",
                  [lead.total_missed, toDateOnly(lead.last_reminder_date), existing[0].id]
                );
              } else {
                // Create new escalation
                db.query(
                  `INSERT INTO lead_escalations 
                   (lead_id, lead_type, customer_name, mobile_number, staff_name, last_followup_date, missed_count)
                   VALUES (?,?,?,?,?,?,?)`,
                  [lead.lead_id, lead.lead_type, lead.customer_name, lead.mobile_number,
                   lead.staff_name, toDateOnly(lead.last_reminder_date), lead.total_missed],
                  (e2) => {
                    if (!e2) console.log(`[Scheduler] Escalation created for lead ${lead.lead_id} (${lead.lead_type})`);
                  }
                );
              }
            }
          );
        });
      });
    }
  );
}

// Run every 15 minutes
schedule.scheduleJob("*/15 * * * *", runCheckMissed);

// Also run once on startup
setTimeout(runCheckMissed, 3000);

console.log("[Scheduler] Reminder escalation scheduler started (every 15 min)");

module.exports = { runCheckMissed };
