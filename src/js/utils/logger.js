class Logger {
    static colors = {
        'Glow': '#ff69b4',         // розовый
        'Constellation': '#4169e1', // синий
        'GalacticCloud': '#32cd32', // зеленый
        'Stars': '#ffa500',        // оранжевый
        'Controller': '#9370db',   // пурпурный
        'AnimationController': '#9370db', // тот же пурпурный
        'default': '#808080'       // серый
    };

    static getColor(name) {
        return this.colors[name] || this.colors.default;
    }

    static formatMessage(name, message) {
        // Убираем [name] из сообщения, если оно там есть
        const cleanMessage = message.replace(/^\[.*?\]\s*/, '');
        return `%c[${name}]%c ${cleanMessage}`;
    }

    static getStyles(name) {
        const color = this.getColor(name);
        return [
            `color: ${color}; font-weight: bold;`,
            'color: inherit;'
        ];
    }

    static log(name = 'System', message, type = 'info') {
        const formattedMessage = this.formatMessage(name, message);
        const styles = this.getStyles(name);

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
    log(message, type = 'info') {
        Logger.log(name, message, type);
    }
});
