
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import englishWords from 'an-array-of-english-words';
import './App.css';

const HINT_COST = 20;
const LEVEL_REWARD = 30;
const DAILY_REWARD = 100;
const DAILY_SAVE_KEY = 'brainLettersDailyChallenge';
const SETTINGS_SAVE_KEY = 'brainLettersSettings';
// BRAIN LETTERS THEMES
const GAME_THEMES = [
  { id: 'vintage-parchment', name: 'Vintage Parchment', texture: 'parchment' },
  { id: 'classic-leather', name: 'Classic Leather', texture: 'leather' },
  { id: 'cosmic-galaxy', name: 'Cosmic Galaxy', texture: 'galaxy' },
  { id: 'emerald-marble', name: 'Emerald Marble', texture: 'marble' },
  { id: 'carbon-fiber', name: 'Carbon Fiber', texture: 'carbon' },
  { id: 'retro-70s', name: 'Retro 70s', texture: 'retro' },
  { id: 'royal-velvet', name: 'Royal Velvet', texture: 'velvet' },
  { id: 'frozen-ice', name: 'Frozen Ice', texture: 'ice' },
  { id: 'sunset-desert', name: 'Sunset Desert', texture: 'desert' },
  { id: 'ocean-depths', name: 'Ocean Depths', texture: 'ocean' },
  { id: 'wooden-classic', name: 'Wooden Classic', texture: 'wood' },
  { id: 'neon-tech', name: 'Neon Tech', texture: 'neon' }
];

// ACHIEVEMENT PROGRESSION MILESTONES
const ACHIEVEMENT_MILESTONES = {
  firstVictory: {
    title: 'First Victory',
    icon: '🌟',
    targets: [1],
    rewards: [20],
    description: 'Complete your first level.'
  },

  wordExplorer: {
    title: 'Word Explorer',
    icon: '🧩',
    targets: [10, 25, 50, 100, 250, 500],
    rewards: [50, 75, 100, 150, 200, 300],
    description: 'Complete different levels.'
  },

  puzzleMaster: {
    title: 'Puzzle Master',
    icon: '🏆',
    targets: [20, 50, 100, 200, 500, 1000],
    rewards: [100, 150, 200, 300, 500, 750],
    description: 'Complete different levels.'
  },

  dailySolver: {
    title: 'Daily Solver',
    icon: '🎯',
    targets: [1, 5, 10, 25, 50, 100],
    rewards: [30, 50, 75, 100, 150, 200],
    description: 'Complete daily challenges.'
  },

  streakStarter: {
    title: 'Streak Starter',
    icon: '🔥',
    targets: [3, 7, 14, 30, 60, 100],
    rewards: [50, 75, 100, 150, 250, 400],
    description: 'Maintain your daily challenge streak.'
  },

  risingGenius: {
    title: 'Rising Genius',
    icon: '🚀',
    targets: [10, 25, 50, 100, 250, 500],
    rewards: [50, 75, 100, 150, 200, 300],
    description: 'Unlock new game levels.'
  }
};


const DEFAULT_SETTINGS = {
  soundEffects: true,
  backgroundMusic: true,
  vibration: true,
  dailyReminders: true,
  theme: 'cosmic-galaxy'
};

// LOAD SAVED SETTINGS
const getSavedSettings = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SETTINGS_SAVE_KEY)
    );

    return {
      ...DEFAULT_SETTINGS,
      ...(saved && typeof saved === 'object' ? saved : {})
    };
  } catch (error) {
    console.error('Could not load settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// =====================================
// BRAIN LETTERS SOUND ENGINE
// =====================================
let gameAudioContext = null;


const playGameSound = (sound) => {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!gameAudioContext) {
      gameAudioContext = new AudioContextClass();
    }

    const audio = gameAudioContext;

    if (audio.state === 'suspended') {
      audio.resume().catch((error) => {
        console.warn('Could not resume game audio:', error);
      });
    }

    if (audio.state !== 'running') return;

    // SOFT MUSICAL SOUND EFFECTS
    const soundPatterns = {
      select: [
        { frequency: 587.33, duration: 0.09 }
      ],

      correct: [
        { frequency: 659.25, duration: 0.13 },
        { frequency: 783.99, duration: 0.19 }
      ],

      extra: [
        { frequency: 783.99, duration: 0.12 },
        { frequency: 987.77, duration: 0.15 },
        { frequency: 1174.66, duration: 0.22 }
      ],

      wrong: [
        { frequency: 392.00, duration: 0.12 },
        { frequency: 349.23, duration: 0.18 }
      ],

      complete: [
        { frequency: 523.25, duration: 0.17 },
        { frequency: 659.25, duration: 0.17 },
        { frequency: 783.99, duration: 0.20 },
        { frequency: 1046.50, duration: 0.38 }
      ]
    };

    const pattern = soundPatterns[sound];
    if (!pattern) return;

    let startTime = audio.currentTime;

    pattern.forEach((note) => {
      const oscillator = audio.createOscillator();
      const harmonic = audio.createOscillator();

      const mainGain = audio.createGain();
      const harmonicGain = audio.createGain();
      const soundGain = audio.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        note.frequency,
        startTime
      );

      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(
        note.frequency * 2,
        startTime
      );

      mainGain.gain.setValueAtTime(0.0001, startTime);
      mainGain.gain.exponentialRampToValueAtTime(
        0.25,
        startTime + 0.015
      );
      mainGain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + note.duration
      );

      harmonicGain.gain.setValueAtTime(0.0001, startTime);
      harmonicGain.gain.exponentialRampToValueAtTime(
        0.04,
        startTime + 0.015
      );
      harmonicGain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + note.duration * 0.75
      );

      soundGain.gain.setValueAtTime(1.0, startTime);

      oscillator.connect(mainGain);
      harmonic.connect(harmonicGain);

      mainGain.connect(soundGain);
      harmonicGain.connect(soundGain);
      soundGain.connect(audio.destination);

      oscillator.start(startTime);
      harmonic.start(startTime);

      oscillator.stop(startTime + note.duration);
      harmonic.stop(startTime + note.duration);

      startTime += note.duration * 0.88;
    });

  } catch (error) {
    console.warn('Audio playback unavailable:', error);
  }
};
// =====================================
// BRAIN LETTERS BACKGROUND MUSIC
// =====================================
let backgroundMusicTimer = null;
let backgroundMusicGain = null;
let backgroundMusicOscillators = [];

// =====================================
// BRAIN LETTERS BACKGROUND MUSIC
// =====================================

// FIRST 10 HANDCRAFTED LEVELS
const STARTER_LEVELS = [
  {
    letters: ['S', 'T', 'O', 'N', 'E'],
    words: ['STONE', 'NOTE', 'ONES', 'TONE', 'NOSE', 'NEST'],
    extraWords: ['TENS', 'TONS', 'TOES', 'EONS', 'SENT', 'TEN', 'NET', 'SET', 'SON', 'TON', 'NOT']
  },
  {
    letters: ['P', 'L', 'A', 'N', 'E'],
    words: ['PLANE', 'PANEL', 'PLAN', 'LANE', 'LEAN', 'PALE'],
    extraWords: ['PAN', 'NAP', 'APE', 'PEA', 'PAL', 'LAP', 'ALE', 'PLEA', 'PEAL', 'LEAP']
  },
  {
    letters: ['T', 'R', 'A', 'I', 'L'],
    words: ['TRAIL', 'TRIAL', 'TAIL', 'RAIL', 'LIAR', 'LAIR'],
    extraWords: ['RAT', 'TAR', 'ART', 'AIR', 'AIL', 'LIT', 'TIL']
  },
  {
    letters: ['H', 'E', 'A', 'R', 'T'],
    words: ['HEART', 'EARTH', 'HATER', 'HEAR', 'HARE', 'HEAT'],
    extraWords: ['RATE', 'TEAR', 'EAT', 'ART', 'ARE', 'EAR', 'HAT', 'THE']
  },
  {
    letters: ['C', 'A', 'T', 'E', 'R'],
    words: ['CATER', 'TRACE', 'REACT', 'CRATE', 'CARE', 'RACE'],
    extraWords: ['RATE', 'TEAR', 'EAT', 'CAT', 'CAR', 'ARC', 'ACE', 'EAR', 'RAT', 'TAR']
  },
  {
    letters: ['S', 'L', 'A', 'T', 'E'],
    words: ['SLATE', 'STALE', 'STEAL', 'TALES', 'LEAST', 'SEAL'],
    extraWords: ['TALE', 'LATE', 'TEAL', 'SALE', 'EAST', 'EATS', 'SEAT', 'EAT', 'SEA', 'SAT']
  },
  {
    letters: ['S', 'T', 'A', 'R', 'E'],
    words: ['STARE', 'TEARS', 'RATES', 'TARES', 'ASTER', 'SEAT'],
    extraWords: ['STAR', 'EAST', 'EARS', 'RATE', 'TEAR', 'EATS', 'SEAR', 'ART', 'RAT', 'TAR']
  },
  {
    letters: ['G', 'R', 'A', 'D', 'E'],
    words: ['GRADE', 'RAGED', 'RAGE', 'GEAR', 'READ', 'DEAR'],
    extraWords: ['DARE', 'RAG', 'AGE', 'EAR', 'ERA', 'RED', 'AGED']
  },
  {
    letters: ['N', 'I', 'G', 'H', 'T'],
    words: ['NIGHT', 'THING', 'THIN', 'HINT', 'NIGH', 'TING'],
    extraWords: ['HIT', 'TIN', 'GIN', 'NIT', 'GIT', 'NIGH']
  },
  {
    letters: ['C', 'L', 'E', 'A', 'N'],
    words: ['CLEAN', 'LANCE', 'CANE', 'LACE', 'ACNE', 'CLAN'],
    extraWords: ['LANE', 'LEAN', 'ACE', 'ALE', 'CAN', 'LAC', 'ELAN']
  }
];
// COMMON WORDS FOR MAIN PUZZLE ANSWERS
const COMMON_WORDS = new Set([
  // 3-LETTER WORDS
  'ACE', 'ACT', 'AGE', 'AIR', 'ALL', 'AND', 'ANT',
  'ANY', 'APE', 'ARM', 'ART', 'ASK', 'BAD', 'BAG',
  'BAT', 'BED', 'BEE', 'BIG', 'BIT', 'BOX', 'BOY',
  'BUS', 'BUT', 'BUY', 'CAN', 'CAP', 'CAR', 'CAT',
  'CUP', 'CUT', 'DAY', 'DEN', 'DID', 'DIG', 'DOG',
  'DRY', 'EAR', 'EAT', 'EGG', 'END', 'EYE', 'FAN',
  'FAR', 'FAT', 'FEW', 'FIT', 'FLY', 'FOG', 'FUN',
  'GAP', 'GAS', 'GET', 'GOD', 'GOT', 'GUM', 'GUN',
  'GUY', 'HAD', 'HAM', 'HAS', 'HAT', 'HEN', 'HER',
  'HIM', 'HIS', 'HIT', 'HOT', 'HOW', 'ICE', 'INK',
  'JAM', 'JET', 'JOB', 'JOY', 'KEY', 'KID', 'KIT',
  'LAP', 'LAW', 'LEG', 'LET', 'LIE', 'LIP', 'LOT',
  'LOW', 'MAD', 'MAN', 'MAP', 'MAT', 'MEN', 'MIX',
  'MOM', 'MUD', 'NET', 'NEW', 'NOD', 'NOR', 'NOT',
  'NOW', 'NUT', 'OAK', 'OIL', 'OLD', 'ONE', 'OUR',
  'OUT', 'OWN', 'PAN', 'PAY', 'PEN', 'PET', 'PIE',
  'PIG', 'PIN', 'POT', 'PUT', 'RAG', 'RAN', 'RAT',
  'RED', 'RIB', 'RID', 'ROW', 'RUG', 'RUN', 'SAD',
  'SAT', 'SAW', 'SAY', 'SEA', 'SEE', 'SET', 'SHE',
  'SIT', 'SKY', 'SON', 'SUN', 'TAN', 'TAP', 'TAR',
  'TEA', 'TEN', 'THE', 'TIE', 'TIP', 'TOE', 'TOO',
  'TOP', 'TOY', 'TRY', 'TWO', 'USE', 'VAN', 'WAR',
  'WAY', 'WEB', 'WET', 'WHO', 'WHY', 'WIN', 'YES',
  'YET', 'YOU', 'ZIP', 'ZOO',

  // 4-LETTER WORDS
  'ABLE', 'ACID', 'AGED', 'ALSO', 'AREA', 'ARMY',
  'BABY', 'BACK', 'BAKE', 'BALL', 'BAND', 'BANK',
  'BASE', 'BATH', 'BEAR', 'BEAT', 'BEEN', 'BEER',
  'BELL', 'BELT', 'BEST', 'BIRD', 'BITE', 'BLUE',
  'BOAT', 'BODY', 'BOLD', 'BONE', 'BOOK', 'BOOT',
  'BORN', 'BOTH', 'BOWL', 'BULK', 'BURN', 'CAKE',
  'CALL', 'CALM', 'CAME', 'CAMP', 'CANE', 'CARD',
  'CARE', 'CASE', 'CASH', 'CAST', 'CAVE', 'CHAT',
  'CHEF', 'CHIP', 'CITY', 'CLAY', 'CLUB', 'COAT',
  'CODE', 'COLD', 'COME', 'COOK', 'COOL', 'COPY',
  'COST', 'CREW', 'CROP', 'CURE', 'DARK', 'DATE',
  'DAWN', 'DEAD', 'DEAL', 'DEAR', 'DEEP', 'DESK',
  'DIAL', 'DICE', 'DIET', 'DIRT', 'DISH', 'DOOR',
  'DOWN', 'DRAW', 'DREW', 'DROP', 'DRUM', 'DUCK',
  'DULL', 'DUST', 'EACH', 'EARN', 'EASE', 'EAST',
  'EASY', 'EDGE', 'EDIT', 'ELSE', 'EVEN', 'EVER',
  'FACE', 'FACT', 'FAIL', 'FAIR', 'FALL', 'FARM',
  'FAST', 'FEAR', 'FEED', 'FEEL', 'FEET', 'FELL',
  'FELT', 'FILE', 'FILL', 'FILM', 'FIND', 'FINE',
  'FIRE', 'FIRM', 'FISH', 'FIVE', 'FLAG', 'FLAT',
  'FLOW', 'FOOD', 'FOOT', 'FORD', 'FORM', 'FOUR',
  'FREE', 'FROG', 'FROM', 'FUEL', 'FULL', 'GAME',
  'GATE', 'GAVE', 'GIFT', 'GIRL', 'GIVE', 'GLAD',
  'GOAL', 'GOAT', 'GOLD', 'GONE', 'GOOD', 'GRAY',
  'GREW', 'GROW', 'HAIR', 'HALF', 'HALL', 'HAND',
  'HANG', 'HARD', 'HARM', 'HATE', 'HAVE', 'HEAD',
  'HEAR', 'HEAT', 'HELD', 'HELP', 'HERE', 'HERO',
  'HIDE', 'HIGH', 'HILL', 'HOLD', 'HOLE', 'HOME',
  'HOPE', 'HORN', 'HOUR', 'HUGE', 'HUNT', 'IDEA',
  'IRON', 'ITEM', 'JOIN', 'JUMP', 'JUST', 'KEEP',
  'KEPT', 'KICK', 'KIND', 'KING', 'KISS', 'KNEE',
  'KNEW', 'KNOW', 'LACK', 'LAKE', 'LAMB', 'LAND',
  'LAST', 'LATE', 'LEAD', 'LEAF', 'LEFT', 'LEND',
  'LESS', 'LIFE', 'LIFT', 'LIKE', 'LINE', 'LINK',
  'LIST', 'LIVE', 'LOAD', 'LOAN', 'LOCK', 'LONG',
  'LOOK', 'LORD', 'LOSE', 'LOSS', 'LOST', 'LOVE',
  'LUCK', 'MADE', 'MAIL', 'MAIN', 'MAKE', 'MALE',
  'MANY', 'MARK', 'MASK', 'MASS', 'MATE', 'MEAL',
  'MEAN', 'MEAT', 'MEET', 'MELT', 'MIND', 'MINE',
  'MISS', 'MODE', 'MOOD', 'MOON', 'MORE', 'MOST',
  'MOVE', 'MUCH', 'MUST', 'NAME', 'NEAR', 'NECK',
  'NEED', 'NEWS', 'NEXT', 'NICE', 'NINE', 'NONE',
  'NOSE', 'NOTE', 'ONCE', 'ONLY', 'OPEN', 'OVER',
  'PAGE', 'PAID', 'PAIN', 'PAIR', 'PARK', 'PART',
  'PASS', 'PAST', 'PATH', 'PEAK', 'PICK', 'PINK',
  'PLAN', 'PLAY', 'PLOT', 'PLUS', 'POEM', 'POOL',
  'POOR', 'PORT', 'POST', 'PULL', 'PURE', 'PUSH',
  'RACE', 'RAIN', 'RARE', 'RATE', 'READ', 'REAL',
  'REST', 'RICE', 'RICH', 'RIDE', 'RING', 'RISE',
  'RISK', 'ROAD', 'ROCK', 'ROLE', 'ROOM', 'ROOT',
  'ROPE', 'ROSE', 'RULE', 'SAFE', 'SAID', 'SALT',
  'SAME', 'SAND', 'SAVE', 'SEAT', 'SEED', 'SEEM',
  'SEEN', 'SELF', 'SELL', 'SEND', 'SHIP', 'SHOE',
  'SHOP', 'SHOT', 'SHOW', 'SHUT', 'SICK', 'SIDE',
  'SIGN', 'SILK', 'SING', 'SINK', 'SITE', 'SIZE',
  'SKIN', 'SLIP', 'SLOW', 'SNOW', 'SOFT', 'SOIL',
  'SOLD', 'SOME', 'SONG', 'SOON', 'SORT', 'STAR',
  'STAY', 'STEP', 'STOP', 'SUCH', 'SUIT', 'SURE',
  'TAKE', 'TALE', 'TALK', 'TALL', 'TANK', 'TAPE',
  'TASK', 'TEAM', 'TELL', 'TEND', 'TERM', 'TEST',
  'TEXT', 'THAN', 'THAT', 'THEM', 'THEN', 'THEY',
  'THIN', 'THIS', 'TIME', 'TINY', 'TOLD', 'TONE',
  'TOOK', 'TOOL', 'TREE', 'TRIP', 'TRUE', 'TURN',
  'TYPE', 'UNIT', 'UPON', 'USED', 'USER', 'VARY',
  'VAST', 'VERY', 'VIEW', 'VOTE', 'WAIT', 'WAKE',
  'WALK', 'WALL', 'WANT', 'WARM', 'WASH', 'WAVE',
  'WAYS', 'WEAK', 'WEAR', 'WEEK', 'WELL', 'WENT',
  'WERE', 'WEST', 'WHAT', 'WHEN', 'WIDE', 'WIFE',
  'WILD', 'WILL', 'WIND', 'WINE', 'WING', 'WISE',
  'WISH', 'WITH', 'WOOD', 'WORD', 'WORK', 'YARD',
  'YEAR', 'YOUR', 'ZERO',

  // 5-LETTER WORDS
  'APPLE', 'BEACH', 'BEARD', 'BELOW', 'BLACK',
  'BRAIN', 'BREAD', 'BRING', 'BROWN', 'CHAIR',
  'CHILD', 'CLEAN', 'CLEAR', 'CLOSE', 'CLOUD',
  'COAST', 'COLOR', 'COUNT', 'COVER', 'DANCE',
  'DREAM', 'DRINK', 'EARTH', 'ENJOY', 'EVERY',
  'FAITH', 'FAMILY', 'FIELD', 'FIGHT', 'FIRST',
  'FLOOR', 'FRUIT', 'GLASS', 'GRAPE', 'GREEN',
  'GROUP', 'HAPPY', 'HEART', 'HORSE', 'HOUSE',
  'HUMAN', 'JUICE', 'LIGHT', 'MONEY', 'MONTH',
  'MOUSE', 'MOUTH', 'MUSIC', 'NIGHT', 'NORTH',
  'OCEAN', 'ORDER', 'OTHER', 'PAPER', 'PARTY',
  'PEACE', 'PHONE', 'PHOTO', 'PIANO', 'PLACE',
  'PLANE', 'PLANT', 'POINT', 'POWER', 'PRICE',
  'QUIET', 'RADIO', 'REACH', 'RIGHT', 'RIVER',
  'ROUND', 'SCALE', 'SCHOOL', 'SHARE', 'SHEEP',
  'SHELF', 'SLEEP', 'SMALL', 'SMILE', 'SNAKE',
  'SOUND', 'SOUTH', 'SPACE', 'SPEAK', 'SPORT',
  'STAND', 'START', 'STONE', 'STORY', 'SUGAR',
  'TABLE', 'TEACH', 'THANK', 'THEIR', 'THING',
  'THINK', 'THREE', 'TIGER', 'TODAY', 'TOUCH',
  'TRAIN', 'TRUCK', 'UNDER', 'VOICE', 'WATER',
  'WATCH', 'WHEEL', 'WHITE', 'WHOLE', 'WOMAN',
  'WORLD', 'WRITE', 'YOUNG'
]);
// WORD DATABASE
const GAME_WORD_BANK = [
  ...new Set(
    englishWords.filter(
      (word) =>
        /^[a-z]+$/.test(word) &&
        word.length >= 3 &&
        word.length <= 8 &&
        new Set(word).size === word.length
    )
  )
];

