## 1) Project goals

Build a web dashboard that can:

1. **Receive a Hytale server “image” or bundle** (at minimum: `HytaleServer.jar` + `Assets.zip` + optional `HytaleServer.aot` and plugins/mods).
2. **Run/stop/restart** the server in a controlled, repeatable way (Docker).
3. **View, upload, edit, rename, delete files** within the server data directory (`config.json`, `mods/`, `universe/`, etc.).
4. **Change settings** safely (memory, bind address/port, authentication mode, backups, etc.).
5. **View logs** (live tail + historical).
6. **Run commands** in the server console (interactive console-like experience).
7. Provide a clean separation between:

   * **Panel (controller/UI/API)** and
   * **Server runtime (the actual Hytale server process)**.

Non-goals for v0:

* Multi-tenant hosting at scale.
* Full billing/user marketplace.
* Network proxy features.
* Auto-modding ecosystem (just file drop + restart is fine).

---

## 2) Architecture overview

### 2.1 Components

**A) Panel (web app)**

* Serves UI and exposes an API.
* Owns configuration, user/auth (optional for v0), and orchestration.
* Talks to the container runtime (Docker Engine API or docker socket).

**B) Runner (per-server container)**

* A container that runs Java 25 + the Hytale server.
* Uses a mounted **data volume** for persistence:

  * `Assets.zip`, `HytaleServer.jar`, `config.json`, `logs/`, `mods/`, `universe/`, etc.
* Exposes:

  * UDP game port (default 5520).
  * Optional HTTP port(s) if plugins provide them.

**C) Storage**

* Each server has a dedicated volume or directory.
* Panel must never overwrite files “behind the user’s back” without snapshots/backups.

### 2.2 Control plane vs data plane

* Panel = control plane (start/stop, config, file manager).
* Hytale container = data plane (actual server process, logs, filesystem).

This separation makes updates safer and avoids the panel needing Java/Hytale internals.

---

## 3) Docker requirements

### 3.1 Runtime constraints

* Must support **linux/amd64** and **linux/arm64**.
* Must run **Java 25** in the runner container.
* Must mount a persistent path:

  * `/data` inside container (recommended).
* Must expose UDP port mapping:

  * Container listens `0.0.0.0:5520` by default (or user-defined).
  * Panel must clearly label “UDP, not TCP”.

### 3.2 Suggested container layout

Inside runner container:

* `/data` (mounted volume)

  * `HytaleServer.jar`
  * `Assets.zip`
  * `HytaleServer.aot` (optional)
  * `config.json`, `permissions.json`, `whitelist.json`, `bans.json`
  * `mods/`, `logs/`, `.cache/`, `universe/`
* `/opt/runner` (image-baked helper scripts)

  * entrypoint script to assemble the final `java` command and start server

### 3.3 Container startup command (assembled by panel)

Panel generates:

* `--assets /data/Assets.zip` (or directory if supported later)
* `--bind 0.0.0.0:<port>`
  Optional:
* `--auth-mode authenticated|offline`
* `--backup`, `--backup-dir`, `--backup-frequency`
* `--disable-sentry` toggle
* `-XX:AOTCache=/data/HytaleServer.aot` if present and enabled
* JVM heap settings:

  * `-Xms`, `-Xmx` based on panel settings

---

## 4) File management requirements

### 4.1 Operations

* Browse directories, download files.
* Upload files (single + batch).
* Create folders.
* Edit text files (JSON etc.) with:

  * basic validation option for JSON (warn, don’t force).
* Rename/move/delete.

### 4.2 Safety rules

* **Do not edit while server is running** for files known to be overwritten by the server (as per manual). Instead:

  * allow edits but warn: “may be overwritten; restart recommended; prefer stopping server for config edits.”
* Provide an optional “safe apply” flow:

  1. stop server
  2. apply changes
  3. start server

### 4.3 Backups / snapshots (v0 minimal)

* Manual “Create backup now”:

  * zip/tar `/data` (excluding huge caches optionally).
* Auto-backup toggle (if Hytale server supports `--backup` it can be delegated; otherwise panel-level backup).

---

## 5) Settings management requirements

### 5.1 Settings the panel must expose

Minimum:

* Server name (panel label)
* Game port (UDP)
* Bind address (default `0.0.0.0`)
* Auth mode: authenticated/offline
* Assets path selection (default `/data/Assets.zip`)
* JVM:

  * memory max (`-Xmx`)
  * memory min (`-Xms`)
  * extra JVM args (advanced)
