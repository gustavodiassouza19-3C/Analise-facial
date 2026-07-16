import { createBrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import FaceAnalyzer from '@/components/evaluation/FaceAnalyzer';
import ResultsPage from '@/pages/ResultsPage';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import AdminQueuePage from '@/pages/AdminQueuePage';
import AdminEvaluatePage from '@/pages/AdminEvaluatePage';
import ProgressPage from '@/pages/ProgressPage';
import EvaluationDetailPage from '@/pages/EvaluationDetailPage';
import ProfilePage from '@/pages/ProfilePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Layout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/signup',
        element: <SignupPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/dashboard',
            element: <FaceAnalyzer />,
          },
          {
            path: '/dashboard/results',
            element: <ResultsPage />,
          },
          {
            path: '/dashboard/admin',
            element: <AdminQueuePage />,
          },
          {
            path: '/dashboard/admin/evaluate/:id',
            element: <AdminEvaluatePage />,
          },
          {
            path: '/dashboard/progress',
            element: <ProgressPage />,
          },
          {
            path: '/dashboard/evaluation/:id',
            element: <EvaluationDetailPage />,
          },
          {
            path: '/dashboard/profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
]);

export default router;
