import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import CreateExam from './pages/CreateExam';
import TakeExam from './pages/TakeExam';
import Result from './pages/Result';
import './index.css';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/create', element: <CreateExam /> },
  { path: '/exam/:id', element: <TakeExam /> },
  { path: '/result/:attemptId', element: <Result /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
