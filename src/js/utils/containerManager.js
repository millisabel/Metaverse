export class ContainerManager {
    constructor(parent, options = {}) {
        this.parent = parent;
        // Set styles for the parent container
        this.parent.style.position = 'relative';
        this.parent.style.overflow = 'hidden';
        
        this.options = {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            zIndex: '1',
            overflow: 'hidden',
            ...options
        };
    }

    create() {
        const container = document.createElement('div');
        Object.assign(container.style, this.options);
        this.parent.insertBefore(container, this.parent.firstChild);
        return container;
    }
} 