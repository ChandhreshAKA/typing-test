'use strict';

/* =============================================
   MONKEYTYPE CLONE — script.js
   ============================================= */

// ─── Word Banks ────────────────────────────
const WORDS_EN = [
  "the","be","to","of","and","a","in","that","have","it","for","not","on","with",
  "he","as","you","do","at","this","but","his","by","from","they","we","say","her",
  "she","or","an","will","my","one","all","would","there","their","what","so","up",
  "out","if","about","who","get","which","go","me","when","make","can","like","time",
  "no","just","him","know","take","people","into","year","your","good","some","could",
  "them","see","other","than","then","now","look","only","come","its","over","think",
  "also","back","after","use","two","how","our","work","first","well","way","even",
  "new","want","because","any","these","give","day","most","us","between","need",
  "large","often","hand","high","place","hold","turn","move","live","where","right",
  "world","still","try","kind","open","seem","together","next","white","children",
  "begin","got","walk","example","ease","paper","group","always","music","those",
  "both","mark","book","letter","until","mile","river","car","feet","care","second",
  "enough","plain","girl","usual","young","ready","above","ever","red","list","though",
  "feel","talk","bird","soon","body","dog","family","direct","pose","left","front",
  "keep","close","night","heart","strong","real","question","color","study","number",
  "answer","become","across","every","learn","plant","cover","food","sun","four",
  "thought","let","eye","never","last","door","city","tree","cross","since","hard",
  "start","might","story","saw","far","sea","draw","late","run","press","life","few",
  "north","surface","deep","moon","island","foot","system","busy","test","record",
  "boat","common","gold","plane","age","wonder","laugh","thousand","ago","ran","check",
  "game","shape","hot","miss","brought","heat","snow","bring","yes","fill","east",
  "paint","language","among","grand","ball","yet","wave","drop","voice","power","town",
  "fine","drive","object","short","string","stone","act","farm","pull","log","rest",
  "hope","develop","view","tool","main","fresh","floor","ring","job","equal","master",
  "wide","climb","warm","reason","expect","practice","love","sleep","skill","fast",
  "slow","simple","clear","light","dark","cold","hot","long","short","old","young",
  "happy","sad","new","old","small","big","open","close","right","wrong"
];

const PUNCTUATION = ['.',',','!','?',';',':','"',"'",'(',')','-'];
const NUMBERS = ['0','1','2','3','4','5','6','7','8','9'];

// ─── Themes ────────────────────────────────
const THEMES = [
  { name: 'serika dark',    id: 'serika-dark',    bg:'#323437', main:'#e2b714', sub:'#646669', text:'#d1d0c5' },
  { name: 'dark',           id: 'dark',           bg:'#1a1a1a', main:'#00bfff', sub:'#555',    text:'#e2e2e2' },
  { name: 'light',          id: 'light',          bg:'#e1e1e3', main:'#e2b714', sub:'#aaaaaa', text:'#2c2e31' },
  { name: 'nord',           id: 'nord',           bg:'#2e3440', main:'#88c0d0', sub:'#4c566a', text:'#d8dee9' },
  { name: 'dracula',        id: 'dracula',        bg:'#282a36', main:'#ff79c6', sub:'#6272a4', text:'#f8f8f2' },
  { name: 'catppuccin',     id: 'catppuccin',     bg:'#1e1e2e', main:'#cba6f7', sub:'#585b70', text:'#cdd6f4' },
  { name: 'solarized dark', id: 'solarized-dark', bg:'#002b36', main:'#268bd2', sub:'#586e75', text:'#839496' },
  { name: 'monokai',        id: 'monokai',        bg:'#272822', main:'#a6e22e', sub:'#75715e', text:'#f8f8f2' },
  { name: 'gruvbox dark',   id: 'gruvbox-dark',   bg:'#282828', main:'#fabd2f', sub:'#928374', text:'#ebdbb2' },
  { name: 'rose pine',      id: 'rose-pine',      bg:'#191724', main:'#ebbcba', sub:'#6e6a86', text:'#e0def4' },
];

