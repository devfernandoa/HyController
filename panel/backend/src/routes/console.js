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
    
    // Write command to the console pipe (named pipe created in entrypoint.sh)
    const exec = await container.exec({
      Cmd: ['sh', '-c', `echo "${command.replace(/"/g, '\\"')}" > /tmp/console.pipe`],
      AttachStdout: true,
      AttachStderr: true,
      Tty: false
    });
    
    const stream = await exec.start({ hijack: false, stdin: false });
    
    let output = '';
    stream.on('data', (chunk) => {
      output += chunk.toString();
    });

    await new Promise((resolve) => {
      stream.on('end', resolve);
    });
    
    // Wait a bit for the command to be processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
      message: 'Command sent to console', 
      command,
      status: 'sent to pipe'
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
