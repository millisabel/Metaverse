import { createLogger } from "../../utils/logger";
import { isMobile } from "../../utils/utils";

/**
 * Configuration for character badge animation
 * @typedef {Object} BadgeAnimationConfig
 * @property {Object} movement - Movement configuration
 * @property {number} movement.speed - Base movement speed (pixels per frame)
 * @property {number} movement.amplitude - Movement amplitude (pixels)
 * @property {number} movement.frequency - Movement frequency multiplier
 * @property {Object} horizontalMovement - Horizontal movement along section
 * @property {number} horizontalMovement.speed - Speed of horizontal movement
 * @property {number} horizontalMovement.padding - Padding from section edges (px)
 * @property {Object} rotation - Rotation configuration
 * @property {number} rotation.speed - Base rotation speed (degrees per frame)
 * @property {number} rotation.amplitude - Maximum rotation angle (degrees)
 * @property {Object} scale - Scale configuration
 * @property {number} scale.min - Minimum scale factor
 * @property {number} scale.max - Maximum scale factor
 * @property {number} scale.speed - Scale change speed
 */

/**
 * Default animation configuration
 */
const DEFAULT_CONFIG = {
    movement: {
        enabled: false,
        speed: 0.8,
        amplitude: 25,
        frequency: 0.002,
        verticalLimit: 0.3, 
        waves: {
            primary: { frequency: 1.2, amplitude: 1 },
            secondary: { frequency: 0.7, amplitude: 0.5 },
            micro: { frequency: 3, amplitude: 0.3 }
        },
        verticalJumps: {
            probability: 0, 
            duration: 1800, 
            maxHeight: 0.2 
        }
    },
    horizontalMovement: {
        enabled: false,
        speed: 0.0002,
        padding: 50,
        waves: {
            primary: { frequency: 1, amplitude: 0.3 },
            secondary: { frequency: 0.3, amplitude: 0.2 }
        }
    },
    rotation: {
        enabled: true,
        speed: 0.08,
        amplitude: 25,
        waves: {
            primary: { frequency: 0.3, amplitude: 1.5 },
            secondary: { frequency: 0.15, amplitude: 0.8 }
        }
    },
    scale: {
        enabled: true,
        min: 0.2,
        max: 1.3,
        speed: 0.0002,
        frequency: 1,
    },
    mobilePosition: {
        right: 20,
        bottom: 40
    },
    responsive: {
        768: {
            movement: {
                enabled: true,
                verticalJumps: {
                    probability: 0.002,
                }
            },
            horizontalMovement: {
                enabled: true,
            },
            rotation: {
                speed: 0.2,
                amplitude: 15,
            },
            scale: {
                min: 0.8,
                speed: 0.0015,
                frequency: 0.8,
            }
        }
    }   
};

/**
 * Class for animating floating character badge
 */
export class CharacterFloatingBadge {
    /**
     * @param {HTMLElement} element - Badge element to animate
     * @param {HTMLElement} section - Parent section element
     * @param {BadgeAnimationConfig} config - Animation configuration
     */
    constructor(element, section, config = {}) {
        this.element = element;
        this.section = section;
        this.config = {
            movement: { ...DEFAULT_CONFIG.movement, ...config.movement },
            horizontalMovement: { ...DEFAULT_CONFIG.horizontalMovement, ...config.horizontalMovement },
            rotation: { ...DEFAULT_CONFIG.rotation, ...config.rotation },
            scale: { ...DEFAULT_CONFIG.scale, ...config.scale },
            mobilePosition: { ...DEFAULT_CONFIG.mobilePosition, ...config.mobilePosition }
        };

        // Animation state
        this.isAnimating = false;
        this.animationFrame = null;
        this.startTime = 0;
        this.direction = 1; 
        
        // Store dimensions
        this.updateDimensions();

        // Bind methods
        this.animate = this.animate.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.updateDimensions = this.updateDimensions.bind(this);

        // Initialize observers
        this.initIntersectionObserver();
        this.initResizeObserver();

        this.jumpState = {
            isJumping: false,
            startTime: 0,
            targetHeight: 0
        };

        this.phaseOffsets = {
            vertical: Math.random() * Math.PI * 2,
            horizontal: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2
        };
    }

