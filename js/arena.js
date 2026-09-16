// 3D Arena: Tenkaichi Pokémon Stadium
class Arena {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.buildStage();
        this.buildPillars();
        this.buildEnvironment();
    }

    buildStage() {
        // Main Tournament Stone Platform (24m x 14m)
        const stageMat = new THREE.MeshToonMaterial({
            color: 0xdfd2b5, // martial arts ring warm stone
            roughness: 0.6
        });
        const stageGeom = new THREE.BoxGeometry(26, 1.2, 16);
        const stage = new THREE.Mesh(stageGeom, stageMat);
        stage.position.y = -0.6;
        stage.receiveShadow = true;
        this.group.add(stage);

        // Stone Tile Lines Grid
        const lineMat = new THREE.LineBasicMaterial({ color: 0x9e8b6b });
        for (let x = -12; x <= 12; x += 2) {
            const points = [new THREE.Vector3(x, 0.01, -7.5), new THREE.Vector3(x, 0.01, 7.5)];
            const geom = new THREE.BufferGeometry().setFromPoints(points);
            this.group.add(new THREE.Line(geom, lineMat));
        }
        for (let z = -7; z <= 7; z += 2) {
            const points = [new THREE.Vector3(-12.5, 0.01, z), new THREE.Vector3(12.5, 0.01, z)];
            const geom = new THREE.BufferGeometry().setFromPoints(points);
            this.group.add(new THREE.Line(geom, lineMat));
        }

        // Center Ring Circle (Pokémon Stadium Style)
        const ringGeom = new THREE.RingGeometry(2.8, 3.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xee2222,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        this.group.add(ring);

        // Center Pokéball divider
        const lineBarGeom = new THREE.PlaneGeometry(6.2, 0.3);
        const lineBarMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
        const lineBar = new THREE.Mesh(lineBarGeom, lineBarMat);
        lineBar.rotation.x = -Math.PI / 2;
        lineBar.position.y = 0.025;
        this.group.add(lineBar);

        const centerDotGeom = new THREE.CircleGeometry(0.7, 24);
        const centerDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const centerDot = new THREE.Mesh(centerDotGeom, centerDotMat);
        centerDot.rotation.x = -Math.PI / 2;
        centerDot.position.y = 0.03;
        this.group.add(centerDot);

        const centerInnerDot = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }));
        centerInnerDot.rotation.x = -Math.PI / 2;
        centerInnerDot.position.y = 0.035;
        this.group.add(centerInnerDot);

        // Platform Outer Red Border Trim
        const borderMat = new THREE.MeshToonMaterial({ color: 0xbb2222 });
        const bTop = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.4, 0.6), borderMat);
        bTop.position.set(0, 0.1, 8.2);
        this.group.add(bTop);
        const bBottom = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.4, 0.6), borderMat);
        bBottom.position.set(0, 0.1, -8.2);
        this.group.add(bBottom);
        const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 17), borderMat);
        bLeft.position.set(-13.2, 0.1, 0);
        this.group.add(bLeft);
        const bRight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 17), borderMat);
        bRight.position.set(13.2, 0.1, 0);
        this.group.add(bRight);
    }

    buildPillars() {
        const pillarMat = new THREE.MeshToonMaterial({ color: 0xc8b598 });
        const orbRed = new THREE.MeshToonMaterial({ color: 0xff3333 });
        const orbWhite = new THREE.MeshToonMaterial({ color: 0xffffff });

        const cornerCoords = [
            [-12.8, -7.8], [12.8, -7.8],
            [-12.8, 7.8], [12.8, 7.8]
        ];

        cornerCoords.forEach(([x, z]) => {
            const pillarGroup = new THREE.Group();
            pillarGroup.position.set(x, 0, z);

            // Pillar column
            const column = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 3.5, 8), pillarMat);
            column.position.y = 1.75;
            column.castShadow = true;
            pillarGroup.add(column);

            // Capital
            const cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 1.3), pillarMat);
            cap.position.y = 3.6;
            pillarGroup.add(cap);

            // Giant Pokéball Top on pillar
            const ballGroup = new THREE.Group();
            ballGroup.position.y = 4.3;

            const topHalf = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), orbRed);
            const bottomHalf = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), orbWhite);
            ballGroup.add(topHalf);
            ballGroup.add(bottomHalf);

            // Belt band
            const band = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.15, 16), new THREE.MeshBasicMaterial({ color: 0x111111 }));
            ballGroup.add(band);

            pillarGroup.add(ballGroup);
            this.group.add(pillarGroup);
        });
    }

    buildEnvironment() {
        // Ground surrounding the stage
        const groundMat = new THREE.MeshToonMaterial({ color: 0x6ca332 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 100), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1.2;
        ground.receiveShadow = true;
        this.group.add(ground);

        // Rocky mountains in DBZ background
        const rockMat = new THREE.MeshToonMaterial({ color: 0xbf8040, roughness: 0.8 });
        const mountainPositions = [
            [-35, 0, -25, 18, 28],
            [35, 0, -28, 22, 32],
            [-18, 0, -32, 14, 22],
            [15, 0, -35, 16, 25],
            [-42, 0, 5, 20, 26],
            [42, 0, 5, 20, 26]
        ];
        mountainPositions.forEach(([x, y, z, rad, height]) => {
            const mountain = new THREE.Mesh(new THREE.ConeGeometry(rad, height, 6), rockMat);
            mountain.position.set(x, height / 2 - 1.2, z);
            this.group.add(mountain);
        });

        // Stylized fluffy anime clouds
        const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
        for (let i = 0; i < 9; i++) {
            const cloudGroup = new THREE.Group();
            const cx = (Math.random() - 0.5) * 80;
            const cy = 18 + Math.random() * 8;
            const cz = -20 - Math.random() * 25;
            cloudGroup.position.set(cx, cy, cz);

            for (let c = 0; c < 4; c++) {
                const puff = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8), cloudMat);
                puff.position.set(c * 2.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2);
                cloudGroup.add(puff);
            }
            this.group.add(cloudGroup);
        }
    }
}

window.Arena = Arena;
