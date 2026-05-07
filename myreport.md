# Change Report

## Overview
This report summarizes the changes made in the current workspace to fix backend startup/schema issues, scheduler errors, OTP/register/login flow, and auth persistence.

> Note: The workspace does not appear to be a Git repository, so this report is based on current file contents and visible code sections rather than a git diff.

---

## Files Changed

### 1. `backend/config/database.js` (approx. lines 33-152)
- **Why changed**: Backend startup was failing due to missing DB schema elements and incorrect auto-migration behavior.
- **What fixed**:
  - Added `runQuerySafe()` for safe `CREATE TABLE` / `ALTER TABLE` execution.
  - Added `ensureColumn()` to detect and add missing columns via `information_schema.columns`.
  - Added `ensureTablesAndColumns()` to create missing tables and add required columns:
    - `lead_reminders` with `missed_count INT DEFAULT 0`
    - `lead_escalations` with `missed_count INT DEFAULT 0`
    - `admin_notifications`
    - `users.status` enum column
    - several `assigned_to`, `created_by`, `lead_id`, `lead_type` columns used by existing routes and scheduler.
  - Ensured the schema initialization path calls `ensureTablesAndColumns()` after loading `schema.sql`.
- **Revert**:
  - Remove the `ensureColumn()` and `ensureTablesAndColumns()` functions.
  - Restore the previous database connect / initialization code block if available.
  - Remove the new `admin_notifications` and `users.status` auto-add logic if you want original schema only.

### 2. `backend/routes/authRoutes.js` (approx. lines 81-130)
- **Why changed**: Registration and login were failing due to missing `users.status`, missing admin notification support, and insufficient login persistence.
- **What fixed**:
  - Normalized email values using `trim().toLowerCase()` before database operations.
  - Stored all new registrations with `status='pending'` and created `admin_notifications` entries for each new user registration.
  - Added account approval checks during login for `pending` and `rejected` status.
  - Extended JWT token expiry from default to `14d` so login persists for two weeks.
- **Revert**:
  - Remove `status` handling from registration and login.
  - Remove the `INSERT INTO admin_notifications` query.
  - Reset the JWT expiry clause to the prior configuration (for example, `expiresIn: "1d"` or as originally configured).

### 3. `backend/backendutil/sendSms.js` (approx. lines 1-30)
- **Why changed**: OTP email sending was not resilient enough and could fail silently when the mail transporter was not ready.
- **What fixed**:
  - Added `transporter.verify()` logging to detect SMTP authentication or connection issues at startup.
  - Kept `sendEmailOtp()` unchanged but made email sending behavior more observable for debugging.
- **Revert**:
  - Remove `transporter.verify()` block.
  - Keep the original `nodemailer.createTransport()` and `sendMail()` flow.

### 4. `backend/backendutil/reminderScheduler.js` (approx. lines 11-60)
- **Why changed**: Scheduler failures were caused by missing `missed_count` and invalid `reminder_time` comparisons.
- **What fixed**:
  - Added `missed_count` handling to ensure overdue reminders are tracked.
  - Used `TIME(reminder_time) < ?` to compare stored `TIME` values correctly against the current time.
  - Added robust escalation logic after marking reminders missed.
- **Revert**:
  - Remove the `missed_count` update logic from the `UPDATE lead_reminders` query.
  - Restore the original reminder-time comparison logic if the previous code did not use `TIME(reminder_time)`.

### 5. `backend/routes/leadManagementRoutes.js` (approx. lines 70-100)
- **Why changed**: Reminder marking and escalation checks needed proper `TIME(reminder_time)` handling in SQL.
- **What fixed**:
  - Normalized the `check-missed` query to compare `TIME(reminder_time)` against the current time string.
  - Prevented invalid datetime comparisons when only a `TIME` value is stored.
- **Revert**:
  - Restore the previous `UPDATE lead_reminders` query without `TIME(reminder_time)` if desired.

### 6. `backend/schema.sql` (approx. lines 319-333)
- **Why changed**: The database schema lacked the required user status and admin notifications tables.
- **What fixed**:
  - Added `status ENUM('pending','active','rejected') DEFAULT 'pending'` to the `users` table.
  - Added the `admin_notifications` table for registration approval workflows.
- **Revert**:
  - Remove the `status` column from `CREATE TABLE IF NOT EXISTS users`.
  - Remove the `CREATE TABLE IF NOT EXISTS admin_notifications` block.

### 7. `frontend/src/auth/AuthContext.jsx` (approx. lines 6-25)
- **Why changed**: Login persistence was lost after refresh because auth state was stored in `sessionStorage`.
- **What fixed**:
  - Switched to `localStorage` so the user stays logged in across browser sessions for the token lifetime.
  - Persisted both `user` and `token` entries in local storage when logging in.
- **Revert**:
  - Replace `localStorage` calls with `sessionStorage` calls.
  - Restore the previous `useState` loader to read from session storage.

### 8. `frontend/src/auth/login.jsx` (approx. lines 1-60)
- **Why changed**: Login flow needed to pass normalized email and store the returned token in auth state.
- **What fixed**:
  - Normalized the login email with `trim().toLowerCase()`.
  - Called `login({ ...res.data.user, token: res.data.token })` on successful login.
  - Added clearer error handling for 404 and 403 responses.
- **Revert**:
  - Restore any previous login payload handling if a different auth shape was expected.
  - Remove the `token` from the `login()` call if the old flow did not use token persistence.

---

## Notes
- Existing runtime issues were addressed in both backend and frontend.
- Because this workspace is not a Git repository, there is no native `.git diff` to produce exact patch metadata.
- If you need a full rollback, copy this file list and remove or restore the changed sections manually.
