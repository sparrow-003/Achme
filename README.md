# ACHME - CRM & Business Management Application

## 📋 Overview

**ACHME** is a comprehensive full-stack CRM (Customer Relationship Management) and business management platform designed for sales teams, service providers, and small-to-medium enterprises. It provides end-to-end solutions for managing customer relationships, sales pipelines, invoicing, payments, task tracking, and team collaboration with automated workflows.

## 🏗️ Architecture

The application follows a modern three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│                   Port 3001 (Development)                    │
│  - Dashboards, Forms, Reports, Charts, Authentication UI     │
└────────────────────────────┬────────────────────────────────┘
                             │ (REST API + WebSocket)
┌────────────────────────────▼────────────────────────────────┐
│              Backend (Node.js + Express.js)                  │
│                   Port 3000 (Development)                    │
│  - REST API Routes, Authentication, Business Logic          │
│  - Real-time Socket.IO, PDF Generation, Email/SMS           │
└────────────────────────────┬────────────────────────────────┘
                             │ (MySQL Protocol)
┌────────────────────────────▼────────────────────────────────┐
│                  MySQL Database                              │
│       (Customer, Lead, Invoice, Task Data Storage)           │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Backend:**
- Node.js with Express.js 5.2.1
- MySQL2 3.16.0 (Database)
- JWT Authentication (jsonwebtoken 9.0.3)
- Socket.IO 4.8.3 (Real-time Features)
- Puppeteer 24.40.0 (PDF Generation)
- Nodemailer 7.0.13 (Email)
- Twilio 5.11.2 (SMS)
- node-schedule 2.1.1 (Task Scheduling)

**Frontend:**
- React 19.2.3
- React Router DOM 7.11.0 (Navigation)
- Tailwind CSS (Styling)
- Axios 1.13.2 (HTTP Client)
- Socket.IO Client 4.8.3
- Recharts 3.6.0 (Data Visualization)
- Framer Motion 12.25.0 (Animations)
- Lucide React 0.562.0 (Icons)

---

## 🎯 Key Features

### 1. Lead Management System

#### **Telecalls** (`/api/Telecalls`)
- Record inbound and outbound phone calls
- Track customer details: name, phone, city, service interest
- Call outcomes: New, Hot/Warm/Cold Case, Not Required, Converted
- Set follow-up dates and reminders
- Auto-escalation when reminders are missed 3+ times

#### **Walk-ins** (`/api/Walkins`)
- Track walk-in customer visits
- Record purpose, date, and time of visit
- Same outcome and follow-up logic as telecalls
- Staff assignment and location tracking

#### **Field Visits** (`/api/Fields`)
- Manage on-site field visits
- Record visit date, outcome, and location
- Follow-up scheduling with notes
- Reminder date tracking

#### **Lead Reminders & Escalation**
- Set reminder dates and times for each lead
- Scheduler runs every 15 minutes to check overdue reminders
- Automatic escalation when 3+ reminders are missed
- Escalation logged in `lead_escalations` table
- Complete activity tracking in `lead_activity` table

### 2. Quotations & Estimates

#### **Quotations** (`/api/quotations`)
- Create professional multi-item quotations
- HSN/SAC codes support (Indian GST compliance)
- Flexible tax options: GST (5%, 18%), CGST/SGST/IGST tracking
- Version control with parent-child relationships
- Track which version is latest with `is_latest` flag
- Include bank details, payment terms, and validity periods
- PDF export with custom logo and header

#### **Proforma Invoices** (`/api/performainvoice`)
- Similar to quotations but labeled as Proforma
- Support for custom currencies and rate variations
- Version history tracking
- PDF generation with professional formatting

#### **Service Estimations** (`/api/service-estimation`)
- Service-specific estimates with material details
- Warranty and AMC (Annual Maintenance Contract) options
- Brand/model tracking
- Unit of Measure (UOM) support

### 3. Invoicing & Payments

#### **Invoices** (`/api/invoice`)
- Create invoices from quotations or standalone
- Link to customers/clients
- Track invoice dates and due dates
- Project name documentation
- Status: Paid/Unpaid (aggregated from payment records)

#### **Payments** (`/api/payments`)
- Multiple payment methods:
  - PayPal
  - Cash
  - Bank Transfer
- Transaction ID tracking
- Payment date recording
- Email notification flags
- Full CRUD operations with validation

### 4. Task & Project Management

