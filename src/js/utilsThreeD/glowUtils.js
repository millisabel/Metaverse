import { deepMergeOptions, shuffleArray } from '../utils/utils';
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

export function getGlowGroupOptions(userOptions = {}) {
    // Глубокий merge дефолтов и пользовательских опций
    const merged = deepMergeOptions(GLOWS_DEFAULT_OPTIONS, userOptions);

    // shuffle colorPalette если нужно
    if (
        (!merged.individualOptions || merged.individualOptions.length === 0) &&
        Array.isArray(merged.colorPalette)
    ) {
        merged.colorPalette = merged.shuffleColors
            ? shuffleArray([...merged.colorPalette])
            : [...merged.colorPalette];
    }

    return merged;
}

/**
 * @description Gets the single glow options
 * @param {Object} baseOptions - The base options
 * @param {Object} individualOptions - The individual options
 * @param {number} index - The index
 * @returns {Object} The single glow options
 */
export function getSingleGlowOptions(baseOptions, individualOptions = {}, index = 0) {
    const defaultOptions = GLOWS_DEFAULT_OPTIONS;
    // Используем deepMergeOptions для корректного объединения всех вложенных опций
    const cleanGroup = stripGroupOptions(deepMergeOptions(defaultOptions, baseOptions));
    const finalOptions = deepMergeOptions(
        Object.keys(SINGLE_GLOW_DEFAULT_OPTIONS),
        individualOptions,
        cleanGroup,
        SINGLE_GLOW_DEFAULT_OPTIONS
    );

    // Корректируем objectOptions.positioning и objectOptions.initialPosition
    finalOptions.objectOptions.positioning = resolvePositioningMode(finalOptions.objectOptions);
    finalOptions.objectOptions.positioning.initialPosition = resolveGlowPosition(finalOptions.objectOptions, index);
    // Корректируем цвет (индивидуальный/групповой)
    finalOptions.shaderOptions.color = resolveGlowColor(
        index,
        individualOptions.shaderOptions || {},
        baseOptions,
        defaultOptions
    );

    // Корректируем pulseControl
    const pulseControl = finalOptions.objectOptions.pulseControl || {};
    const individualPulse = individualOptions.objectOptions?.pulseControl || {};
    finalOptions.objectOptions.pulseControl = {
        enabled: individualPulse.enabled !== undefined ? individualPulse.enabled : pulseControl.enabled,
        randomize: individualPulse.randomize !== undefined ? individualPulse.randomize : pulseControl.randomize
    };

    if (
        finalOptions.objectOptions.pulseControl.randomize &&
        (!individualOptions.shaderOptions || !individualOptions.shaderOptions.pulse)
    ) {
        applyRandomizedPulseOptions(finalOptions.shaderOptions);
    }

    if (typeof window !== 'undefined') {
        console.log('SingleGlow FINAL options:', finalOptions);
    }

    return finalOptions;
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
 * @description Resolves the glow color
 * @param {number} index - The index
 * @param {Object} individual - The individual
 * @param {Object} groupOptions - The group options
 * @param {Object} defaultOptions - The default options
 * @returns {string|number} The resolved color
 */ 
function resolveGlowColor(index, individual, groupOptions, defaultOptions) {
    // 1. Индивидуальный уровень
    if (individual && individual.shaderOptions && individual.shaderOptions.color)
        return individual.shaderOptions.color;
    // 2. Групповой уровень
    if (groupOptions && groupOptions.shaderOptions && groupOptions.shaderOptions.color)
        return groupOptions.shaderOptions.color;
    // 3. Массив цветов (через colorPalette)
    if (Array.isArray(groupOptions.colorPalette)) {
        const colors = groupOptions.shuffleColors
            ? shuffleArray([...groupOptions.colorPalette])
            : [...groupOptions.colorPalette];
        return colors[index % colors.length];
    }
    // 4. Дефолт
    return defaultOptions.shaderOptions.color;
}

/** 
 * @description Resolves the glow position
 * @param {Object} options - The options
 * @param {number} index - The index
 * @returns {Object} The resolved position
 */
function resolveGlowPosition(options, index) {
    if (options.positioning?.mode === 'fixed') {
        return options.position;
    }
    if (options.positioning?.mode === 'random') {
        return getRandomGlowPosition(options, index);
    }
    return undefined;
}

/**
 * @description Resolves the glow positioning mode
 * @param {Object} options - The options
 * @returns {Object} The resolved positioning mode
 */
function resolvePositioningMode(options) {
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

/**
 * @description Gets the random glow position
 * @param {Object} options - The options
 * @param {number} index - The index
 * @returns {Object} The random glow position
 */
function getRandomGlowPosition(options, index) {
    if (Array.isArray(options.initialPositions) && options.initialPositions.length > 0) {
        return options.initialPositions[index % options.initialPositions.length];
    }
    const movement = options.movement || {};
    const xSpread = movement.range?.x || 1;
    const ySpread = movement.range?.y || 1;
    const zRange = movement.range?.z || 0.1;
    const zEnabled = movement.zEnabled !== false;
    const x = (Math.random() - 0.5) * xSpread;
    const y = (Math.random() - 0.5) * ySpread;
    const z = zEnabled ? (Math.random() * 2 - 1) * zRange : 0;
    return { x, y, z };
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

/**
 * @description Формирует массив опций для каждого блика (группового или одиночного)
 * @param {Object} groupOptions - Групповые опции (то, что приходит в Glow)
 * @param {Object} classDefaults - Дефолты класса (например, GLOW_DEFAULT_OPTIONS)
 * @param {Object} singleDefaults - Дефолты одиночного блика (SINGLE_GLOW_DEFAULT_OPTIONS)
 * @returns {Array<Object>} Массив опций для каждого блика
 */
export function getAllSingleGlowOptions(groupOptions, classDefaults, singleDefaults) {
    const individualOptions = Array.isArray(groupOptions.individualOptions) ? groupOptions.individualOptions : [];
    let count = groupOptions.count || 1;
    if (individualOptions.length > count) count = individualOptions.length;
    const palette = Array.isArray(groupOptions.colorPalette) ? [...groupOptions.colorPalette] : [];
    const useShuffle = !!groupOptions.shuffleColors;
    if (palette.length && useShuffle) {
        for (let i = palette.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [palette[i], palette[j]] = [palette[j], palette[i]];
        }
    }
    const result = [];
    for (let i = 0; i < count; i++) {
        const individual = individualOptions[i] || {};
        // Глубокий merge: individual → groupOptions → classDefaults → singleDefaults
        const merged = deepMergeOptions(
            Object.keys(singleDefaults),
            individual,
            groupOptions,
            classDefaults,
            singleDefaults
        );
        // Цвет по приоритету
        merged.shaderOptions = merged.shaderOptions || {};
        merged.shaderOptions.color = resolveGlowColorFull(
            i,
            individual.shaderOptions || {},
            individual,
            groupOptions,
            classDefaults,
            singleDefaults,
            palette
        );
        // Корректируем objectOptions.positioning и objectOptions.initialPosition
        merged.objectOptions.positioning = resolvePositioningMode(merged.objectOptions);
        merged.objectOptions.positioning.initialPosition = resolveGlowPosition(merged.objectOptions, i);
        result.push(merged);
    }
    return result;
}

/**
 * @description Расширенная функция выбора цвета по приоритету для блика
 */
function resolveGlowColorFull(index, shaderIndividual, individual, group, classDefaults, singleDefaults, palette) {
    // 1. Индивидуальный уровень (shaderOptions.color)
    if (shaderIndividual && shaderIndividual.color) return shaderIndividual.color;
    // 2. Индивидуальный уровень (color)
    if (individual && individual.color) return individual.color;
    // 3. Групповой уровень (shaderOptions.color)
    if (group && group.shaderOptions && group.shaderOptions.color) return group.shaderOptions.color;
    // 4. Групповой уровень (color)
    if (group && group.color) return group.color;
    // 5. colorPalette
    if (palette && palette.length) return palette[index % palette.length];
    // 6. classDefaults (shaderOptions.color)
    if (classDefaults && classDefaults.shaderOptions && classDefaults.shaderOptions.color) return classDefaults.shaderOptions.color;
    // 7. classDefaults (color)
    if (classDefaults && classDefaults.color) return classDefaults.color;
    // 8. singleDefaults (shaderOptions.color)
    if (singleDefaults && singleDefaults.shaderOptions && singleDefaults.shaderOptions.color) return singleDefaults.shaderOptions.color;
    // 9. singleDefaults (color)
    if (singleDefaults && singleDefaults.color) return singleDefaults.color;
    // 10. fallback
    return 0xffffff;
}

// Обновлённый deepMergeOptions для поддержки произвольного числа уровней и гарантии структуры singleDefaults
function deepMergeOptions(keys, ...sources) {
    const result = {};
    for (const key of keys) {
        // Собираем значения для этого ключа из всех sources
        const values = sources.map(src => (src && src[key] !== undefined ? src[key] : undefined));
        // Если хотя бы одно значение — объект (и не массив), делаем рекурсивный merge
        if (values.some(v => typeof v === 'object' && v !== null && !Array.isArray(v))) {
            // Собираем все объекты для этого ключа
            const objects = values.map(v => (typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {}));
            // Берём ключи из singleDefaults (последний source)
            const subKeys = Object.keys(objects[objects.length - 1]);
            result[key] = deepMergeOptions(subKeys, ...objects);
        } else {
            // Берём первое определённое значение с конца (приоритет: individual → group → class → default)
            let merged = undefined;
            for (let i = 0; i < values.length; i++) {
                if (values[i] !== undefined) {
                    merged = values[i];
                    break;
                }
            }
            if (merged !== undefined) {
                result[key] = merged;
            }
        }
    }
    return result;
}