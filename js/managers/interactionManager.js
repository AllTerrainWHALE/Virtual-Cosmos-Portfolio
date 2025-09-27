import { solarSystem } from '../solarsys.js'
import { sceneManager } from './sceneManager.js'
import { cameraManager } from './cameraManager.js'

export class InteractionManager {
    constructor() {
        this.infoPersist = false

        this.tapCount = 0
        this.tapTimeout = null

        this.hoveredObject = null
        this.hoverInfoBox = null
        this.hoverInfoTitle = null
        this.hoverInfoSubTitle = null

        this.followedInfoBox = null
        this.followedInfoTitle = null
        this.followedInfoSubTitle = null
        this.followedInfoDescription = null
        this.followedInfoLinksContainer = null
        this.followedInfoCredit = null
        this.followedInfoExpandBtn = null

        this.imageViewer = null;
        this.viewerImage = null;
        this.viewerClose = null;
        this.viewerPrev = null;
        this.viewerNext = null;
        this.currentImageIndex = 0;


        this.settingsBox, this.settingsToggle = null
        this.settingAmbientLight, this.settingAmbientValue, this.settingAmbientSlider = null
        this.settingPointLight, this.settingPointValue, this.settingPointSlider = null
        this.wireframeToggle, this.hitboxToggle = null
    }