* Extra server args (advanced)
* Toggles:

  * disable sentry
  * enable AOT cache if file exists
  * enable backups + frequency + backup dir (if using server flags)

### 5.2 Validation rules

* Port must be 1–65535.
* Warn if port is privileged (<1024) or already in use (panel can best-effort check).
* Enforce “UDP” labeling everywhere the port appears.
* Memory values must be sane (avoid `Xmx > host RAM` if panel can detect host capacity).

---

## 6) Logs requirements

### 6.1 What to show

* Live log stream (tail/follow).
* Historical log browsing (files from `/data/logs`).
* Search/filter in UI (client-side ok for v0).

### 6.2 Implementation notes

* Runner container logs should go to stdout/stderr AND/or `/data/logs`.
* Panel should support:

  * Docker log streaming (if logs to stdout: easy)
  * File tailing (if logs are file-based)
* Prefer supporting both, because server implementations differ over time.

---

## 7) Command console requirements

### 7.1 Features

* A console view with:

  * output stream
  * input line to send commands
  * command history per server (panel-side)

### 7.2 How commands are delivered

* Must support interactive stdin to the Java process.
* Typical approach:

  * `docker exec -i <container> ...` into a control socket, or
  * run the server process as PID 1 and attach, or
  * use a small sidecar/agent inside runner that proxies stdin/stdout over WebSocket.
* For v0, choose the simplest robust approach and document it clearly.

---

## 8) “Receive the server image” requirement

Clarify the intake formats the panel will accept:

### 8.1 Accepted inputs (recommendation)

* **Option A (simplest):** Upload a zip containing:

  * `HytaleServer.jar`
  * `Assets.zip`
  * optional `HytaleServer.aot`
* **Option B:** Upload files individually.
* **Option C (advanced later):** Provide a URL for the panel to fetch the bundle.

### 8.2 Validation on import

* Ensure `HytaleServer.jar` exists.
* Ensure `Assets.zip` exists.
* Record version metadata if discoverable (optional; may require parsing jar manifest).

---

## 9) Networking requirements

* Must communicate clearly:

  * Hytale uses **QUIC over UDP**.
* Panel must:

  * open UDP port mapping in docker compose configuration.
  * optionally provide “connection info” card: `host:port` and remind UDP forwarding on routers/firewalls.

---

## 10) Authentication flow support (device login)

Server manual indicates device auth via console command:

* Panel must allow the admin to:

  * open console
  * run `/auth login device`
  * view the code and URL from logs
* Provide a “quick copy” UI for:

  * device URL
  * code (if parseable from output; optional for v0)

No automation of OAuth is required for v0; just make the console usable.

---

## 11) Security requirements

### 11.1 Panel access

* For v0: single admin account or local-only mode is acceptable.
* If multi-user is included:

  * role-based permissions (view-only vs admin)
  * per-server access control

### 11.2 Container isolation

* Runner should be:

  * non-root user if possible
  * minimal filesystem access (only `/data`)
  * no access to Docker socket
* Panel should be the only component allowed to talk to Docker.

### 11.3 File editor safety

* Prevent path traversal (`../`).
* Size limits on uploads.
* Optional allowlist/denylist for editing sensitive files.

---

## 12) Observability requirements (nice-to-have for v0, required soon)

* Basic metrics:

  * container status
  * uptime
  * CPU/RAM usage (docker stats)
* Display “memory pressure guidance” (ties to server manual) in help text near `-Xmx`.

---

## 13) Deliverables for the initial repository

### 13.1 Repo structure (suggested)

* `/panel`

  * backend API
  * frontend UI
* `/runner`

  * Dockerfile for Java 25 runner
  * entrypoint scripts
* `/compose`

  * `docker-compose.yml` for local dev
* `/docs`

  * install guide
  * threat model / security notes
  * “how to import server files”
  * “how to authenticate server”

### 13.2 Minimum docs

* Requirements: Java 25 inside runner, UDP port handling, mounted volume layout.
* Quickstart:

  * start panel
  * create server
  * upload jar/assets
  * start
  * authenticate via console
* Backup/restore instructions.

---

## 14) General implementation guidelines

* Treat `/data` as the source of truth. Never store server state inside container layers.
* All changes to startup flags must be reproducible from a single “server definition” object (JSON/YAML in panel DB).
* Prefer explicitness over magic:

  * show the exact java command that will be run (copyable).
* Make restarts safe:

  * stop -> wait for process exit -> start
  * show progress and errors.

---