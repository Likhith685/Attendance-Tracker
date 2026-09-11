import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { homePathFor, ROUTES } from '../utils/routes';

/** Renders children only for signed-in users with the required role. */
export default function RequireAuth({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to={ROUTES.landing} replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user.role)} replace />;
  return children;
}
