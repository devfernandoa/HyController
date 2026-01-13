import express from 'express';
import docker from '../utils/docker.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import extract from 'extract-zip';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = '/tmp/uploads';
fs.mkdir(uploadDir, { recursive: true }).catch(err => {
  console.error('Failed to create upload directory:', err);
});

// Configure multer with size limits (500MB max)
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10000 * 1024 * 1024 // 10GB
  }
});

// List all Hytale servers
router.get('/', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const hytaleServers = containers.filter(c =>
      c.Labels && c.Labels['hycontroller.managed'] === 'true'
    );

    const servers = await Promise.all(hytaleServers.map(async (c) => {
      let displayName = c.Names[0].replace('/', '');

      // Try to get custom name from settings
      try {
        let volumeName = c.Mounts?.find(m => m.Destination === '/data')?.Name;
        if (!volumeName || volumeName === 'undefined') {
          const containerName = c.Names[0].replace('/', '').replace(/^hytale-/, '');
          volumeName = `hytale-${containerName}`;
        }

        if (volumeName && volumeName !== 'undefined') {
          const settingsPath = `/var/lib/docker/volumes/${volumeName}/_data/.hycontroller-settings.json`;
          const settingsData = await fs.readFile(settingsPath, 'utf-8');
          const settings = JSON.parse(settingsData);
          if (settings.name) {
            displayName = settings.name;
          }
        }
      } catch (err) {
        // Settings file doesn't exist, use container name
      }

      return {
        id: c.Id,
        name: displayName,
        state: c.State,
        status: c.Status,
        ports: c.Ports,
        created: c.Created
      };
    }));

    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get server details
router.get('/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const info = await container.inspect();

    let displayName = info.Name.replace('/', '');

    // Try to get custom name from settings
    try {
      let volumeName = info.Mounts?.find(m => m.Destination === '/data')?.Name;
      if (!volumeName || volumeName === 'undefined') {
        const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
        volumeName = `hytale-${containerName}`;
      }

      const settingsPath = `/var/lib/docker/volumes/${volumeName}/_data/.hycontroller-settings.json`;
      const settingsData = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(settingsData);
      if (settings.name) {
        displayName = settings.name;
      }
    } catch (err) {
      // Settings file doesn't exist, use container name
    }

    res.json({
      id: info.Id,
      name: displayName,
      state: info.State,
      config: info.Config,
      hostConfig: info.HostConfig,
      mounts: info.Mounts,
      networkSettings: info.NetworkSettings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new server
router.post('/', upload.single('bundle'), async (req, res) => {
  let volumeCreated = false;
  let volumeName = null;

  try {
    console.log('Create server request received:', {
      body: req.body,
      file: req.file ? { name: req.file.originalname, size: req.file.size } : null
    });

    const {
      name,
      port = 5520,
      memoryMin = '2G',
      memoryMax = '4G',
      authMode = 'authenticated',
      disableSentry = false,
      enableAOT = false
    } = req.body;

    // Convert string booleans to actual booleans (from FormData)
    const disableSentryBool = disableSentry === 'true' || disableSentry === true;
    const enableAOTBool = enableAOT === 'true' || enableAOT === true;

    // Validate required fields
    if (!name) {
      console.error('Validation failed: Server name is required');
      return res.status(400).json({ error: 'Server name is required' });
    }

    if (!req.file) {
      console.error('Validation failed: Server bundle is required');
      return res.status(400).json({ error: 'Server bundle (zip file) is required' });
    }

    // Validate name format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(name)) {
      return res.status(400).json({ error: 'Server name must contain only letters, numbers, and hyphens' });
    }

    // Check if server with same name already exists
    const existingContainers = await docker.listContainers({ all: true });
    const nameExists = existingContainers.some(c =>
      c.Names.includes(`/hytale-${name}`)
    );

    if (nameExists) {
      return res.status(409).json({ error: 'A server with this name already exists' });
    }

    volumeName = `hytale-${name}`;

    // Create volume for server data
    const volume = await docker.createVolume({
      Name: volumeName,
      Labels: {
        'hycontroller.managed': 'true',
        'hycontroller.server': name
      }
    });
    volumeCreated = true;

    // Extract bundle to volume
    const volumePath = `/var/lib/docker/volumes/${volume.Name}/_data`;

    try {
      await extract(req.file.path, { dir: volumePath });
    } catch (extractError) {
      throw new Error(`Failed to extract bundle: ${extractError.message}`);
    } finally {
      // Clean up uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete temporary file:', unlinkError);
      }
    }

    // Verify required files exist
    try {
      await fs.access(`${volumePath}/Assets.zip`);
      await fs.access(`${volumePath}/HytaleServer.jar`);
    } catch (accessError) {
      throw new Error('Bundle is missing required files (Assets.zip or HytaleServer.jar)');
    }

    // Check if runner image exists
    const images = await docker.listImages();
    const runnerImageExists = images.some(img =>
      img.RepoTags && img.RepoTags.some(tag => tag.includes('hycontroller-runner'))
    );

    if (!runnerImageExists) {
      throw new Error('Runner image not found. Please build the runner image first.');
    }

    // Build Java command
    const javaArgs = [
      `-Xms${memoryMin}`,
      `-Xmx${memoryMax}`
    ];

    if (enableAOTBool) {
      javaArgs.push('-XX:AOTCache=/data/HytaleServer.aot');
    }

    const serverArgs = [
      '--assets', '/data/Assets.zip',
      '--bind', `0.0.0.0:${port}`,
      '--auth-mode', authMode
    ];

    if (disableSentryBool) {
      serverArgs.push('--disable-sentry');
    }

    // Create container
    const container = await docker.createContainer({
      Image: 'hycontroller-runner:latest',
      name: `hytale-${name}`,
      Labels: {
        'hycontroller.managed': 'true',
        'hycontroller.server': name
      },
      Env: [
        `JAVA_OPTS=${javaArgs.join(' ')}`,
        `SERVER_ARGS=${serverArgs.join(' ')}`
      ],
      HostConfig: {
        Binds: [`${volume.Name}:/data`],
        PortBindings: {
          [`${port}/udp`]: [{ HostPort: `${port}` }]
        },
        RestartPolicy: {
          Name: 'unless-stopped'
        }
      },
      ExposedPorts: {
        [`${port}/udp`]: {}
      }
    });

    // Save initial settings
    const settings = {
      name,
      memoryMin,
      memoryMax,
      port,
      authMode,
      disableSentry: disableSentryBool,
      enableAOT: enableAOTBool,
      createdAt: new Date().toISOString()
    };

    const settingsPath = `${volumePath}/.hycontroller-settings.json`;
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    res.json({
      id: container.id,
      name: name,
      message: 'Server created successfully'
    });
  } catch (error) {
    console.error('Error creating server:', error);

    // Cleanup on failure
    if (volumeCreated && volumeName) {
      try {
        const volume = docker.getVolume(volumeName);
        await volume.remove({ force: true });
      } catch (cleanupError) {
        console.error('Failed to cleanup volume:', cleanupError);
      }
    }

    // Clean up temporary file if it still exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        // Ignore if already deleted
      }
    }

    res.status(500).json({
      error: error.message || 'Failed to create server',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
router.post('/:id/start', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.start();
    res.json({ message: 'Server started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop server
router.post('/:id/stop', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    res.json({ message: 'Server stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restart server
router.post('/:id/restart', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.restart();
    res.json({ message: 'Server restarted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete server
router.delete('/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const info = await container.inspect();

    // Stop container if running
    if (info.State.Running) {
      await container.stop();
    }

    // Remove container
    await container.remove();

    // Optionally remove volume
    if (req.query.removeData === 'true') {
      const volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
      if (volumeName) {
        const volume = docker.getVolume(volumeName);
        await volume.remove();
      }
    }

    res.json({ message: 'Server deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get server stats
router.get('/:id/stats', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const stats = await container.stats({ stream: false });

    res.json({
      cpu: stats.cpu_stats,
      memory: stats.memory_stats,
      networks: stats.networks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update server settings
router.put('/:id/settings', async (req, res) => {
  try {
    const {
      name,
      memoryMin,
      memoryMax,
      port,
      authMode,
      disableSentry,
      enableAOT,
      jvmArgs = []
    } = req.body;

    const container = docker.getContainer(req.params.id);
    const info = await container.inspect();

    // Get volume name - try from mounts, fallback to container name
    let volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
    if (!volumeName || volumeName === 'undefined') {
      const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
      volumeName = `hytale-${containerName}`;
    }

    // Create settings object
    const settings = {
      name: name || info.Name.replace(/^\//, '').replace(/^hytale-/, ''),
      memoryMin: memoryMin || '2G',
      memoryMax: memoryMax || '4G',
      port: port || 5520,
      authMode: authMode || 'authenticated',
      disableSentry: disableSentry || false,
      enableAOT: enableAOT || false,
      jvmArgs: jvmArgs,
      updatedAt: new Date().toISOString()
    };

    // Save settings to volume
    const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
    const settingsPath = `${volumePath}/.hycontroller-settings.json`;

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));

    // If container is running, need to restart for changes to take effect
    if (info.State.Running) {
      await container.restart();
    }

    res.json({
      message: 'Settings updated successfully',
      settings,
      requiresRestart: !info.State.Running
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get server settings
router.get('/:id/settings', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const info = await container.inspect();

    // Get volume name - try from mounts, fallback to container name
    let volumeName = info.Mounts.find(m => m.Destination === '/data')?.Name;
    if (!volumeName || volumeName === 'undefined') {
      const containerName = info.Name.replace(/^\//, '').replace(/^hytale-/, '');
      volumeName = `hytale-${containerName}`;
    }

    // Read settings from volume
    const volumePath = `/var/lib/docker/volumes/${volumeName}/_data`;
    const settingsPath = `${volumePath}/.hycontroller-settings.json`;

    let settings = {
      name: info.Name.replace(/^\//, '').replace(/^hytale-/, ''),
      memoryMin: '2G',
      memoryMax: '4G',
      port: 5520,
      authMode: 'authenticated',
      disableSentry: false,
      enableAOT: false,
      jvmArgs: []
    };

    try {
      const data = await fs.readFile(settingsPath, 'utf-8');
      settings = JSON.parse(data);
    } catch (err) {
      // Settings file doesn't exist yet, return defaults
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
