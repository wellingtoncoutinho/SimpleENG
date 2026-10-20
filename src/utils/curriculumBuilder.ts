import { CEFRLevel, Exercise, ExerciseType, LessonPayload, MatchPair } from '../types/lesson.ts';
import { DayPlan, LessonBlock, ParsedVocabularyItem, WeeklyPlan } from '../types/weeklyPlan.ts';
import { WORD_TRANSLATIONS } from './wordTranslations.ts';

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
export type WordCategory = 'clause_i' | 'phrasal_verb' | 'noun' | 'adjective' | 'adverb' | 'general';

// Plausible category-specific distractors for fill_blank (strictly matching grammatical class)
const CATEGORY_FB_DISTRACTORS: Record<WordCategory, string[]> = {
  clause_i: ['I want', 'I need', 'I plan', 'I hope'],
  phrasal_verb: ['speak up', 'calm down', 'hold back', 'look forward to', 'hang out', 'give up', 'catch up'],
  noun: ['ways', 'habits', 'trust', 'schedule', 'routine', 'meeting', 'priority', 'feedback', 'crush', 'fear'],
  adjective: ['trusty', 'honest', 'overwhelmed', 'confident', 'exhausted', 'comfortable', 'patient'],
  adverb: ['actually', 'usually', 'suddenly', 'meanwhile', 'already', 'patiently'],
  general: ['time', 'plan', 'idea', 'choice', 'step'],
};

function getCategoryFBDistractors(category: WordCategory, targetWord: string, count: number = 2): string[] {
  const pool = CATEGORY_FB_DISTRACTORS[category] || CATEGORY_FB_DISTRACTORS.noun;
  const normTarget = targetWord.toLowerCase().trim();
  const filtered = pool.filter((w) => w.toLowerCase() !== normTarget);
  return filtered.slice(0, count);
}

