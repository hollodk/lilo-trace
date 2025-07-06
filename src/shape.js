export class LiloShapeManager {
    addListeners() {
        document.addEventListener('liloTraceDone', this.traceDone);
        document.addEventListener('liloTraceNormalized', this.traceNormalized);
    }

    init() {
        let items = document.querySelectorAll('.oma-svg');

        for (let i = 0; i < items.length; i++) {
            let e = items[i].parentNode;

            let oma = atob(items[i].dataset.base64);
            let r = drawshape(oma, 160);

            items[i].remove();

            let div = document.createElement('div');
            let svg = document.createElement('svg');
            svg.setAttribute('width', '100px');
            svg.setAttribute('height', '40px');

            let defs = document.createElement('defs');
            let gradient = document.createElement('linearGradient');
            gradient.setAttribute('id', 'gradient');

            let stop1 = document.createElement('stop');
            stop1.setAttribute('offset', '5%');
            stop1.setAttribute('stop-color', '#cbe9f2');

            let stop2 = document.createElement('stop');
            stop2.setAttribute('offset', '95%');
            stop2.setAttribute('stop-color', '#add8e6');

            gradient.appendChild(stop1);
            gradient.appendChild(stop2);

            defs.appendChild(gradient);

            svg.appendChild(defs);

            div.appendChild(svg);

            let pathRight = document.createElement('path');
            pathRight.setAttribute('style', 'stroke:#333333');
            pathRight.setAttribute('stroke-width', '1');
            pathRight.setAttribute('fill', 'url(#gradient)');
            pathRight.setAttribute('d', r.right);

            let pathLeft = document.createElement('path');
            pathLeft.setAttribute('style', 'stroke:#333333');
            pathLeft.setAttribute('stroke-width', '1');
            pathLeft.setAttribute('fill', 'url(#gradient)');
            pathLeft.setAttribute('d', r.left);

            svg.appendChild(pathRight);
            svg.appendChild(pathLeft);

            e.innerHTML = div.innerHTML;
        }
    }

    showTrace(trace)
    {
        document.getElementById('info-dbl').innerHTML = trace.info.dbl;

        document.getElementById('info-right-circ').innerHTML = trace.info.right.circ;
        document.getElementById('info-left-circ').innerHTML = trace.info.left.circ;

        document.getElementById('info-right-diameter').innerHTML = trace.info.right.diameter;
        document.getElementById('info-left-diameter').innerHTML = trace.info.left.diameter;

        document.getElementById('info-right-fcrv').innerHTML = trace.info.right.fcrv;
        document.getElementById('info-left-fcrv').innerHTML = trace.info.left.fcrv;

        document.getElementById('info-right-hbox').innerHTML = trace.info.right.hbox;
        document.getElementById('info-left-hbox').innerHTML = trace.info.left.hbox;

        document.getElementById('info-right-vbox').innerHTML = trace.info.right.vbox;
        document.getElementById('info-left-vbox').innerHTML = trace.info.left.vbox;

        document.getElementById('info-right-ztilt').innerHTML = trace.info.right.ztilt;
        document.getElementById('info-left-ztilt').innerHTML = trace.info.left.ztilt;

        document.getElementById('right-eye').setAttribute("d", trace.shape.right);
        document.getElementById('left-eye').setAttribute("d", trace.shape.left);

        options = {
        }

        var modal = new bootstrap.Modal(document.getElementById('trace-modal'), options)
        modal.toggle();
    }

    traceDone(event) {
        const message = event.detail.message;
        console.log('Received event:', message);
        // You can perform any actions or logic based on the event here

        trace = getLastTrace();
        document.getElementById('trace-oma').value = trace.oma;

        this.showTrace(trace);

        if (trace.uuid !== 'demo') {
            setTimeout(() => {
                getWebsocketNormalize();
            }, 500);
        }
    }

    traceNormalized(event) {
        const message = event.detail.message;
        console.log('Received event:', message);
        // You can perform any actions or logic based on the event here

        trace = getLastTrace();
        document.getElementById('trace-oma').value = trace.oma;

        this.showTrace(trace);
    }

    drawshape(oma, factor = 160)
    {
        var r = '';

        var radiiR = [];
        var radiiL = [];
        var dataR = "";
        var dataL = "";
        var side = "R";
        var count = 1;
        var phistep = 0.1;
        var maxxR = 0.0;
        var minxR = 0.0;
        var maxxL = 0.0;
        var minxL = 0.0;
        var dbl = 0.0;
        var hbox = 0.0;
        var vbox = 0.0;
        var sides = "B";

        var lines = oma.split('\r\n');

        if (lines.length < 5) {
            lines = oma.split('\n');

            if (lines.length < 5) {
                lines = oma.split('\r');
            }
        }

        for (var actline in lines) {
            var parts = lines[actline].split("=");
            if (parts.length == 2) {
                var values = parts[1].split(";");
                switch (parts[0]) {
                    case "TRCFMT" :
                        side = values[3];
                        count = values[1];
                        phistep = Math.PI * 2 / count;
                        phi = 0.0;
                        break;
                    case "R" :
                        var obj = {rad: 0, x: 0, y: 0 };
                        for (var radval in values) {
                            phi += phistep;
                            obj.rad = values[radval];
                            obj.x = -Math.cos(phi) * obj.rad;
                            obj.y = -Math.sin(phi) * obj.rad;
                            switch (side) {
                                case "R" : radiiR.push(obj);
                                    if (obj.x > maxxR) maxxR = obj.x;
                                    if (obj.x < minxR) minxR = obj.x;
                                    break;
                                case "L" : radiiL.push(obj);
                                    if (obj.x > maxxL) maxxL = obj.x;
                                    if (obj.x < minxL) minxL = obj.x;
                                    break;
                            }
                        }
                        break;
                    case "DBL" :
                        dbl = parseFloat(values[0]);
                        break;
                    case "VBOX" :
                        vbox = values[0];
                        break;
                    case "HBOX" :
                        hbox = values[0];
                        break;
                    case "_TRCSIDE":
                        sides = values[0];
                        break;
                }
            }
        }

        var fpd = ((maxxR-minxR)+(maxxL-minxL)) / 2 + dbl * 100;
        var i=0;

        var numbX = factor/6;
        var numbY = factor/8;

        for (var actrad in radiiR) {
            dataR += ((i==0)?"M":"L") + ((radiiR[actrad].x+fpd) / factor + numbX) + " " + (radiiR[actrad].y / factor + numbY) + " ";
            i++;
        }
        i=0;
        for (var actrad in radiiL) {
            dataL += ((i==0)?"M":"L") + (radiiL[actrad].x / factor + numbX) + " " + (radiiL[actrad].y / factor + numbY) + " ";
            i++;
        }
        dataR += " z";
        dataL += " z";

        return {
            right: dataR,
            left: dataL,
        }
    }
}
