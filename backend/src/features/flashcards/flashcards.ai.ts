import { callGroq } from '../../shared/infra/groq-client.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';

export async function generateFlashcards(
  theme: string,
  count: number,
  difficulty: 'easy' | 'medium' | 'hard',
): Promise<Array<{ front: string; back: string }>> {
  const diffLabel = difficulty === 'easy'
    ? 'fácil (definições básicas e conceitos fundamentais)'
    : difficulty === 'hard'
    ? 'difícil (análise crítica, casos complexos, relações entre conceitos)'
    : 'médio (aplicação e compreensão dos conceitos)';

  const prompt = `Gere exatamente ${count} flashcards sobre "${theme}" em português (pt-BR).
Dificuldade: ${diffLabel}.
Frente (front): conceito ou pergunta concisa.
Verso (back): definição ou resposta direta, clara e objetiva.
Retorne APENAS um JSON válido: { "flashcards": [{ "front": "...", "back": "..." }] }`;

  const raw = await callGroq({
    model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new HttpError(502, 'Resposta da IA sem JSON identificável.');
  const parsed = JSON.parse(match[0]) as { flashcards?: Array<{ front: string; back: string }> };
  if (!Array.isArray(parsed.flashcards)) throw new HttpError(502, 'Formato de flashcards inválido.');
  return parsed.flashcards.slice(0, count);
}
