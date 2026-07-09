# Lesson 3 — Tool Walkthrough

> **Educational use only.** Before starting, create a **dummy Facebook account**. Never use a real account in the lab.

This lesson runs the full bypass end to end.

---

## 3.1 Step 1 — Install the Target App

Obtain the Facebook APK from a trusted mirror and install it.

```bash
adb install -r Facebook.apk
```

Confirm the package is present.

```bash
adb shell pm list packages | grep facebook
```

You should see `package:com.facebook.katana`.

---

## 3.2 Step 2 — Reproduce the Pinning Failure First

Seeing the failure before you fix it is the whole point of the exercise.

Start mitmproxy in one terminal.

```bash
mitmproxy --listen-port 8080
```

Point the device at it in another terminal.

```bash
adb shell settings put global http_proxy 192.168.56.1:8080
```

Open Facebook and try to log in. It hangs or shows a network error. Watch the pin rejection in the log.

```bash
adb logcat | grep -iE "pin|ssl|certificate"
```

---

## 3.3 Step 3 — Confirm frida-server Is Running

```bash
adb shell su -c "/data/local/tmp/frida-server &"
```

---

## 3.4 Method A — The Repository Runner (Recommended)

The bundled runner spawns the app, injects the chosen script, and prints each hook as it fires.

```bash
python run.py com.facebook.katana --script all
```

Expected output:

```
[19:20:01] spawning com.facebook.katana
[19:20:02] [bypass] hooked SSLContext.init
[19:20:02] [bypass] hooked okhttp3.CertificatePinner
[19:20:02] [bypass] active
[19:20:03] [bypass] okhttp3 graph.facebook.com
```

Switch to the emulator and log in. Traffic now flows through mitmproxy.

If your device exposes Frida over TCP instead of USB, pass the host.

```bash
python run.py com.facebook.katana --script all --host 127.0.0.1:27042
```

---

## 3.5 Method B — Objection (One Command)

Objection wraps common hooks behind a single command.

```bash
objection --gadget com.facebook.katana explore
```

Inside the Objection console, disable pinning.

```
android sslpinning disable
```

Then log in on the emulator.

---

## 3.6 Method C — Raw Frida CLI

You can also load a script directly with the Frida CLI.

```bash
frida -U -f com.facebook.katana -l scripts/ssl_bypass_all.js --no-pause
```

---

## 3.7 Spawn, Not Attach

Facebook runs its first pinned request before the login screen appears, so the hook must be in place before the app starts. Always spawn.

| Mode | Flag | Result |
|------|------|--------|
| Spawn | `-f` (or `run.py`, which always spawns) | Hook installed before app code runs |
| Attach | `-n` | Usually too late, pin already enforced |

---

## 3.8 Step 4 — Inspect the Traffic

With the bypass active and login complete, mitmproxy shows the live requests.

```
GET   https://graph.facebook.com/v19.0/me
POST  https://b-graph.facebook.com/auth/login
GET   https://edge-chat.facebook.com/pull
```

Useful keys inside mitmproxy:

| Key | Action |
|-----|--------|
| Up / Down | Move between requests |
| Enter | Open a request |
| Tab | Switch request and response |
| f | Filter, for example `~u facebook.com` |
| q | Back or quit |

To keep a capture for offline analysis, save the stream.

```bash
mitmproxy --listen-port 8080 --save-stream-file capture.mitm
```

---

## 3.9 Step 5 — Capture One Specific Call

To isolate a single action, filter first, then perform it.

Press `f` inside mitmproxy and enter a filter.

```
~m POST ~u graph.facebook.com
```

Perform the action in the app, for example liking a post. The matching request appears; press Enter to read its headers and body.

---

## 3.10 Troubleshooting

| Symptom | Fix |
|---------|-----|
| Cannot connect to frida-server | `adb shell su -c "killall frida-server; /data/local/tmp/frida-server &"` |
| App crashes right after injection | See anti-Frida handling in Lesson 4 |
| No traffic despite bypass | Check the proxy with `adb shell settings get global http_proxy` |
| mitmproxy TLS errors | The CA is not in the system store; redo Lesson 1 step 9 |
| Version mismatch | `frida --version` must equal the server version |

---

## Summary

You reproduced the pin failure, neutralised it three different ways, and captured live Facebook traffic through mitmproxy.

Continue to [Lesson 4 — Advanced Techniques](04_advanced.md).
