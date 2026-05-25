/* ═══════════════════════════════════════════════
   CalcuColor — main.js
   ═══════════════════════════════════════════════ */

'use strict';

/* ── Audio Engine ────────────────────────────── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let muted = false;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playSound(type = 'click') {
  if (muted) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    const configs = {
      click:  { freq: 600,  type: 'sine',     decay: 0.08, vol: 0.12 },
      op:     { freq: 800,  type: 'triangle', decay: 0.12, vol: 0.10 },
      equals: { freq: 1000, type: 'sine',     decay: 0.25, vol: 0.15 },
      clear:  { freq: 300,  type: 'sawtooth', decay: 0.12, vol: 0.08 },
      error:  { freq: 150,  type: 'sawtooth', decay: 0.3,  vol: 0.10 },
      gen:    { freq: 1200, type: 'sine',     decay: 0.3,  vol: 0.10 },
      copy:   { freq: 900,  type: 'triangle', decay: 0.15, vol: 0.10 },
    };

    const cfg = configs[type] || configs.click;
    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.freq, now);
    osc.frequency.exponentialRampToValueAtTime(cfg.freq * 0.5, now + cfg.decay);

    gain.gain.setValueAtTime(cfg.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.decay + 0.01);

    osc.start(now);
    osc.stop(now + cfg.decay + 0.05);
  } catch (e) {
    // silent fail
  }
}

/* ── Mute toggle ─────────────────────────────── */
const muteBtn = document.getElementById('muteBtn');
const muteIcon = muteBtn.querySelector('.mute-icon');
muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteIcon.textContent = muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  localStorage.setItem('muted', muted ? '1' : '0');
});
if (localStorage.getItem('muted') === '1') {
  muted = true;
  muteIcon.textContent = '🔇';
}

/* ── Panel / Nav ─────────────────────────────── */
const navTabs = document.querySelectorAll('.nav-tab');
const panels = document.querySelectorAll('.panel');

navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    playSound('click');
    navTabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    const target = document.getElementById('panel-' + tab.dataset.panel);
    if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
  });
});

/* ══════════════════════════════════════════════
   CALCULATOR
   ══════════════════════════════════════════════ */
let calcMode = 'basic';
let displayVal = '0';
let displayExpr = '';
let operand = null;
let operator = null;
let resetOnNext = false;
let lastResult = null;

const displayValEl = document.getElementById('displayVal');
const displayExprEl = document.getElementById('displayExpr');
const keypadBasic = document.getElementById('keypad-basic');
const keypadSci = document.getElementById('keypad-sci');
const keypadBin = document.getElementById('keypad-bin');

// Binary mode state
let binVal = '0';
let binOperand = null;
let binOperator = null;
let binResetOnNext = false;
let binExpr = '';

/* Mode buttons */
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    playSound('click');
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calcMode = btn.dataset.mode;
    resetCalc();
    applyMode();
  });
});

function applyMode() {
  keypadBasic.classList.toggle('hidden', calcMode !== 'basic');
  keypadSci.classList.toggle('hidden', calcMode !== 'scientific');
  keypadBin.classList.toggle('hidden', calcMode !== 'binary');
  if (calcMode === 'binary') {
    keypadBasic.classList.add('hidden');
    keypadSci.classList.add('hidden');
    keypadBin.classList.remove('hidden');
  }
  if (calcMode === 'scientific') {
    keypadBasic.classList.remove('hidden');
    keypadSci.classList.remove('hidden');
    keypadBin.classList.add('hidden');
  }
  if (calcMode === 'basic') {
    keypadBasic.classList.remove('hidden');
    keypadSci.classList.add('hidden');
    keypadBin.classList.add('hidden');
  }
}

function resetCalc() {
  displayVal = '0'; displayExpr = '';
  operand = null; operator = null; resetOnNext = false;
  binVal = '0'; binOperand = null; binOperator = null; binResetOnNext = false; binExpr = '';
  updateDisplay();
}

function updateDisplay(expr, val) {
  displayExprEl.textContent = expr !== undefined ? expr : (calcMode === 'binary' ? binExpr : displayExpr) || '\u00a0';
  const v = val !== undefined ? val : (calcMode === 'binary' ? binVal : displayVal);
  displayValEl.textContent = v;
  displayValEl.classList.toggle('error', String(v).toLowerCase().includes('error') || String(v) === 'infinity');
}

/* All button clicks routed here */
document.querySelectorAll('.btn[data-action]').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const val = btn.dataset.val;
    if (calcMode === 'binary') {
      handleBinaryAction(action, val, btn);
    } else {
      handleCalcAction(action, val, btn);
    }
  });
});

