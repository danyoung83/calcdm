(() => {
  'use strict';

  // ---------- DOM ----------
  const displayEl = document.getElementById('display');
  const textEl = document.getElementById('displayText');
  const keypad = document.getElementById('keypad');
  const historyBtn = document.getElementById('historyBtn');
  const modeBtn = document.getElementById('modeBtn');
  const minuteHand = document.getElementById('minuteHand');
  const opKeys = {};
  keypad.querySelectorAll('.key.op').forEach((b) => { opKeys[b.dataset.key] = b; });

  const MAX_DIGITS = 9;
  const BASE_FONT = 71;
  const MIN_FONT = 30;
  const LONG_PRESS_MS = 700;
  const STORAGE_KEY = 'calc.target';

  // ---------- Calculator state ----------
  // tokens: alternating numbers and operators, e.g. [2, '+', 3, '*']
  let tokens = [];
  let entry = null;        // string being typed ("12.5", "-0"), or null
  let shown = 0;           // number shown when entry is null
  let lastOp = null;       // for repeated "="
  let lastOperand = null;
  let activeOp = null;     // highlighted operator key

  // ---------- Secret force state ----------
  const secret = {
    target: null,   // number, or null
    armed: false,
    seq: '',        // characters to feed, e.g. "1234" or "12.5"
    idx: 0,
  };

  // ---------- Helpers ----------
  const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };

  function apply(a, op, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
    }
    return b;
  }

  function round9(n) {
    if (!isFinite(n)) return n;
    return parseFloat(n.toPrecision(9));
  }

  function currentValue() {
    return entry !== null ? parseFloat(entry) || 0 : shown;
  }

  // Reduce the token stack while the top operator's precedence >= minPrec.
  function reduce(minPrec) {
    while (tokens.length >= 3) {
      const op = tokens[tokens.length - 2];
      if (PREC[op] < minPrec) break;
      const b = tokens.pop(); tokens.pop(); const a = tokens.pop();
      tokens.push(round9(apply(a, op, b)));
    }
  }

  function addCommas(intPart) {
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Format a typed entry string exactly as typed (keeps trailing "." / zeros).
  function formatEntry(s) {
    let neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    const [i, f] = s.split('.');
    let out = addCommas(i || '0');
    if (f !== undefined) out += '.' + f;
    return (neg ? '-' : '') + out;
  }

  // Format a computed number the way iOS does (9 significant digits, commas, e-notation when huge).
  function formatNumber(n) {
    if (Number.isNaN(n) || !isFinite(n)) return 'Error';
    if (Object.is(n, -0)) return '-0';
    const abs = Math.abs(n);
    if (abs !== 0 && (abs >= 1e9 || abs < 1e-8)) {
      let [m, e] = n.toExponential(8).split('e');
      m = m.replace(/\.?0+$/, '');
      return m + 'e' + (e[0] === '+' ? e.slice(1) : e);
    }
    let s = String(round9(n));
    if (s.includes('e')) {
      // small numbers may still come out as e-notation from toPrecision
      s = n.toFixed(9).replace(/\.?0+$/, '');
    }
    let neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    const [i, f] = s.split('.');
    let out = addCommas(i);
    if (f) out += '.' + f;
    return (neg ? '-' : '') + out;
  }

  function fitDisplay() {
    textEl.style.fontSize = BASE_FONT + 'px';
    const avail = displayEl.clientWidth;
    const w = textEl.scrollWidth;
    if (w > avail) {
      const size = Math.max(MIN_FONT, Math.floor(BASE_FONT * avail / w));
      textEl.style.fontSize = size + 'px';
    }
  }

  function render() {
    textEl.textContent = entry !== null ? formatEntry(entry) : formatNumber(shown);
    fitDisplay();
  }

  function setActiveOp(op) {
    if (activeOp && opKeys[activeOp]) opKeys[activeOp].classList.remove('active');
    activeOp = op;
    if (op && opKeys[op]) opKeys[op].classList.add('active');
  }

  function resetAll() {
    tokens = [];
    entry = null;
    shown = 0;
    lastOp = null;
    lastOperand = null;
    setActiveOp(null);
    disarm();
    render();
  }

  // ---------- Input handlers ----------
  function inputDigit(d) {
    setActiveOp(null);
    if (entry === null) {
      entry = d === '.' ? '0.' : d;
    } else {
      if (d === '.' && entry.includes('.')) return;
      const digits = entry.replace(/[-.]/g, '').length;
      if (d !== '.' && digits >= MAX_DIGITS) return;
      if (entry === '0' && d !== '.') entry = d;
      else if (entry === '-0' && d !== '.') entry = '-' + d;
      else entry += d;
    }
    render();
  }

  function inputOperator(op) {
    lastOp = null;
    const last = tokens[tokens.length - 1];
    if (entry === null && typeof last === 'string') {
      // Operator pressed again with nothing typed in between.
      if (last === op && secret.target !== null && !secret.armed && (op === '+' || op === '-')) {
        arm(op);
        return;
      }
      tokens[tokens.length - 1] = op;
      setActiveOp(op);
      return;
    }
    const v = currentValue();
    tokens.push(v);
    reduce(PREC[op]);
    shown = tokens[tokens.length - 1];
    tokens.push(op);
    entry = null;
    setActiveOp(op);
    render();
  }

  function inputEquals() {
    setActiveOp(null);
    if (secret.armed) { finishForce(); return; }

    const last = tokens[tokens.length - 1];
    if (typeof last === 'string') {
      const v = currentValue();
      lastOp = last;
      lastOperand = v;
      tokens.push(v);
      reduce(1);
      shown = tokens[0];
      tokens = [];
    } else if (lastOp !== null) {
      shown = round9(apply(currentValue(), lastOp, lastOperand));
    } else {
      shown = currentValue();
    }
    entry = null;
    render();
  }

  function inputNegate() {
    if (entry !== null) {
      entry = entry[0] === '-' ? entry.slice(1) : '-' + entry;
    } else {
      shown = shown === 0 ? -0 : -shown;
      if (Object.is(shown, -0)) { entry = '-0'; }
    }
    render();
  }

  function inputPercent() {
    const v = currentValue();
    const last = tokens[tokens.length - 1];
    let result;
    if (typeof last === 'string' && (last === '+' || last === '-')) {
      result = tokens[tokens.length - 2] * v / 100;
    } else {
      result = v / 100;
    }
    shown = round9(result);
    entry = null;
    render();
  }

  function inputClear() {
    resetAll();
  }

  function backspace() {
    if (entry === null) return;
    entry = entry.slice(0, -1);
    if (entry === '' || entry === '-') entry = null;
    render();
  }

  // ---------- Secret force ----------
  function loadTarget() {
    const fromUrl = new URLSearchParams(location.search).get('t') || (location.hash.match(/^#t=(.+)$/) || [])[1];
    if (fromUrl !== undefined && fromUrl !== null && fromUrl !== '') {
      setTarget(parseFloat(fromUrl));
      history.replaceState(null, '', location.pathname);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null && stored !== '') {
      secret.target = parseFloat(stored);
      if (Number.isNaN(secret.target)) secret.target = null;
    }
    showTell();
  }

  // The tell: the clock's minute hand points to 3 normally, to 9 when a target is set.
  function showTell() {
    minuteHand.setAttribute('x2', secret.target !== null ? '7' : '17');
  }

  function setTarget(n) {
    if (Number.isNaN(n) || n === null) return clearTarget();
    secret.target = round9(n);
    localStorage.setItem(STORAGE_KEY, String(secret.target));
    showTell();
  }

  function clearTarget() {
    secret.target = null;
    localStorage.removeItem(STORAGE_KEY);
    showTell();
  }

  function disarm() {
    secret.armed = false;
    secret.seq = '';
    secret.idx = 0;
  }

  function arm(op) {
    // tokens is [total, op] here: +/- reduce everything before them.
    const total = tokens[tokens.length - 2];
    let delta = op === '+' ? secret.target - total : total - secret.target;
    delta = Math.abs(round9(delta));
    let seq = String(delta);
    if (seq.includes('e')) seq = delta.toFixed(8).replace(/\.?0+$/, '');
    secret.seq = seq;
    secret.idx = 0;
    secret.armed = true;
  }

  function feedForcedChar() {
    if (secret.idx >= secret.seq.length) return;
    const ch = secret.seq[secret.idx++];
    inputDigit(ch);
  }

  function forceEntryComplete() {
    return secret.armed && secret.idx >= secret.seq.length;
  }

  function finishForce() {
    const t = secret.target;
    tokens = [];
    entry = null;
    shown = t;
    lastOp = null;
    lastOperand = null;
    clearTarget();
    disarm();
    render();
  }

  // ---------- Dispatch ----------
  // Handles key presses from clicks / keyboard. While the force is armed and digits are still
  // owed, taps are consumed by the document-level tap detector below, not here.
  function press(key) {
    if (secret.armed) {
      if (!forceEntryComplete()) return;
      if (key === '=') return inputEquals();
      if (key === 'clear') return inputClear();
      return;
    }
    switch (key) {
      case 'clear': return inputClear();
      case 'bs': return backspace();
      case 'negate': return inputNegate();
      case 'percent': return inputPercent();
      case '+': case '-': case '*': case '/': return inputOperator(key);
      case '=': return inputEquals();
      default:
        if (/^[0-9.]$/.test(key)) return inputDigit(key);
    }
  }

  // ---------- Whole-screen tap detection while armed ----------
  // One digit per tap gesture, however many fingers land and wherever they land.
  const activePointers = new Set();
  let lastFeedAt = 0;
  function onAnyPointerDown(e) {
    const wasIdle = activePointers.size === 0;
    activePointers.add(e.pointerId);
    if (!secret.armed || forceEntryComplete()) return;
    const now = performance.now();
    if (wasIdle && now - lastFeedAt > 150) {
      lastFeedAt = now;
      feedForcedChar();
    }
  }
  function onAnyPointerEnd(e) { activePointers.delete(e.pointerId); }
  document.addEventListener('pointerdown', onAnyPointerDown, { capture: true });
  document.addEventListener('pointerup', onAnyPointerEnd, { capture: true });
  document.addEventListener('pointercancel', onAnyPointerEnd, { capture: true });
  // Safety net: if a pointerup ever goes missing, an all-fingers-up touchend resets the tracker.
  document.addEventListener('touchend', (e) => { if (e.touches.length === 0) activePointers.clear(); }, { capture: true });
  document.addEventListener('touchcancel', (e) => { if (e.touches.length === 0) activePointers.clear(); }, { capture: true });
  document.addEventListener('visibilitychange', () => activePointers.clear());

  // ---------- Events ----------
  keypad.addEventListener('pointerdown', (e) => {
    const k = e.target.closest('.key');
    if (!k) return;
    k.classList.add('pressed');
  });
  const release = (e) => {
    const k = e.target.closest && e.target.closest('.key');
    if (k) k.classList.remove('pressed');
  };
  keypad.addEventListener('pointerup', release);
  keypad.addEventListener('pointercancel', release);
  keypad.addEventListener('pointerleave', release, true);
  keypad.addEventListener('pointerout', release);

  keypad.addEventListener('click', (e) => {
    const k = e.target.closest('.key');
    if (!k) return;
    press(k.dataset.key);
  });

  // Swipe on the display deletes the last digit (iOS behaviour).
  let swipeStart = null;
  displayEl.addEventListener('pointerdown', (e) => { swipeStart = { x: e.clientX, y: e.clientY }; });
  displayEl.addEventListener('pointerup', (e) => {
    if (!swipeStart) return;
    const dx = e.clientX - swipeStart.x, dy = e.clientY - swipeStart.y;
    swipeStart = null;
    if (secret.armed) return;
    if (Math.abs(dx) > 30 && Math.abs(dy) < 50) backspace();
  });

  // Long-press helper for the two round buttons.
  function longPress(btn, onFire, onRelease) {
    let timer = null;
    let fired = false;
    btn.addEventListener('pointerdown', () => {
      btn.classList.add('pressed');
      fired = false;
      timer = setTimeout(() => { fired = true; onFire(); }, LONG_PRESS_MS);
    });
    const end = () => {
      btn.classList.remove('pressed');
      clearTimeout(timer); timer = null;
      if (fired && onRelease) onRelease();
      fired = false;
    };
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // History (clock): long-press sets the number on screen as the target and clears the display.
  // Long-press with 0 on screen clears the target.
  longPress(historyBtn, () => {
    if (secret.armed) return;
    const v = currentValue();
    if (v !== 0) setTarget(v); else clearTarget();
    resetAll();
  });

  // Mode (calculator icon): hold to peek at the target; the display restores on release.
  longPress(modeBtn, () => {
    if (secret.armed || secret.target === null) return;
    textEl.textContent = formatNumber(secret.target);
    fitDisplay();
  }, () => render());

  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  // Keyboard support (handy on desktop).
  document.addEventListener('keydown', (e) => {
    const map = { Enter: '=', '=': '=', Backspace: 'bs', Escape: 'clear', '%': 'percent', x: '*', X: '*' };
    const key = map[e.key] || e.key;
    if (/^[0-9.+\-*\/=]$/.test(key) || key === 'clear' || key === 'percent' || key === 'bs') press(key);
  });

  window.addEventListener('resize', fitDisplay);

  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !location.search.includes('nosw')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  loadTarget();
  render();

  // Debug hooks (not visible in UI).
  window.__calc = { press, state: () => ({ tokens, entry, shown, secret: { ...secret } }), setTarget, clearTarget };
})();
