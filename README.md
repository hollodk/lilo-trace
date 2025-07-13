# LiloTrace SDK

**LiloTrace** is a smart SDK designed for optician software. It integrates with hardware tracing machines to pull OMA files and communicates with the [LiloConnect API](https://www.liloconnect.com) to generate a wide range of SVG visualizations, including technical and stylized lenses.

This SDK comes with multiple examples demonstrating integration with both **Clubmaster-Tracer** and **Lilo-API**.

👉 For full API integration documentation, visit: [https://www.liloconnect.com:55003/api/doc](https://www.liloconnect.com:55003/api/doc)

👉 This control panel is used to operate your **Clubmaster-Tracer** installable module.

---

## 🚀 Features

* 🧠 **Smart SDK for Opticians**
* 🔌 **Machine Integration** with OMA-compatible tracers
* 🖼️ **SVG Visualization** of lens shapes, both technical and styled
* ⚙️ **Configurable Tracing Gateway** with support for many devices
* 🌐 **WebSocket Communication** with the LiloTrace daemon
* 🎛️ **AlpineJS Control Panel** for real-time monitoring
* 📦 **Supports serial, TCP/IP, USB and file input**

---

## 🔧 Technologies Used

* JavaScript (ES6+)
* [Alpine.js](https://alpinejs.dev/)
* WebSocket
* Bootstrap (optional)
* Node.js backend (LiloTrace server)

---

## 📁 Project Structure

```
📦 lilotrace
├── src/
│   ├── main.js                # Initializes WebSocket and UI
│   ├── LiloWebSocketManager.js # Core integration layer
│   ├── LiloLogger.js          # Custom debug logger
├── index.html                # Control panel and demo UI
├── README.md
```

---

## 🧩 Core Modules

### `LiloWebSocketManager`

Manages all WebSocket logic for communicating with the LiloTrace backend:

* Handles connection/reconnection
* Sends config updates
* Requests traces and demo data
* Transforms OMA to SVG/JSON
* Provides visual themes and rendering logic

### `LiloLogger`

Custom console logger with log levels and formatting.

### `index.html`

Demo UI for controlling trace operations and rendering lens shapes with a full dashboard.

---

## 🖥️ UI Overview

The Alpine.js-based dashboard includes:

* **Trace Controls**: Start, stop, resend, normalize, get JSON
* **License Management**
* **Live SVG Visualization**
* **System Status Panel**
* **Configuration** (Serial + Gateway settings)
* **Configurator Tool** for prescription simulation
* **Showcase** of themed frames

---

## 🔌 Supported Tracers

Out-of-the-box support for many industry-standard tracers including:

* Nidek
* Hoya
* Essilor
* WECO
* Takubomatic
* Briot
* National Optronics

And more via the Gateway mode with flexible protocol, baudrate, and connection settings.

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/your-org/lilotrace.git
cd lilotrace
```

Install dependencies (if applicable):

```bash
npm install
```

Run the control panel (if using a local server):

```bash
npm run dev
```

---

## 🔗 LiloConnect API

Used to transform OMA base64 data into:

* SVG visualization (`/api/oma/svg`)
* Technical JSON format (`/api/oma/json`)
* Demo traces (`/api/oma/demo`)

### Example: Get SVG

```js
const svg = await liloWebsocket.getOmaSvg({
  oma: { base64 },
  dimension: { width: 1000 },
  type: 'technical',
  theme: liloWebsocket.getTheme('blue')
});
```

---

## ✅ License Activation

License is required to use advanced features.

* Add your key via the UI or use `updateLicense(key)` method

---

## 💡 Use Cases

* Smart optician software
* Visualizing and simulating lenses
* Digital trace integration into POS or ERP systems
* Lens thickness estimations
* Configurable client-side product previews

---

## 🪪 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🧪 Want to contribute?

Pull requests welcome. Please open an issue before large changes to align on vision.

---

## 📬 Contact

For commercial support, integration help, or licensing:

* Email: [hello@liloconnect.com](mailto:support@liloconnect.com)
* Website: [https://www.liloconnect.com](https://www.liloconnect.com)