    init() {
        // -------------------< UI Elements >-------------------
        
        // Info box for hovering over object
        this.hoverInfoBox = document.getElementById('celestial-info')
            this.hoverInfoTitle = this.hoverInfoBox.querySelector('.info-title')
            this.hoverInfoSubTitle = this.hoverInfoBox.querySelector('.info-subtitle')

        // Persistent info box for following object
        this.followedInfoBox = document.getElementById('followed-info')
            this.followedInfoTitle = this.followedInfoBox.querySelector('.info-title')
            this.followedInfoSubTitle = this.followedInfoBox.querySelector('.info-subtitle')
            this.followedInfoDescription = this.followedInfoBox.querySelector('.info-description')
            this.followedInfoLinksContainer = this.followedInfoBox.querySelector('.info-links-container')
            // this.followedInfoCredit = this.followedInfoBox.querySelector('.info-credit')

            this.followedInfoAnimateBtn = this.followedInfoBox.querySelector('.info-button')
            this.followedInfoExpandBtn = this.followedInfoBox.querySelector('.expand-button')
            this.followedInfoBackBtn = this.followedInfoBox.querySelector('.back-button')
        
            // Buttons for persistent info box on following object
            this.followedInfoAnimateBtn.addEventListener('click', () => {
                cameraManager.followedObject.playAnimation(cameraManager.followedObject.played)
                if (cameraManager.followedObject.played) {
                    // console.log("Opening")
                    this.followedInfoAnimateBtn.textContent = "Close"
                } else {
                    // console.log("Closing")
                    this.followedInfoAnimateBtn.textContent = "Open"
                }
            })
            this.followedInfoExpandBtn.addEventListener('click', () => {
                if (cameraManager.followedObject.info.description && !this.followedInfoDescription.classList.contains('visible')) {
                    // EXPAND DESCRIPTION
                    // // console.log("Open")
                    this.followedInfoDescription.classList.add('visible')
                    this.followedInfoExpandBtn.innerHTML = "<i class=\"fa-solid fa-angle-up\"></i>"
                } else {
                    // CLOSE DESCRIPTION
                    // // console.log("Close")
                    this.followedInfoDescription.classList.remove('visible')
                    this.followedInfoExpandBtn.innerHTML = "<i class=\"fa-solid fa-angle-down\"></i>"
                }
            })
            this.followedInfoBackBtn.addEventListener('click',
                () => cameraManager.zoomToObject(cameraManager.followedObject.parent)
            )

        // Image viewer
        this.followedInfoImagesBtn = this.followedInfoBox.querySelector('.images-button');

        this.imageViewer = document.getElementById('image-viewer');
            this.viewerImage = this.imageViewer.querySelector('.viewer-image');
            this.viewerClose = this.imageViewer.querySelector('.close');
            this.viewerPrev = this.imageViewer.querySelector('.prev');
            this.viewerNext = this.imageViewer.querySelector('.next');

        this.followedInfoImagesBtn.addEventListener('click', () => this.openImageViewer());

        this.viewerClose.addEventListener('click', () => this.closeImageViewer());
        this.viewerPrev.addEventListener('click', () => this.showImage(this.currentImageIndex - 1));
        this.viewerNext.addEventListener('click', () => this.showImage(this.currentImageIndex + 1));

        document.addEventListener('keydown', (e) => {
        if (this.imageViewer.style.display === 'flex') {
            if (e.key === 'ArrowLeft') this.showImage(this.currentImageIndex - 1);
            if (e.key === 'ArrowRight') this.showImage(this.currentImageIndex + 1);
            if (e.key === 'Escape') this.closeImageViewer();
        }
        });


        // Settings menu control
        this.settingsToggle = document.getElementById('settings-toggle')
        this.settingsBox = document.getElementById('settings')
            this.settingAmbientLight = sessionStorage.getItem('ambientLight') || 3
            this.settingAmbientValue = document.getElementById('ambient-value')
                this.settingAmbientValue.textContent = this.settingAmbientLight
            this.settingAmbientSlider = document.getElementById('ambient-slider')
                this.settingAmbientSlider.value = this.settingAmbientLight
            sceneManager.ambientLight.intensity = this.settingAmbientLight


            this.settingPointLight = sessionStorage.getItem('pointLight') || 2
            this.settingPointValue = document.getElementById('point-value')
                this.settingPointValue.textContent = this.settingPointLight
            this.settingPointSlider = document.getElementById('point-slider')
                this.settingPointSlider.value = this.settingPointLight
            sceneManager.pointLight.intensity = this.settingPointLight

            this.wireframeToggle = document.getElementById('wireframe-toggle')
            this.hitboxToggle = document.getElementById('hitbox-toggle')

            // Buttons and sliders
            this.settingsToggle.addEventListener('click', () => {
                this.settingsBox.classList.toggle('visible')
                this.settingsToggle.classList.toggle('active')
            })

            this.settingAmbientSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value)
                sceneManager.ambientLight.intensity = value
                this.settingAmbientValue.textContent = value.toFixed(1)
                sessionStorage.setItem('ambientLight', value)
            })
            this.settingPointSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value)
                sceneManager.pointLight.intensity = value
                this.settingPointValue.textContent = value.toFixed(1)
                sessionStorage.setItem('pointLight', value)
            })

            this.wireframeToggle.addEventListener('change', (e) => {
                solarSystem.objects.forEach(obj => {
                    obj.toggleWireframe(e.target.checked)
                })
            })
            this.hitboxToggle.addEventListener('change', (e) => {
                solarSystem.objects.forEach(obj => {
                    obj.toggleHitbox(e.target.checked)
                })
            })

        

        

        // -------------------< Event Listeners >-------------------
        //// window.addEventListener("popstate", () => this.updateFocusFromUrl())

        window.addEventListener('resize', () => this.onResize, false)

        sceneManager.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e))
        sceneManager.renderer.domElement.addEventListener('click', (e) => this.onObjectClick(e))
        sceneManager.renderer.domElement.addEventListener('dblclick', (e) => this.onObjectDblClick(e))
        sceneManager.renderer.domElement.addEventListener('touchend', (e) => this.onTap(e), false)

        
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1).toLowerCase()
            const obj = solarSystem.objects.find(o => o.name.toLowerCase() === hash)
            if (obj){
                cameraManager.zoomToObject(obj)
            }
        })

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                cameraManager.zoomToObject(cameraManager.followedObject.parent)
            }
        })
    }

    update() {
        if (this.hoveredObject || (this.infoPersist && this.hoverInfoBox.value)){

            // Get screen position
            const vector = this.hoverInfoBox.value?.sphere.position.clone()
            vector.project(cameraManager.camera)
            var x = (vector.x * 0.5 + 0.5) * window.innerWidth
            var y = (vector.y * -0.5 + 0.45) * window.innerHeight

            // Get box dimensions
            const boxWidth = this.hoverInfoBox.offsetWidth
            const boxHeight = this.hoverInfoBox.offsetHeight

            // Clamp within screen bounds with a little margin
            const margin = 10
            x = Math.min(
            Math.max(x, margin + boxWidth/2),
            window.innerWidth - boxWidth/2 - margin
            )
            y = Math.min(
            Math.max(y, margin + boxHeight),
            window.innerHeight - margin
            )

            // Position info box
            this.hoverInfoBox.style.left = `${x}px`
            this.hoverInfoBox.style.top = `${y}px`
        }
    }

    onMouseMove(event) {
        const rect = sceneManager.renderer.domElement.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / window.innerWidth) * 2 - 1,
            -((event.clientY - rect.top) / window.innerHeight) * 2 + 1
        )

        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mouse, cameraManager.camera)
        
        let objList
        if (cameraManager.followedObject === null) objList = solarSystem.objects
        else objList = cameraManager.followedObject.satellites

        const intersects = raycaster.intersectObjects(objList.map(o => o.hitbox))

        if (this.hoveredObject) this.hoveredObject.circle.visible = false

        if (intersects.length > 0) {
            for (const obj of intersects) {
                if (obj.object.userData.object !== cameraManager.followedObject) {
                    this.hoveredObject = obj.object.userData.object
                    this.hoveredObject.circle.visible = true

                    if (this.hoverInfoBox.value != this.hoveredObject)
                        this.infoPersist = false
            
                    // Update info box content
                    this.hoverInfoTitle.textContent = this.hoveredObject.info.title
                    this.hoverInfoSubTitle.textContent = this.hoveredObject.info.subtitle
                    // this.hoverInfoDescription.innerHTML = this.hoveredObject.info.description
                    this.hoverInfoBox.value = this.hoveredObject
                    this.hoverInfoBox.classList.add('visible')

                    break
                }
            }
        } else {
            this.hoveredObject = null
            if (!this.infoPersist)
                this.hoverInfoBox.classList.remove('visible')
        }
    }

    onResize() {
        cameraManager.camera.aspect = window.innerWidth / window.innerHeight
        cameraManager.camera.updateProjectionMatrix()

        sceneManager.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    onObjectClick(event) {
        if (event.detail === 1 && this.hoveredObject) {
            this.infoPersist = true
        }

        else {
            this.infoPersist = false
            if (!this.hoveredObject)
                this.hoverInfoBox.classList.remove('visible')
        }
    }

    onObjectDblClick(event) {
        const rect = sceneManager.renderer.domElement.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / window.innerWidth) * 2 - 1,
            -((event.clientY - rect.top) / window.innerHeight) * 2 + 1
        )
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mouse, cameraManager.camera)

        const intersects = raycaster.intersectObjects(solarSystem.objects.map(o => o.hitbox))
        if (intersects.length > 0) {
            for (const obj of intersects) {
                if (obj.object.userData.object !== cameraManager.followedObject) {
                    cameraManager.zoomToObject(obj.object.userData.object)
                    cameraManager.followedObject = obj.object.userData.object
                    break
                }
            }
        }
    }

    onTap(event) {
        event.preventDefault() // Prevent default to avoid delayed click event

        this.tapCount++
        
        const touch = event.changedTouches[0]
        // Create a pseudo event with "cursor" coordinates
        const pseudoEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            detail: this.tapCount,
            preventDefault: () => {} // Add dummy function to avoid errors
        }
        
        if (this.tapCount === 1) {
            // Wait for potential double tap
            this.tapTimeout = setTimeout(() => {
                this.onMouseMove(pseudoEvent)
                this.onObjectClick(pseudoEvent) // Single tap action
                this.tapCount = 0
            }, 300)
        } else if (this.tapCount === 2) {
            clearTimeout(this.tapTimeout) // Cancel single tap timeout
            this.onObjectDblClick(pseudoEvent) // Double tap action
            this.tapCount = 0
        }
    }

    openImageViewer() {
        const imgs = cameraManager.followedObject.info.images || [];
        if (!imgs.length) return;
        this.currentImageIndex = 0;
        this.showImage(this.currentImageIndex);
        this.imageViewer.style.display = 'flex';
    }
    closeImageViewer() {
        this.imageViewer.style.display = 'none';
    }
    showImage(index) {
        const imgs = cameraManager.followedObject.info.images || [];
        if (!imgs.length) return;
        this.currentImageIndex = (index + imgs.length) % imgs.length;
        this.viewerImage.src = `${imgs[this.currentImageIndex]}`;
    }


    updateFocusFromUrl() {
        const urlFocusObj = window.location.href.split('#')[1]
        // console.log(`URL focus object: ${urlFocusObj}`)

        // console.log(`Objects count: ${solarSystem.objects.length}`)
        
        // Find focus object from URL
        if (urlFocusObj == null) {
            // console.log("No focus object in URL, defaulting to Sun")
            cameraManager.followedObject = solarSystem.sun
        }
        else solarSystem.objects.forEach(obj => {
            // console.log(`Checking object: ${obj.id}`)
            if (urlFocusObj === obj.id) {
                // console.log(`Found object from URL: ${obj.name}`)
                cameraManager.followedObject = obj
                cameraManager.followedObject.playAnimation()
                return
            }
        })
    }

    updateFollowedInfo() {
        if (cameraManager.followedObject) { // && cameraManager.followedObject !== solarSystem.sun) {
            this.followedInfoTitle.textContent = cameraManager.followedObject.info.title
            this.followedInfoSubTitle.textContent = cameraManager.followedObject.info.subtitle
            this.followedInfoDescription.innerHTML = cameraManager.followedObject.info.description
            this.followedInfoLinksContainer.innerHTML = ""
            Object.entries(cameraManager.followedObject.info.links).forEach(([label,url]) => this.configureLink(label,url))
            // if (cameraManager.followedObject.info.github !== null) {
            //     this.followedInfoLinksContainer.href = cameraManager.followedObject.info.github
            //     this.followedInfoLinksContainer.classList.add('visible')
            // } else 
            //     this.followedInfoLinksContainer.classList.remove('visible')

            this.followedInfoBox.classList.add('visible')
            
            if (cameraManager.followedObject.parent != null)
                this.followedInfoBackBtn.classList.add('visible')
            else
                this.followedInfoBackBtn.classList.remove('visible')

            if (cameraManager.followedObject.animations.length) 
                this.followedInfoAnimateBtn.classList.add('visible')
            else
                this.followedInfoAnimateBtn.classList.remove('visible')

            if (cameraManager.followedObject.played)
                this.followedInfoAnimateBtn.textContent = "Close"
            else
                this.followedInfoAnimateBtn.textContent = "Open"

            const imgCount = cameraManager.followedObject.info.images.length
            if (imgCount > 0){
                this.followedInfoImagesBtn.classList.add('visible')
                if (imgCount == 1)
                    this.followedInfoImagesBtn.textContent = "Image"
                else
                    this.followedInfoImagesBtn.textContent = "Images"
            }
            else
                this.followedInfoImagesBtn.classList.remove('visible')
            
            if (cameraManager.followedObject.info.description)
                this.followedInfoExpandBtn.classList.add('visible')
            else
                this.followedInfoExpandBtn.classList.remove('visible')
        } else {
            this.followedInfoBox.classList.remove('visible')
        }
    }

    configureLink(label, url) {
        var element
        if (url != "")
        {
            element = document.createElement('a')
            element.className = "info-link footer"
            element.href = url
            element.target = "_blank"
            element.rel = "noopener noreferrer"
            element.innerHTML = label
        }
        else
        {
            element = document.createElement('span')
            element.className = "info-link footer"
            element.innerHTML = label
        }

        this.followedInfoLinksContainer.appendChild(element)
    }
}

const interactionManager = new InteractionManager()

export { interactionManager }