    /**
     * Update section and element dimensions
     */
    updateDimensions() {
        const sectionRect = this.section.getBoundingClientRect();
        const elementRect = this.element.getBoundingClientRect();

        if (!this.isPositionInitialized) {
            this.element.style.position = 'absolute';
            if (isMobile()) {
                this.element.style.right = `${this.config.mobilePosition.right}px`;
                this.element.style.bottom = `${this.config.mobilePosition.bottom}px`;
                this.element.style.left = 'auto'; // Сбрасываем left позицию
            } else {
                this.element.style.left = '0';
                this.element.style.bottom = '0';
            }
            this.isPositionInitialized = true;
        }

        this.dimensions = {
            section: {
                width: sectionRect.width,
                height: sectionRect.height
            },
            element: {
                width: elementRect.width,
                height: elementRect.height
            },
            movementRange: {
                min: this.config.horizontalMovement.padding,
                max: sectionRect.width - elementRect.width - this.config.horizontalMovement.padding
            }
        };

        if (!isMobile()) {
            // Set initial position if not set
            if (!this.currentX) {
                this.currentX = this.dimensions.movementRange.min;
            }

            // Ensure currentX is within valid range after resize
            this.currentX = Math.max(
                this.dimensions.movementRange.min,
                Math.min(this.currentX, this.dimensions.movementRange.max)
            );
        }
    }

    /**
     * Initialize resize observer
     */
    initResizeObserver() {
        this.resizeObserver = new ResizeObserver(() => {
            this.updateDimensions();
        });
        this.resizeObserver.observe(this.section);
    }

    /**
     * Initialize intersection observer to handle visibility
     */
    initIntersectionObserver() {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.start();
                    } else {
                        this.stop();
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );

