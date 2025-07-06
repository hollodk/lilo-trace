export class LiloShapeManager {
    addListeners() {
        window.addEventListener('LiloTraceDone', this.traceDone.bind(this));
        window.addEventListener('LiloTraceSvg', this.drawElement.bind(this));
        window.addEventListener('LiloTraceNormalized', this.traceNormalized.bind(this));
    }

    init() {
        /**
        let items = document.querySelectorAll('.oma-svg');

        for (let i = 0; i < items.length; i++) {
            let e = items[i].parentNode;

            this.drawElement(e);
        }
        */
    }

    drawElement(data) {
        console.log('Draw element');

        const element = document.getElementById(data.detail.target_id);
        element.innerHTML = data.detail.svg;
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

        const id = 'current_trace';
        const current = document.getElementById(id);

        const oma = current.dataset.base64;

        liloWebsocket.getTraceSvg({
            id: id,
            base64: oma,
            width: 900,
        });
    }

    traceNormalized(event) {
        const message = event.detail.message;
        console.log('Received event:', message);
        // You can perform any actions or logic based on the event here

        trace = this.getLastTrace();
        document.getElementById('trace-oma').value = trace.oma;

        this.showTrace(trace);
    }
}
