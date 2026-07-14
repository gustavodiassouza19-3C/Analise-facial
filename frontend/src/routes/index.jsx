import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import FaceAnalyzer from '@/components/evaluation/FaceAnalyzer';
import ResultsPage from '@/pages/ResultsPage';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';

const router = createBrowserRouter([
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
    ],
  },
]);

export default router;
