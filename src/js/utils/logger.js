import AnimationObserverCSS from "./animationObserver_CSS";

class Logger {
    static colors = {
        'Glow': '#ff69b4',         // розовый
        'Constellation': '#4169e1', // синий
        'GalacticCloud': '#32cd32', // зеленый
        'Stars': '#ffa500',        // оранжевый
        'Controller': '#9370db',   // пурпурный
        'AnimationController': '#9370db', // тот же пурпурный
        'Roadmap': '#ff4500',      // красный
        'Navbar': '#00bfff',       // синий
        'Modal': '#ff1493',        // ярко-розовый
        'Slider': '#00fa9a',       // светло-зеленый
        'SocialCards': '#ff6347',  // томатный
        'Dynamics3D': '#8a2be2',   // синий-фиолетовый
        'AnimationObserverCSS': '#e2d32b', // синий-фиолетовый
        'default': '#808080'       // серый
    };

    static getColor(name) {
        return this.colors[name] || this.colors.default;
    }

    static formatMessage(name, message, options = {}) {
        const cleanMessage = message.replace(/^\[.*?]\s*/, '');
        if (options.background) {
            return [
                `%c[${name}]%c ${cleanMessage}`,
                `color: ${this.getColor(name)}; font-weight: bold;`,
                `background-color: ${options.background}; color: ${options.color || 'white'}; padding: 2px 5px; border-radius: 3px;`
            ];
        }
        return [
            `%c[${name}]%c ${cleanMessage}`,
            `color: ${this.getColor(name)}; font-weight: bold;`,
            'color: inherit;'
        ];
    }

    static getStyles(name) {
        const color = this.getColor(name);
        return [
            `color: ${color}; font-weight: bold;`,
            'color: inherit;'
        ];
    }

    static log(name = 'System', message, type = 'info', options = {}) {
        const [formattedMessage, ...styles] = this.formatMessage(name, message, options);

        switch (type) {
            case 'error':
                console.error(formattedMessage, ...styles);
                break;
            case 'warn':
                console.warn(formattedMessage, ...styles);
                break;
            default:
                console.log(formattedMessage, ...styles);
        }
    }
}

export const createLogger = (name = 'System') => ({
    log(message, type = 'info', options = {}) {
        Logger.log(name, message, type, options);
    }
});
