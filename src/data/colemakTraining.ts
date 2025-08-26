export interface TrainingLesson {
  id: string;
  name: string;
  description: string;
  type: 'words' | 'sentences' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusKeys: string[];
  content: string[];
  minAccuracy: number;
  minWpm: number;
}

export interface TrainingCurriculum {
  name: string;
  description: string;
  lessons: TrainingLesson[];
}

// Colemak training words organized by difficulty
const beginnerWords = [
  "are", "and", "sad", "ten", "hen", "eat", "tea", "sea", "she", "son",
  "sin", "tan", "tin", "toe", "ton", "dot", "hot", "not", "nod", "one",
  "rat", "ran", "rot", "red", "rid", "sat", "sit"
];

const intermediateWords = [
  "dear", "dirt", "dare", "date", "door", "darn", "east", "hand", "hard",
  "hate", "head", "hear", "heat", "hint", "horn", "into", "iron", "near",
  "neat", "nest", "rain", "rate", "rent", "rest", "ride", "road", "roar",
  "rose", "sand", "send", "sent", "shed", "shot", "star", "stir", "that",
  "then", "this", "tide", "torn", "tree"
];

const advancedWords = [
  "ahead", "arise", "artist", "ashore", "attend", "drain", "earth", "heart",
  "hoist", "honor", "horse", "insert", "intend", "raisin", "ratio", "saint",
  "sander", "senior", "shore", "stain", "stand", "start", "stone", "store",
  "train", "trend"
];

const beginnerSentences = [
  "He is a son.",
  "She ate the toast.",
  "The rat ran into the shed.",
  "I hear the train horn.",
  "He has ten red hens."
];

const intermediateSentences = [
  "Start the roast dinner.",
  "A horse ate the entire ration.",
  "The artist sat on the stone.",
  "Send the rent on that date.",
  "He has a heart of stone.",
  "The rain started on the tin shed."
];

const advancedSentences = [
  "Attend the senior dinner.",
  "He has an intense hatred.",
  "Iron the torn shirt.",
  "A red rose is a treat.",
  "He is an artist in residence.",
  "Her dress has a tear in it.",
  "The stars shine at night.",
  "She has a tan and a red dress.",
  "He hit the road and ran."
];

// Colemak-DH specific words and sentences
const colemakDHWords = [
  "ago", "aim", "air", "arm", "art", "ate", "ear", "eat", "egg", "era",
  "erg", "eta", "gam", "gan", "gas", "gat", "gem", "gen", "get", "gin",
  "git", "goa", "got", "ire", "its", "mag", "man", "mar", "mas", "mat",
  "meg", "men", "met", "mig", "mir", "moa", "mog", "mon", "mor", "mos",
  "mot", "nag", "nam", "nar", "nas", "nat", "neg", "net", "nig", "nim",
  "nit", "nog", "nom", "nor", "nos", "not", "oar", "oat", "oes", "oga",
  "oho", "ohs", "oig", "ois", "oit", "oma", "oms", "one", "ono", "ons",
  "ont", "ora", "ore", "ors", "ort", "ose", "rag", "ram", "ran", "ras",
  "rat", "reg", "rei", "rem", "ren", "res", "ret", "ria", "rig", "rim",
  "rin", "ris", "rit", "roe", "rom", "rot", "sag", "sam", "san", "sar",
  "sat", "sea", "seg", "sei", "sen", "ser", "set", "sim", "sin", "sir",
  "sit", "som", "son", "sot", "sri", "tag", "tam", "tan", "tao", "tar",
  "tas", "tea", "teg", "ten", "tes", "tet", "tig", "tin", "tis", "toe",
  "tog", "tom", "ton", "tor", "tos", "tot", "age", "agent", "again",
  "among", "arise", "arson", "eager", "giant", "grain", "grant", "image",
  "ingot", "irate", "mango", "mason", "minor", "moist", "mongo", "organ",
  "ratio", "reign", "roast", "roman", "rotor", "sigma", "stain", "stair",
  "stare", "stern", "stone", "store", "storm", "strag", "strain", "strata",
  "stream", "tarot", "tenor", "tiger", "timer", "tonga", "train", "triage", "trigo"
];

