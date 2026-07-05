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
import Landing from './pages/Landing';
import Home from './pages/Home';
import CreateExam from './pages/CreateExam';
import EditExam from './pages/EditExam';
import TakeExam from './pages/TakeExam';
import Result from './pages/Result';
import Profile from './pages/Profile';
import SharedEntry from './pages/SharedEntry';
import './index.css';

function Protected({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    // Remember where the user was heading (e.g. a /shared/:code link).
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Layout>{children}</Layout>;
}

// Root: logged-in users get their dashboard, visitors see the marketing landing page.
function Root() {
  const { user } = useAuth();
  return user ? (
    <Layout>
      <Home />
    </Layout>
  ) : (
    <Landing />
  );
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/', element: <Root /> },
  { path: '/create', element: <Protected><CreateExam /></Protected> },
  { path: '/exam/:id/edit', element: <Protected><EditExam /></Protected> },
  { path: '/exam/:id', element: <Protected><TakeExam /></Protected> },
  { path: '/result/:attemptId', element: <Protected><Result /></Protected> },
  { path: '/profile', element: <Protected><Profile /></Protected> },
  { path: '/shared/:code', element: <Protected><SharedEntry /></Protected> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
