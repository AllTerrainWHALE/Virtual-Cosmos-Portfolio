import { cameraManager } from "./cameraManager.js"
import { loadSettings } from "./settingsManager.js"

const settings = await loadSettings()

export class SceneManager {
    constructor() {
        this.scene = null
        this.renderer = null
        this.clock = null
        this.stars = null
    }

    async init() {

        this.clock = new THREE.Clock()
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x000000)

        this.createStarField()

        this.renderer = new THREE.WebGLRenderer()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(this.renderer.domElement)

        // console.log(this.renderer)

        return { scene: this.scene, renderer: this.renderer, clock: this.clock }
    }

    render() {
        this.renderer.render(this.scene, cameraManager.camera)
    }

    static addLights(scene, ambientValue, pointValue) {
        const ambientLight = new THREE.AmbientLight(0x404040, ambientValue)
        scene.add(ambientLight)

        const pointLight = new THREE.PointLight(0xffcc00, pointValue)
        pointLight.position.set(0, 0, 0)
        scene.add(pointLight)

        return { ambientLight, pointLight }
    }

    createStarField(starCount = 5000, starRad = 1000) {
        // const starCount = 5000
        const vertices = []
        const starRadius = starRad * settings.AU // Adjust based on your scale (AU is 100)

        for (let i = 0; i < starCount; i++) {
            // Random spherical distribution
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos((Math.random() * 2 - 1))
            const r = starRadius * Math.cbrt(Math.random())
            
            vertices.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            )
        }

        const geometry = new THREE.BufferGeometry()
        geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.15,
            sizeAttenuation: false, // Stars stay same size regardless of distance
            transparent: true,
            opacity: 0.8,
            depthWrite: false // Ensure stars don't interfere with depth buffer
        })

        this.stars = new THREE.Points(geometry, material)
        this.stars.name = "starField"
        this.scene.add(this.stars)
    }
}

const sceneManager = new SceneManager()

export { sceneManager }
