import type { QuizQuestion } from './quiz.types.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export interface IAiService {
  generateQuiz(theme: string, durationMinutes: number, previousScores?: number[]): Promise<QuizQuestion[]>;
  evaluateAnswers(
    theme: string,
    questions: QuizQuestion[],
    userAnswers: Record<string, string>
  ): Promise<{ score: number; gapAnalysis: string }>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function extractJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('Resposta da IA sem JSON identificável.');
  return JSON.parse(match[0]) as T;
}

function determineDifficulty(scores: number[]): string {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg < 5) return 'básico, foco em conceitos fundamentais';
  if (avg <= 7) return 'intermediário, misture conceitos e aplicações';
  return 'avançado, inclua casos-limite e pegadinhas conceituais';
}

export class GroqAiService implements IAiService {
  private readonly model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

  private async chat(messages: ChatMessage[], maxTokens = 1500): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new HttpError(500, 'GROQ_API_KEY não configurada no backend.');

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: this.model,
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

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new HttpError(502, 'Resposta da IA vazia.');
    return content;
  }

  async generateQuiz(theme: string, durationMinutes: number, previousScores?: number[]): Promise<QuizQuestion[]> {
    const difficultyInstruction = previousScores?.length
      ? `Histórico de scores neste tema: ${previousScores.join(', ')}. Nível de dificuldade: ${determineDifficulty(previousScores)}.`
      : 'Nível de dificuldade: intermediário (primeiro contato com o tema).';

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
- ${difficultyInstruction}`;

    const userPrompt = `O usuário processou "${theme}" por ${durationMinutes} minutos. Gere o quiz seguindo o formato.`;
    const raw = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = extractJson<{ questions: QuizQuestion[] }>(raw);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new HttpError(502, 'Formato de quiz inválido retornado pela IA.');
    }
    return parsed.questions;
  }

  async evaluateAnswers(
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
        id: q.id, type: q.type, question: q.question,
        options: q.options, correctAnswer: q.correctAnswer,
        userAnswer: userAnswers[q.id] ?? '',
      })),
    };

    const userPrompt = `Avalie as respostas do aluno sobre "${theme}". Dados:\n${JSON.stringify(payload, null, 2)}`;
    const raw = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = extractJson<{ score: number; gapAnalysis: string }>(raw);
    return {
      score: Math.max(0, Math.min(10, Number(parsed.score))),
      gapAnalysis: parsed.gapAnalysis ?? '',
    };
  }
}
