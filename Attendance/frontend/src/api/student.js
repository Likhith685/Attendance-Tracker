import { apiClient } from './client';

const classroomPath = (id) => `/student/classrooms/${encodeURIComponent(id)}`;

/** Student portal endpoints. */
export const studentApi = {
  dashboard: (options) => apiClient.get('/student/dashboard', options).then((res) => res.data),

  getClassroom: (id, options) =>
    apiClient.get(classroomPath(id), options).then((res) => res.data.classroom),

  checkIn: (id, payload) =>
    apiClient.post(`${classroomPath(id)}/check-in`, payload).then((res) => res.data),
};