#### **Tasks** (`/api/task`)
- Create project-based tasks
- Status tracking: New → Process → Completed
- Priority levels: Low, Normal, High, Urgent
- Assign to team members
- Set due dates
- Complete activity logging for audit trail
- Automatic notification generation

#### **Contracts** (`/api/contract`)
- Contract templates
- Amount value tracking (decimal support)
- Start and end date management
- Category classification

### 5. Team & Client Management

#### **Team Members** (`/api/teammember`)
- Employee profiles: name, email, phone, job title
- Role assignment: Developer, BDM (Business Development Manager)
- Performance metrics: quotation count tracking
- Team-based task assignment

#### **Clients** (`/api/client`)
- Company information
- Contact details and GST numbers
- Address and location tracking
- Auto-created when leads convert
- Search and filter functionality

#### **Customers** (`/api/customers`)
- Individual customer profiles
- Contact information: phone, email, city
- Service preference tracking
- Location-based organization

### 6. Services & Maintenance

#### **Services** (`/api/services`)
- Service record creation and tracking
- Multi-image upload (up to 10 images, 50MB limit)
- Client and material tracking
- Warranty and AMC status
- Issue documentation
- File management with CRUD operations

### 7. Analytics & Reporting

#### **Call Reports** (`/api/call-reports`)
- Session-based call recording and tracking
- Performance metrics aggregation
- Staff performance KPIs
- Historical call session data

#### **Dashboards**
- **Admin Dashboard**: System-wide overview, all data access, pending approvals
- **User Dashboard**: Assigned leads, personal tasks, performance metrics
- **Reports Page**: Business intelligence dashboards with charts

---

## 📊 How the Application Works

### Complete Workflow: Lead → Invoice → Payment

```
┌─────────────────────────────────────────────────────────────┐
│  1. LEAD CAPTURE                                             │
│     Sales rep records: Telecall/Walk-in/Field Visit          │
│     Captures: Customer name, phone, service, city            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  2. FOLLOW-UP SETUP                                          │
│     Set reminder date & time for follow-up                   │
│     Scheduler checks every 15 minutes                        │
│     Mark as Done/Missed, track escalations                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  3. LEAD QUALIFICATION                                       │
│     Update status: New/Hot/Warm/Cold/Converted               │
│     3+ missed reminders → Auto-escalate                      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CLIENT CONVERSION                                        │
│     Lead outcome = "Converted"                               │
│     Auto-sync to clients table (phone lookup)                │
│     Create client record if new                              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  5. QUOTATION CREATION                                       │
│     Create quotation linked to customer                      │
│     Add line items: description, price, quantity, tax        │
│     Calculate subtotal, taxes, grand total                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  6. PDF GENERATION                                           │
│     Use Puppeteer to render HTML → PDF                       │
│     Include: Logo, header, items table, T&Cs, bank details   │
│     Auto-generate prefix (QT, PI, EI with year + ID)         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  7. QUOTATION APPROVAL                                       │
│     Send PDF to customer                                     │
│     Customer reviews and approves                            │
│     Create new version if revisions needed                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  8. INVOICE CREATION                                         │
│     Convert approved quotation to invoice                    │
│     Create clientinvoices record                             │
│     Set invoice date and due date                            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  9. PAYMENT RECORDING                                        │
│     Record payment(s) against invoice                        │
│     Multiple payment methods supported                       │
│     Track Transaction ID for audit trail                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  10. INVOICE RECONCILIATION                                  │
│      Aggregate payments from payments table                  │
│      Mark invoice as Paid when total reached                 │
│      Complete financial record                              │
└─────────────────────────────────────────────────────────────┘
```

### Automated Processes

#### **Reminder Scheduler** (Runs Every 15 Minutes)
```
1. Query lead_reminders table for Pending status
2. Check: reminder_date < today OR (reminder_date = today AND reminder_time < current_time)
3. If overdue:
   - Mark reminder as Missed
   - Increment missed_count for the lead
4. If missed_count >= 3:
   - Check if lead_escalations record exists
   - If not: Create new escalation record with status='Open'
   - If yes: Update with latest details
5. Escalation notification triggered
```

#### **Lead Conversion & Client Sync**
```
1. User changes lead outcome to "Converted"
2. syncClient() function triggered
3. Check if customer exists in clients table (by phone number)
4. If new customer:
   - INSERT new client record
   - Copy all customer details
5. If customer exists:
   - UPDATE with latest information
6. If outcome changed from Converted:
   - DELETE from clients table
```

