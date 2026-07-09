import argparse
import os
import sys
import time

import frida

SCRIPTS = {
    "all": "scripts/ssl_bypass_all.js",
    "basic": "scripts/ssl_bypass_basic.js",
    "okhttp": "scripts/ssl_bypass_okhttp.js",
}

COLORS = {"send": "\033[92m", "error": "\033[91m", "reset": "\033[0m"}


def stamp():
    return time.strftime("%H:%M:%S")


def on_message(message, data):
    if message["type"] == "send":
        payload = message["payload"]
        tag = payload.get("tag", "hook")
        text = payload.get("msg", payload)
        print(f"{COLORS['send']}[{stamp()}] [{tag}] {text}{COLORS['reset']}")
    elif message["type"] == "error":
        print(f"{COLORS['error']}[{stamp()}] {message.get('stack', message)}{COLORS['reset']}")


def load_script(name):
    path = SCRIPTS.get(name)
    if path is None:
        sys.exit(f"unknown script '{name}', choose from {', '.join(SCRIPTS)}")
    if not os.path.isfile(path):
        sys.exit(f"script not found: {path}")
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read()


def main():
    parser = argparse.ArgumentParser(prog="run.py")
    parser.add_argument("package")
    parser.add_argument("-s", "--script", default="all", choices=SCRIPTS.keys())
    parser.add_argument("-H", "--host")
    args = parser.parse_args()

    device = frida.get_device_manager().add_remote_device(args.host) if args.host else frida.get_usb_device(timeout=10)

    print(f"[{stamp()}] spawning {args.package}")
    pid = device.spawn([args.package])
    session = device.attach(pid)

    script = session.create_script(load_script(args.script))
    script.on("message", on_message)
    script.load()

    device.resume(pid)
    print(f"[{stamp()}] running, press Ctrl+C to stop")

    try:
        sys.stdin.read()
    except KeyboardInterrupt:
        print(f"\n[{stamp()}] detaching")
        session.detach()


if __name__ == "__main__":
    main()
