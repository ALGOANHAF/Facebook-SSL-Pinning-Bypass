# Lesson 1 — Environment Setup

> **Educational use only.** Only test on devices and accounts you own.

This lesson takes you from a clean machine to a working lab in eleven steps.

---

## 1.1 Choose Your Operating System

| OS | Notes |
|----|-------|
| **Linux (Ubuntu/Debian)** | Recommended. Native ADB, no driver issues. |
| **macOS** | Very good. Homebrew handles everything. |
| **Windows** | Works, but ADB drivers add friction. WSL2 is a good middle ground. |

The commands below target Linux, with a macOS note where they differ.

---

## 1.2 The Toolchain

| Tool | Role |
|------|------|
| ADB | Bridge between your machine and the device |
| Python 3 | Runtime for Frida and the lab runner |
| Frida | Dynamic instrumentation engine |
| Objection | Frida toolkit with prebuilt mobile hooks |
| mitmproxy | Intercepting HTTPS proxy |
| Android emulator | Rootable test target |

---

## 1.3 Step 1 — Install System Packages (Linux)

Install ADB, Python, and the JDK used by the Android tooling.

```bash
sudo apt-get update
sudo apt-get install -y adb python3 python3-pip python3-venv openjdk-17-jdk curl unzip wget xz-utils
```

On macOS, install the equivalents with Homebrew.

```bash
brew install android-platform-tools python openjdk
```

---

## 1.4 Step 2 — Clone the Repository

Pull the lab down and enter it.

```bash
git clone https://github.com/algoanhaf/facebook-ssl-pinning-bypass.git
cd facebook-ssl-pinning-bypass
```

---

## 1.5 Step 3 — Run the Automated Setup

The setup script creates a virtual environment, installs every Python dependency, detects your device architecture, and pushes a matching `frida-server`.

```bash
./setup.sh
```

When it finishes, activate the environment.

```bash
source ssl-lab/bin/activate
```

If you prefer to install manually instead of using the script, run the next two commands.

```bash
python3 -m venv ssl-lab
source ssl-lab/bin/activate
pip install -r requirements.txt
```

---

## 1.6 Step 4 — Create the Android Emulator

Use **Genymotion Desktop** (free for personal use) or an **Android Studio AVD** built from a *Google APIs* image, which ships with root.

Recommended configuration:

- Android 9 (Pie) or Android 10
- Avoid Android 13+ for early attempts because SELinux is stricter there

Start the virtual device, then confirm ADB can see it.

```bash
adb devices
```

Expected output:

```
List of devices attached
192.168.56.101:5555    device
```

---

## 1.7 Step 5 — Push frida-server Manually (If You Skipped setup.sh)

Read the device architecture.

```bash
adb shell getprop ro.product.cpu.abi
```

Download the matching server from the Frida releases page, decompress it, and push it. Replace `x86_64` with the architecture reported above.

```bash
wget https://github.com/frida/frida/releases/download/16.5.9/frida-server-16.5.9-android-x86_64.xz
unxz frida-server-16.5.9-android-x86_64.xz
adb push frida-server-16.5.9-android-x86_64 /data/local/tmp/frida-server
adb shell chmod 755 /data/local/tmp/frida-server
```

---

## 1.8 Step 6 — Start frida-server

Launch the server with root privileges.

```bash
adb shell su -c "/data/local/tmp/frida-server &"
```

---

## 1.9 Step 7 — Start mitmproxy

In its own terminal, start the proxy on port 8080.

```bash
mitmproxy --listen-port 8080
```

---

## 1.10 Step 8 — Point the Device at the Proxy

Set the device HTTP proxy to your machine. Replace the IP with your machine's LAN address, or use `10.0.2.2` for a standard AVD.

```bash
adb shell settings put global http_proxy 192.168.56.1:8080
```

---

## 1.11 Step 9 — Trust the mitmproxy CA System-Wide

On Android 7 and above, user certificates are not trusted by apps, so the CA must go into the system store.

Compute the certificate hash that Android expects as a filename.

```bash
openssl x509 -inform PEM -subject_hash_old -in ~/.mitmproxy/mitmproxy-ca-cert.pem | head -1
```

Remount the system partition, copy the certificate in under its hash name, fix permissions, and reboot. Replace `c8750f0d` with the hash printed above.

```bash
adb root
adb shell "mount -o remount,rw /system"
adb push ~/.mitmproxy/mitmproxy-ca-cert.pem /system/etc/security/cacerts/c8750f0d.0
adb shell "chmod 644 /system/etc/security/cacerts/c8750f0d.0"
adb shell "mount -o remount,ro /system"
adb reboot
```

---

## 1.12 Step 10 — Verify the Installation

Confirm each tool is present and the server is reachable.

```bash
adb devices
frida --version
frida-ps -U
objection --version
mitmproxy --version
```

`frida-ps -U` listing device processes means the client and server are talking.

---

## 1.13 Step 11 — Handle the Most Common Failure

If `frida-ps -U` reports that it cannot connect to the remote server, the server is not running. Restart it.

```bash
adb shell su -c "killall frida-server 2>/dev/null; /data/local/tmp/frida-server &"
```

---

## Summary

You now have ADB talking to a rooted emulator, `frida-server` running, the mitmproxy CA trusted system-wide, and every Python tool installed in an isolated environment.

Continue to [Lesson 2 — Core SSL Concepts](02_concepts.md).
