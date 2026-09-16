// Stylized 3D Character Models & Animation System
class Fighter {
    constructor(type, isPlayer = false, scene, vfx) {
        this.type = type; // 'goku', 'pikachu', 'vegeta', 'charizard'
        this.isPlayer = isPlayer;
        this.scene = scene;
        this.vfx = vfx;

        // Combat Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxKi = 100;
        this.ki = 40; // start with partial ki
        this.ultimateCost = 70;
        this.isDead = false;

        // Movement & Physics
        this.position = new THREE.Vector3(isPlayer ? -4 : 4, 0, 0);
        this.velocity = new THREE.Vector3();
        this.speed = (type === 'pikachu') ? 7.5 : 6.5;
        this.facing = isPlayer ? 1 : -1; // 1 faces right (+x), -1 faces left (-x)
        this.rotationY = isPlayer ? Math.PI / 2 : -Math.PI / 2;
        this.targetRotationY = this.rotationY;

        // States
        this.state = 'idle'; // 'idle', 'run', 'attack', 'blast', 'charge', 'ultimate', 'hurt', 'ko'
        this.stateTimer = 0;
        this.comboStep = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;

        // Model container
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        this.scene.add(this.group);

        // Build character meshes and joints
        this.joints = {};
        this.buildModel();

        // Aura color
        this.auraColor = this.getAuraColor();
    }

    getAuraColor() {
        switch (this.type) {
            case 'goku': return 0xffd700; // Super Saiyan gold
            case 'pikachu': return 0x00f2ff; // Electric cyan
            case 'vegeta': return 0x3366ff; // Royal blue aura
            case 'charizard': return 0xff5500; // Fiery orange
            default: return 0xffffff;
        }
    }

    buildModel() {
        if (this.type === 'goku') this.buildGoku();
        else if (this.type === 'pikachu') this.buildPikachu();
        else if (this.type === 'vegeta') this.buildVegeta();
        else if (this.type === 'charizard') this.buildCharizard();
    }

    // Helper material creator
    mat(color, roughness = 0.4) {
        return new THREE.MeshToonMaterial({
            color: color,
            roughness: roughness
        });
    }

