/*
 * nav.js — tastaturlaget for navigasjonsprototypen.
 *
 * Escape = HOME, fra hvor som helst. Det er tastaturets motstykke til
 * HOME-sirkelen: én global «opp», ingen stack. På Home gjør Escape ingenting.
 * Tab/Shift-Tab og Enter/Space er native — kontrollene er ekte <a> og <button>.
 */
const IS_HOME = document.body.dataset.screen === 'home';

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !IS_HOME) {
    window.location.href = document.body.dataset.home ?? './index.html';
  }
});

/* Linsepiller i skjelettet: bytt aria-pressed. Ingen innholdsendring her —
   selve linsebyttet bygges i del 2. */
for (const group of document.querySelectorAll('.lens-switch')) {
  group.addEventListener('click', (e) => {
    const pill = e.target.closest('.lens-pill');
    if (!pill) return;
    for (const p of group.querySelectorAll('.lens-pill')) {
      p.setAttribute('aria-pressed', String(p === pill));
    }
  });
}