const GAME_WORD_SET = new Set(GAME_WORD_BANK);

const WORDS_BY_LENGTH = {};

for (let length = 3; length <= 8; length++) {
  WORDS_BY_LENGTH[length] = GAME_WORD_BANK.filter(
    (word) => word.length === length
  );
}
// SEEDED RANDOM NUMBER GENERATOR
const createRandomGenerator = (seed) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6D2B79F5;

    let value = state;

    value = Math.imul(
      value ^ (value >>> 15),
      value | 1
    );

    value ^= value + Math.imul(
      value ^ (value >>> 7),
      value | 61
    );

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

// SHUFFLED ANSWER COUNT FOR EARLY LEVELS
const getEarlyLevelWordCount = (level) => {
  const mixed = Math.sin(level * 127.1 + 311.7) * 43758.5453;
  const shuffledValue = mixed - Math.floor(mixed);

  return shuffledValue < 0.5 ? 3 : 4;
};


// DIFFICULTY SETTINGS
const getDifficultySettings = (level) => {
  if (level <= 10) {
    return {
      letters: 5,
      wordCount: level <= 5 ? 3 : 4,
      minWordLength: 2,
      maxWordLength: 4
    };
  }

  if (level <= 25) {
    return {
      letters: 5,
      wordCount: 4 + (level % 2),
      minWordLength: 3,
      maxWordLength: 4
    };
  }

  if (level <= 50) {
    return {
      letters: 5,
      wordCount: 4 + (level % 2),
      minWordLength: 3,
      maxWordLength: 5
    };
  }

  if (level <= 100) {
    return {
      letters: 5,
      wordCount: 6,
      minWordLength: 3,
      maxWordLength: 5
    };
  }

  if (level <= 200) {
    return {
      letters: 5,
      wordCount: 7,
      minWordLength: 3,
      maxWordLength: 6
    };
  }

  if (level <= 500) {
    return {
      letters: 6,
      wordCount: 7,
      minWordLength: 4,
      maxWordLength: 6
    };
  }

  if (level <= 1000) {
    return {
      letters: 6,
      wordCount: 7,
      minWordLength: 4,
      maxWordLength: 7
    };
  }

  return {
    letters: 7,
    wordCount: 7,
    minWordLength: 4,
    maxWordLength: 7
  };
};

// CHECK WHETHER A WORD CAN BE FORMED FROM THE LETTER RACK
const canFormWord = (word, letters) => {
  const availableLetters = [...letters];

  for (const letter of word) {
    const letterIndex = availableLetters.indexOf(letter);

    if (letterIndex === -1) return false;

    availableLetters.splice(letterIndex, 1);
  }

  return true;
};

// GENERATE A LEVEL
const generateLevel = (levelNumber) => {
  const settings = getDifficultySettings(levelNumber);

  if (levelNumber <= STARTER_LEVELS.length) {
  const starterLevel = STARTER_LEVELS[levelNumber - 1];

  const random = createRandomGenerator(
    levelNumber * 7919 + 12345
  );

  const allEarlyAnswers = [
    ...new Set([
      ...starterLevel.words,
      ...starterLevel.extraWords
    ])
  ].filter(
    (word) =>
      (word.length === 3 || word.length === 4) &&
      canFormWord(word, starterLevel.letters)
  );

  const commonAnswers = allEarlyAnswers.filter(
  (word) => COMMON_WORDS.has(word.toUpperCase())
);

const commonThreeLetterWords = commonAnswers.filter(
  (word) => word.length === 3
);

const commonFourLetterWords = commonAnswers.filter(
  (word) => word.length === 4
);

const threeLetterWords =
  commonThreeLetterWords.length >= 3
    ? commonThreeLetterWords
    : allEarlyAnswers.filter((word) => word.length === 3);

const fourLetterWords =
  commonFourLetterWords.length >= 4
    ? commonFourLetterWords
    : allEarlyAnswers.filter((word) => word.length === 4);

  const shuffleWords = (words) => {
    const shuffled = [...words];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));

      [shuffled[i], shuffled[j]] = [
        shuffled[j],
        shuffled[i]
      ];
    }

    return shuffled;
  };

  const selectedWords = [
  ...shuffleWords(
    allEarlyAnswers.filter((word) => word.length === 2)
  ).slice(0, 1),

  ...shuffleWords(threeLetterWords).slice(
    0,
    Math.ceil((settings.wordCount - 1) / 2)
  ),

  ...shuffleWords(fourLetterWords).slice(
    0,
    Math.floor((settings.wordCount - 1) / 2)
  )
];

while (selectedWords.length < settings.wordCount) {
  const remainingWords = shuffleWords(
    allEarlyAnswers.filter(
      (word) => !selectedWords.includes(word)
    )
  );

  if (remainingWords.length === 0) break;

  selectedWords.push(remainingWords[0]);
}

  return {
    letters: starterLevel.letters,
    words: shuffleWords(selectedWords),
    extraWords: starterLevel.extraWords
  };
}
  const random = createRandomGenerator(levelNumber * 7919 + 12345);

  for (let rackSize = settings.letters; rackSize >= 5; rackSize--) {
    const anchors = WORDS_BY_LENGTH[rackSize];

    if (!anchors || anchors.length === 0) continue;

    const start = Math.floor(random() * anchors.length);

    for (let attempt = 0; attempt < 80; attempt++) {
      const anchor = anchors[(start + attempt) % anchors.length];
      const rack = [...anchor];
      const possibleWords = [];

      const maximumAnswerLength = Math.min(
        rackSize,
        settings.maxWordLength
      );

      for (
        let length = maximumAnswerLength;
        length >= settings.minWordLength;
        length--
      ) {
        const bucket = WORDS_BY_LENGTH[length] || [];

        for (const word of bucket) {
          if (canFormWord(word, rack)) {
            possibleWords.push(word);
          }
        }
      }

      if (
  levelNumber > 75 &&
  possibleWords.length < settings.wordCount
) continue;

      const selectedWords = [];

if (levelNumber <= 100) {
  const earlyWords = possibleWords.filter(
    (word) =>
      word.length >= settings.minWordLength &&
      word.length <= settings.maxWordLength &&
      COMMON_WORDS.has(word.toUpperCase())
  );

  const shuffledWords = [...earlyWords];

  for (let i = shuffledWords.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledWords[i], shuffledWords[j]] = [
      shuffledWords[j],
      shuffledWords[i]
    ];
  }

  selectedWords.push(...shuffledWords.slice(0, settings.wordCount));

  if (selectedWords.length < settings.wordCount) continue;
} else {
  selectedWords.push(anchor);
}

      const minimumFillLength = settings.minWordLength;

      for (
        let length = maximumAnswerLength;
        length >= minimumFillLength &&
        selectedWords.length < settings.wordCount;
        length--
      ) {
        const bucket = possibleWords.filter(
  (word) =>
    word.length === length &&
    COMMON_WORDS.has(word.toUpperCase()) &&
    !selectedWords.includes(word)
);

        while (bucket.length > 0 && selectedWords.length < settings.wordCount) {
          const index = Math.floor(random() * bucket.length);
          selectedWords.push(bucket.splice(index, 1)[0]);
        }
      }

      if (selectedWords.length < settings.wordCount) continue;

      const possibleExtraWords = [];

      for (
        let length = Math.min(rackSize, settings.maxWordLength);
        length >= 3;
        length--
      ) {
        const bucket = WORDS_BY_LENGTH[length] || [];

        for (const word of bucket) {
          if (
            canFormWord(word, rack) &&
            !possibleExtraWords.includes(word)
          ) {
            possibleExtraWords.push(word);
          }
        }
      }

      return {
        letters: rack.map((letter) => letter.toUpperCase()),
        words: selectedWords.map((word) => word.toUpperCase()),
        extraWords: possibleExtraWords
          .filter((word) => !selectedWords.includes(word))
          .slice(0, 100)
          .map((word) => word.toUpperCase())
      };
    }
  }

  return STARTER_LEVELS[0];
};

// SHUFFLE LETTERS WITHOUT LEAVING THEM IN THEIR ORIGINAL ORDER
const shuffleLettersArray = (letters) => {
  const shuffled = [...letters];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i]
    ];
  }

  if (
    shuffled.join('') === letters.join('') &&
    shuffled.length > 1
  ) {
    [shuffled[0], shuffled[1]] = [
      shuffled[1],
      shuffled[0]
    ];
  }

  return shuffled;
};

// LOCAL DATE HELPERS
const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getPreviousDateKey = (dateKey) => {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return getLocalDateKey(date);
};

