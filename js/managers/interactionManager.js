import { solarSystem } from '../solarsys.js'
import { sceneManager } from './sceneManager.js'
import { cameraManager } from './cameraManager.js'
import { getStyle } from '../helperFunctions.js'

export class InteractionManager {
    constructor() {
        this.infoPersist = false

        this.tapCount = 0
        this.tapTimeout = null

        this.hoveredObject = null
        this.hoverInfoBox = null
        this.hoverInfoTitle = null
        this.hoverInfoSubTitle = null

        this.pinnedInfoBox = null
        this.pinnedInfoTitle = null
        this.pinnedInfoSubTitle = null
        this.pinnedInfoDescription = null
        this.pinnedInfoLinksContainer = null
        this.pinnedInfoCredit = null
        this.pinnedInfoExpandBtn = null

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
        this.hoverInfoBox = document.getElementById('hovered-container')
            this.hoverInfoTitle = this.hoverInfoBox.querySelector('.container-title')
            this.hoverInfoSubTitle = this.hoverInfoBox.querySelector('.container-subtitle')

        // Persistent info box for following object
        this.pinnedInfoBox = document.getElementById('pinned-container')
            this.pinnedInfoCollapseBtn = document.getElementById('collapse-button')
            this.pinnedInfoTitle = this.pinnedInfoBox.querySelector('.container-title')
            this.pinnedInfoSubTitle = this.pinnedInfoBox.querySelector('.container-subtitle')
            this.pinnedInfoDescription = this.pinnedInfoBox.querySelector('.container-description')
                // this.pinnedInfoDescription.class('visible')
            this.pinnedInfoLinksContainer = this.pinnedInfoBox.querySelector('.link-container')
            // this.pinnedInfoCredit = this.pinnedInfoBox.querySelector('.info-credit')
            this.pinnedInfoDropdown = this.pinnedInfoBox.querySelector('.dropdown').querySelector('.dropdown-menu')
            this.pinnedInfoAnimateBtn = document.getElementById('animate-button')
            this.pinnedInfoImagesBtn = document.getElementById('images-button');
            this.pinnedInfoExpandBtn = document.getElementById('expand-button')
            this.pinnedInfoBackBtn = document.getElementById('back-button')
        
            // Buttons for persistent info box on following object
            this.pinnedInfoCollapseBtn.addEventListener('click', () => {
                this.pinnedInfoBox.classList.toggle('collapsed')
                this.resizeDescriptionBox()
            })
            this.pinnedInfoAnimateBtn.addEventListener('click', () => {
                cameraManager.followedObject.playAnimation(cameraManager.followedObject.played)
                if (cameraManager.followedObject.played) {
                    // console.log("Opening")
                    this.pinnedInfoAnimateBtn.textContent = "Close"
                } else {
                    // console.log("Closing")
                    this.pinnedInfoAnimateBtn.textContent = "Open"
                }
            })
            this.pinnedInfoExpandBtn.addEventListener('click', () => {
                if (cameraManager.followedObject.info.description && !this.pinnedInfoDescription.classList.contains('expanded')) {
                    // EXPAND DESCRIPTION
                    this.pinnedInfoDescription.classList.add('expanded')
                    this.pinnedInfoExpandBtn.getElementsByTagName('i')[0].style.transform = "rotate(180deg)"
                    // this.pinnedInfoExpandBtn.innerHTML = "<i class=\"fa-solid fa-angle-up\"></i>"
                } else {
                    // CLOSE DESCRIPTION
                    this.pinnedInfoDescription.classList.remove('expanded')
                    this.pinnedInfoExpandBtn.getElementsByTagName('i')[0].style.transform = "rotate(0deg)"
                    // this.pinnedInfoExpandBtn.innerHTML = "<i class=\"fa-solid fa-angle-down\"></i>"
                }
                this.resizeDescriptionBox()
            })
            this.pinnedInfoBackBtn.addEventListener('click',
                () => cameraManager.zoomToObject(cameraManager.followedObject.parent)
            )

        // Image viewer

        this.imageViewer = document.getElementById('image-viewer');
            this.viewerImage = this.imageViewer.querySelector('.viewer-image');
            this.viewerClose = this.imageViewer.querySelector('.close');
            this.viewerPrev = this.imageViewer.querySelector('.prev');
            this.viewerNext = this.imageViewer.querySelector('.next');

        this.pinnedInfoImagesBtn.addEventListener('click', () => this.openImageViewer());

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
        this.settingsBox = document.getElementById('settings-container')
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

        window.addEventListener('resize', () => this.onResize(), false)

        sceneManager.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e))
        sceneManager.renderer.domElement.addEventListener('click', (e) => this.onObjectClick(e))
        sceneManager.renderer.domElement.addEventListener('dblclick', (e) => this.onObjectDblClick(e))
        sceneManager.renderer.domElement.addEventListener('touchend', (e) => this.onTap(e), false)

        
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1).toLowerCase()
            const obj = solarSystem.objects.find(o => o.id.toLowerCase() === hash)
            if (obj){
                cameraManager.zoomToObject(obj)
            }
        })

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                cameraManager.zoomToObject(cameraManager.followedObject.parent)
            }
        })

        console.log("Interactions Manager Loaded")
    }

    update() {
        if (this.hoveredObject || (this.infoPersist && this.hoverInfoBox.value)){
            const windowWidth = Math.min(window.innerWidth, window.outerWidth)
            const windowHeight = Math.min(window.innerHeight, window.outerHeight)

            // Get screen position
            const vector = this.hoverInfoBox.value?.sphere.position.clone()
            vector.project(cameraManager.camera)
            var x = (vector.x * 0.5 + 0.5) * windowWidth
            var y = (vector.y * -0.5 + 0.5) * windowHeight

            // Get box dimensions
            const boxWidth = this.hoverInfoBox.offsetWidth
            const boxHeight = this.hoverInfoBox.offsetHeight

            // Clamp within screen bounds with a little margin
            const margin = 10
            x = Math.min(
            Math.max(x, margin + boxWidth/2),
            windowWidth - boxWidth/2 - margin
            )
            y = Math.min(
            Math.max(y, margin + (boxHeight*1.3)),
            windowHeight - margin
            )

            // Position info box
            this.hoverInfoBox.style.left = `${x}px`
            this.hoverInfoBox.style.top = `${y}px`
        }
    }

    onMouseMove(event) {
        const windowWidth = Math.min(window.innerWidth, window.outerWidth)
        const windowHeight = Math.min(window.innerHeight, window.outerHeight)

        const rect = sceneManager.renderer.domElement.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / windowWidth) * 2 - 1,
            -((event.clientY - rect.top) / windowHeight) * 2 + 1
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
        const windowWidth = Math.min(window.innerWidth, window.outerWidth)
        const windowHeight = Math.min(window.innerHeight, window.outerHeight)

        cameraManager.camera.aspect = windowWidth / windowHeight
        cameraManager.camera.updateProjectionMatrix()

        sceneManager.renderer.setSize(windowWidth, windowHeight)
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
        const windowWidth = Math.min(window.innerWidth, window.outerWidth)
        const windowHeight = Math.min(window.innerHeight, window.outerHeight)

        const rect = sceneManager.renderer.domElement.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / windowWidth) * 2 - 1,
            -((event.clientY - rect.top) / windowHeight) * 2 + 1
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


    resizeDescriptionBox() {
        if (!this.pinnedInfoDescription.classList.contains('expanded') || this.pinnedInfoBox.classList.contains('collapsed')) {
            this.pinnedInfoDescription.style.maxHeight = `0px`
            return
        }

        // Adjust the height of the description box based on pinned infobox content
        const maxTotalHeight = getStyle(this.pinnedInfoBox, 'max-height')
            ? parseFloat(getStyle(this.pinnedInfoBox, 'max-height'))
            : window.innerHeight * 0.9 // Fallback to 90% of viewport height if max-height is not set
        const titleHeight = this.pinnedInfoTitle.offsetHeight
        const subTitleHeight = this.pinnedInfoSubTitle.offsetHeight
        const linksHeight = this.pinnedInfoLinksContainer.offsetHeight
        const buttonsHeight = 40 // Approximate height of buttons container
        
        // Get spacing values of all elements in the pinned infobox
        const padding =
            parseFloat(getStyle(this.pinnedInfoBox, 'padding-top')) +
            parseFloat(getStyle(this.pinnedInfoBox, 'padding-bottom')) +
            parseFloat(getStyle(this.pinnedInfoTitle, 'margin-bottom')) +
            parseFloat(getStyle(this.pinnedInfoSubTitle, 'margin-bottom')) +
            parseFloat(getStyle(this.pinnedInfoDescription, 'margin-bottom')) +
            parseFloat(getStyle(this.pinnedInfoLinksContainer, 'margin-bottom'))

        // console.debug("Max total height:", maxTotalHeight)
        // console.debug("Title height:", titleHeight)
        // console.debug("Subtitle height:", subTitleHeight)
        // console.debug("Links height:", linksHeight)
        // console.debug("Buttons height:", buttonsHeight)
        // console.debug("Padding:", padding)

        // Calculate available height for description when visible
        const availableHeight = maxTotalHeight - (titleHeight + subTitleHeight + linksHeight + buttonsHeight + padding)
        this.pinnedInfoDescription.style.maxHeight = `${availableHeight}px`
        // console.log("Resized description box to max height:", availableHeight)
    }


    updateFocusFromUrl() {
        const urlFocusObj = window.location.href.split('#')[1]
        
        // Find focus object from URL
        if (urlFocusObj == null) {
            cameraManager.followedObject = solarSystem.sun
        }
        else solarSystem.objects.forEach(obj => {
            if (urlFocusObj === obj.id) {
                cameraManager.followedObject = obj
                cameraManager.followedObject.playAnimation()
                return
            }
        })
    }

    updateFollowedInfo() {
        if (cameraManager.followedObject) { //// && cameraManager.followedObject !== solarSystem.sun) {
            
            // Update satellite dropdown menu
            this.pinnedInfoDropdown.innerHTML = ""
            if (cameraManager.followedObject.satellites.length > 0) {
                cameraManager.followedObject.satellites.forEach(sat => this.configureSatelliteDropdown(sat))
                this.pinnedInfoDropdown.parentElement.classList.add('visible')
            } else {
                this.pinnedInfoDropdown.parentElement.classList.remove('visible')
            }

            // Update pinned info box content
            this.pinnedInfoTitle.textContent = cameraManager.followedObject.info.title
            this.pinnedInfoSubTitle.textContent = cameraManager.followedObject.info.subtitle
            this.pinnedInfoDescription.innerHTML = cameraManager.followedObject.info.description
            this.pinnedInfoLinksContainer.innerHTML = ""
            Object.entries(cameraManager.followedObject.info.links).forEach(([label,url]) => this.configureLink(label,url))
            
            // Toggle visibility of pinned info box
            this.pinnedInfoBox.classList.add('visible')
            
            // Enable back button if parent exists
            if (cameraManager.followedObject.parent != null)
                this.pinnedInfoBackBtn.classList.add('visible')
            else
                this.pinnedInfoBackBtn.classList.remove('visible')

            // Enable animation button if animations exist (length != 0)
            if (cameraManager.followedObject.animations.length) 
                this.pinnedInfoAnimateBtn.classList.add('visible')
            else
                this.pinnedInfoAnimateBtn.classList.remove('visible')

            // Update animation button text based on current state
            if (cameraManager.followedObject.played)
                this.pinnedInfoAnimateBtn.textContent = "Close"
            else
                this.pinnedInfoAnimateBtn.textContent = "Open"

            // Enable images button if images exist (length != 0)
            const imgCount = cameraManager.followedObject.info.images.length
            if (imgCount > 0) {
                this.pinnedInfoImagesBtn.classList.add('visible')
                if (imgCount == 1)
                    this.pinnedInfoImagesBtn.textContent = "Image"
                else
                    this.pinnedInfoImagesBtn.textContent = "Images"
            }
            else
                this.pinnedInfoImagesBtn.classList.remove('visible')
            
            // Enable expand button if description exists
            if (cameraManager.followedObject.info.description)
                this.pinnedInfoExpandBtn.classList.add('visible')
            else
                this.pinnedInfoExpandBtn.classList.remove('visible')
        } else {
            this.pinnedInfoBox.classList.remove('visible')
        }
    }

    configureLink(label, url) {
        var element
        if (url != "")
        {
            element = document.createElement('a')
            element.className = "link footer"
            element.href = url
            element.target = "_blank"
            element.rel = "noopener noreferrer"
            element.innerHTML = label
        }
        else
        {
            element = document.createElement('span')
            element.className = "link footer"
            element.innerHTML = label
        }

        this.pinnedInfoLinksContainer.appendChild(element)
    }

    configureSatelliteDropdown(object){
        const element = document.createElement('a')
        element.className = "dropdown-item"
        element.href = `#${object.id}`
        element.innerHTML = object.name

        this.pinnedInfoDropdown.appendChild(element)
    }
}

const interactionManager = new InteractionManager()

export { interactionManager }