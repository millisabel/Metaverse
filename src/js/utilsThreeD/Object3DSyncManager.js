export class Object3DSyncManager {
    /**
     * @param {Array} sources - Массив источников (например, карточки)
     * @param {Array} targets - Массив целей (например, блики)
     * @param {Function} syncFn - Функция синхронизации (source, target) => void
     */
    constructor(sources, targets, syncFn) {
        this.sources = sources;
        this.targets = targets;
        this.syncFn = syncFn;
    }
    update() {
        const count = Math.min(this.sources.length, this.targets.length);
        for (let i = 0; i < count; i++) {
            this.syncFn(this.sources[i], this.targets[i]);
        }
    }
}