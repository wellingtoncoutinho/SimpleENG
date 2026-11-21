import { CEFRLevel, Exercise, ExerciseType, LessonPayload, MatchPair } from '../types/lesson.ts';
import { DayPlan, LessonBlock, ParsedVocabularyItem, WeeklyPlan } from '../types/weeklyPlan.ts';
import { WORD_TRANSLATIONS } from './wordTranslations.ts';
import { isMetaHeader } from './noteParser.ts';

/**
 * Intelligent Pedagogical Generator for SimpleENG.
 * Duolingo-style gamified micro-lessons organized around 7 real-life daily scenarios:
 * Day 1: Restaurante & Café
 * Day 2: Família & Casa
 * Day 3: Trabalho & Reuniões
 * Day 4: Viagens & Aeroporto
 * Day 5: Rolê com Amigos & Lazer
 * Day 6: Encontros & Relacionamentos
 * Day 7: Vida Real, Cidade & Compras
 */

export type DayScenarioKey =
  | 'restaurant'
  | 'family'
  | 'work'
  | 'travel'
  | 'friends'
  | 'dating'
  | 'city';

export interface DayScenario {
  key: DayScenarioKey;
  label: string;
  theme: string;
  contextPt: string;
}

export const DAY_SCENARIOS: DayScenario[] = [
  {
    key: 'restaurant',
    label: 'Dia 1 · Restaurante & Pedidos (Dining Out)',
    theme: 'Situações reais em restaurantes e cafés, pedindo pratos, bebidas e interagindo com garçons.',
    contextPt: 'em um restaurante ou cafeteria',
  },
  {
    key: 'family',
    label: 'Dia 2 · Família, Casa & Convivência (Home & Family)',
    theme: 'Conversas do dia a dia em família, rotina em casa, carinho e convivência.',
    contextPt: 'em casa ou conversando sobre família',
  },
  {
    key: 'work',
    label: 'Dia 3 · Trabalho, Reuniões & Carreira (Work & Office)',
    theme: 'Situações profissionais, alinhamento de prioridades, prazos, feedback e reuniões.',
    contextPt: 'no ambiente de trabalho ou escritório',
  },
  {
    key: 'travel',
    label: 'Dia 4 · Viagens, Aeroporto & Férias (Travel & Adventures)',
    theme: 'Check-in, aeroporto, hotel, explorando novas cidades e férias pelo mundo.',
    contextPt: 'em viagens, no aeroporto ou hotel',
  },
  {
    key: 'friends',
    label: 'Dia 5 · Rolê com Amigos, Música & Lazer (Friends & Fun)',
    theme: 'Combinar saídas, falar de shows, esportes, histórias engraçadas e fins de semana.',
    contextPt: 'em um rolê descontraído com amigos',
  },
  {
    key: 'dating',
    label: 'Dia 6 · Encontros, Emoções & Relacionamentos (Dating & Real Stories)',
    theme: 'Conversas profundas, sentimentos, dates, desabafos e memórias da vida real.',
    contextPt: 'em um date ou conversa sobre relacionamentos',
  },
  {
    key: 'city',
    label: 'Dia 7 · Vida Real, Cidade, Compras & Desafios (City Life & Shopping)',
    theme: 'Compras, resolver pendências na cidade, imprevistos e desafios cotidianos.',
    contextPt: 'na cidade, fazendo compras ou resolvendo tarefas cotidianas',
  },
];

// Thematic distractor pools for Multiple Choice (full natural sentences per scenario)
const SCENARIO_MC_DISTRACTORS: Record<DayScenarioKey, string[]> = {
  restaurant: [
    'Could we please see the dessert menu when you have a moment?',
    'We are still deciding between the soup and the salad.',
    'Is service charge included in the final bill?',
    'Excuse me, could you bring some extra napkins to our table?',
    'What do you recommend as the house special tonight?',
  ],
  family: [
    'Everyone is helping clean up after our Sunday family lunch.',
    'We should organize our weekend plans with the family.',
    'Let\'s call our grandparents later this evening to check in.',
    'We usually sit down together to talk about how our week went.',
    'We love having a quiet dinner at home on Friday nights.',
  ],
  work: [
    'Let\'s schedule a quick sync before the deadline tomorrow.',
    'I will share the updated project summary with the team.',
    'We need to align our priorities for the upcoming quarter.',
    'Could you review the draft presentation before the client call?',
    'Please send the meeting notes once the discussion concludes.',
  ],
  travel: [
    'Could you tell me which gate our flight departs from?',
    'I need to pick up my luggage at the baggage claim carousel.',
    'Is there a shuttle service available directly to the city center?',
    'Please have your boarding pass and identification ready at the gate.',
    'Our flight was delayed by thirty minutes due to weather.',
  ],
  friends: [
    'We should definitely hang out more often this summer.',
    'Let\'s grab a coffee downtown and catch up on everything.',
    'The live music concert downtown starts at eight tonight.',
    'Do you want to grab burgers and chill by the park this afternoon?',
    'We had such a great time laughing about our old stories.',
  ],
  dating: [
    'I really value honest and open communication between couples.',
    'It is wonderful to spend quality time together talking.',
    'Being authentic and true to yourself makes all the difference.',
    'We really connected from our very first conversation over dinner.',
    'Sharing your genuine thoughts helps build lasting trust.',
  ],
  city: [
    'Excuse me, where can I find the nearest grocery store around here?',
    'I have a few urgent errands to run before the shops close.',
    'Could you tell me how much this item costs at the counter?',
    'There is a very convenient pharmacy located right around the corner.',
    'Is the subway station within walking distance from here?',
  ],
};

function getScenarioMCDistractors(scenarioKey: DayScenarioKey, expectedAnswer: string, count: number = 2): string[] {
  const pool = SCENARIO_MC_DISTRACTORS[scenarioKey] || SCENARIO_MC_DISTRACTORS.restaurant;
  const filtered = pool.filter((s) => s.toLowerCase() !== expectedAnswer.toLowerCase());
  return filtered.slice(0, count);
}

// Categorizes vocabulary items for natural grammatical integration
export type WordCategory = 'clause_i' | 'phrasal_verb' | 'noun' | 'adjective' | 'adverb' | 'people' | 'location' | 'general';

// Plausible category-specific distractors for fill_blank (strictly matching grammatical class)
const CATEGORY_FB_DISTRACTORS: Record<WordCategory, string[]> = {
  clause_i: ['I want', 'I need', 'I plan', 'I hope'],
  people: ['colleagues', 'employees', 'clients', 'partners', 'friends', 'customers', 'managers'],
  location: ['near', 'close to', 'around', 'downtown', 'across from', 'behind'],
  phrasal_verb: ['speak up', 'calm down', 'hold back', 'look forward to', 'hang out', 'give up', 'catch up', 'not caring'],
  noun: ['ways', 'habits', 'trust', 'schedule', 'routine', 'meeting', 'priority', 'feedback', 'crush', 'fear'],
  adjective: ['trusty', 'honest', 'overwhelmed', 'confident', 'exhausted', 'comfortable', 'patient'],
  adverb: ['actually', 'usually', 'suddenly', 'meanwhile', 'already', 'patiently'],
  general: ['schedule', 'routine', 'priority', 'choice', 'plan'],
};

function getCategoryFBDistractors(category: WordCategory, targetWord: string, count: number = 2): string[] {
  const pool = CATEGORY_FB_DISTRACTORS[category] || CATEGORY_FB_DISTRACTORS.noun;
  const normTarget = targetWord.toLowerCase().trim();
  const filtered = pool.filter((w) => w.toLowerCase() !== normTarget);
  return filtered.slice(0, count);
}

function categorizeWord(word: string, meaningPt: string = ''): WordCategory {
  const clean = word.replace(/^[-–—:;,\s]+|[-–—:;,\s]+$/g, '').toLowerCase().trim();
  const m = meaningPt.toLowerCase().trim();

  if (clean.startsWith('i ') || clean === 'i' || clean.startsWith('i\'')) {
    return 'clause_i';
  }

  // People / Roles
  const PEOPLE_WORDS = [
    'employees', 'employee', 'worker', 'workers', 'staff', 'colleague', 'colleagues',
    'team', 'manager', 'boss', 'client', 'clients', 'customer', 'customers',
    'friend', 'friends', 'parents', 'parent', 'family', 'children', 'kids',
    'partner', 'partners', 'couple', 'couples', 'date', 'dates', 'waiter', 'waitress',
    'relative', 'relatives', 'neighbor', 'neighbors', 'people', 'person'
  ];
  if (
    PEOPLE_WORDS.includes(clean) ||
    PEOPLE_WORDS.some((pw) => clean.endsWith(' ' + pw)) ||
    m.includes('funcionári') ||
    m.includes('colaborador') ||
    m.includes('colega') ||
    m.includes('amigo') ||
    m.includes('parente') ||
    m.includes('cliente') ||
    m.includes('equipe')
  ) {
    return 'people';
  }

  // Location / Spatial
  const LOCATION_WORDS = [
    'near', 'close', 'far', 'downtown', 'corner', 'street', 'avenue', 'square',
    'station', 'airport', 'terminal', 'subway', 'neighborhood', 'aisle', 'entrance', 'exit',
    'park', 'hotel', 'bistro', 'cafe', 'restaurant'
  ];
  if (
    LOCATION_WORDS.includes(clean) ||
    m.includes('perto') ||
    m.includes('próximo') ||
    m.includes('longe') ||
    m.includes('centro') ||
    m.includes('estação') ||
    m.includes('esquina') ||
    m.includes('bairro')
  ) {
    return 'location';
  }

  // Verbs & Gerunds & Phrasal Verbs
  const isVerbEnding =
    clean.endsWith('ing') ||
    clean.startsWith('to ') ||
    clean.endsWith(' to') ||
    clean.endsWith(' with') ||
    clean.endsWith(' up') ||
    clean.endsWith(' out') ||
    clean.endsWith(' on') ||
    clean.endsWith(' for') ||
    clean.endsWith(' off');
  const isVerbMeaning =
    m.endsWith('ar') ||
    m.endsWith('er') ||
    m.endsWith('ir') ||
    m.includes('se ') ||
    m.startsWith('não se importar') ||
    m.includes('importar') ||
    m.includes('conversar') ||
    m.includes('falar');
  const KNOWN_VERBS = [
    'not caring', 'speak up', 'hang out', 'catch up', 'give up', 'look forward to',
    'take for granted', 'struggle', 'ghost', 'figure out', 'calm down', 'hold back',
    'listen', 'support', 'communicate'
  ];
  if (KNOWN_VERBS.includes(clean) || isVerbEnding || isVerbMeaning) {
    return 'phrasal_verb';
  }

  // Adverbs
  if (
    clean.endsWith('ly') ||
    ['actually', 'usually', 'already', 'meanwhile', 'suddenly', 'instead', 'almost', 'patiently', 'carefully', 'honestly'].includes(clean) ||
    m.endsWith('mente')
  ) {
    return 'adverb';
  }

  // Adjectives
  if (
    ['trusty', 'honest', 'healthy', 'overwhelmed', 'afraid', 'busy', 'ready', 'confident', 'polite', 'rude', 'patient', 'calm', 'delicious', 'comfortable', 'safe', 'happy'].includes(clean) ||
    clean.endsWith('ed') ||
    clean.endsWith('able') ||
    clean.endsWith('ful') ||
    clean.endsWith('ive') ||
    clean.endsWith('ous') ||
    m.endsWith('oso') ||
    m.endsWith('vel') ||
    m.endsWith('ado') ||
    m.endsWith('ido')
  ) {
    return 'adjective';
  }

  // Nouns
  if (
    ['ways', 'way', 'trust', 'schedule', 'fear', 'routine', 'commitment', 'crush', 'feedback', 'deadline', 'budget', 'meeting', 'mistake', 'bill', 'dinner', 'aisle', 'aisles', 'habit', 'habits'].includes(clean) ||
    clean.endsWith('tion') ||
    clean.endsWith('ment') ||
    clean.endsWith('ance')
  ) {
    return 'noun';
  }

  return 'general';
}

export interface CuratedVocabBundle {
  meaningPt: string;
  category: WordCategory;
  sentences: {
    mcScenario: string;
    mcPrompt: string;
    mcExpected: string;
    mcPt: string;
    fbBlank: string;
    fbExpected: string;
    fbDistractors: string[];
    fbPt: string;
    svSentence: string;
    svPt: string;
    rpLeo: string;
    rpLeoPt: string;
    rpAnswer: string;
    rpPt: string;
  };
}