/* ── Basic / Scientific calc ─────────────────── */
function handleCalcAction(action, val, btn) {
  switch (action) {
    case 'digit': {
      playSound('click');
      if (displayVal === '0' || resetOnNext) {
        displayVal = val;
        resetOnNext = false;
      } else {
        if (displayVal.length >= 15) return;
        displayVal += val;
      }
      updateDisplay();
      break;
    }
    case 'dot': {
      playSound('click');
      if (resetOnNext) { displayVal = '0.'; resetOnNext = false; }
      else if (!displayVal.includes('.')) displayVal += '.';
      updateDisplay();
      break;
    }
    case 'op': {
      playSound('op');
      const n = parseFloat(displayVal);
      if (operator && !resetOnNext) {
        const res = applyOp(operand, operator, n);
        displayVal = formatNum(res);
        displayExpr = formatNum(res) + ' ' + opSymbol(val) + ' ';
        operand = res;
      } else {
        operand = n;
        displayExpr = displayVal + ' ' + opSymbol(val) + ' ';
      }
      operator = val;
      resetOnNext = true;
      updateDisplay();
      break;
    }
    case 'equals': {
      playSound('equals');
      if (operator === null) return;
      const n = parseFloat(displayVal);
      const res = applyOp(operand, operator, n);
      displayExpr = '';
      displayVal = formatNum(res);
      lastResult = res;
      operator = null; operand = null; resetOnNext = true;
      updateDisplay();
      break;
    }
    case 'clear': {
      playSound('clear');
      resetCalc();
      break;
    }
    case 'sign': {
      playSound('click');
      displayVal = formatNum(-parseFloat(displayVal));
      updateDisplay();
      break;
    }
    case 'percent': {
      playSound('click');
      displayVal = formatNum(parseFloat(displayVal) / 100);
      updateDisplay();
      break;
    }
    case 'backspace': {
      playSound('click');
      if (displayVal.length <= 1) { displayVal = '0'; }
      else { displayVal = displayVal.slice(0, -1); }
      updateDisplay();
      break;
    }
    case 'sci': {
      handleSci(val);
      break;
    }
  }
}

function handleSci(fn) {
  playSound('click');
  const n = parseFloat(displayVal);
  let result;
  switch (fn) {
    case 'sin':  result = Math.sin(n * Math.PI / 180); break;
    case 'cos':  result = Math.cos(n * Math.PI / 180); break;
    case 'tan':  result = Math.tan(n * Math.PI / 180); break;
    case 'log':  result = Math.log10(n); break;
    case 'ln':   result = Math.log(n); break;
    case 'sqrt': result = Math.sqrt(n); break;
    case 'pow2': result = n * n; break;
    case 'pi':   result = Math.PI; resetOnNext = false; displayVal = formatNum(Math.PI); updateDisplay(); return;
    case 'e':    result = Math.E; resetOnNext = false; displayVal = formatNum(Math.E); updateDisplay(); return;
    case 'inv':  result = 1 / n; break;
    case 'fact': result = factorial(Math.round(n)); break;
    default:     return;
  }
  if (!isFinite(result)) { displayVal = 'Error'; }
  else { displayVal = formatNum(result); }
  resetOnNext = true;
  updateDisplay();
}

function factorial(n) {
  if (n < 0 || n > 170) return Infinity;
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function applyOp(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? Infinity : a / b;
    default:  return b;
  }
}

function opSymbol(op) { return op; }

function formatNum(n) {
  if (!isFinite(n)) return 'Infinity';
  if (isNaN(n)) return 'Error';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const s = parseFloat(n.toPrecision(12));
  return String(s);
}

/* ── Binary calc ─────────────────────────────── */
function handleBinaryAction(action, val, btn) {
  switch (action) {
    case 'digit': {
      playSound('click');
      if (binVal === '0' || binResetOnNext) { binVal = val; binResetOnNext = false; }
      else { if (binVal.length >= 32) return; binVal += val; }
      updateDisplay();
      break;
    }
    case 'op': {
      if (val === 'NOT') {
        playSound('op');
        const n = parseInt(binVal, 2);
        const r = (~n) >>> 0;
        binVal = r.toString(2);
        binExpr = 'NOT ' + binVal;
        binResetOnNext = true;
        updateDisplay();
        return;
      }
      playSound('op');
      const n = parseInt(binVal, 2);
      if (binOperator && !binResetOnNext) {
        const res = applyBinOp(binOperand, binOperator, n);
        binVal = res.toString(2);
        binExpr = binVal + ' ' + val + ' ';
        binOperand = res;
      } else {
        binOperand = n;
        binExpr = binVal + ' ' + val + ' ';
      }
      binOperator = val;
      binResetOnNext = true;
      updateDisplay();
      break;
    }
    case 'equals': {
      playSound('equals');
      if (!binOperator) return;
      const n = parseInt(binVal, 2);
      const res = applyBinOp(binOperand, binOperator, n);
      binVal = res.toString(2);
      binExpr = '';
      binOperator = null; binOperand = null; binResetOnNext = true;
      updateDisplay();
      break;
    }
    case 'clear': {
      playSound('clear');
      binVal = '0'; binOperand = null; binOperator = null;
      binResetOnNext = false; binExpr = '';
      updateDisplay();
      break;
    }
    case 'backspace': {
      playSound('click');
      if (binVal.length <= 1) binVal = '0';
      else binVal = binVal.slice(0, -1);
      updateDisplay();
      break;
    }
  }
}

