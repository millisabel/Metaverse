import { deepMergeOptions } from '../utils/utils';
import { SINGLE_GLOW_DEFAULT_OPTIONS } from '../components/three/singleGlow';
import { GLOWS_DEFAULT_OPTIONS } from '../components/three/glow';

/**
 * Собирает итоговые опции для блика с учётом приоритетов:
 * индивидуальные → локальные дефолты → глобальные дефолты
 */
export function getFinalGlowOptions(individual = {}, localDefaults = {}, userOptions = {}) {
    // userOptions — то, что приходит извне (например, this.options.glow)
    // localDefaults — дефолты для конкретного класса (например, Dynamics3D)
    // individual — индивидуальные опции для блика (если есть)

    // Сначала объединяем глобальные и локальные дефолты
    const group = deepMergeOptions(GLOWS_DEFAULT_OPTIONS, localDefaults);
    // Затем объединяем с пользовательскими опциями
    const groupWithUser = deepMergeOptions(group, userOptions);
    // Очищаем от групповых опций
    const cleanGroup = stripGroupOptions(groupWithUser);

    // Теперь делаем deepMergeOptions по структуре SINGLE_GLOW_DEFAULT_OPTIONS
    return deepMergeOptions(
        Object.keys(SINGLE_GLOW_DEFAULT_OPTIONS),
        individual,
        cleanGroup,
        SINGLE_GLOW_DEFAULT_OPTIONS
    );
}

/**
 * @description Applies the randomized pulse options
 * @param {Object} shaderOptions - The shader options
 * @returns {void}
 */
function applyRandomizedPulseOptions(shaderOptions) {
    const pulse = shaderOptions.pulse;
    if (!pulse) return;
    // Speed
    if (pulse.speed && typeof pulse.speed === 'object') {
        const min = pulse.speed.min ?? 0.1;
        const max = pulse.speed.max ?? 0.5;
        pulse.speed = Math.random() * (max - min) + min;
    }
    // Intensity
    if (pulse.intensity && typeof pulse.intensity === 'object') {
        const min = pulse.intensity.min ?? 1;
        const max = pulse.intensity.max ?? 3;
        pulse.intensity = Math.random() * (max - min) + min;
    }
}

/**
 * @description Strips the group options
 * @param {Object} options - The options
 * @returns {Object} The stripped options
 */
function stripGroupOptions(options) {
    const {
        count,
        individualOptions,
        shuffleColors,
        colorPalette,
        ...rest
    } = options;

    return rest;
}

function getOptionValue(key, individual, group, def) {
    // Только для shaderOptions — вложенный объект
    if (key === 'shaderOptions') {
        return deepMergeOptions(
            Object.keys(def.shaderOptions),
            individual && individual.shaderOptions ? individual.shaderOptions : {},
            group && group.shaderOptions ? group.shaderOptions : {},
            def.shaderOptions
        );
    }
    if (individual && individual[key] !== undefined) return individual[key];
    if (group && group[key] !== undefined) return group[key];
    return def[key];
}

// Color

/**
 * @description Extended function for selecting a color by priority for a glow
 * @param {number} index - The index
 * @param {Object} shaderIndividual - The shader individual
 * @param {Object} individual - The individual
 * @param {Object} group - The group
 * @param {Object} classDefaults - The class defaults
 * @param {Object} singleDefaults - The single defaults
 * @param {Array} palette - The palette
 * @returns {string|number} The resolved color
 */
export function resolveGlowColor(index, shaderIndividual, individual, group, classDefaults, singleDefaults, palette) {
    if (shaderIndividual && shaderIndividual.color) return shaderIndividual.color;
    if (individual && individual.color) return individual.color;
    if (group && group.shaderOptions && group.shaderOptions.color) return group.shaderOptions.color;
    if (group && group.color) return group.color;
    if (palette && palette.length) return palette[index % palette.length];
    if (classDefaults && classDefaults.shaderOptions && classDefaults.shaderOptions.color) return classDefaults.shaderOptions.color;
    if (classDefaults && classDefaults.color) return classDefaults.color;
    if (singleDefaults && singleDefaults.shaderOptions && singleDefaults.shaderOptions.color) return singleDefaults.shaderOptions.color;
    if (singleDefaults && singleDefaults.color) return singleDefaults.color;
    return 0xffffff;
}

