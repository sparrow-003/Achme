const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { generateOtp } = require("../backendutil/otp");
const sendEmailOtp = require("../backendutil/sendSms");

const router = express.Router();

/* ================= SEND EMAIL OTP ================= */
router.post("/send-email-otp", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + 5 * 60000);

  db.query(
    `INSERT INTO email_otp (email, otp, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE otp=?, expires_at=?`,
    [email, otp, expires, otp, expires],
    async (err) => {
      if (err) {
        console.error("send-email-otp db error:", err.message);
        return res.status(500).json({ message: "OTP failed" });
      }

      try {
        await sendEmailOtp(email, otp);
        res.json({ message: "OTP sent to email" });
      } catch (mailErr) {
        console.error("send-email-otp mail error:", mailErr.message);
        return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
      }
    }
  );
});

/*  REGISTER  */
router.post("/register", async (req, res) => {
  const { first_name, otp, user_password, role } = req.body;
  const email = req.body.email?.trim().toLowerCase();

  if (!first_name || !email || !otp || !user_password) {
    return res.status(400).json({ message: "All fields required" });
  }

  db.query(
    `SELECT * FROM email_otp WHERE email=? AND otp=? AND expires_at > NOW()`,
    [email, otp],
    async (err, rows) => {
      if (!rows || !rows.length) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      const hash = await bcrypt.hash(user_password, 10);
      const userRole = role || "user";
      // All new registrations start as pending — admin must approve
      const status = "pending";

      db.query(
        `INSERT INTO users (first_name, email, user_password, role, status) VALUES (?,?,?,?,?)`,
        [first_name, email, hash, userRole, status],
        (err, result) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              return res.status(409).json({ message: "Email already registered" });
            }
            return res.status(500).json({ message: "Server error" });
          }

          const newUserId = result.insertId;
          db.query(`DELETE FROM email_otp WHERE email=?`, [email]);

          // Create admin notification
          db.query(
            `INSERT INTO admin_notifications (type, user_id, message) VALUES ('registration', ?, ?)`,
            [newUserId, `New ${userRole} registration: ${first_name} (${email}) is waiting for approval.`]
          );

          res.json({ message: "Registration successful. Your account is pending admin approval." });
        }
      );
    }
  );
});

/*  LOGIN (EMAIL + OTP) */
router.post("/login", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP required" });
  }

  // First check if the user account exists at all
  db.query(`SELECT id, first_name, email, role, status FROM users WHERE email=?`, [email], (err, userRows) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (!userRows.length) {
      return res.status(404).json({ message: "No account found with this email. Please register first." });
    }

    const user = userRows[0];

    // Check status before OTP
    if (user.status === "pending") {
      return res.status(403).json({ message: "Your account is waiting for admin approval. Please wait for confirmation." });
    }
    if (user.status === "rejected") {
      return res.status(403).json({ message: "Your account access has been rejected. Please contact the admin." });
    }

    // Now verify OTP
    db.query(
      `SELECT * FROM email_otp WHERE email=? AND otp=? AND expires_at > NOW()`,
      [email.trim().toLowerCase(), otp],
      (err2, otpRows) => {
        if (err2) return res.status(500).json({ message: "Server error" });

        if (!otpRows.length) {
          return res.status(401).json({ message: "Invalid or expired OTP. Please request a new one." });
        }

        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "14d" }
        );

        db.query(`DELETE FROM email_otp WHERE email=?`, [email]);

        res.json({
          token,
          user: { id: user.id, name: user.first_name, email: user.email, role: user.role },
        });
      }
    );
  });
});

/* ================= GET ALL USERS ================= */

router.get("/users", (req, res) => {
  const query = `
    SELECT u.id, u.first_name, t.job_title AS position, t.emp_role AS empRole, u.role AS systemRole
    FROM users u LEFT JOIN teammember t ON u.email = t.emp_email
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

/* ================= ADMIN: PENDING REGISTRATIONS ================= */

router.get("/pending-users", (req, res) => {
  db.query(
    `SELECT id, first_name, email, role, status, created_at FROM users WHERE status='pending' ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(rows);
    }
  );
});

/* ================= ADMIN: APPROVE / REJECT ================= */

router.put("/approve/:id", (req, res) => {
  const { action } = req.body; // "active" or "rejected"
  if (!["active", "rejected"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }
  
  // First get the user's email before updating
  db.query(`SELECT email, first_name FROM users WHERE id=?`, [req.params.id], (err, userRows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (!userRows.length) return res.status(404).json({ message: "User not found" });
    
    const userEmail = userRows[0].email;
    const userName = userRows[0].first_name;
    
    db.query(`UPDATE users SET status=? WHERE id=?`, [action, req.params.id], (err) => {
      if (err) return res.status(500).json({ message: "DB error" });
      
      // If approved (active), add to team
      if (action === "active") {
        db.query(`SELECT id FROM teammember WHERE emp_email=?`, [userEmail], (err, teamRows) => {
          if (teamRows.length === 0) {
            db.query(
              `INSERT INTO teammember (emp_name, emp_email, job_title, emp_role) VALUES (?, ?, ?, ?)`,
              [userName, userEmail, "Team Member", "user"]
            );
          }
        });
      }
      
      // Mark notification as read
      db.query(`UPDATE admin_notifications SET is_read=1 WHERE user_id=?`, [req.params.id]);
      res.json({ message: `User ${action}` });
    });
  });
});

/* ================= ADMIN: NOTIFICATIONS ================= */

router.get("/notifications", (req, res) => {
  db.query(
    `SELECT n.id, n.type, n.message, n.is_read, n.created_at, n.user_id,
            u.first_name, u.email, u.role, u.status
     FROM admin_notifications n
     INNER JOIN users u ON u.id = n.user_id
     ORDER BY n.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err.message });
      res.json(rows);
    }
  );
});

router.put("/notifications/:id/read", (req, res) => {
  db.query(`UPDATE admin_notifications SET is_read=1 WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "DB error" });
    res.json({ message: "Marked read" });
  });
});

/* ================= ADMIN LOGIN (EMAIL + PASSWORD) ================= */
router.post("/admin-login", (req, res) => {
  const { email, password } = req.body;

  const ADMIN_EMAIL = "admin@madhura.com";
  const ADMIN_PASSWORD = "admin@123#";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: 0, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "14d" }
  );

  res.json({
    token,
    user: { id: 0, name: "Admin", email: ADMIN_EMAIL, role: "admin" },
  });
});

module.exports = router;