// DAILY CLUE WORD DATABASE
const DAILY_WORD_BANK = [
  // ORIGINAL 30 WORDS
  { word: 'BRAIN', clue: 'The organ in your head responsible for thinking, memory and intelligence.' },
  { word: 'CLOUD', clue: 'A white or grey mass in the sky made up of tiny water droplets.' },
  { word: 'PLANT', clue: 'A living thing that usually grows in soil and needs water and sunlight.' },
  { word: 'STONE', clue: 'A small piece of rock that you might find on the ground.' },
  { word: 'LIGHT', clue: 'What allows you to see things around you.' },
  { word: 'DREAM', clue: 'A series of pictures or events that happen in your mind while sleeping.' },
  { word: 'MUSIC', clue: 'Sounds arranged in a way that people enjoy listening to.' },
  { word: 'FLAME', clue: 'The bright, hot part of a fire.' },
  { word: 'BRICK', clue: 'A hard rectangular block used for building walls and houses.' },
  { word: 'SHAPE', clue: 'The form or outline of an object, such as a circle or square.' },
  { word: 'GRAPE', clue: 'A small round fruit that grows in bunches.' },
  { word: 'HOUSE', clue: 'A building where people live.' },
  { word: 'WORLD', clue: 'The Earth and all the people and places on it.' },
  { word: 'SPACE', clue: 'The vast area beyond the Earth where stars and planets exist.' },
  { word: 'NIGHT', clue: 'The period of darkness between sunset and sunrise.' },
  { word: 'FROST', clue: 'A thin layer of ice crystals that forms on cold surfaces.' },
  { word: 'BEACH', clue: 'A sandy or pebbly area beside the sea.' },
  { word: 'TIGER', clue: 'A large wild cat with orange fur and black stripes.' },
  { word: 'LEMON', clue: 'A yellow citrus fruit with a very sour taste.' },
  { word: 'PEARL', clue: 'A smooth, round object formed inside certain shellfish.' },
  { word: 'CROWN', clue: 'A decorative object worn on the head by a king or queen.' },
  { word: 'SMILE', clue: 'The expression on your face when you are happy.' },
  { word: 'BREAD', clue: 'A common food made from flour, water and usually yeast.' },
  { word: 'CRANE', clue: 'A tall machine used to lift and move heavy objects.' },
  { word: 'MOUSE', clue: 'A small animal with a long tail, or a device used with a computer.' },
  { word: 'EARTH', clue: 'The planet on which human beings live.' },
  { word: 'SHELF', clue: 'A flat surface attached to a wall or inside a cupboard for storing things.' },
  { word: 'GHOST', clue: 'A spirit believed by some people to be the appearance of a dead person.' },
  { word: 'QUICK', clue: 'Another word for fast or speedy.' },
  { word: 'ZEBRA', clue: 'An African animal that has black and white stripes.' },

  // ADDITIONAL WORDS
  { word: 'ABOVE', clue: 'In a higher position than something else.' },
  { word: 'ACORN', clue: 'The seed or fruit of an oak tree.' },
  { word: 'ACTOR', clue: 'A person who performs in films or plays.' },
  { word: 'ADMIT', clue: 'To confess or allow someone to enter.' },
  { word: 'ADOPT', clue: 'To legally take another person as your child.' },
  { word: 'AFTER', clue: 'Following something in time or order.' },
  { word: 'AGENT', clue: 'A person who acts on behalf of another.' },
  { word: 'AGILE', clue: 'Able to move quickly and easily.' },
  { word: 'ALBUM', clue: 'A collection of songs or photographs.' },
  { word: 'ALERT', clue: 'Watchful and ready to respond.' },
  { word: 'ALIEN', clue: 'A being from another planet.' },
  { word: 'ALIKE', clue: 'Similar in appearance or nature.' },
  { word: 'ALONG', clue: 'Moving in the same direction as something.' },
  { word: 'ALTER', clue: 'To change something.' },
  { word: 'ANGEL', clue: 'A spiritual being often shown with wings.' },
  { word: 'ANGLE', clue: 'The space between two intersecting lines.' },
  { word: 'ANGER', clue: 'A strong feeling of displeasure.' },
  { word: 'APRON', clue: 'A garment worn to protect clothes while cooking.' },
  { word: 'ASHEN', clue: 'Pale or grey like ash.' },
  { word: 'AUDIO', clue: 'Sound that can be heard or recorded.' },
  { word: 'AVOID', clue: 'To keep away from something.' },
  { word: 'BADGE', clue: 'A small sign showing identity or membership.' },
  { word: 'BAKER', clue: 'A person who makes bread and cakes.' },
  { word: 'BASIC', clue: 'Simple and forming the foundation of something.' },
  { word: 'BASIL', clue: 'A fragrant herb used in cooking.' },
  { word: 'BEARD', clue: "Hair growing on a person's chin and cheeks." },
  { word: 'BEAST', clue: 'A large or dangerous animal.' },
  { word: 'BEGIN', clue: 'To start doing something.' },
  { word: 'BEING', clue: 'A living creature or existence.' },
  { word: 'BELOW', clue: 'In a lower position than something else.' },
  { word: 'BENCH', clue: 'A long seat for several people.' },
  { word: 'BIRTH', clue: 'The process of bringing a baby into the world.' },
  { word: 'BLACK', clue: 'The darkest colour.' },
  { word: 'BLAME', clue: 'To hold someone responsible for a fault.' },
  { word: 'BLANK', clue: 'Empty or containing nothing.' },
  { word: 'BLAST', clue: 'A powerful explosion or sudden burst.' },
  { word: 'BLAZE', clue: 'A large or bright fire.' },
  { word: 'BLEND', clue: 'To mix different things together.' },
  { word: 'BLIND', clue: 'Unable to see.' },
  { word: 'BLINK', clue: 'To close and open the eyes quickly.' },
  { word: 'BOARD', clue: 'A flat piece of wood or a committee.' },
  { word: 'BOAST', clue: 'To speak with excessive pride about oneself.' },
  { word: 'BONUS', clue: 'An extra reward or payment.' },
  { word: 'BOUND', clue: 'Tied or restricted; also a limit.' },
  { word: 'BOWEL', clue: 'A part of the digestive system.' },
  { word: 'BOXER', clue: 'A person who fights in a boxing match.' },
  { word: 'BRAND', clue: 'A name or identity given to a product.' },
  { word: 'BRAVE', clue: 'Showing courage in a difficult situation.' },
  { word: 'BRAWL', clue: 'A noisy physical fight.' },
  { word: 'BREAK', clue: 'To separate into pieces or stop briefly.' },
  { word: 'BRIEF', clue: 'Short in duration or length.' },
  { word: 'BRINE', clue: 'Water containing a large amount of salt.' },
  { word: 'BROAD', clue: 'Wide from side to side.' },
  { word: 'BROKE', clue: 'Having no money; also the past tense of break.' },
  { word: 'BROWN', clue: 'A colour often associated with soil and wood.' },
  { word: 'BRUSH', clue: 'A tool with bristles used for cleaning or painting.' },
  { word: 'BUILD', clue: 'To construct or make something.' },
  { word: 'BUNCH', clue: 'A group of things held or growing together.' },
  { word: 'BURST', clue: 'To break open suddenly.' },
  { word: 'BUYER', clue: 'A person who purchases something.' },
  { word: 'CABIN', clue: 'A small house or room, often in the woods.' },
  { word: 'CABLE', clue: 'A thick wire used to carry electricity or data.' },
  { word: 'CADET', clue: 'A trainee in the military or police.' },
  { word: 'CAMEL', clue: 'A desert animal with one or two humps.' },
  { word: 'CANDY', clue: 'A sweet confection.' },
  { word: 'CARGO', clue: 'Goods carried by a ship, plane or truck.' },
  { word: 'CARVE', clue: 'To cut or shape a material carefully.' },
  { word: 'CAUSE', clue: 'A reason why something happens.' },
  { word: 'CEDAR', clue: 'A type of evergreen tree with fragrant wood.' },
  { word: 'CHAIN', clue: 'A series of connected metal links.' },

  // BATCH 2 — ADDITIONAL DAILY WORDS

  { word: 'CHARM', clue: 'A quality that makes someone or something attractive.' },
  { word: 'CHART', clue: 'A diagram that presents information visually.' },
  { word: 'CHASE', clue: 'To run after someone or something.' },
  { word: 'CHEAP', clue: 'Low in price or costing little money.' },
  { word: 'CHEER', clue: 'A shout of encouragement or happiness.' },
  { word: 'CHEST', clue: 'The front part of the body between the neck and stomach.' },
  { word: 'CHIEF', clue: 'A leader or person in charge of a group.' },
  { word: 'CHILD', clue: 'A young human being.' },
  { word: 'CHIME', clue: 'A clear ringing sound made by a bell.' },
  { word: 'CHOIR', clue: 'A group of people who sing together.' },
  { word: 'CIVIL', clue: 'Relating to citizens or polite behaviour.' },
  { word: 'CLAIM', clue: 'To state that something is true or belongs to you.' },
  { word: 'CLASS', clue: 'A group of students taught together.' },
  { word: 'CLEAN', clue: 'Free from dirt, marks or unwanted substances.' },
  { word: 'CLEAR', clue: 'Easy to understand or free from obstruction.' },
  { word: 'CLERK', clue: 'A person who performs office or record-keeping duties.' },
  { word: 'CLIMB', clue: 'To move upward using your hands and feet.' },
  { word: 'CLOCK', clue: 'A device used to tell the time.' },
  { word: 'CLOSE', clue: 'To shut something or bring it to an end.' },
  { word: 'COACH', clue: 'A person who trains or instructs others.' },
  { word: 'COAST', clue: 'The land beside the sea.' },
  { word: 'COBRA', clue: 'A poisonous snake that can spread its neck into a hood.' },
  { word: 'COLOR', clue: 'The visual quality that distinguishes objects such as red and blue.' },
  { word: 'COMET', clue: 'An icy object in space that may develop a bright tail.' },
  { word: 'CORAL', clue: 'A hard substance formed by tiny sea animals.' },
  { word: 'COUNT', clue: 'To determine the total number of something.' },
  { word: 'COURT', clue: 'A place where legal cases are heard or sports are played.' },
  { word: 'COVER', clue: 'Something placed over another thing for protection.' },
  { word: 'CREEK', clue: 'A small stream of flowing water.' },
  { word: 'CRIME', clue: 'An act that breaks the law.' },
  { word: 'CROSS', clue: 'To move from one side to another.' },
  { word: 'DAILY', clue: 'Happening or done every day.' },
  { word: 'DANCE', clue: 'To move rhythmically to music.' },
  { word: 'DEATH', clue: 'The end of the life of a living organism.' },
  { word: 'DEBUT', clue: "A person's first public appearance or performance." },
  { word: 'DECOR', clue: 'The style and arrangement of a room.' },
  { word: 'DELAY', clue: 'To make something happen later than expected.' },
  { word: 'DEPTH', clue: 'The distance from the top or surface to the bottom.' },
  { word: 'DIARY', clue: 'A book used to record personal daily experiences.' },
  { word: 'DIRTY', clue: 'Covered with dust, mud or other unwanted substances.' },
  { word: 'DOUBT', clue: 'A feeling of uncertainty about something.' },
  { word: 'DOZEN', clue: 'A group or quantity of twelve.' },
  { word: 'DRAIN', clue: 'A pipe or channel that carries away unwanted water.' },
  { word: 'DRAWL', clue: 'To speak slowly with stretched-out vowel sounds.' },
  { word: 'DRIFT', clue: 'To move slowly without a clear direction.' },
  { word: 'DRINK', clue: 'A liquid that people consume.' },
  { word: 'DRIVE', clue: 'To control and operate a vehicle.' },
  { word: 'DROVE', clue: 'Past tense of drive; also a group of animals.' },
  { word: 'EAGER', clue: 'Very interested and excited to do something.' },
  { word: 'EARLY', clue: 'Happening before the expected or usual time.' },
  { word: 'ELBOW', clue: 'The joint connecting the upper and lower arm.' },
  { word: 'ELDER', clue: 'An older or more senior person.' },
  { word: 'ELECT', clue: 'To choose someone through voting.' },
  { word: 'EMPTY', clue: 'Containing nothing inside.' },
  { word: 'ENJOY', clue: 'To take pleasure or satisfaction in something.' },
  { word: 'ENTER', clue: 'To go or come into a place.' },
  { word: 'ENTRY', clue: 'An act of entering or an item recorded in a list.' },
  { word: 'EQUAL', clue: 'Being the same in amount, size or value.' },
  { word: 'ERROR', clue: 'A mistake or something done incorrectly.' },
  { word: 'EVENT', clue: 'Something important that happens.' },
  { word: 'EVERY', clue: 'Each member of a group without exception.' },
  { word: 'EXACT', clue: 'Completely correct or precise.' },
  { word: 'EXIST', clue: 'To be real or present.' },
  { word: 'EXTRA', clue: 'More than what is usual or necessary.' },
  { word: 'FAITH', clue: 'Strong belief or trust in someone or something.' },
  { word: 'FALSE', clue: 'Not true or correct.' },
  { word: 'FAULT', clue: 'A mistake, defect or responsibility for a problem.' },
  { word: 'FEAST', clue: 'A large and special meal.' },
  { word: 'FENCE', clue: 'A barrier built around an area of land.' },
  { word: 'FIELD', clue: 'An open area of land or a particular area of study.' },
  { word: 'FIERY', clue: 'Burning strongly or showing intense emotion.' },

  // BATCH 3 — ADDITIONAL DAILY WORDS

  { word: 'FLAIR', clue: 'A natural ability or special talent for doing something.' },
  { word: 'FLANK', clue: "The side of a person's or animal's body." },
  { word: 'FLASH', clue: 'A sudden bright burst of light.' },
  { word: 'FLEET', clue: 'A group of ships, vehicles or aircraft.' },
  { word: 'FLESH', clue: 'The soft substance that covers the bones of the body.' },
  { word: 'FLOAT', clue: 'To remain on the surface of a liquid without sinking.' },
  { word: 'FLOOD', clue: 'An overflow of water covering normally dry land.' },
  { word: 'FLOUR', clue: 'A powder made by grinding grains, commonly used in baking.' },
  { word: 'FLUID', clue: 'A substance that can flow, such as a liquid or gas.' },
  { word: 'FOCUS', clue: 'The centre of attention or concentration.' },
  { word: 'FORCE', clue: 'Strength or power that can cause movement or change.' },
  { word: 'FORGE', clue: 'To shape metal by heating and hammering it.' },
  { word: 'FORTH', clue: 'Forward or onward in a direction.' },
  { word: 'FOUND', clue: 'Discovered something or established something.' },
  { word: 'FRAME', clue: 'A structure that surrounds or supports something.' },
  { word: 'FRAUD', clue: 'A dishonest act intended to deceive someone.' },
  { word: 'FRESH', clue: 'Recently made, gathered or obtained; not stale.' },
  { word: 'FRONT', clue: 'The part or side that faces forward.' },
  { word: 'FRUIT', clue: 'The part of a plant that usually contains seeds.' },
  { word: 'FULLY', clue: 'Completely or to the greatest possible extent.' },
  { word: 'FUNNY', clue: 'Something that makes people laugh.' },
  { word: 'GIANT', clue: 'An unusually large person or thing.' },
  { word: 'GIVEN', clue: 'Provided or handed over to someone.' },
  { word: 'GLAND', clue: 'An organ that produces and releases substances in the body.' },
  { word: 'GLARE', clue: 'A strong, unpleasant or dazzling light.' },
  { word: 'GLASS', clue: 'A hard, transparent material used to make windows.' },
  { word: 'GLOBE', clue: 'A round model of the Earth.' },
  { word: 'GLOVE', clue: 'A covering worn on the hand.' },
  { word: 'GOING', clue: 'Moving or travelling from one place to another.' },
  { word: 'GRACE', clue: 'Elegance, kindness or courteous behaviour.' },
  { word: 'GRADE', clue: 'A level of quality or a mark given for schoolwork.' },
  { word: 'GRAIN', clue: 'A small hard seed from a cereal plant.' },
  { word: 'GRAND', clue: 'Impressive, magnificent or large in scale.' },
  { word: 'GRANT', clue: 'To give or allow something officially.' },
  { word: 'GRASS', clue: 'A green plant that commonly covers lawns and fields.' },
  { word: 'GREAT', clue: 'Very good, important or impressive.' },
  { word: 'GREEN', clue: 'The colour commonly associated with leaves and grass.' },
  { word: 'GREET', clue: 'To welcome or acknowledge someone.' },
  { word: 'GRIEF', clue: 'Deep sadness, especially after a loss.' },
  { word: 'GRILL', clue: 'A device or surface used for cooking food with direct heat.' },
  { word: 'GROUP', clue: 'A number of people or things considered together.' },
  { word: 'GUARD', clue: 'A person who protects a place or someone.' },
  { word: 'GUESS', clue: 'To give an answer without being certain.' },
  { word: 'GUIDE', clue: 'A person or thing that shows the way.' },
  { word: 'GUILT', clue: 'The feeling of having done something wrong.' },
  { word: 'HABIT', clue: 'Something a person does regularly or repeatedly.' },
  { word: 'HAPPY', clue: 'Feeling pleasure, joy or satisfaction.' },
  { word: 'HARSH', clue: 'Unpleasant, rough or severe.' },
  { word: 'HEART', clue: 'The organ that pumps blood around the body.' },
  { word: 'HEAVY', clue: 'Having a lot of weight.' },
  { word: 'HONEY', clue: 'A sweet substance made by bees.' },
  { word: 'HONOR', clue: 'Great respect or recognition for good actions.' },
  { word: 'HORSE', clue: 'A large animal often ridden by people.' },
  { word: 'HOTEL', clue: 'A building where travellers pay to stay.' },
  { word: 'HUMAN', clue: 'A person belonging to the human species.' },
  { word: 'HUMOR', clue: 'The quality of being amusing or funny.' },
  { word: 'IDEAL', clue: 'The best possible or most suitable example.' },
  { word: 'IMAGE', clue: 'A picture or visual representation of something.' },
  { word: 'INDEX', clue: 'An alphabetical list that helps locate information.' },
  { word: 'INNER', clue: 'Located inside or closer to the centre.' },
  { word: 'INPUT', clue: 'Information or data entered into a system.' },
  { word: 'ISSUE', clue: 'An important subject, problem or matter.' },
  { word: 'IVORY', clue: 'A hard white material traditionally obtained from elephant tusks.' },
  { word: 'JEWEL', clue: 'A precious stone used in decoration or jewellery.' },
  { word: 'JOINT', clue: 'A place where two bones or parts are connected.' },
  { word: 'JUDGE', clue: 'A person who makes decisions in a court of law.' },
  { word: 'JUICE', clue: 'A drink made from fruits or vegetables.' },
  { word: 'KNIFE', clue: 'A tool with a sharp blade used for cutting.' },
  { word: 'KNOCK', clue: 'To strike a door or surface with your hand.' },
  { word: 'KNOWN', clue: 'Recognised or familiar to people.' },

  // BATCH 4 — ADDITIONAL DAILY WORDS

  { word: 'LABEL', clue: 'A piece of information attached to an object or product.' },
  { word: 'LABOR', clue: 'Physical or mental work done to achieve something.' },
  { word: 'LARGE', clue: 'Big in size, amount or extent.' },
  { word: 'LASER', clue: 'A device that produces a narrow, powerful beam of light.' },
  { word: 'LATER', clue: 'At a time after the present or a particular event.' },
  { word: 'LAUGH', clue: 'To make sounds and movements showing amusement.' },
  { word: 'LAYER', clue: 'One thickness or level of material covering another.' },
  { word: 'LEARN', clue: 'To gain knowledge or develop a new skill.' },
  { word: 'LEAST', clue: 'The smallest amount or degree.' },
  { word: 'LEAVE', clue: 'To go away from a place or person.' },
  { word: 'LEGAL', clue: 'Allowed or recognised by the law.' },
  { word: 'LEVEL', clue: 'A particular height, position or degree.' },
  { word: 'LEVER', clue: 'A rigid bar used to lift or move something.' },
  { word: 'LIBRA', clue: 'A zodiac sign represented by a pair of scales.' },
  { word: 'LIMIT', clue: 'The greatest amount or point that is allowed.' },
  { word: 'LINEN', clue: 'A fabric made from the fibres of the flax plant.' },
  { word: 'LIVER', clue: 'An organ that helps process nutrients and remove toxins.' },
  { word: 'LOCAL', clue: 'Relating to a particular nearby area or community.' },
  { word: 'LODGE', clue: 'A small house or building, often in the countryside.' },
  { word: 'LOGIC', clue: 'A way of reasoning based on clear principles.' },
  { word: 'LOOSE', clue: 'Not firmly fixed, fastened or held in place.' },
  { word: 'LOWER', clue: 'To move something to a less high position.' },
  { word: 'LOYAL', clue: 'Showing strong support and faithfulness.' },
  { word: 'LUCKY', clue: 'Having good fortune or favourable outcomes.' },
  { word: 'LUNAR', clue: 'Relating to the Moon.' },
  { word: 'MAGIC', clue: 'The art of creating unusual effects through tricks or supposed supernatural powers.' },
  { word: 'MAJOR', clue: 'Important, serious or greater in size or extent.' },
  { word: 'MAKER', clue: 'A person or company that produces something.' },
  { word: 'MAPLE', clue: 'A tree known for its distinctive leaves and sweet sap.' },
  { word: 'MARCH', clue: 'The third month of the year.' },
  { word: 'MATCH', clue: 'A contest between two people or teams.' },
  { word: 'MAYOR', clue: 'The elected head of a town or city government.' },
  { word: 'MEDAL', clue: 'A small metal award given for achievement.' },
  { word: 'MEDIA', clue: 'The different ways information and news are communicated.' },
  { word: 'MELON', clue: 'A large, juicy fruit with a thick outer skin.' },
  { word: 'MERCY', clue: 'Kindness shown to someone who could be punished.' },
  { word: 'MERIT', clue: 'The quality of being worthy of praise or reward.' },
  { word: 'METAL', clue: 'A hard material such as iron, copper or aluminium.' },
  { word: 'METER', clue: 'A device used to measure something or a unit of length.' },
  { word: 'MICRO', clue: 'A prefix meaning very small.' },
  { word: 'MIGHT', clue: 'Great strength or power; also expresses possibility.' },
  { word: 'MINER', clue: 'A person who works to extract minerals from the ground.' },
  { word: 'MINOR', clue: 'Something smaller, less important or under legal adulthood.' },
  { word: 'MODEL', clue: 'A representation of something or a person who displays clothing.' },
  { word: 'MONEY', clue: 'Something used to buy goods and services.' },
  { word: 'MONTH', clue: 'One of the twelve divisions of a year.' },
  { word: 'MORAL', clue: 'Relating to ideas of right and wrong behaviour.' },
  { word: 'MOTOR', clue: 'A machine that produces movement or power.' },
  { word: 'MOUNT', clue: 'To climb onto something or attach something in place.' },
  { word: 'MOUTH', clue: 'The opening in the face used for eating and speaking.' },
  { word: 'MOVIE', clue: 'A story or performance shown on a screen.' },
  { word: 'NAIVE', clue: 'Lacking experience or showing innocent trust.' },
  { word: 'NAKED', clue: 'Not wearing clothes or without a covering.' },
  { word: 'NAVAL', clue: "Relating to a country's navy or warships." },
  { word: 'NERVE', clue: 'A bundle of fibres that carries signals through the body.' },
  { word: 'NEVER', clue: 'Not at any time.' },
  { word: 'NEWER', clue: 'More recent than something else.' },
  { word: 'NOBLE', clue: 'Having high moral qualities or belonging to a high social rank.' },
  { word: 'NOISE', clue: 'A sound, especially one that is loud or unwanted.' },
  { word: 'NORTH', clue: 'The direction opposite to south.' },
  { word: 'NOVEL', clue: 'A long fictional story written in book form.' },
  { word: 'NURSE', clue: 'A trained person who cares for sick or injured people.' },
  { word: 'OCCUR', clue: 'To happen or take place.' },
  { word: 'OCEAN', clue: 'A very large body of salt water.' },
  { word: 'OFFER', clue: 'To present something for someone to accept or reject.' },
  { word: 'OFTEN', clue: 'Many times or frequently.' },
  { word: 'OLIVE', clue: 'A small fruit often used to produce cooking oil.' },
  { word: 'OPERA', clue: 'A stage performance in which much of the story is sung.' },
  { word: 'ORBIT', clue: 'The curved path followed by an object around another object in space.' },
  { word: 'ORDER', clue: 'An arrangement, instruction or request for something.' },
  { word: 'OTHER', clue: 'Different from the one already mentioned.' },
  { word: 'OUTER', clue: 'Situated on the outside or farther from the centre.' },
  { word: 'OWNER', clue: 'A person who possesses something.' },
  
  // BATCH 5 — ADDITIONAL DAILY WORDS

  { word: 'PAINT', clue: 'A coloured liquid used to decorate or protect surfaces.' },
  { word: 'PANEL', clue: 'A flat section forming part of a wall, door or machine.' },
  { word: 'PAPER', clue: 'A thin material used for writing, printing and drawing.' },
  { word: 'PARTY', clue: 'A social gathering where people celebrate or have fun.' },
  { word: 'PAUSE', clue: 'A short break or temporary stop.' },
  { word: 'PEACE', clue: 'A state of calm without war or conflict.' },
  { word: 'PENAL', clue: 'Relating to punishment for breaking the law.' },
  { word: 'PENCE', clue: 'Plural of penny, a unit of British currency.' },
  { word: 'PENNY', clue: 'A small unit of money in several currencies.' },
  { word: 'PETAL', clue: 'One of the coloured parts of a flower.' },
  { word: 'PHASE', clue: 'A particular stage in a process or development.' },
  { word: 'PHONE', clue: 'A device used to communicate with another person.' },
  { word: 'PHOTO', clue: 'An image taken using a camera.' },
  { word: 'PIANO', clue: 'A musical instrument played using a keyboard.' },
  { word: 'PIECE', clue: 'A part or portion of something.' },
  { word: 'PILOT', clue: 'A person trained to operate an aircraft.' },
  { word: 'PINCH', clue: 'To squeeze something between a finger and thumb.' },
  { word: 'PITCH', clue: 'The highness or lowness of a sound; also a playing field.' },
  { word: 'PIXEL', clue: 'The smallest individual unit of a digital image.' },
  { word: 'PLACE', clue: 'A particular area, location or position.' },
  { word: 'PLAIN', clue: 'Simple or without decoration; also a large flat area of land.' },
  { word: 'PLANE', clue: 'An aircraft that flies through the air.' },
  { word: 'PLATE', clue: 'A flat dish used for serving food.' },
  { word: 'PLAZA', clue: 'An open public square or shopping area.' },
  { word: 'PLEAD', clue: 'To make an emotional or serious request.' },
  { word: 'PLEAT', clue: 'A fold of fabric made by doubling material over itself.' },
  { word: 'PLUCK', clue: 'To pull something quickly or show courage.' },
  { word: 'PLUMB', clue: 'To measure depth or check whether something is vertical.' },
  { word: 'PLUME', clue: 'A large or decorative feather.' },
  { word: 'PLUMP', clue: 'Having a pleasantly rounded or full shape.' },
  { word: 'POINT', clue: 'A particular position, place or idea.' },
  { word: 'POLAR', clue: 'Relating to the North or South Pole.' },
  { word: 'POUND', clue: 'A unit of weight or the name of several currencies.' },
  { word: 'POWER', clue: 'The ability or strength to do something.' },
  { word: 'PRESS', clue: 'To push something firmly or apply pressure.' },
  { word: 'PRICE', clue: 'The amount of money required to buy something.' },
  { word: 'PRIDE', clue: 'A feeling of satisfaction about an achievement or quality.' },
  { word: 'PRIME', clue: 'The most important or best stage of something.' },
  { word: 'PRINT', clue: 'To produce text or images on paper.' },
  { word: 'PRIOR', clue: 'Existing or happening before something else.' },
  { word: 'PRIZE', clue: 'An award given for winning or achieving something.' },
  { word: 'PROBE', clue: 'An investigation or a tool used to examine something.' },
  { word: 'PROOF', clue: 'Evidence that shows something is true.' },
  { word: 'PROUD', clue: 'Feeling pleased about an achievement or quality.' },
  { word: 'PROVE', clue: 'To show that something is true.' },
  { word: 'PROXY', clue: 'A person or system authorised to act for another.' },
  { word: 'PULSE', clue: 'The regular beating of the heart.' },
  { word: 'PUPIL', clue: 'A student or the dark opening in the centre of the eye.' },
  { word: 'PURSE', clue: 'A small bag used for carrying money.' },
  { word: 'QUEEN', clue: 'A female ruler of a kingdom or the wife of a king.' },
  { word: 'QUERY', clue: 'A question or request for information.' },
  { word: 'QUEST', clue: 'A long search for something important.' },
  { word: 'QUOTA', clue: 'A fixed amount or number that must be reached.' },
  { word: 'QUOTE', clue: 'To repeat the exact words spoken or written by someone.' },
  { word: 'RADAR', clue: 'A system that uses radio waves to detect objects.' },
  { word: 'RADIO', clue: 'A device or system used to receive audio broadcasts.' },
  { word: 'RAISE', clue: 'To lift something or increase its amount.' },
  { word: 'RALLY', clue: 'A large public meeting or a renewed effort.' },
  { word: 'RANGE', clue: 'A variety of things or the distance between limits.' },
  { word: 'RAPID', clue: 'Happening very quickly.' },
  { word: 'RATIO', clue: 'A comparison between two quantities.' },
  { word: 'REACH', clue: 'To arrive at or stretch towards something.' },
  { word: 'REACT', clue: 'To respond to an action or situation.' },
  { word: 'READY', clue: 'Prepared for something to happen.' },
  { word: 'REALM', clue: 'An area of activity, knowledge or interest.' },
  { word: 'REBEL', clue: 'A person who resists authority or established rules.' },
  { word: 'REFER', clue: 'To direct someone to another person or source.' },
  { word: 'REIGN', clue: 'The period during which a king or queen rules.' },
  { word: 'RELAX', clue: 'To rest and become less worried or tense.' },
  { word: 'REPLY', clue: 'An answer given to a question or message.' },
  { word: 'RIDER', clue: 'A person who travels on a bicycle, horse or motorcycle.' },

  // BATCH 6 — ADDITIONAL DAILY WORDS

  { word: 'RIFLE', clue: 'A long firearm with a barrel designed to make bullets spin.' },
  { word: 'RIGHT', clue: 'The direction opposite to left; also means correct.' },
  { word: 'RINSE', clue: 'To wash something lightly with clean water.' },
  { word: 'RISKY', clue: 'Involving the possibility of danger or loss.' },
  { word: 'RIVAL', clue: 'A person or group competing against another.' },
  { word: 'RIVER', clue: 'A large natural stream of flowing water.' },
  { word: 'ROAST', clue: 'To cook food using dry heat, usually in an oven.' },
  { word: 'ROBOT', clue: 'A machine that can perform tasks automatically.' },
  { word: 'ROCKY', clue: 'Covered with rocks or full of difficulties.' },
  { word: 'ROGUE', clue: 'A dishonest or unpredictable person.' },
  { word: 'ROMAN', clue: 'A person from ancient Rome or modern Rome.' },
  { word: 'ROUGH', clue: 'Having an uneven surface or lacking smoothness.' },
  { word: 'ROUND', clue: 'Shaped like a circle or sphere.' },
  { word: 'ROUTE', clue: 'A way or path used to reach a destination.' },
  { word: 'ROYAL', clue: 'Relating to a king, queen or royal family.' },
  { word: 'RULER', clue: 'A person who governs or a tool used to measure length.' },
  { word: 'RURAL', clue: 'Relating to the countryside rather than a city.' },
  { word: 'SAINT', clue: 'A person recognised for exceptional holiness or goodness.' },
  { word: 'SALAD', clue: 'A dish usually made from raw vegetables.' },
  { word: 'SALON', clue: 'A business where people receive beauty or hair treatments.' },
  { word: 'SALTY', clue: 'Tasting strongly of salt.' },
  { word: 'SANDY', clue: 'Covered with or containing a lot of sand.' },
  { word: 'SAUCE', clue: 'A liquid or semi-liquid mixture served with food.' },
  { word: 'SCALE', clue: 'A device for weighing or a system of measurement.' },
  { word: 'SCARE', clue: 'To make someone feel afraid.' },
  { word: 'SCENE', clue: 'A place where an event happens or part of a film.' },
  { word: 'SCENT', clue: 'A smell, especially a pleasant one.' },
  { word: 'SCOPE', clue: 'The range or extent of something.' },
  { word: 'SCORE', clue: 'The number of points achieved in a game or test.' },
  { word: 'SCOUT', clue: 'A person sent to gather information or explore an area.' },
  { word: 'SCRAP', clue: 'A small leftover piece of material.' },
  { word: 'SEIZE', clue: 'To take hold of something suddenly or forcefully.' },
  { word: 'SENSE', clue: 'A way of experiencing the world, such as sight or hearing.' },
  { word: 'SERVE', clue: 'To provide food, help or assistance to someone.' },
  { word: 'SEVEN', clue: 'The number that comes after six.' },
  { word: 'SEWER', clue: 'An underground pipe that carries wastewater.' },
  { word: 'SHADE', clue: 'An area protected from direct sunlight.' },
  { word: 'SHAKE', clue: 'To move something quickly back and forth.' },
  { word: 'SHAME', clue: 'A painful feeling caused by wrongdoing or embarrassment.' },
  { word: 'SHARE', clue: 'To give part of something to another person.' },
  { word: 'SHARK', clue: 'A large sea fish with sharp teeth.' },
  { word: 'SHARP', clue: 'Having an edge or point that can cut easily.' },
  { word: 'SHAVE', clue: 'To remove hair using a razor or similar tool.' },
  { word: 'SHEAR', clue: 'To cut wool or hair from an animal.' },
  { word: 'SHEEP', clue: 'A farm animal raised for its wool and meat.' },
  { word: 'SHEET', clue: 'A large piece of cloth used on a bed.' },
  { word: 'SHEER', clue: 'Very steep, or complete and absolute.' },
  { word: 'SHELL', clue: 'A hard outer covering of an animal or object.' },
  { word: 'SHIFT', clue: 'To move something or change position.' },
  { word: 'SHINE', clue: 'To give out or reflect light.' },
  { word: 'SHIRT', clue: 'A piece of clothing worn on the upper body.' },
  { word: 'SHOCK', clue: 'A sudden feeling of surprise or distress.' },
  { word: 'SHORE', clue: 'The land along the edge of a sea, lake or river.' },
  { word: 'SHORT', clue: 'Having little length, height or duration.' },
  { word: 'SHOUT', clue: 'To speak or call in a very loud voice.' },
  { word: 'SIGHT', clue: 'The ability to see or something that can be seen.' },
  { word: 'SILKY', clue: 'Soft and smooth like silk.' },
  { word: 'SINCE', clue: 'From a particular time in the past until now.' },
  { word: 'SKILL', clue: 'The ability to do something well.' },
  { word: 'SKIRT', clue: 'A piece of clothing that hangs from the waist.' },
  { word: 'SLAVE', clue: 'A person forced to work without freedom.' },
  { word: 'SLEEP', clue: 'The natural resting state of the body and mind.' },
  { word: 'SLICE', clue: 'A thin, flat piece cut from something.' },
  { word: 'SLIDE', clue: 'To move smoothly along a surface.' },
  { word: 'SLOPE', clue: 'A surface that rises or falls at an angle.' },
  { word: 'SMALL', clue: 'Limited in size, amount or importance.' },
  { word: 'SMART', clue: 'Showing intelligence or good judgement.' },
  { word: 'SMELL', clue: 'The ability to notice an odour.' },
  { word: 'SMOKE', clue: 'A cloud of gas and tiny particles produced by burning.' },
  { word: 'SOLAR', clue: 'Relating to the Sun.' },

  // BATCH 7 — SIX-LETTER WORDS

  { word: 'ANIMAL', clue: 'A living creature that can move and respond to its surroundings.' },
  { word: 'ARTIST', clue: 'A person who creates paintings, drawings or other works of art.' },
  { word: 'BASKET', clue: 'A container used for carrying or storing items.' },
  { word: 'CAMERA', clue: 'A device used to take photographs or record videos.' },
  { word: 'DANGER', clue: 'The possibility of harm, injury or loss.' },
  { word: 'DESERT', clue: 'A dry region that receives very little rainfall.' },
  { word: 'DINNER', clue: 'The main meal usually eaten in the evening.' },
  { word: 'DOCTOR', clue: 'A trained medical professional who treats sick people.' },
  { word: 'DOLLAR', clue: 'A unit of money used in the United States and other countries.' },
  { word: 'ENGINE', clue: 'A machine that produces power to operate a vehicle or equipment.' },
  { word: 'FARMER', clue: 'A person who grows crops or raises animals.' },
  { word: 'FINGER', clue: 'One of the five digits on a human hand.' },
  { word: 'FLOWER', clue: 'The colourful part of a plant that produces seeds.' },
  { word: 'FRIEND', clue: 'A person you know well and trust.' },
  { word: 'FUTURE', clue: 'The time that is yet to come.' },
  { word: 'GARDEN', clue: 'An area where flowers, vegetables or other plants are grown.' },
  { word: 'GOLDEN', clue: 'Having the colour or appearance of gold.' },
  { word: 'HAMMER', clue: 'A tool with a heavy head used for driving nails.' },
  { word: 'ISLAND', clue: 'A piece of land completely surrounded by water.' },
  { word: 'KITTEN', clue: 'A young cat.' },
  { word: 'LETTER', clue: 'A written message sent to someone or a character in an alphabet.' },
  { word: 'MARKET', clue: 'A place where people buy and sell goods.' },
  { word: 'MARBLE', clue: 'A hard type of stone or a small glass ball used in games.' },
  { word: 'MONKEY', clue: 'An animal known for climbing trees and having a long tail.' },
  { word: 'ORANGE', clue: 'A round citrus fruit with a sweet or sour taste.' },
  { word: 'PARROT', clue: 'A colourful bird known for its ability to imitate sounds.' },
  { word: 'POTATO', clue: 'A starchy vegetable that grows underground.' },
  { word: 'PURPLE', clue: 'A colour made by combining red and blue.' },
  { word: 'RABBIT', clue: 'A small furry animal with long ears and powerful hind legs.' },
  { word: 'SCREEN', clue: 'A surface on which images or information are displayed.' },
  { word: 'SECRET', clue: 'Something kept hidden from other people.' },
  { word: 'SHADOW', clue: 'A dark shape formed when an object blocks light.' },
  { word: 'SIGNAL', clue: 'A sign, sound or message used to communicate information.' },
  { word: 'SILVER', clue: 'A shiny precious metal with a grey-white appearance.' },
  { word: 'SINGER', clue: 'A person who performs songs using their voice.' },
  { word: 'SPIRIT', clue: 'The non-physical part of a person or a strong feeling of enthusiasm.' },
  { word: 'SPRING', clue: 'The season between winter and summer.' },
  { word: 'STABLE', clue: 'A building where horses are kept or something firmly balanced.' },
  { word: 'STREAM', clue: 'A small, narrow flow of water.' },
  { word: 'STRONG', clue: 'Having great physical power or force.' },
  { word: 'SUMMER', clue: 'The warmest season of the year in many regions.' },
  { word: 'TABLET', clue: 'A portable touchscreen computer.' },
  { word: 'TARGET', clue: 'An object or goal that someone aims to reach.' },
  { word: 'TEMPLE', clue: 'A building used for religious worship.' },
  { word: 'THREAD', clue: 'A thin strand of cotton or other material used for sewing.' },
  { word: 'THRONE', clue: 'A special chair occupied by a king or queen.' },
  { word: 'TICKET', clue: 'A document that allows someone to enter or travel.' },
  { word: 'TOMATO', clue: 'A juicy red fruit commonly used as a vegetable in cooking.' },
  { word: 'TRAVEL', clue: 'To go from one place to another.' },
  { word: 'TURTLE', clue: 'A reptile with a hard protective shell.' },
  { word: 'WINDOW', clue: 'An opening in a wall fitted with glass to let in light.' },
  { word: 'WINTER', clue: 'The coldest season of the year in many regions.' },
  { word: 'YELLOW', clue: 'A bright colour commonly associated with sunshine.' },
  { word: 'ABSENT', clue: 'Not present in a particular place or situation.' },
{ word: 'ACCEPT', clue: 'To agree to receive or take something.' },
{ word: 'ACCESS', clue: 'The ability or right to enter or use something.' },
{ word: 'ACHING', clue: 'Experiencing a continuous, dull pain.' },
{ word: 'ACTIVE', clue: 'Engaged in movement or energetic activity.' },
{ word: 'ADMIRE', clue: 'To respect or appreciate someone or something.' },
{ word: 'ADVICE', clue: 'A suggestion about what someone should do.' },
{ word: 'AFFAIR', clue: 'An event, matter, or situation.' },
{ word: 'AFFORD', clue: 'To have enough money or resources for something.' },
{ word: 'AFRAID', clue: 'Feeling fear or worry.' },
{ word: 'AGENCY', clue: 'An organization that provides a particular service.' },
{ word: 'AGENDA', clue: 'A list of matters to be discussed or completed.' },
{ word: 'AGREED', clue: 'Having reached the same opinion or decision.' },
{ word: 'ALMOST', clue: 'Very nearly, but not completely.' },
{ word: 'ALWAYS', clue: 'At all times or on every occasion.' },
{ word: 'AMOUNT', clue: 'A quantity or total of something.' },
{ word: 'ANCIENT', clue: 'Belonging to a very distant past.' },
{ word: 'ANNOY', clue: 'To make someone slightly angry or irritated.' },
{ word: 'ANNUAL', clue: 'Happening once every year.' },
{ word: 'ANSWER', clue: 'A reply to a question.' },
{ word: 'ANYONE', clue: 'Any person at all.' },
{ word: 'APPEAL', clue: 'A serious request or an attractive quality.' },
{ word: 'APPEAR', clue: 'To become visible or seem to be something.' },
{ word: 'APPLES', clue: 'Round fruits that may be red, green, or yellow.' },
{ word: 'ARRIVE', clue: 'To reach a destination.' },
{ word: 'ARTERY', clue: 'A blood vessel that carries blood away from the heart.' },
{ word: 'ASLEEP', clue: 'In a state of sleeping.' },
{ word: 'ATTACK', clue: 'To use force against someone or something.' },
{ word: 'AUTHOR', clue: 'A person who writes books or other written works.' },
{ word: 'AUTUMN', clue: 'The season between summer and winter.' },
{ word: 'BACKUP', clue: 'A spare copy or extra support.' },
{ word: 'BALLET', clue: 'A formal style of dance performed with music.' },
{ word: 'BANANA', clue: 'A long, curved fruit with a yellow peel.' },
{ word: 'BARREL', clue: 'A large round container used for storing liquids or goods.' },
{ word: 'BEAUTY', clue: 'The quality of being pleasing to the senses.' },
{ word: 'BEHAVE', clue: 'To act or conduct oneself in a particular way.' },
{ word: 'BELONG', clue: 'To be the property of someone or be part of a group.' },
{ word: 'BESIDE', clue: 'At the side of or next to something.' },
{ word: 'BETTER', clue: 'Of a higher quality or more suitable.' },
{ word: 'BISHOP', clue: 'A senior leader in some Christian churches.' },
{ word: 'BLAZER', clue: 'A smart jacket often worn as part of an outfit.' },
{ word: 'BORDER', clue: 'A line separating two areas or countries.' },
{ word: 'BOTTLE', clue: 'A container, usually with a narrow neck, for holding liquids.' },
{ word: 'BRANCH', clue: 'A part of a tree growing out from its trunk.' },
{ word: 'BREATH', clue: 'The air taken into or released from the lungs.' },
{ word: 'BRIDGE', clue: 'A structure built to cross over a river or road.' },
{ word: 'BROKER', clue: 'A person who arranges deals between buyers and sellers.' },
{ word: 'BUBBLE', clue: 'A thin ball of air trapped in liquid or soap.' },
{ word: 'BUCKET', clue: 'A round container with a handle, used for carrying liquids.' },
{ word: 'BUTTON', clue: 'A small fastener used to close clothing.' },
{ word: 'CANDLE', clue: 'A stick of wax with a wick that produces light when lit.' },
{ word: 'CANVAS', clue: 'A strong cloth used for painting or making bags.' },
{ word: 'CARPET', clue: 'A thick fabric covering used on floors.' },
{ word: 'CASTLE', clue: 'A large fortified building where royalty or nobles once lived.' },
{ word: 'CASUAL', clue: 'Relaxed and not formal.' },
{ word: 'CAUGHT', clue: 'Captured or stopped someone or something.' },
{ word: 'CENTER', clue: 'The middle point of something.' },
{ word: 'CHANCE', clue: 'An opportunity or possibility that something may happen.' },
{ word: 'CHANGE', clue: 'To make or become different.' },
{ word: 'CHARGE', clue: 'To ask for payment or demand responsibility.' },
{ word: 'CHEESE', clue: 'A food made from milk.' },
{ word: 'CHOICE', clue: 'The act of selecting between possibilities.' },
{ word: 'CHOOSE', clue: 'To select one option from several.' },
{ word: 'CHURCH', clue: 'A building where Christians gather for worship.' },
{ word: 'CIRCLE', clue: 'A round shape with no corners.' },
{ word: 'CLIENT', clue: 'A person or organization receiving a professional service.' },
{ word: 'COFFEE', clue: 'A popular drink made from roasted beans.' },
{ word: 'COMMON', clue: 'Happening often or shared by many people.' },
{ word: 'CORNER', clue: 'The point where two edges or sides meet.' },
{ word: 'COTTON', clue: 'A soft natural fibre used to make clothing and fabric.' },
{ word: 'CRISIS', clue: 'A time of serious difficulty or danger.' },
{ word: 'CUSTOM', clue: 'A traditional way of behaving that is followed by a group.' },
{ word: 'DAMAGE', clue: 'Physical harm that makes something less useful or valuable.' },
{ word: 'DECADE', clue: 'A period of ten years.' },
{ word: 'DECENT', clue: 'Acceptable, proper, or good enough.' },
{ word: 'DECIDE', clue: 'To make a choice after considering the options.' },
{ word: 'DEFEAT', clue: 'To win against someone in a contest or battle.' },
{ word: 'DEFINE', clue: 'To explain the meaning of a word or idea.' },
{ word: 'DEGREE', clue: 'A unit of measurement or an academic qualification.' },
{ word: 'DEMAND', clue: 'A strong request for something to be provided.' },
{ word: 'DENIAL', clue: 'A statement that something is not true.' },
{ word: 'DENTAL', clue: 'Relating to the teeth.' },
{ word: 'DEPART', clue: 'To leave a place.' },
{ word: 'DEPEND', clue: 'To rely on someone or something.' },
{ word: 'DESIRE', clue: 'A strong feeling of wanting something.' },
{ word: 'DETAIL', clue: 'A small individual part of a larger subject.' },
{ word: 'DEVICE', clue: 'A tool or piece of equipment made for a purpose.' },
{ word: 'DIFFER', clue: 'To be unlike or not the same.' },
{ word: 'DINING', clue: 'The activity of eating a meal.' },
{ word: 'DIRECT', clue: 'To guide, manage, or control something.' },
{ word: 'DIVIDE', clue: 'To separate something into parts.' },
{ word: 'DOMAIN', clue: 'An area of knowledge, activity, or control.' },
{ word: 'DOUBLE', clue: 'Twice as much or having two parts.' },
{ word: 'DRAGON', clue: 'A mythical creature often shown as a large fire-breathing reptile.' },
{ word: 'DURING', clue: 'Throughout the course of a particular period.' },
{ word: 'EASILY', clue: 'Without difficulty or much effort.' },
{ word: 'EDITOR', clue: 'A person who prepares written material for publication.' },
{ word: 'EFFECT', clue: 'A result produced by an action or event.' },
{ word: 'EFFORT', clue: 'The physical or mental energy used to do something.' },
{ word: 'EITHER', clue: 'One or the other of two possibilities.' },
{ word: 'ELEVEN', clue: 'The number that comes after ten.' },
{ word: 'EMPIRE', clue: 'A group of territories ruled by one authority.' },
{ word: 'ENABLE', clue: 'To make it possible for someone to do something.' },
{ word: 'ENERGY', clue: 'The power needed to do work or produce movement.' },
{ word: 'ENGAGE', clue: 'To take part in an activity or conversation.' },
{ word: 'ESCAPE', clue: 'To get away from a place or dangerous situation.' },
{ word: 'ESTATE', clue: "A large area of land or a person's property." },
{ word: 'ETHICS', clue: 'Moral principles that guide behaviour.' },
{ word: 'EXCEED', clue: 'To go beyond a limit or expected amount.' },
{ word: 'EXCEPT', clue: 'Not including a particular person or thing.' },
{ word: 'EXCUSE', clue: 'A reason given to explain a mistake or absence.' },
{ word: 'EXPAND', clue: 'To become larger or increase in size.' },
{ word: 'EXPECT', clue: 'To believe that something will happen.' },
{ word: 'EXPERT', clue: 'A person with great knowledge or skill in a subject.' },
{ word: 'EXPORT', clue: 'To send goods to another country for sale.' },
{ word: 'FABRIC', clue: 'Cloth produced by weaving or knitting fibres.' },
{ word: 'FACTOR', clue: 'One of the things that influences a result.' },
{ word: 'FACING', clue: 'Positioned towards something or dealing with a situation.' },
{ word: 'FAIRLY', clue: 'In a reasonable, just, or moderately good way.' },
{ word: 'FAMILY', clue: 'A group of people related by birth, marriage, or adoption.' },
{ word: 'FAMOUS', clue: 'Known by many people.' },
{ word: 'FATHER', clue: 'A male parent.' },
{ word: 'FELLOW', clue: 'A person who shares a particular activity or condition.' },
{ word: 'FEMALE', clue: 'Belonging to the sex that can produce eggs or bear young.' },
{ word: 'FIGURE', clue: "A number, shape, or person's form." },
{ word: 'FINISH', clue: 'To bring something to an end.' },
{ word: 'FLIGHT', clue: 'A journey made through the air.' },
{ word: 'FOLLOW', clue: 'To go after someone or come next in order.' },
{ word: 'FOREST', clue: 'A large area covered mainly with trees.' },
{ word: 'FORMAL', clue: 'Following established rules or official standards.' },
{ word: 'FORMAT', clue: 'The arrangement or structure of information.' },
{ word: 'FORMER', clue: 'Having held a position or status in the past.' },
{ word: 'FOSSIL', clue: 'The preserved remains or traces of ancient life.' },
{ word: 'FOSTER', clue: 'To encourage the growth or development of something.' },
{ word: 'FREELY', clue: 'Without restriction, payment, or control.' },
{ word: 'FRENCH', clue: 'Relating to France or its language and people.' },
{ word: 'FROZEN', clue: 'Turned into ice or made extremely cold.' },
{ word: 'GENDER', clue: 'A social or personal classification related to identity.' },
{ word: 'GENIUS', clue: 'Exceptional intelligence or creative ability.' },
{ word: 'GENTLE', clue: 'Kind, calm, and careful in manner.' },
{ word: 'GLOBAL', clue: 'Relating to the whole world.' },
{ word: 'GROWTH', clue: 'An increase in size, amount, or development.' },
{ word: 'GUITAR', clue: 'A musical instrument with strings that is played by plucking or strumming.' },
{ word: 'HANDLE', clue: 'The part of an object designed to be held or gripped.' },
{ word: 'HAPPEN', clue: 'To take place or occur.' },
{ word: 'HARBOR', clue: 'A sheltered place where ships can stay safely.' },
{ word: 'HEALTH', clue: 'The condition of the body and mind.' },
{ word: 'HEIGHT', clue: 'The measurement of how tall something is.' },
{ word: 'HIDDEN', clue: 'Kept out of sight or difficult to find.' },
{ word: 'HONEST', clue: 'Truthful and free from deception.' },
{ word: 'HUNGER', clue: 'The physical need or desire for food.' },
{ word: 'HUNTER', clue: 'A person or animal that searches for and catches prey.' },
{ word: 'IGNORE', clue: 'To deliberately pay no attention to something.' },
{ word: 'IMPACT', clue: 'A strong effect or influence caused by something.' },
{ word: 'IMPORT', clue: 'To bring goods into a country from another country.' },
{ word: 'INCOME', clue: 'Money received from work, business, or investments.' },
{ word: 'INDEED', clue: 'Used to emphasize that something is true.' },
{ word: 'INFORM', clue: 'To give someone facts or details about something.' },
{ word: 'INSECT', clue: 'A small animal with six legs and usually three body sections.' },
{ word: 'INSIDE', clue: 'The inner part or area of something.' },
{ word: 'INTEND', clue: 'To have a plan or purpose to do something.' },
{ word: 'INVEST', clue: 'To put money or resources into something for future benefit.' },
{ word: 'ISOLATE', clue: 'To separate someone or something from others.' },
{ word: 'JACKET', clue: 'A short coat worn on the upper part of the body.' },
{ word: 'JUNGLE', clue: 'A thick tropical forest with dense vegetation.' },
{ word: 'KIDNEY', clue: 'An organ that filters waste from the blood.' },
{ word: 'LADDER', clue: 'A structure with steps used for climbing.' },
{ word: 'LAUNCH', clue: 'To start or send something into operation.' },
{ word: 'LAWYER', clue: 'A professional who advises and represents people on legal matters.' },
{ word: 'LEADER', clue: 'A person who guides or directs a group.' },
{ word: 'LENGTH', clue: 'The measurement of how long something is.' },
{ word: 'LITTLE', clue: 'Small in size or amount.' },
{ word: 'LIVING', clue: 'Being alive or earning money to support oneself.' },
{ word: 'LOCKER', clue: 'A small storage compartment that can be locked.' },
{ word: 'MARINE', clue: 'Relating to the sea or ocean.' },
{ word: 'MASTER', clue: 'A person highly skilled in a particular activity.' },
{ word: 'MATTER', clue: 'Physical substance or a subject being discussed.' },
{ word: 'MEMBER', clue: 'A person who belongs to a group or organization.' },
{ word: 'MEMORY', clue: 'The ability to store and recall information.' },
{ word: 'MENTAL', clue: 'Relating to the mind or thinking.' },
{ word: 'METHOD', clue: 'A particular way of doing something.' },
{ word: 'MIDDLE', clue: 'The central point or part of something.' },
{ word: 'MILLER', clue: 'A person who operates a machine that grinds grain into flour.' },
{ word: 'MINUTE', clue: 'A unit of time equal to sixty seconds.' },
{ word: 'MIRROR', clue: 'A smooth surface that reflects an image.' },
{ word: 'MOBILE', clue: 'Able to move or be moved easily.' },
{ word: 'MODERN', clue: 'Relating to the present time rather than the past.' },
{ word: 'MODULE', clue: 'A separate unit that forms part of a larger system.' },
{ word: 'MURDER', clue: 'The unlawful killing of another person.' },
{ word: 'MUSEUM', clue: 'A place where historical, artistic, or scientific objects are displayed.' },
{ word: 'MYSTIC', clue: 'A person who seeks spiritual or hidden truths.' },
{ word: 'NARROW', clue: 'Having a small distance from one side to the other.' },
{ word: 'NATION', clue: 'A country with its own people and government.' },
{ word: 'NATIVE', clue: 'A person or thing originally belonging to a particular place.' },
{ word: 'NATURE', clue: 'The physical world, including plants, animals, and landscapes.' },
{ word: 'NORMAL', clue: 'Usual, expected, or not unusual.' },
{ word: 'NOTICE', clue: 'To become aware of something or a formal announcement.' },
{ word: 'NUMBER', clue: 'A mathematical value used for counting or measuring.' },
{ word: 'OBJECT', clue: 'A physical thing that can be seen or touched.' },
{ word: 'OBTAIN', clue: 'To get or acquire something.' },
{ word: 'OFFICE', clue: 'A place where people carry out professional or administrative work.' },
{ word: 'ONLINE', clue: 'Connected to or available through the internet.' },
{ word: 'OPTION', clue: 'One choice available among several possibilities.' },
{ word: 'ORIGIN', clue: 'The point or place where something begins.' },
{ word: 'OUTPUT', clue: 'Something produced by a person, machine, or system.' },
{ word: 'PALACE', clue: 'A large and impressive residence, often used by royalty.' },
{ word: 'PARENT', clue: 'A mother or father.' },
{ word: 'PEOPLE', clue: 'Human beings considered as a group.' },
{ word: 'PERIOD', clue: 'A length or division of time.' },
{ word: 'PERSON', clue: 'An individual human being.' },
{ word: 'PLANET', clue: 'A large celestial body that orbits a star.' },
{ word: 'POETRY', clue: 'Literary writing that uses rhythm, imagery, and expressive language.' },
{ word: 'POLICE', clue: 'An organization responsible for enforcing the law.' },
{ word: 'PASSAGE', clue: 'A route or way through or between places.' },
{ word: 'PASSION', clue: 'A very strong feeling of enthusiasm or love.' },
{ word: 'PATENT', clue: 'An official right protecting an invention.' },
{ word: 'PATROL', clue: 'To move around an area to keep it safe.' },
{ word: 'PEANUT', clue: 'A small edible seed that grows underground.' },
{ word: 'PEPPER', clue: 'A spice or vegetable that can have a hot taste.' },
{ word: 'PERMIT', clue: 'An official document giving permission.' },
{ word: 'PICKUP', clue: 'The act of collecting someone or something.' },
{ word: 'PICTURE', clue: 'An image or photograph of someone or something.' },
{ word: 'PLAYER', clue: 'A person who takes part in a game or sport.' },
{ word: 'PLEASE', clue: 'A polite word used when making a request.' },
{ word: 'PLENTY', clue: 'A large or more than sufficient amount.' },
{ word: 'POCKET', clue: 'A small sewn compartment in clothing.' },
{ word: 'POETIC', clue: 'Relating to poetry or having its expressive qualities.' },
{ word: 'POISON', clue: 'A substance that can cause illness or death.' },
{ word: 'POLICY', clue: 'A set of rules or principles used to guide decisions.' },
{ word: 'POSTER', clue: 'A large printed notice or picture displayed on a wall.' },
{ word: 'POTENT', clue: 'Having great strength, power, or effect.' },
{ word: 'PRAISE', clue: 'Words expressing approval or admiration.' },
{ word: 'PRAYER', clue: 'Words spoken to God as an act of worship or request.' },
{ word: 'PREACH', clue: 'To deliver a religious message or sermon.' },
{ word: 'PRETTY', clue: 'Attractive or pleasing in appearance.' },
{ word: 'PRIEST', clue: 'A religious leader authorized to perform sacred duties.' },
{ word: 'PRISON', clue: 'A place where people are kept as punishment for crimes.' },
{ word: 'PROFIT', clue: 'Money gained after costs have been deducted.' },
{ word: 'PROPER', clue: 'Correct, suitable, or appropriate.' },
{ word: 'PUBLIC', clue: 'Relating to or available to everyone.' },
{ word: 'PUMPKIN', clue: 'A large orange fruit often used in cooking.' },
{ word: 'RANDOM', clue: 'Chosen or happening without a particular pattern.' },
{ word: 'RARELY', clue: 'Not happening very often.' },
{ word: 'RATHER', clue: 'Used to indicate preference or degree.' },
{ word: 'READER', clue: 'A person who reads written material.' },
{ word: 'REALLY', clue: 'In actual fact or to a great degree.' },
{ word: 'REASON', clue: 'A cause, explanation, or basis for something.' },
{ word: 'RECORD', clue: 'A written account or stored information about an event.' },
{ word: 'REFORM', clue: 'A change made to improve a system or situation.' },
{ word: 'REFUSE', clue: 'To say that you will not accept or do something.' },
{ word: 'REGARD', clue: 'Attention, consideration, or respect for someone or something.' },
{ word: 'REGION', clue: 'A particular area or part of a country or the world.' },
{ word: 'RELIEF', clue: 'A feeling of comfort after worry or difficulty.' },
{ word: 'REMAIN', clue: 'To continue to exist or stay in a place.' },
{ word: 'REMOVE', clue: 'To take something away from a place.' },
{ word: 'REPAIR', clue: 'To fix something that is damaged or broken.' },
{ word: 'REPEAT', clue: 'To do or say something again.' },
{ word: 'REPORT', clue: 'A spoken or written account of information.' },
{ word: 'RESCUE', clue: 'To save someone from danger or difficulty.' },
{ word: 'RESIST', clue: 'To oppose or fight against something.' },
{ word: 'RESULT', clue: 'The outcome or consequence of an action.' },
{ word: 'RETURN', clue: 'To come or go back to a place.' },
{ word: 'REVEAL', clue: 'To make something known or visible.' },
{ word: 'REVIEW', clue: 'An assessment or examination of something.' },
{ word: 'REWARD', clue: 'Something given in recognition of an achievement.' },
{ word: 'RHYTHM', clue: 'A regular pattern of sounds or movements.' },
{ word: 'SAFETY', clue: 'The condition of being protected from danger.' },
{ word: 'SAMPLE', clue: 'A small part used to represent or test a larger amount.' },
{ word: 'SAVING', clue: 'Money kept for future use.' },
{ word: 'SCHOOL', clue: 'A place where people go to learn.' },
{ word: 'SEARCH', clue: 'An attempt to find something or someone.' },
{ word: 'SEASON', clue: 'One of the main divisions of the year.' },
{ word: 'SECOND', clue: 'A unit of time equal to one sixtieth of a minute.' },
{ word: 'SELECT', clue: 'To carefully choose something.' },
{ word: 'SENIOR', clue: 'Someone older or higher in rank or position.' },
{ word: 'SERIAL', clue: 'Arranged or occurring in a particular sequence.' },
{ word: 'SERIES', clue: 'A number of related events or things following one another.' },
{ word: 'SETTLE', clue: 'To resolve a disagreement or establish a place to live.' },
{ word: 'SEVERE', clue: 'Very serious, harsh, or intense.' },
{ word: 'SHIELD', clue: 'An object used to protect against attack or danger.' },
{ word: 'SIMPLE', clue: 'Easy to understand or not complicated.' },
{ word: 'SINGLE', clue: 'Only one, rather than more than one.' },
{ word: 'SISTER', clue: 'A female sibling.' },
{ word: 'SOCIAL', clue: 'Relating to people living or interacting in groups.' },
{ word: 'SOLDIER', clue: 'A person who serves in the armed forces.' },
{ word: 'SPREAD', clue: 'To extend or distribute something over an area.' },
{ word: 'STATION', clue: 'A place where trains or buses stop for passengers.' },
{ word: 'STATUS', clue: 'The position or condition of someone or something.' },
{ word: 'STEADY', clue: 'Firm, stable, and not likely to change suddenly.' },
{ word: 'STOMACH', clue: 'The organ where food is partly digested.' },
{ word: 'STORAGE', clue: 'The act or place of keeping things for future use.' },
{ word: 'STRAIN', clue: 'Pressure, effort, or tension placed on something.' },
{ word: 'STRANGE', clue: 'Unusual or unfamiliar.' },
{ word: 'STREET', clue: 'A public road in a town or city.' },
{ word: 'STRESS', clue: 'Mental or emotional pressure caused by difficult situations.' },
{ word: 'STRIKE', clue: 'To hit something forcefully or stop working in protest.' },
{ word: 'STRING', clue: 'A thin cord made of twisted fibres.' },
{ word: 'STUDIO', clue: 'A room or building used for artistic or creative work.' },
{ word: 'SUBMIT', clue: 'To present something for consideration or approval.' },
{ word: 'SUBTLE', clue: 'Not obvious or easy to notice.' },
{ word: 'SUFFER', clue: 'To experience pain, difficulty, or distress.' },
{ word: 'SUMMIT', clue: 'The highest point of a mountain or achievement.' },
{ word: 'SUPPLY', clue: 'An amount of something available for use.' },
{ word: 'SUPPORT', clue: 'To help, encourage, or hold something up.' },
{ word: 'SUPPOSE', clue: 'To think or assume that something is likely true.' },
{ word: 'SURELY', clue: 'Without doubt or certainly.' },
{ word: 'SURVEY', clue: 'A set of questions used to collect information.' },
{ word: 'SWITCH', clue: 'A device used to turn something on or off.' },
{ word: 'SYMBOL', clue: 'A sign or object representing an idea or meaning.' },
{ word: 'SYSTEM', clue: 'A group of connected parts working together.' },
{ word: 'TALENT', clue: 'A natural ability or skill.' },
{ word: 'TEACHER', clue: 'A person whose job is to help others learn.' },
{ word: 'TENDER', clue: 'Gentle, soft, or easily damaged.' },
{ word: 'THEORY', clue: 'An explanation based on ideas and evidence.' },
{ word: 'THREAT', clue: 'A statement or sign that harm or danger may occur.' },
{ word: 'THRIFT', clue: 'The careful use of money and resources.' },
{ word: 'THROAT', clue: 'The passage in the neck used for breathing and swallowing.' },
{ word: 'TISSUE', clue: 'A group of similar cells or a soft paper product.' },
{ word: 'TONGUE', clue: 'The muscular organ in the mouth used for tasting and speaking.' },
{ word: 'TOURIST', clue: 'A person who travels to visit places for pleasure.' },
{ word: 'TOWARD', clue: 'In the direction of something.' },
{ word: 'TRADER', clue: 'A person who buys and sells goods or services.' },
{ word: 'TRAFFIC', clue: 'Vehicles moving along roads or streets.' },
{ word: 'TRAGEDY', clue: 'An event that causes great sadness or suffering.' },
{ word: 'TREATY', clue: 'A formal agreement between countries.' },
{ word: 'TROPHY', clue: 'A prize given to recognize an achievement.' },
{ word: 'TUNNEL', clue: 'An underground or enclosed passage.' },
{ word: 'TURKEY', clue: 'A large bird often prepared as food.' },
{ word: 'UNABLE', clue: 'Not having the ability or power to do something.' },
{ word: 'UNFAIR', clue: 'Not treating people equally or justly.' },
{ word: 'UNIQUE', clue: 'Being the only one of its kind.' },
{ word: 'UNITED', clue: 'Joined together for a common purpose.' },
{ word: 'UNLESS', clue: 'Except if a particular condition is met.' },
{ word: 'UPDATE', clue: 'To make something more current or provide new information.' },
{ word: 'USEFUL', clue: 'Helpful or capable of serving a purpose.' },
{ word: 'VALLEY', clue: 'A low area of land between hills or mountains.' },
{ word: 'VANISH', clue: 'To disappear suddenly or completely.' },
{ word: 'VARIED', clue: 'Containing different types or kinds.' },
{ word: 'VECTOR', clue: 'A quantity that has both size and direction.' },
{ word: 'VENDOR', clue: 'A person or business that sells goods.' },
{ word: 'VERIFY', clue: 'To check and confirm that something is correct.' },
{ word: 'VESSEL', clue: 'A container or a ship used for transportation.' },
{ word: 'VICTIM', clue: 'A person harmed by an event or action.' },
{ word: 'VIEWER', clue: 'A person who watches a programme or display.' },
{ word: 'VIOLET', clue: 'A colour between blue and purple.' },
{ word: 'VISION', clue: 'The ability to see or imagine a future possibility.' },
{ word: 'VISUAL', clue: 'Relating to sight or something that can be seen.' },
{ word: 'VOLUME', clue: 'The amount of space occupied by something or the loudness of sound.' },
{ word: 'WALLET', clue: 'A small folding case used to carry money and cards.' },
{ word: 'WEALTH', clue: 'A large amount of money or valuable possessions.' },
{ word: 'WEAPON', clue: 'An object designed to cause harm or defend against attack.' },
{ word: 'WEIGHT', clue: 'The measure of how heavy something is.' },
{ word: 'WISDOM', clue: 'The ability to make good decisions using knowledge and experience.' },
{ word: 'WONDER', clue: 'A feeling of amazement or curiosity.' },
{ word: 'WORKER', clue: 'A person who does a job or performs work.' },
{ word: 'WRITER', clue: 'A person who creates books, stories, or other written material.' },
];
// CHECK DAILY WORD BANK
const dailyWordCounts = {};

