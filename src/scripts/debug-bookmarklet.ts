// Small client script to expose debugging helpers for the app.
// Import this script in development if you want keyboard toggle or a console
// command that prints layout diagnostics.

if (typeof window !== 'undefined') {
  // Add a global helper to toggle outlines
  (window as any).dxkbToggleOutlines = function() {
    document.documentElement.classList.toggle('debug-outlines');
    return document.documentElement.classList.contains('debug-outlines');
  };

  (window as any).dxkbLayoutInfo = function() {
    const q = (s: string) => { const el = document.querySelector(s); return el ? Math.round(el.getBoundingClientRect().height) : null };
    return {
      html: q('html'),
      body: q('body'),
      main: q('main'),
      searchWrapper: q('.flex.min-h-0.flex-1.h-full'),
      genomeShell: q('.flex-1.min-h-0.w-full.flex.overflow-hidden.max-h-screen'),
      tableWrapper: q('.min-w-max.relative'),
      table: q('table.caption-bottom'),
      tbody: q('tbody'),
      footer: q('footer') || q('div[role="contentinfo"]') || null,
      windowInner: Math.round(window.innerHeight),
      docScroll: Math.round(document.documentElement.scrollHeight)
    };
  };

  // Keyboard toggle: Shift+D toggles outlines
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key.toLowerCase() === 'd') {
      (window as any).dxkbToggleOutlines();
      console.log('dxkb: toggled outlines');
    }
  });
}
