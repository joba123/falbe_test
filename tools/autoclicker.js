/*
 * Autoclicker zum Testen des Flappy-Bird-Spiels.
 *
 * Benutzung: Spielseite öffnen, DevTools-Konsole (F12) öffnen,
 * diesen ganzen Code einfügen und Enter drücken.
 * Unten rechts erscheint ein kleines Bedienfeld.
 *
 * Tastenkürzel: F8 = Start/Stopp
 */
(() => {
  if (window.__flappyAutoclicker) {
    window.__flappyAutoclicker.destroy();
  }

  const state = {
    running: false,
    interval: 350,   // ms zwischen zwei Flaps
    mode: 'space',   // 'space' | 'click' | 'both'
    timer: null,
    count: 0,
  };

  // Ziel für Mausklicks: das größte <canvas> auf der Seite, sonst <body>
  function findTarget() {
    const canvases = [...document.querySelectorAll('canvas')];
    if (!canvases.length) return document.body;
    return canvases.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  }

  function pressSpace() {
    const opts = { key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true, cancelable: true };
    for (const t of [document, window, document.body]) {
      t.dispatchEvent(new KeyboardEvent('keydown', opts));
      t.dispatchEvent(new KeyboardEvent('keyup', opts));
    }
  }

  function click() {
    const el = findTarget();
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const base = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', { ...base, pointerType: 'mouse', isPrimary: true }));
    el.dispatchEvent(new MouseEvent('mousedown', base));
    el.dispatchEvent(new PointerEvent('pointerup', { ...base, pointerType: 'mouse', isPrimary: true }));
    el.dispatchEvent(new MouseEvent('mouseup', base));
    el.dispatchEvent(new MouseEvent('click', base));
    try {
      const touch = new Touch({ identifier: Date.now(), target: el, clientX: x, clientY: y });
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touch], changedTouches: [touch] }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], changedTouches: [touch] }));
    } catch (_) { /* Touch-Events nicht überall verfügbar */ }
  }

  function flap() {
    if (state.mode === 'space' || state.mode === 'both') pressSpace();
    if (state.mode === 'click' || state.mode === 'both') click();
    state.count++;
    countEl.textContent = state.count;
  }

  function start() {
    if (state.running) return;
    state.running = true;
    state.timer = setInterval(flap, state.interval);
    btn.textContent = '⏹ Stopp (F8)';
    btn.style.background = '#c0392b';
  }

  function stop() {
    state.running = false;
    clearInterval(state.timer);
    btn.textContent = '▶ Start (F8)';
    btn.style.background = '#27ae60';
  }

  function toggle() { state.running ? stop() : start(); }

  // --- Bedienfeld ---
  const panel = document.createElement('div');
  panel.style.cssText = `
    position:fixed;right:12px;bottom:12px;z-index:2147483647;
    background:#222;color:#fff;font:13px system-ui,sans-serif;
    padding:10px 12px;border-radius:8px;box-shadow:0 2px 10px #0008;width:220px;`;
  panel.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px">🐦 Autoclicker</div>
    <label style="display:block;margin-bottom:4px">
      Intervall: <span data-v>${state.interval}</span> ms
      <input data-i type="range" min="50" max="1500" step="10" value="${state.interval}" style="width:100%">
    </label>
    <label style="display:block;margin-bottom:6px">Eingabe:
      <select data-m style="width:100%">
        <option value="space">Leertaste</option>
        <option value="click">Klick / Touch</option>
        <option value="both">Beides</option>
      </select>
    </label>
    <button data-b style="width:100%;padding:6px;border:0;border-radius:4px;color:#fff;cursor:pointer"></button>
    <div style="margin-top:6px;opacity:.8">Flaps: <span data-c>0</span>
      <a data-x href="#" style="float:right;color:#aaa">schließen</a></div>`;
  document.body.appendChild(panel);

  const btn = panel.querySelector('[data-b]');
  const countEl = panel.querySelector('[data-c]');
  const intervalInput = panel.querySelector('[data-i]');
  const intervalLabel = panel.querySelector('[data-v]');

  intervalInput.addEventListener('input', () => {
    state.interval = Number(intervalInput.value);
    intervalLabel.textContent = state.interval;
    if (state.running) { stop(); start(); }
  });
  panel.querySelector('[data-m]').addEventListener('change', e => { state.mode = e.target.value; });
  btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  // Klicks aufs Panel nicht ans Spiel weiterreichen
  ['mousedown', 'pointerdown', 'touchstart', 'keydown'].forEach(ev =>
    panel.addEventListener(ev, e => e.stopPropagation()));

  const onKey = e => { if (e.key === 'F8') { e.preventDefault(); toggle(); } };
  window.addEventListener('keydown', onKey);

  function destroy() {
    stop();
    window.removeEventListener('keydown', onKey);
    panel.remove();
    delete window.__flappyAutoclicker;
  }
  panel.querySelector('[data-x]').addEventListener('click', e => { e.preventDefault(); destroy(); });

  stop(); // setzt Button-Beschriftung
  window.__flappyAutoclicker = { start, stop, toggle, destroy, state };
  console.log('Autoclicker geladen. F8 = Start/Stopp. Steuerung auch über window.__flappyAutoclicker');
})();
