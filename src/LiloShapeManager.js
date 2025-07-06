export class LiloShapeManager {
    addListeners() {
        window.addEventListener('LiloTraceDone', this.traceDone.bind(this));
        window.addEventListener('LiloTraceNormalized', this.traceNormalized.bind(this));
    }

    init() {
        let items = document.querySelectorAll('.oma-svg');

        for (let i = 0; i < items.length; i++) {
            let e = items[i].parentNode;

            this.drawElement(e);
        }
    }

    drawElement(element, width = 100) {
        console.log('Draw element');

        const height = width * 0.4;
        const oma = atob(element.dataset.base64);
        const r = this.drawshape(oma, width, height);

        const div = document.createElement('div');
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('width', width + 'px');
        svg.setAttribute('height', height + 'px');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        // Lens gradient
        const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        gradient.setAttribute('id', 'gradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#e0f7ff');

        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#b8e4f9');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);

        // Glow filter
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "glow");

        const feGaussian = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
        feGaussian.setAttribute("in", "SourceGraphic");
        feGaussian.setAttribute("stdDeviation", "0.6");
        filter.appendChild(feGaussian);
        defs.appendChild(filter);

        svg.appendChild(defs);

        // Helper to create lens group with sparkle
        const createLens = (pathData, sparkleId) => {
            const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

            // Base lens
            const lens = document.createElementNS("http://www.w3.org/2000/svg", "path");
            lens.setAttribute("d", pathData);
            lens.setAttribute("stroke", "#333");
            lens.setAttribute("stroke-width", "1");
            lens.setAttribute("fill", "url(#gradient)");
            lens.setAttribute("filter", "url(#glow)");

            // Shine overlay
            const shine = document.createElementNS("http://www.w3.org/2000/svg", "path");
            shine.setAttribute("d", pathData);
            shine.setAttribute("fill", "white");
            shine.setAttribute("opacity", "0.07");

            // Sparkle sweep
            const sparkle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            sparkle.setAttribute("x", "-20");
            sparkle.setAttribute("y", "0");
            sparkle.setAttribute("width", "20");
            sparkle.setAttribute("height", height);
            sparkle.setAttribute("fill", "white");
            sparkle.setAttribute("opacity", "0.1");
            sparkle.setAttribute("rx", "10");

            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
            animate.setAttribute("attributeName", "transform");
            animate.setAttribute("type", "translate");
            animate.setAttribute("from", "-20 0");
            animate.setAttribute("to", `${width} 0`);
            animate.setAttribute("dur", "2s");
            animate.setAttribute("repeatCount", "indefinite");
            sparkle.appendChild(animate);

            group.appendChild(lens);
            group.appendChild(shine);
            group.appendChild(sparkle);

            return group;
        };

        svg.appendChild(createLens(r.left, 'left'));
        svg.appendChild(createLens(r.right, 'right'));

        div.appendChild(svg);
        element.innerHTML = div.innerHTML;
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

        /*
        trace = this.getLastTrace();
        document.getElementById('trace-oma').value = trace.oma;

        this.showTrace(trace);

        if (trace.uuid !== 'demo') {
            setTimeout(() => {
                getWebsocketNormalize();
            }, 500);
        }
        */

        const current = document.getElementById('current_trace');
        this.drawElement(current, 600);
    }

    traceNormalized(event) {
        const message = event.detail.message;
        console.log('Received event:', message);
        // You can perform any actions or logic based on the event here

        trace = this.getLastTrace();
        document.getElementById('trace-oma').value = trace.oma;

        this.showTrace(trace);
    }

    drawshape(oma, canvasWidth = 100, canvasHeight = 40) {
        const radiiR = [];
        const radiiL = [];
        let dataR = "", dataL = "";
        let side = "R", count = 1, phistep = 0.1, phi = 0.0;
        let dbl = 0.0;

        let lines = oma.split(/\r\n|\n|\r/);

        for (let line of lines) {
            const parts = line.split("=");
            if (parts.length !== 2) continue;

            const values = parts[1].split(";");

            switch (parts[0]) {
                case "TRCFMT":
                    side = values[3];
                    count = parseInt(values[1]);
                    phistep = (Math.PI * 2) / count;
                    phi = 0.0;
                    break;

                case "R":
                    for (let radval of values) {
                        const rad = parseFloat(radval);
                        const obj = {
                            rad: rad,
                            x: -Math.cos(phi) * rad,
                            y: -Math.sin(phi) * rad
                        };
                        phi += phistep;
                        if (side === "R") radiiR.push(obj);
                        else if (side === "L") radiiL.push(obj);
                    }
                    break;

                case "DBL":
                    dbl = parseFloat(values[0]); // millimeters
                    break;
            }
        }

        if (radiiR.length === 0 && radiiL.length === 0) {
            return { right: '', left: '' };
        }

        // Compute bounding box of both sides
        const allPoints = [...radiiR, ...radiiL];
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        for (const pt of allPoints) {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
        }

        const shapeWidth = maxX - minX + dbl * 100; // extend width by DBL (scaled)
        const shapeHeight = maxY - minY;
        const scaleX = canvasWidth / shapeWidth;
        const scaleY = canvasHeight / shapeHeight;
        const scale = Math.min(scaleX, scaleY) * 0.9;

        const offsetX = canvasWidth / 2;
        const offsetY = canvasHeight / 2;

        const centerX = (maxX + minX) / 2;
        const centerY = (maxY + minY) / 2;

        //const halfBridge = (dbl * 100 * scale) / 2+(canvasWidth/6);
        const halfBridge = (canvasWidth/4);

        for (let i = 0; i < radiiR.length; i++) {
            const x = (radiiR[i].x - centerX) * scale + offsetX + halfBridge;
            const y = (radiiR[i].y - centerY) * scale + offsetY;
            dataR += (i === 0 ? "M" : "L") + x + " " + y + " ";
        }

        for (let i = 0; i < radiiL.length; i++) {
            const x = (radiiL[i].x - centerX) * scale + offsetX - halfBridge;
            const y = (radiiL[i].y - centerY) * scale + offsetY;
            dataL += (i === 0 ? "M" : "L") + x + " " + y + " ";
        }

        dataR += "z";
        dataL += "z";

        return {
            right: dataR,
            left: dataL
        };
    }

}