// ─── State ──────────────────────────────────
const state = {
  mode: 'time',       // time | words | quote | zen | custom
  timeLimit: 30,
  wordCount: 50,
  punctuation: false,
  numbers: false,
  theme: localStorage.getItem('mt_theme') || 'serika-dark',

  words: [],
  wordEls: [],
  charEls: [],

  currentWordIdx: 0,
  currentCharIdx: 0,
  typedHistory: [],   // array of typed strings per word
  currentInput: '',

  started: false,
  finished: false,
  focused: false,

  timer: null,
  timeLeft: 30,
  elapsed: 0,

  correctChars: 0,
  incorrectChars: 0,
  extraChars: 0,
  missedChars: 0,

  wpmHistory: [],   // [{sec, wpm}]
  rawHistory: [],
  errHistory: [],

  caretEl: null,
};

// ─── DOM ────────────────────────────────────
const $ = id => document.getElementById(id);
const wordsDisplay   = $('wordsDisplay');
const typingInput    = $('typingInput');
const liveStats      = $('liveStats');
const liveTimer      = $('liveTimer');
const outOfFocus     = $('outOfFocus');
const testSection    = $('testSection');
const resultSection  = $('resultSection');
const capsWarning    = $('capsWarning');
const cmdOverlay     = $('cmdOverlay');
const cmdInput       = $('cmdInput');
const cmdResults     = $('cmdResults');
const themeOverlay   = $('themeOverlay');
const themeSearch    = $('themeSearch');
const themeList      = $('themeList');

// ─── Helpers ────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateWordList(n = 100) {
  let pool = shuffle(WORDS_EN);
  const out = [];
  while (out.length < n) {
    out.push(...pool.slice(0, Math.min(pool.length, n - out.length)));
    pool = shuffle(WORDS_EN);
  }
  let words = out.slice(0, n);

  if (state.numbers) {
    words = words.map(w => {
      if (Math.random() < 0.2) return NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
      return w;
    });
  }
  if (state.punctuation) {
    words = words.map(w => {
      if (Math.random() < 0.15) return w + PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
      if (Math.random() < 0.05) return w.charAt(0).toUpperCase() + w.slice(1);
      return w;
    });
  }
  return words;
}

// ─── Render Words ────────────────────────────
function renderWords() {
  wordsDisplay.innerHTML = '';
  state.wordEls = [];
  state.charEls = [];

  state.words.forEach((word, wi) => {
    const wordEl = document.createElement('div');
    wordEl.className = 'word';
    wordEl.dataset.index = wi;

    const chars = [];
    word.split('').forEach((ch, ci) => {
      const charEl = document.createElement('span');
      charEl.className = 'char';
      charEl.textContent = ch;
      wordEl.appendChild(charEl);
      chars.push(charEl);
    });

    wordsDisplay.appendChild(wordEl);
    state.wordEls.push(wordEl);
    state.charEls.push(chars);
  });

  // Create caret
  if (state.caretEl) state.caretEl.remove();
  const caret = document.createElement('div');
  caret.className = 'caret';
  wordsDisplay.appendChild(caret);
  state.caretEl = caret;

  state.typedHistory = state.words.map(() => null);
  updateCaret();
}

// ─── Caret ───────────────────────────────────
function updateCaret() {
  const caret = state.caretEl;
  if (!caret) return;

  const wordEl = state.wordEls[state.currentWordIdx];
  if (!wordEl) return;

  const chars = state.charEls[state.currentWordIdx];
  let targetEl;

  if (state.currentCharIdx < chars.length) {
    targetEl = chars[state.currentCharIdx];
  } else {
    targetEl = chars[chars.length - 1];
  }

  if (!targetEl) return;

  const containerRect = wordsDisplay.getBoundingClientRect();
  const charRect = targetEl.getBoundingClientRect();

  const top = charRect.top - containerRect.top + wordsDisplay.scrollTop;
  const left = state.currentCharIdx < chars.length
    ? charRect.left - containerRect.left
    : charRect.right - containerRect.left;

  caret.style.top = top + 'px';
  caret.style.left = left + 'px';
  caret.style.height = charRect.height + 'px';

  // Scroll words if caret goes past line 2
  const caretLine = Math.floor(top / (charRect.height * 1.2));
  if (caretLine >= 2) {
    // Scroll one line up
    const lineH = charRect.height * 2.2;
    wordsDisplay.style.marginTop = `-${lineH}px`;
  }
}

// ─── Input Handling ──────────────────────────
document.addEventListener('keydown', handleKeydown);