export const VOCAB_SENTENCE_REGISTRY: Record<string, CuratedVocabBundle> = {
  'speak up': {
    meaningPt: 'falar abertamente / expressar a opinião',
    category: 'phrasal_verb',
    sentences: {
      mcScenario: 'Em uma conversa sincera sobre sentimentos e opiniões no dia a dia:',
      mcPrompt: 'Qual frase expressa a importância de expressar opiniões abertamente sem medo?',
      mcExpected: 'In a healthy relationship, it is essential to speak up whenever something bothers you.',
      mcPt: 'Em um relacionamento saudável, é essencial falar abertamente sempre que algo incomodar.',
      fbBlank: 'You should never hold back your feelings; feel free to ______ whenever you need.',
      fbExpected: 'speak up',
      fbDistractors: ['speak up', 'hold back', 'calm down'],
      fbPt: 'Você nunca deve guardar seus sentimentos; sinta-se à vontade para falar abertamente sempre que precisar.',
      svSentence: 'Always speak up for what you believe in.',
      svPt: 'Sempre fale abertamente pelo que você acredita.',
      rpLeo: 'Do you find it easy to speak up when you have a different opinion?',
      rpLeoPt: 'Leo pergunta: "Você acha fácil falar abertamente quando tem uma opinião diferente?" Responda usando "speak up":',
      rpAnswer: 'I try to speak up politely whenever I need to share my thoughts.',
      rpPt: 'Eu tento falar abertamente com educação sempre que preciso compartilhar meus pensamentos.',
    },
  },
  'ways': {
    meaningPt: 'maneiras / formas / caminhos',
    category: 'noun',
    sentences: {
      mcScenario: 'Conversando sobre como melhorar a convivência e o entendimento mútuo:',
      mcPrompt: 'Qual frase expressa que existem várias formas saudáveis de lidar com um desafio?',
      mcExpected: 'There are many healthy ways to resolve disagreements with people you care about.',
      mcPt: 'Existem muitas maneiras saudáveis de resolver desentendimentos com quem você se importa.',
      fbBlank: 'Couples and close friends always find creative ______ to spend quality time together.',
      fbExpected: 'ways',
      fbDistractors: ['ways', 'excuses', 'arguments'],
      fbPt: 'Casais e amigos próximos sempre encontram maneiras criativas de passar tempo de qualidade juntos.',
      svSentence: 'We found new ways to communicate better.',
      svPt: 'Nós encontramos novas maneiras de nos comunicar melhor.',
      rpLeo: 'What are your favorite ways to unwind after a stressful day?',
      rpLeoPt: 'Leo pergunta: "Quais são as suas maneiras favoritas de relaxar após um dia estressante?" Responda usando "ways":',
      rpAnswer: 'Listening to music and walking are great ways to recharge.',
      rpPt: 'Ouvir música e caminhar são ótimas maneiras de recarregar.',
    },
  },
  'trusty': {
    meaningPt: 'confiável / fiel / companheiro leal',
    category: 'adjective',
    sentences: {
      mcScenario: 'Falando sobre amigos ou parceiros leais com quem você sempre pode contar:',
      mcPrompt: 'Qual frase descreve alguém ou algo que nunca te deixa na mão?',
      mcExpected: 'Having a trusty friend to confide in makes difficult moments much easier.',
      mcPt: 'Ter um amigo confiável e leal para desabafar torna momentos difíceis muito mais fáceis.',
      fbBlank: 'She always turns to her ______ best friend whenever she needs honest advice.',
      fbExpected: 'trusty',
      fbDistractors: ['trusty', 'careless', 'jealous'],
      fbPt: 'Ela sempre recorre ao seu melhor amigo leal sempre que precisa de conselho sincero.',
      svSentence: 'He has been a trusty companion for years.',
      svPt: 'Ele tem sido um companheiro leal e confiável há anos.',
      rpLeo: 'Who is someone in your life that you consider completely trusty and reliable?',
      rpLeoPt: 'Leo pergunta: "Quem na sua vida você considera completamente leal e de confiança?" Responda usando "trusty":',
      rpAnswer: 'My best friend is my most trusty companion in all moments.',
      rpPt: 'Meu melhor amigo é meu companheiro mais confiável em todos os momentos.',
    },
  },
  'trust': {
    meaningPt: 'confiança / confiar',
    category: 'noun',
    sentences: {
      mcScenario: 'Refletindo sobre o alicerce de qualquer relação verdadeira:',
      mcPrompt: 'Como afirmar que a confiança mútua é indispensável?',
      mcExpected: 'Mutual trust is the true foundation of any lasting and loving connection.',
      mcPt: 'Confiança mútua é o verdadeiro alicerce de qualquer conexão duradoura e amorosa.',
      fbBlank: 'It takes time, honesty, and consistency to build genuine ______.',
      fbExpected: 'trust',
      fbDistractors: ['trust', 'doubt', 'distance'],
      fbPt: 'Leva tempo, honestidade e consistência para construir verdadeira confiança.',
      svSentence: 'Mutual trust builds a strong foundation.',
      svPt: 'Confiança mútua constrói uma base sólida.',
      rpLeo: 'How do you build trust with new people you meet?',
      rpLeoPt: 'Leo pergunta: "Como você constrói confiança com pessoas novas?" Responda usando "trust":',
      rpAnswer: 'Being honest and listening carefully builds true trust.',
      rpPt: 'Ser honesto e ouvir com atenção constrói verdadeira confiança.',
    },
  },
  'crush': {
    meaningPt: 'paixonite / queda por alguém',
    category: 'noun',
    sentences: {
      mcScenario: 'Conversando em tom descontraído sobre paqueras e sentimentos:',
      mcPrompt: 'Qual frase expressa de forma natural ter uma queda por alguém?',
      mcExpected: 'She could not stop smiling when her friends mentioned her secret crush.',
      mcPt: 'Ela não conseguia parar de sorrir quando as amigas mencionaram sua paixonite secreta.',
      fbBlank: 'He admitted to his best friend that he had a huge ______ on his classmate.',
      fbExpected: 'crush',
      fbDistractors: ['crush', 'rival', 'doubt'],
      fbPt: 'Ele confessou ao melhor amigo que tinha uma enorme paixonite pela colega de classe.',
      svSentence: 'I used to have a crush on her in college.',
      svPt: 'Eu costumava ter uma paixonite por ela na faculdade.',
      rpLeo: 'Do you remember your very first celebrity crush?',
      rpLeoPt: 'Leo pergunta: "Você se lembra da sua primeira paixonite famosa?" Responda usando "crush":',
      rpAnswer: 'Yes, I had a funny crush on an actor when I was a teenager.',
      rpPt: 'Sim, eu tinha uma paixonite engraçada por um ator quando era adolescente.',
    },
  },
  'look forward to': {
    meaningPt: 'aguardar com expectativa / estar ansioso por',
    category: 'phrasal_verb',
    sentences: {
      mcScenario: 'Falando sobre momentos futuros que te trazem alegria:',
      mcPrompt: 'Qual frase expressa expectativa positiva e carinho pelo futuro?',
      mcExpected: 'I always look forward to our weekend conversations over a warm cup of coffee.',
      mcPt: 'Eu sempre aguardo com expectativa nossas conversas de fim de semana com café quentinho.',
      fbBlank: 'We genuinely ______ spending peaceful mornings together with no rush.',
      fbExpected: 'look forward to',
      fbDistractors: ['look forward to', 'give up on', 'stay away from'],
      fbPt: 'Nós realmente aguardamos com expectativa passar manhãs tranquilas juntos sem pressa.',
      svSentence: 'I look forward to our next meeting.',
      svPt: 'Aguardo com expectativa nosso próximo encontro.',
      rpLeo: 'What is something exciting that you look forward to this month?',
      rpLeoPt: 'Leo pergunta: "O que você aguarda com expectativa este mês?" Responda usando "look forward to":',
      rpAnswer: 'I look forward to traveling with my family very soon.',
      rpPt: 'Aguardo com expectativa viajar com minha família em breve.',
    },
  },
  'schedule': {
    meaningPt: 'agenda / cronograma / agendar',
    category: 'noun',
    sentences: {
      mcScenario: 'Organizando horários para conseguir conciliar trabalho e vida pessoal:',
      mcPrompt: 'Como propor um ajuste de horários para conseguir passar tempo juntos?',
      mcExpected: 'Let us check our weekly schedule so we can pick the best evening for dinner.',
      mcPt: 'Vamos conferir nossa agenda da semana para escolher a melhor noite para o jantar.',
      fbBlank: 'Can you please check your ______ to see if you are free this Friday evening?',
      fbExpected: 'schedule',
      fbDistractors: ['schedule', 'ticket', 'receipt'],
      fbPt: 'Você pode por favor conferir sua agenda para ver se está livre nesta sexta à noite?',
      svSentence: 'Let us adjust our busy schedule today.',
      svPt: 'Vamos ajustar nossa agenda cheia hoje.',
      rpLeo: 'How do you usually organize your weekly schedule?',
      rpLeoPt: 'Leo pergunta: "Como você costuma organizar sua agenda da semana?" Responda usando "schedule":',
      rpAnswer: 'I keep a clean schedule on my phone for work and study.',
      rpPt: 'Eu mantenho uma agenda organizada no celular para trabalho e estudos.',
    },
  },
  'overwhelmed': {
    meaningPt: 'sobrecarregado(a) / cheio(a) de coisas',
    category: 'adjective',
    sentences: {
      mcScenario: 'Apoiando alguém querido que está enfrentando uma semana corrida:',
      mcPrompt: 'Como expressar carinho e acolhimento quando alguém está com a cabeça cheia?',
      mcExpected: 'Whenever you feel overwhelmed with work, taking a quiet walk together really helps.',
      mcPt: 'Sempre que você se sente sobrecarregado(a) com o trabalho, dar uma caminhada tranquila juntos ajuda muito.',
      fbBlank: 'She felt completely ______ after handling three major deadlines in a row.',
      fbExpected: 'overwhelmed',
      fbDistractors: ['overwhelmed', 'confident', 'relaxed'],
      fbPt: 'Ela se sentiu completamente sobrecarregada após lidar com três prazos importantes seguidos.',
      svSentence: 'Take a deep breath when you feel overwhelmed.',
      svPt: 'Respire fundo quando se sentir sobrecarregado(a).',
      rpLeo: 'What helps you most when you feel overwhelmed by a busy day?',
      rpLeoPt: 'Leo pergunta: "O que mais te ajuda quando você se sente sobrecarregado?" Responda usando "overwhelmed":',
      rpAnswer: 'Taking a short break helps when I feel overwhelmed.',
      rpPt: 'Fazer uma pequena pausa ajuda quando me sinto sobrecarregado.',
    },
  },
  'struggle': {
    meaningPt: 'ter dificuldade / passar aperto',
    category: 'phrasal_verb',
    sentences: {
      mcScenario: 'Conversando sobre desafios da vida e apoio mútuo:',
      mcPrompt: 'Qual frase expressa normalidade em ter dificuldades sem vergonha?',
      mcExpected: 'It is completely normal to struggle with new habits before they become effortless.',
      mcPt: 'É completamente normal ter dificuldade com novos hábitos antes de eles se tornarem naturais.',
      fbBlank: 'Partners never let each other ______ alone during challenging financial times.',
      fbExpected: 'struggle',
      fbDistractors: ['struggle', 'celebrate', 'relax'],
      fbPt: 'Parceiros nunca deixam um ao outro passar aperto sozinho em momentos financeiros difíceis.',
      svSentence: 'Never struggle alone when help is near.',
      svPt: 'Nunca passe dificuldade sozinho quando há ajuda por perto.',
      rpLeo: 'What is an English skill that you used to struggle with, but are getting better at?',
      rpLeoPt: 'Leo pergunta: "Com qual habilidade em inglês você tinha dificuldade, mas está melhorando?" Responda usando "struggle":',
      rpAnswer: 'I used to struggle with listening, but I practice every day now.',
      rpPt: 'Eu costumava ter dificuldade com audição, mas agora pratico todos os dias.',
    },
  },
  'fear': {
    meaningPt: 'medo / receio',
    category: 'noun',
    sentences: {
      mcScenario: 'Falando sobre coragem e vulnerabilidade em relações humanas:',
      mcPrompt: 'Como expressar que o medo não deve impedir a conexão entre as pessoas?',
      mcExpected: 'Letting go of the fear of being judged is what allows real intimacy to blossom.',
      mcPt: 'Abrir mão do medo de ser julgado é o que permite à verdadeira intimidade florescer.',
      fbBlank: 'She decided to overcome her ______ and speak from the heart.',
      fbExpected: 'fear',
      fbDistractors: ['fear', 'pride', 'joy'],
      fbPt: 'Ela decidiu superar seu medo e falar com o coração.',
      svSentence: 'Do not let fear hold you back.',
      svPt: 'Não deixe o medo te segurar.',
      rpLeo: 'What is a common fear people have when speaking a new language?',
      rpLeoPt: 'Leo pergunta: "Qual é um medo comum que as pessoas têm ao falar um novo idioma?" Responda usando "fear":',
      rpAnswer: 'The fear of making mistakes is very common for language learners.',
      rpPt: 'O medo de cometer erros é muito comum para estudantes de idiomas.',
    },
  },
  'ghost': {
    meaningPt: 'dar um sumiço / sumir sem explicação',
    category: 'phrasal_verb',
    sentences: {
      mcScenario: 'Conversando sobre consideração e responsabilidade afetiva:',
      mcPrompt: 'Qual frase expressa que adultos sinceros conversam em vez de sumir?',
      mcExpected: 'Mature adults explain their feelings honestly instead of deciding to ghost someone.',
      mcPt: 'Adultos maduros explicam seus sentimentos com sinceridade em vez de decidir dar um sumiço em alguém.',
      fbBlank: 'It is very disrespectful to ______ someone after weeks of talking daily.',
      fbExpected: 'ghost',
      fbDistractors: ['ghost', 'support', 'listen to'],
      fbPt: 'É muito desrespeitoso dar um sumiço em alguém depois de semanas conversando diariamente.',
      svSentence: 'Always communicate rather than ghost people.',
      svPt: 'Sempre se comunique em vez de dar sumiço nas pessoas.',
      rpLeo: 'Why do you think some people choose to ghost instead of talking?',
      rpLeoPt: 'Leo pergunta: "Por que você acha que algumas pessoas preferem dar um sumiço a conversar?" Responda usando "ghost":',
      rpAnswer: 'People often ghost because they are afraid of awkward conversations.',
      rpPt: 'As pessoas costumam sumir porque têm medo de conversas desconfortáveis.',
    },
  },
  'ghosting': {
    meaningPt: 'sumiço sem explicação',
    category: 'noun',
    sentences: {
      mcScenario: 'Conversando sobre desrespeito em relacionamentos modernos:',
      mcPrompt: 'Como lamentar a prática de sumir sem dar satisfação?',
      mcExpected: 'Ghosting causes unnecessary hurt when a simple honest message would be respectful.',
      mcPt: 'O sumiço sem explicação causa sofrimento desnecessário quando uma simples mensagem sincera seria respeitosa.',
      fbBlank: 'Nobody deserves to experience ______ after investing time and care into a relationship.',
      fbExpected: 'ghosting',
      fbDistractors: ['ghosting', 'kindness', 'loyalty'],
      fbPt: 'Ninguém merece passar por sumiço sem explicação depois de dedicar tempo e carinho a uma relação.',
      svSentence: 'Honest communication prevents painful ghosting.',
      svPt: 'Comunicação sincera evita o sumiço doloroso.',
      rpLeo: 'Have you ever had an experience with ghosting in friendships or dating?',
      rpLeoPt: 'Leo pergunta: "Você já passou por uma situação de sumiço sem explicação com amigos ou encontros?" Responda usando "ghosting":',
      rpAnswer: 'Ghosting is immature; I always prefer honest and clear communication.',
      rpPt: 'Sumir sem explicação é imaturo; eu sempre prefiro comunicação sincera e clara.',
    },
  },
  'hang out': {
    meaningPt: 'sair junto / passar tempo juntos',
    category: 'phrasal_verb',
    sentences: {
      mcScenario: 'Combinando um rolê gostoso e descontraído no fim de semana:',
      mcPrompt: 'Qual convite soa casual, acolhedor e natural em inglês?',
      mcExpected: 'Would you like to hang out and grab some iced coffee in the park this Saturday?',
      mcPt: 'Você gostaria de sair para tomar um café gelado no parque neste sábado?',
      fbBlank: 'We always love to ______ at our favorite local coffee shop on quiet afternoons.',
      fbExpected: 'hang out',
      fbDistractors: ['hang out', 'give up', 'call off'],
      fbPt: 'Nós sempre adoramos passar tempo juntos na nossa cafeteria favorita em tardes tranquilas.',
      svSentence: 'Let us hang out again this weekend.',
      svPt: 'Vamos sair juntos de novo neste fim de semana.',
      rpLeo: 'Where is your favorite place to hang out with close friends?',
      rpLeoPt: 'Leo pergunta: "Onde é seu lugar favorito para passar tempo com amigos próximos?" Responda usando "hang out":',
      rpAnswer: 'I love to hang out at quiet cafes and parks.',
      rpPt: 'Eu adoro passar tempo em cafés tranquilos e parques.',
    },
  },
  'take for granted': {
    meaningPt: 'tomar como garantido / não valorizar',
    category: 'phrasal_verb',
    sentences: {
      mcScenario: 'Refletindo sobre valorizar quem está ao nosso lado todos os dias:',
      mcPrompt: 'Qual frase lembra da importância de nunca deixar de valorizar o parceiro?',
      mcExpected: 'In any meaningful connection, you should never take each other for granted.',
      mcPt: 'Em qualquer conexão significativa, você nunca deve tomar o outro como garantido.',
      fbBlank: 'True love means you cherish daily kindness and never take it for ______.',
      fbExpected: 'granted',
      fbDistractors: ['granted', 'allowed', 'expected'],
      fbPt: 'Amor verdadeiro significa valorizar a gentileza diária e nunca tomá-la como garantida.',
      svSentence: 'Never take your loved ones for granted.',
      svPt: 'Nunca tome quem você ama como garantido.',
      rpLeo: 'What is something simple in life that people often take for granted?',
      rpLeoPt: 'Leo pergunta: "O que é algo simples na vida que as pessoas costumam não valorizar?" Responda usando "granted":',
      rpAnswer: 'People often take good health and family time for granted.',
      rpPt: 'As pessoas costumam não dar valor à boa saúde e ao tempo em família.',
    },
  },
  'aisle': {
    meaningPt: 'corredor (mercado / avião / trem)',
    category: 'noun',
    sentences: {
      mcScenario: 'No supermercado ou no avião procurando itens ou seu assento:',
      mcPrompt: 'Como perguntar com gentileza em qual corredor fica um produto?',
      mcExpected: 'Excuse me, could you please tell me which aisle has the fresh pasta?',
      mcPt: 'Com licença, você poderia me dizer qual corredor tem a massa fresca?',
      fbBlank: 'I always choose an ______ seat on long flights so I can stretch my legs easily.',
      fbExpected: 'aisle',
      fbDistractors: ['aisle', 'engine', 'cockpit'],
      fbPt: 'Eu sempre escolho um assento de corredor em voos longos para poder esticar as pernas facilmente.',
      svSentence: 'The olive oil is located in aisle four.',
      svPt: 'O azeite de oliva fica no corredor quatro.',
      rpLeo: 'Do you prefer a window seat or an aisle seat when you travel by airplane?',
      rpLeoPt: 'Leo pergunta: "Você prefere assento de janela ou de corredor ao viajar de avião?" Responda usando "aisle":',
      rpAnswer: 'I prefer an aisle seat because it gives me more freedom to get up.',
      rpPt: 'Prefiro assento de corredor porque me dá mais liberdade para levantar.',
    },
  },
  'not caring': {
    meaningPt: 'não se importar / indiferença / desapego',
    category: 'phrasal_verb',
    sentences: {
      mcScenario: 'Em uma conversa sincera sobre sentimentos e atitudes no relacionamento:',
      mcPrompt: 'Qual frase expressa que a indiferença ou não se importar prejudica uma relação?',
      mcExpected: 'Not caring about each other\'s feelings can create painful distance between partners.',
      mcPt: 'Não se importar com os sentimentos do outro pode criar uma distância dolorosa entre os parceiros.',
      fbBlank: 'In a loving partnership, ______ about important conversations hurts the connection.',
      fbExpected: 'not caring',
      fbDistractors: ['not caring', 'holding back', 'staying calm'],
      fbPt: 'Em uma parceria amorosa, não se importar com conversas importantes prejudica a conexão.',
      svSentence: 'Showing empathy means caring deeply.',
      svPt: 'Demonstrar empatia significa se importar profundamente.',
      rpLeo: 'How do you handle situations when someone seems to be not caring about something important?',
      rpLeoPt: 'Leo pergunta: "Como você lida com situações em que alguém parece não estar se importando com algo importante?" Responda usando "not caring":',
      rpAnswer: 'I prefer talking openly instead of not caring about their feelings.',
      rpPt: 'Eu prefiro conversar abertamente em vez de não me importar com os sentimentos deles.',
    },
  },
  'employees': {
    meaningPt: 'funcionários / colaboradores / equipe',
    category: 'noun',
    sentences: {
      mcScenario: 'No ambiente profissional e liderança de equipe na empresa:',
      mcPrompt: 'Como expressar a importância de valorizar e ouvir os colaboradores da empresa?',
      mcExpected: 'Good leadership always values and listens carefully to all dedicated employees.',
      mcPt: 'Boa liderança sempre valoriza e ouve com atenção todos os funcionários dedicados.',
      fbBlank: 'The company organized an open workshop to support all hard-working ______.',
      fbExpected: 'employees',
      fbDistractors: ['employees', 'customers', 'visitors'],
      fbPt: 'A empresa organizou um workshop aberto para apoiar todos os funcionários esforçados.',
      svSentence: 'Our employees are dedicated and skilled.',
      svPt: 'Nossos colaboradores são dedicados e habilidosos.',
      rpLeo: 'What makes a company culture truly welcoming for employees and team members?',
      rpLeoPt: 'Leo pergunta: "O que torna a cultura de uma empresa verdadeiramente acolhedora para os colaboradores?" Responda usando "employees":',
      rpAnswer: 'Treating all employees with respect and trust creates a positive culture.',
      rpPt: 'Tratar todos os colaboradores com respeito e confiança cria uma cultura positiva.',
    },
  },
  'employee': {
    meaningPt: 'funcionário / colaborador',
    category: 'noun',
    sentences: {
      mcScenario: 'Conversando sobre carreira, equipe e dedicação no trabalho:',
      mcPrompt: 'Qual frase destaca o papel de um colaborador dedicado na empresa?',
      mcExpected: 'Every dedicated employee deserves recognition and fair growth opportunities.',
      mcPt: 'Cada funcionário dedicado merece reconhecimento e oportunidades justas de crescimento.',
      fbBlank: 'She was recognized as the most outstanding ______ of the quarter.',
      fbExpected: 'employee',
      fbDistractors: ['employee', 'passenger', 'tourist'],
      fbPt: 'Ela foi reconhecida como a funcionária mais exemplar do trimestre.',
      svSentence: 'He is a highly valued employee.',
      svPt: 'Ele é um colaborador muito valorizado.',
      rpLeo: 'What qualities do you value most in a dedicated colleague or employee?',
      rpLeoPt: 'Leo pergunta: "Quais qualidades você mais valoriza em um colega ou funcionário dedicado?" Responda usando "employee":',
      rpAnswer: 'Honesty and commitment make any employee truly stand out.',
      rpPt: 'Honestidade e compromisso fazem qualquer colaborador se destacar.',
    },
  },
  'near': {
    meaningPt: 'perto / próximo / na redondeza',
    category: 'adverb',
    sentences: {
      mcScenario: 'Procurando um local ou serviço prático na cidade ou no bairro:',
      mcPrompt: 'Como perguntar de forma natural se há um supermercado ou farmácia perto daqui?',
      mcExpected: 'Excuse me, could you tell me if there is a grocery store located near here?',
      mcPt: 'Com licença, você poderia me dizer se existe um supermercado localizado perto daqui?',
      fbBlank: 'We decided to choose a quiet apartment located ______ the central subway station.',
      fbExpected: 'near',
      fbDistractors: ['near', 'across', 'beyond'],
      fbPt: 'Decidimos escolher um apartamento tranquilo localizado perto da estação central de metrô.',
      svSentence: 'The cafe is located near the park.',
      svPt: 'O café fica localizado perto do parque.',
      rpLeo: 'Is there a cozy cafe or quiet park near your home where you like to relax?',
      rpLeoPt: 'Leo pergunta: "Existe um café acolhedor ou parque tranquilo perto da sua casa onde você gosta de relaxar?" Responda usando "near":',
      rpAnswer: 'Yes, there is a very peaceful green park near my home.',
      rpPt: 'Sim, há um parque verde muito tranquilo perto da minha casa.',
    },
  },
};

