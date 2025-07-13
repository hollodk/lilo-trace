import { LiloLogger } from './LiloLogger.js';

/**
 * TODO
 * ====
 *
 * OK > License
 * OK > Showcase with data attributes
 * Showcase with themed colors
 * Logs websocket and trace
 * Buttons
 *  - Start
 *  - Stop
 *  - Restart
 *  - Resend
 *  - Demo
 *  - Normalize
 *  - Get JSON
 *  - Status
 */
export class LiloWebSocketManager {
    constructor() {
        this.reconnectInterval = 3 * 1000;
        this.ws = null;
        this.appKey = null;
        this.apiUrl = 'https://my.liloconnect.com/api';
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

        this.logger.info(`Attempting WebSocket connection to ${liloHostname}`);
        this.ws = new WebSocket(liloHostname);

        this.ws.onopen = () => {
            this.logger.info('WebSocket connection established.');
            this.dispatch('LiloConnected');

            this.getWebsocketStatus();
        };

        this.ws.onclose = (event) => {
            this.logger.warn(`WebSocket closed. Reason: ${event.reason || 'unknown'}`);
            this.dispatch('LiloClosed', { reason: event.reason });

            const server = liloHostname;

            //document.getElementById('trace_status').innerHTML = `no connection to trace server, trying to reconnect to ${server}`;
            //document.getElementById('websocket_status').innerHTML = 'Connection closed to server';
            this.dispatch('LiloTraceStatus', `no connection to trace server, trying to reconnect to ${server}`);
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

            //document.getElementById('trace_status').innerHTML = 'lost connection, an error occurred';
            this.dispatch('LiloTraceClosed', 'lost connection, an error occurred');
            this.ws.close();
        };

        this.ws.onmessage = (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                this.logger.error('Invalid JSON received:', event.data);
                return;
            }

            this.logger.debug('Received message:', data);

            const { code, message } = data;
            const text = `${code} | ${message}`;

            switch (code) {
                case 100:
                case 105:
                    //document.getElementById('websocket_status').innerHTML = text;
                    this.dispatch('LiloWebsocketStatus', text);
                    this.logger.info(`Status update received: ${text}`);
                    break;

                case 110:
                    //document.getElementById('websocket_status').innerHTML = text;
                    this.dispatch('LiloTraceConnected', 'LiloTrace is ready');
                    this.dispatch('LiloWebsocketStatus', text);

                    /*
                    document.getElementById('rs232_device').value = data.data.device;
                    document.getElementById('rs232_baudrate').value = data.data.baudrate;
                    document.getElementById('output_folder').value = data.data.output_folder;
                    document.getElementById('license_type').innerHTML = data.data.license.type;
                    document.getElementById('license_is_premium').innerHTML = data.data.license.is_premium;
                    document.getElementById('license_is_valid').innerHTML = data.data.license.is_valid;
                    document.getElementById('license_app_key').innerHTML = data.data.license.app_key;
                    document.getElementById('license_expire_at').innerHTML = data.data.license.expire_at;
                    */

                    this.appKey = data.data.license.app_key;

                    this.logger.info('License info updated.');
                    this.dispatch('LiloLicenseReceived', data.data.license);

                    break;

                case 115:
                    this.dispatch('LiloSocketStatus', data.data);
                    break;

                case 250:   // standard trace
                case 255:   // normalized trace
                    //document.getElementById('trace_status').innerHTML = text;
                    this.dispatch('LiloTraceStatus', text);

                    if (data.data != null) {
                        /**
                        document.getElementById('trace_uuid').value = data.data.uuid;
                        const oma = data.data.oma;
                        document.getElementById('oma').innerHTML = oma;
                        document.getElementById('oma_param').innerHTML = JSON.stringify(data, null, 2);
                        document.getElementById('current_trace').dataset.base64 = this.encodeBase64Unicode(oma);

                        //this.setTechnicalFrame(data.data.oma_base64, 'current_trace');
                        this.setFrame(data.data.oma_base64, 'current_trace');

                        if (data.data.url) {
                            document.getElementById('trace_share').innerHTML = `<a href="${data.data.url}">Download or share trace</a>`;
                        }
                        */

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
                    //document.getElementById('trace_status').innerHTML = text;
                    this.dispatch('LiloTraceStatus', text);
                    this.logger.warn(`Warning received: ${text}`);
                    break;

                case 570:
                    //document.getElementById('trace_status').innerHTML = text;
                    this.dispatch('LiloTraceStatus', text);

                    //document.getElementById('devices').value = JSON.stringify(data.data, null, 2);
                    this.dispatch('LiloDevices', data.data);

                    this.logger.info('Device list received and updated.');
                    this.dispatch('LiloDevicesReceived', data.data);

                    break;

                default:
                    this.logger.info('Received unhandled message code:', code);
                    break;
            }
        };
    }