function handleKeydown(e) {
  if (cmdOverlay.classList.contains('hidden') === false) return;
  if (themeOverlay.classList.contains('hidden') === false) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    resetTest();
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    openCommandLine();
    return;
  }
  if (e.key === 'CapsLock') return;

  if (!state.focused) return;

  if (state.finished) return;

  if (e.key === 'Backspace') {
    handleBackspace(e.ctrlKey);
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    handleSpace();
    return;
  }
  if (e.key.length === 1) {
    handleChar(e.key);
  }
}

function handleChar(ch) {
  if (!state.started) startTest();

  const word = state.words[state.currentWordIdx];
  const chars = state.charEls[state.currentWordIdx];

  state.currentInput += ch;

  if (state.currentCharIdx < word.length) {
    const charEl = chars[state.currentCharIdx];
    if (ch === word[state.currentCharIdx]) {
      charEl.className = 'char correct';
    } else {
      charEl.className = 'char incorrect';
    }
    state.currentCharIdx++;
  } else {
    // Extra character
    const extraEl = document.createElement('span');
    extraEl.className = 'char extra';
    extraEl.textContent = ch;
    state.wordEls[state.currentWordIdx].appendChild(extraEl);
    chars.push(extraEl);
    state.currentCharIdx++;
  }

  updateCaret();
}

function handleSpace() {
  if (state.currentInput.trim() === '' && !state.started) return;
  if (!state.started) startTest();
  if (state.currentWordIdx >= state.words.length) return;

  // Commit current word
  commitWord();

  state.currentWordIdx++;
  state.currentCharIdx = 0;
  state.currentInput = '';

  // Check if done (words mode)
  if (state.mode === 'words' && state.currentWordIdx >= state.words.length) {
    endTest();
    return;
  }

  // Load more words if needed
  if (state.currentWordIdx >= state.words.length - 20) {
    appendMoreWords(30);
  }

  updateCaret();
}

function handleBackspace(ctrl) {
  if (state.currentCharIdx === 0) {
    // Go back to previous word if freedom mode (simplified: always allow)
    if (state.currentWordIdx > 0 && state.typedHistory[state.currentWordIdx - 1] !== null) {
      state.currentWordIdx--;
      const prevTyped = state.typedHistory[state.currentWordIdx];
      state.typedHistory[state.currentWordIdx] = null;
      state.currentInput = prevTyped || '';
      state.currentCharIdx = state.currentInput.length;

      // Restore chars state
      const word = state.words[state.currentWordIdx];
      const chars = state.charEls[state.currentWordIdx];
      // Remove extras
      while (chars.length > word.length) {
        const extra = chars.pop();
        extra.remove();
      }
      // Re-apply styling
      state.currentInput.split('').forEach((ch, ci) => {
        if (ci < chars.length) {
          chars[ci].className = ch === word[ci] ? 'char correct' : 'char incorrect';
        }
      });
      // Clear from currentCharIdx onwards
      for (let i = state.currentCharIdx; i < chars.length; i++) {
        chars[i].className = 'char';
      }
      state.wordEls[state.currentWordIdx].classList.remove('error');
    }
    updateCaret();
    return;
  }

  if (ctrl) {
    // Delete whole word
    const word = state.words[state.currentWordIdx];
    const chars = state.charEls[state.currentWordIdx];
    while (chars.length > word.length) { chars.pop().remove(); }
    chars.forEach(ch => ch.className = 'char');
    state.currentInput = '';
    state.currentCharIdx = 0;
  } else {
    state.currentCharIdx--;
    state.currentInput = state.currentInput.slice(0, -1);
    const word = state.words[state.currentWordIdx];
    const chars = state.charEls[state.currentWordIdx];

    if (state.currentCharIdx >= word.length) {
      // Remove extra char
      const extra = chars.pop();
      extra.remove();
    } else {
      chars[state.currentCharIdx].className = 'char';
    }
  }
  updateCaret();
}

function commitWord() {
  const word = state.words[state.currentWordIdx];
  const typed = state.currentInput;
  state.typedHistory[state.currentWordIdx] = typed;

  // Check for error on word
  if (typed !== word) {
    state.wordEls[state.currentWordIdx].classList.add('error');
  }

  // Count chars
  const len = Math.max(typed.length, word.length);
  for (let i = 0; i < len; i++) {
    if (i < typed.length && i < word.length) {
      if (typed[i] === word[i]) state.correctChars++;
      else state.incorrectChars++;
    } else if (i < typed.length) {
      state.extraChars++;
      state.incorrectChars++;
    } else {
      state.missedChars++;
      state.incorrectChars++;
    }
  }
}