DAILY_WORD_BANK.forEach(({ word }) => {
  dailyWordCounts[word] = (dailyWordCounts[word] || 0) + 1;
});

const duplicateDailyWords = Object.entries(dailyWordCounts)
  .filter(([word, count]) => count > 1)
  .map(([word]) => word);

console.log('Total entries:', DAILY_WORD_BANK.length);
console.log('Unique words:', Object.keys(dailyWordCounts).length);
console.log('Duplicate words:', duplicateDailyWords);

// SHUFFLE A LIST USING A SEEDED RANDOM GENERATOR
const seededShuffle = (items, random) => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};


// GET FIVE UNIQUE WORDS THAT HAVE NOT BEEN USED IN THE LAST 60 DAYS
const getDailyPuzzle = (dateKey, recentPuzzles = []) => {
  let seed = 0;

  for (let i = 0; i < dateKey.length; i++) {
    seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0;
  }

  const random = createRandomGenerator(seed || 1);

  // REMOVE DUPLICATE WORDS FROM THE DAILY WORD BANK
  const uniqueWordBank = [
    ...new Map(
      DAILY_WORD_BANK.map((item) => [
        item.word.toUpperCase(),
        item
      ])
    ).values()
  ];

  // COLLECT WORDS USED IN THE LAST 60 DAYS
  const usedWords = new Set(
    recentPuzzles
      .filter((entry) => {
        if (!entry || typeof entry.date !== 'string') return false;

        const entryDate = new Date(`${entry.date}T12:00:00`);
        const currentDate = new Date(`${dateKey}T12:00:00`);

        const daysApart = Math.floor(
          (currentDate - entryDate) / 86400000
        );

        return daysApart >= 0 && daysApart < 60;
      })
      .flatMap((entry) =>
        Array.isArray(entry.words)
          ? entry.words.map((word) => String(word).toUpperCase())
          : []
      )
  );

  // SELECT WORDS NOT USED IN THE LAST 60 DAYS
  let availableWords = uniqueWordBank.filter(
    (item) => !usedWords.has(item.word.toUpperCase())
  );

  // FALL BACK TO THE UNIQUE WORD BANK IF FEWER THAN FIVE REMAIN
  if (availableWords.length < 5) {
    availableWords = [...uniqueWordBank];
  }

  // SHUFFLE AND SELECT FIVE UNIQUE QUESTIONS
  const selected = seededShuffle(availableWords, random).slice(0, 5);

  return selected.map((item) => ({
    word: item.word,
    clue: item.clue,
    letters: item.word.split('')
  }));
};


