/*
 * Flappy-Autoclicker zum Testen des eigenen Spiels.
 *
 * Benutzung:
 *   1. Spielseite im Browser öffnen
 *   2. DevTools öffnen (F12) -> Tab "Konsole"
 *   3. Diesen kompletten Code einfügen und Enter drücken
 *   4. Rechts oben erscheint ein kleines Panel
 *
 * Hotkey: F8 = Start/Stop
 */
(() => {
  if (window.__flappyAC) { window.__flappyAC.destroy(); }

  const state = {
    running: false,
    interval: 350,     // ms zwischen zwei Klicks
    jitter: 0,         // zufällige Abweichung in ms (+/-)
    mode: 'click',     // 'click' | 'space' | 'both'
    clicks: 0,
    timer: null,
  };

  // Ziel: das größte Canvas der Seite, sonst body
  function findTarget() {
    const canvases = [...document.querySelectorAll('canvas')];
    if (canvases.length) {
      return canvases.sort((a, b) => b.width * b.height - a.width * a.height)[0];
    }
    return document.body;
  }

  function fireClick(el) {
    const r = el.getBoundingClientRect();
    const opts = {
      bubbles: true, cancelable: true, view: window,
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2,
      button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true,
    };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    try {
      const t = new Touch({ identifier: 1, target: el, clientX: opts.clientX, clientY: opts.clientY });
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [t] }));
    } catch (_) { /* Touch nicht unterstützt (Desktop-Firefox) */ }
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
  }

  function fireSpace() {
    const opts = { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true, cancelable: true };
    for (const t of [document, window, document.activeElement || document.body]) {
      t.dispatchEvent(new KeyboardEvent('keydown', opts));
      t.dispatchEvent(new KeyboardEvent('keyup', opts));
    }
  }

  function tap() {
    if (state.mode !== 'space') fireClick(findTarget());
    if (state.mode !== 'click') fireSpace();
    state.clicks++;
    ui.count.textContent = state.clicks;
  }

  function loop() {
    if (!state.running) return;
    tap();
    const j = state.jitter ? (Math.random() * 2 - 1) * state.jitter : 0;
    state.timer = setTimeout(loop, Math.max(10, state.interval + j));
  }

  function start() { if (state.running) return; state.running = true; loop(); render(); }
  function stop()  { state.running = false; clearTimeout(state.timer); render(); }
  function toggle() { state.running ? stop() : start(); }

  // ---------- UI ----------
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;top:12px;right:12px;z-index:2147483647;
    background:#111c;color:#fff;font:13px system-ui,sans-serif;padding:10px 12px;
    border-radius:10px;min-width:210px;box-shadow:0 4px 16px #0006;user-select:none`;
  box.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px">Autoclicker <span style="opacity:.6">(F8)</span></div>
    <button data-k="btn" style="width:100%;padding:6px;border:0;border-radius:6px;cursor:pointer;font-weight:600"></button>
    <label style="display:block;margin-top:8px">Intervall: <b data-k="iv"></b> ms
      <input data-k="ivr" type="range" min="50" max="1000" step="5" style="width:100%"></label>
    <label style="display:block">Zufall ±: <b data-k="jv"></b> ms
      <input data-k="jvr" type="range" min="0" max="200" step="5" style="width:100%"></label>
    <label style="display:block;margin-top:4px">Modus:
      <select data-k="mode">
        <option value="click">Klick/Tap</option>
        <option value="space">Leertaste</option>
        <option value="both">Beides</option>
      </select></label>
    <div style="margin-top:6px;opacity:.8">Klicks: <span data-k="count">0</span>
      <a data-k="close" style="float:right;cursor:pointer;opacity:.7">✕</a></div>`;
  const ui = {};
  box.querySelectorAll('[data-k]').forEach(el => (ui[el.dataset.k] = el));
  // Panel-Klicks nicht ans Spiel weiterreichen
  ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(e => box.addEventListener(e, ev => ev.stopPropagation()));

  function render() {
    ui.btn.textContent = state.running ? '■ Stop' : '▶ Start';
    ui.btn.style.background = state.running ? '#e5484d' : '#30a46c';
    ui.btn.style.color = '#fff';
    ui.iv.textContent = state.interval; ui.ivr.value = state.interval;
    ui.jv.textContent = state.jitter;   ui.jvr.value = state.jitter;
    ui.mode.value = state.mode;
  }

  ui.btn.onclick = toggle;
  ui.ivr.oninput = () => { state.interval = +ui.ivr.value; render(); };
  ui.jvr.oninput = () => { state.jitter = +ui.jvr.value; render(); };
  ui.mode.onchange = () => { state.mode = ui.mode.value; };

  const onKey = e => { if (e.key === 'F8') { e.preventDefault(); toggle(); } };
  window.addEventListener('keydown', onKey, true);

  function destroy() { stop(); window.removeEventListener('keydown', onKey, true); box.remove(); delete window.__flappyAC; }
  ui.close.onclick = destroy;

  document.body.appendChild(box);
  render();
  window.__flappyAC = { start, stop, toggle, destroy, state };
  console.log('[Autoclicker] bereit – F8 oder Button zum Starten.');
})();