// Positioning

/**
 * @description Resolves the glow positioning mode
 * @param {Object} options - The options
 * @returns {Object} The resolved positioning mode
 */
export function resolvePositioningMode(options) {
    let positioning = options.positioning || {};

    if (!positioning.mode) {
        if (positioning.targetSelector) {
            positioning.mode = 'element';
        } else if (options.position) {
            positioning.mode = 'fixed';
        } else {
            positioning.mode = 'random';
        }
    }
    return positioning;
}

/** 
 * @description Resolves the glow position based on positioning mode
 * @param {Object} options - The options
 * @param {number} index - The index
 * @returns {Object} The resolved position
 */
export function resolveGlowPosition(options, index, glowCount) {
    const mode = options.positioning?.mode;
    
    if (mode === 'element' && !options.positioning.container) {
        console.warn('Container is required for element positioning, falling back to random');
        return getRandomGlowPosition(options, index, glowCount);
    }
    
    let position;
    switch (mode) {
        case 'fixed':
            position = { ...options.position };
            break;
            
        case 'random':
            position = getRandomGlowPosition(options, index, glowCount);
            break;
            
        case 'element':
            position = getPositionByElement(options);
            break;
            
        default:
            console.warn(`Unknown positioning mode: ${mode}, falling back to random`);
            position = getRandomGlowPosition(options, index, glowCount);
    }

    return position;
}

/**
 * @description Gets the random glow position
 * @param {Object} options - The options
 * @param {number} index - The index
 * @returns {Object} The random glow position
 */
export function getRandomGlowPosition(options, index, glowCount) {
    if (Array.isArray(options.initialPositions) && options.initialPositions.length > 0) {
        return { ...options.initialPositions[index % options.initialPositions.length] };
    }

    const movement = options.movement || {};
    const range = movement.range || {};
    
    const xRange = range.x || 0;
    const yRange = range.y || 0;
    const zRange = range.z || 0;
    const zEnabled = movement.zEnabled !== false;

    const totalGlows = glowCount || 12; 
    
    const progress = index / totalGlows; 
    const angle = progress * Math.PI * 4; 
    const radius = progress * 0.8; 
    
    const x = Math.cos(angle) * radius * xRange;
    const y = Math.sin(angle) * radius * yRange;
    
    const z = zEnabled ? Math.sin(angle * 2) * zRange : 0;

    const position = { x, y, z };
    
    return position;
}

/**
 * @description Gets the position by element
 * @param {Object} options - The options
 * @returns {Object} The position by element
 */
export function getPositionByElement(options) {
    const targetSelector = options.positioning.targetSelector;
    const container = options.positioning.container;
    const align = options.positioning.align || 'center center';
    const offset = options.positioning.offset || { x: 0, y: 0 };

    const el = document.querySelector(targetSelector);

    if (!el) {
        console.warn('Element not found:', targetSelector);
        return { x: 0, y: 0 };
    }

    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const [vertical = 'center', horizontal = 'center'] = align.split(' ');

    let x, y;

    switch (horizontal) {
        case 'left':
            x = rect.left;
            break;
        case 'right':
            x = rect.left + rect.width;
            break;
        default: 
            x = rect.left + (rect.width / 2);
    }

    switch (vertical) {
        case 'top':
            y = rect.top;
            break;
        case 'bottom':
            y = rect.top + rect.height;
            break;
        default: 
            y = rect.top + (rect.height / 2);
    }

    x += offset.x || 0;
    y += offset.y || 0;


    x = ((x - containerRect.left) / containerRect.width) * 2 - 1;
    y = -((y - containerRect.top) / containerRect.height) * 2 + 1;


    return { x, y };
}
