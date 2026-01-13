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
