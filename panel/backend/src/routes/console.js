import express from 'express';
import docker from '../utils/docker.js';
import { wss } from '../server.js';

const router = express.Router();

// Execute command in server console
router.post('/:serverId/exec', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command required' });
    }
    
    const container = docker.getContainer(serverId);
    
    // Check if container is running
    const info = await container.inspect();
    if (!info.State.Running) {
      return res.status(400).json({ error: 'Container is not running' });
    }
    
    // Use docker attach to send command directly to stdin
    // This works because we create containers with OpenStdin: true and Tty: true
    const attachOptions = {
      stream: true,
      stdin: true,
      stdout: false,
      stderr: false
    };
    
    const stream = await container.attach(attachOptions);
    
    // Send command followed by newline
    stream.write(`${command}\n`);
    
    // End the stream
    stream.end();
    
    // Broadcast command to WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'command',
          serverId,
          command,
          status: 'sent'
        }));
      }
    });
    
    res.json({ 
      message: 'Command sent to server console', 
      command
    });
  } catch (error) {
    console.error('Error executing console command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get command history
router.get('/:serverId/history', async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // In a real implementation, store command history in a database
    // For now, return empty array
    res.json({ history: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
