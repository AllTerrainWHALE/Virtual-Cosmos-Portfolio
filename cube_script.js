var scene, camera, renderer, sunSphere

init()

function init() {
    scene = new THREE.Scene()

    scene.background = new THREE.Color(0xaaaaaa)

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 3

    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)

    document.body.appendChild(renderer.domElement)

    const light = new THREE.DirectionalLight()
    light.position.set(0,1,2)
    scene.add(light)

    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('skyblue')
    })

    const geometry = new THREE.BoxGeometry(1,1,1)

    sunSphere = new THREE.Mesh(geometry, material)
    sunSphere.position.x = 0
    scene.add(sunSphere)

    window.addEventListener('resize', onResize, false)

    update()
}

function update() {
    requestAnimationFrame(update)

    sunSphere.rotation.x += 0.01
    sunSphere.rotation.y += 0.01
    sunSphere.rotation.z += 0.01

    // Render the scene
    renderer.render(scene, camera)
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    //geometry.setSize(1,1,1)

    renderer.setSize(window.innerWidth, window.innerHeight)
}