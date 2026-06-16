import { HttpError } from '../middleware/errorHandler.js';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

function loadKeys(): string[] {
  const multi = process.env.GROQ_API_KEYS;
  if (multi) return multi.split(',').map(k => k.trim()).filter(Boolean);
  const single = process.env.GROQ_API_KEY;
  if (single) return [single.trim()];
  return [];
}

const keys = loadKeys();
let currentIndex = 0;

function maskKey(key: string): string {
  return `...${key.slice(-4)}`;
}

export interface GroqChatParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: string };
}

export async function callGroq(params: GroqChatParams): Promise<string> {
  if (keys.length === 0) throw new HttpError(500, 'Nenhuma GROQ_API_KEY configurada no backend.');

  let tried = 0;
  while (tried < keys.length) {
    const key = keys[currentIndex];
    console.log(`[groq] usando chave ${maskKey(key)}`);

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new HttpError(502, 'Resposta da IA vazia.');
      return content;
    }

    if (response.status === 429) {
      console.warn(`[groq] chave ${maskKey(key)} com quota esgotada, tentando próxima...`);
      currentIndex = (currentIndex + 1) % keys.length;
      tried++;
      continue;
    }

    const text = await response.text();
    throw new HttpError(502, `Falha na API Groq (${response.status}): ${text}`);
  }

  throw new HttpError(502, 'Todas as chaves Groq estão com quota esgotada.');
}
