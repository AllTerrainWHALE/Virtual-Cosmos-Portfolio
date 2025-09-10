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

// Create a singleton instance
export const loadingManager = new LoadingManager();