function appendMoreWords(n) {
  const newWords = generateWordList(n);
  newWords.forEach(word => {
    state.words.push(word);
    const wordEl = document.createElement('div');
    wordEl.className = 'word';
    wordEl.dataset.index = state.wordEls.length;

    const chars = [];
    word.split('').forEach(ch => {
      const charEl = document.createElement('span');
      charEl.className = 'char';
      charEl.textContent = ch;
      wordEl.appendChild(charEl);
      chars.push(charEl);
    });

    // Insert before caret
    wordsDisplay.insertBefore(wordEl, state.caretEl);
    state.wordEls.push(wordEl);
    state.charEls.push(chars);
    state.typedHistory.push(null);
  });
}

// ─── Timer ───────────────────────────────────
function startTest() {
  state.started = true;
  state.elapsed = 0;
  state.timeLeft = state.timeLimit;
  liveStats.classList.remove('hidden');

  let lastSec = 0;
  state.timer = setInterval(() => {
    state.elapsed++;

    if (state.mode === 'time') {
      state.timeLeft--;
      liveTimer.textContent = state.timeLeft;
      if (state.timeLeft <= 5) liveTimer.classList.add('warning');
      if (state.timeLeft <= 0) { endTest(); return; }
    } else {
      // words/zen mode: count up
      liveTimer.textContent = state.elapsed;
    }

    // Record WPM per second
    const wpm = calcWpm(state.elapsed);
    const raw = calcRaw(state.elapsed);
    if (state.elapsed > lastSec) {
      state.wpmHistory.push({ sec: state.elapsed, wpm });
      state.rawHistory.push({ sec: state.elapsed, raw });
      lastSec = state.elapsed;
    }
  }, 1000);
}

function calcWpm(elapsed) {
  if (elapsed <= 0) return 0;
  return Math.round((state.correctChars / 5) / (elapsed / 60));
}
function calcRaw(elapsed) {
  if (elapsed <= 0) return 0;
  const all = state.correctChars + state.incorrectChars;
  return Math.round((all / 5) / (elapsed / 60));
}

// ─── End Test ────────────────────────────────
function endTest() {
  clearInterval(state.timer);
  state.finished = true;
  state.started = false;

  // Commit last word if partially typed
  if (state.currentInput.length > 0) commitWord();

  const elapsed = state.elapsed || 1;
  const wpm = calcWpm(elapsed);
  const raw = calcRaw(elapsed);
  const total = state.correctChars + state.incorrectChars;
  const acc = total > 0 ? Math.round((state.correctChars / total) * 100) : 100;
  const consistency = calcConsistency();

  // Save best
  const bestKey = `mt_best_${state.mode}_${state.timeLimit}`;
  const prev = parseInt(localStorage.getItem(bestKey) || '0');
  if (wpm > prev) localStorage.setItem(bestKey, wpm);

  showResults({ wpm, raw, acc, elapsed, consistency });
}

function calcConsistency() {
  const wpms = state.wpmHistory.map(h => h.wpm);
  if (wpms.length < 2) return 100;
  const mean = wpms.reduce((a,b) => a+b, 0) / wpms.length;
  const variance = wpms.reduce((a,b) => a + (b-mean)**2, 0) / wpms.length;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) : 0;
  return Math.max(0, Math.round((1 - cv) * 100));
}

// ─── Show Results ────────────────────────────
function showResults({ wpm, raw, acc, elapsed, consistency }) {
  testSection.classList.add('hidden');
  resultSection.classList.remove('hidden');

  $('resWpm').textContent = wpm;
  $('resAcc').textContent = acc + '%';
  $('resRaw').textContent = raw;
  $('resChars').textContent =
    `${state.correctChars}/${state.incorrectChars}/${state.extraChars}/${state.missedChars}`;
  $('resConsistency').textContent = consistency + '%';
  $('resTime').textContent = elapsed + 's';
  $('resTestType').textContent = `${state.mode} ${state.mode === 'time' ? state.timeLimit : state.wordCount}`;

  drawChart();
}

