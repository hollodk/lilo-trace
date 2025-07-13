import { LiloWebSocketManager } from './LiloWebSocketManager.js'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const liloWebsocket = new LiloWebSocketManager(liloHostname);
window.liloWebsocket = liloWebsocket;

document.addEventListener('DOMContentLoaded', () => {
    liloWebsocket.init();
});