// CREATE A NEW DAILY SAVE WHILE PRESERVING RECENT HISTORY
const createDailyState = (
  dateKey,
  previousData = {},
  streak = 0
) => {
  const previousHistory = Array.isArray(previousData.recentPuzzles)
    ? previousData.recentPuzzles.filter(
        (entry) =>
          entry &&
          typeof entry.date === 'string' &&
          Array.isArray(entry.words)
      )
    : [];

  const historyWithoutToday = previousHistory.filter(
    (entry) => entry.date !== dateKey
  );

  const selectedPuzzle = getDailyPuzzle(
    dateKey,
    historyWithoutToday
  );

  const selectedWords = selectedPuzzle.map((item) => item.word);

  const updatedHistory = [
    ...historyWithoutToday,
    {
      date: dateKey,
      words: selectedWords
    }
  ].slice(-60);

  return {
    date: dateKey,
    puzzleWords: selectedWords,
    recentPuzzles: updatedHistory,
    foundWords: [],
    hintReveals: {},
    completed: false,
streak,
totalCompleted: Number(previousData.totalCompleted) || 0,
lastCompletedDate:
  typeof previousData.lastCompletedDate === 'string'
    ? previousData.lastCompletedDate
    : ''
  };
};

// LOAD AND NORMALIZE DAILY SAVE DATA
const getDailySave = () => {
  const today = getLocalDateKey();

  try {
    const saved = JSON.parse(
      localStorage.getItem(DAILY_SAVE_KEY)
    );

    if (!saved || typeof saved !== 'object') {
      return createDailyState(today);
    }

    const lastCompletedDate =
      typeof saved.lastCompletedDate === 'string'
        ? saved.lastCompletedDate
        : '';

    const streakIsCurrent =
      lastCompletedDate === today ||
      lastCompletedDate === getPreviousDateKey(today);

    const safeStreak = streakIsCurrent
      ? Number(saved.streak) || 0
      : 0;

    const recentPuzzles = Array.isArray(saved.recentPuzzles)
      ? saved.recentPuzzles
      : [];
const totalCompleted = Number(saved.totalCompleted) || 0;
    if (saved.date !== today) {
  return createDailyState(
    today,
    {
      recentPuzzles,
      lastCompletedDate,
      totalCompleted
    },
    safeStreak
  );
}

    const savedPuzzleWords = Array.isArray(saved.puzzleWords)
      ? saved.puzzleWords
      : [];

    const validSavedPuzzle =
      savedPuzzleWords.length === 5 &&
      savedPuzzleWords.every((word) =>
        DAILY_WORD_BANK.some((item) => item.word === word)
      );

    if (!validSavedPuzzle) {
  return createDailyState(
    today,
    {
      recentPuzzles,
      lastCompletedDate,
      totalCompleted
    },
    safeStreak
  );
}
    return {
      date: today,
      puzzleWords: savedPuzzleWords,
      recentPuzzles,
      foundWords: Array.isArray(saved.foundWords)
        ? saved.foundWords
        : [],
      hintReveals:
        saved.hintReveals && typeof saved.hintReveals === 'object'
          ? saved.hintReveals
          : {},
      completed: Boolean(saved.completed),
streak: safeStreak,
totalCompleted,
lastCompletedDate
    };
  } catch (error) {
    console.error('Could not load daily challenge:', error);
    return createDailyState(today);
  }
};

