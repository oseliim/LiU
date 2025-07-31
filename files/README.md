# LiU Web LTSP Installer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux-blue)
![Status](https://img.shields.io/badge/status-active-brightgreen)

## Overview

**LiU Web LTSP Installer** is a web-based automation tool for setting up and managing an LTSP (Linux Terminal Server Project) environment. It provides a user-friendly web interface and a set of shell scripts to streamline the deployment of network boot environments for thin clients, ideal for educational labs and multi-user setups.

---

## Project Structure

```
LiU/
├── autorun.sh            # Main entry point: runs the full setup
├── files/
│   ├── app_flask/        # Flask web application (UI, API)
│   ├── *.sh              # Shell scripts for automation
│   ├── pxelinux.cfg/     # PXE boot configuration
│   ├── tmp/              # Temporary data (network, users, packages)
│   ├── windows/          # Windows-related scripts
│   └── ...
└── ...
```

---

## Quick Start

### 1. Prerequisites
- Ubuntu Server (recommended)
- Root privileges (required for system configuration)

### 2. Installation & Usage

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/LiU.git
   cd LiU
   ```
2. **Run the main setup script:**
   ```bash
   sudo bash autorun.sh
   ```
   This script will orchestrate the full setup process, including installing dependencies, configuring the network, and launching the web interface.

3. **Access the Web Interface:**
   - Open your browser and go to `http://localhost:5000` (or the server's IP address).
   - Follow the step-by-step wizard to:
     1. Install base packages
     2. Configure network
     3. Create client image (choose desktop, apps, autologin)
     4. Add users
     5. Review summary
     6. Apply configuration
     7. Finish setup

---

## How It Works

- **autorun.sh**: The main entry point. It prepares the environment, installs dependencies, and launches the Flask web application.
- **Web UI (Flask)**: Guides you through each configuration step via a modern web interface.
- **Shell Scripts**: Handle all system-level operations (LTSP setup, network, users, PXE, etc.).
- **Live Feedback**: Progress and logs are streamed to the web interface in real time.

---

## Main Components

- **autorun.sh**: Orchestrates the entire setup process.
- **files/app_flask/**: Flask web application (UI and backend API).
- **files/*.sh**: Shell scripts for LTSP, network, user, and PXE configuration.
- **files/pxelinux.cfg/**: PXE boot configuration files.
- **files/tmp/**: Temporary files for network, user, and package data.
- **files/windows/**: Scripts for Windows integration (if needed).

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- [LTSP Project](https://ltsp.org/)
- [Flask](https://flask.palletsprojects.com/)
- [Bootstrap](https://getbootstrap.com/)

---

## Screenshots

> _Add screenshots of the web interface here for better presentation._

---

## Contact

For questions or support, please open an issue on GitHub.
