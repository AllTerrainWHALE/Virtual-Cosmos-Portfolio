// const Astronomy = require('astronomyjs')  // Install astronomyjs via npm
import { loadingManager } from './managers/loadingManager.js'
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

        this.bodyRadius = settings.bodyRadius
        this.orbitRadius = settings.orbitRadius * AU
        this.orbitSpeed = settings.orbitSpeed * orbitSpeedMult // Speed of orbit (radians per second)
        this.rotationSpeed = settings.rotationSpeed * rotationSpeedMult
        this.faceParent = settings.faceParent ?? false

        this.satellites = []

        this.angle = Math.random() * Math.PI // Initial angle

        this.camera = camera
        
        this.info = {
            title: settings.info?.title || this.name,
            subtitle: settings.info?.subtitle || null,
            description: settings.info?.description || null,
            // github: settings.info?.github || null
            links: settings.info?.links || {}
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

    async buildSatellites(satellites) {
        for (const [id, settings] of Object.entries(satellites)) {
            let obj = await CelestialObj.create(id, this, this.camera, settings)

            // scene.add(obj.sphere, obj.hitbox)
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

        if (this.faceParent) {
            this.sphere.lookAt(this.parent.sphere.position)
        }
        else this.sphere.rotation.y += this.rotationSpeed

        this.hitbox.position.copy(this.sphere.position)

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
      await instance.build()
      await instance.buildSatellites(settings.satellites)
      return instance
    }
}

export default CelestialObj

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0
}