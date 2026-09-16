// Model Loader: Loads real GLTF/GLB models for Goku, Pikachu, Charizard with Draco support
class ModelLoader {
    constructor() {
        this.cache = {};
        this.loadingPromises = {};
        this.dracoLoader = null;
        this.gltfLoader = null;

        this.initLoaders();
    }

    initLoaders() {
        if (typeof THREE.DRACOLoader !== 'undefined') {
            this.dracoLoader = new THREE.DRACOLoader();
            this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
        }

        if (typeof THREE.GLTFLoader !== 'undefined') {
            this.gltfLoader = new THREE.GLTFLoader();
            if (this.dracoLoader) {
                this.gltfLoader.setDRACOLoader(this.dracoLoader);
            }
        }
    }

    loadModel(type, url, callback) {
        if (!this.gltfLoader) {
            console.warn('GLTFLoader not available, using procedural fallback.');
            return;
        }

        // Return from cache if already loaded
        if (this.cache[type]) {
            callback(this.cloneModel(type));
            return;
        }

        // If already loading, queue callback
        if (this.loadingPromises[type]) {
            this.loadingPromises[type].push(callback);
            return;
        }

        this.loadingPromises[type] = [callback];

        this.gltfLoader.load(
            url,
            (gltf) => {
                this.cache[type] = gltf;
                const callbacks = this.loadingPromises[type] || [];
                delete this.loadingPromises[type];
                callbacks.forEach(cb => cb(this.cloneModel(type)));
            },
            undefined,
            (err) => {
                console.warn(`Error loading model ${type} from ${url}:`, err);
                delete this.loadingPromises[type];
            }
        );
    }

    cloneModel(type) {
        const gltf = this.cache[type];
        if (!gltf) return null;

        let clonedScene;
        if (typeof THREE.SkeletonUtils !== 'undefined' && THREE.SkeletonUtils.clone) {
            clonedScene = THREE.SkeletonUtils.clone(gltf.scene);
        } else {
            clonedScene = gltf.scene.clone(true);
        }

        // Enable shadows on meshes
        clonedScene.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return {
            scene: clonedScene,
            animations: gltf.animations || []
        };
    }
}

window.modelLoader = new ModelLoader();
