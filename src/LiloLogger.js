export class LiloLogger {
    constructor(config = {}) {
        // Default enabled levels
        this.levels = {
            info: true,
            warn: true,
            error: true,
            debug: true,
            trace: true,
            ...config.levels // Allow custom override
        };
    }

    enableLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.levels[level] = true;
        }
    }

    disableLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.levels[level] = false;
        }
    }

    setLevels(config) {
        for (const [key, value] of Object.entries(config)) {
            if (this.levels.hasOwnProperty(key)) {
                this.levels[key] = value;
            }
        }
    }

    info(...args) {
        if (this.levels.info) console.info('[INFO]', ...args);
    }

    warn(...args) {
        if (this.levels.warn) console.warn('[WARN]', ...args);
    }

    error(...args) {
        if (this.levels.error) console.error('[ERROR]', ...args);
    }

    debug(...args) {
        if (this.levels.debug) console.debug('[DEBUG]', ...args);
    }

    trace(...args) {
        if (this.levels.trace) console.info('[TRACE]', ...args);
    }

    log(...args) {
        this.info(...args); // Alias to info
    }
}

