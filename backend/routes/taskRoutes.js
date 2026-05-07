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
