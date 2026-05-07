const express = require("express");
const router = express.Router();
const db = require("../config/database");

/* GET ALL TASKS  */
router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM tasks ORDER BY id DESC",
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

/*  CREATE TASK  */
router.post("/", (req, res) => {
  const {
    project_name, staff_name, task_title,
    project_status, project_priority, client_name, created_date, due_date
  } = req.body;

  const sql = `
    INSERT INTO tasks
    (project_name, task_title, project_status, project_priority, staff_name, client_name, created_date, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql,
    [project_name, task_title, project_status, project_priority, staff_name, client_name, created_date, due_date],
    (err, result) => {
      if (err) {
        console.error("Task create error:", err);
        return res.status(500).json({ message: err.message });
      }

      const taskId = result.insertId;

      // Non-fatal: log activity if table exists
      db.query(
        "INSERT INTO task_activity (task_id, action, message) VALUES (?, ?, ?)",
        [taskId, "Created", `Task "${task_title}" created`],
        (logErr) => { if (logErr) console.warn("task_activity insert skipped:", logErr.message); }
      );

      // Non-fatal: notification if table exists
      db.query(
        "INSERT INTO notifications (task_id, title, description) VALUES (?, ?, ?)",
        [taskId, "New Task", `Task "${task_title}" added (${project_priority})`],
        (notifErr) => { if (notifErr) console.warn("notifications insert skipped:", notifErr.message); }
      );

      res.json({ message: "Task created", id: taskId });
    }
  );
});

/* ================= UPDATE TASK ================= */
router.put("/:id", (req, res) => {
  const {
    project_name,
    task_title,
    project_status,
    project_priority,
    client_name,
    staff_name,
    created_date,
    due_date
  } = req.body;

  const sql = `
    UPDATE tasks SET
      project_name = ?,
      task_title = ?,
      project_status = ?,
      project_priority = ?,
      client_name = ?,
      staff_name = ?,
      created_date = ?,
      due_date = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      project_name,
      task_title,
      project_status,
      project_priority,
      client_name,
      staff_name,
      created_date,
      due_date,
      req.params.id
    ],
    (err) => {
      if (err) return res.status(500).json(err);

      // Task Activity
      db.query(
        "INSERT INTO task_activity (task_id, action, message) VALUES (?, ?, ?)",
        [req.params.id, "Updated", `Task "${task_title}" updated`]
      );

      // Notification
      db.query(
        "INSERT INTO notifications (task_id, title, description) VALUES (?, ?, ?)",
        [
          req.params.id,
          "Task Updated",
          `Task "${task_title}" details changed`
        ]
      );

      res.json({ message: "Task updated" });
    }
  );
});

/* ================= DELETE TASK ================= */
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM tasks WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);

      // Optional activity log
      db.query(
        "INSERT INTO task_activity (task_id, action, message) VALUES (?, ?, ?)",
        [req.params.id, "Deleted", "Task deleted"]
      );

      res.json({ message: "Task deleted" });
    }
  );
});

