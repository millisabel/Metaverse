/**
 * @description Class for managing the synchronization of objects in 3D space
 * @param {Array} sources - Array of sources (e.g. cards)
 * @param {Array} targets - Array of targets (e.g. glows)
 * @param {Function} syncFn - Synchronization function (source, target) => void
 */
export class Object3DSyncManager {
    constructor(sources, targets, syncFn) {
        this.sources = sources;
        this.targets = targets;
        this.syncFn = syncFn;
    }

    /**
     * @description Updates the synchronization of objects
     * @returns {void}
     */
    update() {
        const count = Math.min(this.sources.length, this.targets.length);
        for (let i = 0; i < count; i++) {
            this.syncFn(this.sources[i], this.targets[i]);
        }
    }

    /**
     * @description Cleans up the synchronization manager
     * @returns {void}
     */
    cleanup() {
        this.cards = [];
        this.glows = [];
        this.syncCallback = null;
    }
}