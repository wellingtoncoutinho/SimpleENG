import { LessonPayload } from '../types/lesson';

export const BENCHMARK_DATING_LESSON: LessonPayload = {
  moduleMeta: {
    appName: "SimpleENG",
    topic: "Relationships & Modern Dating (Relacionamentos)",
    targetLevel: "B2",
    estimatedDurationMinutes: 8,
    wordsCovered: ["ghost someone", "take for granted", "fall for", "commitment", "crush"]
  },
  mascotWelcome: {
    greeting: "E aí! Pronto para praticar as conversas da aula de hoje?",
    topicIntro: "Vamos começar de forma leve e divertida montando as frases e ouvindo a pronúncia de cada palavra!"
  },
  exercises: [
    {
      id: "ex_01",
      type: "sentence_build",
      targetWord: "ghost someone",
      instruction: "Arrange the words to form a correct sentence.",
      instructionPt: "Organize as palavras na ordem correta para montar a frase:",
      promptText: "Assemble the sentence:",
      promptTextPt: "Monte a frase que significa: 'É muita falta de educação dar ghosting em alguém após três encontros.'",
      audioSentence: null,
      expectedAnswer: "It is really rude to ghost someone after three dates.",
      acceptableVariations: [],
      wordBank: [
        "It", "is", "really", "rude", "to", "ghost", "someone", "after", "three", "dates.",
        "ghosting", "for", "abandon", "ignored"
      ],
      requiredWords: [],
      hint: "Start with the dummy pronoun 'It'.",
      hintPt: "Comece a frase com o pronome 'It' seguido de 'is really rude...'.",
      explanation: "'To ghost someone' is used transitively as a verb meaning to cut off all communication abruptly.",
      explanationPt: "'To ghost someone' funciona como verbo direto: você 'ghosts someone' quando some sem dar explicações.",
      audioSpeedDefault: 1.0
    },
    {
      id: "ex_02",
      type: "listen_type",
      targetWord: "take for granted",
      instruction: "Listen closely and arrange the words you hear.",
      instructionPt: "Escute o áudio e monte a frase com as palavras abaixo:",
      promptText: "Arrange what you hear:",
      promptTextPt: "Monte a frase que você escutar:",
      audioSentence: "You shouldn't take your partner for granted in a long relationship.",
      expectedAnswer: "You shouldn't take your partner for granted in a long relationship.",
      acceptableVariations: [
        "You should not take your partner for granted in a long relationship."
      ],
      wordBank: [
        "You", "shouldn't", "take", "your", "partner", "for", "granted", "in", "a", "long", "relationship.",
        "taking", "to", "give", "always"
      ],
      requiredWords: [],
      hint: "Remember the object pronoun or noun goes between 'take' and 'for granted'.",
      hintPt: "Lembre-se: a pessoa ou coisa vai no meio da expressão: take + [alguém] + for granted (não dar o devido valor).",
      explanation: "'To take someone/something for granted' means failing to appreciate them because you are so used to them.",
      explanationPt: "'Take for granted' significa não valorizar ou tomar como garantido porque você já se acostumou com a presença da pessoa.",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    },
    {
      id: "ex_03",
      type: "speak_verify",
      targetWord: "fall for",
      instruction: "Read the sentence out loud with clear pronunciation.",
      instructionPt: "Leia a frase em voz alta com boa pronúncia:",
      promptText: "I didn't expect to fall for him so quickly.",
      promptTextPt: "I didn't expect to fall for him so quickly. (Não esperava me apaixonar por ele tão rápido)",
      audioSentence: "I didn't expect to fall for him so quickly.",
      expectedAnswer: "I didn't expect to fall for him so quickly.",
      acceptableVariations: [
        "I did not expect to fall for him so quickly."
      ],
      wordBank: [],
      requiredWords: ["fall for"],
      hint: "The preposition is always 'for', not 'to' or 'with'.",
      hintPt: "Atenção à preposição: em inglês dizemos 'fall for' (apaixonar-se por), nunca 'fall to' ou 'fall with'.",
      explanation: "'Fall for someone' means to become strongly infatuated or fall in love with them.",
      explanationPt: "'Fall for someone' é a forma mais natural e comum em inglês para dizer que se apaixonou por alguém.",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    },
    {
      id: "ex_04",
      type: "grammar_fix",
      targetWord: "commitment",
      instruction: "Correct the preposition error in this sentence.",
      instructionPt: "Corrija o erro de preposição nesta frase:",
      promptText: "He is not ready for make a serious commitment.",
      promptTextPt: "Identifique o erro em: 'He is not ready for make a serious commitment.'",
      audioSentence: null,
      expectedAnswer: "He is not ready to make a serious commitment.",
      acceptableVariations: [
        "He isn't ready to make a serious commitment."
      ],
      wordBank: [],
      requiredWords: ["commitment"],
      hint: "'Ready' is followed by an infinitive with 'to'.",
      hintPt: "Depois de 'ready' acompanhado de verbo, usamos 'to + verbo' (ready to make), e não 'for make'.",
      explanation: "Use 'ready to [verb]' or 'ready for [noun]'. Here, 'make' requires the infinitive marker 'to'.",
      explanationPt: "Regra de ouro: use 'ready to + verbo' (ready to go, ready to make) ou 'ready for + substantivo' (ready for dinner).",
      audioSpeedDefault: 1.0
    },
    {
      id: "ex_05",
      type: "roleplay_prompt",
      targetWord: "crush",
      instruction: "Respond to Leo using the word 'crush'.",
      instructionPt: "Responda ao Leo em inglês usando a palavra 'crush':",
      promptText: "Leo asks: 'Have you ever confessed your feelings to someone you had a crush on?'",
      promptTextPt: "O Leo pergunta se você já confessou seus sentimentos para alguém por quem tinha uma 'crush'.",
      audioSentence: "Have you ever confessed your feelings to someone you had a crush on?",
      expectedAnswer: "I had a huge crush on my classmate back in high school.",
      acceptableVariations: [
        "I had a crush on someone in college.",
        "Yes, I told my crush how I felt.",
        "I have a crush on someone right now."
      ],
      wordBank: [],
      requiredWords: ["crush"],
      hint: "Common collocations: 'have a crush on', 'develop a crush'.",
      hintPt: "Colocações comuns em inglês: 'have a crush on [pessoa]' ou 'my crush'.",
      explanation: "A 'crush' refers to a brief but intense infatuation with someone.",
      explanationPt: "'Crush' pode ser tanto o sentimento quanto a própria pessoa pela qual você está caidinho(a).",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    }
  ],
  reviewSummary: {
    keyTakeaways: [
      "Remember the structure: take + [person/thing] + for granted.",
      "Use 'fall for' (never 'fall to').",
      "Express infatuation with 'have a crush on [person]'."
    ],
    keyTakeawaysPt: [
      "Estrutura exata: take + [pessoa/coisa] + for granted (não dar o devido valor).",
      "Apaixonar-se por alguém é sempre 'fall for' (nunca 'fall to' ou 'fall with').",
      "Ter uma queda por alguém: 'have a crush ON someone' (preposição ON!)."
    ],
    commonPitfallsToAvoid: [
      "Do not omit the preposition 'for' after 'take [object]'.",
      "Do not confuse 'ghost' (verb) with passive structures without an auxiliary."
    ],
    commonPitfallsToAvoidPt: [
      "Não esqueça a preposição 'for' em 'take someone for granted'.",
      "Cuidado para não usar 'ready for make' — em inglês é sempre 'ready TO make'."
    ]
  }
};

