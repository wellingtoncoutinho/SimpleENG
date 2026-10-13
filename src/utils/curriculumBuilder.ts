import { CEFRLevel, Exercise, ExerciseType, LessonPayload } from '../types/lesson';
import { DayPlan, LessonBlock, ParsedVocabularyItem, WeeklyPlan } from '../types/weeklyPlan';

/**
 * Intelligent Pedagogical Generator.
 * Creates authentic Duolingo-style lessons and weekly plans from student class notes.
 * Robust, highly varied sentence engine preventing repetitive templates.
 */

// Contextual pool of distractors by category for word banks (avoids repeating 'meanwhile, furthermore')
const COMMON_DISTRACTOR_POOLS: string[][] = [
  ['to', 'for', 'with', 'about'],
  ['our', 'their', 'my', 'your'],
  ['always', 'usually', 'often', 'never'],
  ['have', 'make', 'take', 'feel'],
  ['at', 'in', 'on', 'from'],
  ['because', 'although', 'before', 'after'],
  ['we', 'they', 'she', 'he'],
  ['very', 'really', 'already', 'still'],
];

function getPlausibleDistractors(sentenceWords: string[], count: number = 3): string[] {
  const normWords = sentenceWords.map((w) => w.toLowerCase());
  const selected: string[] = [];

  for (const pool of COMMON_DISTRACTOR_POOLS) {
    if (selected.length >= count) break;
    for (const candidate of pool) {
      if (!normWords.includes(candidate.toLowerCase()) && !selected.includes(candidate)) {
        selected.push(candidate);
        break;
      }
    }
  }

  return selected.slice(0, count);
}

// Categorizes vocabulary items for natural grammatical integration
type WordCategory = 'clause_i' | 'phrasal_verb' | 'noun' | 'adjective' | 'adverb' | 'general';

function categorizeWord(word: string): WordCategory {
  const lower = word.toLowerCase().trim();

  if (lower.startsWith('i ') || lower === 'i' || lower.startsWith('i\'')) {
    return 'clause_i';
  }
  if (
    lower.includes(' ') &&
    (lower.endsWith(' to') ||
      lower.endsWith(' with') ||
      lower.endsWith(' of') ||
      lower.endsWith(' for') ||
      lower.endsWith(' up') ||
      lower.endsWith(' on') ||
      lower.endsWith(' out') ||
      lower.includes('look forward') ||
      lower.includes('struggle') ||
      lower.includes('afraid of') ||
      lower.includes('ghost') ||
      lower.includes('take for granted'))
  ) {
    return 'phrasal_verb';
  }
  if (
    lower.endsWith('ly') ||
    ['actually', 'usually', 'already', 'meanwhile', 'suddenly', 'instead', 'almost'].includes(lower)
  ) {
    return 'adverb';
  }
  if (
    ['overwhelmed', 'afraid', 'busy', 'ready', 'confident', 'polite', 'rude', 'patient', 'calm'].includes(lower) ||
    lower.endsWith('ed') ||
    lower.endsWith('able') ||
    lower.endsWith('ful')
  ) {
    return 'adjective';
  }
  if (
    ['schedule', 'fear', 'routine', 'commitment', 'crush', 'feedback', 'deadline', 'budget', 'meeting', 'mistake'].includes(lower) ||
    lower.endsWith('tion') ||
    lower.endsWith('ment') ||
    lower.endsWith('ance')
  ) {
    return 'noun';
  }

  return 'general';
}

/**
 * Generates dynamic, natural sentences customized for the word category and context.
 */
