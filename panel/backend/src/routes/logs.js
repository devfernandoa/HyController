import express from 'express';
import docker from '../utils/docker.js';
import { wss } from '../server.js';

const router = express.Router();

// Get container logs
router.get('/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { tail = 100, follow = false } = req.query;
    
    const container = docker.getContainer(serverId);
    
    if (follow === 'true') {
      // Stream logs via WebSocket
      const logStream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: parseInt(tail)
      });
      
      // Broadcast to WebSocket clients
      logStream.on('data', (chunk) => {
        wss.clients.forEach(client => {
          if (client.readyState === 1) { // OPEN
            client.send(JSON.stringify({
              type: 'log',
              serverId,
              data: chunk.toString()
            }));
          }
        });
      });
      
      res.json({ message: 'Streaming logs via WebSocket' });
    } else {
      // Get historical logs
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: parseInt(tail)
      });
      
      res.json({ logs: logs.toString() });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get log files from /data/logs
router.get('/:serverId/files', async (req, res) => {
  try {
    const { serverId } = req.params;
    
    const container = docker.getContainer(serverId);
    const exec = await container.exec({
      Cmd: ['sh', '-c', 'ls -1 /data/logs'],
      AttachStdout: true,
      AttachStderr: true
    });
    
    const stream = await exec.start();
    let output = '';
    
    stream.on('data', data => output += data.toString());
    
    await new Promise(resolve => stream.on('end', resolve));
    
    const files = output.split('\n').filter(f => f.trim());
    
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific log file content
router.get('/:serverId/files/:filename', async (req, res) => {
  try {
    const { serverId, filename } = req.params;
    const { tail = 1000 } = req.query;
    
    const container = docker.getContainer(serverId);
    const exec = await container.exec({
      Cmd: ['sh', '-c', `tail -n ${tail} /data/logs/${filename}`],
      AttachStdout: true,
      AttachStderr: true
    });
    
    const stream = await exec.start();
    let output = '';
    
    stream.on('data', data => output += data.toString());
    
    await new Promise(resolve => stream.on('end', resolve));
    
    res.json({ content: output });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