#### **Activity Logging**
```
Every significant action logs to lead_activity or task_activity tables:
- Lead creation
- Status changes
- Reminder updates
- Task creation/updates
- Timestamps recorded for audit trail
- Tracked user/staff information
```

#### **Invoice Versioning**
```
1. Create initial quotation
   - parent_id = NULL
   - version = 1
   - is_latest = true
2. Customer requests changes → Create revision
   - parent_id = original quotation ID
   - version = 2
   - Set is_latest = true on new, false on old
3. All versions kept in database
4. History accessible via /api/quotations/customer-history/:id
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | Authentication & Access Control | id, email, user_password, role (admin/user), status (pending/approved) |
| `customers` | Customer Master Data | id, customer_name, mobile_number, email, location_city |
| `clients` | Converted Customers/Businesses | id, name, company_name, email, phone, address, state, gst_number |
| `telecalls` | Phone Lead Records | id, customer_name, mobile_number, call_date, call_outcome, staff_name |
| `walkins` | Walk-in Visitor Records | id, customer_name, mobile_number, walkin_date, walkin_status, purpose |
| `fields` | Field Visit Records | id, customer_name, visit_date, field_outcome, staff_name, location_city |
| `lead_reminders` | Lead Reminder Scheduling | id, lead_id, lead_type, reminder_date, reminder_time, status (Pending/Done/Missed) |
| `lead_activity` | Lead Action Audit Log | id, lead_id, lead_type, action, details, created_at |
| `lead_escalations` | Escalation Tracking | id, lead_id, lead_type, customer_name, missed_count, status (Open/Resolved) |
| `quotations` | Quotation/Invoice Documents | id, customer_id, quotation_date, subtotal, tax, grand_total, version, is_latest, parent_id |
| `quotation_items` | Line Items in Quotations | id, quotation_id, description, brand_model, hsn_sac, price, quantity, tax |
| `clientinvoices` | Simple Invoices | id, client_company, project_names, invoice_date, invoice_duedate |
| `payments` | Payment Records | id, invoice_id, amount, payment_date, payment_method, Transaction_ID |
| `tasks` | Project Tasks | id, project_name, task_title, client_name, project_status, project_priority, due_date |
| `task_activity` | Task Action Audit Log | id, task_id, action, message |
| `notifications` | System Alerts | id, task_id, title, description, is_read |
| `services` | Service Records | id, client, material, warranty, amc, date, images (JSON), issues |
| `contracts` | Contract Records | id, client_company, contract_title, start_date, end_date, amount_value |
| `teammember` | Staff Profiles | id, first_name, last_name, emp_email, mobile, job_title, emp_role, quotation_count |
| `messages` | Chat Messages | id, sender_id, receiver_id, message, type, created_at, seen |
| `email_otp` | OTP Verification | email, otp, expires_at |
| `pi_from_addresses` | Invoice "From" Addresses | id, label, address |

### Relationship Diagram

```
users (admin/user roles)
    ├─ owns → customers
    │    ├─ has many → quotations → quotation_items
    │    ├─ has many → payments → clientinvoices
    │    └─ syncs to → clients (on conversion)
    │
    ├─ logs → lead_reminders → lead_escalations
    │    └─ tracked in → lead_activity
    │
    ├─ creates → tasks → task_activity
    │    ├─ creates → notifications
    │    └─ assigned to → teammember
    │
    └─ manages → services
         ├─ assigned to → clients
         └─ stores → images (JSON)
```

---

## 🔐 Authentication & Authorization

### Registration & Login Flow

**Step 1: Registration**
```
User enters email → Request OTP via /api/auth/send-email-otp
    ↓
OTP sent to email (stored in email_otp table with 5-min expiry)
    ↓
User enters OTP + Password → /api/auth/register
    ↓
Validate OTP (must exist and not expired)
    ↓
Hash password with bcrypt
    ↓
Create user record with status='pending'
    ↓
User waits for admin approval (status='approved')
```

**Step 2: Login**
```
User enters email + OTP → /api/auth/login
    ↓
Verify OTP from email_otp table
    ↓
Check user status (must be 'approved')
    ↓
Generate JWT token
    ↓
Return token + user data (id, first_name, email, role)
    ↓