// ─── Chart ───────────────────────────────────
function drawChart() {
  const canvas = $('resultChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 140 * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = '140px';
  ctx.scale(dpr, dpr);

  const W = rect.width;
  const H = 140;
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };

  const wpmData = state.wpmHistory.map(h => h.wpm);
  const rawData = state.rawHistory.map(h => h.raw);

  const cs = getComputedStyle(document.documentElement);
  const mainColor = cs.getPropertyValue('--main').trim();
  const subColor = cs.getPropertyValue('--sub').trim();
  const bgColor = cs.getPropertyValue('--sub-alt').trim();
  const textColor = cs.getPropertyValue('--text').trim();

  ctx.clearRect(0, 0, W, H);

  if (wpmData.length < 2) {
    ctx.fillStyle = subColor;
    ctx.font = '12px Roboto Mono';
    ctx.fillText('Not enough data', pad.left, H/2);
    return;
  }

  const maxVal = Math.max(...wpmData, ...rawData, 1);
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  // Grid lines
  ctx.strokeStyle = bgColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH * (1 - i/4);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = subColor;
    ctx.font = '10px Roboto Mono';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal * i/4), pad.left - 4, y + 3);
  }

  // X axis labels
  ctx.fillStyle = subColor;
  ctx.font = '10px Roboto Mono';
  ctx.textAlign = 'center';
  const step = Math.ceil(wpmData.length / 5);
  wpmData.forEach((_, i) => {
    if (i % step === 0 || i === wpmData.length - 1) {
      const x = pad.left + (i / (wpmData.length - 1)) * chartW;
      ctx.fillText(i + 1, x, H - 4);
    }
  });

  function drawLine(data, color, fill) {
    if (data.length < 2) return;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = pad.left + (i / (data.length - 1)) * chartW;
      const y = pad.top + chartH * (1 - v / maxVal);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (fill) {
      ctx.lineTo(pad.left + chartW, pad.top + chartH);
      ctx.lineTo(pad.left, pad.top + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, color + '44');
      grad.addColorStop(1, color + '00');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // Draw raw (behind)
  ctx.globalAlpha = 0.5;
  drawLine(rawData, subColor, false);
  ctx.globalAlpha = 1;
  drawLine(wpmData, mainColor, true);

  // Dots on wpm
  ctx.fillStyle = mainColor;
  wpmData.forEach((v, i) => {
    const x = pad.left + (i / (wpmData.length - 1)) * chartW;
    const y = pad.top + chartH * (1 - v / maxVal);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Legend
  ctx.font = '11px Roboto Mono';
  ctx.textAlign = 'left';
  ctx.fillStyle = mainColor; ctx.fillRect(pad.left, 2, 12, 3);
  ctx.fillStyle = textColor; ctx.fillText('wpm', pad.left + 16, 9);
  ctx.fillStyle = subColor; ctx.globalAlpha = 0.5;
  ctx.fillRect(pad.left + 60, 2, 12, 3); ctx.globalAlpha = 1;
  ctx.fillStyle = subColor; ctx.fillText('raw', pad.left + 76, 9);
}

// ─── Reset ───────────────────────────────────
function resetTest(newWords = true) {
  clearInterval(state.timer);
  Object.assign(state, {
    words: [],
    wordEls: [],
    charEls: [],
    currentWordIdx: 0,
    currentCharIdx: 0,
    typedHistory: [],
    currentInput: '',
    started: false,
    finished: false,
    timer: null,
    timeLeft: state.timeLimit,
    elapsed: 0,
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    missedChars: 0,
    wpmHistory: [],
    rawHistory: [],
    caretEl: null,
  });

  liveStats.classList.add('hidden');
  liveTimer.textContent = state.mode === 'time' ? state.timeLimit : '0';
  liveTimer.classList.remove('warning');
  wordsDisplay.style.marginTop = '0';

  testSection.classList.remove('hidden');
  resultSection.classList.add('hidden');

  if (newWords) {
    const count = state.mode === 'time' ? 150 : state.wordCount;
    state.words = generateWordList(count);
  }

  renderWords();
  focusInput();
}

// ─── Focus ───────────────────────────────────
function focusInput() {
  typingInput.focus({ preventScroll: true });
  setFocus(true);
}

function setFocus(val) {
  state.focused = val;
  if (val) {
    outOfFocus.classList.remove('show');
    if (state.caretEl) {
      state.caretEl.style.animation = 'blink 1s step-end infinite';
    }
  } else {
    outOfFocus.classList.add('show');
    if (state.caretEl) {
      state.caretEl.style.opacity = '0.4';
      state.caretEl.style.animation = 'none';
    }
  }
}

typingInput.addEventListener('focus', () => setFocus(true));
typingInput.addEventListener('blur', () => {
  // Small delay to prevent flicker
  setTimeout(() => {
    if (document.activeElement !== typingInput) setFocus(false);
  }, 100);
});

outOfFocus.addEventListener('click', focusInput);
document.addEventListener('click', (e) => {
  if (
    !cmdOverlay.contains(e.target) &&
    !themeOverlay.contains(e.target) &&
    !$('settingsBtn').contains(e.target) &&
    !$('themeBtn').contains(e.target)
  ) {
    focusInput();
  }
});

// Key press to focus
document.addEventListener('keypress', (e) => {
  if (!state.focused && cmdOverlay.classList.contains('hidden') && themeOverlay.classList.contains('hidden')) {
    focusInput();
  }
});

// ─── Caps Lock ───────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.getModifierState && e.getModifierState('CapsLock')) {
    capsWarning.classList.remove('hidden');
  } else {
    capsWarning.classList.add('hidden');
  }
});

