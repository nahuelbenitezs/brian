// Core Game Orchestrator & Combat Loop
class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();

        this.playerType = 'goku';
        this.enemyType = 'pikachu';

        this.player = null;
        this.enemy = null;
        this.arena = null;
        this.vfx = null;
        this.input = null;

        this.state = 'menu'; // 'menu', 'countdown', 'fighting', 'ended'
        this.countdownTimer = 0;

        this.aiDecisionTimer = 0;
        this.aiAction = 'idle';

        this.initThree();
        this.initHUD();
    }

    initThree() {
        // Scene & Renderer
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x76b6ff); // Anime blue sky
        this.scene.fog = new THREE.Fog(0x76b6ff, 35, 80);

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            150
        );
        this.camera.position.set(0, 5, 16);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lighting (Anime Cel look)
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.75);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xfffaed, 0.95);
        dirLight.position.set(12, 22, 14);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 60;
        dirLight.shadow.camera.left = -18;
        dirLight.shadow.camera.right = 18;
        dirLight.shadow.camera.top = 18;
        dirLight.shadow.camera.bottom = -18;
        this.scene.add(dirLight);

        // Systems
        this.vfx = new VFXManager(this.scene);
        this.arena = new Arena(this.scene);
        this.input = new InputManager();

        // Responsive Resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    initHUD() {
        this.p1HealthBar = document.getElementById('p1-health-fill');
        this.p1KiBar = document.getElementById('p1-ki-fill');
        this.p1Name = document.getElementById('p1-name');

        this.p2HealthBar = document.getElementById('p2-health-fill');
        this.p2KiBar = document.getElementById('p2-ki-fill');
        this.p2Name = document.getElementById('p2-name');

        this.announcer = document.getElementById('announcer-text');
        this.btnUltimate = document.getElementById('btn-ultimate');
        this.soundBtn = document.getElementById('btn-sound-toggle');
        this.fullscreenBtn = document.getElementById('btn-fullscreen');

        if (this.soundBtn) {
            this.soundBtn.addEventListener('click', () => {
                window.soundManager.init();
                const muted = window.soundManager.toggleMute();
                this.soundBtn.textContent = muted ? '🔇' : '🔊';
            });
        }

        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }
    }

    startMatch(playerChoice, enemyChoice) {
        window.soundManager.init();
        window.soundManager.startMusic();

        this.playerType = playerChoice;
        this.enemyType = enemyChoice;

        // Clear existing fighters
        if (this.player) this.scene.remove(this.player.group);
        if (this.enemy) this.scene.remove(this.enemy.group);

        // Create new fighters
        this.player = new Fighter(this.playerType, true, this.scene, this.vfx);
        this.enemy = new Fighter(this.enemyType, false, this.scene, this.vfx);

        // Update Names & Icons
        if (this.p1Name) this.p1Name.textContent = this.playerType.toUpperCase();
        if (this.p2Name) this.p2Name.textContent = this.enemyType.toUpperCase() + ' (CPU)';

        // Hide screens, show fight UI
        document.getElementById('selection-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('touch-controls').classList.remove('hidden');

        // Countdown State
        this.state = 'countdown';
        this.countdownTimer = 3.0;
        this.showAnnouncer('READY...', 1000);
        setTimeout(() => {
            if (this.state === 'countdown') {
                this.showAnnouncer('FIGHT!', 1000);
                this.state = 'fighting';
            }
        }, 1200);
    }

    showAnnouncer(text, duration = 1200) {
        if (!this.announcer) return;
        this.announcer.textContent = text;
        this.announcer.classList.remove('hidden', 'fade-out');
        this.announcer.classList.add('pop-in');

        clearTimeout(this.announcerTimer);
        this.announcerTimer = setTimeout(() => {
            this.announcer.classList.add('fade-out');
            setTimeout(() => {
                this.announcer.classList.add('hidden');
            }, 300);
        }, duration);
    }

    handlePlayerInput(dt) {
        if (!this.player || this.player.isDead || this.state !== 'fighting') return;

        // Movement
        const mv = this.input.moveVector;
        if (Math.abs(mv.x) > 0.05 || Math.abs(mv.z) > 0.05) {
            let speed = this.player.speed;
            if (this.input.actions.dash) {
                speed *= 1.8;
                this.vfx.emitAura(this.player.position, this.player.auraColor, 1);
            }
            this.player.position.x += mv.x * speed * dt;
            this.player.position.z += mv.z * speed * 0.7 * dt;
            if (this.player.state !== 'attack' && this.player.state !== 'blast' && this.player.state !== 'charge' && this.player.state !== 'ultimate') {
                this.player.setAnimation('run');
            }
        } else {
            if (this.player.state === 'run') {
                this.player.setAnimation('idle');
            }
        }

        // Actions
        if (this.input.actions.attack) {
            this.player.attack(this.enemy);
        }
        if (this.input.actions.blast) {
            this.player.shootBlast(this.enemy);
        }
        this.player.chargeKi(this.input.actions.charge);

        if (this.input.actions.ultimate) {
            this.player.triggerUltimate(this.enemy);
        }
    }

    updateAI(dt) {
        if (!this.enemy || this.enemy.isDead || this.state !== 'fighting') return;

        this.aiDecisionTimer -= dt;
        const dist = this.enemy.position.distanceTo(this.player.position);
        const dx = this.player.position.x - this.enemy.position.x;
        const dz = this.player.position.z - this.enemy.position.z;

        if (this.aiDecisionTimer <= 0) {
            this.aiDecisionTimer = 0.4 + Math.random() * 0.5;

            // Decision Tree based on distance and Ki
            if (this.enemy.ki >= this.enemy.ultimateCost && Math.random() < 0.65) {
                this.aiAction = 'ultimate';
            } else if (dist < 2.4) {
                this.aiAction = Math.random() < 0.75 ? 'attack' : 'retreat';
            } else if (dist > 7.0 && this.enemy.ki < 60 && Math.random() < 0.7) {
                this.aiAction = 'charge';
            } else if (dist > 4.0 && this.enemy.ki >= 20 && Math.random() < 0.5) {
                this.aiAction = 'blast';
            } else {
                this.aiAction = 'approach';
            }
        }

        // Execute AI Action
        switch (this.aiAction) {
            case 'approach': {
                const moveSpeed = this.enemy.speed * 0.85;
                this.enemy.position.x += Math.sign(dx) * moveSpeed * dt;
                this.enemy.position.z += Math.sign(dz) * moveSpeed * 0.6 * dt;
                this.enemy.setAnimation('run');
                this.enemy.chargeKi(false);
                break;
            }
            case 'retreat': {
                const moveSpeed = this.enemy.speed * 0.9;
                this.enemy.position.x -= Math.sign(dx) * moveSpeed * dt;
                this.enemy.setAnimation('run');
                this.enemy.chargeKi(false);
                break;
            }
            case 'attack': {
                this.enemy.chargeKi(false);
                if (dist < 2.6) {
                    this.enemy.attack(this.player);
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
                this.enemy.triggerUltimate(this.player);
                this.aiAction = 'idle';
                break;
            }
            default: {
                this.enemy.chargeKi(false);
                if (this.enemy.state === 'run') this.enemy.setAnimation('idle');
                break;
            }
        }
    }

    checkCombatCollisions() {
        // Check Projectiles vs Fighters
        const projs = this.vfx.projectiles;
        for (let i = projs.length - 1; i >= 0; i--) {
            const p = projs[i];
            const target = (p.owner === this.player) ? this.enemy : this.player;

            if (target && !target.isDead) {
                const hitPos = target.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                const dist = p.mesh.position.distanceTo(hitPos);

                if (dist < p.radius + 0.9) {
                    target.takeDamage(p.damage, p.owner, false);
                    this.vfx.createHitSparks(p.mesh.position, p.color, 16);
                    window.soundManager.playPunch(true);

                    // Remove projectile
                    this.scene.remove(p.mesh);
                    projs.splice(i, 1);
                }
            }
        }

        // Check Beams vs Fighters
        const beams = this.vfx.beams;
        for (let b of beams) {
            const target = (b.owner === this.player) ? this.enemy : this.player;
            if (target && !target.isDead) {
                // Check if target is along beam path
                const beamStart = b.startPos;
                const toTarget = target.position.clone().sub(beamStart);
                const projLength = toTarget.dot(b.direction);

                if (projLength > 0 && projLength < b.length) {
                    const closestPoint = beamStart.clone().addScaledVector(b.direction, projLength);
                    const distToCenter = target.position.distanceTo(closestPoint);

                    if (distToCenter < b.radius + 1.2) {
                        target.takeDamage(b.damage * (1/60), b.owner, true);
                        if (Math.random() < 0.3) {
                            this.vfx.createHitSparks(target.position.clone().add(new THREE.Vector3(0, 1, 0)), b.color, 8);
                        }
                    }
                }
            }
        }
    }

    updateCamera(dt) {
        if (!this.player || !this.enemy) return;

        // Dynamic Fighting Camera tracking midpoint
        const midX = (this.player.position.x + this.enemy.position.x) / 2;
        const midZ = (this.player.position.z + this.enemy.position.z) / 2;
        const fighterDist = Math.max(7, Math.abs(this.player.position.x - this.enemy.position.x));

        const targetCamX = midX * 0.8;
        const targetCamY = 3.8 + fighterDist * 0.18;
        const targetCamZ = 10 + fighterDist * 0.6;

        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX + this.vfx.cameraShakeOffset.x, dt * 6);
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY + this.vfx.cameraShakeOffset.y, dt * 6);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ + this.vfx.cameraShakeOffset.z, dt * 6);

        const lookTarget = new THREE.Vector3(midX, 1.4, midZ);
        this.camera.lookAt(lookTarget);
    }

    updateHUD() {
        if (this.player && this.p1HealthBar && this.p1KiBar) {
            this.p1HealthBar.style.width = `${Math.max(0, (this.player.health / this.player.maxHealth) * 100)}%`;
            this.p1KiBar.style.width = `${Math.max(0, (this.player.ki / this.player.maxKi) * 100)}%`;

            // Ultimate Ready Glow
            if (this.btnUltimate) {
                if (this.player.ki >= this.player.ultimateCost) {
                    this.btnUltimate.classList.add('ready');
                } else {
                    this.btnUltimate.classList.remove('ready');
                }
            }
        }

        if (this.enemy && this.p2HealthBar && this.p2KiBar) {
            this.p2HealthBar.style.width = `${Math.max(0, (this.enemy.health / this.enemy.maxHealth) * 100)}%`;
            this.p2KiBar.style.width = `${Math.max(0, (this.enemy.ki / this.enemy.maxKi) * 100)}%`;
        }
    }

    checkMatchEnd() {
        if (this.state !== 'fighting') return;

        if (this.player.isDead || this.enemy.isDead) {
            this.state = 'ended';
            const playerWon = !this.player.isDead && this.enemy.isDead;

            setTimeout(() => {
                this.showAnnouncer('K.O.!', 2000);
                if (playerWon) window.soundManager.playVictory();

                setTimeout(() => {
                    this.showGameOver(playerWon);
                }, 2200);
            }, 500);
        }
    }

    showGameOver(won) {
        const screen = document.getElementById('game-over-screen');
        const title = document.getElementById('game-over-title');
        const sub = document.getElementById('game-over-sub');

        if (title) {
            title.textContent = won ? '¡VICTORIA!' : '¡DERROTA!';
            title.style.color = won ? '#ffd700' : '#ff4444';
        }
        if (sub) {
            sub.textContent = won
                ? `¡${this.playerType.toUpperCase()} HA VENCIDO A ${this.enemyType.toUpperCase()}!`
                : `${this.enemyType.toUpperCase()} DEMOSTRÓ SER MÁS FUERTE ESTA VEZ...`;
        }

        screen.classList.remove('hidden');
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const dt = Math.min(this.clock.getDelta(), 0.1);

        if (this.state === 'fighting' || this.state === 'countdown' || this.state === 'ended') {
            this.handlePlayerInput(dt);
            this.updateAI(dt);

            if (this.player) this.player.update(dt, this.enemy);
            if (this.enemy) this.enemy.update(dt, this.player);

            this.checkCombatCollisions();
            this.updateCamera(dt);
            this.updateHUD();
            this.checkMatchEnd();
        }

        this.vfx.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
}

window.Game = Game;