Frontend stores in sessionStorage
```

### Session Management

- JWT tokens stored in browser sessionStorage (isolated per tab)
- Token passed in `Authorization: Bearer <token>` header
- Middleware verifies JWT on protected routes
- Logout clears sessionStorage

### Authorization & Access Control

**Roles:**
- **Admin**: Full system access, approves new user registrations, manages all features
- **User**: Limited access, sees assigned leads (filtered by staff_name)

**Middleware Protection:**
- `verifyToken()` - Validates JWT signature and expiry
- `isAdmin()` - Restricts routes to admin role only
- Applied to sensitive routes (approvals, user management, etc.)

**Approval Workflow:**
```
New registration → status='pending'
    ↓
Logged in admin_notifications table
    ↓
Admin reviews pending users
    ↓
Admin clicks "Approve" → /api/auth/approve/:id
    ↓
User status changed to 'approved'
    ↓
User can now access full application
```

---

## 🔌 Real-Time Features (Socket.IO)

### Current Implementation Status
Socket.IO 4.8.3 is configured but **partially implemented** for chat.

### Chat System (Ready for Activation)
```javascript
Socket Events (currently in chatsockets.js):
- "connection"      → User connects to server
- "join"            → User joins with userId
- "send_message"    → Send message to receiver_id
- "receive_message" → Broadcast to connected users
- "online_users"    → Fetch list of active users
- "disconnect"      → User disconnects
```

### Message Storage
```
messages table:
- sender_id (user sending message)
- receiver_id (target user)
- message (text content)
- type (text, notification, etc.)
- created_at (timestamp)
- seen (boolean flag for read status)
```

### Potential Real-Time Enhancements
1. **Lead Updates**: Notify team when lead status changes
2. **Task Assignments**: Instant notification when task assigned
3. **Payment Notifications**: Alert on payment received
4. **Escalation Alerts**: Real-time escalation notifications to managers
5. **Chat System**: Full peer-to-peer messaging (ready to enable)

---

## 🧠 Business Logic & Automation

### Lead Escalation Intelligence

**Problem**: Sales team misses follow-up reminders

**Solution**:
```
Reminder status tracking:
- Pending: Not yet due
- Done: Completed successfully
- Missed: Overdue and not completed

Escalation trigger:
- 3+ Missed reminders → Lead is escalated
- Creates lead_escalations record
- Flags for manager review
- Previous escalations can be marked 'Resolved'
```

### Quotation Versioning System

**Use Case**: Customer requests changes to quotation

**Process**:
```
Initial Quotation:
- id: 1
- parent_id: NULL
- version: 1
- is_latest: true

Customer requests revision:
- Create new quotation
- parent_id: 1 (reference to original)
- version: 2
- is_latest: true

Update original:
- is_latest: false (now version 1 is old)