function getNaturalMeaning(word: string, rawMeaning?: string): string {
  const clean = rawMeaning?.replace(/^[-–—:;,\s]+|[-–—:;,\s]+$/g, '').trim();
  if (
    clean &&
    clean.length <= 60 &&
    !clean.toLowerCase().startsWith('ao inves') &&
    !clean.toLowerCase().startsWith('ao invés') &&
    !clean.toLowerCase().startsWith('em vez') &&
    !clean.toLowerCase().startsWith('não é') &&
    !clean.toLowerCase().startsWith('confundi') &&
    !clean.toLowerCase().startsWith('atenção') &&
    !clean.toLowerCase().startsWith('cuidado')
  ) {
    return clean;
  }

  const cleanW = word.replace(/^[-–—:;,\s]+|[-–—:;,\s]+$/g, '').toLowerCase().trim();
  if (WORD_TRANSLATIONS[cleanW]) {
    return WORD_TRANSLATIONS[cleanW];
  }
  const stripped = cleanW.replace(/[^a-z0-9\s]/g, '').trim();
  if (WORD_TRANSLATIONS[stripped]) {
    return WORD_TRANSLATIONS[stripped];
  }

  if (cleanW.includes('like')) return 'gostar de';
  if (cleanW.includes('went')) return 'fui';
  if (cleanW.includes('used to')) return 'costumava';
  if (cleanW.includes('want')) return 'querer';
  if (cleanW.includes('need')) return 'precisar de';
  if (cleanW.includes('schedule')) return 'cronograma / agenda';
  if (cleanW.includes('fear')) return 'medo';
  if (cleanW.includes('struggle')) return 'ter dificuldade';
  if (cleanW.includes('forward')) return 'aguardar com expectativa';
  if (cleanW.includes('overwhelmed')) return 'sobrecarregado(a)';
  if (cleanW.includes('actually')) return 'na verdade';
  if (cleanW.includes('ghost')) return 'dar um sumiço';
  if (cleanW.includes('granted')) return 'tomar como garantido';
  if (cleanW.includes('aisle')) return 'corredor (mercado / avião)';
  if (cleanW.includes('not caring')) return 'não se importar / indiferença';
  if (cleanW.includes('employee')) return 'funcionário(a) / colaborador';
  if (cleanW.includes('near')) return 'perto / próximo';

  return cleanW;
}

export interface RichSentenceBundle {
  multipleChoice: {
    scenarioPt: string;
    promptPt: string;
    expectedAnswer: string;
    options: string[];
    ptTranslation: string;
    hintPt: string;
    explanationPt: string;
  };
  matchPairs: {
    pairs: MatchPair[];
    hintPt: string;
  };
  fillBlank: {
    sentenceWithBlank: string;
    expectedAnswer: string;
    options: string[];
    ptTranslation: string;
    hintPt: string;
    explanationPt: string;
  };
  speakVerify: {
    sentence: string;
    ptTranslation: string;
    hintPt: string;
    explanationPt: string;
  };
  roleplayPrompt: {
    leoPrompt: string;
    promptPt: string;
    expectedAnswer: string;
    ptTranslation: string;
    hintPt: string;
  };
  sentenceBuild: {
    english: string;
    ptTranslation: string;
    promptPt: string;
    hintPt: string;
    distractors?: string[];
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
    explanationPt: string;
  };
}

const CONFUSABLE_DISTRACTOR_MAP: Record<string, string[]> = {
  'through': ['thought', 'though', 'thorough', 'throughout'],
  'who is it?': ['how is it?', 'where is it?', 'what is it?'],
  'aerobic step': ['cardio step', 'step workout', 'aerobic pace'],
  'get a package': ['take a box', 'make a bundle', 'order a pack'],
  'cold plunge': ['ice bath', 'cold shower', 'freeze dive', 'cold pool'],
  'grueling': ['tiring', 'exhausting', 'grinding', 'cruel'],
  'workout': ['work in', 'warm up', 'workload', 'training'],
  'not caring': ['not minding', 'giving up', 'holding back', 'careless'],
  'employees': ['employers', 'colleagues', 'workers', 'managers'],
  'near': ['close to', 'nearby', 'next to', 'far from'],
  'speak up': ['speak out', 'talk down', 'hold back', 'calm down'],
  'ways': ['habits', 'paths', 'means', 'views'],
  'trusty': ['trusted', 'truthful', 'trusting', 'faithful'],
  'trust': ['truth', 'faith', 'doubt', 'belief'],
  'crush': ['crash', 'date', 'flame', 'infatuation'],
  'look forward to': ['look back on', 'look out for', 'look into', 'look after'],
  'schedule': ['timetable', 'calendar', 'routine', 'agenda'],
  'overwhelmed': ['overloaded', 'overpowered', 'exhausted', 'overrated'],
  'struggle': ['stumble', 'strive', 'suffer', 'surrender'],
  'fear': ['tear', 'fright', 'dread', 'phobia'],
  'ghost': ['host', 'disappear', 'vanish', 'ignore'],
  'ghosting': ['ignoring', 'vanishing', 'blocking'],
  'hang out': ['hang up', 'hang on', 'catch up', 'drop out'],
  'take for granted': ['take for sure', 'take as granted', 'give for granted'],
  'aisle': ['isle', 'corridor', 'hallway', 'alley'],
  'actually': ['currently', 'nowadays', 'eventually', 'factually'],
};

function getSmartConfusableDistractors(targetWord: string, count: number = 2): string[] {
  const norm = targetWord.toLowerCase().trim();
  if (CONFUSABLE_DISTRACTOR_MAP[norm]) {
    return CONFUSABLE_DISTRACTOR_MAP[norm].slice(0, count);
  }
  return [];
}


export interface GrammarPitfall {
  targetWord: string;
  wrong: string;
  correct: string;
  promptPt: string;
  ptTranslation: string;
  hintPt: string;
  explanationPt: string;
}

export const BRAZILIAN_GRAMMAR_PITFALLS: GrammarPitfall[] = [
  {
    targetWord: 'explain',
    wrong: 'Can you explain me the menu, please?',
    correct: 'Can you explain the menu to me, please?',
    promptPt: 'Ajuste a preposição correta com o verbo "explain":',
    ptTranslation: 'Você pode me explicar o cardápio, por favor?',
    hintPt: 'Dica: Em inglês dizemos "explain something to me" (nunca "explain me").',
    explanationPt: 'O verbo "explain" exige a preposição "to" antes do pronome: "explain to me".',
  },
  {
    targetWord: 'depend on',
    wrong: 'Our dinner plans depend of the weather tonight.',
    correct: 'Our dinner plans depend on the weather tonight.',
    promptPt: 'Corrija a preposição após o verbo "depend":',
    ptTranslation: 'Nossos planos de jantar dependem do clima hoje à noite.',
    hintPt: 'Dica: Em inglês usa-se sempre "depend on" (nunca "depend of").',
    explanationPt: 'A regência verbal em inglês é "depend on", diferentemente do português "depender de".',
  },
  {
    targetWord: 'listen to',
    wrong: 'I like to listen music while I cook dinner.',
    correct: 'I like to listen to music while I cook dinner.',
    promptPt: 'Adicione a preposição obrigatória com o verbo "listen":',
    ptTranslation: 'Eu gosto de ouvir música enquanto cozinho o jantar.',
    hintPt: 'Dica: "Listen" sempre exige a preposição "to": "listen to music".',
    explanationPt: 'Diferente do português ("ouvir música"), em inglês é obrigatório usar "to" após listen.',
  },
  {
    targetWord: 'married to',
    wrong: 'She has been married with him for eight years.',
    correct: 'She has been married to him for eight years.',
    promptPt: 'Corrija a preposição usada com "married":',
    ptTranslation: 'Ela é casada com ele há oito anos.',
    hintPt: 'Dica: Em inglês dizemos "married to someone" (e não "married with").',
    explanationPt: 'A preposição correta com "married" é "to": "married to someone".',
  },
  {
    targetWord: 'look forward to',
    wrong: 'I look forward to meet you at the cafe.',
    correct: 'I look forward to meeting you at the cafe.',
    promptPt: 'Ajuste a forma do verbo após "look forward to":',
    ptTranslation: 'Aguardo ansiosamente encontrar você no café.',
    hintPt: 'Dica: O "to" aqui é preposição, então o verbo seguinte fica com "-ing" (meeting).',
    explanationPt: 'Após a preposição "look forward to", usamos o gerúndio: "look forward to meeting".',
  },
  {
    targetWord: 'agree',
    wrong: 'I am agree with your opinion on this.',
    correct: 'I agree with your opinion on this.',
    promptPt: 'Elimine o verbo "to be" incorreto antes de "agree":',
    ptTranslation: 'Eu concordo com a sua opinião sobre isso.',
    hintPt: 'Dica: "Agree" já é verbo ("I agree"). Não use "I am agree".',
    explanationPt: 'Em inglês "agree" é verbo: dizemos "I agree" ou "I disagree", nunca com o verbo "to be".',
  },
  {
    targetWord: 'near',
    wrong: 'The cafe is located near of my house.',
    correct: 'The cafe is located near my house.',
    promptPt: 'Elimine a preposição incorreta após "near":',
    ptTranslation: 'O café fica localizado perto da minha casa.',
    hintPt: 'Dica: "Near" já significa "perto de". Nunca use "near of".',
    explanationPt: 'Em inglês "near" não leva preposição: dizemos "near the house", nunca "near of".',
  },
  {
    targetWord: 'good at',
    wrong: 'He is very good in speaking English during meetings.',
    correct: 'He is very good at speaking English during meetings.',
    promptPt: 'Ajuste a preposição para indicar habilidade ("good at"):',
    ptTranslation: 'Ele é muito bom em falar inglês durante as reuniões.',
    hintPt: 'Dica: Para habilidades e talentos, use "good at" (nunca "good in").',
    explanationPt: 'Dizemos "good at English", "good at sports", "good at math" com a preposição "at".',
  },
  {
    targetWord: 'arrive at',
    wrong: 'We arrived to the airport two hours early.',
    correct: 'We arrived at the airport two hours early.',
    promptPt: 'Corrija a preposição com o verbo "arrive":',
    ptTranslation: 'Chegamos ao aeroporto duas horas mais cedo.',
    hintPt: 'Dica: Em inglês usamos "arrive at" (locais específicos) ou "arrive in" (cidades/países), nunca "arrive to".',
    explanationPt: 'O verbo "arrive" não aceita a preposição de movimento "to". Use "arrive at the airport".',
  },
  {
    targetWord: 'for',
    wrong: 'I live in this city since five years.',
    correct: 'I have lived in this city for five years.',
    promptPt: 'Ajuste o tempo verbal e preposição de duração ("for" vs "since"):',
    ptTranslation: 'Eu moro nesta cidade há cinco anos.',
    hintPt: 'Dica: Para períodos de tempo (cinco anos), use "for" e o Present Perfect ("have lived").',
    explanationPt: 'Usamos "since" para pontos de partida (since 2020) e "for" para duração (for five years).',
  },
  {
    targetWord: 'told me',
    wrong: 'The waiter said me that the table was reserved.',
    correct: 'The waiter told me that the table was reserved.',
    promptPt: 'Ajuste o verbo de comunicação com pronome ("said" vs "told"):',
    ptTranslation: 'O garçom me disse que a mesa estava reservada.',
    hintPt: 'Dica: Use "told me" com pronome direto, ou "said to me" (nunca "said me").',
    explanationPt: 'O verbo "tell" recebe a pessoa diretamente: "told me". O verbo "say" exige "to": "said to me".',
  },
  {
    targetWord: 'discuss',
    wrong: 'We need to discuss about the budget in the meeting.',
    correct: 'We need to discuss the budget in the meeting.',
    promptPt: 'Elimine a preposição desnecessária após "discuss":',
    ptTranslation: 'Precisamos discutir o orçamento na reunião.',
    hintPt: 'Dica: O verbo "discuss" é transitivo direto: "discuss something" (sem "about").',
    explanationPt: 'Diferente de "talk about", o verbo "discuss" não leva a preposição "about".',
  },
  {
    targetWord: 'enjoy',
    wrong: 'I really enjoy to try new dishes when traveling.',
    correct: 'I really enjoy trying new dishes when traveling.',
    promptPt: 'Ajuste o verbo seguinte para a forma em "-ing" após "enjoy":',
    ptTranslation: 'Eu realmente gosto de experimentar novos pratos quando viajo.',
    hintPt: 'Dica: O verbo "enjoy" sempre exige o verbo seguinte com "-ing" (trying).',
    explanationPt: 'Em inglês, verbos como "enjoy", "avoid" e "finish" exigem o gerúndio no verbo subsequente.',
  },
  {
    targetWord: 'left',
    wrong: 'I forgot my wallet in the car this morning.',
    correct: 'I left my wallet in the car this morning.',
    promptPt: 'Ajuste o verbo ("deixar em algum local" é "leave / left", não "forget"):',
    ptTranslation: 'Eu deixei minha carteira no carro esta manhã.',
    hintPt: 'Dica: Quando você menciona o local onde esqueceu algo, use "left" (deixei), não "forgot".',
    explanationPt: 'Dizemos "I forgot my wallet" (esqueci), mas "I left my wallet in the car" quando especificamos o local.',
  },
  {
    targetWord: 'take for granted',
    wrong: 'You should never take your good health as granted.',
    correct: 'You should never take your good health for granted.',
    promptPt: 'Corrija a preposição da expressão fixa idiomática:',
    ptTranslation: 'Você nunca deve tomar sua boa saúde como algo garantido.',
    hintPt: 'Dica: A expressão idiomática correta é "take for granted" (com "for", nunca "as").',
    explanationPt: 'Expressão fixa: "take something for granted" significa valorizar menos por achar que sempre estará ali.',
  },
  {
    targetWord: 'need',
    wrong: 'All the employees needs to arrive on time.',
    correct: 'All the employees need to arrive on time.',
    promptPt: 'Ajuste a concordância do verbo no presente com sujeito plural:',
    ptTranslation: 'Todos os funcionários precisam chegar no horário.',
    hintPt: 'Dica: Sujeito no plural (they / employees) usa "need", sem o "-s".',
    explanationPt: 'O "-s" na terminação do verbo no Simple Present é exclusivo para 3ª pessoa do singular (he/she/it).',
  },
  {
    targetWord: 'care',
    wrong: 'I am not caring what negative people say.',
    correct: 'I do not care what negative people say.',
    promptPt: 'Ajuste o tempo verbal de sentimento para o Simple Present:',
    ptTranslation: 'Eu não me importo com o que pessoas negativas dizem.',
    hintPt: 'Dica: Verbos de atitude e estado mental usam "I do not care", não a forma contínua com "-ing".',
    explanationPt: 'Verbos de estado mental não aceitam tempos contínuos para expressar sentimentos gerais.',
  },
  {
    targetWord: 'order',
    wrong: 'I want to ask the bill, please.',
    correct: 'I would like to ask for the bill, please.',
    promptPt: 'Ajuste a expressão para pedir a conta educadamente:',
    ptTranslation: 'Eu gostaria de pedir a conta, por favor.',
    hintPt: 'Dica: "Pedir algo" é "ask for something" ("ask for the bill").',
    explanationPt: 'O verbo "ask" sem preposição significa "perguntar". Para "pedir algo", use "ask for".',
  },
];

/**
 * Builds 4 tactile matching pairs for match_pairs minigame.
 * Uses words from student class notes first, rotating starting offset with seed
 * and supplementing with thematic scenario pairs so that blocks NEVER repeat identical lists.
 */
function createMatchPairs(
  targetItem: ParsedVocabularyItem,
  allItems: ParsedVocabularyItem[],
  scenarioKey: DayScenarioKey,
  seed: number = 0
): MatchPair[] {
  const pairs: MatchPair[] = [];
  const targetWord = targetItem.english.trim();
  const targetPt = getNaturalMeaning(targetWord, targetItem.portuguese);

  pairs.push({
    id: `pair_0_${targetWord.toLowerCase().replace(/\s+/g, '_')}`,
    english: targetWord,
    portuguese: targetPt,
  });

  // Pick other words from student's items with offset seed
  const others = allItems.filter(
    (i) => i.english.trim().toLowerCase() !== targetWord.toLowerCase()
  );
  const countOthers = others.length;
  // If list is small (<= 5), pick target + at most 1 student word, so we have room for 2 thematic pairs rotated by seed.
  // This ensures Block 1, Block 2, Block 3, Block 4 never show the identical 4 pairs!
  const maxOthersFromStudent = allItems.length <= 5 ? 1 : 2;
  if (countOthers > 0) {
    for (let i = 0; i < countOthers; i++) {
      if (pairs.length >= 1 + maxOthersFromStudent) break;
      const other = others[(i + seed) % countOthers];
      const oEng = other.english.trim();
      const oPt = getNaturalMeaning(oEng, other.portuguese);
      if (!pairs.some((p) => p.english.toLowerCase() === oEng.toLowerCase())) {
        pairs.push({
          id: `pair_${pairs.length}_${oEng.toLowerCase().replace(/\s+/g, '_')}`,
          english: oEng,
          portuguese: oPt,
        });
      }
    }
  }

  // If fewer than 4 or for variety, supplement with scenario pairs offset by seed
  const THEMATIC_PAIRS: Record<DayScenarioKey, Array<[string, string]>> = {
    restaurant: [
      ['bill', 'conta do restaurante'],
      ['order', 'fazer o pedido'],
      ['delicious', 'muito saboroso'],
      ['table for two', 'mesa para dois'],
    ],
    family: [
      ['household', 'rotina da casa'],
      ['tradition', 'tradição familiar'],
      ['gather', 'reunir todos'],
      ['care', 'cuidado e afeto'],
    ],
    work: [
      ['deadline', 'prazo de entrega'],
      ['feedback', 'retorno de avaliação'],
      ['meeting', 'reunião de equipe'],
      ['priority', 'prioridade principal'],
    ],
    travel: [
      ['boarding pass', 'cartão de embarque'],
      ['luggage', 'bagagem de viagem'],
      ['smooth flight', 'voo tranquilo'],
      ['destination', 'destino da viagem'],
    ],
    friends: [
      ['hang out', 'passar tempo juntos'],
      ['catch up', 'colocar o papo em dia'],
      ['fun', 'muita diversão'],
      ['plans', 'planos pro fim de semana'],
    ],
    dating: [
      ['crush', 'paixonite ou paquera'],
      ['chemistry', 'sintonia mútua'],
      ['honest', 'sincero e aberto'],
      ['connection', 'conexão verdadeira'],
    ],
    city: [
      ['errands', 'tarefas do dia a dia'],
      ['grocery', 'compras de mercado'],
      ['downtown', 'centro da cidade'],
      ['convenient', 'prático e acessível'],
    ],
  };

  const pool = THEMATIC_PAIRS[scenarioKey] || THEMATIC_PAIRS.restaurant;
  for (let i = 0; i < pool.length; i++) {
    if (pairs.length >= 4) break;
    const [eng, pt] = pool[(i + seed) % pool.length];
    if (!pairs.some((p) => p.english.toLowerCase() === eng.toLowerCase())) {
      pairs.push({
        id: `pair_theme_${pairs.length}_${eng.replace(/\s+/g, '_')}`,
        english: eng,
        portuguese: pt,
      });
    }
  }

  // Shuffle order of pairs so tiles appear in different places
  return pairs.slice(0, 4).sort(() => 0.5 - Math.random());
}

