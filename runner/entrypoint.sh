#!/bin/bash
set -e

# Default values
JAVA_OPTS="${JAVA_OPTS:--Xms2G -Xmx4G}"
SERVER_ARGS="${SERVER_ARGS:---assets /data/Assets.zip --bind 0.0.0.0:5520}"

# Check if HytaleServer.jar exists
if [ ! -f "/data/HytaleServer.jar" ]; then
    echo "ERROR: HytaleServer.jar not found in /data"
    echo "Please upload the server files before starting."
    exit 1
fi

# Check if Assets.zip exists
if [ ! -f "/data/Assets.zip" ]; then
    echo "ERROR: Assets.zip not found in /data"
    echo "Please upload the server files before starting."
    exit 1
fi

# Create necessary directories (use -p to avoid errors if they already exist)
# Try to create, but don't fail if permission denied (directories might already exist)
mkdir -p /data/logs 2>/dev/null || true
mkdir -p /data/mods 2>/dev/null || true
mkdir -p /data/backups 2>/dev/null || true

# Create named pipe for console commands
CONSOLE_PIPE="/tmp/console.pipe"
rm -f "$CONSOLE_PIPE" 2>/dev/null || true
mkfifo "$CONSOLE_PIPE" 2>/dev/null || true

# Print configuration
echo "=============================================="
echo "  HyController - Hytale Server Runner"
echo "=============================================="
echo "Java Options: $JAVA_OPTS"
echo "Server Args: $SERVER_ARGS"
echo "Console Pipe: $CONSOLE_PIPE"
echo "=============================================="
echo ""

# Use unbuffer to make Java think it has an interactive terminal
# This allows the Hytale Server console to accept stdin commands
exec unbuffer -p java $JAVA_OPTS -jar /data/HytaleServer.jar $SERVER_ARGS < "$CONSOLE_PIPE"
