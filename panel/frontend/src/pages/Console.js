import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { consoleAPI } from '../api';

function Console() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [ws, setWs] = useState(null);
  const outputRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket for real-time console output
    const websocket = new WebSocket(
      process.env.REACT_APP_WS_URL || 'ws://localhost:3001'
    );

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log' && data.serverId === id) {
        setOutput(prev => [...prev, { type: 'output', text: data.data }]);
      } else if (data.type === 'command' && data.serverId === id) {
        setOutput(prev => [...prev, { type: 'command', text: data.command }]);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [id]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    try {
      await consoleAPI.exec(id, command);
      setOutput(prev => [...prev, { type: 'command', text: `> ${command}` }]);
      setCommand('');
    } catch (error) {
      setOutput(prev => [...prev, { 
        type: 'error', 
        text: `Erro: ${error.message}` 
      }]);
    }
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(`/server/${id}`)} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Voltar
      </button>

      <div className="card">
        <h2>Console do Servidor</h2>
        
        <div className="console" ref={outputRef}>
          {output.length === 0 ? (
            <div style={{ color: '#666' }}>
              Console conectado. Digite comandos abaixo.
            </div>
          ) : (
            output.map((line, index) => (
              <div 
                key={index} 
                style={{ 
                  color: line.type === 'command' ? '#4a9eff' : 
                         line.type === 'error' ? '#f44336' : '#e0e0e0',
                  marginBottom: '4px'
                }}
              >
                {line.text}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="console-input">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Digite um comando... (ex: /auth login device)"
            autoFocus
          />
          <button type="submit" className="btn btn-primary">
            <Send size={18} /> Enviar
          </button>
        </form>

        <div style={{ marginTop: '16px', padding: '12px', background: '#2a2a2a', borderRadius: '6px' }}>
          <strong>Dica:</strong> Para autenticar o servidor, use:
          <code style={{ display: 'block', marginTop: '8px', padding: '8px', background: '#0a0a0a', borderRadius: '4px' }}>
            /auth login device
          </code>
        </div>
      </div>
    </div>
  );
}

export default Console;
