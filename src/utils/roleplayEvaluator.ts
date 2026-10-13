import { getWordTranslation } from './wordTranslations';

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
  const lower = clean.toLowerCase();

  // 1. Check required words
  const missingRequiredWords: string[] = [];
  for (const rw of requiredWords) {
    const rwLower = rw.toLowerCase().trim();
    if (!lower.includes(rwLower)) {
      missingRequiredWords.push(rw);
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
  const naturalSuggestionPt = naturalSuggestion ? translateStudentSentence(naturalSuggestion) : undefined;
  const userSentencePt = translateStudentSentence(clean);

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
    naturalSuggestionPt,
    userSentencePt,
    summaryFeedback,
  };
}
