import { getWordTranslation } from './wordTranslations';
import { normalizeSentence } from './speechRecognition';

export interface GrammarCorrection {
  mistake: string;
  fix: string;
  tip: string;
}

export interface RoleplayEvaluation {
  isCorrect: boolean;
  missingRequiredWords: string[];
  corrections: GrammarCorrection[];
  naturalSuggestion?: string;
  naturalSuggestionPt?: string;
  userSentencePt?: string;
  summaryFeedback: string;
}

/**
 * Common grammar blunder patterns frequently made by Brazilian Portuguese speakers.
 */
interface PatternRule {
  pattern: RegExp;
  extractMistake: (match: RegExpMatchArray) => string;
  replacement: (match: RegExpMatchArray) => string;
  tip: string;
}

const COMMON_PATTERNS: PatternRule[] = [
  // 1. Double past/infinitive verb: went go, went do, went buy, etc.
  {
    pattern: /\bwent\s+go\b/i,
    extractMistake: () => 'went go',
    replacement: () => 'went',
    tip: '"went" já é o passado de "go". Use apenas "went" (ex: "I went to...", não "went go").',
  },
  {
    pattern: /\bwent\s+(buy|cook|eat|play|watch|study|visit|sleep|run|work|clean)\b/i,
    extractMistake: (m) => `went ${m[1]}`,
    replacement: (m) => m[1] === 'cook' ? 'cooked' : m[1] === 'buy' ? 'bought' : m[1] === 'eat' ? 'ate' : `went to ${m[1]}`,
    tip: 'Ao invés de "went [verbo]", use o verbo direto no passado ou "went to [verbo]" (fui para...).',
  },
  // 2. Auxiliary + past verb: did went, didn't went, did saw, etc.
  {
    pattern: /\b(did|didn't|did\s+not)\s+went\b/i,
    extractMistake: (m) => `${m[1]} went`,
    replacement: (m) => `${m[1]} go`,
    tip: 'Depois de "did" ou "didn\'t", o verbo volta para a forma base: use "go", não "went".',
  },
  {
    pattern: /\b(did|didn't|did\s+not)\s+(saw|ate|had|bought|liked|played)\b/i,
    extractMistake: (m) => `${m[1]} ${m[2]}`,
    replacement: (m) => {
      const baseMap: Record<string, string> = { saw: 'see', ate: 'eat', had: 'have', bought: 'buy', liked: 'like', played: 'play' };
      return `${m[1]} ${baseMap[m[2].toLowerCase()] || m[2]}`;
    },
    tip: 'Depois de "did / didn\'t", use o verbo no infinitivo sem "to" (ex: "didn\'t see", não "didn\'t saw").',
  },
  // 3. Missing article "the" for common everyday locations: to gym, to beach, to supermarket
  {
    pattern: /\b(to|in|at)\s+gym\b/i,
    extractMistake: (m) => `${m[1]} gym`,
    replacement: (m) => `${m[1]} the gym`,
    tip: 'Em inglês, lugares do dia a dia pedem o artigo "the": use "to the gym", e não apenas "to gym".',
  },
  {
    pattern: /\b(to|in|at)\s+beach\b/i,
    extractMistake: (m) => `${m[1]} beach`,
    replacement: (m) => `${m[1]} the beach`,
    tip: 'Diga "to the beach" (com o artigo "the"), e não apenas "to beach".',
  },
  {
    pattern: /\b(to|in|at)\s+supermarket\b/i,
    extractMistake: (m) => `${m[1]} supermarket`,
    replacement: (m) => `${m[1]} the supermarket`,
    tip: 'Diga "to the supermarket" com o artigo "the".',
  },
  {
    pattern: /\b(to|in|at)\s+cinema\b/i,
    extractMistake: (m) => `${m[1]} cinema`,
    replacement: (m) => `${m[1]} the cinema`,
    tip: 'Diga "to the cinema" (ou "to the movies").',
  },
  {
    pattern: /\b(to|in|at)\s+park\b/i,
    extractMistake: (m) => `${m[1]} park`,
    replacement: (m) => `${m[1]} the park`,
    tip: 'Diga "to the park" com o artigo "the".',
  },
  // 4. "went to home" -> went home (home does not take "to")
  {
    pattern: /\b(went|go|going)\s+to\s+home\b/i,
    extractMistake: (m) => `${m[1]} to home`,
    replacement: (m) => `${m[1]} home`,
    tip: 'Com "home", não se usa a preposição "to": diga apenas "went home" ou "go home".',
  },
  // 5. Bare participle / gerund as main clause verb: "I cooking", "I eating", "I sleeping", etc.
  {
    pattern: /\b(I|we|they|he|she|you)\s+cooking\b/i,
    extractMistake: (m) => `${m[1]} cooking`,
    replacement: (m) => `${m[1]} cooked`,
    tip: 'Cuidado com o gerúndio solto ("I cooking"): use "I cooked" (passado) ou "I cook" (hábito) ou "I was cooking".',
  },
  {
    pattern: /\b(I|we|they|he|she|you)\s+(eating|watching|studying|playing|working|sleeping|cleaning)\b/i,
    extractMistake: (m) => `${m[1]} ${m[2]}`,
    replacement: (m) => {
      const pastMap: Record<string, string> = {
        eating: 'ate', watching: 'watched', studying: 'studied',
        playing: 'played', working: 'worked', sleeping: 'slept', cleaning: 'cleaned',
      };
      return `${m[1]} ${pastMap[m[2].toLowerCase()] || m[2]}`;
    },
    tip: 'Em vez de usar "-ing" isolado, use o verbo no passado (ex: "watched") ou presente ("watch").',
  },
  // 6. Preposition collocations
  {
    pattern: /\bafraid\s+with\b/i,
    extractMistake: () => 'afraid with',
    replacement: () => 'afraid of',
    tip: 'Dizemos "afraid of" (com medo de), e nunca "afraid with".',
  },
  {
    pattern: /\bdepend\s+of\b/i,
    extractMistake: () => 'depend of',
    replacement: () => 'depend on',
    tip: 'Em inglês, usa-se "depend on", e nunca "depend of".',
  },
  {
    pattern: /\bstruggle\s+(in|at)\b/i,
    extractMistake: (m) => `struggle ${m[1]}`,
    replacement: () => 'struggle with',
    tip: 'A regência correta é "struggle with" (ter dificuldade com algo).',
  },
  {
    pattern: /\blisten\s+(music|radio|songs|podcast)\b/i,
    extractMistake: (m) => `listen ${m[1]}`,
    replacement: (m) => `listen to ${m[1]}`,
    tip: 'O verbo "listen" sempre pede "to": "listen to music", "listen to podcast".',
  },
  {
    pattern: /\bmarried\s+with\b/i,
    extractMistake: () => 'married with',
    replacement: () => 'married to',
    tip: 'Dizemos "married to" (casado com alguém), e não "married with".',
  },
  {
    pattern: /\bgood\s+in\s+(math|english|sports|cooking)\b/i,
    extractMistake: (m) => `good in ${m[1]}`,
    replacement: (m) => `good at ${m[1]}`,
    tip: 'Para habilidades, use "good at" (bom em): "good at English", "good at math".',
  },
];

/**
 * Translates a student's answer into natural Brazilian Portuguese.
 */
export function translateStudentSentence(text: string): string {
  const clean = text.trim();
  if (!clean) return '';

  const lower = clean.toLowerCase().replace(/[.,!?;:]/g, '');

  // Exact / common whole-phrase matches
  const phraseMap: Record<string, string> = {
    'i went to the gym and i cooked': 'Eu fui para a academia e cozinhei.',
    'i went to the gym and i cooked dinner': 'Eu fui para a academia e cozinhei o jantar.',
    'i went go to gym and i cooking': 'Eu fui ir para academia e eu cozinhando.',
    'i went to the gym': 'Eu fui para a academia.',
    'i went to gym': 'Eu fui para a academia.',
    'i went home': 'Eu fui para casa.',
    'i went to work': 'Eu fui para o trabalho.',
    'i went shopping': 'Eu fui fazer compras.',
    'i struggle with english': 'Eu tenho dificuldade com inglês.',
    'i struggle with english speaking': 'Eu tenho dificuldade com a fala em inglês.',
    'i have fear of public speaking': 'Eu tenho medo de falar em público.',
    'i have fear of making mistakes': 'Eu tenho medo de cometer erros.',
    'on my days off i like to relax': 'Nos meus dias de folga eu gosto de relaxar.',
    'i like to relax and spend time with family': 'Eu gosto de relaxar e passar tempo com a família.',
    'i like to stay home': 'Eu gosto de ficar em casa.',
    'i usually relax at home': 'Eu geralmente relaxo em casa.',
  };

  if (phraseMap[lower]) {
    return phraseMap[lower];
  }

  // Token-by-token translation with grammatical connectors
  const words = clean.split(/\s+/);
  const translatedWords = words.map((w) => {
    const raw = w.replace(/[^a-zA-Z']/g, '');
    const trans = getWordTranslation(raw);
    if (trans) {
      // Pick first meaning
      return trans.split('/')[0].split('(')[0].trim();
    }
    return raw;
  });

  return translatedWords.join(' ');
}

/**
 * Evaluates an open-ended roleplay answer:
 * 1. Verifies mandatory required words.
 * 2. Checks for Brazilian Portuguese interference mistakes (double verbs, missing articles, bare gerunds).
 * 3. Builds a natural corrected model sentence and translation.
 */
export function evaluateRoleplayAnswer(
  userAnswer: string,
  requiredWords: string[] = []
): RoleplayEvaluation {
  const clean = userAnswer.trim();
  const normUser = normalizeSentence(clean);

  // 1. Check required words with robust normalization & multi-token tolerance
  const missingRequiredWords: string[] = [];
  for (const rw of requiredWords) {
    if (!rw) continue;
    // Strip external quotes, markdown, and trailing punctuation
    const cleanRw = rw
      .replace(/^["'`“”«»]+|["'`“”«»]+$/g, '')
      .replace(/[.,;!?]+$/, '')
      .trim();
    if (!cleanRw) continue;

    const normRw = normalizeSentence(cleanRw);
    if (!normUser.includes(normRw)) {
      // Check multi-word tokens (e.g. "cold plunge" -> checks presence of "cold" and "plunge")
      const tokens = normRw.split(' ').filter(Boolean);
      const hasAllTokens = tokens.length > 0 && tokens.every((t) => normUser.includes(t));
      if (!hasAllTokens) {
        missingRequiredWords.push(cleanRw);
      }
    }
  }

  // 2. Check grammar blunders
  const corrections: GrammarCorrection[] = [];
  let suggested = clean;

  for (const rule of COMMON_PATTERNS) {
    const match = suggested.match(rule.pattern);
    if (match) {
      const mistake = rule.extractMistake(match);
      const fix = rule.replacement(match);
      corrections.push({
        mistake,
        fix,
        tip: rule.tip,
      });
      suggested = suggested.replace(rule.pattern, fix);
    }
  }

  // Ensure suggestion ends with a period and starts capitalized
  if (suggested && !/[.!?]$/.test(suggested)) {
    suggested += '.';
  }
  if (suggested.length > 0) {
    suggested = suggested.charAt(0).toUpperCase() + suggested.slice(1);
  }

  const hasMistakes = corrections.length > 0;
  const missingWords = missingRequiredWords.length > 0;
  const isCorrect = !missingWords && (!hasMistakes || clean.length >= 25);

  const naturalSuggestion = hasMistakes ? suggested : undefined;

  let summaryFeedback = 'Excelente resposta conversacional!';
  if (missingWords) {
    summaryFeedback = `Atenção: faltou usar a palavra obrigatória: "${missingRequiredWords.join('", "')}".`;
  } else if (hasMistakes) {
    summaryFeedback = 'Boa tentativa! Veja os ajustes gramaticais para soar 100% natural:';
  }

  return {
    isCorrect,
    missingRequiredWords,
    corrections,
    naturalSuggestion,
    summaryFeedback,
  };
}

/**
 * Common Brazilian Portuguese question-formation mistakes (missing auxiliary inversion, etc.)
 */
const QUESTION_PATTERNS: PatternRule[] = [
  {
    pattern: /^(why|where|when|what|how)\s+(you|they|we)\s+(are|were)\b/i,
    extractMistake: (m) => `${m[1]} ${m[2]} ${m[3]}`,
    replacement: (m) => `${m[1]} ${m[3]} ${m[2]}`,
    tip: 'Em perguntas em inglês, inverta o verbo "to be" antes do sujeito (ex: "Why are you...?", "Where were you...?").',
  },
  {
    pattern: /^(why|where|when|what|how)\s+(he|she|it)\s+(is|was)\b/i,
    extractMistake: (m) => `${m[1]} ${m[2]} ${m[3]}`,
    replacement: (m) => `${m[1]} ${m[3]} ${m[2]}`,
    tip: 'Em perguntas, coloque "is / was" antes do sujeito (ex: "Where is he...?", "Why was she...?").',
  },
  {
    pattern: /^(why|where|when|what|how)\s+you\s+(went|saw|ate|bought|did|made|said|left|took)\b/i,
    extractMistake: (m) => `${m[1]} you ${m[2]}`,
    replacement: (m) => {
      const baseMap: Record<string, string> = {
        went: 'go', saw: 'see', ate: 'eat', bought: 'buy', did: 'do',
        made: 'make', said: 'say', left: 'leave', took: 'take',
      };
      return `${m[1]} did you ${baseMap[m[2].toLowerCase()] || m[2]}`;
    },
    tip: 'Para perguntar no passado, use o auxiliar "did" + verbo na forma base (ex: "Where did you go?", e não "Where you went?").',
  },
  {
    pattern: /^you\s+(like|want|need|know|have|work|live|prefer|use)\b/i,
    extractMistake: (m) => `You ${m[1]}`,
    replacement: (m) => `Do you ${m[1].toLowerCase()}`,
    tip: 'Para fazer perguntas no presente, comece com o auxiliar "Do you..." (ex: "Do you like...?", e não apenas "You like...?").',
  },
  {
    pattern: /^you\s+(went|saw|liked|finished|talked|called|worked|bought)\b/i,
    extractMistake: (m) => `You ${m[1]}`,
    replacement: (m) => {
      const baseMap: Record<string, string> = {
        went: 'go', saw: 'see', liked: 'like', finished: 'finish',
        talked: 'talk', called: 'call', worked: 'work', bought: 'buy',
      };
      return `Did you ${baseMap[m[1].toLowerCase()] || m[1].toLowerCase()}`;
    },
    tip: 'Para perguntas no passado, comece com "Did you..." + verbo na forma base (ex: "Did you go...?").',
  },
];

/**
 * Evaluates a user-created question for the "ask_question" (Reverse Q&A) exercise.
 */
export function evaluateQuestionFormulation(
  userQuestion: string,
  requiredWords: string[] = []
): RoleplayEvaluation {
  const baseEval = evaluateRoleplayAnswer(userQuestion, requiredWords);
  const clean = userQuestion.trim();
  const extraCorrections: GrammarCorrection[] = [...baseEval.corrections];
  let suggested = baseEval.naturalSuggestion ? baseEval.naturalSuggestion.replace(/[.!?]+$/, '') : clean.replace(/[.!?]+$/, '');

  for (const rule of QUESTION_PATTERNS) {
    const match = suggested.match(rule.pattern);
    if (match) {
      const mistake = rule.extractMistake(match);
      const fix = rule.replacement(match);
      extraCorrections.push({
        mistake,
        fix,
        tip: rule.tip,
      });
      suggested = suggested.replace(rule.pattern, fix);
    }
  }

  // Check if it looks like a question (starts with WH-word or auxiliary verb)
  const startsWithQuestionWord = /^(what|where|when|why|how|who|which|whose|do|does|did|are|is|was|were|can|could|would|will|should|have|has|had|don't|didn't|aren't|isn't)\b/i.test(clean);

  if (!startsWithQuestionWord && clean.split(/\s+/).length >= 2 && extraCorrections.length === 0) {
    extraCorrections.push({
      mistake: clean.split(/\s+/).slice(0, 2).join(' '),
      fix: `Do you / What / How...`,
      tip: 'Em inglês, perguntas precisam começar com um pronome interrogativo (What, Where, Why, How) ou verbo auxiliar (Do, Did, Are, Can, Would).',
    });
  }

  if (suggested.length > 0) {
    suggested = suggested.charAt(0).toUpperCase() + suggested.slice(1) + '?';
  }

  const hasMistakes = extraCorrections.length > 0;
  const missingWords = baseEval.missingRequiredWords.length > 0;
  const isCorrect = !missingWords && !hasMistakes && clean.split(/\s+/).length >= 3;

  let summaryFeedback = 'Excelente pergunta! Estrutura interrogativa perfeita!';
  if (missingWords) {
    summaryFeedback = `Quase lá! Faltou incluir a expressão obrigatória na sua pergunta: "${baseEval.missingRequiredWords.join('", "')}".`;
  } else if (hasMistakes) {
    summaryFeedback = 'Boa tentativa! Veja como ajustar a estrutura da pergunta em inglês:';
  }

  return {
    isCorrect,
    missingRequiredWords: baseEval.missingRequiredWords,
    corrections: extraCorrections,
    naturalSuggestion: hasMistakes ? suggested : undefined,
    summaryFeedback,
  };
}
