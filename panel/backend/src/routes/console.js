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
    
    // Execute command by writing to container's stdin
    const exec = await container.exec({
      Cmd: ['sh', '-c', `echo "${command}" > /proc/1/fd/0`],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true
    });
    
    const stream = await exec.start({ stdin: true });
    
    // Broadcast command to WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'command',
          serverId,
          command
        }));
      }
    });
    
    res.json({ message: 'Command executed', command });
  } catch (error) {
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
