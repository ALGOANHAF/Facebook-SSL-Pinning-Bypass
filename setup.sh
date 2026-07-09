#!/usr/bin/env bash
set -euo pipefail

FRIDA_VERSION="16.5.9"
VENV_DIR="ssl-lab"

info() { printf '\033[92m[+]\033[0m %s\n' "$1"; }
warn() { printf '\033[93m[!]\033[0m %s\n' "$1"; }
fail() { printf '\033[91m[-]\033[0m %s\n' "$1"; exit 1; }

command -v python3 >/dev/null || fail "python3 not found"
command -v adb >/dev/null || fail "adb not found"

info "creating virtual environment: ${VENV_DIR}"
python3 -m venv "${VENV_DIR}"

info "installing python dependencies"
"./${VENV_DIR}/bin/pip" install --quiet --upgrade pip
"./${VENV_DIR}/bin/pip" install --quiet -r requirements.txt

adb get-state >/dev/null 2>&1 || fail "no device detected, start an emulator or connect a device"

ARCH="$(adb shell getprop ro.product.cpu.abi | tr -d '\r')"
case "${ARCH}" in
    arm64-v8a) FRIDA_ARCH="arm64" ;;
    armeabi-v7a) FRIDA_ARCH="arm" ;;
    x86_64) FRIDA_ARCH="x86_64" ;;
    x86) FRIDA_ARCH="x86" ;;
    *) fail "unsupported architecture: ${ARCH}" ;;
esac

SERVER="frida-server-${FRIDA_VERSION}-android-${FRIDA_ARCH}"
info "downloading ${SERVER}"
curl -fsSL "https://github.com/frida/frida/releases/download/${FRIDA_VERSION}/${SERVER}.xz" -o "${SERVER}.xz"
unxz -f "${SERVER}.xz"

info "pushing frida-server to device"
adb push "${SERVER}" /data/local/tmp/frida-server
adb shell chmod 755 /data/local/tmp/frida-server
rm -f "${SERVER}"

if adb shell su -c "id" >/dev/null 2>&1; then
    info "starting frida-server"
    adb shell su -c "/data/local/tmp/frida-server &" >/dev/null 2>&1 || true
else
    warn "root not available, start frida-server manually"
fi

info "done, activate with: source ${VENV_DIR}/bin/activate"