// ─── Mode Controls ───────────────────────────
document.querySelectorAll('.mode-pill').forEach(pill => {
  if (!pill.dataset.mode) return; // skip sub-mode pills handled below
  pill.addEventListener('click', () => {
    document.querySelectorAll('.mode-pill:not(.sub)').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.mode = pill.dataset.mode;
    updateSubModeUI();
    resetTest();
  });
});

// Sub mode (time/words values)
document.querySelectorAll('.mode-pill.sub').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.mode-pill.sub').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    const val = parseInt(pill.dataset.val);
    if (state.mode === 'time') {
      state.timeLimit = val;
      state.timeLeft = val;
    } else {
      state.wordCount = val;
    }
    resetTest();
  });
});

function updateSubModeUI() {
  const subGroup = $('subModeGroup');
  const pills = subGroup.querySelectorAll('.mode-pill.sub');
  if (state.mode === 'time') {
    pills.forEach((p, i) => {
      p.dataset.val = [15, 30, 60, 120][i];
      p.textContent = [15, 30, 60, 120][i];
    });
    pills[1].classList.add('active');
    state.timeLimit = 30;
  } else if (state.mode === 'words') {
    pills.forEach((p, i) => {
      p.dataset.val = [10, 25, 50, 100][i];
      p.textContent = [10, 25, 50, 100][i];
    });
    pills[2].classList.add('active');
    state.wordCount = 50;
  }
}

// Punctuation & Numbers toggles
$('punctuationBtn').addEventListener('click', () => {
  state.punctuation = !state.punctuation;
  $('punctuationBtn').classList.toggle('active', state.punctuation);
  resetTest();
});
$('numbersBtn').addEventListener('click', () => {
  state.numbers = !state.numbers;
  $('numbersBtn').classList.toggle('active', state.numbers);
  resetTest();
});

// Restart
$('restartBtn').addEventListener('click', resetTest);
$('resRetryBtn').addEventListener('click', () => resetTest(false));
$('resNextBtn').addEventListener('click', () => resetTest(true));

// ─── Command Line ─────────────────────────────
const COMMANDS = [
  { name: 'change theme', shortcut: 'open theme picker', action: () => { closeCmdLine(); openThemePicker(); } },
  { name: 'restart test', shortcut: 'tab', action: () => { closeCmdLine(); resetTest(); } },
  { name: 'toggle punctuation', shortcut: '', action: () => { closeCmdLine(); $('punctuationBtn').click(); } },
  { name: 'toggle numbers', shortcut: '', action: () => { closeCmdLine(); $('numbersBtn').click(); } },
  { name: 'set time 15', shortcut: '', action: () => { closeCmdLine(); setTimeMode(15); } },
  { name: 'set time 30', shortcut: '', action: () => { closeCmdLine(); setTimeMode(30); } },
  { name: 'set time 60', shortcut: '', action: () => { closeCmdLine(); setTimeMode(60); } },
  { name: 'set time 120', shortcut: '', action: () => { closeCmdLine(); setTimeMode(120); } },
  { name: 'set words 10', shortcut: '', action: () => { closeCmdLine(); setWordsMode(10); } },
  { name: 'set words 25', shortcut: '', action: () => { closeCmdLine(); setWordsMode(25); } },
  { name: 'set words 50', shortcut: '', action: () => { closeCmdLine(); setWordsMode(50); } },
  { name: 'set words 100', shortcut: '', action: () => { closeCmdLine(); setWordsMode(100); } },
];

