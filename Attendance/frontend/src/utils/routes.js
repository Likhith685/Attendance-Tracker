export const ROUTES = {
  landing: '/',
  teacherHome: '/home',
  classroom: (id) => `/classrooms/${id}`,
  markAttendance: (id, date) => `/classrooms/${id}/attendance${date ? `?date=${date}` : ''}`,
  studentDashboard: '/student-dashboard',
  studentCheckIn: (id) => `/student-checkin/${id}`,
};

export const homePathFor = (role) =>
  role === 'Student' ? ROUTES.studentDashboard : ROUTES.teacherHome;
