import { AnimationUtils } from './animationUtils.js'
import { interactionManager } from './interactionManager.js'
import { sceneManager } from './sceneManager.js'

export class CameraManager {
    constructor() {
        this.camera = null
        this.controls = null

        this.animUtil = null

        this.followedObject = null
        this.prevObjectPosition = null
        this.isZooming = false
    }

    init() {

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100000
        )

        this.controls = new THREE.OrbitControls(this.camera, sceneManager.renderer.domElement)
        this.prevObjectPosition = new THREE.Vector3()

        // interactionManager.updateFocusFromUrl()

        this.camera.position.set(
            55000,
            55000,
            55000
        )

        this.animUtil = new AnimationUtils(this.camera, this.controls)

        return { camera:this.camera, controls:this.controls }
    }

    update(dt) {
        if (this.followedObject && !this.isZooming) {
            const currentPos = this.followedObject.sphere.position.clone()

            const delta = currentPos.clone().sub(this.prevObjectPosition)

            // Move camera and target by the planet's movement delta
            this.camera.position.add(delta)
            this.controls.target.copy(this.followedObject.sphere.position)
            this.controls.update()

            this.prevObjectPosition.copy(currentPos)
        }
    }
    
    zoomToObject(object, isInitialZoom = false) {
        if (this.isZooming || !object) return
        this.isZooming = true

        if (this.followedObject) {
            this.followedObject.isFocused = false
            this.followedObject.playAnimation(true)
        }

        this.animUtil.cancelAllScaleAnimations()

        
        interactionManager.hoverInfoBox.classList.remove('visible')
        interactionManager.pinnedInfoBox.classList.remove('visible')

        const zoomDuration = isInitialZoom ? 2000 : 1000

        if (this.followedObject) {
            this.followedObject.satellites.forEach(sat => this.animUtil.animateScale(sat, 1, zoomDuration))
        }
        object.satellites.forEach(sat => this.animUtil.animateScale(sat, 2, zoomDuration))

        this.animUtil.animateZoom(object, zoomDuration)
        
        // this.followedObject = object
        // this.prevObjectPosition.copy(object.sphere.position)

        // window.history.pushState(null, '', `#${object.id}`)
        // this.isZooming = false
        // interactionManager.updateFollowedInfo()
        // Wait for the zoom animation to complete before resetting the isZooming flag
        setTimeout(() => {
            this.followedObject = object;
            this.followedObject.isFocused = true
            this.prevObjectPosition.copy(object.sphere.position);
            this.followedObject.playAnimation()

            window.history.pushState(null, '', `#${object.id}`);
            this.isZooming = false;
            interactionManager.updateFollowedInfo();
            console.log(`Zoomed to ${this.followedObject.id}`)
        }, zoomDuration);
    }
}

const cameraManager = new CameraManager()

export { cameraManager}
