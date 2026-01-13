#!/bin/bash

# Script para criar arquivos mock do servidor Hytale para testes

set -e

echo "=============================================="
echo "  Criando Arquivos Mock do Servidor Hytale"
echo "=============================================="
echo ""

MOCK_DIR="$(dirname "$0")/generated"
mkdir -p "$MOCK_DIR"

# 1. Criar Assets.zip mock (arquivo grande simulado)
echo "📦 Criando Assets.zip mock..."
ASSETS_DIR="$MOCK_DIR/assets_temp"
mkdir -p "$ASSETS_DIR/textures"
mkdir -p "$ASSETS_DIR/models"
mkdir -p "$ASSETS_DIR/sounds"

# Criar alguns arquivos de exemplo
echo "Mock texture data" > "$ASSETS_DIR/textures/block_stone.png"
echo "Mock model data" > "$ASSETS_DIR/models/player.json"
echo "Mock sound data" > "$ASSETS_DIR/sounds/ambient.ogg"

# Criar arquivo grande para simular tamanho real (opcional)
dd if=/dev/zero of="$ASSETS_DIR/large_file.dat" bs=1M count=50 2>/dev/null || true

cd "$MOCK_DIR"
zip -r Assets.zip assets_temp/ > /dev/null
rm -rf assets_temp
echo "✅ Assets.zip criado ($(du -h Assets.zip | cut -f1))"

# 2. Criar HytaleServer.jar mock
echo ""
echo "☕ Criando HytaleServer.jar mock..."

# Criar diretório temporário para o Java source
JAVA_SRC="$MOCK_DIR/java_temp"
mkdir -p "$JAVA_SRC"

# Criar um servidor Java simples que simula o Hytale
cat > "$JAVA_SRC/MockHytaleServer.java" << 'JAVA'
import java.io.*;
import java.net.*;
import java.util.*;
import java.text.SimpleDateFormat;

public class MockHytaleServer {
    private static boolean running = true;
    private static BufferedReader consoleReader;
    
    public static void main(String[] args) throws Exception {
        System.out.println("=".repeat(60));
        System.out.println("  MOCK HYTALE SERVER - For Testing Only");
        System.out.println("=".repeat(60));
        System.out.println();
        
        // Parse arguments
        String assetsPath = "/data/Assets.zip";
        String bindAddress = "0.0.0.0:5520";
        String authMode = "authenticated";
        boolean disableSentry = false;
        
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals("--assets") && i + 1 < args.length) {
                assetsPath = args[++i];
            } else if (args[i].equals("--bind") && i + 1 < args.length) {
                bindAddress = args[++i];
            } else if (args[i].equals("--auth-mode") && i + 1 < args.length) {
                authMode = args[++i];
            } else if (args[i].equals("--disable-sentry")) {
                disableSentry = true;
            }
        }
        
        log("Starting Mock Hytale Server...");
        log("Assets: " + assetsPath);
        log("Bind Address: " + bindAddress);
        log("Auth Mode: " + authMode);
        log("Sentry: " + (disableSentry ? "DISABLED" : "ENABLED"));
        System.out.println();
        
        // Simular carregamento
        log("Loading assets...");
        Thread.sleep(1000);
        File assetsFile = new File(assetsPath);
        if (assetsFile.exists()) {
            log("Assets loaded successfully (" + (assetsFile.length() / 1024 / 1024) + " MB)");
        } else {
            log("WARNING: Assets file not found: " + assetsPath);
        }
        
        Thread.sleep(500);
        log("Initializing game engine...");
        Thread.sleep(800);
        log("Loading plugins...");
        Thread.sleep(500);
        log("Starting network server on " + bindAddress + "...");
        Thread.sleep(300);
        
        System.out.println();
        if (authMode.equals("authenticated")) {
            log("Server requires authentication!");
            log("Please authenticate using: /auth login device");
        } else {
            log("Server running in OFFLINE mode");
        }
        
        System.out.println();
        log("Server is ready! Type 'help' for commands.");
        System.out.println();
        
        // Console input handler
        consoleReader = new BufferedReader(new InputStreamReader(System.in));
        
        // Simular alguns eventos do servidor
        startEventSimulator();
        
        // Console loop
        while (running) {
            try {
                if (System.in.available() > 0) {
                    String line = consoleReader.readLine();
                    if (line != null) {
                        handleCommand(line.trim());
                    }
                }
                Thread.sleep(100);
            } catch (Exception e) {
                // Continue
            }
        }
        
        log("Server stopped.");
    }
    
    private static void handleCommand(String command) {
        System.out.println("> " + command);
        
        if (command.isEmpty()) return;
        
        String[] parts = command.split(" ");
        String cmd = parts[0].toLowerCase();
        
        switch (cmd) {
            case "/auth":
                if (parts.length > 1 && parts[1].equals("login") && parts.length > 2 && parts[2].equals("device")) {
                    handleAuthDevice();
                } else if (parts.length > 1 && parts[1].equals("status")) {
                    log("Authentication Status: AUTHENTICATED");
                    log("Mode: OAUTH_DEVICE");
                    log("Account: test@example.com");
                } else {
                    log("Usage: /auth login device | /auth status");
                }
                break;
                
            case "/stop":
                log("Stopping server...");
                running = false;
                break;
                
            case "help":
                System.out.println("Available commands:");
                System.out.println("  /auth login device - Authenticate server");
                System.out.println("  /auth status       - Check auth status");
                System.out.println("  /list              - List online players");
                System.out.println("  /say <message>     - Broadcast message");
                System.out.println("  /stop              - Stop server");
                System.out.println("  help               - Show this help");
                break;
                
            case "/list":
                log("Online players (0/20):");
                log("  (No players online)");
                break;
                
            case "/say":
                if (parts.length > 1) {
                    String message = command.substring(5);
                    log("[SERVER] " + message);
                } else {
                    log("Usage: /say <message>");
                }
                break;
                
            default:
                log("Unknown command: " + command);
                log("Type 'help' for available commands");
        }
    }
    
    private static void handleAuthDevice() {
        System.out.println("=".repeat(60));
        System.out.println("DEVICE AUTHORIZATION");
        System.out.println("=".repeat(60));
        System.out.println("Visit: https://accounts.hytale.com/device");
        System.out.println("Enter code: " + generateCode());
        System.out.println("Or visit: https://accounts.hytale.com/device?user_code=" + generateCode());
        System.out.println("=".repeat(60));
        System.out.println("Waiting for authorization (expires in 900 seconds)...");
        
        new Thread(() -> {
            try {
                Thread.sleep(5000);
                System.out.println();
                log("Authentication successful! Mode: OAUTH_DEVICE");
                System.out.println();
            } catch (Exception e) {}
        }).start();
    }
    
    private static String generateCode() {
        Random rand = new Random();
        return String.format("%04d-%04d", 
            rand.nextInt(10000), 
            rand.nextInt(10000));
    }
    
    private static void startEventSimulator() {
        new Thread(() -> {
            try {
                Random rand = new Random();
                while (running) {
                    Thread.sleep(30000 + rand.nextInt(30000)); // 30-60s
                    
                    int event = rand.nextInt(5);
                    switch (event) {
                        case 0:
                            log("Auto-save completed");
                            break;
                        case 1:
                            log("Garbage collection took " + (10 + rand.nextInt(40)) + "ms");
                            break;
                        case 2:
                            log("Loaded 0 chunks in 0ms");
                            break;
                        case 3:
                            log("Server is running " + (rand.nextInt(10) + 90) + "% of expected tick rate");
                            break;
                    }
                }
            } catch (Exception e) {}
        }).start();
    }
    
    private static void log(String message) {
        String timestamp = new SimpleDateFormat("HH:mm:ss").format(new Date());
        System.out.println("[" + timestamp + "] [INFO] " + message);
    }
}
JAVA

