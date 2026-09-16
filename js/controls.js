// Mobile Touch & Keyboard Input Manager
class InputManager {
    constructor() {
        this.moveVector = { x: 0, z: 0 };
        this.actions = {
            attack: false,
            blast: false,
            charge: false,
            dash: false,
            ultimate: false
        };

        this.keys = {};
        this.joystickTouchId = null;
        this.joystickCenter = { x: 0, y: 0 };
        this.joystickRadius = 45;

        this.setupKeyboard();
        this.setupTouchControls();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.updateKeyboardInput();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.updateKeyboardInput();
        });
    }

    updateKeyboardInput() {
        let x = 0;
        let z = 0;

        if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
        if (this.keys['d'] || this.keys['arrowright']) x += 1;
        if (this.keys['w'] || this.keys['arrowup']) z -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) z += 1;

        // Normalize
        const len = Math.hypot(x, z);
        if (len > 0) {
            this.moveVector.x = x / len;
            this.moveVector.z = z / len;
        } else if (this.joystickTouchId === null) {
            this.moveVector.x = 0;
            this.moveVector.z = 0;
        }

        // Action Keys
        this.actions.attack = !!(this.keys['j'] || this.keys['z']);
        this.actions.blast = !!(this.keys['k'] || this.keys['x']);
        this.actions.charge = !!(this.keys['l'] || this.keys['c']);
        this.actions.dash = !!(this.keys[' '] || this.keys['shift']);
        this.actions.ultimate = !!(this.keys['u'] || this.keys['v']);
    }

    setupTouchControls() {
        const joyZone = document.getElementById('joystick-zone');
        const joyKnob = document.getElementById('joystick-knob');

        if (joyZone && joyKnob) {
            const handleTouchStart = (e) => {
                if (e.cancelable) e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (this.joystickTouchId === null) {
                        this.joystickTouchId = touch.identifier;
                        const rect = joyZone.getBoundingClientRect();
                        this.joystickCenter = {
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2
                        };
                        this.updateJoystick(touch.clientX, touch.clientY, joyKnob);
                        break;
                    }
                }
            };

            const handleTouchMove = (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === this.joystickTouchId) {
                        if (e.cancelable) e.preventDefault();
                        this.updateJoystick(touch.clientX, touch.clientY, joyKnob);
                        break;
                    }
                }
            };

            const handleTouchEnd = (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === this.joystickTouchId) {
                        this.joystickTouchId = null;
                        this.moveVector.x = 0;
                        this.moveVector.z = 0;
                        joyKnob.style.transform = `translate(0px, 0px)`;
                        break;
                    }
                }
            };

            joyZone.addEventListener('touchstart', handleTouchStart, { passive: false });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd, { passive: false });
            window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        }

        // Action Buttons Binding
        this.bindActionButton('btn-attack', 'attack');
        this.bindActionButton('btn-blast', 'blast');
        this.bindActionButton('btn-charge', 'charge', true); // continuous charge
        this.bindActionButton('btn-ultimate', 'ultimate');
        this.bindActionButton('btn-dash', 'dash');
    }

    updateJoystick(clientX, clientY, knobElement) {
        const dx = clientX - this.joystickCenter.x;
        const dy = clientY - this.joystickCenter.y;
        const dist = Math.hypot(dx, dy);

        const clampedDist = Math.min(dist, this.joystickRadius);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        knobElement.style.transform = `translate(${knobX}px, ${knobY}px)`;

        if (dist > 10) {
            this.moveVector.x = knobX / this.joystickRadius;
            this.moveVector.z = knobY / this.joystickRadius;
        } else {
            this.moveVector.x = 0;
            this.moveVector.z = 0;
        }
    }

    bindActionButton(elementId, actionName, isHold = false) {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        const press = (e) => {
            if (e.cancelable) e.preventDefault();
            btn.classList.add('active');
            this.actions[actionName] = true;
            if (navigator.vibrate) {
                try { navigator.vibrate(20); } catch(err){}
            }
        };

        const release = (e) => {
            if (e.cancelable) e.preventDefault();
            btn.classList.remove('active');
            if (isHold) {
                this.actions[actionName] = false;
            } else {
                // Short pulse
                setTimeout(() => { this.actions[actionName] = false; }, 80);
            }
        };

        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('touchend', release, { passive: false });
        btn.addEventListener('touchcancel', release, { passive: false });

        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
    }
}

window.InputManager = InputManager;