// SAVE AND RESTORE MAIN GAME PROGRESS
const getSavedGame = () => {
  try {
    const saved = localStorage.getItem('brainLettersSave');

    if (saved) {
      const parsed = JSON.parse(saved);

      const oldHintReveals = Object.fromEntries(
        (parsed.hintedWords ?? [])
          .filter((word) => typeof word === 'string')
          .map((word) => [word, [0]])
      );

      const savedLevel = Math.max(0, parsed.levelIndex ?? 0);

      return {
        coins: parsed.coins ?? 230,
extraWordCoins: parsed.extraWordCoins ?? 0,
levelIndex: savedLevel,
        highestLevelIndex: Math.max(
          savedLevel,
          parsed.highestLevelIndex ?? savedLevel
        ),
        foundWords: parsed.foundWords ?? [],
        hintReveals: parsed.hintReveals ?? oldHintReveals,
        completedLevels: parsed.completedLevels ?? [],
        levelProgress: parsed.levelProgress ?? {},
        rewardHistory: Array.isArray(parsed.rewardHistory)
  ? parsed.rewardHistory
  : [],
achievementStages: parsed.achievementStages || {}
      };
    }
  } catch (error) {
    console.error('Could not load saved game:', error);
  }

  return {
    coins: 230,
extraWordCoins: 0,
levelIndex: 0,
    highestLevelIndex: 0,
    foundWords: [],
    hintReveals: {},
    completedLevels: [],
    levelProgress: {},
    rewardHistory: [],
achievementStages: {}
  };
};

// =====================================
// DAILY CHALLENGE SCREEN
// =====================================
function DailyChallenge({ coins, setCoins, onHome, onReward, settings }) {
  const [today, setToday] = useState(getLocalDateKey);
  const [dailyData, setDailyData] = useState(getDailySave);

  
const dailyPuzzle = useMemo(() => {
  const savedWords = Array.isArray(dailyData.puzzleWords)
    ? dailyData.puzzleWords
    : [];

  return savedWords
    .map((word) =>
      DAILY_WORD_BANK.find((item) => item.word === word)
    )
    .filter(Boolean)
    .map((item) => ({
      word: item.word,
      clue: item.clue,
      letters: item.word.split('')
    }));
}, [dailyData.puzzleWords]);


  const currentIndex = dailyData.foundWords.length;
  const currentPuzzle = dailyPuzzle[currentIndex] || null;

  const [letters, setLetters] = useState(
    currentPuzzle ? shuffleLettersArray(currentPuzzle.letters) : []
  );

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [liveWord, setLiveWord] = useState('');
  const [pointerPosition, setPointerPosition] = useState(null);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState('');

  const wheelRef = useRef(null);
  const svgRef = useRef(null);
  const activePointer = useRef(null);
  const currentSelection = useRef([]);
  const completionAwarded = useRef(dailyData.completed);

  const foundWords = dailyData.foundWords;
  const levelCompleted = dailyData.completed;

  // RESET AND SHUFFLE THE LETTER WHEEL WHEN THE NEXT CLUE APPEARS
  useEffect(() => {
    if (!currentPuzzle) {
      setLetters([]);
      return;
    }

    setLetters(shuffleLettersArray(currentPuzzle.letters));
    setSelectedLetters([]);
    setLiveWord('');
    setPointerPosition(null);

    currentSelection.current = [];
    activePointer.current = null;
  }, [currentIndex, today]);

  // CHECK FOR A NEW DAY
  useEffect(() => {
    const checkNewDay = () => {
      const currentDate = getLocalDateKey();

      if (currentDate === today) return;

      setToday(currentDate);

      
setDailyData((previous) => {
  const keepStreak =
    previous.lastCompletedDate === getPreviousDateKey(currentDate);

  return createDailyState(
    currentDate,
    previous,
    keepStreak ? previous.streak : 0
  );
});


      setSelectedLetters([]);
      setLiveWord('');
      setPointerPosition(null);
      setMessage('A new daily challenge is ready!');

      activePointer.current = null;
      currentSelection.current = [];
      completionAwarded.current = false;
    };

    const timer = setInterval(checkNewDay, 1000);

    return () => clearInterval(timer);
  }, [today]);

  // SAVE DAILY PROGRESS
  useEffect(() => {
    try {
      localStorage.setItem(
        DAILY_SAVE_KEY,
        JSON.stringify(dailyData)
      );
    } catch (error) {
      console.error('Could not save daily challenge:', error);
    }
  }, [dailyData]);

  // COUNTDOWN TO LOCAL MIDNIGHT
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);

      midnight.setHours(24, 0, 0, 0);

      const remaining = midnight.getTime() - now.getTime();

      const hours = String(
        Math.floor(remaining / 3600000)
      ).padStart(2, '0');

      const minutes = String(
        Math.floor((remaining % 3600000) / 60000)
      ).padStart(2, '0');

      const seconds = String(
        Math.floor((remaining % 60000) / 1000)
      ).padStart(2, '0');

      setCountdown(`${hours}:${minutes}:${seconds}`);
    };

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, []);

  // CONVERT SCREEN COORDINATES TO SVG COORDINATES
const getSvgPoint = (clientX, clientY) => {
  if (!svgRef.current) return null;

  const svg = svgRef.current;
  const matrix = svg.getScreenCTM();

  if (!matrix) return null;

  const point = svg.createSVGPoint();

  point.x = clientX;
  point.y = clientY;

  const svgPoint = point.matrixTransform(matrix.inverse());

  return {
    x: svgPoint.x,
    y: svgPoint.y
  };
};

// GET THE EXACT CENTRE OF A LETTER BUTTON
const getLetterPosition = (index) => {
  if (!wheelRef.current || !svgRef.current) return null;

  const button = wheelRef.current.querySelector(
    `[data-daily-letter-index="${index}"]`
  );

  if (!button) return null;

  const rect = button.getBoundingClientRect();

  return getSvgPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
};

  // START SELECTING LETTERS
  const selectLetter = (letter, index, pointerId) => {
    if (activePointer.current !== null || levelCompleted) return;

   activePointer.current = pointerId;

if (settings.soundEffects) {
  playGameSound('select');
}

const selection = [{ letter, index }];

    currentSelection.current = selection;

    setSelectedLetters(selection);
    setLiveWord(letter);
    setPointerPosition(getLetterPosition(index));
    setMessage('');
  };

  // ADD ANOTHER LETTER
  const addLetter = (letter, index, pointerId) => {
    if (activePointer.current !== pointerId) return;

    const alreadySelected = currentSelection.current.some(
      (item) => item.index === index
    );

    if (alreadySelected) return;
    if (settings.soundEffects) {
  playGameSound('select');
}
    if (settings.soundEffects) {
  playGameSound('select');
}

    const updatedSelection = [
      ...currentSelection.current,
      { letter, index }
    ];

    currentSelection.current = updatedSelection;
    setSelectedLetters(updatedSelection);

    setLiveWord(
      updatedSelection.map((item) => item.letter).join('')
    );
  };

  // TRACK POINTER MOVEMENT
  useEffect(() => {
    const handlePointerMove = (event) => {
      if (activePointer.current !== event.pointerId) return;
      if (!wheelRef.current || !svgRef.current) return;

      const svgRect = svgRef.current.getBoundingClientRect();

      setPointerPosition(
  getSvgPoint(event.clientX, event.clientY)
);

      const element = document.elementFromPoint(
        event.clientX,
        event.clientY
      );

      const letterButton = element?.closest(
        '[data-daily-letter-index]'
      );

      if (
        letterButton &&
        wheelRef.current.contains(letterButton)
      ) {
        const index = Number(letterButton.dataset.dailyLetterIndex);
        const letter = letters[index];

        if (letter !== undefined) {
          addLetter(letter, index, event.pointerId);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [letters]);

  // VALIDATE WORD WHEN POINTER IS RELEASED
  useEffect(() => {
    const finishWord = (event) => {
      if (activePointer.current !== event.pointerId) return;

      activePointer.current = null;

      const word = currentSelection.current
        .map((item) => item.letter)
        .join('');

      currentSelection.current = [];

      setSelectedLetters([]);
      setPointerPosition(null);
      setLiveWord('');

      if (!word || levelCompleted || !currentPuzzle) return;

      if (word !== currentPuzzle.word) {
  if (
    GAME_WORD_SET.has(word.toLowerCase()) &&
    canFormWord(word, letters)
  ) {
    if (settings.soundEffects) {
      playGameSound('extra');
    }

    setMessage(
      'Great discovery! Find the word described by the clue.'
    );
  } else {
    if (settings.soundEffects) {
      playGameSound('wrong');
    }

    setMessage('Not quite! Try another word.');
  }

  return;
}

      // PLAY CORRECT ANSWER SOUND
if (settings.soundEffects) {
  playGameSound('correct');
}

const updatedWords = [...foundWords, word];
const allCompleted = updatedWords.length === dailyPuzzle.length;

      if (allCompleted) {
        if (completionAwarded.current) return;
        if (settings.soundEffects) {
  playGameSound('complete');
}

        completionAwarded.current = true;

        setCoins((previous) => previous + DAILY_REWARD);

        onReward(
          'daily',
          DAILY_REWARD,
          'Daily Challenge completed'
        );

        setDailyData((previous) => {
          const previousDate = getPreviousDateKey(today);

          const newStreak =
            previous.lastCompletedDate === previousDate
              ? previous.streak + 1
              : previous.lastCompletedDate === today
                ? previous.streak
                : 1;

          return {
            ...previous,
            foundWords: updatedWords,
            completed: true,
            streak: newStreak,
            totalCompleted: (previous.totalCompleted || 0) + 1,
            lastCompletedDate: today
          };
        });

        setMessage(
          `Daily Challenge completed! You earned ${DAILY_REWARD} coins!`
        );
      } else {
        setDailyData((previous) => ({
          ...previous,
          foundWords: updatedWords
        }));

        setMessage(`Excellent! ${word} discovered!`);
      }
    };

    const cancelWord = (event) => {
      if (activePointer.current !== event.pointerId) return;

      activePointer.current = null;
      currentSelection.current = [];

      setSelectedLetters([]);
      setPointerPosition(null);
      setLiveWord('');
    };

    window.addEventListener('pointerup', finishWord);
    window.addEventListener('pointercancel', cancelWord);

    return () => {
      window.removeEventListener('pointerup', finishWord);
      window.removeEventListener('pointercancel', cancelWord);
    };
  }, [
  foundWords,
  levelCompleted,
  currentPuzzle,
  dailyPuzzle.length,
  letters,
  today,
  setCoins,
  onReward,
  settings.soundEffects
]);

  // DAILY HINT: REVEAL A LETTER IN THE CURRENT WORD ONLY
  const useDailyHint = () => {
    if (levelCompleted || !currentPuzzle) return;

    if (activePointer.current !== null) {
      setMessage('Finish your current swipe before using a hint.');
      return;
    }

    if (coins < HINT_COST) {
      setMessage(`You need ${HINT_COST} coins to use a hint.`);
      return;
    }

    const word = currentPuzzle.word;
    const revealed = dailyData.hintReveals[word] || [];

    const hiddenPositions = word
      .split('')
      .map((_, index) => index)
      .filter((index) => !revealed.includes(index));

    if (hiddenPositions.length === 0) {
      setMessage('All letters in this word have been revealed!');
      return;
    }

    const position = hiddenPositions[0];

    setDailyData((previous) => ({
      ...previous,
      hintReveals: {
        ...previous.hintReveals,
        [word]: [
          ...(previous.hintReveals[word] || []),
          position
        ]
      }
    }));

    setCoins((previous) => previous - HINT_COST);

    setMessage('Hint revealed! One letter has been revealed.');
  };

  // SHUFFLE CURRENT WORD'S LETTERS
  const shuffleDailyLetters = () => {
    if (levelCompleted || activePointer.current !== null) return;

    setLetters((previous) => shuffleLettersArray(previous));
    setMessage('Letters shuffled!');
  };

  // DRAW THE CONNECTING LINE
  const selectedPositions = selectedLetters
    .map((item) => getLetterPosition(item.index))
    .filter(Boolean);

  const linePoints = [...selectedPositions];

  if (pointerPosition && linePoints.length > 0) {
    linePoints.push(pointerPosition);
  }

  const linePath = linePoints
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    )
    .join(' ');

  const revealedLetters = currentPuzzle
    ? dailyData.hintReveals[currentPuzzle.word] || []
    : [];

  return (
    <section className="game-content daily-challenge-screen page-transition">
      <div className="daily-header">
        <span className="daily-badge">🎯 DAILY CHALLENGE</span>
        <h2>Today's Brain Challenge</h2>
        <p>Complete today's five clues and keep your streak alive!</p>
      </div>

      <div className="daily-stats">
        <div className="daily-stat-card">
          <span>🔥</span>
          <strong>{dailyData.streak}</strong>
          <small>DAY STREAK</small>
        </div>

        <div className="daily-stat-card">
          <span>🪙</span>
          <strong>{DAILY_REWARD}</strong>
          <small>COIN REWARD</small>
        </div>

        <div className="daily-stat-card">
          <span>⏳</span>
          <strong>{countdown}</strong>
          <small>NEXT CHALLENGE</small>
        </div>
      </div>

      <div className="progress-area daily-progress">
        <div className="progress-label">
          <span>DAILY PROGRESS</span>
          <strong>{foundWords.length} / 5 WORDS</strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${(foundWords.length / 5) * 100}%`
            }}
          />
        </div>
      </div>

      {!levelCompleted && currentPuzzle && (
        <>
          <div className="daily-word-number">
            WORD {currentIndex + 1} OF 5
          </div>

          <div className="daily-clue-card">
            <span className="daily-clue-label">YOUR CLUE</span>
            <p>{currentPuzzle.clue}</p>
          </div>

          <div className="daily-answer-row">
            {currentPuzzle.word.split('').map((letter, index) => (
              <div className="puzzle-cell" key={index}>
                {revealedLetters.includes(index) ? letter : ''}
              </div>
            ))}
          </div>

          <div className="puzzle-wheel-divider"></div>

          <div className="wheel-controls-layout daily-wheel-layout">
            <div className="live-word-preview" aria-live="polite">
              {liveWord && <span>{liveWord}</span>}
            </div>

            <div className="letter-wheel" ref={wheelRef}>
              <svg
                ref={svgRef}
                className="connecting-line"
                width="100%"
                height="100%"
              >
                <defs>
                  <linearGradient
                    id="dailyLineGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#24C8FF" />
                    <stop offset="100%" stopColor="#8855FF" />
                  </linearGradient>

                  <filter id="dailyLineGlow">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {linePath && (
                  <>
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#dailyLineGradient)"
                      strokeWidth="15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#dailyLineGlow)"
                      opacity="0.75"
                    />

                    <path
                      d={linePath}
                      fill="none"
                      stroke="#42D9FF"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {selectedPositions.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#FFFFFF"
                    stroke="#42D9FF"
                    strokeWidth="4"
                  />
                ))}
              </svg>

              {letters.map((letter, index) => {
                const isSelected = selectedLetters.some(
                  (item) => item.index === index
                );

                const angle =
                  (index / letters.length) * Math.PI * 2 - Math.PI / 2;

                return (
                  <button
                    type="button"
                    data-daily-letter-index={index}
                    className={`letter-button ${
                      isSelected ? 'selected' : ''
                    }`}
                    style={{
                      left: `calc(50% + ${Math.cos(angle) * 88}px)`,
                      top: `calc(50% + ${Math.sin(angle) * 82}px)`
                    }}
                    key={`${letter}-${index}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      selectLetter(letter, index, event.pointerId);
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            <div className="game-controls side-controls">
              <button
                type="button"
                className="icon-button hint-button"
                onClick={useDailyHint}
                title={`Use hint — ${HINT_COST} coins`}
                aria-label={`Use hint for ${HINT_COST} coins`}
              >
                <span className="hint-icon">💡</span>
                <span className="hint-cost">{HINT_COST}</span>
              </button>

              <button
                type="button"
                className="icon-button shuffle-button"
                onClick={shuffleDailyLetters}
                title="Shuffle letters"
                aria-label="Shuffle letters"
              >
                🔀
              </button>
            </div>
          </div>
        </>
      )}

      <div className="game-message">{message}</div>

      {levelCompleted && (
        <div className="daily-completed-card">
          <div className="daily-completed-icon">🏆</div>
          <h3>Daily Challenge Completed!</h3>
          <p>Fantastic work! You've solved all five clues.</p>
          <strong>+{DAILY_REWARD} COINS</strong>
          <span>🔥 {dailyData.streak} Day Streak</span>
        </div>
      )}

      <button
        type="button"
        className="daily-home-button"
        onClick={onHome}
      >
        ← BACK TO MAIN GAME
      </button>
    </section>
  );
}

// =====================================
// REWARD CENTRE
// =====================================
function RewardsPage({
  coins,
  completedLevels,
  highestLevelIndex,
  rewardHistory,
  achievementStages,
  onClaimAchievement,
  onHome
}) {
  const dailyData = getDailySave();

  const achievementProgress = {
  firstVictory: completedLevels.length,
  wordExplorer: completedLevels.length,
  puzzleMaster: completedLevels.length,
  dailySolver: dailyData.totalCompleted || 0,
  streakStarter: dailyData.streak || 0,
  risingGenius: highestLevelIndex + 1
};

const achievements = Object.entries(ACHIEVEMENT_MILESTONES).map(
  ([id, config]) => {
    const stage = achievementStages[id] || 0;
    const isCompleted = stage >= config.targets.length;

    const target = isCompleted
      ? config.targets[config.targets.length - 1]
      : config.targets[stage];

    const progress = Math.min(
      achievementProgress[id] || 0,
      target
    );

    return {
      id,
      icon: config.icon,
      title: config.title,
      description: config.description,
      progress,
      target,
      reward: isCompleted ? 0 : config.rewards[stage],
      stage,
      isCompleted
    };
  }
);
    return (
    <section className="game-content rewards-screen page-transition">
      <div className="rewards-heading">
  <h2>Reward Centre</h2>
</div>

      
            <div className="rewards-section">
        <div className="rewards-section-heading">
          <h3>ACHIEVEMENTS</h3>

          <span>
            {achievements.filter(
            (item) => item.isCompleted
                ).length}
                  {' / '}
                {achievements.length} COMPLETED
          </span>
        </div>

        <div className="achievements-grid">
          {achievements.map((achievement) => {
  const unlocked =
    achievement.progress >= achievement.target &&
    !achievement.isCompleted;

  const percentage = Math.min(
    100,
    (achievement.progress / achievement.target) * 100
  );

  return (
    <div
      className={`achievement-card ${
        unlocked ? 'achievement-unlocked' : ''
      }`}
      key={achievement.id}
    >
      <span className="achievement-icon">
        {achievement.icon}
      </span>

      <div className="achievement-info">
        <h4>{achievement.title}</h4>
        <p>{achievement.description}</p>

        <div className="achievement-progress-track">
          <div
            className="achievement-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className="achievement-progress-text">
          {achievement.isCompleted
            ? 'COMPLETED'
            : unlocked
              ? 'REWARD UNLOCKED'
              : `${achievement.progress} / ${achievement.target}`}
        </span>
      </div>

      {unlocked ? (
        <button
          type="button"
          className="achievement-claim-button"
          onClick={() => onClaimAchievement(achievement)}
        >
          CLAIM · {achievement.reward} COINS
        </button>
      ) : achievement.isCompleted ? (
        <span className="achievement-claimed">CLAIMED</span>
      ) : (
        <span className="achievement-lock">🔒</span>
      )}
    </div>
  );
})}
        </div>
      </div>

      
      <button
        type="button"
        className="rewards-home-button"
        onClick={onHome}
      >
        ← BACK TO MAIN GAME
      </button>
    </section>
  );
}