function createRichSentences(
  item: ParsedVocabularyItem,
  seedIndex: number
): {
  sentenceBuild: {
    english: string;
    ptTranslation: string;
    promptPt: string;
    hintPt: string;
  };
  listenType: {
    sentence: string;
    ptTranslation: string;
    hintPt: string;
  };
  grammarFix: {
    wrong: string;
    correct: string;
    promptPt: string;
    ptTranslation: string;
    hintPt: string;
  };
  speakVerify: {
    sentence: string;
    ptTranslation: string;
    hintPt: string;
  };
  roleplayPrompt: {
    leoPrompt: string;
    promptPt: string;
    expectedAnswer: string;
    ptTranslation: string;
    hintPt: string;
  };
} {
  const word = item.english.trim();
  const meaning = item.portuguese?.trim() || '';
  const category = categorizeWord(word);
  const rot = seedIndex % 3;

  switch (category) {
    case 'clause_i': {
      // First-person expressions (e.g. "I went", "I really like", "I used to")
      const sbTemplates = [
        {
          eng: `Yesterday ${word} to a quiet place after finishing work.`,
          pt: `Ontem ${meaning ? meaning : word} a um lugar tranquilo depois de terminar o trabalho.`,
        },
        {
          eng: `In the morning ${word} having a fresh cup of coffee before starting.`,
          pt: `De manhã ${meaning ? meaning : word} tomar uma xícara de café fresco antes de começar.`,
        },
        {
          eng: `Whenever I have free time ${word} practicing English with confidence.`,
          pt: `Sempre que tenho tempo livre ${meaning ? meaning : word} praticar inglês com confiança.`,
        },
      ];
      const ltTemplates = [
        {
          eng: `My colleague told me that ${word} to the conference last week.`,
          pt: `Meu colega me disse que ${word} para a conferência semana passada.`,
        },
        {
          eng: `She knows that ${word} speaking English during our meetings.`,
          pt: `Ela sabe que ${word} falar inglês durante nossas reuniões.`,
        },
        {
          eng: `He was glad that ${word} able to join the team conversation.`,
          pt: `Ele ficou feliz que ${word} conseguiu participar da conversa da equipe.`,
        },
      ];
      const svTemplates = [
        {
          eng: `Every single day ${word} to improve my communication skills.`,
          pt: `Todos os dias ${meaning ? meaning : word} para melhorar minhas habilidades de comunicação.`,
        },
        {
          eng: `Last weekend ${word} for a relaxing walk with my close friends.`,
          pt: `No último fim de semana ${meaning ? meaning : word} para uma caminhada relaxante com amigos próximos.`,
        },
        {
          eng: `Whenever I get the chance ${word} practicing conversation with native speakers.`,
          pt: `Sempre que tenho a chance ${meaning ? meaning : word} praticar conversação com falantes nativos.`,
        },
      ];

      const sb = sbTemplates[rot];
      const lt = ltTemplates[rot];
      const sv = svTemplates[rot];

      return {
        sentenceBuild: {
          english: sb.eng,
          ptTranslation: sb.pt,
          promptPt: `Monte a frase: "${sb.pt}"`,
          hintPt: `Dica: Use a expressão "${word}" ${meaning ? `(${meaning})` : ''} no início ou após o tempo.`,
        },
        listenType: {
          sentence: lt.eng,
          ptTranslation: lt.pt,
          hintPt: `Dica: Preste atenção no áudio ao redor de "${word}".`,
        },
        grammarFix: {
          wrong: `Last night I go to the store to buy some bread.`,
          correct: `Last night ${word} to the store to buy some bread.`,
          promptPt: `Ajuste o tempo verbal ou a expressão correta na frase:`,
          ptTranslation: `Ontem à noite ${meaning ? meaning : word} à loja para comprar pão.`,
          hintPt: `Dica: Use a expressão correta observada na aula ("${word}").`,
        },
        speakVerify: {
          sentence: sv.eng,
          ptTranslation: sv.pt,
          hintPt: `Dica: Pronuncie "${word}" no seu ritmo natural.`,
        },
        roleplayPrompt: {
          leoPrompt: `Can you tell me about what you enjoy doing on your days off?`,
          promptPt: `Leo pergunta: "O que você gosta de fazer nos dias de folga?" Responda usando "${word}":`,
          expectedAnswer: `On my days off ${word} to relax and spend time with family.`,
          ptTranslation: `Nos meus dias de folga eu costumo relaxar e passar tempo com a família.`,
          hintPt: `Dica: Formule uma resposta curta e natural incluindo "${word}".`,
        },
      };
    }

    case 'phrasal_verb': {
      // Phrasal verbs / expressions (e.g. "look forward to", "struggle with", "afraid of")
      const isStruggle = word.toLowerCase().includes('struggle');
      const isLookForward = word.toLowerCase().includes('forward');
      const isAfraid = word.toLowerCase().includes('afraid');

      let wrongGf = `Many students ${word} in this specific grammar topic.`;
      let correctGf = `Many students ${word} this specific grammar topic.`;

      if (isLookForward) {
        wrongGf = `I am looking forward for seeing you next week.`;
        correctGf = `I am looking forward to seeing you next week.`;
      } else if (isAfraid) {
        wrongGf = `She was afraid with speaking in front of the audience.`;
        correctGf = `She was afraid of speaking in front of the audience.`;
      } else if (isStruggle) {
        wrongGf = `I usually struggle in prepositions when I speak fast.`;
        correctGf = `I usually struggle with prepositions when I speak fast.`;
      }

      return {
        sentenceBuild: {
          english: `I always try to stay calm whenever I ${word} new topics.`,
          ptTranslation: `Eu sempre tento manter a calma sempre que ${meaning ? meaning : `tenho de lidar com ${word}`}.`,
          promptPt: `Monte a frase usando "${word}" ${meaning ? `(${meaning})` : ''}:`,
          hintPt: `Dica: Lembre-se da preposição que acompanha "${word}".`,
        },
        listenType: {
          sentence: `Never hesitate to ask for advice if you ${word} your current tasks.`,
          ptTranslation: `Nunca hesite em pedir conselhos se você ${meaning ? meaning : `tiver dificuldade com`} suas tarefas atuais.`,
          hintPt: `Dica: Ouça a conexão entre "${word}" e o restante da frase.`,
        },
        grammarFix: {
          wrong: wrongGf,
          correct: correctGf,
          promptPt: `Corrija a preposição errada que costumamos confundir:`,
          ptTranslation: `Preste atenção à preposição correta que combina com "${word}".`,
          hintPt: `Dica: Lembre-se da preposição exata observada na aula com o professor.`,
        },
        speakVerify: {
          sentence: `I try to stay positive whenever I ${word} speaking in public.`,
          ptTranslation: `Eu tento me manter positivo sempre que ${meaning ? meaning : `tenho desafio com`} falar em público.`,
          hintPt: `Dica: Fale em ritmo pausado e firme a expressão "${word}".`,
        },
        roleplayPrompt: {
          leoPrompt: `How do you handle challenging situations during your work day?`,
          promptPt: `Leo pergunta: "Como você lida com situações desafiadoras no trabalho?" Responda usando "${word}":`,
          expectedAnswer: `Whenever I ${word} something difficult I ask colleagues for help.`,
          ptTranslation: `Sempre que me deparo com algo difícil eu peço ajuda aos colegas.`,
          hintPt: `Dica: Uma resposta direta incluindo "${word}" já é perfeita.`,
        },
      };
    }

    case 'noun': {
      // Nouns / Concepts (e.g. "schedule", "fear", "routine", "deadline")
      const sbTemplates = [
        {
          eng: `We need to organize our ${word} to deliver high quality results.`,
          pt: `Precisamos organizar nosso(a) ${meaning || word} para entregar resultados de alta qualidade.`,
        },
        {
          eng: `Facing your ${word} directly will help you grow and feel confident.`,
          pt: `Enfrentar seu(sua) ${meaning || word} diretamente vai te ajudar a crescer e ter confiança.`,
        },
        {
          eng: `I like to maintain a clear ${word} throughout the entire work week.`,
          pt: `Eu gosto de manter um(a) ${meaning || word} claro(a) durante toda a semana de trabalho.`,
        },
      ];
      const ltTemplates = [
        {
          eng: `Please confirm your ${word} before we schedule the next meeting.`,
          pt: `Por favor confirme seu(sua) ${meaning || word} antes de marcarmos a próxima reunião.`,
        },
        {
          eng: `Overcoming your ${word} is the most rewarding part of language learning.`,
          pt: `Superar seu(sua) ${meaning || word} é a parte mais recompensadora do aprendizado de idiomas.`,
        },
        {
          eng: `She shared valuable feedback regarding our weekly ${word}.`,
          pt: `Ela compartilhou um feedback valioso a respeito do(a) nosso(a) ${meaning || word} semanal.`,
        },
      ];
      const svTemplates = [
        {
          eng: `I review my ${word} every morning to stay on track.`,
          pt: `Eu reviso meu(minha) ${meaning || word} todas as manhãs para me manter no rumo.`,
        },
        {
          eng: `Replacing ${word} with action makes everything much easier.`,
          pt: `Substituir ${meaning || word} por ação torna tudo muito mais fácil.`,
        },
        {
          eng: `Having a solid ${word} brings peace of mind to our daily routine.`,
          pt: `Ter um(a) ${meaning || word} sólido(a) traz tranquilidade à nossa rotina diária.`,
        },
      ];

      const sb = sbTemplates[rot];
      const lt = ltTemplates[rot];
      const sv = svTemplates[rot];

      return {
        sentenceBuild: {
          english: sb.eng,
          ptTranslation: sb.pt,
          promptPt: `Monte a frase: "${sb.pt}"`,
          hintPt: `Dica: O termo "${word}" ${meaning ? `(${meaning})` : ''} funciona como o substantivo principal.`,
        },
        listenType: {
          sentence: lt.eng,
          ptTranslation: lt.pt,
          hintPt: `Dica: Ouça com atenção o pronome possessivo antes de "${word}".`,
        },
        grammarFix: {
          // Addresses user feedback: "uma atividade eu errei o our na hora de completar"
          wrong: `We must organize us ${word} before starting the project.`,
          correct: `We must organize our ${word} before starting the project.`,
          promptPt: `Corrija o pronome possessivo ("our" vs "us") na frase:`,
          ptTranslation: `Precisamos organizar nosso(a) ${meaning || word} antes de começar o projeto.`,
          hintPt: `Dica: Use "our" para indicar posse ("nosso/nossa") e não "us".`,
        },
        speakVerify: {
          sentence: sv.eng,
          ptTranslation: sv.pt,
          hintPt: `Dica: Pronuncie "${word}" com clareza.`,
        },
        roleplayPrompt: {
          leoPrompt: `How do you organize your priorities when unexpected tasks arise?`,
          promptPt: `Leo pergunta: "Como você organiza suas prioridades?" Responda usando "${word}":`,
          expectedAnswer: `I adapt my ${word} as soon as new priorities come in.`,
          ptTranslation: `Eu adapto meu(minha) ${meaning || word} assim que surgem novas prioridades.`,
          hintPt: `Dica: Uma frase curta contendo "${word}" é ideal.`,
        },
      };
    }

    case 'adjective': {
      // Adjectives / States (e.g. "overwhelmed", "afraid", "busy", "ready")
      return {
        sentenceBuild: {
          english: `Take a short pause whenever you feel ${word} with too many emails.`,
          ptTranslation: `Faça uma pausa curta sempre que se sentir ${meaning || word} com muitos e-mails.`,
          promptPt: `Monte a frase usando "${word}" ${meaning ? `(${meaning})` : ''}:`,
          hintPt: `Dica: O adjetivo "${word}" descreve como o sujeito se sente.`,
        },
        listenType: {
          sentence: `She felt completely ${word} after receiving the new urgent project.`,
          ptTranslation: `Ela se sentiu completamente ${meaning || word} após receber o novo projeto urgente.`,
          hintPt: `Dica: Ouça a palavra descritiva "${word}" ${meaning ? `(${meaning})` : ''}.`,
        },
        grammarFix: {
          wrong: `I feel ${word} for all this unexpected information.`,
          correct: `I feel ${word} by all this unexpected information.`,
          promptPt: `Ajuste a preposição correta que combina com o adjetivo:`,
          ptTranslation: `Eu me sinto ${meaning || word} com/por toda essa informação inesperada.`,
          hintPt: `Dica: Em inglês costumamos usar "by" ou "with" após "${word}".`,
        },
        speakVerify: {
          sentence: `I try to stay calm and take deep breaths whenever I feel ${word}.`,
          ptTranslation: `Eu tento manter a calma e respirar fundo sempre que me sinto ${meaning || word}.`,
          hintPt: `Dica: Pronuncie "${word}" no seu ritmo habitual.`,
        },
        roleplayPrompt: {
          leoPrompt: `What is your favorite way to unwind when you feel ${word}?`,
          promptPt: `Leo pergunta: "Como você relaxa quando se sente ${meaning || word}?" Responda usando "${word}":`,
          expectedAnswer: `Whenever I feel ${word} I go for a walk outside.`,
          ptTranslation: `Sempre que me sinto ${meaning || word} eu dou uma caminhada ao ar livre.`,
          hintPt: `Dica: Responda de forma simples usando "${word}".`,
        },
      };
    }

    case 'adverb': {
      // Adverbs (e.g. "actually", "usually", "recently")
      return {
        sentenceBuild: {
          english: `${word} practicing a little bit every day makes a huge difference.`,
          ptTranslation: `${meaning ? meaning : word}, praticar um pouco todos os dias faz uma enorme diferença.`,
          promptPt: `Monte a frase usando "${word}" ${meaning ? `(${meaning})` : ''}:`,
          hintPt: `Dica: Comece a frase com o advérbio "${word}".`,
        },
        listenType: {
          sentence: `He mentioned that ${word} the meeting was postponed until tomorrow.`,
          ptTranslation: `Ele mencionou que ${meaning ? meaning : word} a reunião foi adiada para amanhã.`,
          hintPt: `Dica: Preste atenção no advérbio "${word}".`,
        },
        grammarFix: {
          wrong: `I have been practicing my English, ${word}, in the morning.`,
          correct: `${word}, I have been practicing my English in the morning.`,
          promptPt: `Ajuste a ordem natural do advérbio na oração:`,
          ptTranslation: `${meaning ? meaning : word}, eu tenho praticado meu inglês pela manhã.`,
          hintPt: `Dica: Posicione "${word}" no início da oração para dar ênfase natural.`,
        },
        speakVerify: {
          sentence: `${word}, I feel much more confident speaking English this week.`,
          ptTranslation: `${meaning ? meaning : word}, eu me sinto muito mais confiante falando inglês esta semana.`,
          hintPt: `Dica: Fale "${word}" com entonação natural de início de frase.`,
        },
        roleplayPrompt: {
          leoPrompt: `Do you prefer studying in the morning or at night?`,
          promptPt: `Leo pergunta: "Você prefere estudar de manhã ou à noite?" Responda usando "${word}":`,
          expectedAnswer: `${word}, I find it much easier to focus in the morning.`,
          ptTranslation: `${meaning ? meaning : word}, eu acho bem mais fácil focar de manhã.`,
          hintPt: `Dica: Comece sua resposta com "${word}".`,
        },
      };
    }

    default: {
      // General verbs or terms
      return {
        sentenceBuild: {
          english: `I want to practice using ${word} during our next conversation.`,
          ptTranslation: `Eu quero praticar o uso de ${meaning || word} durante nossa próxima conversa.`,
          promptPt: `Monte a frase usando "${word}" ${meaning ? `(${meaning})` : ''}:`,
          hintPt: `Dica: Encaixe "${word}" no objetivo da oração.`,
        },
        listenType: {
          sentence: `She emphasized that using ${word} correctly makes your English sound natural.`,
          ptTranslation: `Ela enfatizou que usar ${meaning || word} corretamente faz seu inglês soarem natural.`,
          hintPt: `Dica: Ouça com atenção a pronúncia de "${word}".`,
        },
        grammarFix: {
          wrong: `We must always to remember ${word} in our sentences.`,
          correct: `We must always remember to use ${word} in our sentences.`,
          promptPt: `Corrija a estrutura com verbo auxiliar (elimine o "to" desnecessário):`,
          ptTranslation: `Devemos sempre nos lembrar de usar ${meaning || word} em nossas frases.`,
          hintPt: `Dica: Após "must" usamos o verbo na forma base sem "to".`,
        },
        speakVerify: {
          sentence: `I practice using ${word} in everyday conversation to gain fluency.`,
          ptTranslation: `Eu pratico o uso de ${meaning || word} em conversas do dia a dia para ganhar fluência.`,
          hintPt: `Dica: Fale no seu ritmo normal a frase com "${word}".`,
        },
        roleplayPrompt: {
          leoPrompt: `How do you plan to apply new vocabulary in your daily routine?`,
          promptPt: `Leo pergunta: "Como você planeja aplicar novo vocabulário?" Responda usando "${word}":`,
          expectedAnswer: `I will use ${word} whenever I write or speak with others.`,
          ptTranslation: `Eu vou usar ${meaning || word} sempre que escrever ou falar com outras pessoas.`,
          hintPt: `Dica: Formule uma resposta simples incluindo "${word}".`,
        },
      };
    }
  }
}

