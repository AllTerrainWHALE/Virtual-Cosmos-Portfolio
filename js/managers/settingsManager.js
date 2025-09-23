let settings = null

async function loadSettings() {
    if (!settings) {
        settings = await fetch('./json/settings.json')
            .then(r => r.json())
            .catch(err => {
                console.error("Error loading settings:", err)
                return {}
            })
    }
    return settings
}

export { loadSettings }
