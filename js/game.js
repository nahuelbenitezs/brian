// ═══════════════════════════════════════════════════
// GAME ENGINE  —  DBZ × Pokémon: Anime Clash 3D
// Complete rewrite: timer, rounds, combo system,
// pause, stats, damage numbers, improved AI & camera
// ═══════════════════════════════════════════════════

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();

        // Match State
        this.state = 'loading'; // loading | menu | selection | countdown | fighting | paused | ended
        this.round = 1;
        this.maxRounds = 3;
        this.roundWins = { player: 0, cpu: 0 };
        this.matchTimer = 60; // seconds per round
        this.matchTimerEl = document.getElementById('battle-timer');
        this.roundLabelEl = document.getElementById('round-label');

        // Stats (tracked per match)
        this.stats = {
            playerDamageDealt: 0,
            playerCombos: 0,
            playerMaxCombo: 0,
            playerUltimates: 0,
        };

        // Fighters
        this.player = null;
        this.enemy = null;
        this.playerType = 'goku';
        this.enemyType = 'pikachu';

        // Systems
        this.vfx = null;
        this.arena = null;
        this.input = null;

        // Combo state
        this.comboTimer = 0;
        this.comboCount = 0;
        this.comboEl = document.getElementById('p1-combo');
        this.comboNumEl = document.getElementById('p1-combo-num');

        // AI
        this.aiTimer = 0;
        this.aiAction = 'idle';
        this.aiReactionDelay = 0.35;

        this.initThree();
        this.initHUD();
        this.initPauseUI();
    }

    // ─────────────────────────────────────────────
    //  Three.js Scene Setup
    // ─────────────────────────────────────────────
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x6aafd8);
        this.scene.fog = new THREE.FogExp2(0x6aafd8, 0.018);

        const w = window.innerWidth, h = window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 180);
        this.camera.position.set(0, 5.5, 17);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false
        });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        // Hemisphere (sky/ground bounce)
        const hemi = new THREE.HemisphereLight(0xb0d8ff, 0x553311, 0.6);
        this.scene.add(hemi);

        // Main directional light (sun)
        const sun = new THREE.DirectionalLight(0xfff5e0, 1.05);
        sun.position.set(10, 22, 12);
        sun.castShadow = true;
        sun.shadow.mapSize.setScalar(2048);
        sun.shadow.camera.left = -20;
        sun.shadow.camera.right = 20;
        sun.shadow.camera.top = 20;
        sun.shadow.camera.bottom = -10;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 60;
        sun.shadow.bias = -0.001;
        this.scene.add(sun);

        // Rim / fill light (from behind — dramatic anime look)
        const rim = new THREE.DirectionalLight(0x3366ff, 0.4);
        rim.position.set(-8, 10, -12);
        this.scene.add(rim);

        // Systems
        this.vfx = new VFXManager(this.scene);
        this.arena = new Arena(this.scene);
        this.input = new InputManager();

        // Camera smoothing state
        this.camTarget = new THREE.Vector3(0, 5.5, 17);
        this.camLookAt = new THREE.Vector3(0, 1.4, 0);

        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ─────────────────────────────────────────────
    //  HUD Elements
    // ─────────────────────────────────────────────
    initHUD() {
        this.p1HP  = document.getElementById('p1-hp');
        this.p1Ki  = document.getElementById('p1-ki');
        this.p1NameEl = document.getElementById('p1-name');
        this.p2HP  = document.getElementById('p2-hp');
        this.p2Ki  = document.getElementById('p2-ki');
        this.p2NameEl = document.getElementById('p2-name');
        this.announcerEl = document.getElementById('announcer');
        this.btnUltimate = document.getElementById('btn-ultimate');
        this.damageFlash = document.getElementById('damage-flash');
    }

    initPauseUI() {
        const pauseBtn = document.getElementById('btn-pause');
        const resumeBtn = document.getElementById('btn-resume');
        const quitBtn = document.getElementById('btn-quit-match');
        const soundBtn = document.getElementById('btn-sound');
        const fsBtn = document.getElementById('btn-fs');

        soundBtn && soundBtn.addEventListener('click', () => {
            window.soundManager.init();
            const m = window.soundManager.toggleMute();
            soundBtn.textContent = m ? '🔇' : '🔊';
        });

        fsBtn && fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });

        pauseBtn && pauseBtn.addEventListener('click', () => this.togglePause());
        resumeBtn && resumeBtn.addEventListener('click', () => this.togglePause());
        quitBtn && quitBtn.addEventListener('click', () => {
            this.state = 'menu';
            document.getElementById('pause-screen').classList.add('hidden');
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('touch-controls').classList.add('hidden');
            document.getElementById('btn-pause').classList.add('hidden');
            window.soundManager.stopMusic();
            document.getElementById('title-screen').classList.remove('hidden');
        });

        // Keyboard Escape for pause
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape' && (this.state === 'fighting' || this.state === 'paused')) {
                this.togglePause();
            }
        });
    }

    // ─────────────────────────────────────────────
    //  Match Flow
    // ─────────────────────────────────────────────
    startMatch(playerType, enemyType) {
        this.playerType = playerType;
        this.enemyType = enemyType;

        window.soundManager.init();
        window.soundManager.startMusic();

        this.clearFighters();

        this.player = new Fighter(playerType, true, this.scene, this.vfx);
        this.enemy  = new Fighter(enemyType, false, this.scene, this.vfx);

        // Reset stats for this match
        this.stats = { playerDamageDealt: 0, playerCombos: 0, playerMaxCombo: 0, playerUltimates: 0 };
        this.comboCount = 0;
        this.matchTimer = 60;

        // HUD names
        this.p1NameEl.textContent = playerType.toUpperCase();
        this.p2NameEl.textContent = enemyType.toUpperCase();

        // Show battle UI
        document.getElementById('selection-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('touch-controls').classList.remove('hidden');
        document.getElementById('btn-pause').classList.remove('hidden');
        document.getElementById('round-label').textContent = `ROUND ${this.round}`;

        this.startCountdown();
    }

    clearFighters() {
        if (this.player) { this.scene.remove(this.player.group); this.player = null; }
        if (this.enemy)  { this.scene.remove(this.enemy.group);  this.enemy  = null; }
    }

    startCountdown() {
        this.state = 'countdown';
        const steps = [
            { text: '3', delay: 0 },
            { text: '2', delay: 800 },
            { text: '1', delay: 1600 },
            { text: '¡PELEA!', delay: 2400 },
        ];

        steps.forEach(({ text, delay }) => {
            setTimeout(() => {
                if (this.state !== 'countdown') return;
                this.showAnnouncer(text, 700);
                window.soundManager.playCountdownBeep && window.soundManager.playCountdownBeep(text === '¡PELEA!');
            }, delay);
        });

        setTimeout(() => {
            if (this.state === 'countdown') {
                this.state = 'fighting';
                this.vfx.shake(0.12);
            }
        }, 3100);
    }

    togglePause() {
        if (this.state === 'fighting') {
            this.state = 'paused';
            document.getElementById('pause-screen').classList.remove('hidden');
            window.soundManager.stopMusic();
        } else if (this.state === 'paused') {
            this.state = 'fighting';
            document.getElementById('pause-screen').classList.add('hidden');
            window.soundManager.startMusic();
        }
    }

    showAnnouncer(text, duration = 1200) {
        const el = this.announcerEl;
        if (!el) return;
        el.textContent = text;
        el.classList.remove('hidden', 'ann-out');
        el.classList.add('ann-in');

        clearTimeout(this._annTimer);
        this._annTimer = setTimeout(() => {
            el.classList.remove('ann-in');
            el.classList.add('ann-out');
            setTimeout(() => el.classList.add('hidden'), 350);
        }, duration);
    }

    // ─────────────────────────────────────────────
    //  PLAYER INPUT
    // ─────────────────────────────────────────────
    handlePlayerInput(dt) {
        if (!this.player || this.player.isDead || this.state !== 'fighting') return;
        const mv = this.input.moveVector;

        const moving = Math.abs(mv.x) > 0.06 || Math.abs(mv.z) > 0.06;
        if (moving) {
            let spd = this.player.speed;
            if (this.input.actions.dash) {
                spd *= 2.1;
                window.soundManager.playDash();
                this.vfx.emitAura(this.player.position, this.player.auraColor, 1);
            }
            this.player.position.x += mv.x * spd * dt;
            this.player.position.z += mv.z * spd * 0.65 * dt;

            if (!['attack','blast','charge','ultimate','hurt'].includes(this.player.state)) {
                this.player.setAnimation('run');
            }
        } else {
            if (this.player.state === 'run') this.player.setAnimation('idle');
        }

        // Single-fire actions (guarded by cooldown inside Fighter)
        if (this.input.actions.attack) this.doPlayerAttack();
        if (this.input.actions.blast)  this.player.shootBlast(this.enemy);
        if (this.input.actions.ultimate) this.doPlayerUltimate();

        this.player.chargeKi(this.input.actions.charge);
    }

    doPlayerAttack() {
        if (!this.player || !this.enemy) return;
        const dmg = this.player.attack(this.enemy);
        if (dmg > 0) {
            this.stats.playerDamageDealt += dmg;
            this.registerCombo(dmg);
            this.triggerDamageFlash('red');
            this.spawnDamageNumber(this.enemy.position, dmg, dmg >= 20);
        }
    }

    doPlayerUltimate() {
        if (!this.player || !this.enemy) return;
        const ok = this.player.triggerUltimate(this.enemy);
        if (ok) this.stats.playerUltimates++;
    }

    // ─────────────────────────────────────────────
    //  COMBO SYSTEM
    // ─────────────────────────────────────────────
    registerCombo(dmg) {
        this.comboTimer = 1.8;
        this.comboCount++;
        if (this.comboCount > this.stats.playerMaxCombo) this.stats.playerMaxCombo = this.comboCount;
        if (this.comboCount >= 2) {
            this.stats.playerCombos++;
            this.comboEl.classList.remove('hidden');
            this.comboNumEl.textContent = this.comboCount;
            // Re-trigger CSS animation
            this.comboEl.style.animation = 'none';
            void this.comboEl.offsetWidth;
            this.comboEl.style.animation = '';
        }
    }

    tickCombo(dt) {
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
                this.comboEl.classList.add('hidden');
            }
        }
    }

    // ─────────────────────────────────────────────
    //  IMPROVED AI
    // ─────────────────────────────────────────────
    updateAI(dt) {
        if (!this.enemy || this.enemy.isDead || this.state !== 'fighting') return;

        this.aiTimer -= dt;
        const dist = this.enemy.position.distanceTo(this.player.position);
        const dx   = this.player.position.x - this.enemy.position.x;
        const dz   = this.player.position.z - this.enemy.position.z;
        const enemyHPPct = this.enemy.health / this.enemy.maxHealth;
        const playerHPPct = this.player.health / this.player.maxHealth;

        if (this.aiTimer <= 0) {
            // Adapt reaction time to difficulty: faster when enemy HP low
            this.aiTimer = 0.28 + Math.random() * 0.42 + (1 - enemyHPPct) * 0.1;

            const hasUltimate = this.enemy.ki >= this.enemy.ultimateCost;
            const rng = Math.random();

            if (hasUltimate && rng < 0.55) {
                this.aiAction = 'ultimate';
            } else if (dist < 2.2) {
                if (rng < 0.6) this.aiAction = 'attack';
                else if (rng < 0.8) this.aiAction = 'retreat';
                else this.aiAction = 'blast';
            } else if (dist < 5) {
                if (this.enemy.ki >= 15 && rng < 0.4) this.aiAction = 'blast';
                else if (rng < 0.7) this.aiAction = 'approach';
                else this.aiAction = 'retreat';
            } else {
                if (this.enemy.ki < 55 && rng < 0.6) this.aiAction = 'charge';
                else if (this.enemy.ki >= 15 && rng < 0.55) this.aiAction = 'blast';
                else this.aiAction = 'approach';
            }

            // Aggressive when winning, defensive when losing
            if (playerHPPct < 0.3 && rng < 0.7) this.aiAction = 'approach';
            if (enemyHPPct < 0.2 && dist > 3)   this.aiAction = 'blast';
        }

        const spd = this.enemy.speed;
        switch (this.aiAction) {
            case 'approach': {
                this.enemy.position.x += Math.sign(dx) * spd * 0.82 * dt;
                this.enemy.position.z += Math.sign(dz) * spd * 0.5 * dt;
                if (this.enemy.state === 'idle') this.enemy.setAnimation('run');
                this.enemy.chargeKi(false);
                break;
            }
            case 'retreat': {
                this.enemy.position.x -= Math.sign(dx) * spd * 0.9 * dt;
                this.enemy.position.z -= Math.sign(dz) * spd * 0.4 * dt;
                if (this.enemy.state === 'idle') this.enemy.setAnimation('run');
                this.enemy.chargeKi(false);
                break;
            }
            case 'attack': {
                this.enemy.chargeKi(false);
                if (dist < 2.5) {
                    const dmg = this.enemy.attack(this.player);
                    if (dmg > 0) {
                        this.triggerDamageFlash('blue');
                        this.spawnDamageNumber(this.player.position, dmg, dmg >= 20);
                    }
                } else {
                    this.aiAction = 'approach';
                }
                break;
            }
            case 'blast': {
                this.enemy.chargeKi(false);
                this.enemy.shootBlast(this.player);
                this.aiAction = 'idle';
                break;
            }
            case 'charge': {
                this.enemy.chargeKi(true);
                break;
            }
            case 'ultimate': {
                this.enemy.chargeKi(false);
                const ok = this.enemy.triggerUltimate(this.player);
                this.aiAction = ok ? 'idle' : 'approach';
                break;
            }
            default: {
                this.enemy.chargeKi(false);
                if (this.enemy.state === 'run') this.enemy.setAnimation('idle');
                break;
            }
        }
    }

    // ─────────────────────────────────────────────
    //  COLLISION
    // ─────────────────────────────────────────────
    checkCollisions() {
        // Projectiles
        const projs = this.vfx.projectiles;
        for (let i = projs.length - 1; i >= 0; i--) {
            const p = projs[i];
            const target = p.owner === this.player ? this.enemy : this.player;
            if (!target || target.isDead) continue;
            const hp = target.position.clone().add(new THREE.Vector3(0, 1.2, 0));
            if (p.mesh.position.distanceTo(hp) < p.radius + 0.95) {
                const dmg = target.applyDamage(p.damage, p.owner, false);
                this.vfx.createHitSparks(p.mesh.position, p.color, 18);
                this.spawnDamageNumber(target.position, dmg, false);
                if (p.owner === this.player) this.stats.playerDamageDealt += dmg;
                if (target === this.enemy) this.triggerDamageFlash('red');
                else { this.triggerDamageFlash('blue'); }
                window.soundManager.playPunch(false);
                this.scene.remove(p.mesh);
                projs.splice(i, 1);
            }
        }

        // Beams
        for (const b of this.vfx.beams) {
            const target = b.owner === this.player ? this.enemy : this.player;
            if (!target || target.isDead) continue;
            const toT = target.position.clone().sub(b.startPos);
            const along = toT.dot(b.direction);
            if (along > 0 && along < b.length) {
                const closest = b.startPos.clone().addScaledVector(b.direction, along);
                if (target.position.distanceTo(closest) < b.radius + 1.3) {
                    const dmg = target.applyDamage(b.damage * (1/60), b.owner, true);
                    if (b.owner === this.player) this.stats.playerDamageDealt += dmg;
                    if (Math.random() < 0.25) {
                        this.vfx.createHitSparks(target.position.clone().add(new THREE.Vector3(0,1,0)), b.color, 6);
                        this.spawnDamageNumber(target.position, dmg * 60 | 0, false);
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    //  CAMERA — Cinematic Fighting Camera
    // ─────────────────────────────────────────────
    updateCamera(dt) {
        if (!this.player || !this.enemy) return;
        const px = this.player.position.x, ex = this.enemy.position.x;
        const pz = this.player.position.z, ez = this.enemy.position.z;
        const midX = (px + ex) * 0.5;
        const midZ = (pz + ez) * 0.5;
        const gap  = Math.hypot(px - ex, pz - ez);
        const pullback = Math.max(8, gap * 0.8);

        this.camTarget.set(
            midX * 0.6 + this.vfx.cameraShakeOffset.x,
            4.2 + gap * 0.12 + this.vfx.cameraShakeOffset.y,
            11 + pullback * 0.55 + this.vfx.cameraShakeOffset.z
        );
        this.camLookAt.set(midX * 0.8, 1.6, midZ * 0.4);

        this.camera.position.lerp(this.camTarget, dt * 5.5);
        this.camera.lookAt(this.camLookAt);
    }

    // ─────────────────────────────────────────────
    //  HUD UPDATE
    // ─────────────────────────────────────────────
    updateHUD(dt) {
        if (!this.player || !this.enemy) return;

        // HP bars
        const p1Pct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
        const p2Pct = Math.max(0, (this.enemy.health  / this.enemy.maxHealth)  * 100);
        this.p1HP.style.width = p1Pct + '%';
        this.p2HP.style.width = p2Pct + '%';

        // Ki bars
        this.p1Ki.style.width = Math.max(0, (this.player.ki / this.player.maxKi) * 100) + '%';
        this.p2Ki.style.width = Math.max(0, (this.enemy.ki  / this.enemy.maxKi)  * 100) + '%';

        // Ultimate button glow
        if (this.btnUltimate) {
            this.btnUltimate.classList.toggle('ready', this.player.ki >= this.player.ultimateCost);
        }

        // Match Timer (only during fighting)
        if (this.state === 'fighting') {
            this.matchTimer = Math.max(0, this.matchTimer - dt);
            const secs = Math.ceil(this.matchTimer);
            this.matchTimerEl.textContent = secs;
            this.matchTimerEl.classList.toggle('urgent', secs <= 10);

            if (this.matchTimer <= 0) this.timeoutDraw();
        }
    }

    // ─────────────────────────────────────────────
    //  MATCH END LOGIC
    // ─────────────────────────────────────────────
    checkMatchEnd() {
        if (this.state !== 'fighting') return;
        if (!this.player.isDead && !this.enemy.isDead) return;

        const playerWon = !this.player.isDead && this.enemy.isDead;
        this.endRound(playerWon);
    }

    timeoutDraw() {
        if (this.state !== 'fighting') return;
        // Win goes to whoever has more HP
        const playerWon = this.player.health >= this.enemy.health;
        this.endRound(playerWon);
    }

    endRound(playerWon) {
        this.state = 'ended';
        const winner = playerWon ? 'player' : 'cpu';
        this.roundWins[winner]++;
        window.soundManager.stopKiCharge();

        setTimeout(() => {
            this.showAnnouncer(playerWon ? 'K.O.!' : 'K.O.!', 1600);
            if (playerWon) window.soundManager.playVictory();

            setTimeout(() => {
                if (this.roundWins.player >= 2 || this.roundWins.cpu >= 2 || this.round >= this.maxRounds) {
                    this.showGameOver(this.roundWins.player > this.roundWins.cpu);
                } else {
                    this.round++;
                    this.matchTimer = 60;
                    this.clearFighters();
                    this.player = new Fighter(this.playerType, true, this.scene, this.vfx);
                    this.enemy  = new Fighter(this.enemyType, false, this.scene, this.vfx);
                    document.getElementById('round-label').textContent = `ROUND ${this.round}`;
                    this.startCountdown();
                }
            }, 2000);
        }, 500);
    }

    showGameOver(won) {
        const title = document.getElementById('go-title');
        const sub   = document.getElementById('go-sub');
        const stats = document.getElementById('go-stats');

        title.textContent = won ? '¡VICTORIA!' : '¡DERROTA!';
        title.style.color = won ? '#ffd700' : '#ff4444';

        sub.textContent = won
            ? `¡${this.playerType.toUpperCase()} venció a ${this.enemyType.toUpperCase()}!`
            : `${this.enemyType.toUpperCase()} demostró ser más fuerte...`;

        stats.innerHTML = `
            <div class="go-stat"><div class="go-stat-num">${this.stats.playerDamageDealt | 0}</div><div class="go-stat-lbl">Daño Total</div></div>
            <div class="go-stat"><div class="go-stat-num">${this.stats.playerMaxCombo}</div><div class="go-stat-lbl">Max Combo</div></div>
            <div class="go-stat"><div class="go-stat-num">${this.stats.playerUltimates}</div><div class="go-stat-lbl">Ultimates</div></div>
            <div class="go-stat"><div class="go-stat-num">${this.roundWins.player}-${this.roundWins.cpu}</div><div class="go-stat-lbl">Rondas</div></div>
        `;

        document.getElementById('hud').classList.add('hidden');
        document.getElementById('touch-controls').classList.add('hidden');
        document.getElementById('btn-pause').classList.add('hidden');
        document.getElementById('gameover-screen').classList.remove('hidden');

        this.round = 1;
        this.roundWins = { player: 0, cpu: 0 };
        window.soundManager.stopMusic();
    }

    // ─────────────────────────────────────────────
    //  VISUAL HELPERS
    // ─────────────────────────────────────────────
    triggerDamageFlash(color) {
        const el = this.damageFlash;
        if (!el) return;
        el.classList.remove('flash-red', 'flash-blue');
        void el.offsetWidth;
        el.classList.add('flash-' + color);
    }

    spawnDamageNumber(worldPos, damage, critical) {
        if (damage <= 0) return;
        const dmgInt = damage | 0;
        if (dmgInt === 0) return;

        // Project 3D to 2D
        const v = worldPos.clone().add(new THREE.Vector3((Math.random()-0.5)*1.5, 2.2, 0));
        v.project(this.camera);
        const x = (v.x * 0.5 + 0.5) * window.innerWidth;
        const y = (1 - (v.y * 0.5 + 0.5)) * window.innerHeight;

        if (x < -50 || x > window.innerWidth + 50) return;

        const el = document.createElement('div');
        el.className = 'dmg-text' + (critical ? ' critical' : '');
        el.textContent = critical ? `💥${dmgInt}` : dmgInt;
        el.style.left = x + 'px';
        el.style.top  = y + 'px';
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }

    // ─────────────────────────────────────────────
    //  MAIN LOOP
    // ─────────────────────────────────────────────
    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = Math.min(this.clock.getDelta(), 0.08);

        const active = this.state === 'fighting' || this.state === 'countdown' || this.state === 'ended';

        if (active) {
            if (this.state === 'fighting') {
                this.handlePlayerInput(dt);
                this.updateAI(dt);
                this.tickCombo(dt);
            }

            if (this.player) this.player.update(dt, this.enemy);
            if (this.enemy)  this.enemy.update(dt, this.player);

            if (this.state === 'fighting') {
                this.checkCollisions();
                this.updateHUD(dt);
                this.checkMatchEnd();
            }

            this.updateCamera(dt);
        }

        this.vfx.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

window.Game = Game;