function applyBinOp(a, op, b) {
  switch (op) {
    case 'AND': return (a & b) >>> 0;
    case 'OR':  return (a | b) >>> 0;
    case 'XOR': return (a ^ b) >>> 0;
    case '<<':  return (a << 1) >>> 0;
    case '>>':  return (a >>> 1);
    case '+':   return (a + b) >>> 0;
    default:    return b;
  }
}

/* ══════════════════════════════════════════════
   COLOR PALETTE
   ══════════════════════════════════════════════ */
const baseColorInput = document.getElementById('baseColor');
const baseHexLabel   = document.getElementById('baseHexLabel');
const schemeSelect   = document.getElementById('schemeType');
const swatchesEl     = document.getElementById('swatches');
const copyToast      = document.getElementById('copyToast');

baseColorInput.addEventListener('input', () => {
  baseHexLabel.textContent = baseColorInput.value.toUpperCase();
});

document.getElementById('generatePalette').addEventListener('click', () => {
  playSound('gen');
  generatePalette(baseColorInput.value, schemeSelect.value);
});

document.getElementById('randomPalette').addEventListener('click', () => {
  playSound('gen');
  const randomHex = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  baseColorInput.value = randomHex;
  baseHexLabel.textContent = randomHex.toUpperCase();
  generatePalette(randomHex, schemeSelect.value);
});

document.getElementById('copyCSSVars').addEventListener('click', () => {
  playSound('copy');
  const swatches = document.querySelectorAll('.swatch-hex');
  if (!swatches.length) return;
  const vars = Array.from(swatches).map((s, i) => `  --color-${i + 1}: ${s.textContent};`).join('\n');
  navigator.clipboard.writeText(`:root {\n${vars}\n}`).then(() => showToast());
});

document.getElementById('copyHexList').addEventListener('click', () => {
  playSound('copy');
  const swatches = document.querySelectorAll('.swatch-hex');
  if (!swatches.length) return;
  const hexes = Array.from(swatches).map(s => s.textContent).join(', ');
  navigator.clipboard.writeText(hexes).then(() => showToast());
});

let toastTimer;
function showToast() {
  copyToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => copyToast.classList.remove('show'), 1800);
}

/* Color math helpers */
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

function generatePalette(hex, scheme) {
  const [h, s, l] = hexToHsl(hex);
  let colors = [];

  switch (scheme) {
    case 'complementary':
      colors = [
        { hex, label: 'Base' },
        { hex: hslToHex(h, s, l > 60 ? l - 20 : l + 20), label: 'Tint' },
        { hex: hslToHex(h + 180, s, l), label: 'Complement' },
        { hex: hslToHex(h + 180, s, l > 60 ? l - 20 : l + 20), label: 'Comp Tint' },
      ];
      break;
    case 'triadic':
      colors = [
        { hex, label: 'Base' },
        { hex: hslToHex(h + 120, s, l), label: 'Triadic 1' },
        { hex: hslToHex(h + 240, s, l), label: 'Triadic 2' },
        { hex: hslToHex(h, s * 0.5, l), label: 'Muted Base' },
      ];
      break;
    case 'analogous':
      colors = [
        { hex: hslToHex(h - 30, s, l), label: 'Analogous -' },
        { hex, label: 'Base' },
        { hex: hslToHex(h + 30, s, l), label: 'Analogous +' },
        { hex: hslToHex(h + 60, s * 0.8, l), label: 'Warm +' },
      ];
      break;
    case 'tetradic':
      colors = [
        { hex, label: 'Base' },
        { hex: hslToHex(h + 90, s, l), label: 'Tetradic 1' },
        { hex: hslToHex(h + 180, s, l), label: 'Tetradic 2' },
        { hex: hslToHex(h + 270, s, l), label: 'Tetradic 3' },
      ];
      break;
    case 'monochromatic':
      colors = [
        { hex: hslToHex(h, s, Math.min(l + 30, 90)), label: 'Lightest' },
        { hex: hslToHex(h, s, Math.min(l + 15, 80)), label: 'Light' },
        { hex, label: 'Base' },
        { hex: hslToHex(h, s, Math.max(l - 15, 10)), label: 'Dark' },
        { hex: hslToHex(h, s, Math.max(l - 30, 5)), label: 'Darkest' },
      ];
      break;
    case 'split-complementary':
      colors = [
        { hex, label: 'Base' },
        { hex: hslToHex(h + 150, s, l), label: 'Split 1' },
        { hex: hslToHex(h + 210, s, l), label: 'Split 2' },
        { hex: hslToHex(h, s * 0.7, l + 15), label: 'Tint' },
      ];
      break;
  }

  swatchesEl.innerHTML = '';
  colors.forEach(c => {
    const div = document.createElement('div');
    div.className = 'swatch';
    div.title = `Click to copy ${c.hex}`;
    div.innerHTML = `
      <div class="swatch-color" style="background:${c.hex}"></div>
      <div class="swatch-info">
        <span class="swatch-hex">${c.hex.toUpperCase()}</span>
        <span class="swatch-name">${c.label}</span>
      </div>`;
    div.addEventListener('click', () => {
      playSound('copy');
      navigator.clipboard.writeText(c.hex.toUpperCase()).then(() => showToast());
    });
    swatchesEl.appendChild(div);
  });
}

