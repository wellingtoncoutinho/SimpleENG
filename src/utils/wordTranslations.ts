/**
 * Built-in dictionary and translation lookup for English learning.
 * Provides instant Portuguese translations when learners click any word in exercises.
 */

// Common English words to Portuguese translation dictionary
export const COMMON_WORD_DICTIONARY: Record<string, string> = {
  // Common verbs
  went: 'fui / foi / fomos / foram (passado de go)',
  go: 'ir',
  goes: 'vai',
  going: 'indo',
  gone: 'ido',
  struggle: 'ter dificuldade / lutar com',
  struggled: 'teve dificuldade / lutou',
  struggles: 'tem dificuldade',
  struggling: 'tendo dificuldade',
  fear: 'medo / receio / temer',
  feared: 'temia / temeu',
  fears: 'medos / teme',
  like: 'gostar / como',
  liked: 'gostava / gostou',
  likes: 'gosta',
  stop: 'parar / deter',
  stopped: 'parou / parado',
  stopping: 'parando',
  schedule: 'agendar / cronograma / horário',
  scheduled: 'agendado',
  look: 'olhar / parecer',
  forward: 'em frente / adiante',
  afraid: 'com medo / receoso',
  overwhelmed: 'sobrecarregado(a) / aflito(a)',
  commit: 'comprometer-se / cometer',
  commitment: 'compromisso / comprometimento',
  crush: 'paixão / queda por alguém',
  ghost: 'dar um sumiço / ignorar mensagens',
  ghosting: 'sumiço sem explicação',
  grant: 'conceder / garantir',
  granted: 'garantido / como certo',
  fall: 'cair / apaixonar-se (fall for)',
  fell: 'caiu / apaixonou-se',
  fallen: 'caído',
  remember: 'lembrar-se',
  remembered: 'lembrou-se',
  forget: 'esquecer',
  forgot: 'esqueceu',
  forgotten: 'esquecido',
  focus: 'focar / concentrar-se',
  focused: 'focado / concentrou-se',
  practice: 'praticar / treino',
  practiced: 'praticou',
  mention: 'mencionar',
  mentioned: 'mencionou',
  understand: 'entender / compreender',
  understood: 'entendeu',
  organize: 'organizar',
  organized: 'organizou / organizado',
  handle: 'lidar com / administrar',
  handled: 'lidou com',
  apply: 'aplicar / inscrever-se',
  applied: 'aplicou',
  speak: 'falar',
  spoke: 'falou',
  spoken: 'falado',
  listen: 'ouvir / escutar',
  listened: 'ouviu',
  hear: 'ouvir',
  heard: 'ouviu',
  see: 'ver',
  saw: 'viu',
  seen: 'visto',
  meet: 'encontrar / conhecer',
  met: 'encontrou / conheceu',
  meeting: 'reunião / encontrando',
  know: 'saber / conhecer',
  knew: 'sabia / conhecia',
  known: 'conhecido',
  think: 'pensar / achar',
  thought: 'pensou / achou / pensamento',
  feel: 'sentir / achar',
  felt: 'sentiu',
  feeling: 'sentimento / sentindo',
  need: 'precisar / necessidade',
  needed: 'precisava',
  want: 'querer',
  wanted: 'queria',
  make: 'fazer / criar',
  made: 'fez / feito',
  take: 'pegar / levar / tomar',
  took: 'pegou / levou',
  taken: 'pegado / levado',
  get: 'obter / conseguir / ficar',
  got: 'conseguiu / ficou',
  give: 'dar',
  gave: 'deu',
  given: 'dado',
  help: 'ajudar / ajuda',
  helped: 'ajudou',
  say: 'dizer',
  said: 'disse',
  tell: 'contar / dizer',
  told: 'contou / disse',
  start: 'começar / início',
  started: 'começou',
  finish: 'terminar / fim',
  finished: 'terminou',
  try: 'tentar',
  tried: 'tentou',
  ask: 'perguntar / pedir',
  asked: 'perguntou',
  answer: 'responder / resposta',
  answered: 'respondeu',
  check: 'conferir / checar',
  checked: 'conferiu',
  work: 'trabalhar / trabalho',
  worked: 'trabalhou',
  learn: 'aprender',
  learned: 'aprendeu',
  teach: 'ensinar',
  taught: 'ensinou',
  improve: 'melhorar',
  improved: 'melhorou',

  // Pronouns & possessives
  i: 'eu',
  me: 'me / mim',
  my: 'meu / minha / meus / minhas',
  mine: 'meu / minha (no final da frase)',
  you: 'você / vocês',
  your: 'seu / sua / seus / suas',
  yours: 'seu / sua',
  we: 'nós',
  us: 'nos / nós (objeto)',
  our: 'nosso / nossa / nossos / nossas',
  ours: 'nosso / nossa',
  they: 'eles / elas',
  them: 'eles / elas (objeto)',
  their: 'deles / delas',
  theirs: 'deles / delas',
  he: 'ele',
  him: 'ele (objeto)',
  his: 'dele / seu',
  she: 'ela',
  her: 'ela / dela / sua',
  hers: 'dela',
  it: 'isto / ele / ela (neutro)',
  its: 'seu / dele (neutro)',

  // Prepositions & Connectors
  with: 'com',
  without: 'sem',
  in: 'em / dentro de',
  on: 'em cima de / sobre / no / na',
  at: 'em (lugar específico / horário)',
  for: 'para / por / durante',
  to: 'para / a / até',
  from: 'de / a partir de',
  by: 'por / de / perto de',
  about: 'sobre / a respeito de / quase',
  into: 'para dentro de',
  onto: 'para cima de',
  before: 'antes de',
  after: 'depois de',
  during: 'durante',
  between: 'entre (dois)',
  among: 'entre (vários)',
  through: 'através de',
  under: 'sob / debaixo de',
  over: 'acima de / sobre / encerrado',
  above: 'acima de',
  below: 'abaixo de',
  because: 'porque / já que',
  although: 'embora / apesar de',
  though: 'embora / no entanto',
  even: 'mesmo / até',
  however: 'contudo / no entanto',
  instead: 'em vez disso',
  meanwhile: 'enquanto isso',
  furthermore: 'além disso',
  nevertheless: 'não obstante / mesmo assim',
  and: 'e',
  but: 'mas / porém',
  or: 'ou',
  so: 'então / por isso / tão',
  as: 'como / enquanto / já que',

  // Common Adverbs & Modifiers
  usually: 'geralmente / normalmente',
  always: 'sempre',
  never: 'nunca',
  sometimes: 'às vezes',
  often: 'frequentemente',
  rarely: 'raramente',
  really: 'realmente / muito',
  very: 'muito',
  quite: 'bastante',
  almost: 'quase',
  already: 'já',
  still: 'ainda',
  yet: 'ainda (com negativa ou pergunta)',
  soon: 'em breve / logo',
  today: 'hoje',
  yesterday: 'ontem',
  tomorrow: 'amanhã',
  now: 'agora',
  then: 'então / depois',
  here: 'aqui',
  there: 'lá / ali',
  actually: 'na verdade / de fato',
  currently: 'atualmente',
  eventually: 'com o tempo / no final das contas',
  probably: 'provavelmente',
  definitely: 'com certeza / definitivamente',
  obviously: 'obviamente',
  together: 'juntos',

  // Common Nouns
  context: 'contexto',
  sentence: 'frase / sentença',
  phrase: 'expressão / locução',
  word: 'palavra',
  words: 'palavras',
  routine: 'rotina',
  daily: 'diário / cotidiano',
  project: 'projeto',
  team: 'equipe / time',
  entire: 'inteiro / todo',
  morning: 'manhã',
  afternoon: 'tarde',
  evening: 'noite (início da noite)',
  night: 'noite',
  class: 'aula',
  lesson: 'lição / aula',
  teacher: 'professor(a)',
  student: 'aluno(a)',
  colleague: 'colega de trabalho',
  colleagues: 'colegas de trabalho',
  friend: 'amigo(a)',
  friends: 'amigos',
  partner: 'parceiro(a) / sócio(a)',
  job: 'emprego / trabalho',
  task: 'tarefa',
  tasks: 'tarefas',
  time: 'tempo / hora / vez',
  day: 'dia',
  days: 'dias',
  week: 'semana',
  month: 'mês',
  year: 'ano',
  conversation: 'conversa / bate-papo',
  mistake: 'erro / engano',
  mistakes: 'erros',
  preposition: 'preposição',
  grammar: 'gramática',
  accent: 'sotaque',
  audio: 'áudio / som',
  voice: 'voz',

  // Common Adjectives
  important: 'importante',
  essential: 'essencial / fundamental',
  natural: 'natural',
  correct: 'correto(a)',
  wrong: 'errado(a)',
  easy: 'fácil',
  hard: 'difícil / duro',
  difficult: 'difícil',
  simple: 'simples',
  clear: 'claro / nítido',
  fast: 'rápido',
  slow: 'devagar / lento',
  good: 'bom / boa',
  better: 'melhor',
  best: 'o melhor / a melhor',
  bad: 'ruim / mau',
  worse: 'pior',
  worst: 'o pior',
  new: 'novo / nova',
  old: 'velho / antigo',
  great: 'ótimo / excelente / grande',
  rude: 'grosseiro(a) / mal-educado(a)',
  polite: 'educado(a)',
  ready: 'pronto(a)',
  busy: 'ocupado(a)',
  calm: 'calmo(a) / tranquilo(a)',
};

