import type { QuizQuestion } from './quiz.types.js';
import { HttpError } from '../../shared/middleware/errorHandler.js';
import { callGroq } from '../../shared/infra/groq-client.js';

export interface GenerateOptions {
  questionCount?: number;
  questionDistribution?: { multipleChoice: number; summation: number; discursive: number };
  difficulty?: 'easy' | 'medium' | 'hard';
  learningMode?: boolean;
  quizType?: 'free' | 'civil_service' | 'vestibular';
  quizSubtype?: string;
}

export interface IAiService {
  generateQuiz(theme: string, durationMinutes: number, previousScores?: number[], options?: GenerateOptions): Promise<QuizQuestion[]>;
  evaluateAnswers(
    theme: string,
    questions: QuizQuestion[],
    userAnswers: Record<string, string>,
  ): Promise<{ score: number; gapAnalysis: string }>;
  explainQuestion(
    theme: string,
    question: QuizQuestion,
    userAnswer: string,
    quizType: string,
  ): Promise<{ explanation: string }>;
  answerDoubt(params: {
    theme: string;
    question: QuizQuestion;
    correctAnswer?: string;
    userAnswer: string;
    explanation: string;
    doubt: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ answer: string }>;
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

function buildRolePart(quizType?: string, quizSubtype?: string): string {
  if (quizType === 'civil_service') {
    if (quizSubtype) {
      return `Você é um especialista em concursos públicos brasileiros. Gere questões NO ESTILO E FORMATO EXATO da banca/concurso: ${quizSubtype}. Inspire-se em questões reais desta banca e indique no campo hint a referência (ex: 'Inspirado em ${quizSubtype} 2023').`;
    }
    return "Você é um especialista em concursos públicos brasileiros. Gere questões no estilo das bancas CESPE/CEBRASPE, FCC, FGV e VUNESP sobre o tema. Inspire-se em questões reais e indique no campo hint a banca de inspiração (ex: 'Inspirado em CESPE 2022').";
  }
  if (quizType === 'vestibular') {
    if (quizSubtype) {
      return `Você é um especialista em vestibulares brasileiros. Gere questões NO ESTILO E FORMATO EXATO de: ${quizSubtype}. Inspire-se em questões reais desta prova e indique no campo hint a referência (ex: 'Inspirado em ${quizSubtype} 2023').`;
    }
    return "Você é um especialista em vestibulares brasileiros (ENEM, FUVEST, UNICAMP, UNESP). Gere questões no estilo dessas provas sobre o tema. Inspire-se em questões reais e indique no campo hint a prova de inspiração (ex: 'Inspirado em ENEM 2023').";
  }
  return 'Você é um tutor acadêmico brasileiro.';
}

function buildDifficultyPart(difficulty?: string, previousScores?: number[]): string {
  if (difficulty === 'easy') return 'Nível fácil: foque em conceitos básicos, definições e reconhecimento direto.';
  if (difficulty === 'hard') return 'Nível difícil: exija análise crítica, interpretação e resolução de casos complexos.';
  if (difficulty === 'medium') return 'Nível médio: exija aplicação e compreensão dos conceitos.';
  if (previousScores?.length) {
    return `Histórico de scores neste tema: ${previousScores.join(', ')}. Nível de dificuldade: ${determineDifficulty(previousScores)}.`;
  }
  return 'Nível médio: exija aplicação e compreensão dos conceitos.';
}

function buildDistributionPart(
  questionCount: number,
  dist?: { multipleChoice: number; summation: number; discursive: number },
): string {
  const mc = dist?.multipleChoice ?? questionCount;
  const sum = dist?.summation ?? 0;
  const disc = dist?.discursive ?? 0;
  const total = dist ? mc + sum + disc : questionCount;
  return `Gere exatamente ${total} questões distribuídas da seguinte forma:
- ${mc} questões de múltipla escolha (4 alternativas A/B/C/D, type: 'multiple_choice')
- ${sum} questões de somatória (type: 'summation') — cada item tem value (1,2,4,8...) e statement; correctAnswer é a soma dos values verdadeiros como string
- ${disc} questões discursivas (type: 'open_ended')`;
}

function requiresCalculation(theme: string): boolean {
  const exactKeywords = ['física', 'fisica', 'math', 'matemática', 'matematica',
    'química', 'quimica', 'cálculo', 'calculo', 'trigonometria', 'geometria',
    'álgebra', 'algebra', 'estatística', 'estatistica', 'ondas', 'ondulatória',
    'ondulatoria', 'mecânica', 'mecanica', 'termodinâmica', 'termodinamica',
    'eletromagnetismo', 'óptica', 'optica', 'cinemática', 'cinematica'];
  const lower = theme.toLowerCase();
  return exactKeywords.some(k => lower.includes(k));
}

const JSON_FORMAT_PART = `Retorne APENAS um JSON válido sem markdown no formato:
{
  "questions": [
    { "id":"q1","type":"multiple_choice","question":"...","options":["A...","B...","C...","D..."],"correctAnswer":"A","hint":"opcional","learningHint":"opcional" },
    { "id":"q2","type":"summation","question":"...","summationItems":[{"value":1,"statement":"..."},{"value":2,"statement":"..."},{"value":4,"statement":"..."},{"value":8,"statement":"..."}],"correctAnswer":"06","hint":"opcional","learningHint":"opcional" },
    { "id":"q3","type":"open_ended","question":"...","correctAnswer":"resposta esperada resumida","hint":"opcional","learningHint":"opcional" }
  ]
}`;

export class GroqAiService implements IAiService {
  private readonly model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

  private async chat(messages: ChatMessage[], maxTokens = 1500): Promise<string> {
    return callGroq({
      model: this.model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });
  }

  async generateQuiz(
    theme: string,
    durationMinutes: number,
    previousScores?: number[],
    options: GenerateOptions = {},
  ): Promise<QuizQuestion[]> {
    const { questionCount = 5, questionDistribution, difficulty, learningMode, quizType, quizSubtype } = options;
    const dist = questionDistribution;
    const totalQ = questionCount;
    const mcCount = dist?.multipleChoice ?? totalQ;
    const sumCount = dist?.summation ?? 0;
    const discCount = dist?.discursive ?? 0;

    const criticalInstruction = `INSTRUÇÃO CRÍTICA — SIGA EXATAMENTE:
Você DEVE gerar EXATAMENTE ${totalQ} questões. Nem mais, nem menos.
Distribuição OBRIGATÓRIA:
- EXATAMENTE ${mcCount} questão(ões) do tipo multiple_choice
- EXATAMENTE ${sumCount} questão(ões) do tipo summation
- EXATAMENTE ${discCount} questão(ões) do tipo open_ended
Qualquer resposta com número diferente de ${totalQ} questões será REJEITADA.`;

    const reminder = `LEMBRE-SE: a resposta deve conter EXATAMENTE ${totalQ} questões no array.
Conte antes de responder: ${mcCount} multiple_choice + ${sumCount} summation + ${discCount} open_ended = ${totalQ}.`;

    const parts: string[] = [
      criticalInstruction,
      buildRolePart(quizType, quizSubtype),
      buildDifficultyPart(difficulty, previousScores),
      buildDistributionPart(questionCount, questionDistribution),
    ];

    if (requiresCalculation(theme)) {
      parts.push(`ATENÇÃO: O tema envolve ciências exatas. As questões DEVEM incluir:
- Dados numéricos concretos (valores, unidades de medida)
- Aplicação de fórmulas quando pertinente
- Cálculos que o aluno precisa realizar
- Para vestibular/concurso: inspire-se em questões reais com números reais
NÃO gere questões puramente teóricas/conceituais para este tema.`);
    }

    if (learningMode) {
      parts.push('Para cada questão inclua o campo learningHint com 2-3 frases de contexto teórico que ajudam a raciocinar sem revelar a resposta.');
    }

    parts.push(reminder);
    parts.push(JSON_FORMAT_PART);

    const systemPrompt = parts.join('\n\n');
    const userPrompt = `O aluno estudou '${theme}' por ${durationMinutes} minutos. Gere o quiz seguindo o formato.`;

    const raw = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = extractJson<{ questions: QuizQuestion[] }>(raw);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new HttpError(502, 'Formato de quiz inválido retornado pela IA.');
    }

    if (parsed.questions.length < totalQ) {
      const got = {
        mc: parsed.questions.filter(q => q.type === 'multiple_choice').length,
        sum: parsed.questions.filter(q => q.type === 'summation').length,
        disc: parsed.questions.filter(q => q.type === 'open_ended').length,
      };
      const needed = {
        mc: mcCount - got.mc,
        sum: sumCount - got.sum,
        disc: discCount - got.disc,
      };

      if (needed.mc > 0 || needed.sum > 0 || needed.disc > 0) {
        const retryPrompt = `Você deve gerar APENAS as questões faltantes, no mesmo formato JSON.
Gere EXATAMENTE:
- ${needed.mc} questão(ões) multiple_choice (IDs: q${got.mc + got.sum + got.disc + 1} em diante)
- ${needed.sum} questão(ões) summation
- ${needed.disc} questão(ões) open_ended
Tema: "${theme}". Retorne { "questions": [...] }`;

        try {
          const retryRaw = await this.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: retryPrompt },
          ]);
          const retryParsed = extractJson<{ questions: QuizQuestion[] }>(retryRaw);
          if (retryParsed.questions && Array.isArray(retryParsed.questions)) {
            parsed.questions = [...parsed.questions, ...retryParsed.questions];
          }
        } catch {
          console.warn('[generateQuiz] retry falhou, retornando questões parciais');
        }
      }
    }

    const sorted = [
      ...parsed.questions.filter(q => q.type === 'multiple_choice').slice(0, mcCount),
      ...parsed.questions.filter(q => q.type === 'summation').slice(0, sumCount),
      ...parsed.questions.filter(q => q.type === 'open_ended').slice(0, discCount),
    ];

    return sorted.slice(0, totalQ);
  }

  async evaluateAnswers(
    theme: string,
    questions: QuizQuestion[],
    userAnswers: Record<string, string>,
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
        summationItems: q.summationItems,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswers[q.id] ?? '',
      })),
    };

    const userPrompt = `Avalie as respostas do aluno sobre "${theme}". Dados:\n${JSON.stringify(payload, null, 2)}`;
    const raw = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = extractJson<{ score: number; gapAnalysis: string }>(raw);
    if (typeof parsed.score !== 'number' || typeof parsed.gapAnalysis !== 'string') {
      throw new HttpError(502, 'Formato de avaliação inválido retornado pela IA.');
    }
    return {
      score: Math.max(0, Math.min(10, Number(parsed.score))),
      gapAnalysis: parsed.gapAnalysis,
    };
  }

  async explainQuestion(
    theme: string,
    question: QuizQuestion,
    userAnswer: string,
    quizType: string,
  ): Promise<{ explanation: string }> {
    const systemPrompt = `Você é um professor que acabou de aplicar uma questão. Explique em português (pt-BR) de forma clara e didática:
1. Qual é a resposta correta e por que está correta.
2. Por que cada alternativa incorreta está errada (para multiple_choice e summation, analise cada item).
3. O que o aluno deve revisar se errou.
Seja direto e construtivo. Retorne APENAS um JSON: { "explanation": "texto" }`;

    const questionData: Record<string, unknown> = {
      theme,
      quizType,
      type: question.type,
      question: question.question,
      correctAnswer: question.correctAnswer,
      userAnswer,
    };
    if (question.options) questionData['options'] = question.options;
    if (question.summationItems) questionData['summationItems'] = question.summationItems;

    const userPrompt = `Questão:\n${JSON.stringify(questionData, null, 2)}`;
    const raw = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = extractJson<{ explanation: string }>(raw);
    if (typeof parsed.explanation !== 'string') {
      throw new HttpError(502, 'Formato de explicação inválido retornado pela IA.');
    }
    return { explanation: parsed.explanation };
  }

  async answerDoubt(params: {
    theme: string;
    question: QuizQuestion;
    correctAnswer?: string;
    userAnswer: string;
    explanation: string;
    doubt: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ answer: string }> {
    const { theme, question, correctAnswer, userAnswer, explanation, doubt, history } = params;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Você é um professor paciente e didático.
O aluno respondeu uma questão sobre "${theme}" e recebeu uma explicação.
Agora ele tem dúvidas específicas sobre esta questão.

CONTEXTO DA QUESTÃO:
Tipo: ${question.type}
Enunciado: ${question.question}
${question.options ? 'Alternativas: ' + question.options.map((o, i) => String.fromCharCode(65 + i) + ') ' + o).join(' | ') : ''}
${question.summationItems ? 'Itens: ' + question.summationItems.map(i => i.value + ': ' + i.statement).join(' | ') : ''}
Resposta correta: ${correctAnswer ?? 'não informada'}
Resposta do aluno: ${userAnswer}
Explicação já fornecida: ${explanation}

INSTRUÇÕES:
- Responda APENAS a dúvida atual do aluno
- Não repita a explicação já dada a menos que o aluno peça explicitamente
- Se o aluno pedir mais detalhes sobre algo específico, aprofunde naquele ponto
- Use exemplos concretos e linguagem acessível
- Responda em português (pt-BR)
- Retorne APENAS um JSON: { "answer": "sua resposta aqui" }`,
      },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: doubt,
      },
    ];

    const raw = await this.chat(messages, 800);
    const parsed = extractJson<{ answer: string }>(raw);
    if (typeof parsed.answer !== 'string') {
      throw new HttpError(502, 'Formato de resposta inválido retornado pela IA.');
    }
    return { answer: parsed.answer };
  }
}
