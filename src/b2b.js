//var server = 'ws://localhost:55002';
var server = 'wss://www.clubmaster.dk:55002';
var reconnectInterval = 3*1000; // 3 seconds

var ws = null;

function connect()
{
    if (ws !== null) {
        return;
    }

    ws = new WebSocket(server);

    ws.onopen = (event) => {
        websocketSend('message', 'Im ready whenever you are!');

        document.getElementById('websocket_status').innerHTML = 'Connected to server';
    };

    ws.onclose = (event) => {
        document.getElementById('trace_status').innerHTML = 'no connection to trace server, trying to reconnect to '+server;
        document.getElementById('websocket_status').innerHTML = 'Connection closed to server';

        console.log('connection to server lost');

        setTimeout(function() {
            ws = null;
            connect();
        }, reconnectInterval);
    };

    ws.onerror = (event) => {
        document.getElementById('trace_status').innerHTML = 'lost connection, an error occur';
        console.log('error occur');

        ws.close();
    };

    ws.onmessage = (event) => {
        var data = JSON.parse(event.data);
        console.log(data);

        switch (data.code) {
            case 100:
                // websocket connected
                break;

            case 110:
            case 120:
            case 130:
            case 260:
            case 1100:
            case 1200:
                var text = data.code+' | '+data.message;
                document.getElementById('trace_status').innerHTML = text;

                break;

            case 300:
                document.getElementById('b2b').innerHTML = data.data;

                break;

            case 250:
                var text = data.code+' | '+data.message;
                document.getElementById('trace_status').innerHTML = text;

                if (data.data != null) {
                    var oma = data.data.oma;
                    oma = oma.replaceAll('\r\n', '<br>');

                    document.getElementById('oma').innerHTML = oma;

                    var info = data.data.info;

                    document.getElementById('right_hbox').innerHTML = info.right.hbox;
                    document.getElementById('right_vbox').innerHTML = info.right.vbox;
                    document.getElementById('right_diameter').innerHTML = info.right.diameter;
                    document.getElementById('right_ztilt').innerHTML = info.right.ztilt;
                    document.getElementById('right_fcrv').innerHTML = info.right.fcrv;
                    document.getElementById('right_circ').innerHTML = info.right.circ;

                    document.getElementById('left_hbox').innerHTML = info.left.hbox;
                    document.getElementById('left_vbox').innerHTML = info.left.vbox;
                    document.getElementById('left_diameter').innerHTML = info.left.diameter;
                    document.getElementById('left_ztilt').innerHTML = info.left.ztilt;
                    document.getElementById('left_fcrv').innerHTML = info.left.fcrv;
                    document.getElementById('left_circ').innerHTML = info.left.circ;

                    document.getElementById('dbl').innerHTML = info.dbl;
                    document.getElementById('radii').innerHTML = info.trace.radii;

                    document.getElementById("right_path").setAttribute("d", data.data.shape.right);
                    document.getElementById("left_path").setAttribute("d", data.data.shape.left);

                    document.getElementById('order_dbl').value = info.dbl;

                    if (info.right.hbox) {
                        document.getElementById('order_hbox').value = info.right.hbox;
                        document.getElementById('order_vbox').value = info.right.vbox;
                    } else {
                        document.getElementById('order_hbox').value = info.left.hbox;
                        document.getElementById('order_vbox').value = info.left.vbox;
                    }
                }

                break;
        }
    };
}

function websocketSend(type, data = null)
{
    ws.send(JSON.stringify({
        type: type,
        data: data,
    }));
}

function getB2BXML()
{
    var param = {
        right: {
            lens: document.getElementById('order_right_lens').value,
            coating: document.getElementById('order_right_coating').value,
            diameter: document.getElementById('order_right_diameter').value,
            sphere: document.getElementById('order_right_sphere').value,
            cylinder: document.getElementById('order_right_cylinder').value,
            axis: document.getElementById('order_right_axis').value,
            addition: document.getElementById('order_right_addition').value,
            pd: document.getElementById('order_right_pd').value,
            height: document.getElementById('order_right_height').value,
        },
        left: {
            lens: document.getElementById('order_left_lens').value,
            coating: document.getElementById('order_left_coating').value,
            diameter: document.getElementById('order_left_diameter').value,
            sphere: document.getElementById('order_left_sphere').value,
            cylinder: document.getElementById('order_left_cylinder').value,
            axis: document.getElementById('order_left_axis').value,
            addition: document.getElementById('order_left_addition').value,
            pd: document.getElementById('order_left_pd').value,
            height: document.getElementById('order_left_height').value,
        },
        reference: document.getElementById('order_reference').value,
        edging: document.getElementById('order_edging').value,
        hbox: document.getElementById('order_hbox').value,
        vbox: document.getElementById('order_vbox').value,
        dbl: document.getElementById('order_dbl').value,
        oma: document.getElementById('oma').value,
    }

    websocketSend('b2b-order', param);
}

function startWebsocket()
{
    connect();
}

function restartTrace()
{
    websocketSend('restart');
}

function getDemoTrace()
{
    websocketSend('demo');
}

function resendTrace()
{
    websocketSend('resend');
}

function updateSettings()
{
    websocketSend('rs232-update', {
        device: document.getElementById('rs232_device').value,
        baudrate: document.getElementById('rs232_baudrate').value,
    });
}
