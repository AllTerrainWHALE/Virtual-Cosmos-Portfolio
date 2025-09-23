import CelestialObj from './celestialobj.js'

import { initLoadingManager, countAssets } from './managers/loadingManager.js'
import { sceneManager, SceneManager } from './managers/sceneManager.js'
import { cameraManager } from './managers/cameraManager.js'
import { interactionManager } from './managers/interactionManager.js'
import { loadSettings } from './managers/settingsManager.js'

export class SolarSystem {
    constructor() {
        this.totalAssets = 0
        this.objects = []
        this.sun = null
    }

    async init() {
        const settings = await loadSettings()

        this.totalAssets = countAssets(settings.sun)
        initLoadingManager(this.totalAssets)

        // Scene + camera
        // ({ scene, camera, renderer, clock } = initScene(settings))
        sceneManager.init()
        var result = SceneManager.addLights(sceneManager.scene, 3, 2)
        sceneManager.ambientLight = result.ambientLight
        sceneManager.pointLight = result.pointLight
        // console.log(sceneManager.ambientLight.intensity, sceneManager.pointLight.intensity)
        

        cameraManager.init()

        interactionManager.init()

        // Create Sun & planets
        this.sun = await CelestialObj.create("sun", null, cameraManager.camera, settings.sun)
        this.objects.push(this.sun, ...this.sun.getAllSats())
        this.objects.forEach(obj => sceneManager.scene.add(obj.sphere, obj.hitbox))

        interactionManager.updateFocusFromUrl()
        // interactionManager.updateFollowedInfo()

        this.update()
        cameraManager.zoomToObject(cameraManager.followedObject)
    }

    update() {
        requestAnimationFrame(() => this.update())
        const dt = sceneManager.clock.getDelta()
        this.objects.forEach(obj => obj.update(dt))
        cameraManager.update(dt)
        interactionManager.update()
        sceneManager.render()
    }
}

const solarSystem = new SolarSystem()
export { solarSystem }

solarSystem.init()