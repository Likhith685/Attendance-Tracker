# Attendance Management System

A full-stack attendance tracker built with MongoDB, Express, React and Node.js. Teachers manage
classrooms and mark attendance; students follow their attendance and check themselves in with a
temporary PIN, verified by GPS. 

---

## Features

### For teachers

- **Classrooms**: create, rename and delete classrooms. Each teacher only sees their own.
- **Rosters**: add students one at a time, or import a CSV roster. The import supports quoted
  fields, Excel's byte-order mark and row-level validation, and shows a preview first.
- **Attendance marking**: pick any past date, toggle each student present/absent, and edit
  earlier sessions later. Attendance counters and the session count stay in sync automatically.
- **Analytics**: daily attendance trend and per-student charts (Recharts), with warnings for
  defaulters (below 75%) and students at risk (below 85%).
- **Self check-in**: start a time-boxed session that generates a random 6-digit PIN.students must be within a configurable radius (200 m by
  default, Haversine distance) of where the teacher started the session.

### For students

- **Dashboard**: attendance percentage per course, overall attendance, and a per-date log.
- **Check-in**: enter the PIN from your own device while a session is open. Location is only
  requested when the session requires it.

