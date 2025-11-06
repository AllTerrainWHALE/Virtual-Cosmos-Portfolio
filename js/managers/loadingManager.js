// loadingManager.js
export class LoadingManager {
    constructor() {
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.callbacks = {
            progress: [],
            complete: []
        };
    }

    setTotalAssets(count) {
        this.totalAssets = count;
    }

    incrementLoaded() {
        this.loadedAssets++;
        this.notifyProgress();
        
        if (this.loadedAssets >= this.totalAssets) {
            this.notifyComplete();
        }
    }

    onProgress(callback) {
        this.callbacks.progress.push(callback);
    }

    onComplete(callback) {
        this.callbacks.complete.push(callback);
    }

    notifyProgress() {
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.callbacks.progress.forEach(callback => callback(progress));
    }

    notifyComplete() {
        this.callbacks.complete.forEach(callback => callback());
    }
}

function initLoadingManager(totalAssets) {
    // const manager = new LoadingManager();

    loadingManager.setTotalAssets(totalAssets);

    loadingManager.onProgress((progress) => {
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        const loadingDetails = document.getElementById('loading-details');
        
        loadingBar.style.width = progress + '%';
        loadingText.textContent = `Loading assets: ${Math.round(progress)}%`;
        
        // Update loading details based on progress
        if (progress < 30) {
            loadingDetails.textContent = "Loading star fields...";
        } else if (progress < 60) {
            loadingDetails.textContent = "Loading planetary systems...";
        } else if (progress < 90) {
            loadingDetails.textContent = "Loading textures and details...";
        } else {
            loadingDetails.textContent = "Finalizing portfolio...";
        }
    });

    loadingManager.onComplete(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('loaded');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 5000);
    });
}

function countAssets(settings) {
    let count = 1; // Count the current object
    if (settings.satellites) {
        for (const satellite of Object.values(settings.satellites)) {
            count += countAssets(satellite);
        }
    }
    return count;
}

const loadingManager = new LoadingManager();
export { initLoadingManager, countAssets, loadingManager };