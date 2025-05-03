// const Astronomy = require('astronomyjs')  // Install astronomyjs via npm

const settings = await fetch('settings.json')
  .then(response => response.json()) // Parse JSON
  .catch(error => console.error('Error fetching JSON:', error))

const AU = settings.AU
const orbitSpeedMult = settings.orbitSpeedMult
const rotationSpeedMult = settings.rotationSpeedMult
const scaleMult = settings.scaleMult


class CelestialObj {
    constructor(
        id, parent, camera, settings //name, color, bodyRadius, orbitRadius, orbitSpeed=0.1,
    ) {
        // console.log(settings)
        this.id = id
        this.parent = parent

        this.name = settings.name
        this.modelDir = settings.modelDir
        this.color = new THREE.Color(`rgb(${settings.color})`)
        this.scale = settings.scale ?? 1

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
            description: settings.info?.description || null
          };

        this.mixer = null;
        this.animations = [];
        this.currentAction = null;
        this.isFocused = false;
        this.played = false

        // this.build()
        // this.buildSatellites(settings.satellites)
    }

    async build() {
        
        if (this.modelDir !== "") {
            const loader = new THREE.GLTFLoader()
            const gltf = await new Promise((resolve) => {
                loader.load(this.modelDir, resolve)
            })

            this.sphere = gltf.scene
            
            // Set up animations
            if (gltf.animations && gltf.animations.length) {
                this.mixer = new THREE.AnimationMixer(this.sphere);
                gltf.animations.map(clip => {
                    const action = this.mixer.clipAction(clip);
                    action.clampWhenFinished = true
                    action.setLoop(THREE.LoopOnce)
                    this.animations.push(action)
                });
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
        }

        if (this.name != "sun")
            this.sphere.scale.set(
                scaleMult*this.scale,
                scaleMult*this.scale,
                scaleMult*this.scale
            )

        this.hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(Math.min(this.bodyRadius*5,15), 32, 16),
            new THREE.MeshStandardMaterial({
                visible: false,
                wireframe: true,
                transparent: true,
                opacity: 0.05
            })
        )

        // if (this.name == "earth") console.log(this.sphere)
        
        this.sphere.position.set(this.orbitRadius, 0, 0)
        this.hitbox.position.set(this.orbitRadius, 0, 0)

        this.hitbox.userData.object = this

        // Create 2D circle
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
            depthTest: true, 
            opacity: 0.8
        }))

        // this.circle.scale.set(this.bodyRadius * 8 / this.scale, this.bodyRadius * 8 / this.scale, 1)
        if (this.name == "sputnik") console.log(this.sphere)
        this.circle.scale.set(this.bodyRadius * 8 / this.scale, this.bodyRadius * 8 / this.scale, 1)
        this.circle.visible = false // Start hidden
        
        this.sphere.add(this.circle) // Attach to planet

        // return sphereMesh, hitboxMesh
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
        if (!this.animations.length) return;
        
        if (this.currentAction) {
            this.currentAction.stop();
        }
        
        this.animations.forEach(action => {
            action.paused = false;
            action.timeScale = reverse ? -1 : 1;
            action.play();
        });

        this.played = !reverse
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

        // Keep circle aligned with camera
        if (this.circle.visible) {
            this.circle.quaternion.copy(this.camera.quaternion);
        }
    }

    static async create(id, parent, camera, settings) {
      const instance = new CelestialObj(id, parent, camera, settings);
      await instance.build();
      await instance.buildSatellites(settings.satellites);
      return instance;
    }
}

export default CelestialObj

function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0;
}