    async getJson(base64) {
        try {
            const url = 'http://localhost:3000/api/oma/json';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oma: {
                        base64: base64,
                    },
                }),
            })
            ;

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            return json;

        } catch (error) {
            console.log('Error requesting API');
        }
    }

    getTheme(themeColor = 'blue') {
        let start = '#e0f7ff';
        let stop = '#a1d4ff';
        let mirror = false;
        let rotation = 'right';

        switch (themeColor) {
            case 'yellow':
                start = '#fffde0';
                stop = '#fff380';
                break;

            case 'orange':
                start = '#fff2e0';
                stop = '#ffb980';
                break;

            case 'red':
                start = '#ffe0e0';
                stop = '#ffa3a3';
                break;

            case 'green':
                start = '#e0ffe0';
                stop = '#adffa3';
                break;

            case 'teal':
                start = '#e0fffa';
                stop = '#80ffe5';
                break;

            case 'blue':
                start = '#e0f7ff';
                stop = '#a1d4ff';
                break;

            case 'purple':
                start = '#fbe0ff';
                stop = '#ffa3f8';
                break;

            case 'brown':
                start = '#f5e9dd';
                stop = '#d2a679';
                break;

            case 'grey':
                start = '#f0f0f0';
                stop = '#b0b0b0';
                break;

            case 'mirror-blue':
                start = '#003366';
                stop = '#66ccff';
                mirror = true;
                break;

            case 'mirror-silver':
                start = '#999999';
                stop = '#e0e0e0	';
                mirror = true;
                break;

            case 'mirror-teal':
                start = '#004d4d';
                stop = '#80ffe5';
                mirror = true;
                break;

            case 'mirror-purple':
                start = '#3d0075';
                stop = '#cc99ff';
                mirror = true;
                break;

            case 'mirror-rosegold':
                start = '#b76e79';
                stop = '#ffe5e0';
                mirror = true;
                break;

            case 'mirror-ice':
                start = '#88e0ef';
                stop = '#dff9fb';
                mirror = true;
                break;

        }

        const theme = {
            uncut: {
                fill: '#f0faff', // light blue
                stroke: '#999', // grey
                width: 2,
            },
            text: {
                size: '16px',
                color: '#333',
            },
            path: {
                width: 1,
                stroke: '#333',
            },
            lens: {
                gradient: {
                    start: start,
                    stop: stop,
                    rotation: rotation,
                },
                mirror: mirror,
            },
            optical_center: {
                radius: 20,
                stroke: 'green',
            },
            theme: themeColor,
        };

        return theme;
    }

    renderFrame(targetId) {
        const element = document.getElementById(targetId);

        const width = element.dataset.width;
        const type = element.dataset.type;
        const base64 = element.dataset.base64;
        const theme = element.dataset.theme;

        if (type == 'face') {
            this.setFrameFace(targetId, base64, width, theme);
        } else {
            this.setFrame(targetId, base64, width, type, theme);
        }
    }

    setFrame(targetId, base64, width, type, theme = 'blue') {
        const url = 'http://localhost:3000/api/oma/svg';

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

        this.attachFrame(targetId, url, param);
    }

    setFrameFace(targetId, base64, width, theme = 'blue') {
        const url = 'http://localhost:3000/api/oma/svg-face';

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
            type: 'simple',
            theme: this.getTheme(theme),
        };

        this.attachFrame(targetId, url, param);
    }

    attachFrame(targetId, url, param) {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(param),
        })
            .then(res => res.json())
            .then(json => {
                const element = document.getElementById(targetId);
                element.innerHTML = json.result;
            })
            .catch(error => {
                console.error(error);
            });
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

    async getDemoTrace() {
        try {
            this.logger.info('Requesting demo trace...');

            const url = 'http://localhost:3000/api/oma/demo';
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();
            return json.result;

        } catch (error) {
            console.log(error);
            console.log('Error requesting API');
        }
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

        liloHostname = server;
        this.logger.debug(`WebSocket server set to ${server}`);
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
