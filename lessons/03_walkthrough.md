# Lesson 3 — Tool Walkthrough

> **Before you start:** Complete Lesson 1 (all tools installed, frida-server running, mitmproxy CA trusted system-wide). Create a **dummy Facebook account** — never use your real account in a lab.

---

## 3.1 Install Facebook on the Emulator

Download the Facebook APK from a trusted mirror (APKPure, APKMirror). Do **not** use the Play Store in an emulator — it often detects the environment.

```bash
# Push APK to emulator and install it
adb install -r Facebook.apk
```

Verify it installed:
```bash
adb shell pm list packages | grep facebook
# Expected: package:com.facebook.katana
```

---

## 3.2 Confirm Pinning Is Active (Reproducing the Failure)

This step is important — you need to see the failure *before* you bypass it so you understand what you're fixing.

**Terminal 1 — Start mitmproxy:**
```bash
source ~/ssl-lab/bin/activate
mitmproxy --listen-port 8080 --set block_global=false
```

**Terminal 2 — Set device proxy:**
```bash
# Replace 192.168.56.1 with your machine's LAN IP (ip addr show)
adb shell settings put global http_proxy 192.168.56.1:8080
```

Now open Facebook on the emulator and try to log in. You will see:
- App shows "Network error" or hangs.
- mitmproxy shows connection attempts that are quickly dropped.
- `adb logcat` shows the pin failure:

```bash
adb logcat | grep -i "pin\|ssl\|certificate" 2>/dev/null
```

---

## 3.3 Method A — Objection (Easiest, Best for Beginners)

Objection wraps many common Frida hooks in a user-friendly CLI.

**Terminal 1 — Make sure frida-server is running:**
```bash
adb shell su -c "/data/local/tmp/frida-server &"
```

**Terminal 2 — Launch Objection against the Facebook package:**
```bash
source ~/ssl-lab/bin/activate
objection --gadget com.facebook.katana explore
```

You will land in the Objection console:
```
com.facebook.katana on (Android: 9) [usb] #
```

**Disable SSL pinning with one command:**
```
android sslpinning disable
```

Objection will output something like:
```
(agent) Custom TrustManager ready
(agent) Loaded OkHttp3 CertificatePinner hook
(agent) SSLContext.init() hook installed
(agent) Pinning disabled
```

Now switch to the emulator and log into Facebook. You should see traffic flowing through mitmproxy.

---

## 3.4 Method B — Direct Frida Script

Using your own script gives you more control and teaches you what's actually happening.

**Terminal 1 — Run the basic bypass script:**
```bash
source ~/ssl-lab/bin/activate
frida -U -f com.facebook.katana \
      -l scripts/ssl_bypass_all.js \
      --no-pause
```

Flag meanings:
- `-U` — connect over USB (or to the USB-connected emulator).
- `-f com.facebook.katana` — spawn (start) the app fresh.
- `-l scripts/ssl_bypass_all.js` — load your hook script.
- `--no-pause` — don't pause at startup (let the app run immediately).

You should see hook confirmation messages in the terminal:
```
[*] Starting SSL Pinning Bypass
[+] Hooked TrustManager.checkServerTrusted
[+] Hooked OkHttp3 CertificatePinner.check()
[+] Hooked SSLContext.init()
[*] All hooks active — bypass running
```

Switch to the emulator and log in. Watch mitmproxy for HTTPS traffic.

---

## 3.5 Attaching vs. Spawning

| Mode | Command | When to use |
|------|---------|-------------|
| **Spawn** | `frida -U -f com.facebook.katana` | Inject before app code runs — catches early pinning |
| **Attach** | `frida -U -n com.facebook.katana` | Attach to already-running app |

Facebook performs pinning during the very first network request (often before the login screen loads), so **spawn mode is required** — attach mode is usually too late.

---

## 3.6 Inspecting Traffic in mitmproxy

Once the bypass is running and you're logged in, mitmproxy will show all HTTPS requests:

```
GET  https://graph.facebook.com/v19.0/me?fields=id,name
POST https://b-graph.facebook.com/auth/login
GET  https://edge-chat.facebook.com/pull
```

**Useful mitmproxy keybindings:**
- `↑↓` — navigate requests.
- `Enter` — open a request.
- `Tab` — switch between Request / Response.
- `f` — filter (e.g., `~u facebook.com` to show only Facebook URLs).
- `q` — quit / go back.

You can also export traffic to HAR format for offline analysis:
```bash
mitmproxy --listen-port 8080 --save-stream-file capture.mitm
```

---

## 3.7 Common Pitfalls and Fixes

### "Unable to connect to remote frida-server"
frida-server crashed or was never started.
```bash
adb shell su -c "killall frida-server 2>/dev/null; /data/local/tmp/frida-server &"
```

### "App crashes immediately after hook"
Facebook detects Frida via `/proc/<pid>/maps` checks. Solution: use a Frida gadget embedded in the APK (Lesson 4), or use the `--realm=emulated` flag and a patched frida-server.

### "No traffic in mitmproxy even after bypass"
- Verify proxy settings: `adb shell settings get global http_proxy`
- Frida hook may have failed silently — check for error output in the terminal running `frida`.
- Some Facebook endpoints use HTTP/2 ALPN — try: `mitmproxy --set http2=false`

### "SSLError: certificate verify failed" in mitmproxy itself
The mitmproxy CA cert was not installed in the system store. Re-do step 1.7 of the setup.

### "Frida version mismatch"
The Python `frida` package and `frida-server` binary must match exactly.
```bash
frida --version           # Python client version
adb shell /data/local/tmp/frida-server --version   # server version
```
Download the frida-server that matches your Python client version.

---

## 3.8 Capturing a Specific API Call (Example)

Goal: capture the POST request Facebook sends when you like a post.

1. In mitmproxy, press `f` and type: `~m POST ~u graph.facebook.com`
2. Tap the Like button on a post in the emulator.
3. A new entry appears in mitmproxy — press `Enter` to inspect it.
4. The Request tab shows the endpoint, headers, and body (JSON or form-encoded).

This is the kind of traffic analysis that security researchers use to understand API behavior, find insecure endpoints, or verify that an app does not leak sensitive data.

---

## Summary

You have now:
- Confirmed SSL pinning blocks your proxy.
- Used Objection to disable pinning in one command.
- Used a raw Frida script for deeper control.
- Captured and inspected Facebook HTTPS traffic.

Proceed to [Lesson 4 — Advanced Techniques](04_advanced.md).