export const BUSINESS_NEGOTIATION_LESSON: LessonPayload = {
  moduleMeta: {
    appName: "SimpleENG",
    topic: "Workplace & Contract Negotiations (Negociações de Trabalho)",
    targetLevel: "B2",
    estimatedDurationMinutes: 7,
    wordsCovered: ["leverage", "deal breaker", "meet halfway", "counterpart", "table an offer"]
  },
  mascotWelcome: {
    greeting: "Bem-vindo à sala de reuniões! O Leo vai te ajudar a fechar o contrato.",
    topicIntro: "Vamos começar montando termos estratégicos no banco de palavras para aquecer!"
  },
  exercises: [
    {
      id: "ex_b1",
      type: "sentence_build",
      targetWord: "leverage",
      instruction: "Reconstruct the executive's tactical statement.",
      instructionPt: "Monte a frase estratégica do executivo com o banco de palavras:",
      promptText: "Assemble the sentence:",
      promptTextPt: "Monte a frase: 'Nossa tecnologia proprietária nos dá uma grande vantagem nas conversas.'",
      audioSentence: null,
      expectedAnswer: "Our proprietary technology gives us substantial leverage during talks.",
      acceptableVariations: [],
      wordBank: [
        "Our", "proprietary", "technology", "gives", "us", "substantial", "leverage", "during", "talks.",
        "leveraging", "makes", "disadvantage", "force"
      ],
      requiredWords: [],
      hint: "'Substantial leverage' means strong bargaining power.",
      hintPt: "'Leverage' como substantivo significa poder de barganha ou vantagem competitiva.",
      explanation: "'Leverage' as a noun refers to the power to influence people and achieve the results you want.",
      explanationPt: "'Leverage' é o poder de influenciar a outra parte durante uma negociação.",
      audioSpeedDefault: 1.0
    },
    {
      id: "ex_b2",
      type: "listen_type",
      targetWord: "deal breaker",
      instruction: "Listen carefully and arrange the negotiation condition.",
      instructionPt: "Escute com atenção e monte a frase que você ouvir:",
      promptText: "Assemble what you hear:",
      promptTextPt: "Monte a frase em inglês:",
      audioSentence: "A lack of remote work flexibility was a complete deal breaker for her.",
      expectedAnswer: "A lack of remote work flexibility was a complete deal breaker for her.",
      acceptableVariations: [
        "Lack of remote work flexibility was a complete deal breaker for her."
      ],
      wordBank: [
        "A", "lack", "of", "remote", "work", "flexibility", "was", "a", "complete", "deal", "breaker", "for", "her.",
        "without", "making", "agreement", "in"
      ],
      requiredWords: [],
      hint: "Compound noun: 'deal' + 'breaker'.",
      hintPt: "'Deal breaker' é o fator inegociável que faz a pessoa desistir do acordo.",
      explanation: "A 'deal breaker' is a non-negotiable factor that prevents an agreement from being reached.",
      explanationPt: "'Deal breaker' é algo decisivo que impede o fechamento de um negócio ou contratação.",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    },
    {
      id: "ex_b3",
      type: "speak_verify",
      targetWord: "meet halfway",
      instruction: "Speak this compromise proposal with confidence.",
      instructionPt: "Fale esta proposta de acordo em voz alta com confiança:",
      promptText: "Can we find a compromise and meet halfway on the pricing?",
      promptTextPt: "Can we find a compromise and meet halfway on the pricing? (Podemos chegar a um meio-termo no preço?)",
      audioSentence: "Can we find a compromise and meet halfway on the pricing?",
      expectedAnswer: "Can we find a compromise and meet halfway on the pricing?",
      acceptableVariations: [
        "Can we find a compromise and meet each other halfway on the pricing?"
      ],
      wordBank: [],
      requiredWords: ["meet halfway"],
      hint: "Remember: 'meet halfway' or 'meet someone halfway' signifies mutual compromise.",
      hintPt: "'Meet halfway' significa fazer concessões mútuas para encontrar um meio-termo aceitável.",
      explanation: "'Meet halfway' means to make concessions so that both sides can agree.",
      explanationPt: "Expressão muito usada em reuniões para propor concessões dos dois lados.",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    },
    {
      id: "ex_b4",
      type: "grammar_fix",
      targetWord: "counterpart",
      instruction: "Correct the preposition and phrasing error in this meeting update.",
      instructionPt: "Corrija o erro clássico de preposição nesta frase:",
      promptText: "I discussed about the timeline with my German counterpart on the phone.",
      promptTextPt: "Corrija a frase: 'I discussed about the timeline with my German counterpart on the phone.'",
      audioSentence: null,
      expectedAnswer: "I discussed the timeline with my German counterpart on the phone.",
      acceptableVariations: [
        "I talked about the timeline with my German counterpart on the phone."
      ],
      wordBank: [],
      requiredWords: ["counterpart"],
      hint: "Remember: 'discuss' is transitive — never say 'discuss about'.",
      hintPt: "Atenção brasileiros: o verbo 'discuss' NUNCA leva 'about'! Diga direto 'discuss the timeline'.",
      explanation: "Do not add 'about' after 'discuss'. Say 'discuss [something]' directly.",
      explanationPt: "Falso amigo gramatical comum de falantes de português: em inglês 'discuss' já significa 'debater sobre', sem precisar de 'about'.",
      audioSpeedDefault: 1.0
    },
    {
      id: "ex_b5",
      type: "roleplay_prompt",
      targetWord: "table an offer",
      instruction: "Tell Leo when your team plans to present the contract.",
      instructionPt: "Diga ao Leo quando seu time planeja apresentar a proposta oficial:",
      promptText: "Leo asks: 'When does your team intend to make your official proposal?'",
      promptTextPt: "O Leo pergunta quando sua equipe pretende formalizar a proposta.",
      audioSentence: "When does your team intend to make your official proposal?",
      expectedAnswer: "We will table an offer before the end of the quarter.",
      acceptableVariations: [
        "We plan to table an offer next week.",
        "We are ready to table an offer tomorrow."
      ],
      wordBank: [],
      requiredWords: ["table an offer"],
      hint: "In British/International English, 'to table an offer' means to put forward a formal proposal for discussion.",
      hintPt: "Use a expressão 'table an offer' para dizer que vai colocar a proposta na mesa para discussão.",
      explanation: "'Table an offer' means to officially present an offer to the other party.",
      explanationPt: "'Table an offer' significa colocar uma oferta em pauta oficialmente.",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    }
  ],
  reviewSummary: {
    keyTakeaways: [
      "Use 'discuss something' without 'about'.",
      "'Deal breaker' is a noun phrase for an unacceptable term.",
      "'Meet halfway' expresses readiness for bilateral compromise."
    ],
    keyTakeawaysPt: [
      "Nunca diga 'discuss about' — o verbo 'discuss' vai direto com o objeto!",
      "'Deal breaker' é o termo perfeito para uma exigência inegociável.",
      "'Meet halfway' expressa disposição mútua para flexibilizar."
    ],
    commonPitfallsToAvoid: [
      "Avoid saying 'discuss about the contract'.",
      "Notice US vs UK differences with 'table' (US often means postpone, UK means present)."
    ],
    commonPitfallsToAvoidPt: [
      "Evite o vício de tradução direta do português 'discutir sobre' (use 'discuss the issue').",
      "Lembre-se de colocar o objeto no meio de 'meet someone halfway'."
    ]
  }
};

