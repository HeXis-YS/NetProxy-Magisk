<p align="center">
  <img src="image/logo.png" alt="NetProxy Logo" width="120" />
</p>

<h1 align="center">NetProxy</h1>

<p align="center">
  <strong>Android System-Level Xray Transparent Proxy Module</strong><br>
  Supports TPROXY, UDP, IPv6, Per-App Proxy, and Routing Management
</p>

<p align="center">
  <a href="https://github.com/Fanju6/NetProxy-Magisk/releases">
    <img src="https://img.shields.io/github/v/release/Fanju6/NetProxy-Magisk?style=flat-square&label=Release&color=blue" alt="Latest Release" />
  </a>
  <a href="https://github.com/Fanju6/NetProxy-Magisk/releases">
    <img src="https://img.shields.io/github/downloads/Fanju6/NetProxy-Magisk/total?style=flat-square&color=green" alt="Downloads" />
  </a>
  <img src="https://img.shields.io/badge/Xray-Core-blueviolet?style=flat-square" alt="Xray Core" />
</p>

<p align="center">
  <a href="README_ZH.md">中文</a> | English
</p>

---

## Features

| Feature | Description |
|------|------|
| **WebUI Management** | Material Design 3 modern interface with Monet theming support |
| **Transparent Proxy** | Supports TPROXY / REDIRECT modes, full TCP + UDP interception |
| **Per-App Proxy** | Blacklist / Whitelist mode for precise proxy control |
| **Routing Rules** | Custom domain, IP, port and other routing rules |
| **DNS Settings** | Custom DNS servers and static Hosts mapping |
| **Hotspot Sharing** | Proxy WiFi hotspot and USB tethering traffic |
| **Hot Switch** | Switch nodes without restarting the service |

---

## Screenshots

<div align="center">
  <img src="image/Screenshot1.jpg" width="24%" alt="Status Page" />
  <img src="image/Screenshot2.jpg" width="24%" alt="Node Management" />
  <img src="image/Screenshot3.jpg" width="24%" alt="App Control" />
  <img src="image/Screenshot4.jpg" width="24%" alt="Settings" />
</div>

---

## Installation

1. Download the latest ZIP from [Releases](https://github.com/Fanju6/NetProxy-Magisk/releases)
2. Flash the module in **Magisk / KernelSU / APatch**
3. Reboot your device
4. Open the WebUI from your module manager to configure

---

## Directory Structure

```
/data/adb/modules/netproxy/
├── bin/                      # Xray binary
├── config/
│   ├── xray/
│   │   └── configs/          # Complete Xray JSON configs
│   ├── tproxy/
│   │   └── tproxy.conf       # Transparent proxy configuration
│   └── module.conf           # Module settings (autostart, etc.)
├── logs/                     # Runtime logs
├── scripts/                  # Start and stop scripts
├── webroot/                  # WebUI static resources
└── service.sh                # Module entry point
```

---

## Quick Start

### Manual Configuration

Create a complete Xray JSON config file in the `xray/configs` directory:

```json
{
  "inbounds": [],
  "outbounds": [
    {
      "tag": "proxy",
      "protocol": "vless",
      "settings": { ... }
    }
  ],
  "routing": {
    "rules": []
  }
}
```



## Community

<p align="center">
  <a href="https://t.me/NetProxy_Magisk">
    <img src="https://img.shields.io/badge/Telegram-Join%20Group-blue?style=for-the-badge&logo=telegram" alt="Telegram Group" />
  </a>
</p>

---

## Contributing

Contributions are welcome!

- Submit Issues to report bugs
- Suggest new features
- Submit Pull Requests
- Star the project to show support!

---

## Acknowledgments

This project is built upon the following excellent open-source projects:

| Project | Description |
|------|------|
| [Xray-core](https://github.com/XTLS/Xray-core) | Core proxy engine with VLESS, XTLS, REALITY protocols |
| [v2rayNG](https://github.com/2dust/v2rayNG) | Node link parsing logic reference |
| [AndroidTProxyShell](https://github.com/CHIZI-0618/AndroidTProxyShell) | Android TProxy implementation reference |
| [KsuWebUIStandalone](https://github.com/KOWX712/KsuWebUIStandalone) | WebUI standalone solution reference |

---

## License

[GPL-3.0 License](LICENSE)


## Star

[![Star History Chart](https://api.star-history.com/svg?repos=Fanju6/NetProxy-Magisk&type=date&legend=top-left)](https://www.star-history.com/#Fanju6/NetProxy-Magisk&type=date&legend=top-left)
