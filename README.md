<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a1a2e,50:16213e,100:0f3460&height=200&section=header&text=Facebook%20SSL%20Pinning%20Bypass&fontSize=38&fontColor=e94560&animation=fadeIn&fontAlignY=38&desc=Complete%20Mobile%20Security%20Research%20Lab&descAlignY=60&descSize=18&descColor=a8b2d8" width="100%"/>

<br/>

[![Stars](https://img.shields.io/github/stars/algoanhaf/facebook-ssl-pinning-bypass?style=for-the-badge&logo=github&color=e94560&labelColor=1a1a2e)](https://github.com/algoanhaf/facebook-ssl-pinning-bypass/stargazers)
[![Forks](https://img.shields.io/github/forks/algoanhaf/facebook-ssl-pinning-bypass?style=for-the-badge&logo=github&color=0f3460&labelColor=1a1a2e)](https://github.com/algoanhaf/facebook-ssl-pinning-bypass/network/members)
[![License](https://img.shields.io/github/license/algoanhaf/facebook-ssl-pinning-bypass?style=for-the-badge&color=16213e&labelColor=1a1a2e)](LICENSE)
[![Issues](https://img.shields.io/github/issues/algoanhaf/facebook-ssl-pinning-bypass?style=for-the-badge&color=e94560&labelColor=1a1a2e)](https://github.com/algoanhaf/facebook-ssl-pinning-bypass/issues)
[![Last Commit](https://img.shields.io/github/last-commit/algoanhaf/facebook-ssl-pinning-bypass?style=for-the-badge&color=0f3460&labelColor=1a1a2e)](https://github.com/algoanhaf/facebook-ssl-pinning-bypass/commits)

<br/>

[![Frida](https://img.shields.io/badge/Frida-16.5.9-brightgreen?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6Ii8+PC9zdmc+&labelColor=1a1a2e)](https://frida.re)
[![Python](https://img.shields.io/badge/Python-3.8+-blue?style=flat-square&logo=python&logoColor=white&labelColor=1a1a2e)](https://python.org)
[![Android](https://img.shields.io/badge/Android-9.0%2B-3ddc84?style=flat-square&logo=android&logoColor=white&labelColor=1a1a2e)](https://developer.android.com)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey?style=flat-square&logo=linux&logoColor=white&labelColor=1a1a2e)](https://github.com/algoanhaf/facebook-ssl-pinning-bypass)
[![Educational](https://img.shields.io/badge/Purpose-Educational%20Only-orange?style=flat-square&logo=bookstack&logoColor=white&labelColor=1a1a2e)](https://github.com/algoanhaf/facebook-ssl-pinning-bypass)

<br/>

> **⚠️ DISCLAIMER:** This repository is strictly for **educational and authorized security research**. Only test on devices and accounts you own. Unauthorized interception of traffic is illegal.

</div>

---

## 🎯 What You'll Learn

<table>
<tr>
<td align="center" width="200">
<br/>
🔐<br/><b>SSL/TLS Pinning</b><br/>Theory & Implementation
</td>
<td align="center" width="200">
🛠️<br/><br/><b>Frida & Objection</b><br/>Dynamic Instrumentation
</td>
<td align="center" width="200">
🕵️<br/><br/><b>Traffic Interception</b><br/>mitmproxy & Burp Suite
</td>
<td align="center" width="200">
🧠<br/><br/><b>Advanced Hooks</b><br/>Custom Frida Scripts
</td>
<td align="center" width="200">
⚖️<br/><br/><b>Ethics & Law</b><br/>Responsible Research
</td>
</tr>
</table>

---

## 📚 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [📖 Lesson Plan](#-lesson-plan)
- [📂 Repository Structure](#-repository-structure)
- [🔧 Scripts Reference](#-scripts-reference)
- [💡 How SSL Pinning Works](#-how-ssl-pinning-works)
- [🧪 Lab Setup](#-lab-setup)
- [⚠️ Legal & Ethics](#️-legal--ethics)
- [🤝 Contributing](#-contributing)
- [⭐ Support This Project](#-support-this-project)

---

## 🚀 Quick Start

**Step 1 — Clone the repository**

```bash
git clone https://github.com/algoanhaf/facebook-ssl-pinning-bypass.git
cd facebook-ssl-pinning-bypass
```

**Step 2 — Run the automated setup** (creates the virtual environment, installs every tool, and pushes a matching `frida-server`)

```bash
./setup.sh
source ssl-lab/bin/activate
```

**Step 3 — Start frida-server on your device**

```bash
adb shell su -c "/data/local/tmp/frida-server &"
```

**Step 4 — Run the bypass**

```bash
python run.py com.facebook.katana --script all
```

That's it. Open the app, log in, and watch the traffic in mitmproxy. Full detail lives in [Lesson 3](lessons/03_walkthrough.md).

---

## 📖 Lesson Plan

<table>
<thead>
<tr>
<th align="center">Lesson</th>
<th>Topic</th>
<th>What You Learn</th>
<th align="center">Level</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center"><a href="lessons/01_setup.md"><b>01</b></a></td>
<td>🛠️ <b>Environment Setup</b></td>
<td>ADB, Python, Frida, Objection, mitmproxy, Android emulator configuration</td>
<td align="center">🟢 Beginner</td>
</tr>
<tr>
<td align="center"><a href="lessons/02_concepts.md"><b>02</b></a></td>
<td>🔐 <b>SSL/TLS Concepts</b></td>
<td>Certificate vs public key pinning, how Facebook implements it, why proxies fail</td>
<td align="center">🟡 Intermediate</td>
</tr>
<tr>
<td align="center"><a href="lessons/03_walkthrough.md"><b>03</b></a></td>
<td>🔬 <b>Tool Walkthrough</b></td>
<td>Objection one-liner, raw Frida scripting, mitmproxy traffic inspection</td>
<td align="center">🟡 Intermediate</td>
</tr>
<tr>
<td align="center"><a href="lessons/04_advanced.md"><b>04</b></a></td>
<td>🧠 <b>Advanced Techniques</b></td>
<td>Writing custom hooks, CT bypass, anti-Frida detection, APK patching concepts</td>
<td align="center">🔴 Advanced</td>
</tr>
<tr>
<td align="center"><a href="lessons/05_ethics.md"><b>05</b></a></td>
<td>⚖️ <b>Ethics & Legal</b></td>
<td>Legal boundaries, lab rules, responsible disclosure, bug bounty programs</td>
<td align="center">🟢 All Levels</td>
</tr>
</tbody>
</table>

---

## 📂 Repository Structure

```
📁 facebook-ssl-pinning-bypass/
│
├── 📁 lessons/
│   ├── 📄 01_setup.md          ← Environment setup (ADB, Frida, emulator)
│   ├── 📄 02_concepts.md       ← SSL/TLS pinning theory
│   ├── 📄 03_walkthrough.md    ← Step-by-step bypass walkthrough
│   ├── 📄 04_advanced.md       ← Advanced hooking techniques
│   └── 📄 05_ethics.md         ← Ethics, law & responsible disclosure
│
├── 📁 scripts/
│   ├── 📜 ssl_bypass_all.js    ← ★ Start here — comprehensive bypass
│   ├── 📜 ssl_bypass_basic.js  ← Hook Android TrustManager
│   └── 📜 ssl_bypass_okhttp.js ← Hook OkHttp3 CertificatePinner
│
├── 📁 .github/                 ← Issue & PR templates
├── 🐍 run.py                   ← Spawns the app and injects a script
├── ⚙️ setup.sh                 ← One-command lab bootstrap
├── 📋 requirements.txt         ← Pinned Python dependencies
├── 🔒 SECURITY.md              ← Responsible disclosure policy
├── 🤝 CONTRIBUTING.md          ← Contribution guidelines
├── 📄 README.md
└── 📄 LICENSE
```

---

## 🔧 Scripts Reference

<details>
<summary><b>📜 ssl_bypass_all.js</b> — Recommended starting script</summary>

The comprehensive bypass script. Hooks all major pinning layers:

| Hook | Target | What It Does |
|------|--------|-------------|
| 1 | `javax.net.ssl.SSLContext.init()` | Replaces TrustManager with permissive version |
| 2 | `HttpsURLConnection.setDefaultHostnameVerifier()` | Accepts all hostnames |
| 3 | `okhttp3.CertificatePinner.check()` | Bypasses OkHttp3 pin check |
| 4 | `com.squareup.okhttp.CertificatePinner` | Bypasses OkHttp2 pin check |
| 5 | `NetworkSecurityTrustManager.checkPins()` | Bypasses Android 7+ NSC pins |
| 6 | `Conscrypt TrustManagerImpl` | Bypasses deep SSL provider check |
| 7 | Dynamic class enumeration | Auto-discovers anonymous TrustManager classes |

```bash
python run.py com.facebook.katana --script all
```

</details>

<details>
<summary><b>📜 ssl_bypass_basic.js</b> — TrustManager hooks</summary>

Targets the standard Java SSL stack. Good for apps that don't use OkHttp.

```bash
python run.py <package_name> --script basic
```

</details>

<details>
<summary><b>📜 ssl_bypass_okhttp.js</b> — OkHttp-specific hooks</summary>

Targets OkHttp2 and OkHttp3 CertificatePinner plus Conscrypt internals.

```bash
python run.py <package_name> --script okhttp
```

</details>

---

## 💡 How SSL Pinning Works

```
Without Pinning:              With Pinning (Facebook):
┌──────────┐                  ┌──────────┐
│  App     │                  │  App     │
│          │                  │          │
│ ✅ Is cert│                  │ ✅ Is cert│  ← CA validation (same)
│ signed   │                  │ signed   │
│ by a     │                  │ by a     │
│ trusted  │                  │ trusted  │
│ CA?      │                  │ CA?      │
│          │                  │          │
│ ✅ YES   │                  │ ✅ YES   │
│ → ALLOW  │                  │          │
└──────────┘                  │ 🔒 Does  │  ← Pin check (extra step)
                              │ public   │
                              │ key hash │
                              │ match?   │
                              │          │
                              │ ❌ NO    │  ← Burp/mitmproxy cert fails here
                              │ → BLOCK  │
                              └──────────┘
```

**Facebook uses 3 pinning layers:**
1. **OkHttp3 CertificatePinner** — primary, checks SHA-256 of public key
2. **Custom X509TrustManager** — secondary validation layer
3. **Network Security Config** — OS-level pins (Android 7+)

---

## 🧪 Lab Setup

### Prerequisites Checklist

```
[ ] Rooted Android device or emulator (Genymotion / AVD "Google APIs" image)
[ ] Android 9.0 – 12.0 recommended (less aggressive anti-tampering)
[ ] ADB installed and device recognized (adb devices)
[ ] frida-server pushed to /data/local/tmp/ and running
[ ] mitmproxy CA installed in SYSTEM certificate store (not just user store)
[ ] Python 3.8+ with frida==16.5.9, frida-tools, objection, mitmproxy
[ ] Dummy Facebook account (NEVER use your real account)
```

### Verify Your Setup

```bash
adb devices
frida-ps -U | grep facebook
frida --version
objection --version
mitmproxy --version
```

`adb devices` shows your device, `frida-ps -U` confirms the client reaches the server, and `frida --version` must match the `frida-server` version on the device.

### Common Fixes

| Problem | Solution |
|---------|----------|
| `Unable to connect to frida-server` | `adb shell su -c "/data/local/tmp/frida-server &"` |
| App crashes after hook | Use `-f` (spawn) mode, not `-n` (attach) |
| No traffic in mitmproxy | Re-check proxy IP: `adb shell settings get global http_proxy` |
| Frida version mismatch | Re-download `frida-server` to match `pip show frida` version |
| mitmproxy CA not trusted | Push cert to `/system/etc/security/cacerts/` (needs root) |

---

## ⚠️ Legal & Ethics

<table>
<tr>
<th>✅ Legal</th>
<th>❌ Illegal</th>
</tr>
<tr>
<td>
Testing on your own device + dummy account<br/>
Intercepting your own traffic in a private lab<br/>
Reporting vulnerabilities via bug bounty<br/>
Security research on apps you developed<br/>
</td>
<td>
Intercepting someone else's traffic<br/>
Targeting accounts you don't own<br/>
Distributing patched APKs<br/>
Scraping user data without authorization<br/>
</td>
</tr>
</table>

**Three Lab Rules** — confirm all before every session:
1. 📱 The device is **yours**
2. 👤 The account is **yours** (dummy account)
3. 🌐 The network is **yours** (isolated lab network)

**Found a real vulnerability?** Report it responsibly:
- 🐛 Meta Bug Bounty: [hackerone.com/facebook](https://hackerone.com/facebook)
- 📧 Facebook WhiteHat: [facebook.com/whitehat](https://www.facebook.com/whitehat)

---

## 🤝 Contributing

Contributions are welcome! Here's how:

**Step 1 — Fork, then clone your fork**

```bash
git clone https://github.com/<your-username>/facebook-ssl-pinning-bypass.git
```

**Step 2 — Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

**Step 3 — Commit your changes**

```bash
git commit -m "Add: description of your changes"
```

**Step 4 — Push and open a Pull Request**

```bash
git push origin feature/your-feature-name
```

**Ideas for contributions:**
- 📝 Add Frida scripts for other pinning implementations
- 🌍 Translate lessons to other languages
- 🐛 Fix issues or improve explanations
- 📸 Add screenshots / demo GIFs

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

---

## 📊 Learning Path

```
BEGINNER ──────────────────────────────────────► ADVANCED

[Lesson 1]    [Lesson 2]    [Lesson 3]    [Lesson 4]    [Lesson 5]
   │              │              │              │              │
Setup &       SSL/TLS       Objection &    Write your    Ethics &
  Tools       Theory         Frida Lab     own hooks      Law
   │              │              │              │              │
  30m           45m           60m           90m           20m
```

**Total estimated time:** ~4 hours for a complete first run

---

## ⭐ Support This Project

If this repository helped your learning journey:

<div align="center">

**⭐ Star this repository to help others find it!**

[![Star History Chart](https://img.shields.io/github/stars/algoanhaf/facebook-ssl-pinning-bypass?style=social)](https://github.com/algoanhaf/facebook-ssl-pinning-bypass/stargazers)

[![Follow](https://img.shields.io/github/followers/algoanhaf?style=social&label=Follow%20%40algoanhaf)](https://github.com/algoanhaf)

</div>

---

## 📜 License

```
MIT License — Copyright (c) 2026 HADI ANHAF AIMAN

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software,
subject to the conditions in the LICENSE file.

FOR EDUCATIONAL PURPOSES ONLY.
```

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a1a2e,50:16213e,100:0f3460&height=100&section=footer" width="100%"/>

**Made with ❤️ for the Security Research Community**

[![GitHub](https://img.shields.io/badge/GitHub-algoanhaf-1a1a2e?style=for-the-badge&logo=github)](https://github.com/algoanhaf)

*Knowledge shared is knowledge multiplied.*

</div>