# Compilar o Java
echo "   Compilando código Java..."
javac "$JAVA_SRC/MockHytaleServer.java" 2>/dev/null || {
    echo "   ⚠️  Java compiler não encontrado. Baixando JDK..."
    echo "   Por favor, instale o JDK manualmente: sudo apt install default-jdk"
    echo "   Continuando sem compilar..."
}

if [ -f "$JAVA_SRC/MockHytaleServer.class" ]; then
    # Criar JAR
    cd "$JAVA_SRC"
    
    # Criar manifest
    cat > MANIFEST.MF << 'MANIFEST'
Manifest-Version: 1.0
Main-Class: MockHytaleServer

MANIFEST
    
    jar cvfm "$MOCK_DIR/HytaleServer.jar" MANIFEST.MF MockHytaleServer.class > /dev/null
    cd "$MOCK_DIR"
    rm -rf java_temp
    echo "✅ HytaleServer.jar criado ($(du -h HytaleServer.jar | cut -f1))"
else
    echo "⚠️  Não foi possível compilar. Criando JAR vazio..."
    cd "$MOCK_DIR"
    echo "Mock JAR" > mock.txt
    jar cf HytaleServer.jar mock.txt
    rm mock.txt
    rm -rf java_temp
    echo "✅ HytaleServer.jar mock criado ($(du -h HytaleServer.jar | cut -f1))"
fi

# 3. Criar arquivo AOT mock (opcional)
echo ""
echo "⚡ Criando HytaleServer.aot mock..."
dd if=/dev/zero of="$MOCK_DIR/HytaleServer.aot" bs=1M count=10 2>/dev/null
echo "✅ HytaleServer.aot criado ($(du -h HytaleServer.aot | cut -f1))"

# 4. Criar arquivo de bundle completo
echo ""
echo "📦 Criando bundle completo..."
cd "$MOCK_DIR"
zip -r hytale-mock-bundle.zip HytaleServer.jar Assets.zip HytaleServer.aot > /dev/null
echo "✅ hytale-mock-bundle.zip criado ($(du -h hytale-mock-bundle.zip | cut -f1))"

echo ""
echo "=============================================="
echo "  ✅ Arquivos mock criados com sucesso!"
echo "=============================================="
echo ""
echo "📂 Arquivos gerados em: $MOCK_DIR"
echo ""
ls -lh "$MOCK_DIR"
echo ""
echo "📖 Como usar:"
echo ""
echo "   1. Acesse http://localhost:3000"
echo "   2. Crie um novo servidor"
echo "   3. Faça upload de: $MOCK_DIR/hytale-mock-bundle.zip"
echo "   4. Ou faça upload individual dos arquivos:"
echo "      - HytaleServer.jar"
echo "      - Assets.zip"
echo "      - HytaleServer.aot (opcional)"
echo ""
echo "🎮 O servidor mock aceita comandos:"
echo "   - /auth login device"
echo "   - /list"
echo "   - /say <mensagem>"
echo "   - help"
echo ""
