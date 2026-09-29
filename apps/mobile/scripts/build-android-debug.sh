#!/usr/bin/env bash
# kneecap M3 — builds the Android debug APK via gradle.
#
# Same commands the M3 session ran locally, kept here so a future
# session/CI doesn't have to re-derive them (see
# ../../.github/workflows/mobile-ci.yml, which runs this exact sequence).
set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$MOBILE_DIR"

# build:debug (not build): a debug APK pairs with the debug web bundle,
# which keeps #/diagnostics, #/autotest and spike.html (see main.ts).
echo "==> bun run build:debug (Vite -> www/)"
bun run build:debug

echo "==> cap sync android"
bunx cap sync android

echo "==> gradlew assembleDebug"
cd android
./gradlew assembleDebug --console=plain

echo "==> APK at: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk"