/**
 * Builds a complete standalone LessonPayload from vocabulary items
 */
export function buildCustomLesson(
  topic: string,
  level: CEFRLevel,
  items: ParsedVocabularyItem[],
  notes?: string
): LessonPayload {
  const wordsCovered = items.map((i) => i.english);
  const primaryItem = items[0] || { id: '1', english: 'practice' };

  const exercises: Exercise[] = [];
  const exerciseCount = Math.max(5, Math.min(items.length * 2, 6));

  for (let index = 0; index < exerciseCount; index++) {
    const item = items[index % items.length] || primaryItem;
    const word = item.english;
    const meaning = item.portuguese || '';
    const pron = item.pronunciation ? `[som aproximado: "${item.pronunciation}"]` : '';
    const typeMod = index % 5;

    // Generate tailored, varied sentence bundle for this word
    const richBundle = createRichSentences(item, index);

    if (typeMod === 0) {
      // Exercise 1: sentence_build
      const targetSentence = richBundle.sentenceBuild.english;
      const wordsInSentence = targetSentence.replace(/[.,!?]/g, '').split(' ');
      const distractors = getPlausibleDistractors(wordsInSentence, 3);
      const shuffledBank = [...wordsInSentence, ...distractors].sort(() => Math.random() - 0.5);

      exercises.push({
        id: `sb_${index}_${Date.now()}_${index}`,
        type: 'sentence_build',
        targetWord: word,
        instruction: 'Assemble the sentence in English:',
        instructionPt: 'Monte a frase em inglês:',
        promptText: `Monte: "${richBundle.sentenceBuild.ptTranslation}"`,
        promptTextPt: richBundle.sentenceBuild.ptTranslation,
        audioSentence: targetSentence,
        expectedAnswer: targetSentence,
        expectedAnswerPt: richBundle.sentenceBuild.ptTranslation,
        acceptableVariations: [targetSentence],
        wordBank: shuffledBank,
        requiredWords: [word],
        hint: `Start by identifying the subject or first word tile.`,
        hintPt: richBundle.sentenceBuild.hintPt,
        explanation: `Great job! "${word}" is used naturally in full context.`,
        explanationPt: `Perfeito! "${word}" ${meaning ? `(${meaning})` : ''} encaixado com sucesso no ritmo natural da frase.`,
        audioSpeedDefault: 1.0,
        slowSpeedAvailable: true,
      });
    } else if (typeMod === 1) {
      // Exercise 2: listen_type
      const audioSentence = richBundle.listenType.sentence;
      const wordsInSentence = audioSentence.replace(/[.,!?]/g, '').split(' ');
      const distractors = getPlausibleDistractors(wordsInSentence, 3);
      const shuffledBank = [...wordsInSentence, ...distractors].sort(() => Math.random() - 0.5);

      exercises.push({
        id: `lt_${index}_${Date.now()}_${index}`,
        type: 'listen_type',
        targetWord: word,
        instruction: 'Listen carefully and assemble or type what you hear:',
        instructionPt: 'Ouça o áudio com atenção e monte ou digite a frase exata:',
        promptText: 'Click the speaker to listen at normal or slow speed.',
        promptTextPt: 'Toque no alto-falante para ouvir (velocidade normal ou devagar).',
        audioSentence: audioSentence,
        expectedAnswer: audioSentence,
        expectedAnswerPt: richBundle.listenType.ptTranslation,
        acceptableVariations: [
          audioSentence,
          audioSentence.toLowerCase(),
          audioSentence.replace('.', ''),
        ],
        wordBank: shuffledBank,
        requiredWords: [word],
        hint: `Listen closely for the target expression "${word}".`,
        hintPt: richBundle.listenType.hintPt,
        explanation: `Well done! Recognizing connected speech is key to fluency.`,
        explanationPt: `Muito bem! Você reconheceu "${word}" no ritmo natural do inglês falado.`,
        audioSpeedDefault: 1.0,
        slowSpeedAvailable: true,
      });
    } else if (typeMod === 2) {
      // Exercise 3: grammar_fix
      exercises.push({
        id: `gf_${index}_${Date.now()}_${index}`,
        type: 'grammar_fix',
        targetWord: word,
        instruction: 'Correct the sentence to fix the grammar or preposition issue:',
        instructionPt: 'Ajuste e corrija o erro comum observado na aula:',
        promptText: richBundle.grammarFix.wrong,
        promptTextPt: richBundle.grammarFix.promptPt,
        audioSentence: richBundle.grammarFix.correct,
        expectedAnswer: richBundle.grammarFix.correct,
        expectedAnswerPt: richBundle.grammarFix.ptTranslation,
        acceptableVariations: [
          richBundle.grammarFix.correct,
          richBundle.grammarFix.correct.toLowerCase(),
          richBundle.grammarFix.correct.replace('.', ''),
        ],
        wordBank: richBundle.grammarFix.correct.split(' '),
        requiredWords: [word],
        hint: `Look at the preposition or word choice with "${word}".`,
        hintPt: richBundle.grammarFix.hintPt,
        explanation: `Exactly! Correct collocations make your English sound natural.`,
        explanationPt: `Exato! Fixar a combinação correta de "${word}" evita os erros mais frequentes de quem fala português.`,
        audioSpeedDefault: 1.0,
      });
    } else if (typeMod === 3) {
      // Exercise 4: speak_verify
      const spokenSentence = richBundle.speakVerify.sentence;

      exercises.push({
        id: `sv_${index}_${Date.now()}_${index}`,
        type: 'speak_verify',
        targetWord: word,
        instruction: 'Read the phrase aloud using your microphone:',
        instructionPt: 'Leia a frase completa em voz alta no microfone:',
        promptText: `Leia a frase em voz alta: "${spokenSentence}"`,
        promptTextPt: richBundle.speakVerify.ptTranslation,
        audioSentence: spokenSentence,
        expectedAnswer: spokenSentence,
        expectedAnswerPt: richBundle.speakVerify.ptTranslation,
        acceptableVariations: [
          spokenSentence,
          spokenSentence.toLowerCase(),
          spokenSentence.replace('.', ''),
        ],
        wordBank: spokenSentence.split(' '),
        requiredWords: [word],
        hint: `Speak clearly into your microphone at normal pace.`,
        hintPt: richBundle.speakVerify.hintPt,
        explanation: `Pronunciation detected clearly! Great oral practice.`,
        explanationPt: `Pronúncia detectada com clareza! Falar em voz alta fixa o vocabulário na memória de longo prazo.`,
        audioSpeedDefault: 1.0,
      });
    } else {
      // Exercise 5: roleplay_prompt with Mascot Leo
      exercises.push({
        id: `rp_${index}_${Date.now()}_${index}`,
        type: 'roleplay_prompt',
        targetWord: word,
        instruction: 'Answer Leo in English using the target vocabulary:',
        instructionPt: 'Responda ao Leo em inglês usando a palavra obrigatória:',
        promptText: richBundle.roleplayPrompt.leoPrompt,
        promptTextPt: richBundle.roleplayPrompt.promptPt,
        audioSentence: richBundle.roleplayPrompt.leoPrompt,
        expectedAnswer: richBundle.roleplayPrompt.expectedAnswer,
        expectedAnswerPt: richBundle.roleplayPrompt.ptTranslation,
        acceptableVariations: [
          richBundle.roleplayPrompt.expectedAnswer,
          richBundle.roleplayPrompt.expectedAnswer.toLowerCase(),
          `I always use ${word} in my routine.`,
          `I practice ${word} regularly.`,
        ],
        wordBank: ['I', 'use', word, 'every', 'day', 'at', 'work', 'with', 'people'],
        requiredWords: [word],
        hint: `Form a simple sentence containing "${word}".`,
        hintPt: richBundle.roleplayPrompt.hintPt,
        explanation: `Terrific response! Conversational application complete.`,
        explanationPt: `Excelente resposta conversacional! Você colocou "${word}" em prática ativa.`,
        audioSpeedDefault: 1.0,
      });
    }
  }

  // Generate crisp, clean pedagogical summary (never dumps rawNotes!)
  const firstWord = wordsCovered[0] || 'expressões da aula';
  const cleanPitfallsPt = [
    `Cuidado com preposições ao usar ${wordsCovered.slice(0, 3).map((w) => `"${w}"`).join(', ')}.`,
    `Evite traduzir palavra por palavra do português; foque nas estruturas naturais em inglês.`,
  ];

  return {
    moduleMeta: {
      appName: 'SimpleENG',
      topic,
      targetLevel: level,
      estimatedDurationMinutes: 5,
      wordsCovered,
    },
    mascotWelcome: {
      greeting: `Pronto para fixar sua aula de ${topic}?`,
      topicIntro: `Pegamos suas anotações da aula particular para criar um treino prático e sem estresse. Vamos começar aquecendo com o banco de palavras!`,
    },
    exercises,
    reviewSummary: {
      keyTakeaways: [
        `Mastered key terms: ${wordsCovered.join(', ')}`,
        `Reinforced natural speech cadence and collocations`,
      ],
      keyTakeawaysPt: [
        `Vocabulário fixado: ${wordsCovered.join(', ')}`,
        `Treino com blocos táteis estilo Duolingo e escuta ativa`,
      ],
      commonPitfallsToAvoid: [
        `Confusing prepositions or false friends noted during class`,
      ],
      commonPitfallsToAvoidPt: cleanPitfallsPt,
    },
  };
}

