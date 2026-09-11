import { apiClient } from './client';

const classroomPath = (id) => `/classrooms/${encodeURIComponent(id)}`;

/** Teacher-facing classroom, roster, attendance and check-in endpoints. */
export const classroomsApi = {
  list: (options) => apiClient.get('/classrooms', options).then((res) => res.data.classrooms),

  create: (data) => apiClient.post('/classrooms', data).then((res) => res.data.classroom),

  get: (id, options) => apiClient.get(classroomPath(id), options).then((res) => res.data.classroom),

  update: (id, data) => apiClient.patch(classroomPath(id), data).then((res) => res.data.classroom),

  remove: (id) => apiClient.delete(classroomPath(id)),

  listStudents: (id, options) =>
    apiClient.get(`${classroomPath(id)}/students`, options).then((res) => res.data.students),

  addStudent: (id, student) =>
    apiClient.post(`${classroomPath(id)}/students`, student).then((res) => res.data.student),

  importStudents: (id, students) =>
    apiClient.post(`${classroomPath(id)}/students/bulk`, { students }).then((res) => res.data),

  removeStudent: (id, studentId) =>
    apiClient.delete(`${classroomPath(id)}/students/${encodeURIComponent(studentId)}`),

  listSessions: (id, options) =>
    apiClient.get(`${classroomPath(id)}/attendance`, options).then((res) => res.data.sessions),

  getSession: (id, date, options) =>
    apiClient
      .get(`${classroomPath(id)}/attendance/${date}`, options)
      .then((res) => res.data.session),

  saveSession: (id, date, records) =>
    apiClient
      .put(`${classroomPath(id)}/attendance/${date}`, { records })
      .then((res) => res.data.session),

  startCheckIn: (id, options) =>
    apiClient.post(`${classroomPath(id)}/check-in`, options).then((res) => res.data.checkIn),

  stopCheckIn: (id) => apiClient.delete(`${classroomPath(id)}/check-in`),
};
