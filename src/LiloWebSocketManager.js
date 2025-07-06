import { LiloLogger } from './LiloLogger.js';

export class LiloWebSocketManager {
    constructor() {
        this.reconnectInterval = 3 * 1000;
        this.ws = null;
        this.appKey = null;
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

        const server = document.getElementById('websocket_server').value;
        this.logger.info(`Attempting WebSocket connection to ${server}`);
        this.ws = new WebSocket(server);

        this.ws.onopen = () => {
            this.logger.info('WebSocket connection established.');
            this.dispatch('LiloConnected');

            this.getWebsocketStatus();
        };

        this.ws.onclose = (event) => {
            this.logger.warn(`WebSocket closed. Reason: ${event.reason || 'unknown'}`);
            this.dispatch('LiloClosed', { reason: event.reason });

            document.getElementById('trace_status').innerHTML = `no connection to trace server, trying to reconnect to ${server}`;
            document.getElementById('websocket_status').innerHTML = 'Connection closed to server';

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

            document.getElementById('trace_status').innerHTML = 'lost connection, an error occurred';
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
                    document.getElementById('websocket_status').innerHTML = text;
                    this.logger.info(`Status update received: ${text}`);
                    break;

                case 110:
                    document.getElementById('websocket_status').innerHTML = text;
                    document.getElementById('rs232_device').value = data.data.device;
                    document.getElementById('rs232_baudrate').value = data.data.baudrate;
                    document.getElementById('output_folder').value = data.data.output_folder;
                    document.getElementById('license_type').innerHTML = data.data.license.type;
                    document.getElementById('license_is_premium').innerHTML = data.data.license.is_premium;
                    document.getElementById('license_is_valid').innerHTML = data.data.license.is_valid;
                    document.getElementById('license_app_key').innerHTML = data.data.license.app_key;
                    document.getElementById('license_expire_at').innerHTML = data.data.license.expire_at;
                    this.appKey = data.data.license.app_key;

                    this.logger.info('License info updated.');
                    this.dispatch('LiloLicenseReceived', data.data.license);

                    break;

                case 250:
                    document.getElementById('trace_status').innerHTML = text;
                    if (data.data != null) {
                        document.getElementById('trace_uuid').value = data.data.uuid;
                        const oma = data.data.oma;
                        document.getElementById('oma').innerHTML = oma;
                        document.getElementById('oma_param').innerHTML = JSON.stringify(data, null, 2);
                        document.getElementById('current_trace').dataset.base64 = this.encodeBase64Unicode(oma);

                        /**
                        if (data.data.shape) {
                            document.getElementById("right_path").setAttribute("d", data.data.shape.right);
                            document.getElementById("left_path").setAttribute("d", data.data.shape.left);
                        }
                        */

                        if (data.data.url) {
                            document.getElementById('trace_share').innerHTML = `<a href="${data.data.url}">Download or share trace</a>`;
                        }

                        this.logger.info('Trace data updated with OMA and shape.');
                        this.dispatch('LiloTraceDone', data.data);
                    }
                    break;

                case 260:
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
                    document.getElementById('trace_status').innerHTML = text;
                    this.logger.warn(`Warning received: ${text}`);
                    break;

                case 570:
                    document.getElementById('trace_status').innerHTML = text;
                    document.getElementById('devices').value = JSON.stringify(data.data, null, 2);

                    this.logger.info('Device list received and updated.');
                    this.dispatch('LiloDevicesReceived', data.data);

                    break;

                default:
                    this.logger.info('Received unhandled message code:', code);
                    break;
            }
        };
    }

    websocketSend(type, data = null) {
        const msg = JSON.stringify({ type, data });
        this.logger.debug(`Sending WebSocket message: ${msg}`);
        this.ws.send(msg);
    }

    getWebsocketStatus() {
        this.logger.info('Requesting WebSocket status...');
        this.websocketSend('status');
    }

    restartTrace() {
        this.logger.info('Restarting trace...');
        this.websocketSend('restart');
    }

    getDemoTrace() {
        this.logger.info('Requesting demo trace...');
        this.websocketSend('demo');
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
        document.getElementById('websocket_server').value = input;
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

        document.getElementById('websocket_server').value = server;
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

}
