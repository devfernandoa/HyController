import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { logsAPI } from '../api';

function Logs() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState('');
  const [logFiles, setLogFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logsRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    loadLogFiles();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [autoRefresh]);

  useEffect(() => {
    if (selectedFile) {
      loadLogFile(selectedFile);
    } else {
      loadLiveLogs();
    }
  }, [selectedFile]);

  const loadLogFiles = async () => {
    try {
      const response = await logsAPI.getFiles(id);
      setLogFiles(response.data.files);
    } catch (error) {
      console.error('Erro ao carregar arquivos de log:', error);
    }
  };

  const loadLiveLogs = async () => {
    try {
      const response = await logsAPI.get(id, 200);
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  const loadLogFile = async (filename) => {
    try {
      const response = await logsAPI.getFileContent(id, filename, 1000);
      setLogs(response.data.content);
    } catch (error) {
      console.error('Erro ao carregar arquivo de log:', error);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(
      process.env.REACT_APP_WS_URL || 'ws://localhost:3001'
    );

    ws.onopen = () => {
      console.log('WebSocket connected for logs');
      logsAPI.get(id, 100, true); // Start streaming
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log' && data.serverId === id) {
        setLogs(prev => prev + '\n' + data.data);
        if (logsRef.current) {
          logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
      }
    };

    wsRef.current = ws;
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(`/server/${id}`)} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Voltar
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Logs do Servidor</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Atualização automática
            </label>
            <button 
              className="btn btn-secondary" 
              onClick={() => selectedFile ? loadLogFile(selectedFile) : loadLiveLogs()}
            >
              <RefreshCw size={18} /> Atualizar
            </button>
          </div>
        </div>

        {logFiles.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Arquivo de log:</label>
            <select 
              value={selectedFile || ''}
              onChange={(e) => setSelectedFile(e.target.value || null)}
              style={{ 
                padding: '8px', 
                borderRadius: '6px', 
                background: '#2a2a2a', 
                border: '1px solid #3a3a3a',
                color: '#e0e0e0'
              }}
            >
              <option value="">Log ao vivo</option>
              {logFiles.map(file => (
                <option key={file} value={file}>{file}</option>
              ))}
            </select>
          </div>
        )}

        <div 
          ref={logsRef}
          style={{
            background: '#0a0a0a',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '13px',
            height: '600px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {logs || 'Nenhum log disponível'}
        </div>
      </div>
    </div>
  );
}

export default Logs;
