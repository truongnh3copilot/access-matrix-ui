# Data Access Governance & Access Matrix Management System (UI Demo)

You are a **senior frontend engineer and product designer**.

Your task is to design and implement a **FULL UI DEMO (frontend only, no backend/service)** for an enterprise system called:

**"Data Access Governance & Access Matrix Management System"**

---

## 🎯 Goal

Build a modern, clean, enterprise-level UI to demonstrate how access control is managed across a Data Warehouse ecosystem.

The system manages access to:

* Databases (Amazon Redshift, PostgreSQL, SQL Server)
* BI Tools (Power BI)
* Internal Reports (SQL Server Reporting / custom dashboards)

⚠️ IMPORTANT:

* This is UI ONLY (no real backend)
* Use mock data / fake APIs
* Focus on UX, workflows, and realistic enterprise behavior

---

## 🧱 TECH STACK

* React (with hooks)
* TypeScript
* TailwindCSS (or Material UI)
* Component-based architecture
* Mock JSON data
* Optional: Zustand / Redux for state management

---

## 🧩 CORE FEATURES (UI)

### 1. Dashboard

* Overview metrics:

  * Total users
  * Total roles
  * Total data sources
  * Pending access requests

* Charts:

  * Access by system (DB / PBI / Reports)
  * Request trends over time

---

### 2. Access Matrix (MOST IMPORTANT)

* Table view:

  * Rows: Users / Roles
  * Columns: Data sources (schemas, tables, reports)
  * Cells: Access level (Read / Write / Admin / None)

* Features:

  * Filter by system (Redshift / Postgres / PBI)
  * Search user
  * Expand hierarchy (DB → Schema → Table)
  * Color-coded permissions
  * Click cell → show permission detail

---

### 3. Access Request Management (UNIFIED MAKER + CHECKER)

This is a **SINGLE unified screen** that handles:

* Creating access requests (Maker)
* Reviewing & approving/rejecting requests (Checker)

❗ DO NOT split into separate screens.

---

#### A. Request List (Main View)

Display a table of all access requests:

Columns:

* Request ID
* User
* System (DB / PBI / Report)
* Resource (Schema / Table / Report)
* Access Level (Read / Write / Admin)
* Status (Pending / Approved / Rejected)
* Requested By
* Requested Date
* Approved By
* Action

---

#### B. Row Actions

* If status = Pending:

  * Show:

    * Approve button
    * Reject button

* If status = Approved / Rejected:

  * Disable actions
  * Show colored status badge

---

#### C. Create Request (Maker)

* Button: **"New Request"**

* Opens modal form:

  * Select user
  * Select system
  * Select resource
  * Select access level
  * Input reason

* Submit:

  * Add new row
  * Status = Pending

---

#### D. Approval Behavior (Checker)

* Approve:

  * Status → Approved
  * Set Approved By
  * Set Approved Date

* Reject:

  * Require comment
  * Status → Rejected

---

#### E. Role-Based UI

* Admin / Checker:

  * View all requests
  * Approve / Reject

* Normal User:

  * View own requests only
  * Create request
  * Cannot approve/reject

---

#### F. Filters & UX

* Filter by:

  * Status
  * System
  * User

* Search:

  * User
  * Resource

* Tabs:

  * All
  * My Requests
  * Pending

---

#### G. Request Detail (Optional)

* Click row → open side drawer:

  * Full request info
  * Approval history
  * Comments

---

### 4. User & Role Management

* User list
* Role list
* Assign roles to users

---

### 5. Data Source Management

* Systems:

  * Redshift
  * PostgreSQL
  * SQL Server
  * Power BI

* Hierarchy:

  * DB → Schema → Table
  * Workspace → Report (Power BI)

---

### 6. Audit Log

* Who requested what
* Who approved
* Timestamp
* Before vs After access

---

## 🎨 UI/UX REQUIREMENTS

* Clean enterprise style (AWS / Azure / Jira)
* Sidebar navigation
* Top header (user info)
* Table-heavy layout
* Use modals, tabs, drawers
* Responsive layout

---

### Status UI

* Pending → Yellow badge
* Approved → Green badge
* Rejected → Red badge

---

### UI Enhancements

* Inline actions inside table
* Highlight pending rows
* Confirmation modal (approve/reject)
* Loading states (simulate API delay)
* Disable invalid actions

---

## 🧠 BONUS (IMPORTANT)

Simulate realistic enterprise behaviors:

* Role-based UI rendering
* Fake API delay (setTimeout)
* Prevent duplicate actions
* Show audit trail
* Maintain state consistency

---

## 📦 OUTPUT

* Full React project structure
* Reusable components
* Mock data JSON
* Clean folder structure
* Production-like code quality

---

## 💡 DESIGN PRINCIPLE

Think like:

* AWS IAM
* Azure RBAC
* Snowflake Access Control

---

## 🚀 IMPLEMENTATION STEPS

1. Define project structure
2. Build layout (Sidebar + Header)
3. Implement modules in order:

   * Dashboard
   * Access Matrix
   * Access Request Management
   * User & Role
   * Data Source
   * Audit Log

---

## 🔒 IMPORTANT RULES

* DO NOT delete or modify any files in /docs or /specs
* Treat requirement documents as READ-ONLY
* DO NOT split Access Request into multiple screens
* Always follow enterprise UI standards
* Keep code modular and reusable

---
