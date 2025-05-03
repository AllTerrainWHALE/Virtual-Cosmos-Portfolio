import CelestialObj from './celestialobj.js'

var scene, camera, renderer, clock, controls
var mixer, actions=[], mode

var objects=[], planets=[], satellites=[]
var sun, mercury, venus, earth, mars

var followedObject = sun, hoveredObject = null
var prevObjectPosition = new THREE.Vector3()

const settings = await fetch('./json/settings.json')
  .then(response => response.json()) // Parse JSON
  .catch(error => console.error('Error fetching JSON:', error))

const AU = settings.AU, orbitSpeedMult = settings.orbitSpeedMult
const assetPath = './assets/models/'

// Info box for hovering over body
const hoverInfoBox = document.getElementById('celestial-info')
const hoverInfoTitle = document.querySelector('.info-title')
const hoverInfoSubTitle = document.querySelector('.info-subtitle')
const hoverInfoDescription = document.querySelector('.info-description')
var infoPersist = false

// Persistent info box for following object
const followedInfoBox = document.getElementById('followed-info')
const followedInfoTitle = followedInfoBox.querySelector('.info-title')
const followedInfoSubTitle = followedInfoBox.querySelector('.info-subtitle')
const followedInfoDescription = followedInfoBox.querySelector('.info-description')
const followedInfoAnimateBtn = followedInfoBox.querySelector('.info-button')


init()

async function init() {

    clock = new THREE.Clock()

    // Create the scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    createStarField()

    // Setup camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000)

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 3)
    scene.add(ambientLight)

    const directionalLight = new THREE.PointLight(0xffcc00, 2)
    directionalLight.position.set(0,0,0)
    scene.add(directionalLight)

    // Set up renderer
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // Initialize sun
    sun = await CelestialObj.create("sun", null, camera, settings.sun)
    sun.hitbox.material.emissive.set(0xffcc00)
    sun.hitbox.material.emissiveIntensity = 5

    objects.push(sun) ; scene.add(sun.sphere,sun.hitbox)
    sun.getAllSats().forEach(x => {
        objects.push(x)
        scene.add(x.sphere,x.hitbox)
    })

    updateFocusFromUrl()

    // Set camera position
    camera.position.set(
        1.3*followedObject.bodyRadius**2+5,
        1.3*followedObject.bodyRadius**2+5,
        1.3*followedObject.bodyRadius**2+5
    )

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.target.copy(followedObject.sphere.position)
    controls.update()

    window.navigation.addEventListener("navigate", updateFocusFromUrl)

    window.addEventListener('resize', onResize, false)

    renderer.domElement.addEventListener('click', onObjectClick);
    renderer.domElement.addEventListener('dblclick', onObjectDblClick, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    followedInfoAnimateBtn.addEventListener('click', () => {
        followedObject.playAnimation(followedObject.played)
        if (followedObject.played)
            followedInfoAnimateBtn.textContent = "Close"
        else
            followedInfoAnimateBtn.textContent = "Open"
    })

    document.querySelectorAll('.dropdown-item').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const planetName = this.textContent.trim().toLowerCase();
            const planet = objects.find(p => p.name.toLowerCase() === planetName);
            if (planet) {
                // Update URL hash immediately
                window.location.hash = planetName;
                zoomToObject(planet);
            }
        });
    });
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1).toLowerCase();
        const obj = objects.find(o => o.name.toLowerCase() === hash);
        if (obj){
            zoomToObject(obj);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            zoomToObject(followedObject.parent)
        }
    })

    updateFollowedInfo()
    update()
}



function update() {
    requestAnimationFrame(update)

    let dt = clock.getDelta(); // Get time delta

    objects.forEach(obj => {
        obj.update(dt)
        if (obj.mixer)
            obj.mixer.update(dt)
    })

    if (followedObject) {
        const currentObjectPos = followedObject.sphere.position.clone()
        const delta = currentObjectPos.clone().sub(prevObjectPosition)

        // Move camera and target by the planet's movement delta
        camera.position.add(delta)
        controls.target.copy(followedObject.sphere.position)
        controls.update()

        prevObjectPosition.copy(currentObjectPos)
    }

    if (hoveredObject || (infoPersist && hoverInfoBox.value)){
        // Get screen position
        const vector = hoverInfoBox.value?.sphere.position.clone()
        vector.project(camera)
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight
        
        // Position info box
        hoverInfoBox.style.left = `${x}px`
        hoverInfoBox.style.top = `${y}px`
    }

    // Update followed info box
    // if (followedObject && followedObject !== sun) {
    //     followedInfoBox.classList.add('visible')
    // } else {
    //     followedInfoBox.classList.remove('visible')
    // }

    // Render the scene
    renderer.render(scene, camera)
}

function updateFocusFromUrl() {
    const urlFocusObj = window.location.href.split('#')[1]

    // Find focus object from URL
    if (urlFocusObj == null) followedObject = sun
    else objects.forEach(obj => {
        if (urlFocusObj === obj.id) {
            followedObject = obj
            followedObject.playAnimation()
            return
        }
    })
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}