    // ==========================================
    // GOKU MODEL
    // ==========================================
    buildGoku() {
        const skinMat = this.mat(0xffcc99);
        const giOrange = this.mat(0xff5500);
        const blueMat = this.mat(0x0a3d91);
        const hairMat = this.mat(0x1a1a1a); // Base hair (or 0xffea00 for SSJ)
        const bootMat = this.mat(0x112244);
        const redTrim = this.mat(0xdd1111);

        // Root Joint
        const root = new THREE.Group();
        this.group.add(root);
        this.joints.root = root;

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.55), giOrange);
        torso.position.y = 1.35;
        root.add(torso);
        this.joints.torso = torso;

        // Blue undershirt V-neck
        const shirtV = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.4, 0.58), blueMat);
        shirtV.position.y = 0.25;
        torso.add(shirtV);

        // Belt sash
        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.58), blueMat);
        belt.position.y = -0.4;
        torso.add(belt);

        // Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.75, 0);
        torso.add(headGroup);
        this.joints.head = headGroup;

        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), skinMat);
        headGroup.add(headMesh);

        // Anime Eyes
        const eyeMat = this.mat(0xffffff);
        const pupilMat = this.mat(0x000000);
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.05), eyeMat);
        leftEye.position.set(-0.14, 0.02, 0.28);
        headGroup.add(leftEye);
        const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.06), pupilMat);
        leftPupil.position.set(-0.13, 0.02, 0.29);
        headGroup.add(leftPupil);

        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.05), eyeMat);
        rightEye.position.set(0.14, 0.02, 0.28);
        headGroup.add(rightEye);
        const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.06), pupilMat);
        rightPupil.position.set(0.13, 0.02, 0.29);
        headGroup.add(rightPupil);

        // Goku Spiky Hair
        const hairSpikes = [
            { pos: [0, 0.45, -0.05], rot: [0, 0, 0], scale: [0.65, 0.6, 0.65] },
            { pos: [-0.35, 0.35, 0], rot: [0, 0, 0.4], scale: [0.45, 0.5, 0.45] },
            { pos: [0.35, 0.35, 0], rot: [0, 0, -0.4], scale: [0.45, 0.5, 0.45] },
            { pos: [-0.55, 0.15, -0.1], rot: [0, 0, 0.8], scale: [0.4, 0.55, 0.4] },
            { pos: [0.55, 0.15, -0.1], rot: [0, 0, -0.8], scale: [0.4, 0.55, 0.4] },
            { pos: [0, 0.6, -0.15], rot: [-0.3, 0, 0], scale: [0.5, 0.65, 0.5] },
            { pos: [-0.2, 0.15, 0.3], rot: [0.3, 0, -0.3], scale: [0.2, 0.3, 0.2] }
        ];
        hairSpikes.forEach(s => {
            const spikeGeom = new THREE.ConeGeometry(0.25, 0.6, 4);
            const spike = new THREE.Mesh(spikeGeom, hairMat);
            spike.position.set(...s.pos);
            spike.rotation.set(...s.rot);
            spike.scale.set(...s.scale);
            headGroup.add(spike);
        });

        // Arms (Left & Right)
        this.joints.leftArm = this.createHumanArm(torso, -0.55, skinMat, blueMat);
        this.joints.rightArm = this.createHumanArm(torso, 0.55, skinMat, blueMat);

        // Legs (Left & Right)
        this.joints.leftLeg = this.createHumanLeg(root, -0.26, giOrange, bootMat, redTrim);
        this.joints.rightLeg = this.createHumanLeg(root, 0.26, giOrange, bootMat, redTrim);
    }

    createHumanArm(parent, xPos, skinMat, wristMat) {
        const shoulder = new THREE.Group();
        shoulder.position.set(xPos, 0.35, 0);
        parent.add(shoulder);

        // Bicep
        const bicep = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.28), skinMat);
        bicep.position.y = -0.22;
        shoulder.add(bicep);

        // Forearm
        const elbow = new THREE.Group();
        elbow.position.set(0, -0.4, 0);
        shoulder.add(elbow);

        const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.25), skinMat);
        forearm.position.y = -0.18;
        elbow.add(forearm);

        // Wristband
        const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.18, 0.27), wristMat);
        wrist.position.y = -0.28;
        elbow.add(wrist);

        return { shoulder, elbow };
    }

    createHumanLeg(parent, xPos, pantsMat, bootMat, trimMat) {
        const hip = new THREE.Group();
        hip.position.set(xPos, 0.85, 0);
        parent.add(hip);

        // Thigh
        const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.45, 0.36), pantsMat);
        thigh.position.y = -0.22;
        hip.add(thigh);

        // Knee / Calf
        const knee = new THREE.Group();
        knee.position.set(0, -0.42, 0);
        hip.add(knee);

        const calf = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.45, 0.33), pantsMat);
        calf.position.y = -0.18;
        knee.add(calf);

        // Boot
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.45), bootMat);
        boot.position.set(0, -0.32, 0.05);
        knee.add(boot);

        // Red trim
        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.08, 0.47), trimMat);
        trim.position.set(0, -0.22, 0.05);
        knee.add(trim);

        return { hip, knee };
    }

    // ==========================================
    // PIKACHU MODEL
    // ==========================================
    buildPikachu() {
        const yellowMat = this.mat(0xf8d030);
        const blackMat = this.mat(0x111111);
        const redMat = this.mat(0xee2222);
        const brownMat = this.mat(0x8b4513);
        const whiteMat = this.mat(0xffffff);

        const root = new THREE.Group();
        this.group.add(root);
        this.joints.root = root;

        // Chubby body
        const bodyGeom = new THREE.CylinderGeometry(0.45, 0.55, 0.9, 12);
        const body = new THREE.Mesh(bodyGeom, yellowMat);
        body.position.y = 0.65;
        root.add(body);
        this.joints.torso = body;

        // Brown stripes on back
        const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.3), brownMat);
        stripe1.position.set(0, 0.12, -0.3);
        body.add(stripe1);
        const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.3), brownMat);
        stripe2.position.set(0, -0.12, -0.32);
        body.add(stripe2);

        // Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.6, 0.05);
        body.add(headGroup);
        this.joints.head = headGroup;

        const headGeom = new THREE.SphereGeometry(0.52, 16, 16);
        const headMesh = new THREE.Mesh(headGeom, yellowMat);
        headGroup.add(headMesh);

        // Eyes
        [-0.22, 0.22].forEach(x => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), blackMat);
            eye.position.set(x, 0.08, 0.45);
            headGroup.add(eye);
            const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), whiteMat);
            pupil.position.set(x - 0.02, 0.11, 0.51);
            headGroup.add(pupil);
        });

        // Red cheeks
        [-0.36, 0.36].forEach(x => {
            const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), redMat);
            cheek.position.set(x, -0.1, 0.38);
            headGroup.add(cheek);
        });

        // Cute tiny nose & mouth
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), blackMat);
        nose.position.set(0, 0.02, 0.51);
        headGroup.add(nose);

        // Ears with black tips
        this.joints.leftEar = this.createPikachuEar(headGroup, -0.32, 0.42, 0.35, yellowMat, blackMat);
        this.joints.rightEar = this.createPikachuEar(headGroup, 0.32, 0.42, -0.35, yellowMat, blackMat);

        // Arms (Cute front paws)
        this.joints.leftArm = this.createPikachuArm(body, -0.42, yellowMat);
        this.joints.rightArm = this.createPikachuArm(body, 0.42, yellowMat);

        // Legs / Feet
        this.joints.leftLeg = this.createPikachuLeg(root, -0.3, yellowMat);
        this.joints.rightLeg = this.createPikachuLeg(root, 0.3, yellowMat);

        // Lightning Bolt Tail!
        this.joints.tail = this.createPikachuTail(body, yellowMat, brownMat);
    }

    createPikachuEar(parent, x, y, rotZ, yellowMat, blackMat) {
        const earGroup = new THREE.Group();
        earGroup.position.set(x, y, 0);
        earGroup.rotation.z = rotZ;
        parent.add(earGroup);

        const earBase = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 8), yellowMat);
        earBase.position.y = 0.25;
        earGroup.add(earBase);

        const earTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 8), blackMat);
        earTip.position.y = 0.55;
        earGroup.add(earTip);

        return earGroup;
    }

    createPikachuArm(parent, x, mat) {
        const arm = new THREE.Group();
        arm.position.set(x, 0.15, 0.2);
        parent.add(arm);

        const paw = new THREE.Mesh(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.1, 0.25, 6, 6) : new THREE.CylinderGeometry(0.1, 0.08, 0.35, 8), mat);
        paw.rotation.x = Math.PI / 4;
        paw.position.set(0, -0.1, 0.1);
        arm.add(paw);

        return { shoulder: arm, elbow: arm };
    }

    createPikachuLeg(parent, x, mat) {
        const leg = new THREE.Group();
        leg.position.set(x, 0.2, 0.1);
        parent.add(leg);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.42), mat);
        foot.position.set(0, -0.08, 0.08);
        leg.add(foot);

        return { hip: leg, knee: leg };
    }

    createPikachuTail(parent, yellowMat, brownMat) {
        const tailRoot = new THREE.Group();
        tailRoot.position.set(0, -0.15, -0.45);
        parent.add(tailRoot);

        // Segment 1 (Brown base)
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.05), brownMat);
        s1.position.set(0, 0.15, -0.05);
        s1.rotation.z = 0.2;
        tailRoot.add(s1);

        // Segment 2 (Yellow zigzag)
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.05), yellowMat);
        s2.position.set(-0.1, 0.35, -0.05);
        s2.rotation.z = -0.4;
        tailRoot.add(s2);

        // Segment 3 (Big lightning blade)
        const s3 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.45, 0.05), yellowMat);
        s3.position.set(0.05, 0.65, -0.05);
        s3.rotation.z = 0.35;
        tailRoot.add(s3);

        return tailRoot;
    }

    // ==========================================
    // VEGETA MODEL
    // ==========================================
    buildVegeta() {
        const skinMat = this.mat(0xffcc99);
        const blueSuit = this.mat(0x0c2560);
        const armorWhite = this.mat(0xeeeeee);
        const armorGold = this.mat(0xd4af37);
        const hairMat = this.mat(0x111111);
        const bootMat = this.mat(0xffffff);

        const root = new THREE.Group();
        this.group.add(root);
        this.joints.root = root;

        // Torso with Saiyan Armor
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.9, 0.52), armorWhite);
        torso.position.y = 1.3;
        root.add(torso);
        this.joints.torso = torso;

        // Abdomen stripes (armor texture)
        const abStripe = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.54), armorGold);
        abStripe.position.y = -0.22;
        torso.add(abStripe);

        // Shoulder pads
        [-0.48, 0.48].forEach(x => {
            const pad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.5), armorGold);
            pad.position.set(x, 0.42, 0);
            torso.add(pad);
        });

        // Head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.7, 0);
        torso.add(headGroup);
        this.joints.head = headGroup;

        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
        headGroup.add(headMesh);

        // Proud widow's peak and flame hair
        const flameSpikes = [
            { pos: [0, 0.5, 0], scale: [0.55, 0.8, 0.5] },
            { pos: [-0.15, 0.65, 0], scale: [0.4, 0.75, 0.4] },
            { pos: [0.15, 0.65, 0], scale: [0.4, 0.75, 0.4] },
            { pos: [0, 0.8, -0.05], scale: [0.35, 0.7, 0.35] }
        ];
        flameSpikes.forEach(s => {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 4), hairMat);
            spike.position.set(...s.pos);
            spike.scale.set(...s.scale);
            headGroup.add(spike);
        });

        // Arms with white gloves
        this.joints.leftArm = this.createHumanArm(torso, -0.52, blueSuit, bootMat);
        this.joints.rightArm = this.createHumanArm(torso, 0.52, blueSuit, bootMat);

        // Legs with blue suit and white boots
        this.joints.leftLeg = this.createHumanLeg(root, -0.24, blueSuit, bootMat, armorGold);
        this.joints.rightLeg = this.createHumanLeg(root, 0.24, blueSuit, bootMat, armorGold);
    }

    // ==========================================
    // CHARIZARD MODEL
    // ==========================================
    buildCharizard() {
        const orangeMat = this.mat(0xee6611);
        const bellyMat = this.mat(0xffe6a3);
        const wingMat = this.mat(0x228888);
        const flameMat = this.mat(0xff3300);

        const root = new THREE.Group();
        this.group.add(root);
        this.joints.root = root;

        // Big dragon torso
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 1.2, 10), orangeMat);
        torso.position.y = 1.3;
        root.add(torso);
        this.joints.torso = torso;

        // Cream belly
        const belly = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.2), bellyMat);
        belly.position.set(0, -0.1, 0.35);
        torso.add(belly);

        // Head with snout and horns
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.8, 0.2);
        torso.add(headGroup);
        this.joints.head = headGroup;

        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.6), orangeMat);
        headMesh.position.z = 0.15;
        headGroup.add(headMesh);

        // Snout
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), orangeMat);
        snout.position.set(0, -0.08, 0.5);
        headGroup.add(snout);

        // Horns
        [-0.18, 0.18].forEach(x => {
            const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), orangeMat);
            horn.position.set(x, 0.3, -0.1);
            horn.rotation.x = -0.5;
            headGroup.add(horn);
        });

        // Dragon Wings
        this.joints.leftWing = this.createCharizardWing(torso, -0.4, wingMat, orangeMat);
        this.joints.rightWing = this.createCharizardWing(torso, 0.4, wingMat, orangeMat, true);

        // Clawed Arms
        this.joints.leftArm = this.createHumanArm(torso, -0.55, orangeMat, orangeMat);
        this.joints.rightArm = this.createHumanArm(torso, 0.55, orangeMat, orangeMat);

        // Sturdy Legs
        this.joints.leftLeg = this.createHumanLeg(root, -0.32, orangeMat, orangeMat, orangeMat);
        this.joints.rightLeg = this.createHumanLeg(root, 0.32, orangeMat, orangeMat, orangeMat);

        // Tail with flame
        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, -0.4, -0.4);
        torso.add(tailGroup);
        this.joints.tail = tailGroup;

        const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 1.2, 8), orangeMat);
        tailMesh.position.set(0, 0.1, -0.5);
        tailMesh.rotation.x = Math.PI / 3;
        tailGroup.add(tailMesh);

        // Burning tip flame
        const flame = new THREE.Mesh(new THREE.TetrahedronGeometry(0.22, 1), flameMat);
        flame.position.set(0, 0.5, -0.9);
        tailGroup.add(flame);
        this.flameMesh = flame;
    }

    createCharizardWing(parent, x, wingMat, boneMat, isRight = false) {
        const wingGroup = new THREE.Group();
        wingGroup.position.set(x, 0.3, -0.35);
        wingGroup.rotation.y = isRight ? -0.4 : 0.4;
        parent.add(wingGroup);

        const wingMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.05), wingMat);
        wingMesh.position.set(isRight ? 0.45 : -0.45, 0.25, 0);
        wingGroup.add(wingMesh);

        return wingGroup;
    }

    // ==========================================
    // ACTIONS & ANIMATION CONTROLLER
    // ==========================================
    setAnimation(state) {
        if (this.state === 'ko' || this.isDead) return;
        if (this.state === state) return;

        this.state = state;
        this.stateTimer = 0;
    }

    attack(target) {
        if (this.state === 'ko' || this.state === 'hurt' || this.state === 'ultimate') return;
        this.setAnimation('attack');
        this.comboStep = (this.comboStep + 1) % 3;

        // Sound & Hit detection
        window.soundManager.playPunch(this.comboStep === 2);

        // Check melee range to target
        const dist = this.position.distanceTo(target.position);
        if (dist < 2.5) {
            const damage = 8 + this.comboStep * 4;
            const isHeavy = this.comboStep === 2;
            target.takeDamage(damage, this, isHeavy);
            this.vfx.createHitSparks(target.position.clone().add(new THREE.Vector3(0, 1.2, 0)), this.auraColor, isHeavy ? 24 : 14);
            this.vfx.shake(isHeavy ? 0.4 : 0.15);

            // Give Ki on hit
            this.ki = Math.min(this.maxKi, this.ki + 8);
        }
    }

    shootBlast(target) {
        if (this.state === 'ko' || this.state === 'hurt' || this.state === 'ultimate') return;
        if (this.ki < 15) return false;

        this.ki -= 15;
        this.setAnimation('blast');
        window.soundManager.playBlast();

        const spawnPos = this.position.clone().add(new THREE.Vector3(this.facing * 0.8, 1.3, 0));
        const dir = new THREE.Vector3(this.facing, 0, 0);

        this.vfx.spawnProjectile(this, spawnPos, dir, {
            color: this.auraColor,
            damage: 16,
            speed: 16
        });
        return true;
    }

    chargeKi(charging) {
        if (this.state === 'ko' || this.state === 'hurt' || this.state === 'ultimate') return;

        if (charging) {
            if (this.state !== 'charge') {
                this.setAnimation('charge');
                window.soundManager.startKiCharge();
            }
        } else {
            if (this.state === 'charge') {
                this.setAnimation('idle');
                window.soundManager.stopKiCharge();
            }
        }
    }

    triggerUltimate(target) {
        if (this.state === 'ko' || this.state === 'hurt') return false;
        if (this.ki < this.ultimateCost) return false;

        this.ki -= this.ultimateCost;
        this.setAnimation('ultimate');
        window.soundManager.playUltimateBeam();

        const spawnPos = this.position.clone().add(new THREE.Vector3(this.facing * 0.8, 1.3, 0));
        const dir = new THREE.Vector3(this.facing, 0, 0);

        setTimeout(() => {
            if (this.isDead) return;
            this.vfx.spawnBeam(this, spawnPos, dir, {
                color: this.auraColor,
                damage: 48,
                length: 22,
                duration: 1.6
            });
            window.soundManager.playExplosion();
        }, 500);

        return true;
    }

    takeDamage(amount, attacker, isHeavy = false) {
        if (this.isDead || this.isInvincible) return;

        this.health = Math.max(0, this.health - amount);
        this.setAnimation('hurt');
        this.isInvincible = true;
        this.invincibleTimer = 0.35;

        // Knockback
        const pushDir = Math.sign(this.position.x - attacker.position.x) || (this.facing * -1);
        this.position.x += pushDir * (isHeavy ? 1.4 : 0.6);
        this.position.x = THREE.MathUtils.clamp(this.position.x, -11, 11);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.setAnimation('ko');
        window.soundManager.stopKiCharge();
        window.soundManager.playExplosion();
    }

    update(dt, opponent) {
        this.stateTimer += dt;

        // Face the opponent
        if (opponent && this.state !== 'ko') {
            const dx = opponent.position.x - this.position.x;
            if (Math.abs(dx) > 0.4) {
                this.facing = dx > 0 ? 1 : -1;
                this.targetRotationY = this.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
            }
        }
        // Smooth rotation
        this.rotationY = THREE.MathUtils.lerp(this.rotationY, this.targetRotationY, dt * 14);
        this.group.rotation.y = this.rotationY;

        // Invincibility flicker
        if (this.isInvincible) {
            this.invincibleTimer -= dt;
            this.group.visible = Math.floor(this.invincibleTimer * 25) % 2 === 0;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.group.visible = true;
            }
        }

        // Clamp position to arena
        this.position.x = THREE.MathUtils.clamp(this.position.x, -11, 11);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -6, 6);
        this.group.position.copy(this.position);

        // Process Ki charging
        if (this.state === 'charge') {
            this.ki = Math.min(this.maxKi, this.ki + 35 * dt);
            this.vfx.emitAura(this.position, this.auraColor, 3);
            if (this.type === 'pikachu' && Math.random() < 0.3) {
                const sparkP = this.position.clone().add(new THREE.Vector3((Math.random()-0.5)*1.5, 0.8, (Math.random()-0.5)*1.5));
                this.vfx.emitLightning(this.position.clone().add(new THREE.Vector3(0, 0.5, 0)), sparkP, 0x00f2ff);
            }
        }

        // Animated tail flame for Charizard
        if (this.flameMesh) {
            const s = 1 + Math.sin(this.stateTimer * 15) * 0.25;
            this.flameMesh.scale.set(s, s * 1.3, s);
        }

        // State Machine Timers
        if (this.state === 'attack' && this.stateTimer > 0.28) {
            this.setAnimation('idle');
        } else if (this.state === 'blast' && this.stateTimer > 0.38) {
            this.setAnimation('idle');
        } else if (this.state === 'ultimate' && this.stateTimer > 2.0) {
            this.setAnimation('idle');
        } else if (this.state === 'hurt' && this.stateTimer > 0.35) {
            this.setAnimation('idle');
        }

        // Keyframe Pose Calculations
        this.applyProceduralAnimation(dt);
    }

    applyProceduralAnimation(dt) {
        const t = this.stateTimer;
        const j = this.joints;

        // Reset default limb rotations
        if (j.leftArm && j.leftArm.shoulder) {
            j.leftArm.shoulder.rotation.set(0, 0, 0);
            j.rightArm.shoulder.rotation.set(0, 0, 0);
        }
        if (j.leftLeg && j.leftLeg.hip) {
            j.leftLeg.hip.rotation.set(0, 0, 0);
            j.rightLeg.hip.rotation.set(0, 0, 0);
        }

        switch (this.state) {
            case 'idle': {
                // Fighting stance bounce
                const bob = Math.sin(t * 8) * 0.08;
                j.root.position.y = bob;
                if (j.head) j.head.rotation.x = Math.sin(t * 8) * 0.05;
                if (j.leftArm && j.leftArm.shoulder) {
                    j.leftArm.shoulder.rotation.x = 0.5 + Math.sin(t * 8) * 0.1;
                    j.rightArm.shoulder.rotation.x = 0.4 - Math.sin(t * 8) * 0.1;
                }
                if (j.tail) {
                    j.tail.rotation.y = Math.sin(t * 10) * 0.4;
                }
                break;
            }
            case 'run': {
                const runCycle = Math.sin(t * 16);
                j.root.position.y = Math.abs(runCycle) * 0.15;
                if (j.leftLeg && j.leftLeg.hip) {
                    j.leftLeg.hip.rotation.x = runCycle * 0.9;
                    j.rightLeg.hip.rotation.x = -runCycle * 0.9;
                }
                if (j.leftArm && j.leftArm.shoulder) {
                    j.leftArm.shoulder.rotation.x = -runCycle * 0.8;
                    j.rightArm.shoulder.rotation.x = runCycle * 0.8;
                }
                break;
            }
            case 'attack': {
                // Punching thrust
                if (j.rightArm && j.rightArm.shoulder) {
                    j.rightArm.shoulder.rotation.x = -Math.PI / 2;
                    j.rightArm.shoulder.rotation.y = -0.3;
                }
                if (j.leftArm && j.leftArm.shoulder) {
                    j.leftArm.shoulder.rotation.x = 0.3;
                }
                if (j.tail) {
                    j.tail.rotation.z = Math.PI; // Iron tail spin!
                }
                break;
            }
            case 'charge': {
                // Crouched stance trembling with Ki
                j.root.position.y = -0.15 + (Math.random() - 0.5) * 0.04;
                if (j.leftArm && j.leftArm.shoulder) {
                    j.leftArm.shoulder.rotation.set(0.4, 0, -0.4);
                    j.rightArm.shoulder.rotation.set(0.4, 0, 0.4);
                }
                break;
            }
            case 'ultimate': {
                // Kamehameha / Big Blast stance
                if (t < 0.5) {
                    // Pull hands back to hip
                    if (j.leftArm && j.leftArm.shoulder) {
                        j.leftArm.shoulder.rotation.set(1.2, -0.6, 0);
                        j.rightArm.shoulder.rotation.set(1.2, 0.6, 0);
                    }
                    this.vfx.emitAura(this.position, this.auraColor, 5);
                } else {
                    // Thrust hands forward
                    if (j.leftArm && j.leftArm.shoulder) {
                        j.leftArm.shoulder.rotation.set(-Math.PI / 2, 0.2, 0);
                        j.rightArm.shoulder.rotation.set(-Math.PI / 2, -0.2, 0);
                    }
                }
                break;
            }
            case 'hurt': {
                // Stun recoil
                j.root.position.y = 0.1;
                if (j.torso) j.torso.rotation.x = -0.4;
                if (j.head) j.head.rotation.x = -0.5;
                break;
            }
            case 'ko': {
                // Knocked down on ground
                j.root.position.y = 0.2;
                j.root.rotation.x = -Math.PI / 2;
                break;
            }
        }
    }
}

window.Fighter = Fighter;
