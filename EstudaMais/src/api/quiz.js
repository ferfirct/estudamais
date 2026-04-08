import { request } from './client.js';

export function generateQuiz({ sessionId, theme, durationMinutes }) {
  return request('/api/quiz/generate', {
    method: 'POST',
    body: { sessionId, theme, durationMinutes },
  });
}

export function evaluateQuiz({ sessionId, questions, userAnswers }) {
  return request('/api/quiz/evaluate', {
    method: 'POST',
    body: { sessionId, questions, userAnswers },
  });
}
