const TOKEN_KEY = 'exam_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function req(path: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch('/api' + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    clearToken();
    localStorage.removeItem('exam_user');
    if (!location.pathname.startsWith('/login')) location.href = '/login';
    throw new Error('Session expired — please log in again.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  signup: (data: { email: string; password: string; name?: string }) =>
    req('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  listExams: () => req('/exams'),
  createExam: (data: {
    title: string;
    sections: { content: string; weight: number }[];
    numQuestions: number;
    difficulty: string;
    timeLimitMinutes?: number;
    timerEnabled?: boolean;
  }) => req('/exams', { method: 'POST', body: JSON.stringify(data) }),
  getExam: (id: string) => req(`/exams/${id}`),
  listAttempts: (examId: string) => req(`/exams/${examId}/attempts`),
  submit: (
    examId: string,
    answers: { questionId: string; selectedIndex: number }[],
    timeTakenSec: number,
  ) =>
    req(`/exams/${examId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeTakenSec }),
    }),
  getResult: (attemptId: string) => req(`/attempts/${attemptId}`),
};
