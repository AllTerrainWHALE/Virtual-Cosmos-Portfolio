// const Astronomy = require('astronomyjs')  // Install astronomyjs via npm
import { loadingManager } from './managers/loadingManager.js'
import { sceneManager } from './managers/sceneManager.js'
import { interactionManager } from './managers/interactionManager.js'
import { loadSettings } from './managers/settingsManager.js'

const settings = await loadSettings()

const AU = settings.AU
const orbitSpeedMult = settings.orbitSpeedMult
const rotationSpeedMult = settings.rotationSpeedMult
const scaleMult = settings.scaleMult


class CelestialObj {
    constructor(
        id, parent, camera, settings
    ) {
        // console.log(settings)
        this.id = id
        this.parent = parent

        this.name = settings.name
        this.modelDir = settings.modelDir
        this.color = new THREE.Color(`rgb(${settings.color})`)
        this.scale = (settings.scale ?? 1) * scaleMult

        this.bodyRadius = settings.bodyRadius || 1
        this.hitboxScale = settings.hitboxScale || 1
        this.orbitRadius = settings.orbitRadius * AU
        this.orbitSpeed = settings.orbitSpeed * orbitSpeedMult // Speed of orbit (radians per second)
        this.rotationSpeed = settings.rotationSpeed * rotationSpeedMult
        this.faceParent = settings.faceParent ?? false

        this.settings = settings

        this.sphere = null
        this.modelLoaded = false
        this.loadingPromise = null
        this.inflated = false

        this.satellites = []

        this.angle = Math.random() * Math.PI // Initial angle

        this.camera = camera
        
        this.info = {
            title: settings.info?.title || this.name,
            subtitle: settings.info?.subtitle || null,
            description: settings.info?.description || null,
            // github: settings.info?.github || null
            links: settings.info?.links || {},
            images: settings.info?.images || [],
            credit: settings.info?.credit || null
        }

        this.mixer = null
        this.animations = []
        this.currentAction = null
        this.isFocused = false
        this.played = false

        // this.build()
        // this.buildSatellites(settings.satellites)
    }

    async build() {
        
        if (this.modelDir !== "") {
            const loader = new THREE.GLTFLoader()
            const gltf = await new Promise((resolve) => {
                loader.load(this.modelDir, resolve, undefined, (error) => {
                    console.error('Error loading model:', error)
                    loadingManager.incrementLoaded()
                    resolve(null)
                })
            })

            this.sphere = gltf.scene
            
            // Set up animations
            if (gltf.animations && gltf.animations.length) {
                // console.log(`Animations found for ${this.name}:`, gltf.animations); // Debug log
                this.mixer = new THREE.AnimationMixer(this.sphere)
                gltf.animations.map(clip => {
                    const action = this.mixer.clipAction(clip)
                    action.clampWhenFinished = true
                    action.setLoop(THREE.LoopOnce)
                    this.animations.push(action)
                })
            }
        
            // Traverse the loaded model and adjust texture filtering
            this.sphere.traverse((child) => {
                if (child.isMesh && child.material && child.material.map) {
                    const texture = child.material.map
                    if (!isPowerOfTwo(texture.image.width) || !isPowerOfTwo(texture.image.height)) {
                        texture.generateMipmaps = false
                        texture.minFilter = THREE.LinearFilter
                    }
                }
            })
            
            loadingManager.incrementLoaded()
            // if (this.name == "sat_1") console.log(this.sphere)
        }
        
        else {
            this.sphere = new THREE.Mesh(
                new THREE.SphereGeometry(this.bodyRadius, 32, 16),
                new THREE.MeshStandardMaterial({
                    color: this.color,
                    visible: true
                })
            )
            loadingManager.incrementLoaded()
        }

        if (this.name != "sun")
            this.sphere.scale.set(
                this.scale,
                this.scale,
                this.scale
            )

        // get model radius
        const box = new THREE.Box3().setFromObject(this.sphere)
        const boxSize = new THREE.Vector3()
        box.getSize(boxSize)
        const maxDimension = Math.max(boxSize.x, boxSize.y, boxSize.z)
        this.modelRadius = maxDimension / 2
        this.modelRadius *= this.hitboxScale

        // Create hitbox (slightly larger than model)
        const HITBOX_FACTOR = 5
        const HITBOX_MAX = 15
        this.hitboxBaseRadius = Math.min(this.modelRadius * HITBOX_FACTOR, HITBOX_MAX)

        this.hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(this.hitboxBaseRadius, 32, 16),
            new THREE.MeshStandardMaterial({
                visible: false,
                wireframe: true,
                transparent: true,
                opacity: 0.05
            })
        )

