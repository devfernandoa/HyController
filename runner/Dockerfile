# Multi-platform Java 25 runner for Hytale Server
FROM eclipse-temurin:25-jdk

# Install required tools
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create data directory
RUN mkdir -p /data /opt/runner

# Copy entrypoint script
COPY entrypoint.sh /opt/runner/entrypoint.sh
RUN chmod +x /opt/runner/entrypoint.sh

# Set working directory
WORKDIR /data

# Default UDP port for Hytale
EXPOSE 5520/udp

# Use entrypoint script
ENTRYPOINT ["/opt/runner/entrypoint.sh"]
