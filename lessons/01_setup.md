# Lesson 1 — Environment Setup

## 1.1 Choosing Your Operating System

| OS | Recommendation |
|----|---------------|
| **Linux (Ubuntu/Debian)** | Best — native ADB, no driver headaches, great Python support. |
| **macOS** | Very good — Homebrew makes install painless. |
| **Windows** | Works but requires extra ADB drivers; WSL2 is a good middle ground. |

> **Recommendation:** Ubuntu 22.04 LTS or macOS 13+. All commands below target Linux first, with macOS equivalents where they differ.

---

## 1.2 Tool Overview

| Tool | Role |
|------|------|
| **ADB** | Connects your machine to the Android device/emulator |
| **Python 3** | Runtime for Frida tooling |
| **Frida** | Dynamic instrumentation framework (hooks into running processes) |
| **frida-tools** | CLI tools: `frida`, `frida-ps`, `frida-trace` |
| **Objection** | Frida-based runtime exploration toolkit (easier interface) |
| **mitmproxy** | HTTP/S intercepting proxy (alternative: Burp Suite Community) |
| **Android Emulator** | Safe, rootable test environment (Genymotion or AVD) |

---

## 1.3 Installation — Linux (Ubuntu/Debian)

### Step 1 — System packages

```bash
sudo apt-get update
sudo apt-get install -y \
    adb \
    python3 \
    python3-pip \
    python3-venv \
    openjdk-17-jdk \
    curl \
    unzip \
    wget
```

### Step 2 — Create a Python virtual environment (keeps everything clean)

```bash
python3 -m venv ~/ssl-lab
source ~/ssl-lab/bin/activate
# You will need to run this "source" command each new terminal session.
```

### Step 3 — Install Frida, Objection, mitmproxy

```bash
pip install frida==16.5.9 frida-tools objection mitmproxy
```

> Pin the Frida version. The frida-server you push to the device must match the Python client **exactly**.

---

## 1.4 Installation — macOS

```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# ADB
brew install android-platform-tools

# Python virtual env
python3 -m venv ~/ssl-lab
source ~/ssl-lab/bin/activate

# Frida, Objection, mitmproxy
pip install frida==16.5.9 frida-tools objection mitmproxy
```

---

## 1.5 Android Emulator Setup (Genymotion — Free for Personal Use)

Genymotion is preferred because it ships without Play Integrity restrictions and is easy to root.

1. Download Genymotion Desktop from the official site and create a free account.
2. Create a **Custom Phone** virtual device:
   - Android version: **9.0 (Pie)** or **10** — these versions have fewer anti-Frida mitigations.
   - Avoid Android 13+ for first attempts (stricter SELinux).
3. Start the virtual device.
4. Verify ADB sees it:

```bash
adb devices
# Expected output:
# List of devices attached
# 192.168.56.101:5555    device
```

> **Alternative:** Android Studio AVD with a **Google APIs** image (NOT Google Play) gives you root. In AVD Manager, pick any image tagged "Google APIs" without "Google Play".

---

## 1.6 Push frida-server to the Device

frida-server is a small binary that runs on Android and lets the Python client attach to processes.

```bash
# Step 1 — Find your device's CPU architecture
adb shell getprop ro.product.cpu.abi
# Typical output: x86_64 (emulator) or arm64-v8a (real device)

# Step 2 — Download the matching frida-server
# Replace VERSION with 16.5.9 and ARCH with your architecture
# e.g., frida-server-16.5.9-android-x86_64.xz
FRIDA_VERSION=16.5.9
ARCH=x86_64   # change to arm64 for real devices

wget "https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/frida-server-${FRIDA_VERSION}-android-${ARCH}.xz"

# Step 3 — Extract
unxz frida-server-${FRIDA_VERSION}-android-${ARCH}.xz
mv frida-server-${FRIDA_VERSION}-android-${ARCH} frida-server

# Step 4 — Push to device
adb push frida-server /data/local/tmp/frida-server

# Step 5 — Make executable
adb shell chmod 755 /data/local/tmp/frida-server

# Step 6 — Start frida-server (needs root)
adb shell su -c "/data/local/tmp/frida-server &"
```

---

## 1.7 Install mitmproxy CA Certificate on the Device

This certificate tells the device to trust your proxy. Without it, even after bypassing pinning, some network stacks will reject the proxy.

```bash
# Terminal 1 — Start mitmproxy
mitmproxy --listen-port 8080

# Terminal 2 — Configure the emulator to use your proxy
# Replace 192.168.56.1 with your machine's IP (or 10.0.2.2 for AVD)
adb shell settings put global http_proxy 192.168.56.1:8080
```

Then in the emulator browser, navigate to `mitm.it` and download the Android certificate. Install it via:

```
Settings → Security → Install from storage → Select the downloaded .pem file
```

For Android 7+ (API 24+), user-installed CAs are not trusted by default. Push the cert to the system store:

```bash
# Get cert hash
openssl x509 -inform PEM -subject_hash_old -in ~/.mitmproxy/mitmproxy-ca-cert.pem | head -1
# e.g., c8750f0d

# Push to system CA store (requires root)
adb shell su -c "mount -o remount,rw /system"
adb push ~/.mitmproxy/mitmproxy-ca-cert.pem /sdcard/cert.pem
adb shell su -c "cp /sdcard/cert.pem /system/etc/security/cacerts/c8750f0d.0"
adb shell su -c "chmod 644 /system/etc/security/cacerts/c8750f0d.0"
adb shell su -c "mount -o remount,ro /system"
adb reboot
```

---

## 1.8 Verification Checklist

Run these to confirm your environment is ready:

```bash
# ADB sees device
adb devices

# Frida Python client version
frida --version
# Expected: 16.5.9

# Frida server is running on device (lists Android processes)
frida-ps -U | head -20

# Objection is installed
objection --version

# mitmproxy works
mitmproxy --version
```

**Common pitfall:** `frida-ps -U` returns "Unable to connect to remote frida-server" → the server isn't running. Re-run:
```bash
adb shell su -c "/data/local/tmp/frida-server &"
```

---

## Summary

You now have:
- ADB talking to your Android emulator.
- frida-server running on the device.
- The mitmproxy CA trusted system-wide.
- Frida, Objection, mitmproxy installed in a Python venv.

Proceed to [Lesson 2 — Core SSL Concepts](02_concepts.md).