// =====================================
// ABOUT THE GAME PAGE
// =====================================
function AboutPage({ onBack }) {
  return (
    <section className="game-content about-screen page-transition">

      <div className="about-heading">
        <button
          type="button"
          className="about-back-button"
          onClick={onBack}
        >
          ← Back to Settings
        </button>

        <span className="about-eyebrow">GET TO KNOW THE GAME</span>
        <h2>About Brain Letters</h2>
        <p>Connect. Think. Conquer.</p>
      </div>

      <div className="about-section">
        <div className="about-game-intro">
          <img
            src="/brain-letters-icon.png"
            alt="Brain Letters"
            className="about-game-icon"
          />

          <h3>Welcome to Brain Letters!</h3>

          <p>
            Brain Letters is an exciting word puzzle game designed
            to challenge your mind, improve your vocabulary and
            make learning new words fun.
          </p>

          <p>
            Connect letters, discover hidden words, complete
            crossword puzzles and progress through exciting levels.
          </p>
        </div>
      </div>

      <div className="about-section">
        <h3>HOW TO PLAY</h3>

        <div className="about-info-card">
          <span>01</span>
          <div>
            <strong>Connect the Letters</strong>
            <p>Swipe across the letters in the wheel to form words.</p>
          </div>
        </div>

        <div className="about-info-card">
          <span>02</span>
          <div>
            <strong>Complete the Puzzle</strong>
            <p>Find the correct words and fill all the spaces on the board.</p>
          </div>
        </div>

        <div className="about-info-card">
          <span>03</span>
          <div>
            <strong>Use Your Hints</strong>
            <p>Use coins to reveal letters whenever you get stuck.</p>
          </div>
        </div>

        <div className="about-info-card">
          <span>04</span>
          <div>
            <strong>Keep Progressing</strong>
            <p>Complete levels, earn rewards and challenge yourself.</p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h3>GAME FEATURES</h3>

        <div className="about-feature-card">
          <strong>🎯 Levels</strong>
          <p>Discover new puzzles and face increasing challenges.</p>
        </div>

        <div className="about-feature-card">
          <strong>📅 Daily Challenge</strong>
          <p>Answer five shuffled questions every day.</p>
        </div>

        <div className="about-feature-card">
          <strong>🪙 Coins and Rewards</strong>
          <p>Earn coins and unlock rewards as you play.</p>
        </div>

        <div className="about-feature-card">
          <strong>💡 Hints and Shuffle</strong>
          <p>Get help and rearrange your letters when needed.</p>
        </div>

        <div className="about-feature-card">
          <strong>🎨 Themes</strong>
          <p>Personalize your gameplay with different visual themes.</p>
        </div>

        <div className="about-feature-card">
          <strong>🔊 Audio and Feedback</strong>
          <p>Customize sound effects and your gameplay experience.</p>
        </div>
      </div>

      <div className="about-version-card">
        <strong>BRAIN LETTERS</strong>
        <p>Connect. Think. Conquer.</p>
        <small>Version 1.0.0</small>
      </div>

    </section>
  );
}