export const TRAVEL_AIRPORT_LESSON: LessonPayload = {
  moduleMeta: {
    appName: "SimpleENG",
    topic: "Travel Dilemmas & Airport Logistics (Viagem & Aeroporto)",
    targetLevel: "B1",
    estimatedDurationMinutes: 6,
    wordsCovered: ["carry-on", "layover", "boarding pass", "lost and found", "customs declaration"]
  },
  mascotWelcome: {
    greeting: "Arrume as malas! O Leo é seu parceiro de viagem hoje.",
    topicIntro: "Vamos começar com as regras de bagagem montando as palavras no painel!"
  },
  exercises: [
    {
      id: "ex_t1",
      type: "sentence_build",
      targetWord: "carry-on",
      instruction: "Arrange the words to describe the luggage allowance.",
      instructionPt: "Organize as palavras para indicar a regra de bagagem de mão:",
      promptText: "Assemble the sentence:",
      promptTextPt: "Monte a frase: 'Cada passageiro pode levar apenas uma mala de mão pequena.'",
      audioSentence: null,
      expectedAnswer: "Each passenger is allowed only one small carry-on bag.",
      acceptableVariations: [],
      wordBank: [
        "Each", "passenger", "is", "allowed", "only", "one", "small", "carry-on", "bag.",
        "permits", "checked", "carrying", "luggage"
      ],
      requiredWords: [],
      hint: "Subject is 'Each passenger'.",
      hintPt: "O sujeito é 'Each passenger' seguido por 'is allowed...'.",
      explanation: "'Carry-on' describes baggage taken into the passenger compartment.",
      explanationPt: "'Carry-on bag' ou apenas 'carry-on' é a mala de mão levada na cabine.",
      audioSpeedDefault: 1.0
    },
    {
      id: "ex_t2",
      type: "listen_type",
      targetWord: "layover",
      instruction: "Listen to the gate announcement and assemble the words.",
      instructionPt: "Escute o anúncio do portão de embarque e monte a frase abaixo:",
      promptText: "Assemble what you hear:",
      promptTextPt: "Monte a frase que você escutar:",
      audioSentence: "We have a two hour layover in Frankfurt before our connecting flight.",
      expectedAnswer: "We have a two hour layover in Frankfurt before our connecting flight.",
      acceptableVariations: [
        "We have a two-hour layover in Frankfurt before our connecting flight."
      ],
      wordBank: [
        "We", "have", "a", "two", "hour", "layover", "in", "Frankfurt", "before", "our", "connecting", "flight.",
        "plane", "airport", "delayed", "at"
      ],
      requiredWords: [],
      hint: "A 'layover' is a short stay between parts of a journey.",
      hintPt: "'Layover' é a escala ou conexão curta entre dois voos.",
      explanation: "'Layover' refers to a period of waiting between connecting flights.",
      explanationPt: "Diferente de 'stopover' (que costuma durar mais de 24h), 'layover' é a escala rápida.",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    },
    {
      id: "ex_t3",
      type: "speak_verify",
      targetWord: "boarding pass",
      instruction: "Say this sentence clearly to the security officer.",
      instructionPt: "Fale esta frase com clareza para o oficial de segurança:",
      promptText: "Please have your passport and boarding pass ready for inspection.",
      promptTextPt: "Please have your passport and boarding pass ready for inspection. (Por favor, tenham passaporte e cartão de embarque em mãos)",
      audioSentence: "Please have your passport and boarding pass ready for inspection.",
      expectedAnswer: "Please have your passport and boarding pass ready for inspection.",
      acceptableVariations: [
        "Please have your passport and boarding pass ready."
      ],
      wordBank: [],
      requiredWords: ["boarding pass"],
      hint: "Pronounce 'boarding' clearly with a soft 'r'.",
      hintPt: "Pronuncie 'boarding pass' (cartão de embarque).",
      explanation: "A 'boarding pass' is the official document allowing a passenger onto an aircraft.",
      explanationPt: "'Boarding pass' é o documento oficial que autoriza a entrada no avião.",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    },
    {
      id: "ex_t4",
      type: "grammar_fix",
      targetWord: "lost and found",
      instruction: "Fix the word order error in this indirect question.",
      instructionPt: "Corrija a ordem das palavras nesta pergunta indireta:",
      promptText: "Could you tell me where is the lost and found office?",
      promptTextPt: "Corrija a ordem: 'Could you tell me where is the lost and found office?'",
      audioSentence: null,
      expectedAnswer: "Could you tell me where the lost and found office is?",
      acceptableVariations: [
        "Can you tell me where the lost and found office is?"
      ],
      wordBank: [],
      requiredWords: ["lost and found"],
      hint: "Indirect questions do not invert subject and auxiliary verb: 'where [subject] is'.",
      hintPt: "Em perguntas indiretas ('Could you tell me where...'), o verbo 'is' vai no final da frase, depois do sujeito!",
      explanation: "In embedded or indirect questions ('Could you tell me where...'), word order is subject + verb, not verb + subject.",
      explanationPt: "Regra muito comum cobrada em inglês: perguntas que começam com 'Could you tell me where...' não invertem o verbo (fica 'where the office is').",
      audioSpeedDefault: 1.0
    },
    {
      id: "ex_t5",
      type: "roleplay_prompt",
      targetWord: "customs declaration",
      instruction: "Reply to Leo the customs agent at the terminal.",
      instructionPt: "Responda ao Leo (agente de alfândega) usando 'customs declaration':",
      promptText: "Leo asks: 'Do you have any commercial goods or fresh food to declare?'",
      promptTextPt: "O Leo pergunta se você tem mercadorias ou alimentos frescos para declarar.",
      audioSentence: "Do you have any commercial goods or fresh food to declare?",
      expectedAnswer: "I completed my customs declaration and have nothing to declare.",
      acceptableVariations: [
        "Here is my customs declaration form, I have nothing to declare.",
        "I already filled out the customs declaration."
      ],
      wordBank: [],
      requiredWords: ["customs declaration"],
      hint: "State whether you have items using the phrase 'customs declaration'.",
      hintPt: "Diga que preencheu sua declaração de alfândega: 'customs declaration'.",
      explanation: "A 'customs declaration' is a form that lists goods being brought into a country.",
      explanationPt: "'Customs declaration' é o formulário de declaração de bens para a alfândega.",
      audioSpeedDefault: 1.0,
      slowSpeedAvailable: true
    }
  ],
  reviewSummary: {
    keyTakeaways: [
      "Embedded questions use standard word order: 'where the office is' (not 'where is the office').",
      "'Layover' is the pause between flight legs.",
      "'Carry-on' refers to cabin luggage."
    ],
    keyTakeawaysPt: [
      "Perguntas indiretas educadas não invertem o verbo: 'Could you tell me where the gate is' (e não 'where is the gate').",
      "'Layover' é a conexão/escala rápida entre dois trechos de voo.",
      "'Carry-on' é a mala de bordo levada no compartimento de passageiros."
    ],
    commonPitfallsToAvoid: [
      "Watch out for subject-verb inversion in polite inquiries ('Could you tell me where is...').",
      "Remember 'luggage' is uncountable (say 'one bag' or 'piece of luggage')."
    ],
    commonPitfallsToAvoidPt: [
      "Cuidado com a inversão em perguntas educadas ('where the gate is', não 'where is the gate').",
      "'Luggage' e 'baggage' são incontáveis em inglês (nunca diga 'two luggages')."
    ]
  }
};

