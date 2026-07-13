import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import FaceAnalyzer from '@/components/evaluation/FaceAnalyzer';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import LandingPage from '@/pages/LandingPage';

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
    ],
  },
]);

export default router;