/**
 * Normalizes an English word by trimming and stripping outer punctuation.
 */
export function cleanWord(raw: string): string {
  return raw
    .replace(/^[^a-zA-Z0-9']+|[^a-zA-Z0-9']+$/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Finds Portuguese translation for an English word.
 * Checks vocabulary list first, then dictionary, then simple root rules.
 */
export function getWordTranslation(
  word: string,
  targetVocabMap?: Record<string, string>
): string | null {
  const clean = cleanWord(word);
  if (!clean) return null;

  // 1. Target vocabulary check (from lesson)
  if (targetVocabMap) {
    if (targetVocabMap[clean]) return targetVocabMap[clean];
    // Check multi-word keys
    for (const [key, val] of Object.entries(targetVocabMap)) {
      if (key.toLowerCase().includes(clean)) return `${val} (parte de "${key}")`;
    }
  }

  // 2. Direct dictionary check
  if (COMMON_WORD_DICTIONARY[clean]) {
    return COMMON_WORD_DICTIONARY[clean];
  }

  // 3. Simple singular / plural suffix rule
  if (clean.endsWith('s') && clean.length > 3) {
    const singular = clean.slice(0, -1);
    if (COMMON_WORD_DICTIONARY[singular]) {
      return `${COMMON_WORD_DICTIONARY[singular]} (plural)`;
    }
  }

  // 4. Simple -ed past tense rule
  if (clean.endsWith('ed') && clean.length > 4) {
    const root = clean.slice(0, -2);
    if (COMMON_WORD_DICTIONARY[root]) {
      return `${COMMON_WORD_DICTIONARY[root]} (passado)`;
    }
  }

  // 5. Simple -ing gerund rule
  if (clean.endsWith('ing') && clean.length > 5) {
    const root = clean.slice(0, -3);
    if (COMMON_WORD_DICTIONARY[root]) {
      return `${COMMON_WORD_DICTIONARY[root]} (-ndo)`;
    }
  }

  return null;
}