const colemakDHSentences = [
  "The man ate a mango.",
  "A giant rat ran in the store.",
  "The agent is in the room.",
  "I am going to the store.",
  "He is a senior agent.",
  "The train is on time.",
  "A storm is coming again.",
  "Grant me one more time.",
  "The tiger is in the grass.",
  "He is a roman senator.",
  "She is a great artist.",
  "The stone is in the garden.",
  "I saw a giant meteor.",
  "He is a man of honor.",
  "The organ is in the main room.",
  "The mason is on the roof.",
  "The train is going to rome.",
  "The storm is raging on.",
  "He is in a state of rage.",
  "The team is in a meeting."
];

// Colemak bigram training sets for muscle memory development
const homeRowRolls = [
  "he he he", "ar ar ar", "er er er", "in in in", "ne ne ne", "re re re", "es es es", "an an an",
  "at at at", "on on on", "or or or", "to to to", "ha ha ha", "hi hi hi", "ho ho ho", "as as as",
  "is is is", "it it it", "en en en", "et et et", "ed ed ed", "do do do", "so so so", "se se se"
];

const highFrequencyRolls = [
  "th th th", "ou ou ou", "ea ea ea", "ro ro ro", "le le le", "ve ve ve", "co co co", "al al al",
  "ti ti ti", "de de de", "fo fo fo", "wh wh wh", "sh sh sh", "ur ur ur", "pe pe pe", "yo yo yo",
  "li li li", "ch ch ch", "ll ll ll", "be be be", "ma ma ma", "of of of", "nd nd nd", "ng ng ng"
];

const sameHandCombinations = [
  "st st st", "oi oi oi", "pl pl pl", "ly ly ly", "pr pr pr", "tr tr tr", "dr dr dr", "gr gr gr",
  "io io io", "ai ai ai", "ui ui ui", "ac ac ac", "im im im", "po po po", "ic ic ic", "ag ag ag",
  "sp sp sp", "bl bl bl", "cl cl cl", "gl gl gl", "sl sl sl", "cr cr cr", "fr fr fr", "br br br"
];

const sameFingerBigrams = [
  "sd sd sd", "ju ju ju", "fr fr fr", "lo lo lo", "ki ki ki", "ny ny ny", "de de de", "ce ce ce",
  "gr gr gr", "my my my", "br br br", "cd cd cd", "mu mu mu", "fv fv fv", "ki ki ki", "lo lo lo",
  "um um um", "ik ik ik", "rf rf rf", "lo lo lo", "ik ik ik", "uj uj uj", "ds ds ds", "uj uj uj"
];

// Helper function to generate practice text
export const generatePracticeText = (lesson: TrainingLesson, length: number = 100): string => {
  // Ensure we have a valid lesson
  if (!lesson) {
    return 'No lesson provided.';
  }

  if (!lesson.content || !Array.isArray(lesson.content) || lesson.content.length === 0) {
    return 'No practice content available for this lesson.';
  }

  // Filter out any undefined or invalid content
  const validContent = lesson.content.filter(item => item && typeof item === 'string' && item.trim().length > 0);

  if (validContent.length === 0) {
    return 'No valid practice content available for this lesson.';
  }

  let text = '';
  let currentLength = 0;
  let attempts = 0;
  const maxAttempts = 50; // Prevent infinite loops

  while (currentLength < length && attempts < maxAttempts) {
    const randomContent = validContent[Math.floor(Math.random() * validContent.length)];

    if (randomContent) {
      const separator = text ? ' ' : '';
      const newSegment = separator + randomContent;

      if (currentLength + newSegment.length <= length) {
        text += newSegment;
        currentLength += newSegment.length;
      } else {
        // If we can't fit the whole segment, try a smaller one or break
        if (text) break;
        text = randomContent.substring(0, length);
        break;
      }
    }
    attempts++;
  }

  // Ensure we always return a valid string
  const result = text.trim();
  return result || 'Practice text generation failed.';
};