export const PRESET_LESSONS = [
  {
    id: 'dating',
    title: 'Relacionamentos & Namoro Moderno (Benchmark B2)',
    titleEn: 'Relationships & Modern Dating (Benchmark B2)',
    level: 'B2' as const,
    topic: 'Relationships & Modern Dating',
    words: ['ghost someone', 'take for granted', 'fall for', 'commitment', 'crush'],
    notes: 'Tive dificuldade de usar "take for granted" com pronomes e confundi preposições em "fall for".',
    notesEn: 'Had trouble using "take for granted" with objects/pronouns, and confused prepositions with "fall for".',
    data: BENCHMARK_DATING_LESSON
  },
  {
    id: 'negotiation',
    title: 'Negociação de Contrato & Trabalho (B2)',
    titleEn: 'Workplace & Contract Negotiations (B2)',
    level: 'B2' as const,
    topic: 'Workplace & Contract Negotiations',
    words: ['leverage', 'deal breaker', 'meet halfway', 'counterpart', 'table an offer'],
    notes: 'Falei "discuss about" várias vezes e travei para propor concessões e meio-termo.',
    notesEn: 'Learner kept saying "discuss about" and struggled to formulate compromise proposals.',
    data: BUSINESS_NEGOTIATION_LESSON
  },
  {
    id: 'airport',
    title: 'Viagem & Aeroporto Internacional (B1)',
    titleEn: 'Travel Dilemmas & Airport Logistics (B1)',
    level: 'B1' as const,
    topic: 'Travel Dilemmas & Airport Logistics',
    words: ['carry-on', 'layover', 'boarding pass', 'lost and found', 'customs declaration'],
    notes: 'Inverti a ordem das palavras em perguntas indiretas tipo "where is the gate".',
    notesEn: 'Student inverted word order in indirect questions like "Can you tell me where is the gate".',
    data: TRAVEL_AIRPORT_LESSON
  }
];
