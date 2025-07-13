import { LiloLogger } from './LiloLogger.js';

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

export class LiloWebSocketManager {
    constructor(hostname) {
        this.hostname = hostname;
        this.reconnectInterval = 3 * 1000;
        this.ws = null;
        this.appKey = null;
        this.apiUrl = 'https://www.liloconnect.com:55003/api';
        this.themeColor = 'blue';
        this.logger = new LiloLogger({
            levels: {
                info: true,
                warn: true,
                error: true,
                debug: true,
                trace: false
            }
        });
    }

    init() {
        this.logger.info('Initializing WebSocket Manager...');
        this.dispatch('LiloInit');

        this.setServer();
        this.connect();
    }

    connect() {
        if (this.ws !== null) {
            this.logger.warn('WebSocket already connected, skipping.');
            return;
        }

        this.logger.info(`Attempting WebSocket connection to ${this.hostname}`);
        this.ws = new WebSocket(this.hostname);

        this.ws.onopen = () => {
            this.logger.info('WebSocket connection established.');
            this.dispatch('LiloConnected');

            this.getWebsocketStatus();
        };

        this.ws.onclose = (event) => {
            this.logger.warn(`WebSocket closed. Reason: ${event.reason || 'unknown'}`);
            this.dispatch('LiloClosed', { reason: event.reason });

            this.dispatch('LiloTraceStatus', `no connection to trace server, trying to reconnect to ${this.hostname}`);
            this.dispatch('LiloWebsocketStatus', 'Connection closed to server');

            this.ws = null;
            setTimeout(() => {
                this.logger.info('Reconnecting to WebSocket...');
                this.dispatch('LiloReconnect');

                this.connect();
            }, this.reconnectInterval);
        };

        this.ws.onerror = (event) => {
            this.logger.error('WebSocket error occurred', event);
            this.dispatch('LiloError', { event });

            this.dispatch('LiloTraceClosed', 'lost connection, an error occurred');
            this.ws.close();
        };

        this.ws.onmessage = ({ data }) => this.handleMessage(data);
    }

    handleMessage(raw) {
        let data = null;

        try {
            data = JSON.parse(raw);
        } catch (e) {
            this.logger.error('Invalid JSON received:', raw);
            return;
        }

        this.logger.debug('Received message:', data);

        const { code, message } = data;
        const text = `${code} | ${message}`;

        switch (code) {
            case 100:
            case 105:
                this.dispatch('LiloWebsocketStatus', text);
                this.logger.info(`Status update received: ${text}`);
                break;

            case 110:
                this.dispatch('LiloTraceConnected', 'LiloTrace is ready');
                this.dispatch('LiloWebsocketStatus', text);

                this.appKey = data.data.license.app_key;

                this.logger.info('License info updated.');
                this.dispatch('LiloLicenseReceived', data.data.license);

                break;

            case 115:
                this.dispatch('LiloSocketStatus', data.data);
                break;

            case 250:   // standard trace
            case 255:   // normalized trace
                this.dispatch('LiloTraceStatus', text);

                if (data.data != null) {

                    this.logger.info('Trace data updated with OMA and shape.');
                    this.dispatch('LiloTraceDone', data.data);
                }
                break;

            case 260:   // no trace
            case 500:
            case 510:
            case 520:
            case 530:
            case 540:
            case 550:
            case 552:
            case 554:
            case 556:
            case 558:
            case 580:
                this.dispatch('LiloTraceStatus', text);
                this.logger.warn(`Warning received: ${text}`);
                break;

            case 570:
                this.dispatch('LiloTraceStatus', text);

                this.dispatch('LiloDevices', data.data);

                this.logger.info('Device list received and updated.');
                this.dispatch('LiloDevicesReceived', data.data);

                break;

            default:
                this.logger.info('Received unhandled message code:', code);
                break;
        }
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

    websocketSend(type, data = null) {
        const msg = JSON.stringify({ type, data });
        this.logger.debug(`Sending WebSocket message: ${msg}`);
        this.ws.send(msg);
    }

    updateConfig(data) {
        this.logger.info('Update configuration...');
        this.websocketSend('config-update', data);
    }

    getWebsocketStatus() {
        this.logger.info('Requesting WebSocket status...');
        this.websocketSend('status');
    }

    liloTraceStart() {
        this.logger.info('Requesting WebSocket start...');
        this.websocketSend('start');
    }

    liloTraceStop() {
        this.logger.info('Requesting WebSocket stop...');
        this.websocketSend('trace-stop');
    }

    requestDemoTrace() {
        this.logger.info('Request demo trace...');
        this.websocketSend('trace-demo');
    }

    liloTraceRestart() {
        this.logger.info('Restarting trace...');
        this.websocketSend('restart');
    }

    resendTrace() {
        this.logger.info('Resending trace...');
        this.websocketSend('resend');
    }

    updateSettings() {
        const payload = {
            device: document.getElementById('rs232_device').value,
            baudrate: document.getElementById('rs232_baudrate').value,
            output_folder: document.getElementById('output_folder').value,
        };
        this.logger.info('Updating settings...', payload);
        this.websocketSend('update', payload);
    }

    updateWebsocket() {
        this.logger.info('Closing WebSocket by user request...');
        this.ws?.close();
    }

    setTraceName() {
        const tags = document.getElementById('trace_tags').value.split(',').map(t => t.trim()).filter(Boolean);
        const data = {
            app_key: this.appKey,
            trace: document.getElementById('trace_uuid').value,
            name: document.getElementById('trace_name').value,
            tags
        };

        this.logger.info('Sending trace name update', data);

        fetch('https://my.liloconnect.com/api/trace/update', {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then(res => res.json())
            .then(json => {
                this.logger.debug('Trace name update response:', json);
            })
            .catch(err => {
                this.logger.error('Failed to update trace name:', err);
            });
    }

    connectTo(input) {
        this.logger.info(`Changing WebSocket server to ${input}`);
        liloSocket = input;

        if (this.ws) {
            this.ws.close();
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

    setServer() {
        const type = new URLSearchParams(window.location.search).get('type');
        const server = type === 'demo'
            ? 'wss://www.liloconnect.com:55002'
            : 'ws://localhost:55002';

        this.hostname = server;
        this.logger.debug(`WebSocket server set to ${this.hostname}`);
    }

    dispatch(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
        this.logger.debug(`Event dispatched: ${eventName}`, detail);
    }

    encodeBase64Unicode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    updateLicense(license) {
        const data = {
            license_key: license,
        }

        this.updateConfig(data);
    }
}

if (typeof window !== 'undefined') {
    window.LiloWebSocketManager = LiloWebSocketManager; // for CDN/global use
}