/* ================= DASHBOARD TASKS (READ ONLY) ================= */
router.get("/dashboard/tasks", (req, res) => {
  db.query(
    `SELECT id, task_title, project_status, project_priority, created_date
     FROM tasks
     ORDER BY created_date DESC
     LIMIT 5`,
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

/* ================= TASK TARGETS ================= */

/* GET ALL TASK TARGETS (Admin) */
router.get("/targets", (req, res) => {
  db.query(
    `SELECT t.*, COALESCE(a.achieved_count, 0) as achieved_count,
      (t.monthly_target - COALESCE(a.achieved_count, 0)) as pending_count
    FROM task_targets t
    LEFT JOIN task_achievements a ON t.id = a.target_id AND a.month_year = DATE_FORMAT(NOW(), '%Y-%m')
    ORDER BY t.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* GET TASK TARGET FOR USER - With Carry Forward */
router.get("/targets/my", (req, res) => {
  const { user_name } = req.query;
  if (!user_name) return res.status(400).json({ error: "user_name required" });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear();

  // Get current year's target
  db.query(
    "SELECT id, yearly_target, monthly_target FROM task_targets WHERE user_name = ? AND YEAR(created_at) = ?",
    [user_name, currentYear],
    (err, targetRows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (targetRows.length === 0) return res.json(null);

      const targetId = targetRows[0].id;
      const monthlyTarget = targetRows[0].monthly_target;

      // Check previous month's carry forward
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthStr = prevMonth.toISOString().slice(0, 7);

      db.query(
        "SELECT achieved_count FROM task_achievements WHERE user_name = ? AND month_year = ?",
        [user_name, prevMonthStr],
        (err2, prevRows) => {
          let carryForward = 0;
          if (prevRows.length > 0 && prevRows[0].achieved_count < monthlyTarget) {
            carryForward = monthlyTarget - prevRows[0].achieved_count;
          }

          // Get current month's achievement
          db.query(
            "SELECT achieved_count FROM task_achievements WHERE user_name = ? AND month_year = ?",
            [user_name, currentMonth],
            (err3, currentRows) => {
              const achievedCount = currentRows.length > 0 ? currentRows[0].achieved_count : 0;
              const effectiveTarget = monthlyTarget + carryForward;
              const pendingCount = Math.max(0, effectiveTarget - achievedCount);

              const result = {
                ...targetRows[0],
                achieved_count: achievedCount,
                pending_count: pendingCount,
                carry_forward: carryForward,
                effective_target: effectiveTarget,
                current_month: currentMonth
              };

              res.json(result);
            }
          );
        }
      );
    }
  );
});

/* CREATE/UPDATE TASK TARGET (Admin) - Yearly Based */
router.post("/targets", (req, res) => {
  const { user_id, user_name, yearly_target, created_by_admin } = req.body;

  if (!user_name || !yearly_target) {
    return res.status(400).json({ error: "user_name and yearly_target required" });
  }

  const currentYear = new Date().getFullYear();
  const monthlyTarget = Math.round(yearly_target / 12); // Auto-calculate monthly target

  // Check if target exists for user in current year
  db.query(
    "SELECT id FROM task_targets WHERE user_name = ? AND YEAR(created_at) = ?",
    [user_name, currentYear],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      if (rows.length > 0) {
        // Update existing (only if same year)
        db.query(
          "UPDATE task_targets SET yearly_target = ?, monthly_target = ?, updated_at = NOW() WHERE id = ?",
          [yearly_target, monthlyTarget, rows[0].id],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: "Target updated", id: rows[0].id });
          }
        );
      } else {
        // Create new yearly target
        db.query(
          "INSERT INTO task_targets (user_id, user_name, yearly_target, monthly_target, created_by_admin) VALUES (?, ?, ?, ?, ?)",
          [user_id, user_name, yearly_target, monthlyTarget, created_by_admin],
          (err2, result) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: "Yearly target created", id: result.insertId });
          }
        );
      }
    }
  );
});

/* UPDATE TASK ACHIEVEMENT (User) - With Carry Forward */
router.post("/targets/update", (req, res) => {
  const { user_id, user_name, count, description } = req.body;
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (!user_name || !count) {
    return res.status(400).json({ error: "user_name and count required" });
  }

  // Get current year's target for user
  const currentYear = new Date().getFullYear();
  db.query(
    "SELECT id, yearly_target, monthly_target FROM task_targets WHERE user_name = ? AND YEAR(created_at) = ?",
    [user_name, currentYear],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: "Yearly target not set for user" });

      const targetId = rows[0].id;
      const monthlyTarget = rows[0].monthly_target;

      // Check previous month's carry forward
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthStr = prevMonth.toISOString().slice(0, 7);

      db.query(
        "SELECT achieved_count FROM task_achievements WHERE user_name = ? AND month_year = ?",
        [user_name, prevMonthStr],
        (err2, prevRows) => {
          let carryForward = 0;
          if (prevRows.length > 0 && prevRows[0].achieved_count < monthlyTarget) {
            carryForward = monthlyTarget - prevRows[0].achieved_count;
          }

          // Calculate effective target for current month
          const effectiveTarget = monthlyTarget + carryForward;

          // Insert achievement update
          db.query(
            `INSERT INTO task_updates (user_id, user_name, target_id, month_year, count, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, user_name, targetId, currentMonth, count, description],
            (err3) => {
              if (err3) return res.status(500).json({ error: err3.message });

              // Update monthly achievement
              db.query(
                `INSERT INTO task_achievements (user_id, user_name, target_id, month_year, achieved_count)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE achieved_count = achieved_count + ?`,
                [user_id, user_name, targetId, currentMonth, count, count],
                (err4) => {
                  if (err4) return res.status(500).json({ error: err4.message });

                  // Log activity
                  db.query(
                    "INSERT INTO task_activity (task_id, action, message) VALUES (?, ?, ?)",
                    [targetId, "Task Achievement Update", `${user_name} completed ${count} tasks (effective target: ${effectiveTarget})`]
                  );

                  res.json({
                    message: "Achievement updated",
                    target_id: targetId,
                    carry_forward: carryForward,
                    effective_target: effectiveTarget
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

/* GET TASK ACHIEVEMENT HISTORY */
router.get("/targets/history", (req, res) => {
  const { user_name, months } = req.query;
  const limit = parseInt(months) || 12;

  let sql = `
    SELECT a.month_year, a.achieved_count,
      (SELECT monthly_target FROM task_targets WHERE id = a.target_id) as monthly_target
    FROM task_achievements a
    WHERE a.user_name = ?
    ORDER BY a.month_year DESC
    LIMIT ?
  `;

  db.query(sql, [user_name, limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* ASSIGN TASK TO USER */
router.post("/assign", (req, res) => {
  const { task_id, assigned_to_user_id, assigned_to_user_name, assigned_by, due_date, priority, notes } = req.body;

  if (!task_id || !assigned_to_user_name) {
    return res.status(400).json({ error: "task_id and assigned_to_user_name required" });
  }

  // First update the task with staff_name
  db.query(
    "UPDATE tasks SET staff_name = ? WHERE id = ?",
    [assigned_to_user_name, task_id],
    (updateErr) => {
      if (updateErr) return res.status(500).json({ error: updateErr.message });

      // Then create assignment record
      db.query(
        `INSERT INTO task_assignments
         (task_id, assigned_to_user_id, assigned_to_user_name, assigned_by, assigned_date, due_date, priority, notes)
         VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?)`,
        [task_id, assigned_to_user_id, assigned_to_user_name, assigned_by, due_date, priority, notes],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          // Update task activity
          db.query(
            "INSERT INTO task_activity (task_id, action, message) VALUES (?, ?, ?)",
            [task_id, "Task Assigned", `Task assigned to ${assigned_to_user_name}`]
          );

          res.json({ message: "Task assigned", id: result.insertId });
        }
      );
    }
  );
});

/* GET ASSIGNED TASKS FOR USER */
router.get("/assigned/:user_name", (req, res) => {
  const { user_name } = req.params;
  const { status } = req.query;

  let sql = `
    SELECT ta.*, t.task_title, t.project_name, t.client_name, t.created_date
    FROM task_assignments ta
    JOIN tasks t ON ta.task_id = t.id
    WHERE ta.assigned_to_user_name = ?
  `;

  const params = [user_name];

  if (status) {
    sql += " AND ta.status = ?";
    params.push(status);
  }

  sql += " ORDER BY ta.created_at DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* UPDATE TASK ASSIGNMENT STATUS */
router.put("/assignment/:id/status", (req, res) => {
  const { status } = req.body;

  if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.query(
    "UPDATE task_assignments SET status = ?, updated_at = NOW() WHERE id = ?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Get task info for activity log
      db.query(
        "SELECT task_id, assigned_to_user_name FROM task_assignments WHERE id = ?",
        [req.params.id],
        (err2, rows) => {
          if (!err2 && rows.length > 0) {
            db.query(
              "INSERT INTO task_activity (task_id, action, message) VALUES (?, ?, ?)",
              [rows[0].task_id, "Status Updated", `Task status updated to ${status} by ${rows[0].assigned_to_user_name}`]
            );
          }
        }
      );

      res.json({ message: "Status updated" });
    }
  );
});

/* ================= NOTIFICATIONS ================= */
router.get("/notifications", (req, res) => {
  db.query(
    "SELECT * FROM notifications ORDER BY created_at DESC",
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

router.put("/notifications/:id/read", (req, res) => {
  db.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

/* ================= TASK ACTIVITY ================= */
router.get("/activity", (req, res) => {
  db.query(
    "SELECT * FROM task_activity ORDER BY created_at DESC LIMIT 10",
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

module.exports = router;