        // if (this.name == "earth") console.log(this.sphere)
        
        this.sphere.position.set(this.orbitRadius, 0, 0)
        // this.hitbox.position.set(this.orbitRadius, 0, 0)
        this.hitbox.position.copy(this.sphere.position)

        this.hitbox.userData.object = this
        this.sphere.userData.isHitbox = true

        // Create 2D circle sprite
        const canvas = document.createElement('canvas')
        const size = 256
        canvas.width = size
        canvas.height = size
        
        const ctx = canvas.getContext('2d')
        ctx.beginPath()
        ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 8
        ctx.stroke()
        
        const texture = new THREE.CanvasTexture(canvas)
        this.circle = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false, 
            opacity: 0.8,
            // color: 0x48ff00ff
        }))
        this.circle.visible = false // Start hidden

        // Add circle and hitbox to scene
        this.sphere.add(this.circle)
        this.sphere.add(this.hitbox)
        this.circle.position.set(0, 0, 0) // Center on object

        // Initial local scale for circle so its WORLD radius equals hitboxBaseRadius
        const HIGHLIGHT_FACTOR = 2  // tune size of circle
        const desiredCircleWorld = this.hitboxBaseRadius * HIGHLIGHT_FACTOR
        const circleLocal = desiredCircleWorld / this.scale
        this.circle.scale.set(circleLocal, circleLocal, 1)
    }

    async buildPlaceholder() {
        // Simple colored sphere placeholder
        this.sphere = new THREE.Mesh(
            new THREE.SphereGeometry(this.bodyRadius, 16, 8),
            new THREE.MeshStandardMaterial({ color: this.color })
        );
        // this.sphere.scale.set(this.scale, this.scale, this.scale);
        this.sphere.position.set(this.orbitRadius * AU, 0, 0);

        // Create hitbox and circle same as before
        this.createHitboxAndCircle();
    }

    async loadModel() {
        if (this.modelLoaded || this.modelDir === "" || !this.modelDir) return this.loadingPromise;
        if (this.loadingPromise) return this.loadingPromise; // already loading

        const loader = new THREE.GLTFLoader();
        console.log(`(${this.id}) %cLoading model: ${this.modelDir}`, 'color: orange; font-weight: bold;');

        this.loadingPromise = new Promise((resolve, reject) => {
            loader.load(this.modelDir, (gltf) => {
                this.modelLoaded = true;

                const oldPos = this.sphere.position.clone();
                sceneManager.scene.remove(this.sphere, this.hitbox); // remove placeholder

                this.sphere = gltf.scene;
                this.sphere.scale.set(this.scale, this.scale, this.scale);
                this.sphere.position.copy(oldPos);

                this.createHitboxAndCircle(); // reattach hitbox + circle

                if (this.inflated) {
                    this.sphere.scale.set(this.scale * 2, this.scale * 2, this.scale * 2);
                    // this.circle.scale.set(this.circle.scale.x * 2, this.circle.scale.y * 2, 1);
                }

                // Set up animations
                const animData = this.fetchAnimations(gltf);
                if (animData) {
                    this.mixer = animData.mixer;
                    this.animations = animData.actions;
                }
                
                sceneManager.scene.add(this.sphere);

                if (this.isFocused) {
                    interactionManager.updateFollowedInfo();
                    setTimeout(() => {
                        this.playAnimation();
                    }, 500);
                }
                
                console.log(`(${this.id}) %cLoaded model`, 'color: lightgreen; font-weight: bold;');
                resolve();
            }, undefined, (err) => {
                console.error(`(${this.name}) %cError loading model:`, 'color: red; font-weight: bold;', err);
                reject(err);
            });
        });

        return this.loadingPromise;
    }

    createHitboxAndCircle() {
        const HITBOX_FACTOR = 1;
        const HITBOX_MAX = 15;

        //_ Get model radius
        const out = CelestialObj.getObjectRadius(this.sphere, { conservative: false });
        this.modelRadius = out.radius;
        
        //_ Create hitbox (slightly larger than model)
        this.hitboxBaseRadius = Math.min(this.modelRadius * HITBOX_FACTOR, HITBOX_MAX);

        this.hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(this.hitboxBaseRadius * this.hitboxScale, 16, 8),
            new THREE.MeshStandardMaterial({
                visible: false,
                wireframe: true,
                transparent: true,
                opacity: 0.1
            })
        );

        // Set hitbox to center if model loaded
        // ( weird shenanigans occur otherwise, where position and scale is only inherited with a loaded model )
        if (this.modelLoaded) 
            this.hitbox.scale.set(1/this.scale, 1/this.scale, 1/this.scale)
        this.hitbox.position.set(0, 0, 0);
        this.sphere.add(this.hitbox);

        //// console.log(`(${this.id}, ${this.modelLoaded}) Hitbox radius: ${this.hitboxBaseRadius.toFixed(2)}`);

        this.hitbox.userData.object = this;
        this.sphere.userData.isHitbox = true;

        //_ Create 2D circle sprite
        const HIGHLIGHT_FACTOR = 3 * this.hitboxScale // tune size of circle

        const canvas = document.createElement('canvas')
        const size = 256
        canvas.width = size
        canvas.height = size
        
        const ctx = canvas.getContext('2d')
        ctx.beginPath()
        ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 8
        ctx.stroke()

        const desiredCircleWorld = this.modelRadius * HIGHLIGHT_FACTOR
        const circleLocal = desiredCircleWorld / this.scale
        
        const texture = new THREE.CanvasTexture(canvas)
        this.circle = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false, 
            opacity: 0.8
            // color: 0x48ff00ff
        }))
        this.circle.visible = false // Start hidden

        this.sphere.add(this.circle)
        this.circle.scale.set(circleLocal, circleLocal, 1)
        this.circle.position.set(0, 0, 0) // Center on object
    }

    async buildSatellites(satellites) {
        for (const [id, settings] of Object.entries(satellites)) {
            let obj = await CelestialObj.create(id, this, this.camera, settings)

            this.satellites.push(obj)
        }
    }
    getAllSats() {
        let returnList = []
        this.satellites.forEach(obj => {
            returnList.push(obj)
            obj.getAllSats().forEach(x => returnList.push(x))
        })
        return returnList
    }

    

    fetchAnimations(gltf) {
        if (gltf.animations && gltf.animations.length) {
            //// console.log(`Animations found for ${this.name}:`, gltf.animations); // Debug log
            const mixer = new THREE.AnimationMixer(this.sphere);
            const actions = gltf.animations.map(clip => {
                const action = mixer.clipAction(clip);
                action.clampWhenFinished = true;
                action.setLoop(THREE.LoopOnce);
                return action;
            });
            return { mixer, actions };
        }
        return null;
    }
    playAnimation(reverse = false) {
        if (!this.animations.length) return

        // console.log(`Playing animation for ${this.name}, reverse=${reverse}`)
        
        if (this.currentAction) {
            this.currentAction.stop()
        }
        
        this.animations.forEach(action => {
            action.paused = false
            action.timeScale = reverse ? -1 : 1
            action.play()
        })
        // // Play the first animation in the array (or modify as needed)
        // this.currentAction = this.animations[0];
        // this.currentAction.paused = false;
        // this.currentAction.timeScale = reverse ? -1 : 1;
        // this.currentAction.play();

        this.played = !reverse
    }

    toggleWireframe(enabled) {
        this.sphere.traverse(child => {
            if (child.isMesh && !child.userData?.isHitbox) {
                // Clone material if one hasn't been made already
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material
                }
                
                if (enabled) {
                    // Create wireframe version
                    child.material = new THREE.MeshBasicMaterial({
                        wireframe: true,
                        color: 0x555555,
                    })
                } else {
                    // Restore original material
                    child.material = child.userData.originalMaterial
                }
            }
        })
    }

    toggleHitbox(enabled) {
        this.hitbox.material.visible = enabled
    }

    multiplyScale(factor) {
        const s = this.scale * factor
        this.sphere.scale.set(s, s, s)
    }
    resetScale() {
        const s = this.scale
        this.sphere.scale.set(s, s, s)

        // if (this.circle)
        //     this.circle.scale.set(this.circleBase, this.circleBase, 1)
    }

    update(dt=1) {
        this.angle += this.orbitSpeed * dt // Increment angle based on time delta
        this.sphere.position.x = (this.orbitRadius * Math.cos(this.angle))
        this.sphere.position.z = (this.orbitRadius * Math.sin(this.angle))
        
        if (this.parent !== null) {
            this.sphere.position.x += this.parent.sphere.position.x
            this.sphere.position.z += this.parent.sphere.position.z
        }

        // Center hitbox on sphere
        // ( weird shenanigans occur, where position and scale is only inherited with a loaded model )
        if (this.modelLoaded) this.hitbox.position.set(0,0,0)
        else this.hitbox.position.copy(this.sphere.position)

        if (this.faceParent) this.sphere.lookAt(this.parent.sphere.position)
        else this.sphere.rotation.y += this.rotationSpeed

        if (this.mixer) {
            this.mixer.update(dt); // Update the animation mixer
        }

        // Keep circle aligned with camera
        if (this.circle.visible) {
            this.circle.quaternion.copy(this.camera.quaternion)
        }
    }

    static async create(id, parent, camera, settings) {
      const instance = new CelestialObj(id, parent, camera, settings)
      await instance.buildPlaceholder()
      await instance.buildSatellites(settings.satellites)
      return instance
    }

    static getObjectRadius(object, { conservative = true } = {}) {
        const center = new THREE.Vector3();
        const radiusVec = new THREE.Vector3();

        // Helper: get world scale and max component
        const worldScale = new THREE.Vector3();
        object.getWorldScale(worldScale);
        const maxScale = Math.max(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));

        // Case A: single Mesh with geometry and boundingSphere
        if (object.isMesh && object.geometry) {
            const geom = object.geometry;
            if (!geom.boundingSphere) geom.computeBoundingSphere();
            if (geom.boundingSphere) {
            // bounding sphere is in geometry local space; transform center and radius to world
            const localCenter = geom.boundingSphere.center.clone();
            // Transform center by mesh world matrix
            object.updateWorldMatrix(true, false);
            object.localToWorld(localCenter);
            const radius = geom.boundingSphere.radius * maxScale;
            return { center: localCenter, radius };
            }
        }

        // Case B: Group / Object3D / Mesh fallback: world-space bounding box
        const box = new THREE.Box3().setFromObject(object);
        if (box.isEmpty()) {
            // no geometry found
            console.warn(`(${object.id}) Cannot compute bounding radius: no geometry found in object or its children.`);
            return { center: new THREE.Vector3(), radius: 0 };
        }

        box.getCenter(center);
        // conservative: radius = distance from center to farthest box corner (guarantees enclosure)
        // cheaper approximation: radius = box.getSize(length) * 0.5
        if (conservative) {
            // compute farthest corner distance
            const corners = [
            new THREE.Vector3(box.min.x, box.min.y, box.min.z),
            new THREE.Vector3(box.min.x, box.min.y, box.max.z),
            new THREE.Vector3(box.min.x, box.max.y, box.min.z),
            new THREE.Vector3(box.min.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.min.y, box.min.z),
            new THREE.Vector3(box.max.x, box.min.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.min.z),
            new THREE.Vector3(box.max.x, box.max.y, box.max.z)
            ];
            let radius = 0;
            for (let i = 0; i < corners.length; i++) {
            radius = Math.max(radius, center.distanceTo(corners[i]));
            }
            return { center, radius };
        } else {
            // cheaper approximation
            const size = box.getSize(radiusVec);
            const radius = size.length() * 0.5;
            return { center, radius };
        }
    }
}

export default CelestialObj

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0
}