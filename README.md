# DID: Decast Frontend

A Vue.js-based frontend for managing **Decentralized Identifiers (DIDs)** in the [Decast](https://decast.live) platform. This application provides a streamlined interface for generating and restoring cryptographic keys, selecting and registering DIDs, securely logging in, and viewing detailed response histories. It currently uses a **mock backend for testing** and is designed for smooth integration with a real backend API.

---

## 🚀 Features

- 🔐 **Key Management**  
  Generate, restore, encrypt, and backup Ed25519 key pairs locally using AES encryption.
  
- 🆔 **DID Selection**  
  View and manage all stored DIDs with searchable lists and metadata like creation date.

- 📝 **DID Registration**  
  Register a DID with backend verification to prevent duplicates.

- 🔑 **Login with DID**  
  Authenticate by signing a backend-issued challenge and viewing token + expiry info.

- 📜 **Response History**  
  View a complete log of actions (generate, register, login) with timestamps and status indicators.

- 💡 **User-Friendly Flow**  
  Tabbed UI with intuitive navigation, onboarding modal for new users, and keyboard support.

- 🛡️ **Security First**  
  Private keys never leave the browser — they're AES-encrypted in `localStorage` and downloadable for backup.

- 🧪 **Mock Backend**  
  Local simulation of key registration and login flows for development/testing.

---

## 📁 Project Structure


```
did-decast/
├── public/
│ └── index.html
├── src/
│ ├── assets/
│ ├── components/
│ │ ├── KeyManager.vue # Key pair generation & backup
│ │ ├── DidSelector.vue # DID search & selection
│ │ ├── Register.vue # Register DID
│ │ ├── Login.vue # Login with DID signature
│ │ ├── ResponseDisplay.vue # Logs of previous actions
│ ├── mockBackend.js # Simulated backend logic
│ ├── views/ # Routed pages per feature
│ ├── App.vue # Root layout with nav
│ ├── main.js # Entry point
│ └── style.css # Global styles
├── router/
│ └── index.js # Vue Router setup
├── package.json
├── vite.config.js
└── README.md

```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **A modern web browser**

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/did-decast-frontend.git
   cd did-decast-frontend

```sh
npm install
```

### Compile and Minify for Production

```sh
npm run build
```

## Run the Development Server:
bash

```sh
npm run dev
```

The app will be available at http://localhost:5173 (or the port specified by Vite).