/**
 * Builds a 7-day WeeklyPlan with 4 micro-blocks of 5 minutes each per day (20 min/day).
 * Adheres strictly to the user's requirements:
 * - 20 minutes per day divided into 4 blocks of 5 minutes
 * - Day 1 starts on class day (e.g. Wednesday)
 * - Distributed vocabulary, spaced repetition, games, translations, mic speaking
 */
export function buildWeeklyPlan(
  topic: string,
  level: CEFRLevel,
  items: ParsedVocabularyItem[],
  classDay: string = 'Quarta-feira',
  dailyMinutes: number = 20,
  rawNotes: string = ''
): WeeklyPlan {
  // Ensure we have at least some items
  const safeItems =
    items.length > 0
      ? items
      : [
          { id: '1', english: 'schedule', portuguese: 'agendar / cronograma' },
          { id: '2', english: 'look forward to', portuguese: 'aguardar com expectativa' },
          { id: '3', english: 'overwhelmed', portuguese: 'sobrecarregado' },
          { id: '4', english: 'actually', portuguese: 'na verdade' },
        ];

  // Generate 7 consecutive days starting from today
  const PT_DAYS = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  const PT_SHORT_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const PT_MONTHS = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const cleanClassDay = (classDay || '').toLowerCase().replace('-feira', '').trim();

  const DAY_THEMES = [
    {
      label: 'Dia 1 · Pós-Aula (Aquecimento & Descoberta)',
      theme: 'Fixação imediata dos termos mais difíceis da aula de hoje.',
    },
    {
      label: 'Dia 2 · Montagem & Vocabulário em Contexto',
      theme: 'Encaixar as expressões em frases reais do dia a dia.',
    },
    {
      label: 'Dia 3 · Treino de Ouvido & Ditado Rápido',
      theme: 'Destravar a compreensão auditiva das palavras anotadas.',
    },
    {
      label: 'Dia 4 · Pegadinhas & Correção de Preposições',
      theme: 'Ajustar os pontos onde você mais se confundiu na aula.',
    },
    {
      label: 'Dia 5 · Fala Ativa & Microfone',
      theme: 'Soltar a voz pronunciando as expressões com segurança.',
    },
    {
      label: 'Dia 6 · Mini-Games & Joguinho de Tradução',
      theme: 'Velocidade, agilidade e associação rápida.',
    },
    {
      label: 'Dia 7 · Revisão Semanal & Consolidação',
      theme: 'Consolidação total para chegar afiado(a) na próxima aula!',
    },
  ];

  const BLOCK_THEMES: Array<{
    titleName: string;
    subtitle: string;
    type: ExerciseType;
  }> = [
    {
      titleName: 'Banco de Palavras (Aquecimento)',
      subtitle: 'Toque nos blocos táteis para montar frases sem estresse.',
      type: 'sentence_build',
    },
    {
      titleName: 'Treino de Ouvido & Ditado',
      subtitle: 'Ouça o áudio nativo e identifique a expressão.',
      type: 'listen_type',
    },
    {
      titleName: 'Correção de Pegadinhas',
      subtitle: 'Ajuste preposições e erros comuns da sua aula.',
      type: 'grammar_fix',
    },
    {
      titleName: 'Pronúncia & Fala Ativa',
      subtitle: 'Fale no microfone e receba validação instantânea.',
      type: 'speak_verify',
    },
    {
      titleName: 'Mini-Cenário & Prática Real',
      subtitle: 'Responda no cenário e troque ideias com o Leo.',
      type: 'roleplay_prompt',
    },
    {
      titleName: 'Fixação Rápida & Velocidade',
      subtitle: 'Associação rápida e consolidação do vocabulário do dia.',
      type: 'sentence_build',
    },
  ];

  const blocksCount = Math.max(2, Math.min(6, Math.round(dailyMinutes / 5)));
  const days: DayPlan[] = [];

  for (let d = 0; d < 7; d++) {
    const targetDate = new Date(baseDate.getTime() + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = targetDate.getDay();
    const dayName = PT_DAYS[dayOfWeek];
    const shortDayName = PT_SHORT_DAYS[dayOfWeek];
    const dayNumber = targetDate.getDate();
    const monthName = PT_MONTHS[targetDate.getMonth()];
    const dateFormatted = `${dayNumber} ${monthName}`;
    const dateIso = targetDate.toISOString().split('T')[0];

    const isClassDay =
      cleanClassDay.length > 0 &&
      (dayName.toLowerCase().replace('-feira', '').includes(cleanClassDay) ||
        cleanClassDay.includes(dayName.toLowerCase().replace('-feira', '')));
    const isToday = d === 0;

    const themeInfo = DAY_THEMES[d];
    let dayLabel = `Dia ${d + 1} · ${themeInfo.label.split('·')[1]?.trim() || themeInfo.label}`;
    if (isToday && isClassDay) {
      dayLabel = 'Hoje · Dia da Aula & Início';
    } else if (isToday) {
      dayLabel = 'Hoje · Início do Ciclo';
    } else if (isClassDay) {
      dayLabel = `Dia ${d + 1} · Dia da Aula`;
    }

    // Distribute vocabulary items systematically:
    // Days 1 to 6 (d = 0..5): Every single word in safeItems is guaranteed to be partitioned and covered!
    // Day 7 (d = 6): Comprehensive Weekly Consolidation reviewing key vocabulary across the entire week.
    const totalItemsCount = safeItems.length;
    let dayItems: ParsedVocabularyItem[] = [];

    if (d < 6) {
      if (totalItemsCount <= 6) {
        const start = (d * 2) % totalItemsCount;
        dayItems = [
          safeItems[start],
          safeItems[(start + 1) % totalItemsCount],
          safeItems[(start + 2) % totalItemsCount],
        ];
      } else {
        const startIndex = Math.floor((d * totalItemsCount) / 6);
        const endIndex = Math.floor(((d + 1) * totalItemsCount) / 6);
        const slice = safeItems.slice(startIndex, endIndex);
        dayItems = slice.length > 0 ? slice : [safeItems[d % totalItemsCount]];
      }
    } else {
      // Day 7: Comprehensive Weekly Review
      if (totalItemsCount <= 8) {
        dayItems = [...safeItems];
      } else {
        const reviewSample: ParsedVocabularyItem[] = [];
        const step = Math.max(1, Math.floor(totalItemsCount / 8));
        for (let i = 0; i < totalItemsCount && reviewSample.length < 8; i += step) {
          reviewSample.push(safeItems[i]);
        }
        dayItems = reviewSample.length > 0 ? reviewSample : safeItems.slice(0, 4);
      }
    }

    const blocks: LessonBlock[] = [];

    for (let b = 0; b < blocksCount; b++) {
      const theme = BLOCK_THEMES[b % BLOCK_THEMES.length];
      const blockTitle = `Bloco ${b + 1}: ${theme.titleName}`;

      // Distribute the day's vocabulary across this day's blocks
      let blockItems: ParsedVocabularyItem[] = [];
      if (dayItems.length <= blocksCount) {
        const primary = dayItems[b % dayItems.length];
        const secondary = dayItems[(b + 1) % dayItems.length];
        blockItems = [primary];
        if (secondary && secondary.id !== primary.id) {
          blockItems.push(secondary);
        }
      } else {
        const bStart = Math.floor((b * dayItems.length) / blocksCount);
        const bEnd = Math.floor(((b + 1) * dayItems.length) / blocksCount);
        blockItems = dayItems.slice(bStart, bEnd);
        if (blockItems.length === 0) {
          blockItems = [dayItems[b % dayItems.length]];
        }
      }

      const blockWords = blockItems.map((i) => i.english);

      // Create a targeted 5-minute micro-lesson for this block containing all assigned words
      const blockLesson = buildCustomLesson(
        `${topic} - ${dayName} (${blockTitle.split(':')[0]})`,
        level,
        blockItems,
        rawNotes
      );

      blocks.push({
        id: `block_d${d}_b${b}_${Date.now()}_${b}`,
        blockNumber: b + 1,
        title: blockTitle,
        subtitle: theme.subtitle,
        durationMinutes: 5,
        type: theme.type,
        targetWords: blockWords,
        isCompleted: false,
        lesson: blockLesson,
      });
    }

    days.push({
      dayIndex: d,
      dateIso,
      dateFormatted,
      dayNumber,
      monthName,
      shortDayName,
      dayName,
      dayLabel,
      theme: themeInfo.theme,
      isToday,
      isClassDay,
      isCompleted: false,
      totalMinutes: dailyMinutes,
      blocks,
    });
  }

  return {
    id: `plan_${Date.now()}`,
    createdAt: new Date().toISOString(),
    topic,
    cefrLevel: level,
    classDay,
    dailyMinutesGoal: dailyMinutes,
    blocksPerDay: blocksCount,
    rawNotes,
    parsedItems: safeItems,
    days,
  };
}
