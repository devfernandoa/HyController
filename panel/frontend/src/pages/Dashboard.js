import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Server, Play, Square, RefreshCw } from 'lucide-react';
import { serversAPI } from '../api';

function CreateServerModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    port: '5520',
    memoryMin: '2G',
    memoryMax: '4G',
    authMode: 'authenticated',
    disableSentry: false,
    enableAOT: false,
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Por favor, selecione um arquivo ZIP com os arquivos do servidor');
      return;
    }
    
    setLoading(true);

    try {
      const data = new FormData();
      
      // Add all form fields except the file
      data.append('name', formData.name);
      data.append('port', formData.port);
      data.append('memoryMin', formData.memoryMin);
      data.append('memoryMax', formData.memoryMax);
      data.append('authMode', formData.authMode);
      data.append('disableSentry', formData.disableSentry.toString());
      data.append('enableAOT', formData.enableAOT.toString());
      
      // Add the file
      data.append('bundle', file);
      
      // Debug: log what we're sending
      console.log('File to upload:', file);
      console.log('FormData entries:');
      for (let pair of data.entries()) {
        console.log(pair[0], pair[1]);
      }

      await serversAPI.create(data);
      onCreated();
      onClose();
    } catch (error) {
      alert('Erro ao criar servidor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Criar Novo Servidor</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Servidor</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Porta UDP</label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              min="1"
              max="65535"
              required
            />
          </div>

          <div className="form-group">
            <label>Memória Mínima</label>
            <input
              type="text"
              value={formData.memoryMin}
              onChange={(e) => setFormData({ ...formData, memoryMin: e.target.value })}
              placeholder="2G"
              required
            />
          </div>

          <div className="form-group">
            <label>Memória Máxima</label>
            <input
              type="text"
              value={formData.memoryMax}
              onChange={(e) => setFormData({ ...formData, memoryMax: e.target.value })}
              placeholder="4G"
              required
            />
          </div>

          <div className="form-group">
            <label>Modo de Autenticação</label>
            <select
              value={formData.authMode}
              onChange={(e) => setFormData({ ...formData, authMode: e.target.value })}
            >
              <option value="authenticated">Autenticado</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.disableSentry}
                onChange={(e) => setFormData({ ...formData, disableSentry: e.target.checked })}
              />
              {' '}Desabilitar Sentry
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.enableAOT}
                onChange={(e) => setFormData({ ...formData, enableAOT: e.target.checked })}
              />
              {' '}Habilitar Cache AOT
            </label>
          </div>

          <div className="form-group">
            <label>Upload de Arquivos do Servidor (ZIP) *</label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <small style={{ color: '#888' }}>
              Obrigatório: ZIP contendo HytaleServer.jar e Assets.zip
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const loadServers = async () => {
    try {
      const response = await serversAPI.getAll();
      setServers(response.data);
    } catch (error) {
      console.error('Erro ao carregar servidores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  const handleServerAction = async (id, action) => {
    try {
      switch (action) {
        case 'start':
          await serversAPI.start(id);
          break;
        case 'stop':
          await serversAPI.stop(id);
          break;
        case 'restart':
          await serversAPI.restart(id);
          break;
        default:
          break;
      }
      loadServers();
    } catch (error) {
      alert('Erro ao executar ação: ' + error.message);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Servidores Hytale</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Criar Servidor
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Server size={64} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
          <h2>Nenhum servidor configurado</h2>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            Crie seu primeiro servidor Hytale para começar
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Criar Primeiro Servidor
          </button>
        </div>
      ) : (
        <div className="server-list">
          {servers.map((server) => (
            <div key={server.id} className="server-card" onClick={() => navigate(`/server/${server.id}`)}>
              <h3>{server.name}</h3>
              <span className={`server-status ${server.state === 'running' ? 'running' : 'stopped'}`}>
                {server.state === 'running' ? '● Rodando' : '● Parado'}
              </span>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>
                {server.status}
              </p>
              <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                {server.state === 'running' ? (
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleServerAction(server.id, 'stop')}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Square size={14} /> Parar
                  </button>
                ) : (
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleServerAction(server.id, 'start')}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Play size={14} /> Iniciar
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleServerAction(server.id, 'restart')}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <RefreshCw size={14} /> Reiniciar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateServerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadServers}
      />
    </div>
  );
}

export default Dashboard;