        this.observer.observe(this.section);
    }

    /**
     * Start animation
     */
    start() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.startTime = performance.now();
        this.animate();
    }

    /**
     * Stop animation
     */
    stop() {
        if (!this.isAnimating) return;

        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Reset element styles
        this.element.style.transform = '';
    }

    /**
     * Calculate combined wave movement
     * @param {number} time - Current time
     * @param {Object} waves - Wave configurations
     * @returns {number} Combined wave value
     */
    calculateWaveMovement(time, waves) {
        return (
            Math.sin(time * waves.primary.frequency + this.phaseOffsets.vertical) * waves.primary.amplitude +
            Math.sin(time * waves.secondary.frequency) * waves.secondary.amplitude +
            (waves.micro ? Math.sin(time * waves.micro.frequency) * waves.micro.amplitude : 0)
        );
    }

    /**
     * Handle vertical jumps
     * @param {number} currentTime - Current timestamp
     * @returns {number} Vertical offset from jumps
     */
    handleVerticalJumps(currentTime) {
        const { verticalJumps } = this.config.movement;
        
        // Инициация нового прыжка
        if (!this.jumpState.isJumping && Math.random() < verticalJumps.probability) {
            this.jumpState.isJumping = true;
            this.jumpState.startTime = currentTime;
            this.jumpState.targetHeight = (Math.random() * 0.7 + 0.3) * verticalJumps.maxHeight * this.dimensions.section.height;
        }

        // Обработка текущего прыжка
        if (this.jumpState.isJumping) {
            const jumpElapsed = currentTime - this.jumpState.startTime;
            const jumpProgress = Math.min(jumpElapsed / verticalJumps.duration, 1);

            if (jumpProgress >= 1) {
                this.jumpState.isJumping = false;
                return 0;
            }

            // Параболическая траектория прыжка
            const jumpCurve = Math.sin(jumpProgress * Math.PI);
            return this.jumpState.targetHeight * jumpCurve;
        }

        return 0;
    }

    /**
     * Animation frame handler
     */
    animate() {
        if (!this.isAnimating) return;

        const currentTime = performance.now();
        const elapsed = (currentTime - this.startTime) * this.config.movement.frequency;

        let transform = '';

        if (isMobile()) {
            // На мобильных только вращение и масштабирование
            const rotation = this.calculateRotation(currentTime);
            const scale = this.calculateScale(currentTime);
            transform = `rotate(${rotation}deg) scale(${scale})`;
        } else {
            // Полная анимация для десктопа
            const baseMovement = this.direction * this.config.horizontalMovement.speed * this.dimensions.section.width;
            const horizontalWave = this.calculateWaveMovement(elapsed, this.config.horizontalMovement.waves);
            const waveInfluence = 0.2;
            
            this.currentX += baseMovement * (1 + horizontalWave * waveInfluence);

            if (this.currentX >= this.dimensions.movementRange.max) {
                this.currentX = this.dimensions.movementRange.max;
                this.direction = -1;
            } else if (this.currentX <= this.dimensions.movementRange.min) {
                this.currentX = this.dimensions.movementRange.min;
                this.direction = 1;
            }

            const baseVerticalWave = this.calculateWaveMovement(elapsed, this.config.movement.waves);
            const jumpOffset = this.handleVerticalJumps(currentTime);
            const maxVerticalOffset = this.dimensions.section.height * this.config.movement.verticalLimit;
            const yOffset = Math.min(
                (baseVerticalWave * this.config.movement.amplitude + jumpOffset),
                maxVerticalOffset
            );

            const rotation = this.calculateRotation(currentTime);
            const scale = this.calculateScale(currentTime);

            transform = `translate3d(${this.currentX}px, ${-yOffset}px, 0) rotate(${rotation}deg) scale(${scale})`;
        }

        this.element.style.transform = transform;

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    calculateRotation(currentTime) {
        if (!this.config.rotation.enabled) return 0;
        
        const elapsed = (currentTime - this.startTime) * this.config.movement.frequency;
        const rotationWave = this.calculateWaveMovement(elapsed, this.config.rotation.waves);
        const baseRotation = rotationWave * this.config.rotation.amplitude;
        return isMobile() ? baseRotation : baseRotation + this.direction * 5;
    }

    calculateScale(currentTime) {
        if (!this.config.scale.enabled) return 1;
        
        const elapsed = (currentTime - this.startTime) * (this.config.scale.frequency || 1);
        const scaleRange = this.config.scale.max - this.config.scale.min;
        
        if (isMobile()) {
            // Более плавное масштабирование для мобильных
            const scaleWave = Math.sin(elapsed * this.config.scale.speed);
            return this.config.scale.min + (scaleWave + 1) * 0.5 * scaleRange;
        } else {
            // Оригинальное масштабирование для десктопа
            const baseScale = this.config.scale.min + (Math.sin(elapsed * this.config.scale.speed) + 1) * 0.5 * scaleRange;
            return baseScale * (1 + Math.abs(this.direction) * 0.05);
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stop();
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    updatePosition() {
        const time = performance.now() / 1000;
        
        // Calculate vertical movement
        let y = this.calculateVerticalPosition(time);
        
        // Calculate horizontal movement only if enabled
        let x = 0;
        if (this.config.horizontalMovement.enabled) {
            x = this.calculateHorizontalPosition(time);
        } else {
            // Center the badge horizontally when horizontal movement is disabled
            x = (this.containerWidth - this.element.offsetWidth) / 2;
        }

        // Apply transforms
        this.element.style.transform = `translate(${x}px, ${y}px) rotate(${this.calculateRotation(time)}deg) scale(${this.calculateScale(time)})`;
    }
} 