/**
 * Generates bespoke, authentic sentences tailored to the Day's Scenario.
 * Eliminates repetitive cookie-cutter templates completely!
 */
function createRichSentences(
  item: ParsedVocabularyItem,
  seedIndex: number,
  scenarioKey: DayScenarioKey = 'restaurant',
  allItems: ParsedVocabularyItem[] = []
): RichSentenceBundle {
  const rawWord = item.english || '';
  const word = rawWord.replace(/^[-–—:;,\s]+|[-–—:;,\s]+$/g, '').trim();
  const rawMeaning = item.portuguese?.trim() || '';
  const nat = getNaturalMeaning(word, rawMeaning);
  const category = categorizeWord(word);
  const pairs = createMatchPairs({ ...item, english: word }, allItems, scenarioKey, seedIndex);

  // Check Curated Vocabulary Sentence Registry first for native, idiomatic precision
  const normWord = word.toLowerCase().trim();
  const curated = VOCAB_SENTENCE_REGISTRY[normWord];
  if (curated) {
    const mcOptions = [
      curated.sentences.mcExpected,
      ...getScenarioMCDistractors(scenarioKey, curated.sentences.mcExpected, 2),
    ].sort(() => 0.5 - Math.random());

    const fbOptions = [
      curated.sentences.fbExpected,
      ...curated.sentences.fbDistractors.filter(
        (d) => d.toLowerCase() !== curated.sentences.fbExpected.toLowerCase()
      ),
    ].slice(0, 3).sort(() => 0.5 - Math.random());

    let gfWrong = `I always ${word} in an unnatural way.`;
    let gfCorrect = curated.sentences.svSentence;
    let gfPrompt = `Ajuste para a frase correta:`;
    let gfPt = curated.sentences.svPt;
    let gfHint = `Dica: Use a estrutura idiomática em inglês.`;
    let gfExplanation = `Estrutura natural e autêntica.`;

    if (normWord === 'not caring') {
      gfWrong = 'I am not caring what other people think.';
      gfCorrect = 'I do not care what other people think.';
      gfPrompt = 'Corrija o tempo verbal (verbos de estado e sentimento usam Simple Present):';
      gfPt = 'Eu não me importo com o que as outras pessoas pensam.';
      gfHint = 'Dica: Verbos de sentimento usam o Simple Present ("I don\'t care"), não o continuous.';
      gfExplanation = 'Em inglês usamos "I don\'t care" para expressar atitude geral ou sentimento.';
    } else if (normWord === 'employees' || normWord === 'employee') {
      gfWrong = 'All the employees needs to attend the weekly sync.';
      gfCorrect = 'All the employees need to attend the weekly sync.';
      gfPrompt = 'Ajuste a concordância de plural ("employees" com verbo no infinitivo):';
      gfPt = 'Todos os funcionários precisam participar do alinhamento semanal.';
      gfHint = 'Dica: Sujeito no plural (they / employees) usa "need", sem o "-s" do singular.';
      gfExplanation = 'O sufixo "-s" no presente simples (needs) é exclusivo da 3ª pessoa do singular (he/she). No plural, usamos "need".';
    } else if (normWord === 'near') {
      gfWrong = 'The cafe is located near of my house.';
      gfCorrect = 'The cafe is located near my house.';
      gfPrompt = 'Elimine a preposição incorreta após "near":';
      gfPt = 'O café fica localizado perto da minha casa.';
      gfHint = 'Dica: Em inglês "near" não usa a preposição "of" ("near my house", nunca "near of").';
      gfExplanation = 'Diferente do português ("perto de"), em inglês "near" não leva a preposição "of".';
    } else if (normWord === 'speak up') {
      gfWrong = 'He said me that I should speak up.';
      gfCorrect = 'He told me that I should speak up.';
      gfPrompt = 'Ajuste o verbo de comunicação com pronome ("say" vs "tell"):';
      gfPt = 'Ele me disse que eu deveria falar abertamente.';
      gfHint = 'Dica: Usamos "tell someone" com pronome direto (told me), e "say to someone" (nunca "say me").';
      gfExplanation = 'O verbo "tell" recebe o objeto direto da pessoa ("told me"), enquanto "say" exige preposição ("said to me").';
    } else if (normWord === 'look forward to') {
      gfWrong = 'I look forward to meet you next week.';
      gfCorrect = 'I look forward to meeting you next week.';
      gfPrompt = 'Ajuste o verbo após a preposição "to" na expressão:';
      gfPt = 'Aguardo ansiosamente encontrar você na próxima semana.';
      gfHint = 'Dica: Na expressão "look forward to", "to" é preposição, exigindo verbo com "-ing".';
      gfExplanation = 'Após preposições em inglês (inclusive o "to" de look forward to), o verbo seguinte fica no gerúndio: "meeting".';
    } else if (normWord === 'take for granted') {
      gfWrong = 'You should not take your partner as granted.';
      gfCorrect = 'You should not take your partner for granted.';
      gfPrompt = 'Corrija a preposição fixa da expressão idiomática:';
      gfPt = 'Você não deve tomar seu parceiro como garantido.';
      gfHint = 'Dica: A expressão correta em inglês é "take for granted" (com "for", nunca "as").';
      gfExplanation = 'Expressão fixa idiomática: "take someone for granted".';
    }

    return {
      multipleChoice: {
        scenarioPt: curated.sentences.mcScenario,
        promptPt: curated.sentences.mcPrompt,
        expectedAnswer: curated.sentences.mcExpected,
        options: mcOptions,
        ptTranslation: curated.sentences.mcPt,
        hintPt: `Dica: Pense no significado de "${curated.meaningPt}".`,
        explanationPt: `Expressão autêntica e comum usada por falantes nativos de inglês.`,
      },
      matchPairs: {
        pairs,
        hintPt: `Dica: Ligue cada termo ao seu significado correspondente em português.`,
      },
      fillBlank: {
        sentenceWithBlank: curated.sentences.fbBlank,
        expectedAnswer: curated.sentences.fbExpected,
        options: fbOptions,
        ptTranslation: curated.sentences.fbPt,
        hintPt: `Dica: Escolha "${curated.sentences.fbExpected}" (${curated.meaningPt}) para completar.`,
        explanationPt: `A palavra "${curated.sentences.fbExpected}" se encaixa com perfeição gramatical e contexto.`,
      },
      speakVerify: {
        sentence: curated.sentences.svSentence,
        ptTranslation: curated.sentences.svPt,
        hintPt: `Dica: Fale no microfone com ritmo pausado e natural.`,
        explanationPt: `Pronúncia impecável! Essa frase é excelente para destravar o ritmo de fala.`,
      },
      roleplayPrompt: {
        leoPrompt: curated.sentences.rpLeo,
        promptPt: curated.sentences.rpLeoPt,
        expectedAnswer: curated.sentences.rpAnswer,
        ptTranslation: curated.sentences.rpPt,
        hintPt: `Dica: Responda ao Leo incluindo "${word}".`,
      },
      sentenceBuild: {
        english: curated.sentences.mcExpected,
        ptTranslation: curated.sentences.mcPt,
        promptPt: `Monte: "${curated.sentences.mcPt}"`,
        hintPt: `Dica: Organize as palavras na ordem natural em inglês.`,
        distractors: curated.sentences.fbDistractors,
      },
      listenType: {
        sentence: curated.sentences.svSentence,
        ptTranslation: curated.sentences.svPt,
        hintPt: `Dica: Ouça com atenção a entonação da frase.`,
      },
      grammarFix: {
        wrong: gfWrong,
        correct: gfCorrect,
        promptPt: gfPrompt,
        ptTranslation: gfPt,
        hintPt: gfHint,
        explanationPt: gfExplanation,
      },
    };
  }

  // 100% Bespoke, Natural Scenarios Tailored to Category (Zero cookie-cutter Mad-Libs templates!)
  let mcScenario = '';
  let mcPrompt = '';
  let mcExpected = '';
  let mcPt = '';
  let fbBlank = '';
  let fbAnswer = word;
  let fbPt = '';
  let svSentence = '';
  let svPt = '';
  let rpLeo = '';
  let rpLeoPt = '';
  let rpAnswer = '';
  let rpPt = '';
  let sbDistractors = ['always', 'time', 'with'];
  let gfWrong = '';
  let gfCorrect = '';
  let gfPrompt = '';
  let gfPt = '';
  let gfHint = '';
  let gfExplanation = '';

  switch (scenarioKey) {
    case 'restaurant': {
      // Day 1: Restaurante & Café
      mcScenario = `No restaurante ou cafeteria: Você precisa se comunicar sobre "${nat}".`;
      mcPrompt = `Qual frase expressa essa intenção da forma mais educada e natural em inglês?`;
      gfWrong = 'Can you explain me the menu, please?';
      gfCorrect = 'Can you explain the menu to me, please?';
      gfPrompt = 'Ajuste a preposição correta com o verbo "explain":';
      gfPt = 'Você pode me explicar o cardápio, por favor?';
      gfHint = 'Dica: Em inglês dizemos "explain something to me" (nunca "explain me").';
      gfExplanation = 'O verbo "explain" exige a preposição "to" antes do pronome: "explain to me".';
      sbDistractors = ['table', 'coffee', 'menu'];

      if (category === 'people') {
        mcExpected = `The attentive ${word} at this bistro always make guests feel completely welcome.`;
        mcPt = `Os(as) atenciosos(as) ${nat} neste bistrô sempre fazem os clientes se sentirem bem-vindos.`;
        fbBlank = 'The dinner service was great because the ______ were so polite and helpful.';
        fbPt = `O serviço do jantar foi ótimo porque os(as) ${nat} foram muito educados e prestativos.`;
        svSentence = `The ${word} were extremely courteous tonight.`;
        svPt = `Os(as) ${nat} foram extremamente corteses hoje à noite.`;
        rpLeo = 'Welcome to our restaurant! How can our staff help make your dinner wonderful tonight?';
        rpLeoPt = `Leo é o garçom e pergunta: "Como nossa equipe pode ajudar a tornar seu jantar maravilhoso?" Responda usando "${word}":`;
        rpAnswer = `We want to thank all the ${word} for an outstanding meal.`;
        rpPt = `Queremos agradecer a todos os(as) ${nat} por uma refeição maravilhosa.`;
      } else if (category === 'location') {
        mcExpected = `Could we please get a quiet table located ${word} the window?`;
        mcPt = `Poderíamos por favor ter uma mesa tranquila localizada ${nat} da janela?`;
        fbBlank = 'We reserved a lovely dinner table located ______ the terrace garden.';
        fbPt = `Reservamos uma adorável mesa de jantar localizada ${nat} do jardim da varanda.`;
        svSentence = `We prefer sitting ${word} the window.`;
        svPt = `Preferimos sentar ${nat} da janela.`;
        rpLeo = 'Where in our dining room would you prefer to sit for your lunch today?';
        rpLeoPt = `Leo pergunta: "Onde em nosso salão você prefere se sentar hoje?" Responda usando "${word}":`;
        rpAnswer = `We would love a table located ${word} the garden view.`;
        rpPt = `Adoraríamos uma mesa localizada ${nat} da vista para o jardim.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `We always enjoy taking time to ${word} over a warm cup of coffee.`;
        mcPt = `Nós sempre gostamos de dedicar tempo para ${nat} com uma xícara de café quente.`;
        fbBlank = 'It is always wonderful to ______ with friends over good food and coffee.';
        fbPt = `É sempre maravilhoso ${nat} com amigos saboreando boa comida e café.`;
        svSentence = 'Good food is worth enjoying together.';
        svPt = 'Comida boa vale a pena aproveitar juntos.';
        rpLeo = 'What is your favorite food to enjoy when you go out to relax?';
        rpLeoPt = `Leo pergunta: "Qual sua comida favorita para saborear quando sai para relaxar?" Responda usando "${word}":`;
        rpAnswer = `I love going out to ${word} at quiet cafes on weekends.`;
        rpPt = `Eu adoro sair para ${nat} em cafés tranquilos nos fins de semana.`;
      } else if (category === 'adjective') {
        mcExpected = `The food and atmosphere here are wonderfully ${word} tonight.`;
        mcPt = `A comida e o ambiente aqui estão incrivelmente ${nat} hoje à noite.`;
        fbBlank = 'The chef prepared a special dish that was so ______ that we ordered another one.';
        fbPt = `O chef preparou um prato especial que estava tão ${nat} que pedimos outro.`;
        svSentence = `Everything was delightfully ${word} tonight.`;
        svPt = `Tudo estava deliciosamente ${nat} hoje à noite.`;
        rpLeo = 'How did you enjoy our chef\'s signature special tonight?';
        rpLeoPt = `Leo pergunta: "O que você achou do prato do nosso chef?" Responda usando "${word}":`;
        rpAnswer = `The house special was very ${word} and flavorful.`;
        rpPt = `O especial da casa estava muito ${nat} e saboroso.`;
      } else if (category === 'adverb') {
        mcExpected = `We are ${word} ready to order our main courses from the menu.`;
        mcPt = `Nós estamos ${nat} prontos para pedir nossos pratos principais do cardápio.`;
        fbBlank = 'We are ______ ready to order our dinner now.';
        fbPt = `Nós estamos ${nat} prontos para pedir nosso jantar agora.`;
        svSentence = `We are ${word} ready to order.`;
        svPt = `Estamos ${nat} prontos para pedir.`;
        rpLeo = 'Are you ready to place your dinner order, or do you need a minute?';
        rpLeoPt = `Leo pergunta: "Você está pronto para pedir ou precisa de um minuto?" Responda usando "${word}":`;
        rpAnswer = `We are ${word} ready to choose our main courses.`;
        rpPt = `Estamos ${nat} prontos para escolher nossos pratos principais.`;
      } else if (category === 'clause_i') {
        mcExpected = `When looking at the menu, ${word} to try the chef\'s special tonight.`;
        mcPt = `Olhando o cardápio, ${nat} experimentar o especial do chef hoje à noite.`;
        fbBlank = 'When looking at the menu, ______ to try the chef\'s special.';
        fbPt = `Olhando o cardápio, ${nat} experimentar o especial do chef.`;
        svSentence = 'I would like to order the house special.';
        svPt = 'Eu gostaria de pedir o especial da casa.';
        rpLeo = 'Welcome! What would you like to order for dinner tonight?';
        rpLeoPt = `Leo pergunta o que você gostaria de pedir. Responda usando "${word}":`;
        rpAnswer = `I am ready, ${word} to order the grilled salmon.`;
        rpPt = `Estou pronto, ${nat} pedir o salmão grelhado.`;
      } else {
        mcExpected = `Excuse me, could you give us more details about the ${word} on the menu?`;
        mcPt = `Com licença, você poderia nos dar mais detalhes sobre o(a) ${nat} no cardápio?`;
        fbBlank = 'Could you please bring us the updated ______ for our table?';
        fbPt = `Você poderia por favor nos trazer o(a) ${nat} atualizado(a) para nossa mesa?`;
        svSentence = `Could we please check the ${word}?`;
        svPt = `Poderíamos por favor verificar o(a) ${nat}?`;
        rpLeo = 'Do you have any questions about the menu or our specials tonight?';
        rpLeoPt = `Leo pergunta se você tem dúvidas sobre o cardápio. Responda usando "${word}":`;
        rpAnswer = `I would like to ask about the ${word} before ordering.`;
        rpPt = `Gostaria de saber sobre o(a) ${nat} antes de pedir.`;
      }
      break;
    }

    case 'family': {
      // Day 2: Família, Casa & Convivência
      mcScenario = `Em família: Conversando com parentes sobre rotina da casa e afeto sobre "${nat}".`;
      mcPrompt = `Como expressar essa ideia de forma carinhosa e natural em família?`;
      gfWrong = 'I live in this house since five years.';
      gfCorrect = 'I have lived in this house for five years.';
      gfPrompt = 'Ajuste a estrutura temporal correta ("for" vs "since"):';
      gfPt = 'Eu moro nesta casa há cinco anos.';
      gfHint = 'Dica: Para períodos de duração ("há cinco anos") usamos "for" com present perfect.';
      gfExplanation = 'Usamos "for" para duração de tempo (for 5 years) e "since" para o ponto de partida (since 2021).';
      sbDistractors = ['dinner', 'home', 'together'];

      if (category === 'people') {
        mcExpected = `We love cooking Sunday lunch together for all our beloved ${word}.`;
        mcPt = `Adoramos cozinhar o almoço de domingo para todos os nossos queridos ${nat}.`;
        fbBlank = 'Our home is always open and welcoming for our dear ______.';
        fbPt = `Nossa casa é sempre aberta e acolhedora para nossos queridos ${nat}.`;
        svSentence = `Family moments with our ${word} are precious.`;
        svPt = `Momentos em família com nossos(as) ${nat} são preciosos.`;
        rpLeo = 'What is your favorite family routine or holiday tradition?';
        rpLeoPt = `Leo pergunta sobre sua rotina em família. Responda usando "${word}":`;
        rpAnswer = `Spending quality time with my ${word} brings me true peace.`;
        rpPt = `Passar tempo de qualidade com meus(minhas) ${nat} me traz verdadeira paz.`;
      } else if (category === 'location') {
        mcExpected = `My family loves having a peaceful green park located ${word} our home.`;
        mcPt = `Minha família adora ter um parque verde e tranquilo localizado ${nat} de nossa casa.`;
        fbBlank = 'We enjoy evening walks because the lake is located ______ our house.';
        fbPt = `Aproveitamos caminhadas noturnas porque o lago fica localizado ${nat} de nossa casa.`;
        svSentence = `Our home is located ${word} a quiet park.`;
        svPt = `Nossa casa fica localizada ${nat} de um parque tranquilo.`;
        rpLeo = 'What do you enjoy doing around your neighborhood on weekends?';
        rpLeoPt = `Leo pergunta o que você gosta de fazer no seu bairro. Responda usando "${word}":`;
        rpAnswer = `We often visit the local market located ${word} our house.`;
        rpPt = `Costumamos visitar a feira localizada ${nat} de nossa casa.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `Our family always enjoys finding quiet moments to ${word} together at home.`;
        mcPt = `Nossa família sempre gosta de encontrar momentos tranquilos para ${nat} juntos em casa.`;
        fbBlank = 'In a loving household, taking time to ______ strengthens our family bond.';
        fbPt = `Em um lar amoroso, dedicar tempo para ${nat} fortalece nosso laço familiar.`;
        svSentence = 'We always support each other as a family.';
        svPt = 'Nós sempre apoiamos uns aos outros em família.';
        rpLeo = 'How does your family support each other during busy or stressful weeks?';
        rpLeoPt = `Leo pergunta como sua família se apoia em momentos corridos. Responda usando "${word}":`;
        rpAnswer = `On weekends we make sure to ${word} and listen to each other.`;
        rpPt = `Aos fins de semana nós fazemos questão de ${nat} e ouvir uns aos outros.`;
      } else if (category === 'adjective') {
        mcExpected = `Our home always feels so ${word} whenever the family gathers for dinner.`;
        mcPt = `Nossa casa sempre parece tão ${nat} sempre que a família se reúne para o jantar.`;
        fbBlank = 'Our family traditions keep our home warm, welcoming, and ______.';
        fbPt = `Nossas tradições familiares mantêm nossa casa acolhedora, afetuosa e ${nat}.`;
        svSentence = `Our home feels wonderfully ${word} today.`;
        svPt = `Nossa casa parece incrivelmente ${nat} hoje.`;
        rpLeo = 'What makes your home feel welcoming and comfortable for your loved ones?';
        rpLeoPt = `Leo pergunta o que torna seu lar acolhedor. Responda usando "${word}":`;
        rpAnswer = `My family always makes our home feel safe and ${word}.`;
        rpPt = `Minha família sempre faz nosso lar parecer seguro e ${nat}.`;
      } else if (category === 'adverb') {
        mcExpected = `Our family is ${word} preparing Sunday dinner together in the kitchen.`;
        mcPt = `Nossa família está ${nat} preparando o jantar de domingo junta na cozinha.`;
        fbBlank = 'Our family is ______ preparing Sunday dinner together.';
        fbPt = `Nossa família está ${nat} preparando o jantar de domingo junta.`;
        svSentence = `We are ${word} catching up together.`;
        svPt = `Estamos ${nat} colocando a conversa em dia juntos.`;
        rpLeo = 'How do you spend your Sunday afternoons with family?';
        rpLeoPt = `Leo pergunta como são suas tardes de domingo em família. Responda usando "${word}":`;
        rpAnswer = `We are ${word} organizing our family holiday plans.`;
        rpPt = `Estamos ${nat} organizando nossos planos de férias em família.`;
      } else if (category === 'clause_i') {
        mcExpected = `Every Sunday ${word} cooking lunch for the whole family.`;
        mcPt = `Todo domingo ${nat} cozinhar o almoço para a família inteira.`;
        fbBlank = 'On peaceful weekends, ______ relaxing at home with my loved ones.';
        fbPt = `Em fins de semana tranquilos, ${nat} relaxar em casa com quem eu amo.`;
        svSentence = 'I enjoy relaxing at home with my family.';
        svPt = 'Gosto de relaxar em casa com a minha família.';
        rpLeo = 'What is your favorite weekend activity at home?';
        rpLeoPt = `Leo pergunta sua atividade favorita em casa. Responda usando "${word}":`;
        rpAnswer = `On weekends ${word} spending quiet moments at home.`;
        rpPt = `Nos fins de semana ${nat} passar momentos tranquilos em casa.`;
      } else {
        mcExpected = `Everyone in our house contributes to maintaining our family ${word}.`;
        mcPt = `Todos em nossa casa contribuem para manter nosso(a) ${nat} familiar.`;
        fbBlank = 'Sharing household tasks helps build a healthy family ______.';
        fbPt = `Dividir as tarefas da casa ajuda a construir um(a) ${nat} familiar saudável.`;
        svSentence = `We respect our daily family ${word}.`;
        svPt = `Nós respeitamos nosso(a) ${nat} diário(a) em família.`;
        rpLeo = 'What is an important routine or habit in your household?';
        rpLeoPt = `Leo pergunta sobre um hábito importante na sua casa. Responda usando "${word}":`;
        rpAnswer = `Maintaining a healthy ${word} is important for our family.`;
        rpPt = `Manter um(a) ${nat} saudável é importante para a nossa família.`;
      }
      break;
    }

    case 'work': {
      // Day 3: Trabalho, Reuniões & Carreira
      mcScenario = `No ambiente de trabalho: Alinhando entregas e colaboração sobre "${nat}".`;
      mcPrompt = `Qual frase expressa essa intenção com tom profissional, claro e colaborativo?`;
      gfWrong = 'All the employees needs to attend the weekly sync.';
      gfCorrect = 'All the employees need to attend the weekly sync.';
      gfPrompt = 'Ajuste a concordância de plural ("employees" com verbo no infinitivo):';
      gfPt = 'Todos os funcionários precisam participar do alinhamento semanal.';
      gfHint = 'Dica: Sujeito no plural (they / employees) usa "need", sem o "-s" do singular.';
      gfExplanation = 'O sufixo "-s" no presente simples (needs) é exclusivo da 3ª pessoa do singular (he/she).';
      sbDistractors = ['deadline', 'meeting', 'project'];

      if (category === 'people') {
        mcExpected = `Our leadership team organized an open workshop to support all dedicated ${word}.`;
        mcPt = `Nossa liderança organizou um workshop aberto para apoiar todos os(as) ${nat} dedicados(as).`;
        fbBlank = 'Good managers always listen to and value their hard-working ______.';
        fbPt = `Bons gestores sempre ouvem e valorizam seus(suas) ${nat} dedicados(as).`;
        svSentence = `Our team supports all ${word} with clear goals.`;
        svPt = `Nossa equipe apoia todos os(as) ${nat} com metas claras.`;
        rpLeo = 'How does your workplace maintain positive team morale during busy quarters?';
        rpLeoPt = `Leo pergunta como manter o bom ânimo da equipe. Responda usando "${word}":`;
        rpAnswer = `Treating all ${word} with respect creates a healthy workplace culture.`;
        rpPt = `Tratar todos os(as) ${nat} com respeito cria uma cultura positiva no trabalho.`;
      } else if (category === 'location') {
        mcExpected = `Our corporate office is conveniently located very ${word} the central station.`;
        mcPt = `Nosso escritório corporativo fica convenientemente localizado bem ${nat} da estação central.`;
        fbBlank = 'We scheduled the client meeting at a conference room ______ the train station.';
        fbPt = `Marcamos a reunião com o cliente em uma sala de conferências ${nat} da estação de trem.`;
        svSentence = `Our office is located ${word} the station.`;
        svPt = `Nosso escritório fica localizado ${nat} da estação.`;
        rpLeo = 'How convenient is your office location for client meetings and team syncs?';
        rpLeoPt = `Leo pergunta sobre a localização do seu escritório. Responda usando "${word}":`;
        rpAnswer = `Our office is conveniently located ${word} public transportation.`;
        rpPt = `Nosso escritório é convenientemente localizado ${nat} do transporte público.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `In professional projects, learning to ${word} ensures smooth team collaboration.`;
        mcPt = `Em projetos profissionais, aprender a ${nat} garante uma colaboração tranquila em equipe.`;
        fbBlank = 'When working under tight deadlines, ______ about quality causes serious delays.';
        fbPt = `Ao trabalhar com prazos apertados, ${nat} quanto à qualidade causa sérios atrasos.`;
        svSentence = 'Clear communication prevents misunderstandings.';
        svPt = 'Comunicação clara evita mal-entendidos.';
        rpLeo = 'How do you handle challenging deadlines when working on team deliverables?';
        rpLeoPt = `Leo pergunta como você lida com prazos desafiadores. Responda usando "${word}":`;
        rpAnswer = `I focus on taking responsibility rather than ${word} in meetings.`;
        rpPt = `Eu foco em assumir responsabilidade em vez de ${nat} em reuniões.`;
      } else if (category === 'adjective') {
        mcExpected = `The entire project team remained remarkably ${word} despite the tight schedule.`;
        mcPt = `A equipe inteira do projeto permaneceu incrivelmente ${nat} apesar do cronograma apertado.`;
        fbBlank = 'The workload was demanding, but the team remained focused and ______.';
        fbPt = `A carga de trabalho foi exigente, mas a equipe permaneceu focada e ${nat}.`;
        svSentence = `The team stayed calm and ${word}.`;
        svPt = `A equipe permaneceu calma e ${nat}.`;
        rpLeo = 'How do you keep your focus and productivity during busy work weeks?';
        rpLeoPt = `Leo pergunta como você mantém foco e produtividade. Responda usando "${word}":`;
        rpAnswer = `I stay organized and ${word} during demanding project sprints.`;
        rpPt = `Eu permaneço organizado e ${nat} durante etapas exigentes do projeto.`;
      } else if (category === 'adverb') {
        mcExpected = `The project team is ${word} finalizing the key deliverables for tomorrow.`;
        mcPt = `A equipe do projeto está ${nat} finalizando as entregas principais para amanhã.`;
        fbBlank = 'The team is ______ reviewing the quarterly project reports.';
        fbPt = `A equipe está ${nat} revisando os relatórios trimestrais do projeto.`;
        svSentence = `We are ${word} completing the task.`;
        svPt = `Estamos ${nat} concluindo a tarefa.`;
        rpLeo = 'What is your highest priority at work before the end of the week?';
        rpLeoPt = `Leo pergunta sua maior prioridade no trabalho. Responda usando "${word}":`;
        rpAnswer = `We are ${word} aligning the project milestones before the deadline.`;
        rpPt = `Estamos ${nat} alinhando os marcos do projeto antes do prazo.`;
      } else if (category === 'clause_i') {
        mcExpected = `So far ${word} organizing my priorities for the current sprint.`;
        mcPt = `Até agora ${nat} organizar minhas prioridades para o projeto atual.`;
        fbBlank = 'During every project meeting, ______ sharing clear status updates.';
        fbPt = `Em toda reunião de projeto, ${nat} compartilhar atualizações claras.`;
        svSentence = 'Let us schedule a quick call today.';
        svPt = 'Vamos marcar uma ligação rápida hoje.';
        rpLeo = 'What is your current strategy for managing your daily deliverables?';
        rpLeoPt = `Leo pergunta sua estratégia para gerenciar entregas. Responda usando "${word}":`;
        rpAnswer = `Today ${word} focusing on key deliverables for the team.`;
        rpPt = `Hoje ${nat} focar nas entregas principais para a equipe.`;
      } else {
        mcExpected = `Let us schedule a team alignment to review our updated project ${word}.`;
        mcPt = `Vamos agendar um alinhamento de equipe para revisar nosso(a) ${nat} atualizado(a) do projeto.`;
        fbBlank = 'Please send me the updated project ______ before our team sync.';
        fbPt = `Por favor, me envie o(a) ${nat} atualizado(a) do projeto antes do nosso alinhamento.`;
        svSentence = `Let us review our updated ${word}.`;
        svPt = `Vamos revisar nosso(a) ${nat} atualizado(a).`;
        rpLeo = 'What is your main focus today at the office?';
        rpLeoPt = `Leo pergunta seu foco principal no trabalho hoje. Responda usando "${word}":`;
        rpAnswer = `My top priority is managing our ${word} effectively with the team.`;
        rpPt = `Minha prioridade máxima é gerenciar nosso(a) ${nat} com eficácia com a equipe.`;
      }
      break;
    }

    case 'travel': {
      // Day 4: Viagens, Aeroporto & Férias
      mcScenario = `Em viagens e aeroporto: Circulando pelo mundo e resolvendo situações sobre "${nat}".`;
      mcPrompt = `Qual frase em inglês expressa essa intenção com máxima clareza e naturalidade?`;
      gfWrong = 'I arrived to the airport two hours before departure.';
      gfCorrect = 'I arrived at the airport two hours before departure.';
      gfPrompt = 'Corrija a preposição com o verbo "arrive":';
      gfPt = 'Cheguei ao aeroporto duas horas antes do embarque.';
      gfHint = 'Dica: Em inglês dizemos "arrive at" para locais específicos como aeroporto, hotel ou estação.';
      gfExplanation = 'Usamos "arrive at" para prédios e locais fechados, e "arrive in" para cidades ou países. Nunca "arrive to".';
      sbDistractors = ['flight', 'ticket', 'airport'];

      if (category === 'people') {
        mcExpected = `The friendly airline ${word} helped us navigate through the terminal easily.`;
        mcPt = `Os(as) simpáticos(as) ${nat} da companhia aérea nos ajudaram a circular pelo terminal facilmente.`;
        fbBlank = 'We asked the airport ______ for directions to the baggage claim carousel.';
        fbPt = `Perguntamos aos(às) ${nat} do aeroporto sobre o caminho para a esteira de bagagens.`;
        svSentence = `The flight ${word} were very attentive.`;
        svPt = `Os(as) ${nat} do voo foram muito atenciosos.`;
        rpLeo = 'How was your experience dealing with airport and hotel staff during your travels?';
        rpLeoPt = `Leo pergunta sobre o atendimento no aeroporto e hotel. Responda usando "${word}":`;
        rpAnswer = `The local ${word} gave us fantastic sightseeing recommendations.`;
        rpPt = `Os(as) ${nat} locais nos deram recomendações fantásticas de passeios.`;
      } else if (category === 'location') {
        mcExpected = `Our hotel is conveniently located ${word} the international airport terminal.`;
        mcPt = `Nosso hotel fica convenientemente localizado ${nat} do terminal do aeroporto internacional.`;
        fbBlank = 'We chose a charming boutique hotel located ______ the historic town square.';
        fbPt = `Escolhemos um charmoso hotel boutique localizado ${nat} da praça histórica.`;
        svSentence = 'Our flight departed on time.';
        svPt = 'Nosso voo partiu no horário.';
        rpLeo = 'What do you consider most important when choosing hotel accommodations?';
        rpLeoPt = `Leo pergunta o que você mais considera ao escolher hotel. Responda usando "${word}":`;
        rpAnswer = `I always look for accommodations located ${word} public transportation.`;
        rpPt = `Eu sempre procuro hospedagens localizadas ${nat} do transporte público.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `I always look forward to traveling abroad and taking time to ${word}.`;
        mcPt = `Eu sempre aguardo ansiosamente viajar para o exterior e dedicar tempo para ${nat}.`;
        fbBlank = 'Travelers always love to ______ when visiting vibrant international destinations.';
        fbPt = `Viajantes sempre adoram ${nat} ao visitar destinos internacionais vibrantes.`;
        svSentence = 'Exploring new places is exciting.';
        svPt = 'Explorar novos lugares é emocionante.';
        rpLeo = 'What is your favorite part of traveling to a new foreign city?';
        rpLeoPt = `Leo pergunta sua parte favorita ao viajar para uma cidade nova. Responda usando "${word}":`;
        rpAnswer = `When traveling I love to ${word} and discover authentic local food.`;
        rpPt = `Ao viajar eu adoro ${nat} e descobrir comidas locais autênticas.`;
      } else if (category === 'adjective') {
        mcExpected = `Our hotel room was clean, quiet, and wonderfully ${word} after the long flight.`;
        mcPt = `Nosso quarto de hotel era limpo, tranquilo e incrivelmente ${nat} após o voo longo.`;
        fbBlank = 'The flight was very smooth and our journey felt completely ______.';
        fbPt = `O voo foi muito tranquilo e nossa jornada pareceu completamente ${nat}.`;
        svSentence = `The trip was wonderfully ${word}.`;
        svPt = `A viagem foi incrivelmente ${nat}.`;
        rpLeo = 'How was your recent flight or vacation journey?';
        rpLeoPt = `Leo pergunta como foi sua viagem recente. Responda usando "${word}":`;
        rpAnswer = `Our journey was very smooth, comfortable, and ${word}.`;
        rpPt = `Nossa jornada foi muito suave, confortável e ${nat}.`;
      } else if (category === 'adverb') {
        mcExpected = `The airport shuttle is ${word} arriving at terminal two for passenger pickup.`;
        mcPt = `O transporte do aeroporto está ${nat} chegando ao terminal dois para pegar passageiros.`;
        fbBlank = 'The airport shuttle is ______ arriving at terminal two.';
        fbPt = `O transporte do aeroporto está ${nat} chegando ao terminal dois.`;
        svSentence = `The shuttle is ${word} arriving.`;
        svPt = `O transporte está ${nat} chegando.`;
        rpLeo = 'Are you ready for your next flight departure?';
        rpLeoPt = `Leo pergunta se você está pronto para o próximo voo. Responda usando "${word}":`;
        rpAnswer = `We are ${word} heading to our departure gate.`;
        rpPt = `Estamos ${nat} indo para o nosso portão de embarque.`;
      } else if (category === 'clause_i') {
        mcExpected = `Whenever I travel ${word} arriving at the airport well in advance.`;
        mcPt = `Sempre que viajo ${nat} chegar ao aeroporto com bastante antecedência.`;
        fbBlank = 'When arriving in a new city, ______ exploring local markets on foot.';
        fbPt = `Ao chegar a uma nova cidade, ${nat} explorar os mercados a pé.`;
        svSentence = 'I enjoy exploring new destinations.';
        svPt = 'Gosto de explorar novos destinos.';
        rpLeo = 'Where do you plan to travel next, and what do you do first upon arrival?';
        rpLeoPt = `Leo pergunta para onde você planeja viajar. Responda usando "${word}":`;
        rpAnswer = `When traveling ${word} discovering new cultures and authentic foods.`;
        rpPt = `Ao viajar ${nat} descobrir novas culturas e comidas autênticas.`;
      } else {
        mcExpected = `Please keep your travel ${word} and boarding pass safe in your carry-on bag.`;
        mcPt = `Por favor mantenha seu(sua) ${nat} de viagem e cartão de embarque seguros na mala de mão.`;
        fbBlank = 'Always double-check your travel ______ before arriving at the airport counter.';
        fbPt = `Sempre confira duas vezes seu(sua) ${nat} de viagem antes de chegar ao balcão do aeroporto.`;
        svSentence = `Keep your travel ${word} ready.`;
        svPt = `Mantenha seu(sua) ${nat} de viagem pronto(a).`;
        rpLeo = 'What is the first thing you double-check before leaving for the airport?';
        rpLeoPt = `Leo pergunta o que você confere antes de ir para o aeroporto. Responda usando "${word}":`;
        rpAnswer = `I always double-check my ${word} before heading to the terminal.`;
        rpPt = `Eu sempre confiro duas vezes meu(minha) ${nat} antes de ir para o terminal.`;
      }
      break;
    }

    case 'friends': {
      // Day 5: Rolê com Amigos & Lazer
      mcScenario = `Com amigos no fim de semana: Combinando saídas e conversando sobre "${nat}".`;
      mcPrompt = `Qual frase expressa essa ideia de forma descontraída, casual e acolhedora?`;
      gfWrong = 'I like very much to hang out with my close friends.';
      gfCorrect = 'I really like hanging out with my close friends.';
      gfPrompt = 'Ajuste a posição natural de "really like" na frase:';
      gfPt = 'Eu realmente gosto de sair com meus amigos próximos.';
      gfHint = 'Dica: Em inglês colocamos "really like" antes do verbo, evitando o "like very much" no início.';
      gfExplanation = 'Falantes nativos dizem "I really like doing something" ao invés de "I like very much".';
      sbDistractors = ['weekend', 'party', 'friends'];

      if (category === 'people') {
        mcExpected = `We invited several close ${word} to celebrate with us this Saturday evening.`;
        mcPt = `Convidamos vários(as) ${nat} próximos(as) para comemorar conosco neste sábado à noite.`;
        fbBlank = 'It was so wonderful catching up with all our ______ at the local cafe.';
        fbPt = `Foi maravilhoso colocar o papo em dia com todos os nossos ${nat} no café local.`;
        svSentence = `We had so much fun with our ${word}.`;
        svPt = `Nós nos divertimos tanto com nossos(as) ${nat}.`;
        rpLeo = 'What do you and your close friends usually enjoy doing on weekends?';
        rpLeoPt = `Leo pergunta o que você e seus amigos gostam de fazer no fim de semana. Responda usando "${word}":`;
        rpAnswer = `I usually hang out with my ${word} on weekend afternoons.`;
        rpPt = `Costumo passar tempo com meus(minhas) ${nat} nas tardes de fim de semana.`;
      } else if (category === 'location') {
        mcExpected = `Let us meet at the outdoor coffee shop located ${word} the music hall downtown.`;
        mcPt = `Vamos nos encontrar na cafeteria ao ar livre localizada ${nat} da casa de shows no centro.`;
        fbBlank = 'We agreed to meet at the food truck park ______ the downtown cinema.';
        fbPt = `Combinamos de nos encontrar no parque de food trucks ${nat} do cinema no centro.`;
        svSentence = `Let us meet ${word} the plaza.`;
        svPt = `Vamos nos encontrar ${nat} da praça.`;
        rpLeo = 'Where is your favorite hangout spot to meet up with friends?';
        rpLeoPt = `Leo pergunta seu lugar favorito para encontrar amigos. Responda usando "${word}":`;
        rpAnswer = `We love hanging out at a lively lounge located ${word} the central avenue.`;
        rpPt = `Adoramos passar tempo em um lounge animado localizado ${nat} da avenida central.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `We should definitely make plans to ${word} and catch up this weekend.`;
        mcPt = `Nós com certeza deveríamos combinar de ${nat} e colocar o papo em dia neste fim de semana.`;
        fbBlank = 'True friends always find time to ______ no matter how busy life gets.';
        fbPt = `Amigos verdadeiros sempre encontram tempo para ${nat}, não importa quão corrida esteja a vida.`;
        svSentence = 'We had so much fun together.';
        svPt = 'Nós nos divertimos tanto juntos.';
        rpLeo = 'How do you and your friends prefer to unwind after a long week?';
        rpLeoPt = `Leo pergunta como você e seus amigos relaxam. Responda usando "${word}":`;
        rpAnswer = `My friends and I love to ${word} and share laughs on Friday nights.`;
        rpPt = `Meus amigos e eu adoramos ${nat} e dar risadas nas noites de sexta.`;
      } else if (category === 'adjective') {
        mcExpected = `The concert atmosphere was completely ${word} and full of energy last night!`;
        mcPt = `O clima do show estava completamente ${nat} e cheio de energia ontem à noite!`;
        fbBlank = 'Our weekend hangout was so ______ and full of unforgettable laughs.';
        fbPt = `Nosso rolê de fim de semana foi tão ${nat} e cheio de risadas inesquecíveis.`;
        svSentence = `The concert was wonderfully ${word}.`;
        svPt = `O show foi incrivelmente ${nat}.`;
        rpLeo = 'How was your last weekend hangout with friends?';
        rpLeoPt = `Leo pergunta como foi seu último rolê com amigos. Responda usando "${word}":`;
        rpAnswer = `Our weekend gathering was lively, fun, and ${word}.`;
        rpPt = `Nosso encontro de fim de semana foi animado, divertido e ${nat}.`;
      } else if (category === 'adverb') {
        mcExpected = `We are ${word} planning a fun weekend road trip together with friends.`;
        mcPt = `Nós estamos ${nat} planejando uma viagem divertida de carro juntos com amigos.`;
        fbBlank = 'We are ______ planning a fun weekend getaway together.';
        fbPt = `Nós estamos ${nat} planejando um passeio divertido de fim de semana juntos.`;
        svSentence = `We are ${word} planning our road trip.`;
        svPt = `Estamos ${nat} planejando nossa viagem de carro.`;
        rpLeo = 'What are you and your friends planning for your next road trip?';
        rpLeoPt = `Leo pergunta o que você e seus amigos estão planejando. Responda usando "${word}":`;
        rpAnswer = `We are ${word} picking our road trip destination.`;
        rpPt = `Estamos ${nat} escolhendo nosso destino de viagem.`;
      } else if (category === 'clause_i') {
        mcExpected = `Whenever we meet ${word} laughing about our funniest stories.`;
        mcPt = `Sempre que nos encontramos ${nat} rir das nossas histórias mais engraçadas.`;
        fbBlank = 'Whenever we get together, ______ sharing great music and laughs.';
        fbPt = `Sempre que nos reunimos, ${nat} compartilhar boas músicas e risadas.`;
        svSentence = 'I love spending quality time with friends.';
        svPt = 'Adoro passar tempo de qualidade com amigos.';
        rpLeo = 'What do you love most about hanging out with your best friends?';
        rpLeoPt = `Leo pergunta o que você mais gosta ao sair com amigos. Responda usando "${word}":`;
        rpAnswer = `On Friday nights ${word} going out for burgers and chilling.`;
        rpPt = `Nas noites de sexta ${nat} sair para comer hambúrguer e relaxar.`;
      } else {
        mcExpected = `Let us sync our weekend ${word} so we can all hang out downtown.`;
        mcPt = `Vamos sincronizar nosso(a) ${nat} de fim de semana para podermos sair no centro.`;
        fbBlank = 'We compared our free ______ to choose the best evening for the party.';
        fbPt = `Comparamos nosso(a) ${nat} livre para escolher a melhor noite para a festa.`;
        svSentence = `Let us sync our weekend ${word}.`;
        svPt = `Vamos sincronizar nosso(a) ${nat} de fim de semana.`;
        rpLeo = 'How do you coordinate weekend plans with your friends?';
        rpLeoPt = `Leo pergunta como você combina os planos com amigos. Responda usando "${word}":`;
        rpAnswer = `We like to sync up and enjoy our free ${word} together.`;
        rpPt = `Gostamos de nos alinhar e aproveitar nosso(a) ${nat} livre juntos.`;
      }
      break;
    }

    case 'dating': {
      // Day 6: Encontros, Emoções & Relacionamentos
      mcScenario = `Em conversas profundas sobre sentimentos, relacionamentos e "${nat}".`;
      mcPrompt = `Qual frase expressa essa ideia de forma madura, sincera e autêntica?`;
      gfWrong = 'I am not caring what other people think about my feelings.';
      gfCorrect = 'I do not care what other people think about my feelings.';
      gfPrompt = 'Ajuste o tempo verbal (verbos de estado e sentimento usam Simple Present):';
      gfPt = 'Eu não me importo com o que os outros pensam sobre meus sentimentos.';
      gfHint = 'Dica: Verbos de sentimento ("care", "like", "love") usam Simple Present ("I don\'t care"), não o continuous.';
      gfExplanation = 'Em inglês usamos o Simple Present ("I don\'t care") para expressar sentimentos gerais e atitudes.';
      sbDistractors = ['heart', 'feelings', 'together'];

      if (category === 'people') {
        mcExpected = `It is deeply reassuring when your partner is respectful to your closest ${word}.`;
        mcPt = `É profundamente reconfortante quando seu parceiro é respeitoso com seus(suas) ${nat} mais próximos(as).`;
        fbBlank = 'She felt so happy because her date was kind and courteous to all her ______.';
        fbPt = `Ela se sentiu tão feliz porque seu par foi gentil e cortês com todos os seus ${nat}.`;
        svSentence = `Connecting with genuine ${word} brings true happiness.`;
        svPt = `Conectar-se com ${nat} verdadeiros(as) traz verdadeira felicidade.`;
        rpLeo = 'In your opinion, how important is it that your partner gets along with your loved ones?';
        rpLeoPt = `Leo pergunta sobre a importância do parceiro se dar bem com seus próximos. Responda usando "${word}":`;
        rpAnswer = `Introducing someone special to my closest ${word} is essential to me.`;
        rpPt = `Apresentar alguém especial aos(às) meus(minhas) ${nat} mais próximos(as) é essencial para mim.`;
      } else if (category === 'location') {
        mcExpected = `They chose an intimate candlelit restaurant located ${word} the riverfront.`;
        mcPt = `Eles escolheram um restaurante intimista à luz de velas localizado ${nat} da beira do rio.`;
        fbBlank = 'Walking together ______ the scenic waterfront after dinner was truly magical.';
        fbPt = `Caminhar juntos ${nat} da orla cênica após o jantar foi verdadeiramente mágico.`;
        svSentence = 'We had a wonderful conversation tonight.';
        svPt = 'Tivemos uma conversa maravilhosa hoje à noite.';
        rpLeo = 'What makes for an ideal, memorable first date setting?';
        rpLeoPt = `Leo pergunta qual o cenário ideal para um primeiro encontro. Responda usando "${word}":`;
        rpAnswer = `A quiet dinner ${word} a beautiful scenic view creates the best atmosphere.`;
        rpPt = `Um jantar tranquilo ${nat} de uma bela vista cria a melhor atmosfera.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `In any healthy relationship, partners feel completely safe to ${word} openly.`;
        mcPt = `Em qualquer relacionamento saudável, os parceiros se sentem seguros para ${nat} abertamente.`;
        fbBlank = 'Deep emotional intimacy grows when both partners take time to ______ without fear.';
        fbPt = `A intimidade emocional profunda cresce quando ambos dedicam tempo para ${nat} sem medo.`;
        svSentence = 'Honest communication builds lasting love.';
        svPt = 'Comunicação sincera constrói amor duradouro.';
        rpLeo = 'What is the most important ingredient for emotional intimacy in dating?';
        rpLeoPt = `Leo pergunta qual o ingrediente mais importante para intimidade emocional. Responda usando "${word}":`;
        rpAnswer = `I value relationships where partners feel safe to ${word} and listen.`;
        rpPt = `Eu valorizo relacionamentos onde os parceiros se sentem seguros para ${nat} e ouvir.`;
      } else if (category === 'adjective') {
        mcExpected = `Being with someone who makes you feel safe, loved, and ${word} is priceless.`;
        mcPt = `Estar com alguém que faz você se sentir seguro(a), amado(a) e ${nat} não tem preço.`;
        fbBlank = 'A loving partnership always feels safe, honest, and ______.';
        fbPt = `Uma parceria amorosa sempre parece segura, sincera e ${nat}.`;
        svSentence = `Our conversation felt honest and ${word}.`;
        svPt = `Nossa conversa pareceu sincera e ${nat}.`;
        rpLeo = 'What qualities do you look for most in a romantic partner?';
        rpLeoPt = `Leo pergunta quais qualidades você mais procura em um parceiro. Responda usando "${word}":`;
        rpAnswer = `I appreciate partners who make me feel respected and ${word}.`;
        rpPt = `Eu aprecio parceiros que me fazem sentir respeitado(a) e ${nat}.`;
      } else if (category === 'adverb') {
        mcExpected = `Couples who communicate ${word} and from the heart resolve disagreements easily.`;
        mcPt = `Casais que se comunicam ${nat} e com o coração resolvem desentendimentos facilmente.`;
        fbBlank = 'Speaking ______ with each other prevents misunderstandings before they grow.';
        fbPt = `Falar ${nat} um com o outro evita mal-entendidos antes que eles cresçam.`;
        svSentence = `Speak ${word} and with care.`;
        svPt = `Fale ${nat} e com cuidado.`;
        rpLeo = 'How can couples avoid unnecessary drama in relationships?';
        rpLeoPt = `Leo pergunta como casais podem evitar desentendimentos. Responda usando "${word}":`;
        rpAnswer = `Communicating ${word} helps partners understand each other deeply.`;
        rpPt = `Comunicar-se ${nat} ajuda os parceiros a se entenderem profundamente.`;
      } else if (category === 'clause_i') {
        mcExpected = `When dating someone new, ${word} valuing genuine and deep connections.`;
        mcPt = `Ao conhecer alguém novo, ${nat} valorizar conexões verdadeiras e profundas.`;
        fbBlank = 'In romantic relationships, ______ learning to communicate with patience.';
        fbPt = `Em relacionamentos amorosos, ${nat} aprender a se comunicar com paciência.`;
        svSentence = 'Honesty builds genuine connections.';
        svPt = 'Honestidade constrói conexões verdadeiras.';
        rpLeo = 'What is your philosophy on modern dating and finding genuine love?';
        rpLeoPt = `Leo pergunta sua filosofia sobre encontros e amor verdadeiro. Responda usando "${word}":`;
        rpAnswer = `In my heart ${word} believing that mutual respect is everything.`;
        rpPt = `No meu coração ${nat} acreditar que respeito mútuo é tudo.`;
      } else {
        mcExpected = `Building mutual ${word} requires honest communication and patience between two people.`;
        mcPt = `Construir ${nat} mútuo(a) exige comunicação sincera e paciência entre duas pessoas.`;
        fbBlank = 'Mutual ______ and active listening are key to any long-term relationship.';
        fbPt = `${nat} mútuo(a) e escuta ativa são fundamentais para qualquer relacionamento duradouro.`;
        svSentence = `Honest communication builds genuine ${word}.`;
        svPt = `Comunicação sincera constrói verdadeiro(a) ${nat}.`;
        rpLeo = 'In your opinion, what makes a relationship truly lasting and happy?';
        rpLeoPt = `Leo pergunta o que torna uma relação duradoura e feliz. Responda usando "${word}":`;
        rpAnswer = `Being authentic and showing true ${word} makes all the difference.`;
        rpPt = `Ser autêntico e demonstrar verdadeiro(a) ${nat} faz toda a diferença.`;
      }
      break;
    }

    case 'city': {
      // Day 7: Vida Real, Cidade & Compras
      mcScenario = `Na rotina da cidade e compras: Resolvendo tarefas cotidianas sobre "${nat}".`;
      mcPrompt = `Qual frase expressa essa intenção com praticidade e precisão em inglês?`;
      gfWrong = 'The supermarket is located near of the central station.';
      gfCorrect = 'The supermarket is located near the central station.';
      gfPrompt = 'Elimine a preposição incorreta após "near":';
      gfPt = 'O supermercado fica localizado perto da estação central.';
      gfHint = 'Dica: Diferente do português ("perto de"), em inglês "near" não usa "of" ("near the station", nunca "near of").';
      gfExplanation = 'Em inglês dizemos "near the station" ou "close to the station". "Near of" é um erro clássico de tradução direta.';
      sbDistractors = ['market', 'city', 'shopping'];

      if (category === 'people') {
        mcExpected = `The local store ${word} were very friendly and answered all our questions.`;
        mcPt = `Os(as) ${nat} da loja local foram muito simpáticos(as) e responderam a todas as nossas perguntas.`;
        fbBlank = 'We asked the neighborhood ______ which avenue led to the central market.';
        fbPt = `Perguntamos aos(às) ${nat} do bairro qual avenida levava ao mercado central.`;
        svSentence = `The local ${word} were very helpful.`;
        svPt = `Os(as) ${nat} locais foram muito prestativos(as).`;
        rpLeo = 'How is the customer service at your favorite neighborhood shops?';
        rpLeoPt = `Leo pergunta sobre o atendimento no comércio do seu bairro. Responda usando "${word}":`;
        rpAnswer = `I enjoy chatting with the friendly ${word} at my local bakery.`;
        rpPt = `Gosto de bater papo com os(as) simpáticos(as) ${nat} na minha padaria local.`;
      } else if (category === 'location') {
        mcExpected = `Could you tell me if there is a pharmacy or grocery store located ${word} here?`;
        mcPt = `Você poderia me dizer se existe uma farmácia ou supermercado localizado ${nat} daqui?`;
        fbBlank = 'You can find a very convenient supermarket located ______ the metro station exit.';
        fbPt = `Você pode encontrar um supermercado muito conveniente localizado ${nat} da saída do metrô.`;
        svSentence = `The store is located ${word} the station.`;
        svPt = `A loja fica localizada ${nat} da estação.`;
        rpLeo = 'Where do you usually run your everyday errands and grocery shopping?';
        rpLeoPt = `Leo pergunta onde você costuma fazer suas compras. Responda usando "${word}":`;
        rpAnswer = `I usually run my daily errands at shops located ${word} my apartment.`;
        rpPt = `Eu costumo resolver minhas tarefas em lojas localizadas ${nat} do meu apartamento.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `It is very convenient to ${word} while running errands in the neighborhood.`;
        mcPt = `É muito prático ${nat} enquanto resolve pendências no bairro.`;
        fbBlank = 'On busy Saturdays, we always take time to ______ at the farmers market.';
        fbPt = `Em sábados corridos, nós sempre aproveitamos para ${nat} na feira livre.`;
        svSentence = 'Running daily errands was quick today.';
        svPt = 'Resolver as tarefas do dia a dia foi rápido hoje.';
        rpLeo = 'What is your routine for running errands around the city on weekends?';
        rpLeoPt = `Leo pergunta sua rotina para resolver tarefas na cidade. Responda usando "${word}":`;
        rpAnswer = `I like to organize my errands so I have time to ${word}.`;
        rpPt = `Gosto de organizar minhas tarefas para ter tempo de ${nat}.`;
      } else if (category === 'adjective') {
        mcExpected = `The newly opened supermarket downtown is exceptionally ${word} and modern.`;
        mcPt = `O supermercado recém-aberto no centro é excepcionalmente ${nat} e moderno.`;
        fbBlank = 'The neighborhood shopping street is clean, safe, and very ______.';
        fbPt = `A rua de compras do bairro é limpa, segura e muito ${nat}.`;
        svSentence = `The service was quick and ${word}.`;
        svPt = `O serviço foi rápido e ${nat}.`;
        rpLeo = 'What do you appreciate most when shopping at local stores?';
        rpLeoPt = `Leo pergunta o que você mais aprecia no comércio local. Responda usando "${word}":`;
        rpAnswer = `I prefer shopping in places that are spacious and ${word}.`;
        rpPt = `Prefiro fazer compras em locais espaçosos e ${nat}.`;
      } else if (category === 'adverb') {
        mcExpected = `The local pharmacy downtown is ${word} open twenty-four hours a day.`;
        mcPt = `A farmácia local no centro está ${nat} aberta vinte e quatro horas por dia.`;
        fbBlank = 'The corner grocery store is ______ open twenty-four hours a day.';
        fbPt = `O mercadinho da esquina está ${nat} aberto vinte e quatro horas por dia.`;
        svSentence = `The shop is ${word} open.`;
        svPt = `A loja está ${nat} aberta.`;
        rpLeo = 'Is there a convenient 24-hour store or pharmacy in your neighborhood?';
        rpLeoPt = `Leo pergunta se há uma loja 24 horas conveniente no seu bairro. Responda usando "${word}":`;
        rpAnswer = `The local grocery is ${word} open for quick shopping.`;
        rpPt = `O mercadinho local está ${nat} aberto para compras rápidas.`;
      } else if (category === 'clause_i') {
        mcExpected = `Whenever I run errands downtown ${word} finding the best deals.`;
        mcPt = `Sempre que resolvo coisas no centro ${nat} encontrar as melhores ofertas.`;
        fbBlank = 'When shopping in the city, ______ comparing prices between stores.';
        fbPt = `Ao fazer compras na cidade, ${nat} comparar preços entre lojas.`;
        svSentence = 'I enjoy exploring the city on foot.';
        svPt = 'Gosto de explorar a cidade a pé.';
        rpLeo = 'What do you enjoy doing after finishing your errands downtown?';
        rpLeoPt = `Leo pergunta o que você gosta de fazer após resolver tarefas na rua. Responda usando "${word}":`;
        rpAnswer = `When running errands ${word} stopping for a coffee downtown.`;
        rpPt = `Ao resolver tarefas ${nat} parar para tomar um café no centro.`;
      } else {
        mcExpected = `Excuse me, could you point me to where I can find the ${word} in this store?`;
        mcPt = `Com licença, você poderia me indicar onde posso encontrar o(a) ${nat} nesta loja?`;
        fbBlank = 'Always check the receipt and warranty for your new ______ at the counter.';
        fbPt = `Sempre confira o recibo e garantia para o seu novo ${nat} no balcão.`;
        svSentence = `The ${word} is available in aisle three.`;
        svPt = `O(A) ${nat} está disponível no corredor três.`;
        rpLeo = 'What is the most recent item or errand you picked up in the city?';
        rpLeoPt = `Leo pergunta o que você comprou ou resolveu recentemente na rua. Responda usando "${word}":`;
        rpAnswer = `I picked up the ${word} while shopping downtown today.`;
        rpPt = `Peguei o(a) ${nat} enquanto fazia compras no centro hoje.`;
      }
      break;
    }
  }

  const mcOptions = [mcExpected, ...getScenarioMCDistractors(scenarioKey, mcExpected, 2)].sort(() => 0.5 - Math.random());
  const fbOptions = [fbAnswer, ...getCategoryFBDistractors(category, fbAnswer, 2)].sort(() => 0.5 - Math.random());

  return {
    multipleChoice: {
      scenarioPt: mcScenario,
      promptPt: mcPrompt,
      expectedAnswer: mcExpected,
      options: mcOptions,
      ptTranslation: mcPt,
      hintPt: `Dica: Escolha a frase autêntica relacionada a "${nat}".`,
      explanationPt: 'Estrutura natural e autêntica usada por falantes nativos de inglês.',
    },
    matchPairs: {
      pairs,
      hintPt: 'Dica: Toque nos blocos correspondentes para ligar os significados.',
    },
    fillBlank: {
      sentenceWithBlank: fbBlank,
      expectedAnswer: fbAnswer,
      options: fbOptions,
      ptTranslation: fbPt,
      hintPt: `Dica: Encaixe "${word}" (${nat}) para completar a ideia.`,
      explanationPt: `A palavra "${word}" completa perfeitamente a frase no contexto.`,
    },
    speakVerify: {
      sentence: svSentence,
      ptTranslation: svPt,
      hintPt: 'Dica: Leia no microfone em ritmo tranquilo e natural.',
      explanationPt: 'Pronúncia impecável! Essa frase curta é muito usada no dia a dia.',
    },
    roleplayPrompt: {
      leoPrompt: rpLeo,
      promptPt: rpLeoPt,
      expectedAnswer: rpAnswer,
      ptTranslation: rpPt,
      hintPt: `Dica: Responda diretamente ao Leo incluindo "${word}".`,
    },
    sentenceBuild: {
      english: mcExpected,
      ptTranslation: mcPt,
      promptPt: `Monte: "${mcPt}"`,
      hintPt: `Dica: Organize as palavras na ordem natural em inglês.`,
      distractors: sbDistractors,
    },
    listenType: {
      sentence: svSentence,
      ptTranslation: svPt,
      hintPt: 'Dica: Ouça com atenção a entonação da frase.',
    },
    grammarFix: {
      wrong: gfWrong,
      correct: gfCorrect,
      promptPt: gfPrompt,
      ptTranslation: gfPt,
      hintPt: gfHint,
      explanationPt: gfExplanation,
    },
  };
}

