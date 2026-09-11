import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import PageLoader from './components/PageLoader';
import RequireAuth from './components/RequireAuth';

const Landing = lazy(() => import('./pages/Landing'));
const TeacherHome = lazy(() => import('./pages/TeacherHome'));
const ClassroomDetails = lazy(() => import('./pages/ClassroomDetails'));
const MarkAttendance = lazy(() => import('./pages/MarkAttendance'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentCheckIn = lazy(() => import('./pages/StudentCheckIn'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Keeps links from the previous URL scheme (/view/:id, /markatt/:id) working. */
function LegacyRedirect({ to }) {
  const params = useParams();
  const { search } = useLocation();
  return <Navigate to={`${to(params)}${search}`} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route
          element={
            <RequireAuth role="Teacher">
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/home" element={<TeacherHome />} />
          <Route path="/classrooms/:id" element={<ClassroomDetails />} />
          <Route path="/classrooms/:id/attendance" element={<MarkAttendance />} />
        </Route>

        <Route
          element={
            <RequireAuth role="Student">
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-checkin/:id" element={<StudentCheckIn />} />
        </Route>

        <Route path="/view/:id" element={<LegacyRedirect to={({ id }) => `/classrooms/${id}`} />} />
        <Route
          path="/markatt/:id"
          element={<LegacyRedirect to={({ id }) => `/classrooms/${id}/attendance`} />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
