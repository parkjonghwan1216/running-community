#!/bin/bash
set -e

# Persistent volume is mounted at /data
# DB lives at /data/app.db (set DATABASE_PATH=/data/app.db in Railway env)
# Uploads live at /data/uploads — symlinked to public/uploads for Next.js static serving

DATA_DIR="${DATA_DIR:-/data}"
UPLOAD_TARGET="$DATA_DIR/uploads"

mkdir -p "$UPLOAD_TARGET/gpx"

# Remove the placeholder directory and symlink to the volume
UPLOAD_LINK="$(pwd)/public/uploads"
if [ -d "$UPLOAD_LINK" ] && [ ! -L "$UPLOAD_LINK" ]; then
  rm -rf "$UPLOAD_LINK"
fi
if [ ! -L "$UPLOAD_LINK" ]; then
  ln -sf "$UPLOAD_TARGET" "$UPLOAD_LINK"
fi

exec npm run start
