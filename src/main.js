import { LiloWebSocketManager } from './websocket.js'
import { LiloShapeManager } from './shape.js'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const liloWebsocket = new LiloWebSocketManager();
const liloShape = new LiloShapeManager();

window.liloWebsocket = liloWebsocket;
window.liloShape = liloShape;

liloWebsocket.init();
liloShape.addListeners();
liloShape.init();
