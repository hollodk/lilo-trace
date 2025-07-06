import { LiloLogger } from './LiloLogger.js';

export class LiloWebSocketManager {
    constructor() {
        this.reconnectInterval = 3*1000; // 3 seconds
        this.ws = null;
        this.appKey = null;
        this.logger = new LiloLogger();
    }

    init() {
        this.setServer();
        this.connect();
    }

    connect()
    {
        if (this.ws !== null) return;

        var server = document.getElementById('websocket_server').value;
        this.ws = new WebSocket(server);

        this.ws.onopen = (event) => {
            this.getWebsocketStatus();
        };

        this.ws.onclose = (event) => {
            document.getElementById('trace_status').innerHTML = 'no connection to trace server, trying to reconnect to '+server;
            document.getElementById('websocket_status').innerHTML = 'Connection closed to server';

            this.ws = null;

            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        };

        this.ws.onerror = (event) => {
            document.getElementById('trace_status').innerHTML = 'lost connection, an error occur';
            this.logger.error('error occur');

            this.ws.close();
        };

        this.ws.onmessage = (event) => {
            var data = JSON.parse(event.data);
            this.logger.trace(data);

            switch (data.code) {
                case 100:
                case 105:
                    var text = data.code+' | '+data.message;
                    document.getElementById('websocket_status').innerHTML = text;
                    break;

                case 110:
                    var text = data.code+' | '+data.message;
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

                    break;

                case 250:
                    var text = data.code+' | '+data.message;
                    document.getElementById('trace_status').innerHTML = text;

                    if (data.data != null) {
                        document.getElementById('trace_uuid').value = data.data.uuid;

                        var oma = data.data.oma;
                        document.getElementById('oma').innerHTML = oma;
                        document.getElementById('oma_param').innerHTML = JSON.stringify(data, null, 2);

                        if (data.data.shape) {
                            document.getElementById("right_path").setAttribute("d", data.data.shape.right);
                            document.getElementById("left_path").setAttribute("d", data.data.shape.left);
                        }

                        if (data.data.url) {
                            document.getElementById('trace_share').innerHTML = '<a href="'+data.data.url+'">Download or share trace</a>';
                        }
                    }

                    break;

                case 260:
                    var text = data.code+' | '+data.message;
                    document.getElementById('trace_status').innerHTML = text;
                    break;

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
                    var text = data.code+' | '+data.message;
                    document.getElementById('trace_status').innerHTML = text;
                    break;

                case 570:
                    var text = data.code+' | '+data.message;
                    document.getElementById('trace_status').innerHTML = text;
                    document.getElementById('devices').value = JSON.stringify(data.data, null, 2);

                    break;

                default:
                    this.logger.info('might be others :)');
                    break;
            }
        };
    }

    setServer()
    {
        // this is just for demo purpose

        var q = window.location.search;
        var type = new URLSearchParams(q).get('type');

        if (type == 'demo') {
            document.getElementById('websocket_server').value = 'wss://www.liloconnect.com:55002';
        } else {
            document.getElementById('websocket_server').value = 'ws://localhost:55002';
        }
    }

    websocketSend(type, data = null)
    {
        this.ws.send(JSON.stringify({
            type: type,
            data: data,
        }));
    }

    getWebsocketStatus()
    {
        this.websocketSend('status');
    }

    restartTrace()
    {
        this.websocketSend('restart');
    }

    getDemoTrace()
    {
        this.websocketSend('demo');
    }

    resendTrace()
    {
        this.websocketSend('resend');
    }

    updateSettings()
    {
        this.websocketSend('update', {
            device: document.getElementById('rs232_device').value,
            baudrate: document.getElementById('rs232_baudrate').value,
            output_folder: document.getElementById('output_folder').value,
        });
    }

    updateWebsocket()
    {
        this.ws.close();
    }

    setTraceName()
    {
        var tags = document.getElementById('trace_tags').value;

        var tagList = [];
        if (tags.length > 0) {
            tagList = tags.split(/,/);
        }

        var data = {
            app_key: this.appKey,
            trace: document.getElementById('trace_uuid').value,
            name: document.getElementById('trace_name').value,
            tags: tagList,
        }

        var url = 'https://my.liloconnect.com/api/trace/update';
        var opt = {
            method: 'POST',
            body: JSON.stringify(data),
        }

        fetch (url, opt)
            .then((response) => response.json())
            .then((data) => {
                this.logger.trace(data);
            })
            .catch ((error) => {
                this.logger.error(error);
            })
        ;
    }

    connectTo(input)
    {
        document.getElementById('websocket_server').value = input;

        if (this.ws) {
            this.ws.close();
        }
    }

    downloadOMA()
    {
        var oma = document.getElementById('oma').innerHTML;

        if (oma.length > 0) {
            const link = document.createElement("a");
            const file = new Blob([oma], { type: 'text/plain' });
            link.href = URL.createObjectURL(file);

            link.download = "trace.txt";
            link.click();
            URL.revokeObjectURL(link.href);
        } else {
            alert('no traces has been made yet, if you want to test, click the Get Demo OMA first.');
        }
    }
}