// Generate initial palette on load
generatePalette('#6C63FF', 'complementary');

/* ══════════════════════════════════════════════
   NUMBER CONVERTER
   ══════════════════════════════════════════════ */
const decInput = document.getElementById('decInput');
const binInput = document.getElementById('binInput');
const hexInput = document.getElementById('hexInput');
const octInput = document.getElementById('octInput');
const bitvis   = document.getElementById('bitvis');
const convInfo = document.getElementById('convInfo');

let converting = false;

function clearErrors() {
  [decInput, binInput, hexInput, octInput].forEach(i => i.classList.remove('error'));
}

function convertFrom(source, value) {
  if (converting) return;
  converting = true;
  clearErrors();

  let dec;
  try {
    switch (source) {
      case 'dec': dec = parseInt(value, 10); break;
      case 'bin': dec = parseInt(value, 2);  break;
      case 'hex': dec = parseInt(value, 16); break;
      case 'oct': dec = parseInt(value, 8);  break;
    }
    if (isNaN(dec) || dec < 0) throw new Error('Invalid');

    if (source !== 'dec') decInput.value = dec;
    if (source !== 'bin') binInput.value = dec.toString(2);
    if (source !== 'hex') hexInput.value = dec.toString(16).toUpperCase();
    if (source !== 'oct') octInput.value = dec.toString(8);

    renderBitVis(dec);
    renderConvInfo(dec);
  } catch (e) {
    const el = { dec: decInput, bin: binInput, hex: hexInput, oct: octInput }[source];
    if (el) el.classList.add('error');
    bitvis.innerHTML = '<span style="color:var(--text-muted);font-size:.75rem;font-family:var(--font-mono)">Invalid input</span>';
    convInfo.innerHTML = '';
  }

  converting = false;
}

function renderBitVis(dec) {
  if (dec === undefined || isNaN(dec)) { bitvis.innerHTML = ''; return; }
  const bits = dec.toString(2).padStart(Math.ceil(dec.toString(2).length / 8) * 8, '0');
  bitvis.innerHTML = '';
  bits.split('').forEach((bit, i) => {
    if (i > 0 && i % 4 === 0) {
      const sep = document.createElement('div');
      sep.className = 'bit-sep';
      bitvis.appendChild(sep);
    }
    const d = document.createElement('div');
    d.className = `bit bit-${bit}`;
    d.textContent = bit;
    bitvis.appendChild(d);
  });
}

function renderConvInfo(dec) {
  if (isNaN(dec)) { convInfo.innerHTML = ''; return; }
  const isPowerOf2 = dec > 0 && (dec & (dec - 1)) === 0;
  const bits = dec.toString(2).split('').filter(b => b === '1').length;
  convInfo.innerHTML = `
    Decimal: <span>${dec}</span> &nbsp;·&nbsp;
    Bits set: <span>${bits}</span> &nbsp;·&nbsp;
    Power of 2: <span>${isPowerOf2 ? 'Yes (' + Math.log2(dec) + ')' : 'No'}</span>
  `;
}

decInput.addEventListener('input', e => { if (e.target.value) convertFrom('dec', e.target.value); });
binInput.addEventListener('input', e => { if (e.target.value) convertFrom('bin', e.target.value); });
hexInput.addEventListener('input', e => { if (e.target.value) convertFrom('hex', e.target.value); });
octInput.addEventListener('input', e => { if (e.target.value) convertFrom('oct', e.target.value); });

// Init
convertFrom('dec', '255');