function onObjectClick(event) {
    if (event.detail === 1 && hoveredObject) {
        infoPersist = true
    }

    else {
        infoPersist = false
        if (!hoveredObject)
            hoverInfoBox.classList.remove('visible')
    }
}

function onObjectDblClick(event) {
    var rect = renderer.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / window.innerWidth) * 2 - 1,
        -((event.clientY - rect.top) / window.innerHeight) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    
    const intersects = raycaster.intersectObjects(objects.map(o => o.hitbox))
    
    if (intersects.length > 0) {
        for (const obj of intersects) {
            if (obj.object.userData.object !== followedObject) {
                zoomToObject(obj.object.userData.object)
                break
            }
        }
    }
}

function onMouseMove(event) {
    var rect = renderer.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / window.innerWidth) * 2 - 1,
        -((event.clientY - rect.top) / window.innerHeight) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)

    let objList
    if (followedObject === null) objList = objects
    else objList = followedObject.satellites
    
    const intersects = raycaster.intersectObjects(objList.map(o => o.hitbox))
    
    if (hoveredObject) {
        hoveredObject.circle.visible = false
    }

    if (intersects.length > 0) {
        for (const obj of intersects) {
            if (obj.object.userData.object !== followedObject) {
                hoveredObject = obj.object.userData.object
                hoveredObject.circle.visible = true

                if (hoverInfoBox.value != hoveredObject)
                    infoPersist = false
        
                // Update info box content
                hoverInfoTitle.textContent = hoveredObject.info.title
                hoverInfoSubTitle.textContent = hoveredObject.info.subtitle
                hoverInfoDescription.textContent = hoveredObject.info.description
                hoverInfoBox.value = hoveredObject
                
                // Get screen position
                const vector = hoveredObject.sphere.position.clone()
                vector.project(camera)
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth
                const y = (vector.y * -0.5 + 0.5) * window.innerHeight
                
                // Position info box
                hoverInfoBox.style.left = `${x}px`
                hoverInfoBox.style.top = `${y}px`
                hoverInfoBox.classList.add('visible')

                break
            }
        }
    } else {
        hoveredObject = null
        if (!infoPersist)
            hoverInfoBox.classList.remove('visible')
    }
}

function zoomToObject(celestialObj) {
    // Stop previous object's animation
    if (followedObject) {
        followedObject.isFocused = false;
        followedObject.playAnimation(true); // Reverse animation
    }

    followedObject = null
    hoverInfoBox.classList.remove('visible')
    followedInfoBox.classList.remove('visible')
    window.location.hash = celestialObj.name.toLowerCase();

    const zoomDuration = 1000 // Zoom animation duration in ms
    const startTime = Date.now()
    const initialPos = camera.position.clone()
    const initialTarget = controls.target.clone()

    function animate() {
        const elapsed = Date.now() - startTime
        const t = Math.min(elapsed / zoomDuration, 1)

        // Get current planet position with offset
        const planetPos = celestialObj.sphere.position.clone()
        const endPos = new THREE.Vector3().copy(planetPos).add(new THREE.Vector3(
            1.3*celestialObj.bodyRadius**2+5,
            1.3*celestialObj.bodyRadius**2+5,
            1.3*celestialObj.bodyRadius**2+5
        ))
        
        // Smoothly move camera and target toward current planet position
        camera.position.lerpVectors(initialPos, endPos, t)
        controls.target.lerpVectors(initialTarget, planetPos, t)
        controls.update()

        // Navigate when close enough
        if (t >= 1) {
            // window.location.href = `#${celestialObj.name.toLowerCase()}`
            followedObject = celestialObj
            celestialObj.isFocused = true;
            celestialObj.playAnimation(); // Play forward
            prevObjectPosition.copy(celestialObj.sphere.position)

            // Update following object info box
            updateFollowedInfo()
        } else {
            requestAnimationFrame(animate)
        }
    }
    animate()
}

function updateFollowedInfo() {
    if (followedObject && followedObject !== sun) {
        followedInfoTitle.textContent = followedObject.info.title
        followedInfoSubTitle.textContent = followedObject.info.subtitle
        followedInfoDescription.textContent = followedObject.info.description
        followedInfoBox.classList.add('visible')
        if (followedObject.animations.length) 
            followedInfoAnimateBtn.classList.add('visible')
        else
            followedInfoAnimateBtn.classList.remove('visible')
        if (followedObject.played)
            followedInfoAnimateBtn.textContent = "Close"
        else
            followedInfoAnimateBtn.textContent = "Open"
    } else {
        followedInfoBox.classList.remove('visible')
    }
}



function createStarField() {
    const starCount = 5000;
    const vertices = [];
    const starRadius = 1000 * AU; // Adjust based on your scale (AU is 100)

    for (let i = 0; i < starCount; i++) {
        // Random spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2 - 1));
        const r = starRadius * Math.cbrt(Math.random());
        
        vertices.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.15,
        sizeAttenuation: false, // Stars stay same size regardless of distance
        transparent: true,
        opacity: 0.8,
        depthWrite: false // Ensure stars don't interfere with depth buffer
    });

    const stars = new THREE.Points(geometry, material);
    stars.name = "starField";
    scene.add(stars);
}