// =====================================
// SETTINGS PAGE
// =====================================
function SettingsPage({ settings, setSettings, onHome, onAbout }) {
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const updateSetting = (key) => {
  // Unlock audio when the player enables background music
  if (key === 'backgroundMusic' && !settings.backgroundMusic) {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        if (!gameAudioContext) {
          gameAudioContext = new AudioContextClass();
        }

        if (gameAudioContext.state === 'suspended') {
          gameAudioContext.resume();
        }
      }
    } catch (error) {
      console.warn('Could not unlock background audio:', error);
    }
  }

  setSettings((previous) => ({
    ...previous,
    [key]: !previous[key]
  }));
};

  // RESET GAME PROGRESS WHILE KEEPING SETTINGS
  const resetGameProgress = () => {
    try {
      localStorage.removeItem('brainLettersSave');
      localStorage.removeItem(DAILY_SAVE_KEY);

      window.location.reload();
    } catch (error) {
      console.error('Could not reset game progress:', error);
    }
  };

  const settingGroups = [
    {
      title: 'AUDIO & FEEDBACK',
      description: 'Customize your gameplay experience.',
      items: [
        {
          key: 'soundEffects',
          title: 'Sound Effects',
          description: 'Sounds when interacting with the game.',
          icon: '🔊'
        },
        {
          key: 'backgroundMusic',
          title: 'Background Music',
          description: 'Music while playing Brain Letters.',
          icon: '🎵'
        }
        ]
    },
    {
      title: 'GAME EXPERIENCE',
      description: 'Manage your game preferences.',
      items: [
        {
          key: 'dailyReminders',
          title: 'Daily Reminders',
          description: 'Your preference for daily challenge reminders.',
          icon: '🔔'
        }
      ]
    }
  ];

  return (
    <section className="game-content settings-screen page-transition">

      <div className="settings-heading">
        <span className="settings-eyebrow">PERSONALIZE YOUR GAME</span>
        <h2>Settings</h2>
        <p>Make Brain Letters feel just right for you.</p>
      </div>
      
      {settingGroups.map((group) => (
        <div className="settings-section" key={group.title}>
          <div className="settings-section-heading">
            <h3>{group.title}</h3>
            <p>{group.description}</p>
          </div>

          <div className="settings-options">
            {group.items.map((item) => (
              <div className="settings-option" key={item.key}>
                <div className="settings-option-icon">
                  {item.icon}
                </div>

                <div className="settings-option-info">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>

                <button
                  type="button"
                  className={`settings-toggle ${
                    settings[item.key] ? 'toggle-enabled' : ''
                  }`}
                  onClick={() => updateSetting(item.key)}
                  role="switch"
                  aria-checked={Boolean(settings[item.key])}
                  aria-label={item.title}
                >
                  <span />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      
<div className="settings-section">
  <div className="settings-section-heading">
    <h3>ABOUT THE GAME</h3>
    <p>More about your favourite word puzzle.</p>
  </div>

  <button
    type="button"
    className="settings-about-card"
    onClick={onAbout}
  >
    <img
      src="/brain-letters-icon.png"
      alt="Brain Letters"
      className="settings-about-icon"
    />

    <div>
      <strong>BRAIN LETTERS</strong>
      <p>Connect. Think. Conquer.</p>
      <small>Version 1.0.0</small>
    </div>
  </button>
</div>

<div className="settings-section settings-danger-section">
  <div className="settings-section-heading">
    <h3>DATA MANAGEMENT</h3>
    <p>Manage your saved game progress.</p>
  </div>

  <div className="settings-reset-card">
    <div className="settings-reset-info">
      <strong>Reset Game Progress</strong>
      <p>
        Clear your levels, coins, achievements,
        rewards and daily challenge progress.
      </p>
    </div>

    <button
      type="button"
      className="settings-reset-button"
      onClick={() => setShowResetConfirmation(true)}
    >
      RESET
    </button>
  </div>
</div>

{showResetConfirmation && (
  <div className="settings-modal-overlay">
    <div className="settings-confirm-modal">
      <div className="settings-confirm-icon">⚠️</div>

      <h3>Reset Game Progress?</h3>

      <p>
        This will permanently clear your coins, levels,
        rewards and daily challenge progress.
        Your Settings preferences will remain saved.
      </p>

      <div className="settings-confirm-actions">
        <button
          type="button"
          className="settings-cancel-button"
          onClick={() => setShowResetConfirmation(false)}
        >
          CANCEL
        </button>

        <button
          type="button"
          className="settings-confirm-button"
          onClick={resetGameProgress}
        >
          YES, RESET
        </button>
      </div>
    </div>
  </div>
)}

<button
  type="button"
  className="settings-home-button"
  onClick={onHome}
>
  ← BACK TO MAIN GAME
</button>
    </section>
  );
}

// =====================================
// THEMES SELECTION PAGE
// =====================================
function ThemesPage({ settings, setSettings, onHome }) {
  const [selectedTheme, setSelectedTheme] = useState(
    settings.theme || 'vintage-parchment'
  );

  const applyTheme = () => {
    setSettings((previous) => ({
      ...previous,
      theme: selectedTheme
    }));
    onHome();
  };

  return (
    <section className="game-content themes-screen page-transition">
      <div className="themes-heading">
        <h2>THEMES</h2>
        <p>Choose your favourite look!</p>
      </div>

      <div className="themes-grid">
        {GAME_THEMES.map((theme) => (
          <button
  type="button"
  key={theme.id}
  className={`theme-card ${
    selectedTheme === theme.id ? 'theme-card-selected' : ''
  }`}
  onClick={() => setSelectedTheme(theme.id)}
  aria-pressed={selectedTheme === theme.id}
>
  <div className="theme-card-art" data-theme={theme.id}>
    {selectedTheme === theme.id && (
      <span className="theme-card-check">✓</span>
    )}
  </div>
</button>
        ))}
      </div>

      <div className="themes-actions">
        <button
          type="button"
          className="themes-apply-button"
          onClick={applyTheme}
          disabled={selectedTheme === settings.theme}
        >
          APPLY THEME
        </button>

        <button
          type="button"
          className="themes-back-button"
          onClick={onHome}
        >
          ← BACK TO GAME
        </button>
      </div>
    </section>
  );
}

const backgroundMusic = new Audio(
  '/brain_letters_soft_keys_guitar_slow_long.wav'
);

backgroundMusic.preload = 'auto';
backgroundMusic.loop = true;
backgroundMusic.volume = 1.0;


const unlockBackgroundMusic = () => {
  startBackgroundMusic();
};

const startBackgroundMusic = async () => {
  try {
    await backgroundMusic.play();
  } catch (error) {
    console.warn('Could not start background music:', error);
    throw error;
  }
};

const stopBackgroundMusic = () => {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
};

// =====================================
// WELCOME SCREEN
// =====================================
function WelcomeScreen({ onPlay, onDaily }) {
  return (
    <section className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">
          🧠
        </div>

        <h1>BRAIN LETTERS</h1>

        <p className="welcome-tagline">
          CONNECT. THINK. CONQUER.
        </p>

        <div className="welcome-actions">
          <button
            type="button"
            className="welcome-play-button"
            onClick={onPlay}
          >
            PLAY
          </button>

          <button
            type="button"
            className="welcome-daily-button"
            onClick={onDaily}
          >
            🎯 DAILY CHALLENGE
          </button>
        </div>

        <p className="welcome-footer">
          Challenge your mind, one word at a time.
        </p>
      </div>
    </section>
  );
}

// =====================================
// MAIN GAME
// =====================================
function App() {
  const [initialGame] = useState(getSavedGame);

  const [coins, setCoins] = useState(initialGame.coins);
const [extraWordCoins, setExtraWordCoins] = useState(
  initialGame.extraWordCoins || 0
);
const [levelIndex, setLevelIndex] = useState(initialGame.levelIndex);

  const [highestLevelIndex, setHighestLevelIndex] = useState(
    initialGame.highestLevelIndex
  );

  const [foundWords, setFoundWords] = useState(initialGame.foundWords);
  const [hintReveals, setHintReveals] = useState(initialGame.hintReveals);

  const [completedLevels, setCompletedLevels] = useState(
    initialGame.completedLevels
  );

  const [levelProgress, setLevelProgress] = useState(
    initialGame.levelProgress || {}
  );

  const [rewardHistory, setRewardHistory] = useState(
    initialGame.rewardHistory || []
  );

  const [achievementStages, setAchievementStages] = useState(
  initialGame.achievementStages || {}
);

  const recordReward = useCallback((type, amount, description) => {
    setRewardHistory((previous) => [
      {
        id: `${Date.now()}-${type}`,
        type,
        amount,
        description,
        date: new Date().toISOString()
      },
      ...previous
    ].slice(0, 50));
  }, []);
// PREVENT DUPLICATE ACHIEVEMENT CLAIMS
const claimingAchievements = useRef(new Set());

// CLAIM ACHIEVEMENT REWARD
const handleClaimAchievement = (achievement) => {
  const config = ACHIEVEMENT_MILESTONES[achievement.id];

  if (!config) return;

  const stage = achievementStages[achievement.id] || 0;

  if (stage >= config.targets.length) return;

  if (achievement.progress < config.targets[stage]) return;

  const claimKey = `${achievement.id}-${stage}`;

  if (claimingAchievements.current.has(claimKey)) return;

  claimingAchievements.current.add(claimKey);

// PLAY SUCCESS SOUND WHEN ACHIEVEMENT IS CLAIMED
if (settings.soundEffects) {
  playGameSound('complete');
}

const reward = config.rewards[stage];

  setCoins((previous) => previous + reward);

  setAchievementStages((previous) => ({
    ...previous,
    [achievement.id]: stage + 1
  }));

  recordReward(
    'achievement',
    reward,
    `${config.title} achievement claimed`
  );
};
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [screen, setScreen] = useState(() => {
  try {
    const savedScreen = localStorage.getItem('brainLettersCurrentScreen');

    return ['home', 'daily', 'rewards', 'settings', 'themes'].includes(savedScreen)
      ? savedScreen
      : 'home';
  } catch (error) {
    return 'home';
  }
});

// CURTAIN PAGE TRANSITION
const [curtainPhase, setCurtainPhase] = useState('idle');
const navigationLocked = useRef(false);

const runCurtainTransition = (onCovered) => {
  if (navigationLocked.current) return;

  navigationLocked.current = true;
  setCurtainPhase('closing');

  // Wait for the curtains to close
  setTimeout(() => {
    onCovered();
    setCurtainPhase('opening');

    // Wait for the curtains to open
    setTimeout(() => {
      setCurtainPhase('idle');
      navigationLocked.current = false;
    }, 800);

  }, 700);
};

const navigateTo = (destination) => {
  if (navigationLocked.current || destination === screen) return;

  runCurtainTransition(() => {
    setScreen(destination);
  });
};
// RETURN TO THE MAIN WELCOME SCREEN
const returnToWelcome = () => {
  runCurtainTransition(() => {
    setScreen('home');
    setShowWelcome(true);
  });
};


// SAVE THE PLAYER'S CURRENT SCREEN
useEffect(() => {
  try {
    localStorage.setItem('brainLettersCurrentScreen', screen);
  } catch (error) {
    console.warn('Could not save current screen:', error);
  }
}, [screen]);
  const [settings, setSettings] = useState(getSavedSettings);
  
  // CONTROL STARTUP SPLASH AND WELCOME SCREENS
const [showSplash, setShowSplash] = useState(true);
const [showWelcome, setShowWelcome] = useState(false);
// HANDLE PHONE / BROWSER BACK BUTTON
useEffect(() => {
  const handleBrowserBack = () => {
    if (!showWelcome) {
      returnToWelcome();
    }
  };

  window.addEventListener('popstate', handleBrowserBack);

  return () => {
    window.removeEventListener('popstate', handleBrowserBack);
  };
}, [showWelcome]);

useEffect(() => {
  const splashTimer = setTimeout(() => {
    setShowSplash(false);
    setShowWelcome(true);
  }, 3000);

  return () => clearTimeout(splashTimer);
}, []);
 
// CONTROL BACKGROUND MUSIC
useEffect(() => {
  if (settings.backgroundMusic) {
    if (backgroundMusic.paused) {
      startBackgroundMusic().catch(() => {});
    }
  } else {
    stopBackgroundMusic();
  }
}, [settings.backgroundMusic]);



// UNLOCK BACKGROUND MUSIC AFTER PLAYER INTERACTION
useEffect(() => {
  if (!settings.backgroundMusic) return;

  const handleInteraction = async () => {
    try {
      await startBackgroundMusic();

      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    } catch (error) {
      console.warn('Background music is waiting for interaction:', error);
    }
  };

  window.addEventListener('pointerdown', handleInteraction);
  window.addEventListener('keydown', handleInteraction);

  return () => {
    window.removeEventListener('pointerdown', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };
}, [settings.backgroundMusic]);



  const currentLevel = useMemo(
    () => generateLevel(levelIndex + 1),
    [levelIndex]
  );

  const WORDS = currentLevel.words;

  const [letters, setLetters] = useState(currentLevel.letters);

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [liveWord, setLiveWord] = useState('');
  const [extraWords, setExtraWords] = useState(
  initialGame.levelProgress?.[initialGame.levelIndex]?.extraWords || []
);
  const [extraWordsOpen, setExtraWordsOpen] = useState(false);

  const [levelCompleted, setLevelCompleted] = useState(
    initialGame.completedLevels.includes(initialGame.levelIndex)
  );

  const [message, setMessage] = useState('');
  const [pointerPosition, setPointerPosition] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);

  const wheelRef = useRef(null);
  const svgRef = useRef(null);
  const activePointer = useRef(null);
  const currentSelection = useRef([]);
  const extraWordsRef = useRef(null);
  const menuRef = useRef(null);

  // SAVE CURRENT LEVEL'S ANSWERS, HINTS AND EXTRA WORDS
useEffect(() => {
  setLevelProgress((previous) => ({
    ...previous,
    [levelIndex]: {
      ...previous[levelIndex],
      foundWords,
      hintReveals,
      extraWords
    }
  }));
}, [levelIndex, foundWords, hintReveals, extraWords]);

  // SAVE ALL MAIN GAME PROGRESS
  useEffect(() => {
    try {
      localStorage.setItem(
        'brainLettersSave',
        JSON.stringify({
          coins,
extraWordCoins,
levelIndex,
highestLevelIndex,
          foundWords,
          hintReveals,
          completedLevels,
          levelProgress,
          rewardHistory,
          achievementStages
        })
      );
    } catch (error) {
      console.error('Could not save game:', error);
    }
 }, [
  coins,
  extraWordCoins,
  levelIndex,
  highestLevelIndex,
  foundWords,
  hintReveals,
  completedLevels,
  levelProgress,
  rewardHistory,
  achievementStages
]);

  // SAVE SETTINGS
useEffect(() => {
  try {
    localStorage.setItem(
      SETTINGS_SAVE_KEY,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('Could not save settings:', error);
  }
}, [settings]);

  // CLOSE EXTRA WORDS WHEN CLICKING OUTSIDE
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        extraWordsRef.current &&
        !extraWordsRef.current.contains(event.target)
      ) {
        setExtraWordsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, []);

  // CLOSE MENU WHEN CLICKING OUTSIDE
  useEffect(() => {
    const handleMenuOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleMenuOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', handleMenuOutsideClick);
    };
  }, []);

  // CONVERT SCREEN COORDINATES TO SVG COORDINATES
const getSvgPoint = (clientX, clientY) => {
  if (!svgRef.current) return null;

  const svg = svgRef.current;
  const matrix = svg.getScreenCTM();

  if (!matrix) return null;

  const point = svg.createSVGPoint();

  point.x = clientX;
  point.y = clientY;

  const svgPoint = point.matrixTransform(matrix.inverse());

  return {
    x: svgPoint.x,
    y: svgPoint.y
  };
};

// GET THE EXACT CENTRE OF A LETTER BUTTON
const getLetterPosition = (index) => {
  if (!wheelRef.current || !svgRef.current) return null;

  const button = wheelRef.current.querySelector(
    `[data-letter-index="${index}"]`
  );

  if (!button) return null;

  const rect = button.getBoundingClientRect();

  return getSvgPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
};

  // START SELECTING LETTERS
  const selectLetter = (letter, index, pointerId) => {
    if (activePointer.current !== null || levelCompleted) return;

    activePointer.current = pointerId;

    const firstLetter = [{ letter, index }];

    currentSelection.current = firstLetter;

    setSelectedLetters(firstLetter);
    setLiveWord(letter);
    setPointerPosition(getLetterPosition(index));
    setMessage('');
  };

  // ADD ANOTHER LETTER
  const addLetter = (letter, index, pointerId) => {
    if (activePointer.current !== pointerId) return;

    const alreadySelected = currentSelection.current.some(
      (item) => item.index === index
    );

        if (alreadySelected) return;

    if (settings.soundEffects) {
      playGameSound('select');
    }

    const updatedSelection = [
      ...currentSelection.current,
      { letter, index }
    ];

    currentSelection.current = updatedSelection;
    setSelectedLetters(updatedSelection);

    setLiveWord(
      updatedSelection.map((item) => item.letter).join('')
    );
  };

  // TRACK POINTER MOVEMENT
  useEffect(() => {
    const handlePointerMove = (event) => {
      if (activePointer.current !== event.pointerId) return;
      if (!wheelRef.current || !svgRef.current) return;

      const svgRect = svgRef.current.getBoundingClientRect();

      setPointerPosition(
  getSvgPoint(event.clientX, event.clientY)
);

      const element = document.elementFromPoint(
        event.clientX,
        event.clientY
      );

      const letterButton = element?.closest('[data-letter-index]');

      if (letterButton && wheelRef.current.contains(letterButton)) {
        const index = Number(letterButton.dataset.letterIndex);
        const letter = letters[index];

        if (letter !== undefined) {
          addLetter(letter, index, event.pointerId);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [letters]);

  // VALIDATE WORD WHEN POINTER IS RELEASED
  useEffect(() => {
    const finishWord = (event) => {
      if (activePointer.current !== event.pointerId) return;

      activePointer.current = null;

      const word = currentSelection.current
        .map((item) => item.letter)
        .join('');

      currentSelection.current = [];

      setSelectedLetters([]);
      setPointerPosition(null);
      setLiveWord('');

      if (!word || levelCompleted) return;

      if (WORDS.includes(word)) {
        if (foundWords.includes(word)) {
  setMessage('You have already found this word!');
  return;
}

if (settings.soundEffects) {
  playGameSound('correct');
}

const updatedFoundWords = [...foundWords, word];

        setFoundWords(updatedFoundWords);

        const allAnswersCompleted = WORDS.every(
          (requiredWord) => updatedFoundWords.includes(requiredWord)
        );

        if (allAnswersCompleted) {
          if (!completedLevels.includes(levelIndex)) {
            setCoins((previous) => previous + LEVEL_REWARD);

            recordReward(
              'level',
              LEVEL_REWARD,
              `Level ${String(levelIndex + 1).padStart(2, '0')} completed`
            );

            setCompletedLevels((previous) =>
              previous.includes(levelIndex)
                ? previous
                : [...previous, levelIndex]
            );
          }

          if (settings.soundEffects) {
  playGameSound('complete');
}
          setLevelCompleted(true);

          setMessage(
            `Level ${String(levelIndex + 1).padStart(2, '0')} completed!${
              completedLevels.includes(levelIndex)
                ? ''
                : ` You earned ${LEVEL_REWARD} coins!`
            }`
          );
        } else {
          setMessage(`Excellent! ${word} discovered!`);
        }

        return;
      }

      // CHECK EXTRA WORDS
      const isEnglishWord = GAME_WORD_SET.has(word.toLowerCase());
      const canBeFormed = canFormWord(word, letters);

      if (isEnglishWord && canBeFormed) {
        const allowedWordLengths = [
          ...new Set(WORDS.map((answer) => answer.length))
        ];

        if (!allowedWordLengths.includes(word.length)) {
          setMessage("This word doesn't match the level's word length!");
          return;
        }

        if (extraWords.includes(word)) {
          setMessage(`${word} is already in your extra words!`);
          return;
        }

       if (settings.soundEffects) {
  playGameSound('extra');
}

setExtraWords((previous) => [...previous, word]);

// AWARD 3 EXTRA WORD COINS
setExtraWordCoins((previous) => previous + 3);

setMessage(`Great discovery! ${word} added to your extra words! +3 coins`);
return;
      }

      if (settings.soundEffects) {
  playGameSound('wrong');
}

setMessage('Not quite! Try another word.');
    };

    const cancelWord = (event) => {
      if (activePointer.current !== event.pointerId) return;

      activePointer.current = null;
      currentSelection.current = [];

      setSelectedLetters([]);
      setPointerPosition(null);
      setLiveWord('');
    };

    window.addEventListener('pointerup', finishWord);
    window.addEventListener('pointercancel', cancelWord);

    return () => {
      window.removeEventListener('pointerup', finishWord);
      window.removeEventListener('pointercancel', cancelWord);
    };
  }, [
    foundWords,
    extraWords,
    levelIndex,
    levelCompleted,
    completedLevels,
        WORDS,
    letters,
    recordReward,
    settings.soundEffects
  ]);

  // SHUFFLE LETTERS
  const shuffleLetters = () => {
    if (activePointer.current !== null || levelCompleted) return;

    setLetters((previous) => shuffleLettersArray(previous));
    setMessage('Letters shuffled!');
  };

  // USE HINT
  const useHint = () => {
    if (levelCompleted) return;

    if (activePointer.current !== null) {
      setMessage('Finish your current swipe before using a hint.');
      return;
    }

    if (coins < HINT_COST) {
      setMessage(`You need ${HINT_COST} coins to use a hint.`);
      return;
    }

    const availableWords = WORDS.filter((word) => {
      if (foundWords.includes(word)) return false;

      const revealedPositions = hintReveals[word] || [];

      return revealedPositions.length < word.length;
    });

    if (availableWords.length === 0) {
      setMessage('All available hints have been revealed!');
      return;
    }

    const wordToReveal =
      availableWords[
        Math.floor(Math.random() * availableWords.length)
      ];

    const revealedPositions = hintReveals[wordToReveal] || [];

    const hiddenPositions = wordToReveal
      .split('')
      .map((_, index) => index)
      .filter((index) => !revealedPositions.includes(index));

    const randomPosition =
      hiddenPositions[
        Math.floor(Math.random() * hiddenPositions.length)
      ];

    setHintReveals((previous) => ({
      ...previous,
      [wordToReveal]: [
        ...(previous[wordToReveal] || []),
        randomPosition
      ]
    }));

    setCoins((previous) => previous - HINT_COST);

    setMessage('Hint revealed! One letter has been revealed.');
  };

  // SELECT AN UNLOCKED LEVEL
const selectLevel = (targetIndex) => {
  if (targetIndex < 0 || targetIndex > highestLevelIndex) return;

  if (targetIndex === levelIndex) {
    setLevelsOpen(false);
    return;
  }

  runCurtainTransition(() => {
    setLevelProgress((previous) => ({
      ...previous,
      [levelIndex]: {
        foundWords,
        hintReveals,
        extraWords
      }
    }));

    const selectedLevel = generateLevel(targetIndex + 1);
    const savedProgress = levelProgress[targetIndex];

    const shouldRestart = completedLevels.includes(targetIndex);

    const restoredWords = shouldRestart
      ? []
      : savedProgress?.foundWords || [];

    const restoredHints = shouldRestart
      ? {}
      : savedProgress?.hintReveals || {};

    setLevelIndex(targetIndex);
    setLetters(selectedLevel.letters);
    setFoundWords(restoredWords);
    setHintReveals(restoredHints);

    setExtraWords(
      shouldRestart ? [] : savedProgress?.extraWords || []
    );

    setExtraWordsOpen(false);
    setSelectedLetters([]);
    setPointerPosition(null);
    setLiveWord('');

    setLevelCompleted(false);
    setMessage(
      `Welcome to Level ${String(targetIndex + 1).padStart(2, '0')}!`
    );

    setLevelsOpen(false);

    currentSelection.current = [];
    activePointer.current = null;
  });
};

  const goToNextLevel = () => {
  if (!levelCompleted) return;

  runCurtainTransition(() => {
    if (levelIndex < highestLevelIndex) {
      const targetIndex = highestLevelIndex;
      const targetLevel = generateLevel(targetIndex + 1);
      const savedProgress = levelProgress[targetIndex];

      setLevelProgress((previous) => ({
        ...previous,
        [levelIndex]: {
          foundWords,
          hintReveals
        }
      }));

      setLevelIndex(targetIndex);
      setLetters(targetLevel.letters);
      setFoundWords(savedProgress?.foundWords || []);
      setHintReveals(savedProgress?.hintReveals || {});
      setExtraWords(savedProgress?.extraWords || []);
      setLevelCompleted(false);
      setExtraWordsOpen(false);
      setSelectedLetters([]);
      setPointerPosition(null);
      setLiveWord('');

      setMessage(
        `Welcome back to Level ${String(targetIndex + 1).padStart(2, '0')}!`
      );

      currentSelection.current = [];
      activePointer.current = null;
      return;
    }

    const nextIndex = highestLevelIndex + 1;
    const nextLevel = generateLevel(nextIndex + 1);

    setLevelProgress((previous) => ({
      ...previous,
      [levelIndex]: {
        foundWords,
        hintReveals
      }
    }));

    setLevelIndex(nextIndex);
    setHighestLevelIndex(nextIndex);
    setLetters(nextLevel.letters);
    setFoundWords([]);
    setHintReveals({});
    setExtraWords([]);
    setExtraWordsOpen(false);
    setSelectedLetters([]);
    setPointerPosition(null);
    setLiveWord('');
    setLevelCompleted(false);

    setMessage(
      `Welcome to Level ${String(nextIndex + 1).padStart(2, '0')}!`
    );

    currentSelection.current = [];
    activePointer.current = null;
  });
};

  // CONNECTING LINE
  const selectedPositions = selectedLetters
    .map((item) => getLetterPosition(item.index))
    .filter(Boolean);

  const linePoints = [...selectedPositions];

  if (pointerPosition && linePoints.length > 0) {
    linePoints.push(pointerPosition);
  }

  const linePath = linePoints
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    )
    .join(' ');

  const handleMenuItemClick = (destination) => {
  navigateTo(destination);
  setMenuOpen(false);
};
if (showSplash) {
  return (
    <div className="splash-screen">
      <img
        src="/brain-letters-icon.png"
        alt="Brain Letters"
        className="splash-logo"
      />
      <h1>BRAIN LETTERS</h1>
      <p>Connect. Think. Conquer.</p>
    </div>
  );
}

if (showWelcome) {
  return (
    <main
      className="game-container welcome-screen"
      data-theme={settings.theme || 'vintage-parchment'}
    >
      {/* CURTAIN PAGE TRANSITION */}
{curtainPhase !== 'idle' && (
  <div
    className={`curtain-transition ${curtainPhase}`}
    aria-hidden="true"
  >
    <div className="curtain-panel curtain-panel-left" />
    <div className="curtain-panel curtain-panel-right" />
    <div className="curtain-seam" />
  </div>
)}
            {/* CURTAIN PAGE TRANSITION */}
      {curtainPhase !== 'idle' && (
        <div
          className={`curtain-transition ${curtainPhase}`}
          aria-hidden="true"
        >
          <div className="curtain-panel curtain-panel-left" />
          <div className="curtain-panel curtain-panel-right" />
          <div className="curtain-seam" />
        </div>
      )}
      <div className="welcome-content">

        <div className="welcome-brand">
          <img
            src="/brain-letters-icon.png"
            alt="Brain Letters"
            className="welcome-logo"
          />

          <span>WELCOME TO</span>
          <h1>BRAIN LETTERS</h1>
          <p>CONNECT. THINK. CONQUER.</p>
        </div>

        <div className="welcome-hero">
          <div className="welcome-orbit">
            <span>B</span>
            <span>R</span>
            <span>A</span>
            <span>I</span>
            <span>N</span>
          </div>

          <h2>Challenge Your Mind.</h2>
          <p>
            Connect letters, discover hidden words,
            and sharpen your mind one puzzle at a time.
          </p>
        </div>

        <div className="welcome-actions">
          <button
            type="button"
            className="welcome-play-button"
            onClick={() => {
  window.history.pushState(
    { brainLettersGame: true },
    '',
    window.location.href
  );

  runCurtainTransition(() => {
    setScreen('home');
    setShowWelcome(false);
  });
}}
          >
            <span>▶</span>
            PLAY NOW
          </button>

          <button
            type="button"
            className="welcome-daily-button"
            onClick={() => {
  runCurtainTransition(() => {
    setScreen('daily');
    setShowWelcome(false);
  });
}}
          >
            🎯 DAILY CHALLENGE
          </button>
        </div>

        <p className="welcome-footer">
          YOUR WORD ADVENTURE STARTS HERE
        </p>

      </div>
    </main>
  );
}

  return (
    <main
  className="game-container"
  data-theme={settings.theme || 'vintage-parchment'}
>
        {/* CURTAIN PAGE TRANSITION */}
      {curtainPhase !== 'idle' && (
        <div
          className={`curtain-transition ${curtainPhase}`}
          aria-hidden="true"
        >
          <div className="curtain-panel curtain-panel-left" />
          <div className="curtain-panel curtain-panel-right" />
          <div className="curtain-seam" />
        </div>
      )}
      {/* HEADER */}
      <header className="top-bar">
        <div className="brand">
          <img
  src="/brain-letters-icon.png"
  alt="Brain Letters"
  className="brand-icon"
/>

          <div>
            <h1>BRAIN LETTERS</h1>
            <p>Connect. Think. Conquer.</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="coin-display">
            <span>🪙</span>
            <strong>{coins}</strong>
            <button type="button" aria-label="Add coins">+</button>
          </div>

          <div className="menu-container" ref={menuRef}>
            <button
              type="button"
              className={`menu-toggle ${menuOpen ? 'menu-active' : ''}`}
              onClick={() => setMenuOpen((previous) => !previous)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            {menuOpen && (
              <div className="menu-panel">
                <button
                  type="button"
                  className={`menu-item ${screen === 'home' ? 'active' : ''}`}
                  onClick={() => {
  setMenuOpen(false);
  returnToWelcome();
}}
                >
                  <span>⌂</span>
                  <span>Home</span>
                </button>

                <button
                  type="button"
                  className={`menu-item ${screen === 'daily' ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick('daily')}
                >
                  <span>🎯</span>
                  <span>Daily Challenge</span>
                </button>

                <button
                  type="button"
                  className={`menu-item ${screen === 'rewards' ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick('rewards')}
                >
                  <span>🏆</span>
                  <span>Rewards</span>
                </button>
<div className="menu-themes-wrapper">
  <button
    type="button"
    className={`menu-item ${themesOpen ? 'active' : ''}`}
    onClick={() => setThemesOpen((previous) => !previous)}
    aria-expanded={themesOpen}
  >
    <span>🎨</span>
    <span>Themes</span>
    <span className="menu-theme-arrow">
      {themesOpen ? '▴' : '▾'}
    </span>
  </button>

  {themesOpen && (
    <div className="menu-theme-dropdown">
      {GAME_THEMES.map((theme) => (
        <button
          type="button"
          key={theme.id}
          className={`menu-theme-option ${
            settings.theme === theme.id ? 'selected' : ''
          }`}
          onClick={() => {
            setSettings((previous) => ({
              ...previous,
              theme: theme.id
            }));
            setThemesOpen(false);
            setMenuOpen(false);
          }}
          aria-label={`Select ${theme.name} theme`}
          title={theme.name}
        >
          <div className="theme-card-art" data-theme={theme.id}>
            {settings.theme === theme.id && (
              <span className="theme-card-check">✓</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )}
</div>
                <button
  type="button"
  className={`menu-item ${screen === 'settings' ? 'active' : ''}`}
  onClick={() => handleMenuItemClick('settings')}
>
  <span>⚙</span>
  <span>Settings</span>
</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {screen === 'daily' ? (
  <DailyChallenge
  coins={coins}
  setCoins={setCoins}
  onHome={() => navigateTo('home')}
  onReward={recordReward}
  settings={settings}
/>
) : screen === 'rewards' ? (
  <RewardsPage
    coins={coins}
    completedLevels={completedLevels}
    highestLevelIndex={highestLevelIndex}
    rewardHistory={rewardHistory}
      achievementStages={achievementStages}
  onClaimAchievement={handleClaimAchievement}
    onHome={() => navigateTo('home')}
  />
) : screen === 'settings' ? (
  <SettingsPage
    settings={settings}
    setSettings={setSettings}
    onHome={() => navigateTo('home')}
    onAbout={() => navigateTo('about')}
  />
) : screen === 'about' ? (
  <AboutPage
    onBack={() => navigateTo('settings')}
  />
) : screen === 'themes' ? (
  <ThemesPage
    settings={settings}
    setSettings={setSettings}
    onHome={() => navigateTo('home')}
  />
) : (
  <section className="game-content page-transition">
          {/* MAIN LEVEL SELECTOR */}
          <div className="level-heading">
            <button
              type="button"
              className="levels-toggle"
              onClick={() => setLevelsOpen((previous) => !previous)}
              aria-expanded={levelsOpen}
            >
              <span>
                LEVEL {String(levelIndex + 1).padStart(2, '0')}
              </span>

              <span className="level-dropdown-arrow">
                {levelsOpen ? '▲' : '▼'}
              </span>
            </button>

            {levelsOpen && (
              <div className="levels-panel">
                <h3>SELECT LEVEL</h3>

                <div className="levels-grid">
                  {Array.from(
                    { length: highestLevelIndex + 1 },
                    (_, index) => index
                  ).map((index) => {
                    const isCurrent = index === levelIndex;
                    const isCompleted = completedLevels.includes(index);

                    return (
                      <button
                        type="button"
                        key={index}
                        className={`level-option ${
                          isCurrent ? 'current-level' : ''
                        } ${isCompleted ? 'completed-level' : ''}`}
                        onClick={() => selectLevel(index)}
                      >
                        {index + 1}

                        {isCompleted && (
                          <span className="level-check">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PROGRESS */}
          <div className="progress-area">
            <div className="progress-label">
              <span>LEVEL PROGRESS</span>
              <strong>
                {foundWords.length} / {WORDS.length} WORDS
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${(foundWords.length / WORDS.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* CROSSWORD BOARD */}
          <div className="crossword">
            {WORDS.map((word) => (
              <div className="word-row" key={word}>
                {word.split('').map((letter, index) => (
                  <div className="puzzle-cell" key={index}>
                    {foundWords.includes(word) ||
                    (hintReveals[word] || []).includes(index)
                      ? letter
                      : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="puzzle-wheel-divider"></div>

          {/* EXTRA WORDS */}
          <div className="extra-words-area" ref={extraWordsRef}>
            <button
              type="button"
              className="extra-words-button"
              onClick={() => setExtraWordsOpen((previous) => !previous)}
              title="Extra words"
              aria-label="View extra words"
              aria-expanded={extraWordsOpen}
            >
              <span>🔤</span>

              {extraWords.length > 0 && (
                <span className="extra-words-count">
                  {extraWords.length}
                </span>
              )}
            </button>

            {extraWordsOpen && (
              <div className="extra-words-panel">
  <h3>Discovered Words</h3>

  <div className="extra-word-coins">
    <span>Extra Word Coins</span>
    <strong>🪙 {extraWordCoins}</strong>
  </div>

  {extraWordCoins > 0 && (
    <button
      type="button"
      className="collect-extra-coins-button"
      onClick={() => {
        const amount = extraWordCoins;

        setCoins((previous) => previous + amount);
        setExtraWordCoins(0);

        recordReward(
          'extra-words',
          amount,
          'Collected extra word coins'
        );

        if (settings.soundEffects) {
          playGameSound('correct');
        }

        setMessage(`${amount} extra word coins collected!`);
      }}
    >
      Collect {extraWordCoins} Coins
    </button>
  )}

                {extraWords.length === 0 ? (
                  <p>No extra words discovered yet.</p>
                ) : (
                  <div className="extra-words-list">
                    {extraWords.map((word) => (
                      <span key={word}>{word}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LETTER WHEEL AND LIVE WORD PREVIEW */}
          <div className="wheel-controls-layout">
            <div className="live-word-preview" aria-live="polite">
              {liveWord && <span>{liveWord}</span>}
            </div>

            <div className="letter-wheel" ref={wheelRef}>
              <svg
                ref={svgRef}
                className="connecting-line"
                width="100%"
                height="100%"
              >
                <defs>
                  <linearGradient
                    id="lineGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#24C8FF" />
                    <stop offset="100%" stopColor="#8855FF" />
                  </linearGradient>

                  <filter id="lineGlow">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {linePath && (
                  <>
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#lineGlow)"
                      opacity="0.75"
                    />

                    <path
                      d={linePath}
                      fill="none"
                      stroke="#42D9FF"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {selectedPositions.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#FFFFFF"
                    stroke="#42D9FF"
                    strokeWidth="4"
                  />
                ))}
              </svg>

              {letters.map((letter, index) => {
                const isSelected = selectedLetters.some(
                  (item) => item.index === index
                );

                const angle =
                  (index / letters.length) * Math.PI * 2 - Math.PI / 2;

                const radiusX = 88;
                const radiusY = 82;

                return (
                  <button
                    type="button"
                    data-letter-index={index}
                    className={`letter-button ${
                      isSelected ? 'selected' : ''
                    }`}
                    style={{
                      left: `calc(50% + ${Math.cos(angle) * radiusX}px)`,
                      top: `calc(50% + ${Math.sin(angle) * radiusY}px)`
                    }}
                    key={`${letter}-${index}`}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      selectLetter(letter, index, event.pointerId);
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* SIDE CONTROLS */}
            <div className="game-controls side-controls">
              <button
                type="button"
                className="icon-button hint-button"
                onClick={useHint}
                title={`Use hint — ${HINT_COST} coins`}
                aria-label={`Use hint for ${HINT_COST} coins`}
                disabled={levelCompleted}
              >
                <span className="hint-icon">💡</span>
                <span className="hint-cost">{HINT_COST}</span>
              </button>

              <button
                type="button"
                className="icon-button shuffle-button"
                onClick={shuffleLetters}
                title="Shuffle letters"
                aria-label="Shuffle letters"
                disabled={levelCompleted}
              >
                🔀
              </button>
            </div>
          </div>

          {/* GAME MESSAGE */}
          <div className="game-message">{message}</div>

          {/* NEXT LEVEL */}
          {levelCompleted && (
            <div className="next-level-area">
              <button
                type="button"
                className="next-level-button"
                onClick={goToNextLevel}
              >
                {levelIndex < highestLevelIndex
                  ? 'RETURN TO LATEST LEVEL'
                  : 'NEXT LEVEL'}
                <span>➜</span>
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
