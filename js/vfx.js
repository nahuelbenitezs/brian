// Visual Effects (VFX) System: Particles, Auras, Energy Beams, and Impacts
class VFXManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.projectiles = [];
        this.beams = [];
        this.shockwaves = [];
        this.screenShakeIntensity = 0;
        this.screenShakeDecay = 0.9;
        this.cameraShakeOffset = new THREE.Vector3();
    }

    // Trigger screen shake
    shake(amount = 0.4) {
        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, amount);
        if (navigator.vibrate) {
            try { navigator.vibrate(Math.min(150, Math.floor(amount * 200))); } catch(e){}
        }
    }

    // Spark / Hit burst
    createHitSparks(position, color = 0xffe600, count = 18) {
        for (let i = 0; i < count; i++) {
            const geom = new THREE.SphereGeometry(0.08 + Math.random() * 0.08, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            const p = new THREE.Mesh(geom, mat);
            p.position.copy(position);

            const speed = 4 + Math.random() * 7;
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;
            const velocity = new THREE.Vector3(
                Math.cos(theta) * Math.cos(phi) * speed,
                Math.sin(phi) * speed + 2,
                Math.sin(theta) * Math.cos(phi) * speed
            );

            this.particles.push({
                mesh: p,
                velocity: velocity,
                life: 0.25 + Math.random() * 0.2,
                maxLife: 0.25 + Math.random() * 0.2,
                gravity: -15
            });
            this.scene.add(p);
        }

        // Add expanding shockwave ring
        this.createShockwave(position, color, 2.5);
    }

    // Expanding shockwave ring
    createShockwave(position, color = 0xffffff, maxRadius = 3) {
        const ringGeom = new THREE.RingGeometry(0.1, 0.35, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(position);
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);

        this.shockwaves.push({
            mesh: ring,
            radius: 0.2,
            maxRadius: maxRadius,
            life: 0.35,
            maxLife: 0.35
        });
    }

    // Aura burst when charging energy
    emitAura(position, colorHex = 0xffd700, count = 4) {
        for (let i = 0; i < count; i++) {
            const size = 0.12 + Math.random() * 0.18;
            const geom = new THREE.TetrahedronGeometry(size, 0);
            const mat = new THREE.MeshBasicMaterial({
                color: colorHex,
                transparent: true,
                opacity: 0.85
            });
            const p = new THREE.Mesh(geom, mat);

            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 0.6;
            p.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 0.4,
                position.z + Math.sin(angle) * radius
            );

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                4.5 + Math.random() * 4.0,
                (Math.random() - 0.5) * 1.5
            );

            this.particles.push({
                mesh: p,
                velocity: velocity,
                life: 0.4 + Math.random() * 0.25,
                maxLife: 0.4 + Math.random() * 0.25,
                rotSpeed: (Math.random() - 0.5) * 15,
                gravity: 2.0 // float upwards
            });
            this.scene.add(p);
        }
    }

    // Lightning bolt for Pikachu
    emitLightning(startPos, endPos, color = 0x00f2ff) {
        const points = [];
        const steps = 6;
        points.push(startPos.clone());
        for (let i = 1; i < steps; i++) {
            const frac = i / steps;
            const p = new THREE.Vector3().lerpVectors(startPos, endPos, frac);
            p.x += (Math.random() - 0.5) * 0.8;
            p.y += (Math.random() - 0.5) * 0.8;
            p.z += (Math.random() - 0.5) * 0.8;
            points.push(p);
        }
        points.push(endPos.clone());

        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 3,
            transparent: true,
            opacity: 1
        });
        const line = new THREE.Line(geom, mat);
        this.scene.add(line);

        this.shockwaves.push({
            mesh: line,
            life: 0.12,
            maxLife: 0.12,
            isLine: true
        });
    }

    // Launch Ki Blast / Electro Ball projectile
    spawnProjectile(owner, startPos, direction, config = {}) {
        const speed = config.speed || 18;
        const color = config.color || 0x00d9ff;
        const size = config.size || 0.4;
        const damage = config.damage || 14;

        // Core energy sphere
        const group = new THREE.Group();
        const coreGeom = new THREE.SphereGeometry(size, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);

        // Glow shell
        const glowGeom = new THREE.SphereGeometry(size * 1.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.65
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        group.add(glow);

        group.position.copy(startPos);
        this.scene.add(group);

        const proj = {
            owner: owner,
            mesh: group,
            velocity: direction.clone().normalize().multiplyScalar(speed),
            damage: damage,
            radius: size * 1.2,
            life: 2.5,
            color: color,
            trailTimer: 0
        };
        this.projectiles.push(proj);
        return proj;
    }

    // Spawn massive beam (Kamehameha / Mega Thunderbolt)
    spawnBeam(owner, startPos, direction, config = {}) {
        const length = config.length || 24;
        const radius = config.radius || 1.1;
        const color = config.color || 0x00bfff;
        const duration = config.duration || 1.4;
        const damage = config.damage || 45;

        const group = new THREE.Group();

        // Beam cylinder
        const cylGeom = new THREE.CylinderGeometry(radius, radius, length, 16, 1, true);
        cylGeom.rotateX(Math.PI / 2);
        const cylMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const cyl = new THREE.Mesh(cylGeom, cylMat);
        cyl.position.set(0, 0, length / 2);
        group.add(cyl);

        // Beam inner white core
        const coreGeom = new THREE.CylinderGeometry(radius * 0.5, radius * 0.5, length, 16, 1, true);
        coreGeom.rotateX(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        core.position.set(0, 0, length / 2);
        group.add(core);

        // Head glowing sphere
        const headGeom = new THREE.SphereGeometry(radius * 1.6, 16, 16);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.set(0, 0, length);
        group.add(head);

        group.position.copy(startPos);
        group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());

        this.scene.add(group);

        const beam = {
            owner: owner,
            mesh: group,
            cyl: cyl,
            core: core,
            startPos: startPos.clone(),
            direction: direction.clone().normalize(),
            length: length,
            radius: radius,
            damage: damage,
            duration: duration,
            life: duration,
            color: color
        };
        this.beams.push(beam);
        this.shake(0.6);
        return beam;
    }

    update(dt) {
        // 1. Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            p.velocity.y += (p.gravity || 0) * dt;
            p.mesh.position.addScaledVector(p.velocity, dt);
            if (p.rotSpeed) {
                p.mesh.rotation.x += p.rotSpeed * dt;
                p.mesh.rotation.y += p.rotSpeed * dt;
            }
            const progress = p.life / p.maxLife;
            p.mesh.material.opacity = progress;
            p.mesh.scale.setScalar(progress);
        }

        // 2. Update Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.life -= dt;
            if (sw.life <= 0) {
                this.scene.remove(sw.mesh);
                sw.mesh.geometry.dispose();
                sw.mesh.material.dispose();
                this.shockwaves.splice(i, 1);
                continue;
            }
            const progress = sw.life / sw.maxLife;
            sw.mesh.material.opacity = progress;
            if (!sw.isLine) {
                const scale = (1 - progress) * sw.maxRadius;
                sw.mesh.scale.set(scale, scale, scale);
            }
        }

        // 3. Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.life -= dt;
            if (proj.life <= 0) {
                this.scene.remove(proj.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }
            proj.mesh.position.addScaledVector(proj.velocity, dt);

            // Emission of trail particles
            proj.trailTimer += dt;
            if (proj.trailTimer > 0.04) {
                proj.trailTimer = 0;
                this.emitAura(proj.mesh.position, proj.color, 2);
            }
        }

        // 4. Update Beams
        for (let i = this.beams.length - 1; i >= 0; i--) {
            const beam = this.beams[i];
            beam.life -= dt;
            if (beam.life <= 0) {
                this.scene.remove(beam.mesh);
                this.beams.splice(i, 1);
                continue;
            }
            // Pulse size
            const pulse = 1 + Math.sin(beam.life * 35) * 0.15;
            beam.cyl.scale.set(pulse, pulse, 1);
            beam.core.scale.set(pulse * 0.8, pulse * 0.8, 1);

            // Beam fade near end
            if (beam.life < 0.3) {
                const alpha = beam.life / 0.3;
                beam.cyl.material.opacity = 0.8 * alpha;
                beam.core.material.opacity = 0.95 * alpha;
            }
        }

        // 5. Update Screen Shake
        if (this.screenShakeIntensity > 0.005) {
            this.cameraShakeOffset.set(
                (Math.random() - 0.5) * this.screenShakeIntensity,
                (Math.random() - 0.5) * this.screenShakeIntensity,
                (Math.random() - 0.5) * this.screenShakeIntensity
            );
            this.screenShakeIntensity *= Math.pow(this.screenShakeDecay, dt * 60);
        } else {
            this.cameraShakeOffset.set(0, 0, 0);
            this.screenShakeIntensity = 0;
        }
    }
}

window.VFXManager = VFXManager;
