import express from 'express';
import docker from '../utils/docker.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import archiver from 'archiver';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = express.Router();
const upload = multer({ dest: '/tmp/uploads/' });

// Helper to execute commands in container
async function execInContainer(containerId, cmd) {
  const container = docker.getContainer(containerId);
  
  // Check if container is running
  const info = await container.inspect();
  if (!info.State.Running) {
    throw new Error('Container is not running. Please start the server first.');
  }
  
  const exec = await container.exec({
    Cmd: ['sh', '-c', cmd],
    AttachStdout: true,
    AttachStderr: true
  });
  
  const stream = await exec.start();
  
  return new Promise((resolve, reject) => {
    let output = '';
    stream.on('data', data => output += data.toString());
    stream.on('end', () => resolve(output));
    stream.on('error', reject);
  });
}

// List files in directory
router.get('/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path: dirPath = '/data' } = req.query;
    
    const container = docker.getContainer(serverId);
    const info = await container.inspect();
    
    let files = [];
    
    // Get volume name - try from mounts, fallback to container name
    let volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
    if (!volumeName || volumeName === 'undefined') {
      const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
      volumeName = `hytale-${containerName}`;
    }
    
    if (info.State.Running && info.State.Status === 'running') {
      // Use exec if container is running
      const output = await execInContainer(
        serverId,
        `ls -la ${dirPath} | tail -n +4`
      );
      
      files = output.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split(/\s+/);
          const isDir = parts[0].startsWith('d');
          return {
            name: parts.slice(8).join(' '),
            size: parts[4],
            modified: `${parts[5]} ${parts[6]} ${parts[7]}`,
            isDirectory: isDir,
            permissions: parts[0]
          };
        });
    } else {
      // Read directly from volume if container is stopped
      const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
      const fullPath = path.join(volumePath, dirPath.replace('/data', ''));
      
      try {
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        
        files = await Promise.all(entries.map(async (entry) => {
          const stats = await fs.stat(path.join(fullPath, entry.name));
          return {
            name: entry.name,
            size: stats.size.toString(),
            modified: stats.mtime.toISOString(),
            isDirectory: entry.isDirectory(),
            permissions: stats.mode.toString(8)
          };
        }));
      } catch (err) {
        if (err.code === 'ENOENT') {
          files = [];
        } else {
          throw err;
        }
      }
    }
    
    res.json({ path: dirPath, files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read file content
router.get('/:serverId/content', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }
    
    const container = docker.getContainer(serverId);
    const info = await container.inspect();
    
    // Get volume name
    let volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
    if (!volumeName || volumeName === 'undefined') {
      const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
      volumeName = `hytale-${containerName}`;
    }
    
    let content;
    if (info.State.Running && info.State.Status === 'running') {
      try {
        content = await execInContainer(serverId, `cat ${filePath}`);
      } catch (execError) {
        // Fallback to direct volume access
        const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
        const fullPath = path.join(volumePath, filePath.replace('/data/', ''));
        content = await fs.readFile(fullPath, 'utf-8');
      }
    } else {
      // Read directly from volume
      const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
      const fullPath = path.join(volumePath, filePath.replace('/data/', ''));
      content = await fs.readFile(fullPath, 'utf-8');
    }
    
    res.json({ path: filePath, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Write file content
router.put('/:serverId/content', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path: filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'File path and content required' });
    }
    
    const container = docker.getContainer(serverId);
    const info = await container.inspect();
    
    // Get volume name
    let volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
    if (!volumeName || volumeName === 'undefined') {
      const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
      volumeName = `hytale-${containerName}`;
    }
    
    if (info.State.Running && info.State.Status === 'running') {
      try {
        // Use heredoc to avoid escaping issues
        await execInContainer(serverId, `cat > ${filePath} << 'EOFMARKER'
${content}
EOFMARKER`);
      } catch (execError) {
        // Fallback to direct volume access
        const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
        const fullPath = path.join(volumePath, filePath.replace('/data/', ''));
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
      }
    } else {
      // Write directly to volume
      const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
      const fullPath = path.join(volumePath, filePath.replace('/data/', ''));
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
    }
    
    res.json({ message: 'File updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file
router.post('/:serverId/upload', upload.single('file'), async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path: targetPath = '/data' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const container = docker.getContainer(serverId);
    const info = await container.inspect();
    
    // Get volume path - try from mounts, fallback to container name
    let volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
    if (!volumeName || volumeName === 'undefined') {
      const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
      volumeName = `hytale-${containerName}`;
    }
    
    const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
    
    // Clean target path - remove /data prefix and leading slashes
    let cleanPath = targetPath.replace(/^\/data\/?/, '');
    
    // Build destination path
    const destPath = cleanPath 
      ? path.join(volumePath, cleanPath, req.file.originalname)
      : path.join(volumePath, req.file.originalname);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    
    // Copy file
    await fs.copyFile(req.file.path, destPath);
    
    // Clean up
    await fs.unlink(req.file.path);
    
    res.json({ 
      message: 'File uploaded successfully',
      path: destPath.replace(volumePath, '/data')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download file
router.get('/:serverId/download', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }
    
    const container = docker.getContainer(serverId);
    const stream = await container.getArchive({ path: filePath });
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file/directory
router.delete('/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path: targetPath } = req.query;
    
    if (!targetPath || targetPath === '/data') {
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    const container = docker.getContainer(serverId);
    const info = await container.inspect();
    
    // Get volume name
    let volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
    if (!volumeName || volumeName === 'undefined') {
      const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
      volumeName = `hytale-${containerName}`;
    }
    
    if (info.State.Running && info.State.Status === 'running') {
      try {
        await execInContainer(serverId, `rm -rf ${targetPath}`);
      } catch (execError) {
        // Fallback to direct volume access
        const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
        const fullPath = path.join(volumePath, targetPath.replace('/data/', ''));
        await fs.rm(fullPath, { recursive: true, force: true });
      }
    } else {
      // Delete directly from volume
      const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
      const fullPath = path.join(volumePath, targetPath.replace('/data/', ''));
      await fs.rm(fullPath, { recursive: true, force: true });
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create directory
router.post('/:serverId/mkdir', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path: dirPath } = req.body;
    
    console.log('[mkdir] Request:', { serverId, dirPath });
    
    if (!dirPath) {
      return res.status(400).json({ error: 'Directory path required' });
    }
    
    const container = docker.getContainer(serverId);
    const info = await container.inspect();
    
    console.log('[mkdir] Container state:', { 
      Running: info.State.Running, 
      Status: info.State.Status,
      Name: info.Name
    });
    
    // Get volume name first - try from mounts, fallback to container name
    let volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
    
    // If volume name is invalid, derive from container name
    if (!volumeName || volumeName === 'undefined') {
      const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
      volumeName = `hytale-${containerName}`;
      console.log('[mkdir] Derived volume name from container:', volumeName);
    }
    
    console.log('[mkdir] Volume name:', volumeName);
    
    // Only use exec if container is truly running (not restarting, paused, etc)
    if (info.State.Running && info.State.Status === 'running') {
      console.log('[mkdir] Attempting exec method');
      try {
        await execInContainer(serverId, `mkdir -p ${dirPath}`);
        console.log('[mkdir] Success via exec');
      } catch (execError) {
        console.log('[mkdir] Exec failed, using fallback:', execError.message);
        // If exec fails, fallback to direct volume access
        const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
        const fullPath = path.join(volumePath, dirPath.replace('/data/', ''));
        console.log('[mkdir] Creating at:', fullPath);
        await fs.mkdir(fullPath, { recursive: true });
        console.log('[mkdir] Success via fallback');
      }
    } else {
      console.log('[mkdir] Using direct volume access (container not running)');
      // Create directly in volume if container is not running
      const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
      const fullPath = path.join(volumePath, dirPath.replace('/data/', ''));
      console.log('[mkdir] Creating at:', fullPath);
      await fs.mkdir(fullPath, { recursive: true });
      console.log('[mkdir] Success via direct access');
    }
    
    res.json({ message: 'Directory created successfully' });
  } catch (error) {
    console.error('[mkdir] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rename/move file
router.post('/:serverId/rename', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'Old and new paths required' });
    }
    
    await execInContainer(serverId, `mv ${oldPath} ${newPath}`);
    res.json({ message: 'Renamed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create backup
router.post('/:serverId/backup', async (req, res) => {
  try {
    const { serverId } = req.params;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.tar.gz`;
    
    await execInContainer(
      serverId,
      `tar -czf /data/backups/${backupName} --exclude='backups' --exclude='.cache' /data`
    );
    
    res.json({ message: 'Backup created', filename: backupName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
