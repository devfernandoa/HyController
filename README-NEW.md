# HyController 🎮

Modern web-based control panel for managing multiple Hytale game servers with Docker.

[![Docker](https://img.shields.io/badge/Docker-20.10%2B-blue)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Java](https://img.shields.io/badge/Java-25-orange)](https://adoptium.net/)

## ✨ Features

- 🚀 **Server Management** - Create, start, stop, restart, and delete Hytale servers
- 📁 **File Manager** - Browse, edit, upload, download server files
- 💻 **Interactive Console** - Execute commands in real-time
- 📊 **Resource Monitoring** - CPU, RAM, and network usage
- 📝 **Live Logs** - Real-time and historical server logs
- ⚙️ **Configuration** - Memory, ports, authentication, and more
- 🐳 **Docker Isolation** - Each server runs in its own container
- 🌍 **Multi-platform** - Support for linux/amd64 and linux/arm64

## 🚀 Quick Start

### Using Pre-built Images from GHCR (Recommended)

Perfect for NAS or production deployments:

```bash
# 1. Create .env file
cp .env.example .env
# Edit .env and set: GITHUB_USERNAME=your_github_username

# 2. Start services
docker-compose -f docker-compose.ghcr.yml up -d

# 3. Access at http://localhost:3000
```

📖 **First time?** See the [GHCR Setup Guide](GHCR-SETUP.md)

### Building Locally

For development or custom deployments:

```bash
# Build and start all services
docker-compose up -d --build

# Access at http://localhost:3000
```

## 📋 Requirements

- Docker 20.10+
- Docker Compose 2.0+
- **RAM**: 2GB minimum (+ 2-4GB per Hytale server)
- **Ports**: 3000 (Web UI), 3001 (API), 5520+ (Game servers)

## 📦 What Gets Installed

| Service | Description | Port |
|---------|-------------|------|
| Frontend | React web interface | 3000 |
| Backend | Node.js API server | 3001 |
| Runner | Java 25 runtime for game servers | - |

Each Hytale server runs in its own isolated container.

## 🎮 Creating Your First Server

1. **Access the panel** at `http://localhost:3000`
2. Click **"Create Server"** 
3. Fill in the details:
   - Server name (alphanumeric + hyphens)
   - Port (default: 5520)
   - Memory settings (min/max)
   - Upload your server bundle ZIP
4. Click **"Create"**
5. Click **"Start"** to launch the server

### 📦 Server Bundle Requirements

Your ZIP file must contain:
- `HytaleServer.jar`
- `Assets.zip`

Optional files:
- `HytaleServer.aot` (for AOT cache)
- Custom configurations

## 🏗️ Architecture

```
Browser ──▶ Frontend (React) ──▶ Backend (Node.js) ──▶ Docker Engine
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │  Hytale Server 1     │
                              │  (Container)         │
                              └──────────────────────┘
                              ┌──────────────────────┐
                              │  Hytale Server 2     │
                              │  (Container)         │
                              └──────────────────────┘
```

## 📚 Documentation

- 📖 [NAS Deployment Guide](DEPLOY-NAS.md) - Complete guide for NAS
- 🐙 [GHCR Setup](GHCR-SETUP.md) - Using GitHub Container Registry  
- 🧪 [Testing Guide](TESTING.md) - Running tests
- 🤝 [Contributing](CONTRIBUTING.md) - Development guidelines
- ❓ [FAQ](docs/FAQ.md) - Frequently Asked Questions

## 🔧 Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
GITHUB_USERNAME=your_username  # For GHCR images
```

### Custom Ports

Edit `docker-compose.yml` or `docker-compose.ghcr.yml`:

```yaml
services:
  frontend:
    ports:
      - "8000:80"  # Change 8000 to your preferred port
  backend:
    ports:
      - "8001:3001"  # Change 8001 to your preferred port
```

## 🛠️ Common Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services  
docker-compose restart

# Stop everything
docker-compose down

# Update to latest images (GHCR)
docker-compose -f docker-compose.ghcr.yml pull
docker-compose -f docker-compose.ghcr.yml up -d

# Rebuild after code changes
docker-compose up -d --build
```

## 🐳 Docker Images

### GHCR (GitHub Container Registry)

```bash
ghcr.io/OWNER/hycontroller-backend:latest
ghcr.io/OWNER/hycontroller-frontend:latest
ghcr.io/OWNER/hycontroller-runner:latest
```

Images are automatically built on every push via GitHub Actions.

### Local Build

```bash
docker-compose build
```

## 🔐 Security Notes

⚠️ **Important:**
- Don't expose port 3001 (API) to the internet
- Use a reverse proxy (Nginx, Traefik) for HTTPS
- Consider adding authentication (not included by default)
- Keep Docker up to date
- Use firewall rules to restrict access

## 🎯 Use Cases

- 🏠 **Home Server** - Run multiple Hytale servers on one machine
- 🖥️ **NAS Deployment** - Perfect for Synology, QNAP, Unraid
- ☁️ **Cloud Hosting** - Deploy on AWS, DigitalOcean, etc.
- 👨‍💻 **Development** - Test server configurations quickly

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the Hytale community
- Powered by Docker, Node.js, and React
- Java runtime from Eclipse Temurin

## 📬 Support

- 🐛 [Report a Bug](../../issues/new?template=bug_report.md)
- 💡 [Request a Feature](../../issues/new?template=feature_request.md)
- 📖 [Documentation](docs/)

---

Made with ❤️ for the Hytale community