function setTimeMode(t) {
  state.mode = 'time'; state.timeLimit = t;
  document.querySelectorAll('.mode-pill:not(.sub)').forEach(p => p.classList.toggle('active', p.dataset.mode === 'time'));
  document.querySelectorAll('.mode-pill.sub').forEach(p => {
    p.classList.toggle('active', parseInt(p.dataset.val) === t);
  });
  resetTest();
}
function setWordsMode(w) {
  state.mode = 'words'; state.wordCount = w;
  document.querySelectorAll('.mode-pill:not(.sub)').forEach(p => p.classList.toggle('active', p.dataset.mode === 'words'));
  document.querySelectorAll('.mode-pill.sub').forEach(p => {
    p.classList.toggle('active', parseInt(p.dataset.val) === w);
  });
  resetTest();
}

function openCommandLine() {
  cmdOverlay.classList.remove('hidden');
  cmdInput.value = '';
  renderCmdResults('');
  setTimeout(() => cmdInput.focus(), 0);
}
function closeCmdLine() { cmdOverlay.classList.add('hidden'); focusInput(); }

cmdOverlay.addEventListener('click', (e) => { if (e.target === cmdOverlay) closeCmdLine(); });

cmdInput.addEventListener('input', () => renderCmdResults(cmdInput.value));
cmdInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCmdLine();
  if (e.key === 'Enter') {
    const first = cmdResults.querySelector('.cmd-item');
    if (first) first.click();
  }
});

function renderCmdResults(query) {
  const q = query.toLowerCase();
  const filtered = COMMANDS.filter(c => c.name.includes(q));
  cmdResults.innerHTML = '';
  filtered.forEach(cmd => {
    const item = document.createElement('div');
    item.className = 'cmd-item';
    item.innerHTML = `<span class="cmd-item-name">${cmd.name}</span><span class="cmd-item-shortcut">${cmd.shortcut}</span>`;
    item.addEventListener('click', cmd.action);
    cmdResults.appendChild(item);
  });
}

// ─── Theme Picker ─────────────────────────────
$('themeBtn').addEventListener('click', (e) => { e.stopPropagation(); openThemePicker(); });
function openThemePicker() {
  themeOverlay.classList.remove('hidden');
  themeSearch.value = '';
  renderThemeList('');
  setTimeout(() => themeSearch.focus(), 0);
}
function closeThemePicker() { themeOverlay.classList.add('hidden'); focusInput(); }
themeOverlay.addEventListener('click', (e) => { if (e.target === themeOverlay) closeThemePicker(); });
themeSearch.addEventListener('input', () => renderThemeList(themeSearch.value));
themeSearch.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeThemePicker(); });

function renderThemeList(query) {
  const q = query.toLowerCase();
  const filtered = THEMES.filter(t => t.name.includes(q));
  themeList.innerHTML = '';
  filtered.forEach(t => {
    const item = document.createElement('div');
    item.className = 'theme-item' + (state.theme === t.id ? ' active' : '');
    item.innerHTML = `
      <div class="theme-swatch">
        <div class="theme-dot" style="background:${t.bg};border:1px solid ${t.sub}"></div>
        <div class="theme-dot" style="background:${t.main}"></div>
        <div class="theme-dot" style="background:${t.text}"></div>
      </div>
      <span class="theme-name">${t.name}</span>
    `;
    item.addEventListener('click', () => applyTheme(t.id));
    // Preview on hover
    item.addEventListener('mouseenter', () => applyTheme(t.id, true));
    item.addEventListener('mouseleave', () => applyTheme(state.theme, true));
    themeList.appendChild(item);
  });
}

function applyTheme(id, preview = false) {
  document.documentElement.setAttribute('data-theme', id);
  if (!preview) {
    state.theme = id;
    localStorage.setItem('mt_theme', id);
    closeThemePicker();
    renderThemeList('');
  }
}

// ─── Init ────────────────────────────────────
applyTheme(state.theme, true);

// Live stats: just timer for now (wpm shown post-test)
// We keep liveStats hidden until started; just show live timer

resetTest();

// ─── Resize handler (re-position caret) ───────
window.addEventListener('resize', () => { if (!state.finished) updateCaret(); });