/**
 * Builds a complete standalone LessonPayload from vocabulary items.
 * EVERY block is a diversified, 6-exercise micro-lesson:
 * 1. match_pairs: Duolingo tactile matching minigame (warm-up)
 * 2. fill_blank: Complete the contextual sentence with grammatical distractors
 * 3. sentence_build: Assemble the natural sentence in order
 * 4. grammar_fix: Correct common Brazilian pitfalls (prepositions, agreement)
 * 5. speak_verify: Oral pronunciation with microphone
 * 6. roleplay_prompt: Real conversational dialogue with Mascot Leo
 *
 * Words rotate across exercises via `blockSeed` so every word gets practiced in multiple modes!
 */
export function buildCustomLesson(
  topic: string,
  level: CEFRLevel,
  items: ParsedVocabularyItem[],
  notes?: string,
  geminiMatrix?: Record<string, any>,
  scenarioKey: DayScenarioKey = 'restaurant',
  preferredType?: ExerciseType,
  blockSeed: number = 0
): LessonPayload {
  const safeItems = items.length > 0 ? items : [{ id: '1', english: 'practice', portuguese: 'prática' }];
  const wordsCovered = safeItems.map((i) => i.english);

  // Determine target items for each exercise, rotating by blockSeed:
  const itemPairs = safeItems[blockSeed % safeItems.length];
  const itemFill = safeItems[(blockSeed + 0) % safeItems.length];
  const itemBuild = safeItems[(blockSeed + 1) % safeItems.length];
  const itemGrammar = safeItems[(blockSeed + 2) % safeItems.length];
  const itemSpeak = safeItems[(blockSeed + 3) % safeItems.length];
  const itemRoleplay = safeItems[(blockSeed + 4) % safeItems.length];

  // 1. match_pairs: Tactile pairs matching minigame (Duolingo style)
  const pairsBundle = createRichSentences(itemPairs, blockSeed, scenarioKey, safeItems);
  const exMatchPairs: Exercise = {
    id: `mp_${blockSeed}_${Date.now()}_1`,
    type: 'match_pairs',
    targetWord: itemPairs.english,
    instruction: 'Match the English and Portuguese pairs:',
    instructionPt: 'Toque nos pares correspondentes em inglês e português:',
    promptText: 'Match each English word with its Portuguese meaning.',
    promptTextPt: 'Ligue cada palavra ao seu significado correspondente:',
    audioSentence: itemPairs.english,
    expectedAnswer: 'completed',
    expectedAnswerPt: 'Pares conectados com sucesso',
    acceptableVariations: ['completed'],
    wordBank: [],
    requiredWords: [itemPairs.english],
    pairs: pairsBundle.matchPairs.pairs,
    hint: 'Take your time and match the vocabulary items.',
    hintPt: pairsBundle.matchPairs.hintPt,
    explanation: 'Awesome! Quick matching builds instinctive vocabulary recall.',
    explanationPt: 'Excelente! Conectar pares rapidamente desenvolve reflexo e memória de longo prazo.',
    audioSpeedDefault: 1.0,
  };

  // 2. fill_blank: Complete the sentence in context with smart confusable distractors
  const wordFill = itemFill.english;
  const geminiFill = geminiMatrix?.[wordFill.toLowerCase().trim()]?.fillBlank;
  const bundleFill = createRichSentences(itemFill, blockSeed + 1, scenarioKey, safeItems);
  const fbBlank = geminiFill?.sentenceWithBlank || bundleFill.fillBlank.sentenceWithBlank;
  const fbExpected = geminiFill?.expectedAnswer || bundleFill.fillBlank.expectedAnswer;
  const smartDistractors = getSmartConfusableDistractors(fbExpected, 2);

  let fbOptions: string[] = [];
  if (geminiFill?.options && geminiFill.options.length >= 2) {
    fbOptions = geminiFill.options;
  } else {
    const rawOpts = [
      fbExpected,
      ...smartDistractors,
      ...bundleFill.fillBlank.options.filter((o: string) => o.toLowerCase() !== fbExpected.toLowerCase()),
    ];
    const seen = new Set<string>();
    for (const opt of rawOpts) {
      const lower = opt.toLowerCase();
      if (!seen.has(lower) && fbOptions.length < 3) {
        seen.add(lower);
        fbOptions.push(opt);
      }
    }
    fbOptions.sort(() => 0.5 - Math.random());
  }

  const fbPt = geminiFill?.ptTranslation || bundleFill.fillBlank.ptTranslation;
  const fbHintPt = geminiFill?.hintPt || bundleFill.fillBlank.hintPt;
  const fbExplanationPt = geminiFill?.explanationPt || bundleFill.fillBlank.explanationPt;

  const exFillBlank: Exercise = {
    id: `fb_${blockSeed}_${Date.now()}_2`,
    type: 'fill_blank',
    targetWord: wordFill,
    instruction: 'Tap the correct word to complete the sentence:',
    instructionPt: 'Toque na palavra correta para preencher a lacuna:',
    promptText: fbBlank,
    promptTextPt: fbPt,
    sentenceWithBlank: fbBlank,
    audioSentence: fbBlank.replace('______', fbExpected),
    expectedAnswer: fbExpected,
    expectedAnswerPt: fbPt,
    acceptableVariations: [fbExpected, fbExpected.toLowerCase()],
    wordBank: fbOptions,
    requiredWords: [wordFill],
    options: fbOptions,
    hint: 'Look closely at the context clues before and after the blank.',
    hintPt: fbHintPt,
    explanation: 'Spot on! Choosing words in context is how native speakers think.',
    explanationPt: fbExplanationPt,
    audioSpeedDefault: 1.0,
  };

  // 3. sentence_build: Assemble words into natural order with tricky distractors
  const wordBuild = itemBuild.english;
  const geminiBuild = geminiMatrix?.[wordBuild.toLowerCase().trim()]?.sentenceBuild;
  const bundleBuild = createRichSentences(itemBuild, blockSeed + 2, scenarioKey, safeItems);
  const sbSentence = geminiBuild?.sentence || bundleBuild.sentenceBuild.english;
  const sbPt = geminiBuild?.pt || bundleBuild.sentenceBuild.ptTranslation;
  const smartSBDistractors = getSmartConfusableDistractors(wordBuild, 2);
  const sbDistractors = [
    ...(geminiBuild?.distractors || bundleBuild.sentenceBuild.distractors || ['to', 'for']),
    ...smartSBDistractors,
  ].filter((d) => !sbSentence.toLowerCase().split(/\s+/).includes(d.toLowerCase()))
   .slice(0, 3);
  const sbWords = sbSentence.replace(/[.,!?]/g, '').split(' ').filter(Boolean);

  const exSentenceBuild: Exercise = {
    id: `sb_${blockSeed}_${Date.now()}_3`,
    type: 'sentence_build',
    targetWord: wordBuild,
    instruction: 'Tap the words in the correct order to form the sentence:',
    instructionPt: 'Toque nas palavras na ordem correta para montar a frase:',
    promptText: `Monte em inglês: "${sbPt}"`,
    promptTextPt: sbPt,
    audioSentence: sbSentence,
    expectedAnswer: sbSentence,
    expectedAnswerPt: sbPt,
    acceptableVariations: [sbSentence, sbSentence.replace(/[.,!?]/g, '')],
    wordBank: [...sbWords, ...sbDistractors].sort(() => 0.5 - Math.random()),
    requiredWords: [wordBuild],
    hint: 'Arrange the subject and verb in natural order.',
    hintPt: bundleBuild.sentenceBuild.hintPt,
    explanation: 'Terrific! Assembling real sentences solidifies English grammar intuition.',
    explanationPt: 'Sensacional! Montar frases reais fixa a ordem natural das palavras em inglês.',
    audioSpeedDefault: 1.0,
  };

  // 4. grammar_fix: Brazilian pitfall and preposition correction with dynamic rotation & correct target word
  const wordGrammar = itemGrammar.english;
  const geminiGrammar = geminiMatrix?.[wordGrammar.toLowerCase().trim()]?.grammarFix;
  const bundleGrammar = createRichSentences(itemGrammar, blockSeed + 3, scenarioKey, safeItems);

  // Check if student target word directly matches a known Brazilian pitfall
  const normWordGrammar = wordGrammar.toLowerCase().trim();
  const directPitfall = BRAZILIAN_GRAMMAR_PITFALLS.find(
    (p) => p.targetWord.toLowerCase() === normWordGrammar || normWordGrammar.includes(p.targetWord.toLowerCase())
  );

  let gfTargetWord = wordGrammar;
  let gfWrong = '';
  let gfCorrect = '';
  let gfPrompt = '';
  let gfPt = '';
  let gfExplanation = '';
  let gfHint = '';

  if (geminiGrammar && geminiGrammar.wrong && geminiGrammar.correct) {
    gfTargetWord = wordGrammar;
    gfWrong = geminiGrammar.wrong;
    gfCorrect = geminiGrammar.correct;
    gfPrompt = geminiGrammar.promptPt || 'Corrija o erro comum para tornar a frase natural:';
    gfPt = bundleGrammar.grammarFix.ptTranslation || geminiGrammar.correct;
    gfExplanation = geminiGrammar.explanationPt || 'Estrutura corrigida para soar 100% natural.';
    gfHint = bundleGrammar.grammarFix.hintPt;
  } else if (directPitfall) {
    gfTargetWord = directPitfall.targetWord;
    gfWrong = directPitfall.wrong;
    gfCorrect = directPitfall.correct;
    gfPrompt = directPitfall.promptPt;
    gfPt = directPitfall.ptTranslation;
    gfExplanation = directPitfall.explanationPt;
    gfHint = directPitfall.hintPt;
  } else {
    // Pick from rich rotating pool: guarantee NO two blocks in a day or week repeat!
    const scenarioHash = scenarioKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pitfallIndex = (blockSeed * 5 + scenarioHash) % BRAZILIAN_GRAMMAR_PITFALLS.length;
    const chosen = BRAZILIAN_GRAMMAR_PITFALLS[pitfallIndex];

    gfTargetWord = chosen.targetWord;
    gfWrong = chosen.wrong;
    gfCorrect = chosen.correct;
    gfPrompt = chosen.promptPt;
    gfPt = chosen.ptTranslation;
    gfExplanation = chosen.explanationPt;
    gfHint = chosen.hintPt;
  }

  const exGrammarFix: Exercise = {
    id: `gf_${blockSeed}_${Date.now()}_4`,
    type: 'grammar_fix',
    targetWord: gfTargetWord,
    instruction: 'Fix the common mistake to make the sentence natural:',
    instructionPt: gfPrompt || 'Corrija o erro comum para tornar a frase natural:',
    promptText: gfWrong, // English flawed sentence displayed in the card!
    promptTextPt: gfPt,
    audioSentence: gfCorrect,
    expectedAnswer: gfCorrect,
    expectedAnswerPt: gfPt,
    acceptableVariations: [gfCorrect, gfCorrect.replace(/[.,!?]/g, '')],
    wordBank: gfCorrect.replace(/[.,!?]/g, '').split(' '),
    options: [gfCorrect, gfWrong].sort(() => 0.5 - Math.random()),
    requiredWords: [gfTargetWord],
    hint: 'Pay attention to prepositions and verb conjugations.',
    hintPt: gfHint,
    explanation: 'Grammar fixed! Avoiding common Brazilian pitfalls makes your English sound polished.',
    explanationPt: gfExplanation,
    audioSpeedDefault: 1.0,
  };

  // 5. speak_verify: Oral production with microphone
  const wordSpeak = itemSpeak.english;
  const geminiSpeak = geminiMatrix?.[wordSpeak.toLowerCase().trim()]?.speakVerify;
  const bundleSpeak = createRichSentences(itemSpeak, blockSeed + 4, scenarioKey, safeItems);
  const svSentence = geminiSpeak?.sentence || bundleSpeak.speakVerify.sentence;
  const svPt = geminiSpeak?.pt || bundleSpeak.speakVerify.ptTranslation;
  const svHint = bundleSpeak.speakVerify.hintPt;
  const svExplanation = bundleSpeak.speakVerify.explanationPt;

  const exSpeakVerify: Exercise = {
    id: `sv_${blockSeed}_${Date.now()}_5`,
    type: 'speak_verify',
    targetWord: wordSpeak,
    instruction: 'Read the short phrase aloud using your microphone:',
    instructionPt: 'Leia a frase curta em voz alta no microfone:',
    promptText: `Leia em voz alta: "${svSentence}"`,
    promptTextPt: svPt,
    audioSentence: svSentence,
    expectedAnswer: svSentence,
    expectedAnswerPt: svPt,
    acceptableVariations: [
      svSentence,
      svSentence.toLowerCase(),
      svSentence.replace(/[.,!?]/g, ''),
    ],
    wordBank: svSentence.split(' '),
    requiredWords: [wordSpeak],
    hint: 'Speak clearly into your microphone at your normal pace.',
    hintPt: svHint,
    explanation: 'Pronunciation verified! Short spoken phrases build genuine speaking stamina.',
    explanationPt: svExplanation,
    audioSpeedDefault: 1.0,
  };

  // 6. roleplay_prompt: Conversational dialogue with Leo
  const wordRoleplay = itemRoleplay.english;
  const geminiRoleplay = geminiMatrix?.[wordRoleplay.toLowerCase().trim()]?.roleplayPrompt;
  const bundleRoleplay = createRichSentences(itemRoleplay, blockSeed + 5, scenarioKey, safeItems);
  const rpLeo = geminiRoleplay?.leoQuestion || bundleRoleplay.roleplayPrompt.leoPrompt;
  const rpPromptPt = geminiRoleplay?.pt || bundleRoleplay.roleplayPrompt.promptPt;
  const rpAnswer = geminiRoleplay?.studentAnswer || bundleRoleplay.roleplayPrompt.expectedAnswer;
  const rpPt = bundleRoleplay.roleplayPrompt.ptTranslation;
  const rpHint = bundleRoleplay.roleplayPrompt.hintPt;

  const cleanRoleplayTarget = wordRoleplay
    .replace(/^["'`“”«»]+|["'`“”«»]+$/g, '')
    .trim();

  const exRoleplayPrompt: Exercise = {
    id: `rp_${blockSeed}_${Date.now()}_6`,
    type: 'roleplay_prompt',
    targetWord: cleanRoleplayTarget,
    instruction: 'Answer Leo in English using the target vocabulary:',
    instructionPt: 'Responda ao Leo em inglês usando a palavra obrigatória:',
    promptText: rpLeo,
    promptTextPt: rpPromptPt,
    audioSentence: rpLeo,
    expectedAnswer: rpAnswer,
    expectedAnswerPt: rpPt,
    acceptableVariations: [
      rpAnswer,
      rpAnswer.toLowerCase(),
      `I always use ${cleanRoleplayTarget} in this situation.`,
      `I prefer to use ${cleanRoleplayTarget}.`,
    ],
    wordBank: ['I', 'we', 'always', 'at', 'home', 'with', 'people', 'when', cleanRoleplayTarget],
    requiredWords: [cleanRoleplayTarget],
    hint: `Form a natural sentence containing "${cleanRoleplayTarget}".`,
    hintPt: rpHint,
    explanation: 'Terrific answer! Applying vocabulary in conversational dialogue is the peak of fluency.',
    explanationPt: `Excelente resposta conversacional! Você colocou "${cleanRoleplayTarget}" em prática ativa no diálogo com o Leo.`,
    audioSpeedDefault: 1.0,
  };

  // 7. ask_question: Reverse Q&A — Leo gives the answer and the student creates the question!
  const itemAskQ = safeItems[(blockSeed + 5) % safeItems.length];
  const wordAskQ = itemAskQ.english;
  const cleanAskQTarget = wordAskQ
    .replace(/^["'`“”«»]+|["'`“”«»]+$/g, '')
    .trim();
  const bundleAskQ = createRichSentences(itemAskQ, blockSeed + 6, scenarioKey, safeItems);
  const geminiAskQ = geminiMatrix?.[wordAskQ.toLowerCase().trim()]?.askQuestion;

  // In Reverse Q&A:
  // - givenAnswer is the statement/answer Leo gives (e.g. bundleAskQ.roleplayPrompt.expectedAnswer)
  // - expectedAnswer is a natural question using the targetWord (or asking about it)
  const aqGivenAnswer = geminiAskQ?.givenAnswer || bundleAskQ.roleplayPrompt.expectedAnswer;
  const aqGivenAnswerPt = geminiAskQ?.givenAnswerPt || bundleAskQ.roleplayPrompt.ptTranslation;
  const aqExpectedQuestion =
    geminiAskQ?.expectedQuestion ||
    (bundleAskQ.roleplayPrompt.leoPrompt.toLowerCase().includes(cleanAskQTarget.toLowerCase())
      ? bundleAskQ.roleplayPrompt.leoPrompt
      : `How do you usually deal with ${cleanAskQTarget} in this situation?`);
  const aqExpectedQuestionPt =
    geminiAskQ?.expectedQuestionPt ||
    `Como você costuma lidar com / usar "${cleanAskQTarget}" nessa situação?`;

  const exAskQuestion: Exercise = {
    id: `aq_${blockSeed}_${Date.now()}_7`,
    type: 'ask_question',
    targetWord: cleanAskQTarget,
    instruction: 'Look at Leo’s answer and write or speak the question in English:',
    instructionPt: 'Veja a resposta do Leo e crie a PERGUNTA em inglês usando a expressão em foco:',
    promptText: aqGivenAnswer,
    promptTextPt: aqGivenAnswerPt,
    givenAnswer: aqGivenAnswer,
    givenAnswerPt: aqGivenAnswerPt,
    audioSentence: aqGivenAnswer,
    expectedAnswer: aqExpectedQuestion,
    expectedAnswerPt: aqExpectedQuestionPt,
    acceptableVariations: [
      aqExpectedQuestion,
      aqExpectedQuestion.toLowerCase(),
      `Do you use ${cleanAskQTarget}?`,
      `What do you think about ${cleanAskQTarget}?`,
      `Why did you mention ${cleanAskQTarget}?`,
    ],
    wordBank: ['What', 'How', 'Why', 'do', 'did', 'you', 'think', 'about', cleanAskQTarget],
    requiredWords: [cleanAskQTarget],
    hint: `Start with a question word (What, How, Why) or auxiliary (Do you, Did you, Are you) and include "${cleanAskQTarget}".`,
    hintPt: `Dica: Comece com What, How, Why, Do you ou Did you e inclua "${cleanAskQTarget}" na sua pergunta!`,
    explanation: 'Awesome question! Mastering question word order and auxiliary verbs unlocks real two-way conversations.',
    explanationPt: `Excelente pergunta! Formular perguntas com "${cleanAskQTarget}" destrava a sua capacidade de puxar assunto e manter conversas reais.`,
    audioSpeedDefault: 1.0,
  };

  // Exercise map
  const exerciseMap: Record<string, Exercise> = {
    match_pairs: exMatchPairs,
    fill_blank: exFillBlank,
    sentence_build: exSentenceBuild,
    grammar_fix: exGrammarFix,
    speak_verify: exSpeakVerify,
    roleplay_prompt: exRoleplayPrompt,
    ask_question: exAskQuestion,
  };

  // 4 distinctly sequenced learning flows so no two consecutive blocks ever feel identical!
  // Now includes "ask_question" (Crie a Pergunta) in the weekly rotation!
  const BLOCK_ORDER_PATTERNS: Array<Array<'fill_blank' | 'sentence_build' | 'speak_verify' | 'match_pairs' | 'grammar_fix' | 'roleplay_prompt' | 'ask_question'>> = [
    // Bloco 1: Descoberta & Contexto
    ['fill_blank', 'sentence_build', 'speak_verify', 'match_pairs', 'grammar_fix', 'roleplay_prompt'],
    // Bloco 2: Ação & Pergunta Ativa (Inclui o Desafio Invertido: Crie a Pergunta!)
    ['speak_verify', 'match_pairs', 'grammar_fix', 'fill_blank', 'sentence_build', 'ask_question'],
    // Bloco 3: Desafio & Raciocínio
    ['sentence_build', 'grammar_fix', 'fill_blank', 'roleplay_prompt', 'speak_verify', 'match_pairs'],
    // Bloco 4: Maestria & Fluência (Inclui tanto Crie a Pergunta quanto Roleplay!)
    ['grammar_fix', 'ask_question', 'speak_verify', 'sentence_build', 'fill_blank', 'roleplay_prompt'],
  ];

  const selectedPattern = BLOCK_ORDER_PATTERNS[blockSeed % BLOCK_ORDER_PATTERNS.length];
  const exercises: Exercise[] = [];
  for (const type of selectedPattern) {
    if (exerciseMap[type]) {
      exercises.push(exerciseMap[type]);
    }
  }

  const cleanPitfallsPt = [
    `Cuidado com preposições ao usar ${wordsCovered.slice(0, 3).map((w) => `"${w}"`).join(', ')}.`,
    'Evite traduzir palavra por palavra do português; foque nas estruturas naturais em inglês.',
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
      topicIntro:
        'Pegamos suas anotações da aula particular para criar um treino dinâmico, rápido e sem cansaço. Vamos começar!',
    },
    exercises,
    reviewSummary: {
      keyTakeaways: [
        `Mastered key terms: ${wordsCovered.join(', ')}`,
        'Reinforced natural speech cadence and collocations in real-life scenarios',
      ],
      keyTakeawaysPt: [
        `Vocabulário fixado: ${wordsCovered.join(', ')}`,
        'Treino dinâmico com minigames, lacunas rápidas, ordenação de frases e fala ativa',
      ],
      commonPitfallsToAvoid: [
        'Confusing prepositions or false friends noted during class',
      ],
      commonPitfallsToAvoidPt: cleanPitfallsPt,
    },
  };
}

/**
 * Builds a 7-day WeeklyPlan with 4 micro-blocks of 5 minutes each per day (20 min/day).
 * Each of the 7 days is set in a vibrant, distinct real-life scenario:
 * Day 1: Restaurante & Café
 * Day 2: Família & Casa
 * Day 3: Trabalho & Reuniões
 * Day 4: Viagens & Aeroporto
 * Day 5: Rolê com Amigos & Lazer
 * Day 6: Encontros & Relacionamentos
 * Day 7: Vida Real, Cidade & Compras
 */
export function buildWeeklyPlan(
  topic: string,
  level: CEFRLevel,
  items: ParsedVocabularyItem[],
  classDay: string = 'Quarta-feira',
  dailyMinutes: number = 20,
  rawNotes: string = '',
  geminiMatrix?: Record<string, any>,
  clientDateIso?: string
): WeeklyPlan {
  // Discard meta headers like "phrasal verbs", "vocabulary", etc.
  const cleanItems = (items || []).filter((item) => {
    const eng = (item.english || '').toLowerCase().trim();
    return eng && !isMetaHeader(eng);
  });

  const safeItems =
    cleanItems.length > 0
      ? cleanItems
      : [
          { id: '1', english: 'schedule', portuguese: 'agendar / cronograma' },
          { id: '2', english: 'look forward to', portuguese: 'aguardar com expectativa' },
          { id: '3', english: 'overwhelmed', portuguese: 'sobrecarregado' },
          { id: '4', english: 'actually', portuguese: 'na verdade' },
        ];

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

  // Robust local calendar base date (prevents UTC timezone day-boundary bugs)
  let baseDate = new Date();
  if (clientDateIso && /^\d{4}-\d{2}-\d{2}$/.test(clientDateIso)) {
    const [y, m, d] = clientDateIso.split('-').map(Number);
    baseDate = new Date(y, m - 1, d, 12, 0, 0);
  } else {
    baseDate.setHours(12, 0, 0, 0);
  }

  const cleanClassDay = (classDay || '').toLowerCase().replace('-feira', '').trim();

  // Pedagogical Micro-Blocks
  const BLOCK_THEMES: Array<{
    titleName: string;
    subtitle: string;
    type: ExerciseType;
  }> = [
    {
      titleName: 'Descoberta & Contexto',
      subtitle: 'Complete no cenário, monte a frase na ordem certa e fale no microfone.',
      type: 'fill_blank',
    },
    {
      titleName: 'Ação & Fala Ativa',
      subtitle: 'Comece com voz no microfone, minigame de ligar pares e ajuste gramatical.',
      type: 'speak_verify',
    },
    {
      titleName: 'Desafio & Raciocínio',
      subtitle: 'Monte frases complexas, corrija vícios comuns e converse com o Leo.',
      type: 'sentence_build',
    },
    {
      titleName: 'Maestria & Fluência',
      subtitle: 'Ajuste gramatical avançado, bate-papo estendido e fixação final.',
      type: 'grammar_fix',
    },
  ];

  const blocksCount = Math.max(2, Math.min(6, Math.round(dailyMinutes / 5)));
  const days: DayPlan[] = [];

  for (let d = 0; d < 7; d++) {
    const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + d, 12, 0, 0);
    const dayOfWeek = targetDate.getDay();
    const dayName = PT_DAYS[dayOfWeek];
    const shortDayName = PT_SHORT_DAYS[dayOfWeek];
    const dayNumber = targetDate.getDate();
    const monthName = PT_MONTHS[targetDate.getMonth()];
    const dateFormatted = `${dayNumber} ${monthName}`;
    const yearStr = targetDate.getFullYear();
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(dayNumber).padStart(2, '0');
    const dateIso = `${yearStr}-${monthStr}-${dayStr}`;

    const isClassDay =
      cleanClassDay.length > 0 &&
      (dayName.toLowerCase().replace('-feira', '').includes(cleanClassDay) ||
        cleanClassDay.includes(dayName.toLowerCase().replace('-feira', '')));

    const scenario = DAY_SCENARIOS[d % DAY_SCENARIOS.length];
    const dayLabel = isClassDay
      ? `Dia ${d + 1} · Dia da Aula`
      : scenario.label;

    // Distribute vocabulary: cluster of all words (or generous window) across the day
    const totalItemsCount = safeItems.length;
    let dayItems: ParsedVocabularyItem[] = [];

    if (totalItemsCount <= 12) {
      // Entire vocabulary cluster practiced throughout the week
      dayItems = [...safeItems];
    } else {
      // For large lists (>12 words), provide overlapping windows of 8-10 words
      const startIndex = Math.floor((d * totalItemsCount) / 7);
      const windowItems: ParsedVocabularyItem[] = [];
      for (let i = 0; i < 8; i++) {
        windowItems.push(safeItems[(startIndex + i) % totalItemsCount]);
      }
      dayItems = windowItems;
    }

    const blocks: LessonBlock[] = [];

    for (let b = 0; b < blocksCount; b++) {
      const theme = BLOCK_THEMES[b % BLOCK_THEMES.length];
      const blockTitle = `Bloco ${b + 1}: ${theme.titleName}`;
      const blockWords = dayItems.map((i) => i.english);

      const blockLesson = buildCustomLesson(
        `${topic} - ${dayName} (${blockTitle.split(':')[0]})`,
        level,
        dayItems,
        rawNotes,
        geminiMatrix,
        scenario.key,
        theme.type,
        b // Pass block index as blockSeed to rotate starting exercise & words!
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
      theme: scenario.theme,
      themeKey: scenario.key,
      isToday: false,
      isClassDay,
      isCompleted: false,
      totalMinutes: dailyMinutes,
      blocks,
    });
  }

  return {
    id: `plan_${Date.now()}`,
    createdAt: new Date().toISOString(),
    version: CURRENT_PLAN_VERSION,
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

export const CURRENT_PLAN_VERSION = 7;

/**
 * Checks if a plan is deprecated (older plan generated before version 5,
 * or containing outdated static templates / distractors / Portuguese instruction in grammar_fix promptText).
 */
export function isPlanDeprecated(plan: WeeklyPlan): boolean {
  if (!plan || !plan.days || plan.days.length === 0) return false;
  if ((plan as any).version && (plan as any).version >= CURRENT_PLAN_VERSION) {
    const str = JSON.stringify(plan);
    if (
      str.includes('adjust our not caring') ||
      str.includes('adjust our employees') ||
      str.includes('check the near') ||
      str.includes('We need to adjust our') ||
      str.includes('Can you please help me check the') ||
      str.includes('phrasal verbs')
    ) {
      return true;
    }
    // Check if any grammar_fix has Portuguese instruction in promptText instead of flawed English sentence
    for (const d of plan.days) {
      for (const b of d.blocks || []) {
        const gf = b.lesson?.exercises?.find((e) => e.type === 'grammar_fix');
        if (
          gf &&
          (gf.promptText.startsWith('Ajuste') ||
            gf.promptText.startsWith('Corrija') ||
            gf.promptText.startsWith('Elimine'))
        ) {
          return true;
        }
      }
    }
    return false;
  }
  return true;
}

/**
 * Upgrades an existing WeeklyPlan to Version 5:
 * - Dynamically sequences each block differently (Bloco 1 != Bloco 2 != Bloco 3 != Bloco 4)
 * - Fixes grammar_fix to show the flawed English sentence in the card
 * - Embeds smart confusable distractors
 * - Shuffles and rotates pairs minigame
 * - CAREFULLY PRESERVES ALL USER PROGRESS: isCompleted, completedAt, score, and xpEarned!
 */
export function upgradePlanExercises(oldPlan: WeeklyPlan): WeeklyPlan {
  const rawItems = oldPlan.parsedItems && oldPlan.parsedItems.length > 0 ? oldPlan.parsedItems : [];
  const cleanItems = rawItems.filter((item) => {
    const eng = (item.english || '').toLowerCase().trim();
    return eng && !isMetaHeader(eng);
  });

  const safeItems =
    cleanItems.length > 0
      ? cleanItems
      : [
          { id: '1', english: 'schedule', portuguese: 'agendar / cronograma' },
          { id: '2', english: 'look forward to', portuguese: 'aguardar com expectativa' },
          { id: '3', english: 'overwhelmed', portuguese: 'sobrecarregado' },
          { id: '4', english: 'actually', portuguese: 'na verdade' },
        ];

  const BLOCK_THEMES: Array<{
    titleName: string;
    subtitle: string;
    type: ExerciseType;
  }> = [
    {
      titleName: 'Descoberta & Contexto',
      subtitle: 'Complete no cenário, monte a frase na ordem certa e fale no microfone.',
      type: 'fill_blank',
    },
    {
      titleName: 'Ação & Fala Ativa',
      subtitle: 'Comece com voz no microfone, minigame de ligar pares e ajuste gramatical.',
      type: 'speak_verify',
    },
    {
      titleName: 'Desafio & Raciocínio',
      subtitle: 'Monte frases complexas, corrija vícios comuns e converse com o Leo.',
      type: 'sentence_build',
    },
    {
      titleName: 'Maestria & Fluência',
      subtitle: 'Ajuste gramatical avançado, bate-papo estendido e fixação final.',
      type: 'grammar_fix',
    },
  ];

  const upgradedDays: DayPlan[] = oldPlan.days.map((oldDay, d) => {
    const scenario = DAY_SCENARIOS[d % DAY_SCENARIOS.length];

    const totalItemsCount = safeItems.length;
    let dayItems: ParsedVocabularyItem[] = [];

    if (totalItemsCount <= 12) {
      dayItems = [...safeItems];
    } else {
      const startIndex = Math.floor((d * totalItemsCount) / 7);
      const windowItems: ParsedVocabularyItem[] = [];
      for (let i = 0; i < 8; i++) {
        windowItems.push(safeItems[(startIndex + i) % totalItemsCount]);
      }
      dayItems = windowItems;
    }

    const upgradedBlocks: LessonBlock[] = (oldDay.blocks || []).map((oldBlock, b) => {
      const theme = BLOCK_THEMES[b % BLOCK_THEMES.length];
      const blockTitle = `Bloco ${b + 1}: ${theme.titleName}`;

      const blockLesson = buildCustomLesson(
        `${oldPlan.topic} - ${oldDay.dayName} (${blockTitle.split(':')[0]})`,
        oldPlan.cefrLevel || 'B2',
        dayItems,
        oldPlan.rawNotes || '',
        undefined,
        scenario.key,
        theme.type,
        b
      );

      return {
        ...oldBlock,
        title: blockTitle,
        subtitle: theme.subtitle,
        type: theme.type,
        targetWords: dayItems.map((i) => i.english),
        lesson: blockLesson,
        // PRESERVE ALL USER PROGRESS
        isCompleted: oldBlock.isCompleted,
        completedAt: oldBlock.completedAt,
        score: oldBlock.score,
        xpEarned: oldBlock.xpEarned,
      };
    });

    return {
      ...oldDay,
      theme: scenario.theme,
      themeKey: scenario.key,
      blocks: upgradedBlocks,
      isCompleted: oldDay.isCompleted,
    };
  });

  return {
    ...oldPlan,
    version: CURRENT_PLAN_VERSION,
    updatedAt: new Date().toISOString(),
    parsedItems: safeItems,
    days: upgradedDays,
  };
}