Benefits:
- Complete audit trail
- Easy version comparison
- Historical reference
- All versions preserved
```

### Invoice Payment Aggregation

**Logic** (in `/api/invoice/with-payments`):
```
For each clientinvoice record:
1. Query payments table with matching invoice_id
2. SUM all payment amounts
3. Compare to invoice grand_total
4. If total_payments >= invoice_amount → Mark as PAID
5. If total_payments < invoice_amount → Mark as UNPAID
6. Include payment details in response
```

### Activity Logging for Compliance

**Captured Events**:
- Lead creation with all details
- Status changes with old → new values
- Reminder scheduling and updates
- Task creation and modifications
- Any follow-up actions

**Audit Trail Benefits**:
- Compliance documentation
- Performance analysis
- Dispute resolution
- Customer communication history

---

## 📁 Project Structure

```
Achme-master/
│
├── backend/                          # Node.js + Express API
│   ├── config/
│   │   └── database.js               # MySQL connection config
│   ├── middileware/
│   │   └── authMiddleware.js         # JWT verification & auth
│   ├── routes/
│   │   ├── authRoutes.js             # Login, register, approval
│   │   ├── callReportRoutes.js       # Call analytics
│   │   ├── chatroutes.js             # Chat message routes
│   │   ├── contract.js               # Contract CRUD
│   │   ├── estimate.js               # Estimate management
│   │   ├── estimateInvoiceRoutes.js  # Estimate → Invoice flow
│   │   ├── invoice.js                # Invoice management
│   │   ├── leadManagementRoutes.js   # Lead reminder routes
│   │   ├── newclient.js              # Client creation
│   │   ├── payment.js                # Payment recording
│   │   ├── quotationRoutes.js        # Quotation CRUD
│   │   ├── serviceRoutes.js          # Service records
│   │   ├── taskRoutes.js             # Task management
│   │   ├── telecallRoutes.js         # Telecall leads
│   │   ├── walkinRoutes.js           # Walk-in tracking
│   │   └── [more routes...]
│   │
│   ├── backendutil/
│   │   ├── generateInvoicePdf.js     # Puppeteer PDF generation
│   │   ├── otp.js                    # OTP sending logic
│   │   ├── reminderScheduler.js      # Runs every 15 min
│   │   ├── sendSms.js                # Twilio SMS sending
│   │
│   ├── sockets/
│   │   └── chatsockets.js            # Socket.IO event handlers
│   │
│   ├── migrations/
│   │   ├── lead_management_migration.js
│   │   ├── invoice_versioning_migration.js
│   │   ├── auth_approval_migration.js
│   │   ├── [more migrations...]
│   │
│   ├── schema.sql                    # Database schema
│   ├── server.js                     # Express server entry point
│   └── package.json                  # Node dependencies
│
└── frontend/                         # React application
    ├── src/
    │   ├── auth/
    │   │   ├── AuthContext.jsx       # Global user state
    │   │   ├── login.jsx             # Login page
    │   │   └── register.jsx          # Registration page
    │   │
    │   ├── components/
    │   │   ├── navbar.jsx            # Top navigation
    │   │   ├── invoicetemplate.jsx   # Invoice display
    │   │   ├── followuplist.jsx      # Follow-up items
    │   │   ├── remaindersummary.jsx  # Reminder status
    │   │   └── [more components...]
    │   │
    │   ├── pages/
    │   │   ├── telecalling.jsx       # Telecall management
    │   │   ├── walkins.jsx           # Walk-in tracking
    │   │   ├── field.jsx             # Field visits
    │   │   ├── proposal.jsx          # Quotations
    │   │   ├── invoice.jsx           # Invoices
    │   │   ├── payment.jsx           # Payment recording
    │   │   ├── task.jsx              # Task management
    │   │   ├── team.jsx              # Team members
    │   │   └── [more pages...]
    │   │
    │   ├── dashboards/
    │   │   ├── admindashboard.jsx    # Admin overview
    │   │   └── userdashboard.jsx     # User dashboard
    │   │
    │   ├── chatbox/
    │   │   ├── chatwindow.jsx        # Chat messages
    │   │   ├── chatsidebar.jsx       # Chat users list
    │   │   └── [chat components...]
    │   │
    │   ├── App.js                    # Main app component
    │   ├── index.js                  # React entry point
    │   └── tailwind.config.js        # Tailwind CSS config
    │
    ├── public/
    │   ├── index.html                # HTML entry point
    │   └── manifest.json
    │
    └── package.json                  # React dependencies
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 14+ and npm
- MySQL 5.7+
- Git

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=achme
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=3000
ALLOWED_ORIGIN=http://localhost:3001
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE=your_twilio_phone
SMTP_USER=your_email
SMTP_PASS=your_password
EOF

# Import database schema
mysql -u root -p achme < schema.sql

# Run migrations (if needed)
node migrations/migrate.js

# Start server
npm start
# Server runs on http://localhost:3000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file (if needed)
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
EOF

# Start development server
npm start
# App runs on http://localhost:3001
```

### Database Import

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE achme;"

# Import schema
mysql -u root -p achme < backend/schema.sql

# Verify tables
mysql -u root -p achme -e "SHOW TABLES;"
```

---

## 📡 API Endpoints Overview

### Authentication
- `POST /api/auth/send-email-otp` - Send OTP to email
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email + OTP
- `POST /api/auth/approve/:id` - Admin approves user

### Lead Management
- `GET /api/Telecalls` - Fetch all telecalls
- `POST /api/Telecalls` - Create new telecall
- `PUT /api/Telecalls/:id` - Update telecall
- `GET /api/Walkins` - Fetch all walk-ins
- `POST /api/Walkins` - Create walk-in
- `PUT /api/Walkins/:id` - Update walk-in
- `GET /api/Fields` - Fetch field visits
- `POST /api/Fields` - Create field visit
- `PUT /api/Fields/:id` - Update field visit

### Quotations & Estimates
- `GET /api/quotations` - Fetch all quotations
- `POST /api/quotations` - Create quotation
- `GET /api/quotations/customer-history/:id` - Version history
- `GET /api/quotations/pdf/:id` - Generate PDF
- `POST /api/service-estimation` - Create service estimate
- `GET /api/service-estimation` - Fetch estimates

