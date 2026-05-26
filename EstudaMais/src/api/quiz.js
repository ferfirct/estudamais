import { request } from './client.js';

export function generateQuiz({ sessionId, theme, durationMinutes, previousScores }) {
  return request('/api/quiz/generate', {
    method: 'POST',
    body: { sessionId, theme, durationMinutes, previousScores },
  });
}

export function evaluateQuiz({ sessionId, questions, userAnswers }) {
  return request('/api/quiz/evaluate', {
    method: 'POST',
    body: { sessionId, questions, userAnswers },
  });
}

export function explainQuestion({ theme, question, userAnswer, quizType }) {
  return request('/api/quiz/explain-question', {
    method: 'POST',
    body: { theme, question, userAnswer, quizType },
  });
}

export function askDoubt({ theme, question, correctAnswer, userAnswer, explanation, doubt, history }) {
  return request('/api/quiz/doubt', {
    method: 'POST',
    body: { theme, question, correctAnswer, userAnswer, explanation, doubt, history },
  });
}

export function saveWrongQuestion({ sessionId, theme, question, userAnswer, quizType, difficulty }) {
  return request('/api/quiz/wrong-questions', {
    method: 'POST',
    body: { sessionId, theme, question, userAnswer, quizType, difficulty },
  });
}

export function listWrongQuestions() {
  return request('/api/quiz/wrong-questions');
}

export function markRetried(id) {
  return request(`/api/quiz/wrong-questions/${id}/retried`, { method: 'PATCH' });
}

export function deleteWrongQuestion(id) {
  return request(`/api/quiz/wrong-questions/${id}`, { method: 'DELETE' });
}

export function getPracticedThemes() {
  return request('/api/quiz/practiced-themes');
}

export function startPractice({
  theme, questionCount, questionDistribution,
  difficulty, learningMode, quizType, wrongQuestionIds,
}) {
  return request('/api/quiz/practice', {
    method: 'POST',
    body: {
      theme, questionCount, questionDistribution,
      difficulty, learningMode, quizType, wrongQuestionIds,
    },
  });
}
