#!/usr/bin/env sh
set -e

REPO="orochibraru/baba"
BIN_NAME="baba"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
VERSION="${VERSION:-latest}"
CONFIG_PATH="${CONFIG_PATH:-./config.json}"

# ── Detect OS ─────────────────────────────────────────────────────────────────

OS="$(uname -s)"
case "$OS" in
    Linux)  OS="linux"  ;;
    Darwin) OS="darwin" ;;
    *)
        echo "Unsupported OS: $OS" >&2
        echo "Please download the binary manually from https://github.com/$REPO/releases" >&2
        exit 1
        ;;
esac

# ── Detect architecture ───────────────────────────────────────────────────────

ARCH="$(uname -m)"
case "$ARCH" in
    x86_64)           ARCH="x64"   ;;
    aarch64 | arm64)  ARCH="arm64" ;;
    *)
        echo "Unsupported architecture: $ARCH" >&2
        echo "Please download the binary manually from https://github.com/$REPO/releases" >&2
        exit 1
        ;;
esac

ASSET="${BIN_NAME}-${OS}-${ARCH}"

# ── Build download URL ────────────────────────────────────────────────────────

if [ "$VERSION" = "latest" ]; then
    DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${ASSET}"
else
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${ASSET}"
fi

# ── Dry-run mode (used by tests) ──────────────────────────────────────────────

if [ "${DRY_RUN:-}" = "1" ]; then
    echo "asset=${ASSET}"
    echo "url=${DOWNLOAD_URL}"
    echo "install_dir=${INSTALL_DIR}"
    exit 0
fi

# ── Download ──────────────────────────────────────────────────────────────────

TMP_FILE="$(mktemp)"
echo "Downloading $ASSET..."

if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$DOWNLOAD_URL" -o "$TMP_FILE"
elif command -v wget >/dev/null 2>&1; then
    wget -qO "$TMP_FILE" "$DOWNLOAD_URL"
else
    echo "Error: curl or wget is required" >&2
    exit 1
fi

chmod +x "$TMP_FILE"

# ── Install ───────────────────────────────────────────────────────────────────

DEST="${INSTALL_DIR}/${BIN_NAME}"

if [ -w "$INSTALL_DIR" ]; then
    mv "$TMP_FILE" "$DEST"
else
    echo "Installing to $DEST (requires sudo)..."
    sudo mv "$TMP_FILE" "$DEST"
fi

# ── Config ────────────────────────────────────────────────────────────────────

echo ""
if [ -f "$CONFIG_PATH" ]; then
    echo "Config already exists at $CONFIG_PATH — keeping it."
else
    printf "Downloading example config to %s..." "$CONFIG_PATH"
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "https://raw.githubusercontent.com/${REPO}/main/config.example.json" -o "$CONFIG_PATH"
        echo " done."
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$CONFIG_PATH" "https://raw.githubusercontent.com/${REPO}/main/config.example.json"
        echo " done."
    else
        echo ""
        echo "Note: curl and wget not found — could not download example config."
        echo "Download it from: https://github.com/${REPO}/blob/main/config.example.json"
    fi
fi

echo ""
echo "baba installed to $DEST"
echo "Run 'baba setup' to configure interactively, or edit $CONFIG_PATH and run 'baba start'."
