async function req(path: string, options?: RequestInit) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listExams: () => req('/exams'),
  createExam: (data: {
    title: string;
    content: string;
    numQuestions: number;
    difficulty: string;
  }) => req('/exams', { method: 'POST', body: JSON.stringify(data) }),
  getExam: (id: string) => req(`/exams/${id}`),
  listAttempts: (examId: string) => req(`/exams/${examId}/attempts`),
  submit: (examId: string, answers: { questionId: string; selectedIndex: number }[]) =>
    req(`/exams/${examId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  getResult: (attemptId: string) => req(`/attempts/${attemptId}`),
};
