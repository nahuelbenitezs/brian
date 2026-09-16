// ═══════════════════════════════════════════════════
// MAIN ENTRY POINT  —  DBZ × Pokémon: Anime Clash 3D
// ═══════════════════════════════════════════════════

window.soundManager = new SoundManager();

let game = null;
let selectedPlayer = 'goku';
let selectedEnemy  = 'pikachu';

// ─────────────────────────────────────────────────
//  LOADING SCREEN  (simulated progress + real init)
// ─────────────────────────────────────────────────
function runLoadingScreen(onComplete) {
    const bar  = document.getElementById('load-bar');
    const text = document.getElementById('load-text');
    const msgs = ['Iniciando motor 3D...', 'Cargando arena...', 'Preparando personajes...', 'Listo!'];
    let progress = 0;
    let msgIdx = 0;

    const tick = () => {
        progress += Math.random() * 18 + 6;
        if (progress > 100) progress = 100;

        bar.style.width = progress + '%';
        if (msgIdx < msgs.length - 1 && progress > (msgIdx + 1) * 25) {
            msgIdx++;
            text.textContent = msgs[msgIdx];
        }

        if (progress < 100) {
            setTimeout(tick, 80 + Math.random() * 100);
        } else {
            text.textContent = '¡Listo!';
            setTimeout(onComplete, 400);
        }
    };

    setTimeout(tick, 300);
}

// ─────────────────────────────────────────────────
//  INIT  (runs on DOMContentLoaded)
// ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // One-time audio unlock on first touch/click
    const audioUnlock = () => {
        window.soundManager.init();
        document.removeEventListener('touchstart', audioUnlock);
        document.removeEventListener('click',      audioUnlock);
    };
    document.addEventListener('touchstart', audioUnlock, { passive: true });
    document.addEventListener('click',      audioUnlock);

    // Boot Game object (starts rendering loop immediately)
    game = new Game();
    window.game = game;
    game.animate();

    // Loading → Title
    runLoadingScreen(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');
    });

    // ── TITLE SCREEN ───────────────────────────
    document.getElementById('btn-play').addEventListener('click', () => {
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.remove('hidden');
    });

    // ── CHARACTER SELECTION ────────────────────
    setupRoster('roster-p1', 'p1', (char) => { selectedPlayer = char; });
    setupRoster('roster-p2', 'p2', (char) => { selectedEnemy  = char; });

    document.getElementById('btn-start-fight').addEventListener('click', () => {
        if (selectedPlayer === selectedEnemy) {
            // Allow mirror match — just a brief flash
            document.getElementById('btn-start-fight').textContent = '⚡ ¡BATALLA DE CLONES!';
            setTimeout(() => {
                document.getElementById('btn-start-fight').textContent = '⚡ ¡A LUCHAR!';
            }, 800);
        }
        game.startMatch(selectedPlayer, selectedEnemy);
    });

    // ── GAME OVER BUTTONS ──────────────────────
    document.getElementById('btn-rematch').addEventListener('click', () => {
        document.getElementById('gameover-screen').classList.add('hidden');
        game.startMatch(selectedPlayer, selectedEnemy);
    });

    document.getElementById('btn-back-sel').addEventListener('click', () => {
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('selection-screen').classList.remove('hidden');
    });

    // ── ORIENTATION HINT ───────────────────────
    const rotWarn = document.getElementById('rotate-warn');
    const checkOrientation = () => {
        const portrait = window.innerHeight > window.innerWidth * 1.1;
        rotWarn.classList.toggle('hidden', !portrait);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();
});

// ─────────────────────────────────────────────────
//  Roster selection helper
// ─────────────────────────────────────────────────
function setupRoster(rosterId, side, onChange) {
    const roster = document.getElementById(rosterId);
    if (!roster) return;

    roster.querySelectorAll('.char-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            // Can't pick same fighter for both sides
            const char = tile.dataset.char;
            roster.querySelectorAll('.char-tile').forEach(t => t.classList.remove('selected'));
            tile.classList.add('selected');
            onChange(char);

            // Haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(18);
        });
    });
}