// Helper function to generate mixed practice text
const generateMixedContent = (words: string[], sentences: string[], count: number = 10): string[] => {
  const mixed: string[] = [];
  const wordGroups = [];

  // Create word groups of 3-5 words
  for (let i = 0; i < count / 2; i++) {
    const groupSize = Math.floor(Math.random() * 3) + 3; // 3-5 words
    const group = [];
    for (let j = 0; j < groupSize; j++) {
      group.push(words[Math.floor(Math.random() * words.length)]);
    }
    wordGroups.push(group.join(' '));
  }

  // Mix word groups and sentences
  mixed.push(...wordGroups);
  mixed.push(...sentences.slice(0, Math.ceil(count / 2)));

  return mixed.sort(() => Math.random() - 0.5); // Shuffle
};

export const colemakCurriculum: TrainingCurriculum = {
  name: "Colemak Mastery Course",
  description: "Progressive Colemak training from basic words to complex sentences",
  lessons: [
    {
      id: "colemak-words-beginner",
      name: "Basic Words",
      description: "Simple 3-letter words to build foundation",
      type: "words",
      difficulty: "beginner",
      focusKeys: ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o"],
      content: beginnerWords,
      minAccuracy: 85,
      minWpm: 15
    },
    {
      id: "colemak-words-intermediate", 
      name: "Common Words",
      description: "4-letter words with increased complexity",
      type: "words",
      difficulty: "intermediate",
      focusKeys: ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o", "l", "u"],
      content: intermediateWords,
      minAccuracy: 88,
      minWpm: 20
    },
    {
      id: "colemak-words-advanced",
      name: "Advanced Words", 
      description: "Complex words with all letter combinations",
      type: "words",
      difficulty: "advanced",
      focusKeys: [], // All keys
      content: advancedWords,
      minAccuracy: 90,
      minWpm: 25
    },
    {
      id: "colemak-sentences-beginner",
      name: "Simple Sentences",
      description: "Short sentences with basic punctuation",
      type: "sentences",
      difficulty: "beginner", 
      focusKeys: ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o"],
      content: beginnerSentences,
      minAccuracy: 85,
      minWpm: 18
    },
    {
      id: "colemak-sentences-intermediate",
      name: "Common Sentences",
      description: "Longer sentences with varied vocabulary",
      type: "sentences",
      difficulty: "intermediate",
      focusKeys: ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o", "l", "u"],
      content: intermediateSentences,
      minAccuracy: 88,
      minWpm: 22
    },
    {
      id: "colemak-sentences-advanced",
      name: "Complex Sentences",
      description: "Advanced sentences with full vocabulary",
      type: "sentences", 
      difficulty: "advanced",
      focusKeys: [], // All keys
      content: advancedSentences,
      minAccuracy: 92,
      minWpm: 28
    },
    {
      id: "colemak-mixed-beginner",
      name: "Mixed Practice - Basic",
      description: "Combination of words and sentences",
      type: "mixed",
      difficulty: "beginner",
      focusKeys: ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o"],
      content: generateMixedContent(beginnerWords, beginnerSentences, 15),
      minAccuracy: 87,
      minWpm: 20
    },
    {
      id: "colemak-mixed-intermediate", 
      name: "Mixed Practice - Intermediate",
      description: "Varied practice with moderate difficulty",
      type: "mixed",
      difficulty: "intermediate",
      focusKeys: ["a", "r", "s", "t", "d", "h", "n", "e", "i", "o", "l", "u"],
      content: generateMixedContent(intermediateWords, intermediateSentences, 15),
      minAccuracy: 90,
      minWpm: 25
    },
    {
      id: "colemak-mixed-advanced",
      name: "Mixed Practice - Advanced",
      description: "Comprehensive practice with all elements",
      type: "mixed",
      difficulty: "advanced",
      focusKeys: [], // All keys
      content: generateMixedContent(advancedWords, advancedSentences, 20),
      minAccuracy: 93,
      minWpm: 30
    },
    // Colemak-DH specific lessons
    {
      id: "colemak-dh-words-basic",
      name: "Colemak-DH Basic Words",
      description: "Essential words for Colemak-DH layout practice",
      type: "words",
      difficulty: "beginner",
      focusKeys: ["a", "r", "s", "t", "g", "m", "n", "e", "i", "o"],
      content: colemakDHWords.slice(0, 50), // First 50 words for basic practice
      minAccuracy: 85,
      minWpm: 15
    },
    {
      id: "colemak-dh-words-advanced",
      name: "Colemak-DH Advanced Words",
      description: "Complex words and longer terms for Colemak-DH",
      type: "words",
      difficulty: "advanced",
      focusKeys: [], // All keys
      content: colemakDHWords.slice(50), // Remaining words including longer ones
      minAccuracy: 90,
      minWpm: 25
    },
    {
      id: "colemak-dh-sentences",
      name: "Colemak-DH Sentences",
      description: "Complete sentences optimized for Colemak-DH layout",
      type: "sentences",
      difficulty: "intermediate",
      focusKeys: [], // All keys
      content: colemakDHSentences,
      minAccuracy: 88,
      minWpm: 22
    },
    {
      id: "colemak-dh-mixed",
      name: "Colemak-DH Mixed Practice",
      description: "Comprehensive Colemak-DH practice with words and sentences",
      type: "mixed",
      difficulty: "advanced",
      focusKeys: [], // All keys
      content: generateMixedContent(colemakDHWords, colemakDHSentences, 20),
      minAccuracy: 92,
      minWpm: 28
    },
    // Colemak bigram training lessons for muscle memory development
    {
      id: "colemak-bigrams-home-row",
      name: "Home Row Rolls",
      description: "The fastest alternating-hand movements on the home row - core of Colemak's strength",
      type: "words",
      difficulty: "beginner",
      focusKeys: ["a", "r", "s", "t", "n", "e", "i", "o"],
      content: homeRowRolls,
      minAccuracy: 90,
      minWpm: 20
    },
    {
      id: "colemak-bigrams-high-frequency",
      name: "High Frequency Rolls",
      description: "Common English bigrams with comfortable inward and outward rolls",
      type: "words",
      difficulty: "intermediate",
      focusKeys: [], // All keys
      content: highFrequencyRolls,
      minAccuracy: 88,
      minWpm: 25
    },
    {
      id: "colemak-bigrams-same-hand",
      name: "Same Hand Combinations",
      description: "Bigrams typed with one hand using different fingers - builds dexterity",
      type: "words",
      difficulty: "intermediate",
      focusKeys: [], // All keys
      content: sameHandCombinations,
      minAccuracy: 85,
      minWpm: 22
    },
    {
      id: "colemak-bigrams-same-finger",
      name: "Same Finger Bigrams",
      description: "Challenging same-finger bigrams - focus on accuracy over speed",
      type: "words",
      difficulty: "advanced",
      focusKeys: [], // All keys
      content: sameFingerBigrams,
      minAccuracy: 80,
      minWpm: 18
    }
  ]
};

