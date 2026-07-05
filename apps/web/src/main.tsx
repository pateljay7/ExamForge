import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import CreateExam from './pages/CreateExam';
import TakeExam from './pages/TakeExam';
import Result from './pages/Result';
import './index.css';

function Protected({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/', element: <Protected><Home /></Protected> },
  { path: '/create', element: <Protected><CreateExam /></Protected> },
  { path: '/exam/:id', element: <Protected><TakeExam /></Protected> },
  { path: '/result/:attemptId', element: <Protected><Result /></Protected> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
