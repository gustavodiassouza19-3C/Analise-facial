import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import FaceAnalyzer from '@/components/evaluation/FaceAnalyzer';
import LandingPage from '@/pages/LandingPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/signup',
    element: <Navigate to="/dashboard" replace />,
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
