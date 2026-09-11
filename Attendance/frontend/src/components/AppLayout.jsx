import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import PageLoader from './PageLoader';

/** Shell for signed-in pages: navigation bar plus the routed page. */
export default function AppLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
