export class AnimationUtils {
    constructor(cam, cont) {
        this.camera = cam
        this.controls = cont
        this.scalingAnimations = {}
    }

    animateZoom(object, zoomDuration = 500) {
        const startTime = performance.now()
        const initialPos = this.camera.position.clone()
        const initialTarget = this.controls.target.clone()

        const camera = this.camera
        const controls = this.controls

        function step() {
            const elapsed = performance.now() - startTime
            const t = Math.min(elapsed / zoomDuration, 1)

            const objPos = object.sphere.position.clone()
            const endPos = new THREE.Vector3().copy(objPos).add(new THREE.Vector3(
                object.bodyRadius * 7,
                object.bodyRadius * 7,
                object.bodyRadius * 7
            ))

            camera.position.lerpVectors(initialPos, endPos, t)
            controls.target.lerpVectors(initialTarget, objPos, t)
            controls.update()

            if (t < 1) {
                requestAnimationFrame(step)
            }
        }
        step()
    }

    animateScale(object, targetMultiplier = 1, duration = 500) {
        if (!object || !object.sphere) return
        const key = object.id ?? object.name

        if (this.scalingAnimations[key]?.raf) {
            cancelAnimationFrame(this.scalingAnimations[key].raf)
            delete this.scalingAnimations[key]
        }

        const base = object.scale
        const target = base * targetMultiplier
        const start = object.sphere.scale.x
        const startTime = performance.now()

        var scalingAnimations = this.scalingAnimations

        function step() {
            const elapsed = performance.now() - startTime
            const t = Math.min(elapsed / duration, 1)
            const eased = AnimationUtils.easeOutCubic(t)
            const current = start + (target - start) * eased
            object.sphere.scale.set(current, current, current)

            if (t < 1) {
                scalingAnimations[key] = { raf: requestAnimationFrame(step) }
            } else {
                delete scalingAnimations[key]
            }
        }
        this.scalingAnimations[key] = { raf: requestAnimationFrame(step) }
    }

    cancelAllScaleAnimations() {
        Object.values(this.scalingAnimations).forEach(h => h?.raf && cancelAnimationFrame(h.raf))
        this.scalingAnimations = {}
    }

    static easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3)
    }
}