#!/bin/bash
zip -r hytale-server-bundle.zip HytaleServer.jar Assets.zip HytaleServer.aot README.md
echo "✅ Bundle criado: hytale-server-bundle.zip ($(du -h hytale-server-bundle.zip | cut -f1))"
