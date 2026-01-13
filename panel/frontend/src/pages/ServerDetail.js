import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Square, RefreshCw, Trash2, Files, Terminal, FileText, Settings } from 'lucide-react';
import { serversAPI } from '../api';

function ServerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [server, setServer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServer();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadServer = async () => {
    try {
      const response = await serversAPI.getById(id);
      setServer(response.data);
      loadStats();
    } catch (error) {
      console.error('Erro ao carregar servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await serversAPI.getStats(id);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleAction = async (action) => {
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
        case 'delete':
          if (window.confirm('Tem certeza que deseja deletar este servidor?')) {
            const removeData = window.confirm('Remover também os dados do servidor?');
            await serversAPI.delete(id, removeData);
            navigate('/');
          }
          break;
        default:
          break;
      }
      loadServer();
    } catch (error) {
      alert('Erro ao executar ação: ' + error.message);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!server) {
    return <div>Servidor não encontrado</div>;
  }

  const isRunning = server.state.Status === 'running';

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Voltar
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{server.name}</h1>
            <span className={`server-status ${isRunning ? 'running' : 'stopped'}`}>
              {isRunning ? '● Rodando' : '● Parado'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isRunning ? (
              <button className="btn btn-danger" onClick={() => handleAction('stop')}>
                <Square size={18} /> Parar
              </button>
            ) : (
              <button className="btn btn-success" onClick={() => handleAction('start')}>
                <Play size={18} /> Iniciar
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => handleAction('restart')}>
              <RefreshCw size={18} /> Reiniciar
            </button>
            <button className="btn btn-danger" onClick={() => handleAction('delete')}>
              <Trash2 size={18} /> Deletar
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="card">
          <h2>Estatísticas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ color: '#888', fontSize: '14px' }}>Uso de CPU</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stats.cpu ? '~%' : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ color: '#888', fontSize: '14px' }}>Uso de Memória</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stats.memory ? `${(stats.memory.usage / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <Link to={`/server/${id}/files`} className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <Files size={32} style={{ marginBottom: '12px', color: '#4a9eff' }} />
          <h3>Gerenciador de Arquivos</h3>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Visualizar, editar e gerenciar arquivos do servidor
          </p>
        </Link>

        <Link to={`/server/${id}/console`} className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <Terminal size={32} style={{ marginBottom: '12px', color: '#4a9eff' }} />
          <h3>Console</h3>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Executar comandos no servidor
          </p>
        </Link>

        <Link to={`/server/${id}/logs`} className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <FileText size={32} style={{ marginBottom: '12px', color: '#4a9eff' }} />
          <h3>Logs</h3>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Visualizar logs do servidor em tempo real
          </p>
        </Link>

        <Link to={`/server/${id}/settings`} className="card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <Settings size={32} style={{ marginBottom: '12px', color: '#4a9eff' }} />
          <h3>Configurações</h3>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Ajustar configurações do servidor
          </p>
        </Link>
      </div>
    </div>
  );
}

export default ServerDetail;