function categorizeWord(word: string): WordCategory {
  const clean = word.replace(/^[-–—:;,\s]+|[-–—:;,\s]+$/g, '').toLowerCase().trim();

  if (clean.startsWith('i ') || clean === 'i' || clean.startsWith('i\'')) {
    return 'clause_i';
  }
  if (
    clean.includes(' ') &&
    (clean.endsWith(' to') ||
      clean.endsWith(' with') ||
      clean.endsWith(' of') ||
      clean.endsWith(' for') ||
      clean.endsWith(' up') ||
      clean.endsWith(' on') ||
      clean.endsWith(' out') ||
      clean.includes('look forward') ||
      clean.includes('struggle') ||
      clean.includes('afraid of') ||
      clean.includes('ghost') ||
      clean.includes('take for granted'))
  ) {
    return 'phrasal_verb';
  }
  if (['speak up', 'give up', 'hang out', 'catch up', 'calm down', 'hold back', 'figure out', 'find out'].includes(clean)) {
    return 'phrasal_verb';
  }
  if (
    clean.endsWith('ly') ||
    ['actually', 'usually', 'already', 'meanwhile', 'suddenly', 'instead', 'almost', 'patiently'].includes(clean)
  ) {
    return 'adverb';
  }
  if (
    ['trusty', 'honest', 'healthy', 'overwhelmed', 'afraid', 'busy', 'ready', 'confident', 'polite', 'rude', 'patient', 'calm', 'delicious'].includes(clean) ||
    clean.endsWith('ed') ||
    clean.endsWith('able') ||
    clean.endsWith('ful')
  ) {
    return 'adjective';
  }
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

/**
 * Builds 4 tactile matching pairs for match_pairs minigame.
 * Uses words from student class notes first, then supplements with thematic words.
 */
function createMatchPairs(
  targetItem: ParsedVocabularyItem,
  allItems: ParsedVocabularyItem[],
  scenarioKey: DayScenarioKey
): MatchPair[] {
  const pairs: MatchPair[] = [];
  const targetWord = targetItem.english.trim();
  const targetPt = getNaturalMeaning(targetWord, targetItem.portuguese);

  pairs.push({
    id: `pair_0_${targetWord.toLowerCase().replace(/\s+/g, '_')}`,
    english: targetWord,
    portuguese: targetPt,
  });

  // Pick other words from student's items first
  const others = allItems.filter(
    (i) => i.english.trim().toLowerCase() !== targetWord.toLowerCase()
  );
  for (const other of others) {
    if (pairs.length >= 4) break;
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

  // Supplement with scenario pairs if fewer than 4
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
  for (const [eng, pt] of pool) {
    if (pairs.length >= 4) break;
    if (!pairs.some((p) => p.english.toLowerCase() === eng.toLowerCase())) {
      pairs.push({
        id: `pair_theme_${pairs.length}_${eng.replace(/\s+/g, '_')}`,
        english: eng,
        portuguese: pt,
      });
    }
  }

  return pairs.slice(0, 4);
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
  const pairs = createMatchPairs({ ...item, english: word }, allItems, scenarioKey);

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
        wrong: `I always ${word} in an unnatural way.`,
        correct: curated.sentences.svSentence,
        promptPt: `Ajuste para a frase correta:`,
        ptTranslation: curated.sentences.svPt,
        hintPt: `Dica: Use a estrutura idiomática em inglês.`,
        explanationPt: `Estrutura natural e autêntica.`,
      },
    };
  }

  // Scenario-specific generator
  switch (scenarioKey) {
    case 'restaurant': {
      // Day 1: Restaurante & Café
      let mcScenario = `No restaurante ou cafeteria: Você precisa se comunicar com o atendente sobre "${nat}".`;
      let mcPrompt = `Qual frase expressa essa intenção da forma mais educada e natural em inglês?`;
      let mcExpected = `Excuse me, could you please point me toward the ${word}?`;
      let mcPt = `Com licença, você poderia me indicar onde fica o(a) ${nat}?`;

      let fbBlank = `Excuse me, could you please point us toward the ______?`;
      let fbAnswer = word;
      let fbPt = `Com licença, você poderia nos indicar onde fica o(a) ${nat}?`;

      let svSentence = `Everything was absolutely delicious tonight.`;
      let svPt = `Tudo estava absolutamente delicioso hoje à noite.`;

      let rpLeo = `Welcome to our bistro! Are you ready to order, or do you need a minute?`;
      let rpLeoPt = `Leo é o garçom do bistrô e pergunta: "Você está pronto para pedir ou precisa de um minuto?" Responda usando "${word}":`;
      let rpAnswer = `Yes, we are ready to order, and I'd like to check about the ${word}.`;
      let rpPt = `Sim, estamos prontos para pedir, e eu gostaria de saber sobre o(a) ${nat}.`;

      if (category === 'clause_i') {
        mcExpected = `When looking at the menu, ${word} to try the chef's special tonight.`;
        mcPt = `Olhando o cardápio, ${nat} experimentar o especial do chef hoje à noite.`;
        fbBlank = `When looking at the menu, ______ to try the chef's special.`;
        fbPt = `Olhando o cardápio, ${nat} experimentar o especial do chef.`;
        rpAnswer = `I am ready, ${word} to order the grilled salmon.`;
        rpPt = `Estou pronto, ${nat} pedir o salmão grelhado.`;
      } else if (category === 'adjective') {
        mcExpected = `The food here is wonderfully ${word} and fresh tonight.`;
        mcPt = `A comida aqui é incrivelmente ${nat} e fresca hoje à noite.`;
        fbBlank = `The dessert here is so ______ that we ordered another one.`;
        fbPt = `A sobremesa aqui é tão ${nat} que pedimos outra.`;
        rpAnswer = `Everything smells so ${word} in this restaurant.`;
        rpPt = `Tudo cheira tão ${nat} neste restaurante.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `We always ${word} having lunch at this cozy bistro.`;
        mcPt = `Nós sempre ${nat} almoçar neste bistrô aconchegante.`;
        fbBlank = `We always ______ visiting this cafe on weekends.`;
        fbPt = `Nós sempre ${nat} visitar este café aos fins de semana.`;
      } else if (category === 'adverb') {
        mcExpected = `We are ${word} ready to order our main courses now.`;
        mcPt = `Nós estamos ${nat} prontos para pedir nossos pratos principais agora.`;
        fbBlank = `We are ______ ready to order our dinner now.`;
        fbPt = `Nós estamos ${nat} prontos para pedir nosso jantar agora.`;
      }

      const mcOptions = [mcExpected, ...getScenarioMCDistractors('restaurant', mcExpected, 2)].sort(() => 0.5 - Math.random());
      const fbOptions = [fbAnswer, ...getCategoryFBDistractors(category, fbAnswer, 2)].sort(() => 0.5 - Math.random());

      return {
        multipleChoice: {
          scenarioPt: mcScenario,
          promptPt: mcPrompt,
          expectedAnswer: mcExpected,
          options: mcOptions,
          ptTranslation: mcPt,
          hintPt: `Dica: Escolha a frase mais educada e natural no restaurante relacionada a "${nat}".`,
          explanationPt: `No contexto de restaurante, essa estrutura soa polida, natural e autêntica.`,
        },
        matchPairs: {
          pairs,
          hintPt: `Dica: Toque nos blocos correspondentes para ligar os significados.`,
        },
        fillBlank: {
          sentenceWithBlank: fbBlank,
          expectedAnswer: fbAnswer,
          options: fbOptions,
          ptTranslation: fbPt,
          hintPt: `Dica: Encaixe "${word}" (${nat}) para completar a ideia.`,
          explanationPt: `A palavra "${word}" completa perfeitamente o diálogo no restaurante.`,
        },
        speakVerify: {
          sentence: svSentence,
          ptTranslation: svPt,
          hintPt: `Dica: Leia no microfone em ritmo tranquilo e natural.`,
          explanationPt: `Pronúncia impecável! Essa frase curta é muito usada ao elogiar uma refeição.`,
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
          hintPt: `Dica: Use "${word}" na ordem correta da frase.`,
          distractors: ['coffee', 'water', 'menu'],
        },
        listenType: {
          sentence: `Could we please get our check when you have a moment?`,
          ptTranslation: `Você poderia nos trazer a conta quando tiver um momento?`,
          hintPt: `Dica: Ouça com atenção a fala conectada do garçom.`,
        },
        grammarFix: {
          wrong: `Can you explain me the menu, please?`,
          correct: `Can you explain the menu to me, please?`,
          promptPt: `Ajuste a preposição correta com o verbo "explain":`,
          ptTranslation: `Você pode me explicar o cardápio, por favor?`,
          hintPt: `Dica: Em inglês dizemos "explain something to me" (nunca "explain me").`,
          explanationPt: `O verbo "explain" exige a preposição "to" antes do pronome: "explain to me".`,
        },
      };
    }

    case 'family': {
      // Day 2: Família, Casa & Convivência
      let mcScenario = `Em família: Conversando com parentes sobre a rotina da casa e tarefas.`;
      let mcPrompt = `Como expressar a ideia de "${nat}" de forma natural em família?`;
      let mcExpected = `Can you please help me check the ${word} before the family arrives?`;
      let mcPt = `Você pode por favor me ajudar a conferir o(a) ${nat} antes de a família chegar?`;

      let fbBlank = `Can you please help me organize the ______ before everyone arrives?`;
      let fbAnswer = word;
      let fbPt = `Você pode por favor me ajudar a organizar o(a) ${nat} antes que todos cheguem?`;

      let svSentence = `We always support each other.`;
      let svPt = `Nós sempre apoiamos uns aos outros.`;

      let rpLeo = `What is your favorite family tradition or Sunday routine?`;
      let rpLeoPt = `Leo pergunta sobre a sua família: "Qual é a sua tradição de família ou rotina de domingo favorita?" Responda usando "${word}":`;
      let rpAnswer = `On Sundays we make sure our ${word} is taken care of together.`;
      let rpPt = `Aos domingos nós garantimos que nosso(a) ${nat} seja cuidado(a) juntos.`;

      if (category === 'clause_i') {
        mcExpected = `Every Sunday ${word} cooking lunch for the whole family.`;
        mcPt = `Todo domingo ${nat} cozinhar o almoço para a família inteira.`;
        fbBlank = `On peaceful weekends, ______ relaxing at home with my loved ones.`;
        fbPt = `Em fins de semana tranquilos, ${nat} relaxar em casa com quem eu amo.`;
        rpAnswer = `On weekends ${word} spending quiet moments at home.`;
        rpPt = `Nos fins de semana ${nat} passar momentos tranquilos em casa.`;
      } else if (category === 'adjective') {
        mcExpected = `Our home feels wonderfully ${word} during the holiday season.`;
        mcPt = `Nossa casa fica incrivelmente ${nat} durante a época de festas.`;
        fbBlank = `Our home always feels so ______ when everyone visits.`;
        fbPt = `Nossa casa sempre parece tão ${nat} quando todos visitam.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `Our family always ${word} having Sunday dinner together.`;
        mcPt = `Nossa família sempre ${nat} jantar junta aos domingos.`;
        fbBlank = `We always ______ spending time together as a family.`;
        fbPt = `Nós sempre ${nat} passar tempo juntos em família.`;
      } else if (category === 'adverb') {
        mcExpected = `Our family is ${word} preparing dinner together tonight.`;
        mcPt = `Nossa família está ${nat} preparando o jantar junta hoje à noite.`;
        fbBlank = `Our family is ______ preparing dinner together tonight.`;
        fbPt = `Nossa família está ${nat} preparando o jantar junta hoje.`;
      }

      const mcOptions = [mcExpected, ...getScenarioMCDistractors('family', mcExpected, 2)].sort(() => 0.5 - Math.random());
      const fbOptions = [fbAnswer, ...getCategoryFBDistractors(category, fbAnswer, 2)].sort(() => 0.5 - Math.random());

      return {
        multipleChoice: {
          scenarioPt: mcScenario,
          promptPt: mcPrompt,
          expectedAnswer: mcExpected,
          options: mcOptions,
          ptTranslation: mcPt,
          hintPt: `Dica: Pense em qual resposta expressa "${nat}" no ambiente familiar.`,
          explanationPt: `Expressa intimidade e afeto natural no diálogo familiar em inglês.`,
        },
        matchPairs: {
          pairs,
          hintPt: `Dica: Ligue cada palavra da aula ao significado em português.`,
        },
        fillBlank: {
          sentenceWithBlank: fbBlank,
          expectedAnswer: fbAnswer,
          options: fbOptions,
          ptTranslation: fbPt,
          hintPt: `Dica: Escolha "${word}" (${nat}) para completar a frase da casa.`,
          explanationPt: `A palavra "${word}" se encaixa perfeitamente no diálogo familiar.`,
        },
        speakVerify: {
          sentence: svSentence,
          ptTranslation: svPt,
          hintPt: `Dica: Fale no microfone com ritmo pausado.`,
          explanationPt: `Ótima pronúncia! Essa frase de apoio mútuo é um clássico em inglês.`,
        },
        roleplayPrompt: {
          leoPrompt: rpLeo,
          promptPt: rpLeoPt,
          expectedAnswer: rpAnswer,
          ptTranslation: rpPt,
          hintPt: `Dica: Fale sobre a rotina da sua família incluindo "${word}".`,
        },
        sentenceBuild: {
          english: mcExpected,
          ptTranslation: mcPt,
          promptPt: `Monte: "${mcPt}"`,
          hintPt: `Dica: Organize as palavras com carinho na frase.`,
          distractors: ['dinner', 'home', 'together'],
        },
        listenType: {
          sentence: `My grandparents shared heartwarming stories from the past.`,
          ptTranslation: `Meus avós compartilharam histórias comoventes do passado.`,
          hintPt: `Dica: Ouça a pronúncia de "grandparents" e "stories".`,
        },
        grammarFix: {
          wrong: `I live in this house since five years.`,
          correct: `I have lived in this house for five years.`,
          promptPt: `Ajuste a estrutura temporal correta ("for" vs "since"):`,
          ptTranslation: `Eu moro nesta casa há cinco anos.`,
          hintPt: `Dica: Para períodos de duração ("há cinco anos") usamos "for" com present perfect.`,
          explanationPt: `Usamos "for" para duração de tempo (for 5 years) e "since" para o ponto de partida (since 2021).`,
        },
      };
    }

    case 'work': {
      // Day 3: Trabalho, Reuniões & Carreira
      let mcScenario = `No trabalho: Alinhando entregas e tarefas com sua equipe no escritório.`;
      let mcPrompt = `Qual frase expressa a ideia de "${nat}" com tom profissional e claro?`;
      let mcExpected = `We need to adjust our ${word} before the client meeting.`;
      let mcPt = `Precisamos ajustar nosso(a) ${nat} antes da reunião com o cliente.`;

      let fbBlank = `Please send me the updated ______ before the team meeting.`;
      let fbAnswer = word;
      let fbPt = `Por favor, me envie o(a) ${nat} atualizado(a) antes da reunião.`;

      let svSentence = `Let's schedule a quick call.`;
      let svPt = `Vamos marcar uma ligação rápida.`;

      let rpLeo = `How is your work week going, and what is your top priority today?`;
      let rpLeoPt = `Leo é seu colega de trabalho e pergunta: "Como está sua semana e qual sua maior prioridade hoje?" Responda usando "${word}":`;
      let rpAnswer = `My top priority is managing our ${word} effectively.`;
      let rpPt = `Minha maior prioridade é gerenciar nosso(a) ${nat} com eficiência.`;

      if (category === 'clause_i') {
        mcExpected = `So far ${word} organizing my priorities for the current sprint.`;
        mcPt = `Até agora ${nat} organizar minhas prioridades para o projeto atual.`;
        fbBlank = `During every project meeting, ______ sharing clear status updates.`;
        fbPt = `Em toda reunião de projeto, ${nat} compartilhar atualizações claras.`;
        rpAnswer = `Today ${word} focusing on key deliverables for the team.`;
        rpPt = `Hoje ${nat} focar nas entregas principais para a equipe.`;
      } else if (category === 'adjective') {
        mcExpected = `The entire project team felt ${word} before the product launch.`;
        mcPt = `A equipe inteira do projeto se sentiu ${nat} antes do lançamento do produto.`;
        fbBlank = `The workload was challenging, but the team remained ______.`;
        fbPt = `O volume de trabalho foi desafiador, mas a equipe permaneceu ${nat}.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `We need to ${word} our deliverables before the client call.`;
        mcPt = `Precisamos ${nat} nossas entregas antes da ligação com o cliente.`;
        fbBlank = `We always ______ collaborating closely with our colleagues.`;
        fbPt = `Nós sempre ${nat} colaborar de perto com nossos colegas.`;
      } else if (category === 'adverb') {
        mcExpected = `The team is ${word} finalizing the sprint deliverables today.`;
        mcPt = `A equipe está ${nat} finalizando as entregas do projeto hoje.`;
        fbBlank = `The team is ______ finalizing the sprint deliverables today.`;
        fbPt = `A equipe está ${nat} finalizando as entregas do projeto hoje.`;
      }

      const mcOptions = [mcExpected, ...getScenarioMCDistractors('work', mcExpected, 2)].sort(() => 0.5 - Math.random());
      const fbOptions = [fbAnswer, ...getCategoryFBDistractors(category, fbAnswer, 2)].sort(() => 0.5 - Math.random());

      return {
        multipleChoice: {
          scenarioPt: mcScenario,
          promptPt: mcPrompt,
          expectedAnswer: mcExpected,
          options: mcOptions,
          ptTranslation: mcPt,
          hintPt: `Dica: Escolha a comunicação corporativa que melhor expressa "${nat}".`,
          explanationPt: `Comunicação corporativa moderna em inglês é direta, colaborativa e clara.`,
        },
        matchPairs: {
          pairs,
          hintPt: `Dica: Conecte os termos profissionais com suas traduções.`,
        },
        fillBlank: {
          sentenceWithBlank: fbBlank,
          expectedAnswer: fbAnswer,
          options: fbOptions,
          ptTranslation: fbPt,
          hintPt: `Dica: Preencha com "${word}" (${nat}) para manter o fluxo profissional.`,
          explanationPt: `Encaixe perfeito na rotina de reuniões e entregas corporativas.`,
        },
        speakVerify: {
          sentence: svSentence,
          ptTranslation: svPt,
          hintPt: `Dica: Fale firme e com clareza no microfone.`,
          explanationPt: `Perfeito! "Schedule a quick call" é a frase número um do ambiente de trabalho global.`,
        },
        roleplayPrompt: {
          leoPrompt: rpLeo,
          promptPt: rpLeoPt,
          expectedAnswer: rpAnswer,
          ptTranslation: rpPt,
          hintPt: `Dica: Responda ao colega Leo mencionando "${word}".`,
        },
        sentenceBuild: {
          english: mcExpected,
          ptTranslation: mcPt,
          promptPt: `Monte: "${mcPt}"`,
          hintPt: `Dica: Monte a frase com foco nos prazos e prioridades.`,
          distractors: ['deadline', 'meeting', 'report'],
        },
        listenType: {
          sentence: `We need to align our deliverables before the end of the week.`,
          ptTranslation: `Precisamos alinhar nossas entregas antes do fim da semana.`,
          hintPt: `Dica: Ouça a pronúncia de "deliverables" e "align".`,
        },
        grammarFix: {
          wrong: `I will send you the report when I will finish it.`,
          correct: `I will send you the report when I finish it.`,
          promptPt: `Ajuste a oração temporal com "when" (elimine o "will" duplo):`,
          ptTranslation: `Vou te enviar o relatório quando eu terminar.`,
          hintPt: `Dica: Em orações que começam com "when/after/before" usamos o presente simples (finish), não "will finish".`,
          explanationPt: `Após conjunções temporais (when, as soon as), o inglês exige o presente simples para indicar futuro.`,
        },
      };
    }

    case 'travel': {
      // Day 4: Viagens, Aeroporto & Férias
      let mcScenario = `Em viagem: No aeroporto, hotel ou estação organizando sua jornada.`;
      let mcPrompt = `Qual frase em inglês expressa a ideia de "${nat}" com máxima clareza?`;
      let mcExpected = `Could you please confirm the ${word} on our flight tickets?`;
      let mcPt = `Você poderia por favor confirmar o(a) ${nat} em nossas passagens de voo?`;

      let fbBlank = `Keep your passport and travel ______ in your carry-on bag.`;
      let fbAnswer = word;
      let fbPt = `Mantenha seu passaporte e seu(sua) ${nat} de viagem na bagagem de mão.`;

      let svSentence = `Our flight departed on time.`;
      let svPt = `Nosso voo partiu no horário.`;

      let rpLeo = `Where are you planning to travel next, and what do you pack first?`;
      let rpLeoPt = `Leo é seu guia de viagem e pergunta: "Para onde você planeja viajar e o que arruma primeiro?" Responda usando "${word}":`;
      let rpAnswer = `I always double-check my ${word} before heading to the airport.`;
      let rpPt = `Eu sempre confiro duas vezes meu(minha) ${nat} antes de ir para o aeroporto.`;

      if (category === 'clause_i') {
        mcExpected = `Whenever I travel ${word} arriving at the airport well in advance.`;
        mcPt = `Sempre que viajo ${nat} chegar ao aeroporto com bastante antecedência.`;
        fbBlank = `When arriving in a new city, ______ exploring local markets on foot.`;
        fbPt = `Ao chegar a uma nova cidade, ${nat} explorar os mercados a pé.`;
        rpAnswer = `When traveling ${word} discovering new cultures and authentic foods.`;
        rpPt = `Ao viajar ${nat} descobrir novas culturas e comidas autênticas.`;
      } else if (category === 'adjective') {
        mcExpected = `The flight was remarkably ${word} despite the bad weather.`;
        mcPt = `O voo foi incrivelmente ${nat} apesar do mau tempo.`;
        fbBlank = `Our hotel room was very clean and ______ after a long flight.`;
        fbPt = `Nosso quarto de hotel era muito limpo e ${nat} após um voo longo.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `I always ${word} discovering new cultures when traveling abroad.`;
        mcPt = `Eu sempre ${nat} descobrir novas culturas ao viajar para o exterior.`;
        fbBlank = `Travelers always ______ exploring new destinations around the world.`;
        fbPt = `Viajantes sempre ${nat} explorar novos destinos pelo mundo.`;
      } else if (category === 'adverb') {
        mcExpected = `The airport shuttle is ${word} arriving at terminal two.`;
        mcPt = `O transporte do aeroporto está ${nat} chegando ao terminal dois.`;
        fbBlank = `The airport shuttle is ______ arriving at terminal two.`;
        fbPt = `O transporte do aeroporto está ${nat} chegando ao terminal dois.`;
      }

      const mcOptions = [mcExpected, ...getScenarioMCDistractors('travel', mcExpected, 2)].sort(() => 0.5 - Math.random());
      const fbOptions = [fbAnswer, ...getCategoryFBDistractors(category, fbAnswer, 2)].sort(() => 0.5 - Math.random());

      return {
        multipleChoice: {
          scenarioPt: mcScenario,
          promptPt: mcPrompt,
          expectedAnswer: mcExpected,
          options: mcOptions,
          ptTranslation: mcPt,
          hintPt: `Dica: Pense na situação de viagem para expressar "${nat}".`,
          explanationPt: `Vocabulário prático e útil para circular pelo mundo sem aperto.`,
        },
        matchPairs: {
          pairs,
          hintPt: `Dica: Ligue os pares de palavras de viagem em inglês e português.`,
        },
        fillBlank: {
          sentenceWithBlank: fbBlank,
          expectedAnswer: fbAnswer,
          options: fbOptions,
          ptTranslation: fbPt,
          hintPt: `Dica: Complete com "${word}" (${nat}) para a sua mala de viagem.`,
          explanationPt: `Estrutura perfeita para usar em aeroportos e hotéis no exterior.`,
        },
        speakVerify: {
          sentence: svSentence,
          ptTranslation: svPt,
          hintPt: `Dica: Fale no microfone com pronúncia clara de "departed".`,
          explanationPt: `Excelente! "On time" significa pontual, no horário previsto.`,
        },
        roleplayPrompt: {
          leoPrompt: rpLeo,
          promptPt: rpLeoPt,
          expectedAnswer: rpAnswer,
          ptTranslation: rpPt,
          hintPt: `Dica: Conte seus planos de viagem para o Leo usando "${word}".`,
        },
        sentenceBuild: {
          english: mcExpected,
          ptTranslation: mcPt,
          promptPt: `Monte: "${mcPt}"`,
          hintPt: `Dica: Monte a frase com os detalhes do voo.`,
          distractors: ['passport', 'luggage', 'flight'],
        },
        listenType: {
          sentence: `Please have your boarding pass ready for the gate agent.`,
          ptTranslation: `Por favor tenha seu cartão de embarque pronto para o atendente do portão.`,
          hintPt: `Dica: Ouça as palavras "boarding pass" e "gate agent".`,
        },
        grammarFix: {
          wrong: `I arrived to the airport two hours before departure.`,
          correct: `I arrived at the airport two hours before departure.`,
          promptPt: `Corrija a preposição com o verbo "arrive":`,
          ptTranslation: `Cheguei ao aeroporto duas horas antes do embarque.`,
          hintPt: `Dica: Em inglês dizemos "arrive at" para locais específicos como aeroporto, hotel ou estação.`,
          explanationPt: `Usamos "arrive at" para prédios e locais fechados, e "arrive in" para cidades ou países. Nunca "arrive to".`,
        },
      };
    }

    case 'friends': {
      // Day 5: Rolê com Amigos & Lazer
      let mcScenario = `Com amigos: Combinando saídas ou conversando no fim de semana.`;
      let mcPrompt = `Qual frase expressa a ideia de "${nat}" com tom descontraído e amigável?`;
      let mcExpected = `Let's sync our weekend ${word} so we can hang out downtown.`;
      let mcPt = `Vamos sincronizar nosso(a) ${nat} de fim de semana para sair no centro.`;

      let fbBlank = `We should definitely ______ and catch up this Saturday.`;
      let fbAnswer = word;
      let fbPt = `Nós com certeza deveríamos colocar o papo em dia neste sábado.`;

      let svSentence = `We had so much fun.`;
      let svPt = `Nós nos divertimos tanto.`;

      let rpLeo = `What do you and your friends usually do to unwind on weekends?`;
      let rpLeoPt = `Leo pergunta sobre seus rolês: "O que você e seus amigos costumam fazer para relaxar no fim de semana?" Responda usando "${word}":`;
      let rpAnswer = `We like to hang out and enjoy our ${word} together.`;
      let rpPt = `Nós gostamos de sair e aproveitar nosso(a) ${nat} juntos.`;

      if (category === 'clause_i') {
        mcExpected = `Whenever we meet ${word} laughing about our funniest stories.`;
        mcPt = `Sempre que nos encontramos ${nat} rir das nossas histórias mais engraçadas.`;
        fbBlank = `Whenever we get together, ______ sharing great music and laughs.`;
        fbPt = `Sempre que nos reunimos, ${nat} compartilhar boas músicas e risadas.`;
        rpAnswer = `On Friday nights ${word} going out for burgers and chilling.`;
        rpPt = `Nas noites de sexta ${nat} sair para comer hambúrguer e relaxar.`;
      } else if (category === 'adjective') {
        mcExpected = `The concert atmosphere was completely ${word} last night!`;
        mcPt = `O clima do show estava completamente ${nat} ontem à noite!`;
        fbBlank = `Our weekend hangout was so ______ and full of laughs.`;
        fbPt = `Nosso rolê de fim de semana foi tão ${nat} e cheio de risadas.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `We always ${word} meeting downtown on Friday evenings.`;
        mcPt = `Nós sempre ${nat} nos encontrar no centro nas noites de sexta.`;
        fbBlank = `We should definitely ______ and catch up this Saturday afternoon.`;
        fbPt = `Nós com certeza deveríamos ${nat} neste sábado à tarde.`;
      } else if (category === 'adverb') {
        mcExpected = `We are ${word} planning a road trip together this summer.`;
        mcPt = `Nós estamos ${nat} planejando uma viagem de carro juntos neste verão.`;
        fbBlank = `We are ______ planning a fun weekend getaway together.`;
        fbPt = `Nós estamos ${nat} planejando um passeio divertido de fim de semana juntos.`;
      }

      const mcOptions = [mcExpected, ...getScenarioMCDistractors('friends', mcExpected, 2)].sort(() => 0.5 - Math.random());
      const fbOptions = [fbAnswer, ...getCategoryFBDistractors(category, fbAnswer, 2)].sort(() => 0.5 - Math.random());

      return {
        multipleChoice: {
          scenarioPt: mcScenario,
          promptPt: mcPrompt,
          expectedAnswer: mcExpected,
          options: mcOptions,
          ptTranslation: mcPt,
          hintPt: `Dica: Pense em um rolê descontraído com amigos expressando "${nat}".`,
          explanationPt: `Inglês informal entre amigos usa expressões leves, descontraídas e acolhedoras.`,
        },
        matchPairs: {
          pairs,
          hintPt: `Dica: Conecte as expressões de amizade e lazer.`,
        },
        fillBlank: {
          sentenceWithBlank: fbBlank,
          expectedAnswer: fbAnswer,
          options: fbOptions,
          ptTranslation: fbPt,
          hintPt: `Dica: Encaixe "${word}" (${nat}) no plano do fim de semana.`,
          explanationPt: `Perfeito para convidar amigos e marcar encontros descontraídos.`,
        },
        speakVerify: {
          sentence: svSentence,
          ptTranslation: svPt,
          hintPt: `Dica: Fale no microfone com entusiasmo natural.`,
          explanationPt: `"So much fun" é a forma mais natural em inglês para dizer que algo foi divertidíssimo.`,
        },
        roleplayPrompt: {
          leoPrompt: rpLeo,
          promptPt: rpLeoPt,
          expectedAnswer: rpAnswer,
          ptTranslation: rpPt,
          hintPt: `Dica: Responda ao Leo sobre seu fim de semana usando "${word}".`,
        },
        sentenceBuild: {
          english: mcExpected,
          ptTranslation: mcPt,
          promptPt: `Monte: "${mcPt}"`,
          hintPt: `Dica: Monte a frase com os amigos.`,
          distractors: ['party', 'weekend', 'friends'],
        },
        listenType: {
          sentence: `We should definitely hang out more often this summer.`,
          ptTranslation: `Nós com certeza deveríamos sair juntos com mais frequência neste verão.`,
          hintPt: `Dica: Ouça o phrasal verb "hang out".`,
        },
        grammarFix: {
          wrong: `I like very much to hang out with my close friends.`,
          correct: `I really like hanging out with my close friends.`,
          promptPt: `Ajuste a posição natural de "really like" na frase:`,
          ptTranslation: `Eu realmente gosto de sair com meus amigos próximos.`,
          hintPt: `Dica: Em inglês colocamos "really like" antes do verbo, evitando o "like very much" no início.`,
          explanationPt: `Falantes nativos dizem "I really like doing something" ao invés de "I like very much".`,
        },
      };
    }

    case 'dating': {
      // Day 6: Encontros, Emoções & Relacionamentos
      const variant = Math.abs(seedIndex) % 3;
      let mcScenario = `Em um encontro ou conversa sincera sobre sentimentos e vida a dois.`;
      let mcPrompt = `Qual frase expressa a ideia de "${nat}" de forma madura e sincera?`;
      let mcExpected = `Honest communication builds genuine ${word} between two people.`;
      let mcPt = `Comunicação sincera constrói verdadeiro(a) ${nat} entre duas pessoas.`;

      let fbBlank = `Mutual respect and ______ are key to any healthy relationship.`;
      let fbAnswer = word;
      let fbPt = `Respeito mútuo e ${nat} são fundamentais em qualquer relação saudável.`;

      let svSentence = `We had a wonderful conversation tonight.`;
      let svPt = `Tivemos uma conversa maravilhosa hoje à noite.`;

      let rpLeo = `In your opinion, what makes a relationship truly lasting and happy?`;
      let rpLeoPt = `Leo pergunta sobre conexões e relacionamentos: "Na sua opinião, o que torna uma relação duradoura e feliz?" Responda usando "${word}":`;
      let rpAnswer = `Being authentic and showing true ${word} makes all the difference.`;
      let rpPt = `Ser autêntico e demonstrar verdadeiro(a) ${nat} faz toda a diferença.`;

      if (category === 'clause_i') {
        if (variant === 0) {
          mcExpected = `To be completely honest, ${word} valuing genuine and deep connections.`;
          mcPt = `Para ser totalmente sincero(a), ${nat} valorizar conexões profundas e verdadeiras.`;
          fbBlank = `In romantic relationships, ______ learning to communicate with patience.`;
          fbPt = `Em relacionamentos, ${nat} aprender a se comunicar com paciência.`;
        } else if (variant === 1) {
          mcExpected = `When dating someone new, ${word} being authentic from day one.`;
          mcPt = `Ao sair com alguém novo, ${nat} ser autêntico(a) desde o primeiro dia.`;
          fbBlank = `When meeting someone special, ______ taking things slow and enjoying each moment.`;
          fbPt = `Ao conhecer alguém especial, ${nat} ir com calma e curtir cada momento.`;
        } else {
          mcExpected = `In my heart, ${word} believing that mutual respect is everything.`;
          mcPt = `No meu coração, ${nat} acreditar que respeito mútuo é tudo.`;
          fbBlank = `When building a future together, ______ listening to each other with care.`;
          fbPt = `Ao construir um futuro juntos, ${nat} ouvir um ao outro com carinho.`;
        }
      } else if (category === 'adjective') {
        if (variant === 0) {
          mcExpected = `Their first deep conversation was surprisingly ${word} and brought them closer.`;
          mcPt = `A primeira conversa profunda deles foi surpreendentemente ${nat} e os aproximou.`;
          fbBlank = `Meeting someone who makes you feel safe and ______ is priceless.`;
          fbPt = `Conhecer alguém que te faz se sentir seguro e ${nat} não tem preço.`;
        } else if (variant === 1) {
          mcExpected = `Being with someone who makes you feel ${word} and respected is a true blessing.`;
          mcPt = `Estar com alguém que te faz se sentir ${nat} e respeitado(a) é uma verdadeira bênção.`;
          fbBlank = `A loving partnership always feels safe, honest, and ______.`;
          fbPt = `Uma parceria amorosa sempre parece segura, sincera e ${nat}.`;
        } else {
          mcExpected = `They shared an emotionally ${word} moment watching the sunset together.`;
          mcPt = `Eles compartilharam um momento emocionalmente ${nat} assistindo ao pôr do sol juntos.`;
          fbBlank = `Having open and ______ conversations strengthens any bond over time.`;
          fbPt = `Ter conversas abertas e ${nat} fortalece qualquer laço com o tempo.`;
        }
      } else if (category === 'phrasal_verb') {
        if (variant === 0) {
          mcExpected = `It takes true courage to ${word} when you are discussing delicate feelings.`;
          mcPt = `Exige verdadeira coragem ${nat} ao conversar sobre sentimentos delicados.`;
          fbBlank = `In healthy relationships, partners always feel safe to ______ without fear.`;
          fbPt = `Em relacionamentos saudáveis, os parceiros sempre se sentem seguros para ${nat} sem medo.`;
        } else if (variant === 1) {
          mcExpected = `In any lasting relationship, learning to ${word} prevents misunderstandings before they grow.`;
          mcPt = `Em qualquer relação duradoura, aprender a ${nat} evita mal-entendidos antes que eles cresçam.`;
          fbBlank = `True partners always encourage each other to ______ during difficult moments.`;
          fbPt = `Parceiros verdadeiros sempre incentivam um ao outro a ${nat} em momentos difíceis.`;
        } else {
          mcExpected = `Both partners agreed that taking time to ${word} made their bond much stronger.`;
          mcPt = `Ambos os parceiros concordaram que dedicar tempo para ${nat} tornou o laço muito mais forte.`;
          fbBlank = `It takes patience and emotional maturity to learn how to ______ in a relationship.`;
          fbPt = `Exige paciência e maturidade emocional aprender como ${nat} em um relacionamento.`;
        }
      } else if (category === 'noun') {
        if (variant === 0) {
          mcExpected = `Building mutual ${word} requires honest communication and patience between two people.`;
          mcPt = `Construir ${nat} mútuo(a) exige comunicação sincera e paciência entre duas pessoas.`;
          fbBlank = `Mutual ______ and active listening are key to any long-term relationship.`;
          fbPt = `${nat} mútuo(a) e escuta ativa são fundamentais para qualquer relacionamento duradouro.`;
        } else if (variant === 1) {
          mcExpected = `They discovered that true ${word} was the foundation for a lasting emotional connection.`;
          mcPt = `Eles descobriram que verdadeiro(a) ${nat} era o alicerce para uma conexão emocional duradoura.`;
          fbBlank = `Couples need both patience and ______ to overcome challenging life stages.`;
          fbPt = `Casais precisam de paciência e ${nat} para superar fases desafiadoras da vida.`;
        } else {
          mcExpected = `Sharing your genuine feelings allows ${word} to develop naturally over time.`;
          mcPt = `Compartilhar sentimentos genuínos permite que o(a) ${nat} se desenvolva naturalmente com o tempo.`;
          fbBlank = `Honesty and ______ create a solid foundation for any couple.`;
          fbPt = `Honestidade e ${nat} criam uma base sólida para qualquer casal.`;
        }
      } else if (category === 'adverb') {
        if (variant === 0) {
          mcExpected = `Couples who communicate ${word} resolve misunderstandings much faster.`;
          mcPt = `Casais que se comunicam ${nat} resolvem desentendimentos muito mais rápido.`;
          fbBlank = `They are ______ learning how to communicate with deep patience and warmth.`;
          fbPt = `Eles estão ${nat} aprendendo a se comunicar com paciência profunda e afeto.`;
        } else if (variant === 1) {
          mcExpected = `Speaking ${word} and from the heart builds lasting harmony between partners.`;
          mcPt = `Falar ${nat} e de coração constrói harmonia duradoura entre os parceiros.`;
          fbBlank = `Speaking ______ with each other prevents misunderstandings before they grow.`;
          fbPt = `Falar ${nat} um com o outro evita mal-entendidos antes que eles cresçam.`;
        } else {
          mcExpected = `They listened ${word} to each other while discussing their future plans.`;
          mcPt = `Eles ouviram ${nat} um ao outro enquanto conversavam sobre seus planos futuros.`;
          fbBlank = `They listened ______ to each other while discussing their future plans.`;
          fbPt = `Eles ouviram ${nat} um ao outro enquanto conversavam sobre seus planos futuros.`;
        }
      }

      const mcOptions = [mcExpected, ...getScenarioMCDistractors('dating', mcExpected, 2)].sort(() => 0.5 - Math.random());
      const fbOptions = [fbAnswer, ...getCategoryFBDistractors(category, fbAnswer, 2)].sort(() => 0.5 - Math.random());

      return {
        multipleChoice: {
          scenarioPt: mcScenario,
          promptPt: mcPrompt,
          expectedAnswer: mcExpected,
          options: mcOptions,
          ptTranslation: mcPt,
          hintPt: `Dica: Pense em conversas maduras e sinceras expressando "${nat}".`,
          explanationPt: `Tratar de sentimentos com vocabulário refinado é essencial para conversas adultas.`,
        },
        matchPairs: {
          pairs,
          hintPt: `Dica: Ligue os termos de sentimentos e relacionamentos.`,
        },
        fillBlank: {
          sentenceWithBlank: fbBlank,
          expectedAnswer: fbAnswer,
          options: fbOptions,
          ptTranslation: fbPt,
          hintPt: `Dica: Complete com "${word}" (${nat}) para falar de relações reais.`,
          explanationPt: `Encaixe natural e profundo sobre a vida afetiva.`,
        },
        speakVerify: {
          sentence: svSentence,
          ptTranslation: svPt,
          hintPt: `Dica: Pronuncie com entonação calorosa e tranquila.`,
          explanationPt: `Muito bem! Essa frase transmite apreço sincero pelo momento compartilhado.`,
        },
        roleplayPrompt: {
          leoPrompt: rpLeo,
          promptPt: rpLeoPt,
          expectedAnswer: rpAnswer,
          ptTranslation: rpPt,
          hintPt: `Dica: Responda ao Leo sobre encontros reais usando "${word}".`,
        },
        sentenceBuild: {
          english: mcExpected,
          ptTranslation: mcPt,
          promptPt: `Monte: "${mcPt}"`,
          hintPt: `Dica: Organize as palavras sobre honestidade e sentimentos.`,
          distractors: ['heart', 'feelings', 'together'],
        },
        listenType: {
          sentence: `They really connected on their very first dinner together.`,
          ptTranslation: `Eles realmente se conectaram logo no primeiro jantar juntos.`,
          hintPt: `Dica: Ouça a ligação sonora de "connected on".`,
        },
        grammarFix: {
          wrong: `She is married with a Brazilian engineer.`,
          correct: `She is married to a Brazilian engineer.`,
          promptPt: `Ajuste a preposição correta com "married":`,
          ptTranslation: `Ela é casada com um engenheiro brasileiro.`,
          hintPt: `Dica: Em inglês dizemos "married to", e não "married with".`,
          explanationPt: `Pegadinha clássica para brasileiros: em inglês a estrutura correta é "married TO someone".`,
        },
      };
    }

    default: {
      // Day 7: Vida Real, Cidade, Compras & Desafios
      let mcScenario = `Na cidade: Fazendo compras e resolvendo tarefas do dia a dia.`;
      let mcPrompt = `Qual frase resolve melhor a situação sobre "${nat}" com praticidade?`;
      let mcExpected = `Excuse me, could you point me toward the nearest ${word}?`;
      let mcPt = `Com licença, você poderia me indicar onde fica o(a) ${nat} mais próximo(a)?`;

      let fbBlank = `There is a very convenient ______ located right around the corner.`;
      let fbAnswer = word;
      let fbPt = `Há um(a) ${nat} muito prático(a) localizado logo ali na esquina.`;

      let svSentence = `Everything was quick and convenient.`;
      let svPt = `Tudo foi rápido e prático.`;

      let rpLeo = `What everyday errands do you need to take care of around town today?`;
      let rpLeoPt = `Leo pergunta sobre seu dia a dia na cidade: "Quais tarefas você precisa resolver na rua hoje?" Responda usando "${word}":`;
      let rpAnswer = `I have to handle my ${word} before the stores close.`;
      let rpPt = `Tenho que resolver meu(minha) ${nat} antes de as lojas fecharem.`;

      if (category === 'clause_i') {
        mcExpected = `Today ${word} stopping by the store to pick up fresh bread.`;
        mcPt = `Hoje ${nat} passar na loja para pegar pão fresco.`;
        fbBlank = `When running daily errands, ______ walking instead of driving.`;
        fbPt = `Ao resolver tarefas do dia a dia, ${nat} caminhar em vez de dirigir.`;
        rpAnswer = `Today ${word} taking care of all my weekly errands in town.`;
        rpPt = `Hoje ${nat} cuidar de todas as minhas tarefas da semana na cidade.`;
      } else if (category === 'adjective') {
        mcExpected = `The shopping center was surprisingly ${word} on Monday morning.`;
        mcPt = `O shopping estava surpreendentemente ${nat} na manhã de segunda.`;
        fbBlank = `Finding parking downtown was surprisingly ______ today.`;
        fbPt = `Achar vaga no centro foi surpreendentemente ${nat} hoje.`;
      } else if (category === 'phrasal_verb') {
        mcExpected = `I have to ${word} a few urgent errands before the stores close.`;
        mcPt = `Tenho que ${nat} algumas tarefas urgentes antes que as lojas fechem.`;
        fbBlank = `I need to ______ a few errands around town this afternoon.`;
        fbPt = `Preciso ${nat} algumas tarefas pela cidade esta tarde.`;
      } else if (category === 'adverb') {
        mcExpected = `The local store is ${word} open twenty-four hours a day.`;
        mcPt = `A loja local está ${nat} aberta vinte e quatro horas por dia.`;
        fbBlank = `The local store is ______ open twenty-four hours a day.`;
        fbPt = `A loja local está ${nat} aberta vinte e quatro horas por dia.`;
      }

      const mcOptions = [mcExpected, ...getScenarioMCDistractors('city', mcExpected, 2)].sort(() => 0.5 - Math.random());
      const fbOptions = [fbAnswer, ...getCategoryFBDistractors(category, fbAnswer, 2)].sort(() => 0.5 - Math.random());

      return {
        multipleChoice: {
          scenarioPt: mcScenario,
          promptPt: mcPrompt,
          expectedAnswer: mcExpected,
          options: mcOptions,
          ptTranslation: mcPt,
          hintPt: `Dica: Pense na praticidade de resolver coisas na cidade sobre "${nat}".`,
          explanationPt: `Linguagem prática e resolutiva para se virar no cotidiano de qualquer cidade.`,
        },
        matchPairs: {
          pairs,
          hintPt: `Dica: Ligue os termos da rotina urbana e compras.`,
        },
        fillBlank: {
          sentenceWithBlank: fbBlank,
          expectedAnswer: fbAnswer,
          options: fbOptions,
          ptTranslation: fbPt,
          hintPt: `Dica: Complete com "${word}" (${nat}) para a rotina da cidade.`,
          explanationPt: `Vocabulário funcional para o comércio, mercados e serviços.`,
        },
        speakVerify: {
          sentence: svSentence,
          ptTranslation: svPt,
          hintPt: `Dica: Leia a frase curta no microfone com firmeza.`,
          explanationPt: `"Quick and convenient" é a dupla perfeita para descrever serviços eficientes em inglês.`,
        },
        roleplayPrompt: {
          leoPrompt: rpLeo,
          promptPt: rpLeoPt,
          expectedAnswer: rpAnswer,
          ptTranslation: rpPt,
          hintPt: `Dica: Responda ao Leo sobre suas tarefas na rua usando "${word}".`,
        },
        sentenceBuild: {
          english: mcExpected,
          ptTranslation: mcPt,
          promptPt: `Monte: "${mcPt}"`,
          hintPt: `Dica: Organize as palavras para a tarefa do dia.`,
          distractors: ['market', 'city', 'shopping'],
        },
        listenType: {
          sentence: `The local store offers convenient delivery within the neighborhood.`,
          ptTranslation: `A loja local oferece entrega conveniente dentro do bairro.`,
          hintPt: `Dica: Ouça as palavras "convenient delivery".`,
        },
        grammarFix: {
          wrong: `How much does this apples cost?`,
          correct: `How much do these apples cost?`,
          promptPt: `Ajuste a concordância de plural ("this" vs "these", "does" vs "do"):`,
          ptTranslation: `Quanto custam estas maçãs?`,
          hintPt: `Dica: Para substantivos no plural (apples), usamos "these" e o auxiliar "do".`,
          explanationPt: `Plural em inglês: "these apples" combina com "do cost" (nunca "does" ou "this").`,
        },
      };
    }
  }
}

/**
 * Builds a complete standalone LessonPayload from vocabulary items.
 * Supports Block Specialization via `preferredType`:
 * - multiple_choice: Block 1 - Quiz de Situação Real (varied questions testing each word)
 * - match_pairs: Block 2 - Minigame de Ligar os Pares (tactile matching rounds)
 * - fill_blank: Block 3 - Complete a Frase no Cenário (contextual cloze sentences)
 * - speak_verify: Block 4 - Pronúncia & Fala Ativa (oral speak verify + roleplay with Leo)
 */
export function buildCustomLesson(
  topic: string,
  level: CEFRLevel,
  items: ParsedVocabularyItem[],
  notes?: string,
  geminiMatrix?: Record<string, any>,
  scenarioKey: DayScenarioKey = 'restaurant',
  preferredType?: ExerciseType
): LessonPayload {
  const wordsCovered = items.map((i) => i.english);
  const primaryItem = items[0] || { id: '1', english: 'practice' };
  const exercises: Exercise[] = [];

  if (preferredType === 'multiple_choice') {
    // Specialized Block 1: Quiz de Situação Real (4 questions, testing each word)
    const count = Math.max(3, Math.min(items.length, 5));
    for (let index = 0; index < count; index++) {
      const item = items[index % items.length] || primaryItem;
      const word = item.english;
      const richBundle = createRichSentences(item, index, scenarioKey, items);

      exercises.push({
        id: `mc_${index}_${Date.now()}_${index}`,
        type: 'multiple_choice',
        targetWord: word,
        instruction: 'Choose the best response for this real-world scenario:',
        instructionPt: 'Qual é a resposta correta para esta situação?',
        promptText: richBundle.multipleChoice.promptPt,
        promptTextPt: richBundle.multipleChoice.scenarioPt,
        audioSentence: richBundle.multipleChoice.expectedAnswer,
        expectedAnswer: richBundle.multipleChoice.expectedAnswer,
        expectedAnswerPt: richBundle.multipleChoice.ptTranslation,
        acceptableVariations: [richBundle.multipleChoice.expectedAnswer],
        wordBank: richBundle.multipleChoice.options,
        requiredWords: [word],
        options: richBundle.multipleChoice.options,
        hint: 'Think about what sounds polite and natural in this context.',
        hintPt: richBundle.multipleChoice.hintPt,
        explanation: 'Great choice! This is the most natural way to respond in real life.',
        explanationPt: richBundle.multipleChoice.explanationPt,
        audioSpeedDefault: 1.0,
      });
    }
  } else if (preferredType === 'match_pairs') {
    // Specialized Block 2: Minigame de Ligar os Pares (tactile matching rounds)
    const richBundle0 = createRichSentences(primaryItem, 0, scenarioKey, items);
    exercises.push({
      id: `mp_0_${Date.now()}_0`,
      type: 'match_pairs',
      targetWord: primaryItem.english,
      instruction: 'Match the English and Portuguese pairs:',
      instructionPt: 'Toque nos pares correspondentes em inglês e português:',
      promptText: 'Match each English word with its Portuguese meaning.',
      promptTextPt: 'Ligue cada palavra ao seu significado correspondente:',
      audioSentence: primaryItem.english,
      expectedAnswer: 'completed',
      expectedAnswerPt: 'Pares conectados com sucesso',
      acceptableVariations: ['completed'],
      wordBank: [],
      requiredWords: [primaryItem.english],
      pairs: richBundle0.matchPairs.pairs,
      hint: 'Take your time and match the vocabulary items.',
      hintPt: richBundle0.matchPairs.hintPt,
      explanation: 'Awesome! Quick matching builds instinctive vocabulary recall.',
      explanationPt: 'Excelente! Conectar pares rapidamente desenvolve reflexo e memória de longo prazo.',
      audioSpeedDefault: 1.0,
    });

    const secondItem = items[1] || primaryItem;
    const richBundle1 = createRichSentences(secondItem, 1, scenarioKey, items);
    exercises.push({
      id: `sb_1_${Date.now()}_1`,
      type: 'sentence_build',
      targetWord: secondItem.english,
      instruction: 'Tap the words in the correct order to form the sentence:',
      instructionPt: 'Toque nas palavras na ordem correta para montar a frase:',
      promptText: `Monte em inglês: "${richBundle1.sentenceBuild.ptTranslation}"`,
      promptTextPt: richBundle1.sentenceBuild.ptTranslation,
      audioSentence: richBundle1.sentenceBuild.english,
      expectedAnswer: richBundle1.sentenceBuild.english,
      expectedAnswerPt: richBundle1.sentenceBuild.ptTranslation,
      acceptableVariations: [
        richBundle1.sentenceBuild.english,
        richBundle1.sentenceBuild.english.replace(/[.,!?]/g, ''),
      ],
      wordBank: [
        ...richBundle1.sentenceBuild.english.replace(/[.,!?]/g, '').split(' '),
        ...(richBundle1.sentenceBuild.distractors || ['always', 'time']),
      ].sort(() => 0.5 - Math.random()),
      requiredWords: [secondItem.english],
      hint: 'Arrange the subject and verb in natural order.',
      hintPt: richBundle1.sentenceBuild.hintPt,
      explanation: 'Terrific! Assembling real sentences solidifies English grammar intuition.',
      explanationPt: 'Sensacional! Montar frases reais fixa a ordem natural das palavras em inglês.',
      audioSpeedDefault: 1.0,
    });

    const thirdItem = items[2] || items[0] || primaryItem;
    const richBundle2 = createRichSentences(thirdItem, 2, scenarioKey, items);
    exercises.push({
      id: `mp_2_${Date.now()}_2`,
      type: 'match_pairs',
      targetWord: thirdItem.english,
      instruction: 'Match the pairs to finish the minigame round:',
      instructionPt: 'Ligue os pares para finalizar a rodada do minigame:',
      promptText: 'Final consolidation round: match all remaining pairs.',
      promptTextPt: 'Rodada final de consolidação: conecte todos os pares.',
      audioSentence: thirdItem.english,
      expectedAnswer: 'completed',
      expectedAnswerPt: 'Pares conectados com sucesso',
      acceptableVariations: ['completed'],
      wordBank: [],
      requiredWords: [thirdItem.english],
      pairs: richBundle2.matchPairs.pairs,
      hint: 'Connect the corresponding words.',
      hintPt: richBundle2.matchPairs.hintPt,
      explanation: 'Full clear! You have mastered the vocabulary connections.',
      explanationPt: 'Rodada concluída! Você fixou os pares de vocabulário com maestria.',
      audioSpeedDefault: 1.0,
    });
  } else if (preferredType === 'fill_blank') {
    // Specialized Block 3: Complete a Frase no Cenário (4 fill-in-the-blank questions)
    const count = Math.max(3, Math.min(items.length, 5));
    for (let index = 0; index < count; index++) {
      const item = items[index % items.length] || primaryItem;
      const word = item.english;
      const richBundle = createRichSentences(item, index, scenarioKey, items);

      exercises.push({
        id: `fb_${index}_${Date.now()}_${index}`,
        type: 'fill_blank',
        targetWord: word,
        instruction: 'Tap the correct word to complete the sentence:',
        instructionPt: 'Toque na palavra correta para preencher a lacuna:',
        promptText: richBundle.fillBlank.sentenceWithBlank,
        promptTextPt: richBundle.fillBlank.ptTranslation,
        sentenceWithBlank: richBundle.fillBlank.sentenceWithBlank,
        audioSentence: richBundle.fillBlank.sentenceWithBlank.replace('______', richBundle.fillBlank.expectedAnswer),
        expectedAnswer: richBundle.fillBlank.expectedAnswer,
        expectedAnswerPt: richBundle.fillBlank.ptTranslation,
        acceptableVariations: [
          richBundle.fillBlank.expectedAnswer,
          richBundle.fillBlank.expectedAnswer.toLowerCase(),
        ],
        wordBank: richBundle.fillBlank.options,
        requiredWords: [word],
        options: richBundle.fillBlank.options,
        hint: 'Look closely at the context clues before and after the blank.',
        hintPt: richBundle.fillBlank.hintPt,
        explanation: 'Spot on! Choosing words in context is how native speakers think.',
        explanationPt: richBundle.fillBlank.explanationPt,
        audioSpeedDefault: 1.0,
      });
    }
  } else if (preferredType === 'speak_verify') {
    // Specialized Block 4: Pronúncia & Fala Ativa (oral speak + roleplay with Leo)
    const speakCount = Math.max(2, Math.min(items.length, 3));
    for (let index = 0; index < speakCount; index++) {
      const item = items[index % items.length] || primaryItem;
      const word = item.english;
      const richBundle = createRichSentences(item, index, scenarioKey, items);

      exercises.push({
        id: `sv_${index}_${Date.now()}_${index}`,
        type: 'speak_verify',
        targetWord: word,
        instruction: 'Read the short phrase aloud using your microphone:',
        instructionPt: 'Leia a frase curta em voz alta no microfone:',
        promptText: `Leia em voz alta: "${richBundle.speakVerify.sentence}"`,
        promptTextPt: richBundle.speakVerify.ptTranslation,
        audioSentence: richBundle.speakVerify.sentence,
        expectedAnswer: richBundle.speakVerify.sentence,
        expectedAnswerPt: richBundle.speakVerify.ptTranslation,
        acceptableVariations: [
          richBundle.speakVerify.sentence,
          richBundle.speakVerify.sentence.toLowerCase(),
          richBundle.speakVerify.sentence.replace(/[.,!?]/g, ''),
        ],
        wordBank: richBundle.speakVerify.sentence.split(' '),
        requiredWords: [word],
        hint: 'Speak clearly into your microphone at your normal pace.',
        hintPt: richBundle.speakVerify.hintPt,
        explanation: 'Pronunciation verified! Short spoken phrases build genuine speaking stamina.',
        explanationPt: richBundle.speakVerify.explanationPt,
        audioSpeedDefault: 1.0,
      });
    }

    const leoItem = items[0] || primaryItem;
    const richBundleLeo = createRichSentences(leoItem, 0, scenarioKey, items);
    exercises.push({
      id: `rp_leo_${Date.now()}`,
      type: 'roleplay_prompt',
      targetWord: leoItem.english,
      instruction: 'Answer Leo in English using the target vocabulary:',
      instructionPt: 'Responda ao Leo em inglês usando a palavra obrigatória:',
      promptText: richBundleLeo.roleplayPrompt.leoPrompt,
      promptTextPt: richBundleLeo.roleplayPrompt.promptPt,
      audioSentence: richBundleLeo.roleplayPrompt.leoPrompt,
      expectedAnswer: richBundleLeo.roleplayPrompt.expectedAnswer,
      expectedAnswerPt: richBundleLeo.roleplayPrompt.ptTranslation,
      acceptableVariations: [
        richBundleLeo.roleplayPrompt.expectedAnswer,
        richBundleLeo.roleplayPrompt.expectedAnswer.toLowerCase(),
        `I always use ${leoItem.english} in this situation.`,
        `I prefer to use ${leoItem.english}.`,
      ],
      wordBank: ['I', 'use', leoItem.english, 'always', 'at', 'home', 'with', 'people', 'when', 'we'],
      requiredWords: [leoItem.english],
      hint: `Form a natural sentence containing "${leoItem.english}".`,
      hintPt: richBundleLeo.roleplayPrompt.hintPt,
      explanation: 'Terrific answer! Applying vocabulary in conversational dialogue is the peak of fluency.',
      explanationPt: `Excelente resposta conversacional! Você colocou "${leoItem.english}" em prática ativa no diálogo com o Leo.`,
      audioSpeedDefault: 1.0,
    });
  } else {
    // Default progressive mix
    const exerciseCount = Math.max(5, Math.min(items.length * 2, 6));
    for (let index = 0; index < exerciseCount; index++) {
      const item = items[index % items.length] || primaryItem;
      const word = item.english;
      const typeMod = index % 5;
      const richBundle = createRichSentences(item, index, scenarioKey, items);

      if (typeMod === 0) {
        exercises.push({
          id: `mc_${index}_${Date.now()}_${index}`,
          type: 'multiple_choice',
          targetWord: word,
          instruction: 'Choose the best response for this real-world scenario:',
          instructionPt: 'Qual é a resposta correta para esta situação?',
          promptText: richBundle.multipleChoice.promptPt,
          promptTextPt: richBundle.multipleChoice.scenarioPt,
          audioSentence: richBundle.multipleChoice.expectedAnswer,
          expectedAnswer: richBundle.multipleChoice.expectedAnswer,
          expectedAnswerPt: richBundle.multipleChoice.ptTranslation,
          acceptableVariations: [richBundle.multipleChoice.expectedAnswer],
          wordBank: richBundle.multipleChoice.options,
          requiredWords: [word],
          options: richBundle.multipleChoice.options,
          hint: 'Think about what sounds polite and natural in this context.',
          hintPt: richBundle.multipleChoice.hintPt,
          explanation: 'Great choice! This is the most natural way to respond in real life.',
          explanationPt: richBundle.multipleChoice.explanationPt,
          audioSpeedDefault: 1.0,
        });
      } else if (typeMod === 1) {
        exercises.push({
          id: `mp_${index}_${Date.now()}_${index}`,
          type: 'match_pairs',
          targetWord: word,
          instruction: 'Match the English and Portuguese pairs:',
          instructionPt: 'Toque nos pares correspondentes em inglês e português:',
          promptText: 'Match each English word with its Portuguese meaning.',
          promptTextPt: 'Ligue cada palavra ao seu significado correspondente:',
          audioSentence: word,
          expectedAnswer: 'completed',
          expectedAnswerPt: 'Pares conectados com sucesso',
          acceptableVariations: ['completed'],
          wordBank: [],
          requiredWords: [word],
          pairs: richBundle.matchPairs.pairs,
          hint: 'Take your time and match the vocabulary items.',
          hintPt: richBundle.matchPairs.hintPt,
          explanation: 'Awesome! Quick matching builds instinctive vocabulary recall.',
          explanationPt: 'Excelente! Conectar pares rapidamente desenvolve reflexo e memória de longo prazo.',
          audioSpeedDefault: 1.0,
        });
      } else if (typeMod === 2) {
        exercises.push({
          id: `fb_${index}_${Date.now()}_${index}`,
          type: 'fill_blank',
          targetWord: word,
          instruction: 'Tap the correct word to complete the sentence:',
          instructionPt: 'Toque na palavra correta para preencher a lacuna:',
          promptText: richBundle.fillBlank.sentenceWithBlank,
          promptTextPt: richBundle.fillBlank.ptTranslation,
          sentenceWithBlank: richBundle.fillBlank.sentenceWithBlank,
          audioSentence: richBundle.fillBlank.sentenceWithBlank.replace('______', richBundle.fillBlank.expectedAnswer),
          expectedAnswer: richBundle.fillBlank.expectedAnswer,
          expectedAnswerPt: richBundle.fillBlank.ptTranslation,
          acceptableVariations: [
            richBundle.fillBlank.expectedAnswer,
            richBundle.fillBlank.expectedAnswer.toLowerCase(),
          ],
          wordBank: richBundle.fillBlank.options,
          requiredWords: [word],
          options: richBundle.fillBlank.options,
          hint: 'Look closely at the context clues before and after the blank.',
          hintPt: richBundle.fillBlank.hintPt,
          explanation: 'Spot on! Choosing words in context is how native speakers think.',
          explanationPt: richBundle.fillBlank.explanationPt,
          audioSpeedDefault: 1.0,
        });
      } else if (typeMod === 3) {
        exercises.push({
          id: `sv_${index}_${Date.now()}_${index}`,
          type: 'speak_verify',
          targetWord: word,
          instruction: 'Read the short phrase aloud using your microphone:',
          instructionPt: 'Leia a frase curta em voz alta no microfone:',
          promptText: `Leia em voz alta: "${richBundle.speakVerify.sentence}"`,
          promptTextPt: richBundle.speakVerify.ptTranslation,
          audioSentence: richBundle.speakVerify.sentence,
          expectedAnswer: richBundle.speakVerify.sentence,
          expectedAnswerPt: richBundle.speakVerify.ptTranslation,
          acceptableVariations: [
            richBundle.speakVerify.sentence,
            richBundle.speakVerify.sentence.toLowerCase(),
            richBundle.speakVerify.sentence.replace(/[.,!?]/g, ''),
          ],
          wordBank: richBundle.speakVerify.sentence.split(' '),
          requiredWords: [word],
          hint: 'Speak clearly into your microphone at your normal pace.',
          hintPt: richBundle.speakVerify.hintPt,
          explanation: 'Pronunciation verified! Short spoken phrases build genuine speaking stamina.',
          explanationPt: richBundle.speakVerify.explanationPt,
          audioSpeedDefault: 1.0,
        });
      } else {
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
          ],
          wordBank: ['I', 'use', word, 'always', 'at', 'home', 'with', 'people'],
          requiredWords: [word],
          hint: `Form a natural sentence containing "${word}".`,
          hintPt: richBundle.roleplayPrompt.hintPt,
          explanation: 'Terrific answer! Applying vocabulary in conversational dialogue is the peak of fluency.',
          explanationPt: `Excelente resposta conversacional! Você colocou "${word}" em prática ativa no diálogo com o Leo.`,
          audioSpeedDefault: 1.0,
        });
      }
    }
  }

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
      topicIntro: `Pegamos suas anotações da aula particular para criar um treino dinâmico, rápido e sem cansaço. Vamos começar!`,
    },
    exercises,
    reviewSummary: {
      keyTakeaways: [
        `Mastered key terms: ${wordsCovered.join(', ')}`,
        `Reinforced natural speech cadence and collocations in real-life scenarios`,
      ],
      keyTakeawaysPt: [
        `Vocabulário fixado: ${wordsCovered.join(', ')}`,
        `Treino dinâmico com minigames, lacunas rápidas e fala ativa`,
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

  const BLOCK_THEMES: Array<{
    titleName: string;
    subtitle: string;
    type: ExerciseType;
  }> = [
    {
      titleName: 'Quiz de Situação Real',
      subtitle: 'Toque para escolher a resposta autêntica no cenário do dia.',
      type: 'multiple_choice',
    },
    {
      titleName: 'Minigame de Ligar os Pares',
      subtitle: 'Associação rápida e divertida de vocabulário da aula.',
      type: 'match_pairs',
    },
    {
      titleName: 'Complete a Frase no Cenário',
      subtitle: 'Encaixe a expressão perfeita no diálogo.',
      type: 'fill_blank',
    },
    {
      titleName: 'Pronúncia & Fala Ativa',
      subtitle: 'Fale no microfone com frases curtas e autênticas.',
      type: 'speak_verify',
    },
    {
      titleName: 'Bate-papo com o Leo',
      subtitle: 'Responda no cenário e troque ideias com o mascote.',
      type: 'roleplay_prompt',
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

    // Distribute vocabulary items systematically across days
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
      // Day 7: Comprehensive Weekly Consolidation
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
      const blockWords = dayItems.map((i) => i.english);

      const blockLesson = buildCustomLesson(
        `${topic} - ${dayName} (${blockTitle.split(':')[0]})`,
        level,
        dayItems,
        rawNotes,
        geminiMatrix,
        scenario.key,
        theme.type
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

export const CURRENT_PLAN_VERSION = 3;

/**
 * Checks if a plan is deprecated (older plan generated before specialized block themes,
 * or containing outdated static templates / distractors).
 */
export function isPlanDeprecated(plan: WeeklyPlan): boolean {
  if (!plan || !plan.days || plan.days.length === 0) return false;
  if ((plan as any).version && (plan as any).version >= CURRENT_PLAN_VERSION) {
    return false;
  }
  const str = JSON.stringify(plan);
  if (
    str.includes('The engine needs motor oil') ||
    str.includes('Honest communication prevents any sudden') ||
    str.includes('The train runs every hour') ||
    str.includes('escalator')
  ) {
    return true;
  }
  const day0 = plan.days[0];
  if (day0 && day0.blocks && day0.blocks.length >= 2) {
    const b2 = day0.blocks[1];
    if (b2 && b2.title.includes('Ligar os Pares') && b2.lesson?.exercises?.[0]?.type === 'multiple_choice') {
      return true;
    }
  }
  return true;
}

/**
 * Upgrades an existing WeeklyPlan to Version 3:
 * - Generates specialized exercises for every block (Quiz, Ligar Pares, Complete a Frase, Pronúncia & Leo)
 * - Employs curated sentences and contextually accurate part-of-speech distractors
 * - CAREFULLY PRESERVES ALL USER PROGRESS: isCompleted, completedAt, score, and xpEarned!
 */
export function upgradePlanExercises(oldPlan: WeeklyPlan): WeeklyPlan {
  const safeItems =
    oldPlan.parsedItems && oldPlan.parsedItems.length > 0
      ? oldPlan.parsedItems
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
      titleName: 'Quiz de Situação Real',
      subtitle: 'Toque para escolher a resposta autêntica no cenário do dia.',
      type: 'multiple_choice',
    },
    {
      titleName: 'Minigame de Ligar os Pares',
      subtitle: 'Associação rápida e divertida de vocabulário da aula.',
      type: 'match_pairs',
    },
    {
      titleName: 'Complete a Frase no Cenário',
      subtitle: 'Encaixe a expressão perfeita no diálogo.',
      type: 'fill_blank',
    },
    {
      titleName: 'Pronúncia & Fala Ativa',
      subtitle: 'Fale no microfone com frases curtas e autênticas.',
      type: 'speak_verify',
    },
  ];

  const upgradedDays: DayPlan[] = oldPlan.days.map((oldDay, d) => {
    const scenario = DAY_SCENARIOS[d % DAY_SCENARIOS.length];

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
        theme.type
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
    days: upgradedDays,
  };
}