### Invoicing
- `GET /api/invoice` - Fetch all invoices
- `POST /api/invoice` - Create invoice
- `GET /api/invoice/with-payments` - Invoices with payment status
- `PUT /api/invoice/:id` - Update invoice
- `DELETE /api/invoice/:id` - Delete invoice

### Payments
- `GET /api/payments` - Fetch all payments
- `POST /api/payments` - Record payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Tasks
- `GET /api/task` - Fetch all tasks
- `POST /api/task` - Create task
- `PUT /api/task/:id` - Update task
- `DELETE /api/task/:id` - Delete task

### Other Resources
- `GET /api/client` - Fetch clients
- `POST /api/client` - Create client
- `GET /api/leads/reminders` - Fetch reminders
- `POST /api/leads/reminders` - Create reminder
- `GET /api/services` - Fetch services
- `POST /api/services` - Create service

---

## 🔍 Key Business Processes

### Sales Pipeline
```
Lead Entry → Qualification → Follow-up → Conversion → Client → Quotation → Invoice
```

### Invoice Workflow
```
Create Quotation → PDF Generation → Send to Customer → Approval → Create Invoice → Payment Recording
```

### Task Management
```
Create Task → Assign to Staff → Status Updates → Completion → Archive
```

### Escalation Process
```
Missed Reminder (1) → Missed Reminder (2) → Missed Reminder (3+) → Auto-Escalate → Manager Alert
```

---

## 🛡️ Security Features

✅ **Implemented Security Measures**:
- JWT-based authentication
- Bcrypt password hashing
- Email OTP verification
- Admin approval workflow for new users
- Role-based access control (Admin/User)
- SQL parameterized queries
- CORS configuration

⚠️ **Security Recommendations**:
- Enable HTTPS in production (critical)
- Implement rate limiting on OTP endpoints
- Add input validation on all forms
- Encrypt sensitive data (PII, phone numbers)
- Add request logging and monitoring
- Regular security audits
- Database backups scheduled

---

## 🚀 Deployment Considerations

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up database backups
- [ ] Configure email service (SMTP)
- [ ] Set up SMS provider (Twilio)
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and error logging
- [ ] Implement rate limiting
- [ ] Enable CORS for production domain only

---

## 📈 Performance Optimization

**Current Optimizations**:
- MySQL connection pooling (mysql2)
- JWT caching (no DB lookup on each request)
- Scheduled jobs prevent repeated checks
- React lazy loading (code splitting ready)

**Recommended Enhancements**:
- Redis caching for frequently accessed data
- Database query optimization with indexes
- Frontend bundle optimization
- Image compression for service uploads
- API response pagination for large datasets

---

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error**:
```bash
# Check MySQL service
sudo service mysql status

# Verify credentials in .env
# Test connection: mysql -u root -p -h localhost
```

**Port 3000 Already in Use**:
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

**Migration Errors**:
```bash
# Manually check schema
mysql -u root -p achme -e "SHOW TABLES;"

# Run migrations individually
node backend/migrations/migrate.js
```

### Frontend Issues

**Blank Page / White Screen**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

**API Connection Error**:
- Check backend is running (localhost:3000)
- Verify REACT_APP_API_URL in .env
- Check CORS settings in backend

---

## 📚 Documentation Files

- `README.md` - This file (Overview & Setup)
- `backend/schema.sql` - Database schema
- `backend/migrations/` - Database change history
- Individual route files contain endpoint documentation

---

## 🤝 Support & Contribution

For questions or issues:
1. Check troubleshooting section above
2. Review API endpoint documentation
3. Check database schema for data structure
4. Review migration files for schema changes

---

## 📝 Version History

**Current Version**: 1.0.0
- Full lead management system
- Invoice generation with versioning
- Payment tracking
- Task management
- Team collaboration
- Real-time socket setup (partially implemented)

---

## 🎓 Learning Resources

**Key Concepts to Understand**:
1. **Lead Management**: How leads flow through the system
2. **Quotation Versioning**: Parent-child relationship tracking
3. **Escalation Logic**: 3-strike automatic escalation system
4. **Payment Aggregation**: How invoices are marked as paid
5. **Activity Logging**: Audit trail for compliance

---

**Last Updated**: May 6, 2026

This application provides enterprise-grade CRM functionality with modern web technologies, automated workflows, and comprehensive business intelligence for managing customer relationships and sales operations.
