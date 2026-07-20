# MERN Attendance Management System

A full-stack attendance management application built using the MERN stack (MongoDB, Express, React, Node.js). It simplifies classroom management, automates attendance tracking, and features responsive dashboards, geolocated student check-ins, automated absence notifications, and interactive analytics.

---

## Key Features

### 📅 Date-Picker Attendance Marking
- Teachers can select any calendar date using a date-picker interface.
- View and modify existing attendance records.

### 📊 Live Analytics & Roster Visualizations
- Interactive, responsive `AreaChart` and `BarChart` visualizers built with **Recharts**.
- Automatic visual **Defaulter Warnings** and at-risk banners (Attendance < 75%).

### 📄 CSV Bulk Roster Imports
- Fast classroom enrollment with drag-and-drop CSV parser.

### 🔐 Google OAuth Sign-In & Access Control (RBAC)
- Secure **Google Sign-In** integration on the Login and Signup portals.
- Verified JWT session creation using Google account details (email & name).
- Specialized dashboards for **Teachers** (classroom controls) and **Students** (logs and check-ins).
- Unique roll number enforcement to prevent duplicate student registration.


### 📍 PIN Geo-Fenced Self Check-In
- Teachers can initiate check-in sessions generating a temporary 6-digit PIN and capturing GPS coordinates.
- Students share their location coordinates (utilizing the HTML5 Geolocation API) to verify presence within a **200-meter radius** (Haversine formula validation).

---

## Tech Stack

- **MongoDB** – Database for users, classrooms, students, and logs.
- **Express.js** – REST API framework.
- **React.js** – Frontend development.
- **Node.js** – Backend runtime environment.
- **Libraries used**: Recharts, Nodemailer, React-Toastify, JWT.

---

**Developed by:**  
**Boda Likhithraj**

