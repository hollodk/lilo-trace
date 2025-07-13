import { LiloWebSocketManager } from './LiloWebSocketManager.js'
import { LiloApi } from './LiloApi.js'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const liloWebsocket = new LiloWebSocketManager(liloHostname);
window.liloWebsocket = liloWebsocket;

const liloApi = new LiloApi();
window.liloApi = liloApi;

document.addEventListener('DOMContentLoaded', () => {
    liloWebsocket.init();
});