// Bigram training tips for optimal practice
export const bigramTrainingTips = [
  "Focus on accuracy over speed. Speed will come naturally as your accuracy improves.",
  "Try to type with a steady rhythm. Using a metronome can help.",
  "Do not bottom out the keys; use a light touch.",
  "Mix and match from different categories in your practice sessions.",
  "Home row rolls should feel smooth and effortless - they're Colemak's strength.",
  "Same finger bigrams are the most challenging - be patient and focus on precision.",
  "Practice same hand combinations to build finger independence and dexterity.",
  "Take breaks between sessions to avoid fatigue and maintain good form."
];

// Helper functions for lesson management
export const getLessonById = (id: string): TrainingLesson | undefined => {
  return colemakCurriculum.lessons.find(lesson => lesson.id === id);
};

export const getLessonsByType = (type: 'words' | 'sentences' | 'mixed'): TrainingLesson[] => {
  return colemakCurriculum.lessons.filter(lesson => lesson.type === type);
};

export const getLessonsByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced'): TrainingLesson[] => {
  return colemakCurriculum.lessons.filter(lesson => lesson.difficulty === difficulty);
};

export const getNextLesson = (currentLessonId: string): TrainingLesson | undefined => {
  const currentIndex = colemakCurriculum.lessons.findIndex(lesson => lesson.id === currentLessonId);
  if (currentIndex >= 0 && currentIndex < colemakCurriculum.lessons.length - 1) {
    return colemakCurriculum.lessons[currentIndex + 1];
  }
  return undefined;
};

export default colemakCurriculum;
