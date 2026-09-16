// Entry point and UI Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    // Instantiate Game Engine
    const game = new Game();
    game.animate();

    // Unlock Web Audio API on first touch/click (Mobile browser policy)
    const unlockAudio = () => {
        window.soundManager.init();
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio, { passive: true });

    let selectedPlayer = 'goku';
    let selectedEnemy = 'pikachu';

    // Character Selection Cards
    const playerCards = document.querySelectorAll('.char-card-p1');
    playerCards.forEach(card => {
        card.addEventListener('click', () => {
            playerCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPlayer = card.dataset.char;
        });
    });

    const enemyCards = document.querySelectorAll('.char-card-p2');
    enemyCards.forEach(card => {
        card.addEventListener('click', () => {
            enemyCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedEnemy = card.dataset.char;
        });
    });

    // Start Battle Button
    const btnStart = document.getElementById('btn-start-fight');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            game.startMatch(selectedPlayer, selectedEnemy);
        });
    }

    // Rematch Button
    const btnRematch = document.getElementById('btn-rematch');
    if (btnRematch) {
        btnRematch.addEventListener('click', () => {
            game.startMatch(selectedPlayer, selectedEnemy);
        });
    }

    // Change Character Button
    const btnChangeChar = document.getElementById('btn-change-char');
    if (btnChangeChar) {
        btnChangeChar.addEventListener('click', () => {
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('touch-controls').classList.add('hidden');
            document.getElementById('selection-screen').classList.remove('hidden');
            game.state = 'menu';
        });
    }

    // Check device orientation advice
    const checkOrientation = () => {
        const warn = document.getElementById('orientation-warning');
        if (!warn) return;
        if (window.innerWidth < window.innerHeight && window.innerWidth < 768) {
            warn.classList.remove('hidden');
        } else {
            warn.classList.add('hidden');
        }
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();

    // Prevent default touch pull-to-refresh & pinch-zoom
    document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) e.preventDefault();
    }, { passive: false });
});
