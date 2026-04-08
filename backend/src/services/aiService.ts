// Serviço de IA via Groq (Llama 3.3 70B) — free tier generoso, API OpenAI-compatible.
// Chave gratuita em: https://console.groq.com
import type { QuizQuestion } from '../types/index.js';
import { HttpError } from '../middleware/errorHandler.js';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chat(messages: ChatMessage[], maxTokens = 1500): Promise<string> {
  if (!apiKey) {
    throw new HttpError(500, 'GROQ_API_KEY não configurada no backend.');
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new HttpError(502, `Falha na API Groq (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new HttpError(502, 'Resposta da IA vazia.');
  return content;
}

// Extrai o primeiro bloco JSON válido do texto
function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('Resposta da IA sem JSON identificável.');
  return JSON.parse(match[0]) as T;
}

export async function generateQuiz(
  theme: string,
  durationMinutes: number
): Promise<QuizQuestion[]> {
  const systemPrompt = `Você é um tutor acadêmico brasileiro. Gere quizzes em português (pt-BR).
Retorne APENAS um JSON válido, sem markdown, no formato EXATO:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "texto da pergunta",
      "options": ["alternativa A", "alternativa B", "alternativa C", "alternativa D"],
      "correctAnswer": "A"
    },
    {
      "id": "q2",
      "type": "open_ended",
      "question": "texto da pergunta dissertativa",
      "correctAnswer": "resposta esperada resumida em uma frase"
    }
  ]
}
Regras:
- Gere entre 3 e 5 perguntas
- Misture múltipla escolha (com 4 alternativas) e dissertativas curtas
- Para multiple_choice, correctAnswer deve ser a letra (A, B, C ou D)
- Nível médio de dificuldade`;

  const userPrompt = `O aluno estudou "${theme}" por ${durationMinutes} minutos. Gere o quiz seguindo o formato.`;

  const raw = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  const parsed = extractJson<{ questions: QuizQuestion[] }>(raw);
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new HttpError(502, 'Formato de quiz inválido retornado pela IA.');
  }
  return parsed.questions;
}

export async function evaluateAnswers(
  theme: string,
  questions: QuizQuestion[],
  userAnswers: Record<string, string>
): Promise<{ score: number; gapAnalysis: string }> {
  const systemPrompt = `Você é um avaliador acadêmico brasileiro, rigoroso porém justo. Responda em português (pt-BR).
Retorne APENAS um JSON válido, sem markdown, no formato EXATO:
{
  "score": 7.5,
  "gapAnalysis": "Texto explicando o que o aluno acertou, o que errou e o que precisa revisar. Seja específico e construtivo, de 3 a 5 frases."
}
O score é de 0 a 10, podendo ter uma casa decimal.`;

  const payload = {
    theme,
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: userAnswers[q.id] ?? '',
    })),
  };

  const userPrompt = `Avalie as respostas do aluno sobre "${theme}". Dados:\n${JSON.stringify(payload, null, 2)}`;

  const raw = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  const parsed = extractJson<{ score: number; gapAnalysis: string }>(raw);
  const score = Math.max(0, Math.min(10, Number(parsed.score)));
  return { score, gapAnalysis: parsed.gapAnalysis ?? '' };
}
