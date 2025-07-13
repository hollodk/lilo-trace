/**
 * TODO
 * ====
 *
 * OK > License
 * OK > Showcase with data attributes
 * OK > Showcase with themed colors
 * Logs websocket and trace
 * Buttons
 *  - Start
 *  - Stop
 *  - Restart
 *  - Resend
 *  - OK > Demo
 *  - Normalize
 *  - OK > Get JSON
 *  - Status
 */

const THEME_MAP = {
    yellow: ['#fffde0', '#fff380'],
    orange: ['#fff2e0', '#ffb980'],
    red: ['#ffe0e0', '#ffa3a3'],
    green: ['#e0ffe0', '#adffa3'],
    teal: ['#e0fffa', '#80ffe5'],
    blue: ['#e0f7ff', '#a1d4ff'],
    purple: ['#fbe0ff', '#ffa3f8'],
    brown: ['#f5e9dd', '#d2a679'],
    grey: ['#f0f0f0', '#b0b0b0'],
    'mirror-blue': ['#003366', '#66ccff', true],
    'mirror-silver': ['#999999', '#e0e0e0', true],
    'mirror-teal': ['#004d4d', '#80ffe5', true],
    'mirror-purple': ['#3d0075', '#cc99ff', true],
    'mirror-rosegold': ['#b76e79', '#ffe5e0', true],
    'mirror-ice': ['#88e0ef', '#dff9fb', true],
};

export class LiloApi {
    constructor() {
        this.appKey = null;
        this.apiUrl = 'https://www.liloconnect.com:55003/api';
        this.themeColor = 'blue';
    }

    getTheme(themeColor = 'blue') {
        const [start = '#e0f7ff', stop = '#a1d4ff', mirror = false] = THEME_MAP[themeColor] || [];
        const opacity = mirror ? 1 : 0.9;

        return {
            uncut: { fill: '#f0faff', stroke: '#999', width: 2 },
            text: { size: '16px', color: '#333' },
            path: { width: 1, stroke: '#333' },
            lens: { gradient: { start, stop, rotation: 'right' }, mirror, opacity },
            optical_center: { radius: 20, stroke: 'green' },
            theme: themeColor,
        };
    }

    parseElementDataset(element) {
        return {
            width: element.dataset.width,
            type: element.dataset.type,
            base64: element.dataset.base64,
            theme: element.dataset.theme,
            frame: element.dataset.frame || '#000000',
        };
    }

    renderFrame(targetId) {
        const element = document.getElementById(targetId);
        if (!element) return;

        const { base64, width, type, theme, frame } = this.parseElementDataset(element);
        this.setFrame(targetId, base64, width, type, theme, frame);
    }

    setFrame(targetId, base64, width, type, theme = 'blue', frame = '#000000') {
        if (!base64 || !width) {
            this.logger.warn('Missing base64 or width for frame rendering.');
            return;
        }

        const param = {
            oma: {
                base64: base64,
            },
            dimension: {
                width: width,
            },
            exam: {
                right: {
                    pd: 30,
                },
                left: {
                    pd: 30,
                },
            },
            type: type,
            theme: this.getTheme(theme),
        };

        if (frame) {
            param.theme.path.stroke = frame;
        }

        this.attachFrame(targetId, param);
    }

    async attachFrame(targetId, param) {
        const svg = await this.getOmaSvg(param);

        const element = document.getElementById(targetId);
        element.innerHTML = svg;
    }

    async getJson(oma) {
        const url = this.apiUrl+'/oma/json';

        const param = {
            oma: {
                base64: this.encodeBase64Unicode(oma),
            },
        };

        const json = await this.liloRequest(url, 'POST', param);
        return json;
    }

    async getOmaSvg(param) {
        const url = this.apiUrl+'/oma/svg';

        const json = await this.liloRequest(url, 'POST', param);
        return json.result;
    }

    async getDemoTrace() {
        const url = this.apiUrl+'/oma/demo';

        const json = await this.liloRequest(url);
        return json.result;
    }

    async liloRequest(url, method = 'GET', param = null) {
        try {
            const opts = {
                method,
                headers: { 'Content-Type': 'application/json' },
                ...(param && { body: JSON.stringify(param) }),
            };
            const res = await fetch(url, opts);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
        }
    }

    downloadOMA() {
        const oma = document.getElementById('oma').innerHTML;
        if (!oma) {
            alert('No traces have been made yet. Try clicking "Get Demo OMA" first.');
            this.logger.warn('Tried to download OMA, but no data was available.');
            return;
        }

        const link = document.createElement("a");
        const file = new Blob([oma], { type: 'text/plain' });
        link.href = URL.createObjectURL(file);
        link.download = "trace.txt";
        link.click();
        URL.revokeObjectURL(link.href);

        this.logger.info('OMA file downloaded.');
    }

    encodeBase64Unicode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
}

if (typeof window !== 'undefined') {
    window.LiloApi = LiloApi; // for CDN/global use
}
