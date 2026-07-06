import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import CreateExam from './pages/CreateExam';
import EditExam from './pages/EditExam';
import TakeExam from './pages/TakeExam';
import Result from './pages/Result';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Roles from './pages/Roles';
import Users from './pages/Users';
import SharedEntry from './pages/SharedEntry';
import './index.css';

function Protected({
  children,
  permission,
}: {
  children: ReactNode;
  permission?: string;
}) {
  const { user, can } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (permission && !can(permission)) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/', element: <Protected><Home /></Protected> },
  {
    path: '/create',
    element: <Protected permission="exams:create"><CreateExam /></Protected>,
  },
  { path: '/exam/:id/edit', element: <Protected permission="exams:edit"><EditExam /></Protected> },
  { path: '/exam/:id', element: <Protected><TakeExam /></Protected> },
  { path: '/result/:attemptId', element: <Protected><Result /></Protected> },
  { path: '/profile', element: <Protected><Profile /></Protected> },
  { path: '/settings', element: <Protected><Settings /></Protected> },
  { path: '/roles', element: <Protected permission="roles:view"><Roles /></Protected> },
  { path: '/users', element: <Protected permission="users:view"><Users /></Protected> },
  { path: '/shared/:code', element: <Protected><SharedEntry /></Protected> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
