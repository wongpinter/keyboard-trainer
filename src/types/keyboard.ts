export interface KeyboardLayout {
  name: string;
  keys: KeyMapping[];
  homeRow: string[];
  learningOrder: string[][];
}

export interface KeyMapping {
  qwerty: string;
  target: string;
  finger: number; // 0-9, representing fingers from left pinky to right pinky
  row: number;    // 0-3, representing keyboard rows from bottom to top
}

export interface KeyState {
  key: string;
  state: 'idle' | 'next' | 'active' | 'correct' | 'incorrect';
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  startTime?: number;
  endTime?: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  attempts: number;
  masteryLevel: number; // 0-100
}

export const COLEMAK_LAYOUT: KeyboardLayout = {
  name: 'Colemak',
  homeRow: ['a', 'r', 's', 't', 'd', 'h', 'n', 'e', 'i', 'o'],
  keys: [
    // Row 0 (bottom row)
    { qwerty: 'z', target: 'z', finger: 0, row: 0 },
    { qwerty: 'x', target: 'x', finger: 1, row: 0 },
    { qwerty: 'c', target: 'c', finger: 2, row: 0 },
    { qwerty: 'v', target: 'v', finger: 3, row: 0 },
    { qwerty: 'b', target: 'b', finger: 4, row: 0 },
    { qwerty: 'n', target: 'k', finger: 5, row: 0 },
    { qwerty: 'm', target: 'm', finger: 6, row: 0 },
    { qwerty: ',', target: ',', finger: 7, row: 0 },
    { qwerty: '.', target: '.', finger: 8, row: 0 },
    { qwerty: '/', target: '/', finger: 9, row: 0 },
    
    // Row 1 (home row)
    { qwerty: 'a', target: 'a', finger: 0, row: 1 },
    { qwerty: 's', target: 'r', finger: 1, row: 1 },
    { qwerty: 'd', target: 's', finger: 2, row: 1 },
    { qwerty: 'f', target: 't', finger: 3, row: 1 },
    { qwerty: 'g', target: 'd', finger: 4, row: 1 },
    { qwerty: 'h', target: 'h', finger: 5, row: 1 },
    { qwerty: 'j', target: 'n', finger: 6, row: 1 },
    { qwerty: 'k', target: 'e', finger: 7, row: 1 },
    { qwerty: 'l', target: 'i', finger: 8, row: 1 },
    { qwerty: ';', target: 'o', finger: 9, row: 1 },
    
    // Row 2 (top letter row)
    { qwerty: 'q', target: 'q', finger: 0, row: 2 },
    { qwerty: 'w', target: 'w', finger: 1, row: 2 },
    { qwerty: 'e', target: 'f', finger: 2, row: 2 },
    { qwerty: 'r', target: 'p', finger: 3, row: 2 },
    { qwerty: 't', target: 'g', finger: 4, row: 2 },
    { qwerty: 'y', target: 'j', finger: 5, row: 2 },
    { qwerty: 'u', target: 'l', finger: 6, row: 2 },
    { qwerty: 'i', target: 'u', finger: 7, row: 2 },
    { qwerty: 'o', target: 'y', finger: 8, row: 2 },
    { qwerty: 'p', target: ';', finger: 9, row: 2 },
  ],
  learningOrder: [
    // Stage 1: Home row foundation
    ['a', 'r', 's', 't'],
    ['d', 'h', 'n', 'e'],
    ['i', 'o'],
    
    // Stage 2: Common letter extensions
    ['f', 'p', 'l', 'u'],
    ['g', 'j', 'y'],
    
    // Stage 3: Remaining letters
    ['q', 'w', 'c', 'v'],
    ['b', 'k', 'm', 'x', 'z'],
    
    // Stage 4: Punctuation
    [',', '.', ';', '/']
  ]
};