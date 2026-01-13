import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { serversAPI } from '../api';

function Settings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    port: '5520',
    bindAddress: '0.0.0.0',
    memoryMin: '2G',
    memoryMax: '4G',
    authMode: 'authenticated',
    assetsPath: '/data/Assets.zip',
    disableSentry: false,
    enableAOT: false,
    enableBackup: false,
    backupFrequency: '30',
    backupDir: '/data/backups',
    extraJVMArgs: '',
    extraServerArgs: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await serversAPI.getSettings(id);
      setSettings({
        ...settings,
        ...response.data
      });
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await serversAPI.updateSettings(id, {
        name: settings.name,
        memoryMin: settings.memoryMin,
        memoryMax: settings.memoryMax,
        port: parseInt(settings.port),
        authMode: settings.authMode,
        disableSentry: settings.disableSentry,
        enableAOT: settings.enableAOT,
        jvmArgs: settings.extraJVMArgs.split(' ').filter(Boolean)
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(`/server/${id}`)} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Voltar
      </button>

      <div className="card">
        <h2>Configurações do Servidor</h2>
        
        <div style={{ 
          padding: '12px', 
          background: '#2a2a2a', 
          borderRadius: '6px', 
          marginBottom: '24px',
          color: '#ffa726'
        }}>
          ⚠️ <strong>Aviso:</strong> Alterar essas configurações requer reiniciar o servidor. 
          Considere parar o servidor antes de fazer mudanças.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label>Nome do Servidor (Label)</label>
            <input
              type="text"
              value={settings.name || ''}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Porta UDP</label>
            <input
              type="number"
              value={settings.port}
              onChange={(e) => setSettings({ ...settings, port: e.target.value })}
              min="1"
              max="65535"
            />
            <small style={{ color: '#888' }}>Porta para conexões QUIC/UDP (padrão: 5520)</small>
          </div>

          <div className="form-group">
            <label>Endereço de Bind</label>
            <input
              type="text"
              value={settings.bindAddress}
              onChange={(e) => setSettings({ ...settings, bindAddress: e.target.value })}
            />
            <small style={{ color: '#888' }}>Deixe 0.0.0.0 para aceitar de qualquer IP</small>
          </div>

          <div className="form-group">
            <label>Modo de Autenticação</label>
            <select
              value={settings.authMode}
              onChange={(e) => setSettings({ ...settings, authMode: e.target.value })}
            >
              <option value="authenticated">Autenticado</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="form-group">
            <label>Memória Mínima (Xms)</label>
            <input
              type="text"
              value={settings.memoryMin}
              onChange={(e) => setSettings({ ...settings, memoryMin: e.target.value })}
              placeholder="2G"
            />
            <small style={{ color: '#888' }}>Ex: 1G, 2048M, 2G</small>
          </div>

          <div className="form-group">
            <label>Memória Máxima (Xmx)</label>
            <input
              type="text"
              value={settings.memoryMax}
              onChange={(e) => setSettings({ ...settings, memoryMax: e.target.value })}
              placeholder="4G"
            />
            <small style={{ color: '#888' }}>Ex: 4G, 4096M, 8G</small>
          </div>

          <div className="form-group">
            <label>Caminho dos Assets</label>
            <input
              type="text"
              value={settings.assetsPath}
              onChange={(e) => setSettings({ ...settings, assetsPath: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings.disableSentry}
                onChange={(e) => setSettings({ ...settings, disableSentry: e.target.checked })}
              />
              {' '}Desabilitar Sentry
            </label>
            <small style={{ color: '#888', display: 'block', marginTop: '8px' }}>
              Desabilite durante desenvolvimento de plugins
            </small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings.enableAOT}
                onChange={(e) => setSettings({ ...settings, enableAOT: e.target.checked })}
              />
              {' '}Habilitar Cache AOT
            </label>
            <small style={{ color: '#888', display: 'block', marginTop: '8px' }}>
              Melhora tempo de boot (requer HytaleServer.aot)
            </small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings.enableBackup}
                onChange={(e) => setSettings({ ...settings, enableBackup: e.target.checked })}
              />
              {' '}Habilitar Backups Automáticos
            </label>
          </div>

          {settings.enableBackup && (
            <>
              <div className="form-group">
                <label>Frequência de Backup (minutos)</label>
                <input
                  type="number"
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Diretório de Backup</label>
                <input
                  type="text"
                  value={settings.backupDir}
                  onChange={(e) => setSettings({ ...settings, backupDir: e.target.value })}
                />
              </div>
            </>
          )}
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Argumentos JVM Extras (Avançado)</label>
          <input
            type="text"
            value={settings.extraJVMArgs}
            onChange={(e) => setSettings({ ...settings, extraJVMArgs: e.target.value })}
            placeholder="-XX:+UseG1GC -XX:MaxGCPauseMillis=200"
          />
          <small style={{ color: '#888' }}>
            Argumentos adicionais para a JVM. Use com cuidado!
          </small>
        </div>

        <div className="form-group">
          <label>Argumentos do Servidor Extras (Avançado)</label>
          <input
            type="text"
            value={settings.extraServerArgs}
            onChange={(e) => setSettings({ ...settings, extraServerArgs: e.target.value })}
            placeholder="--custom-arg value"
          />
          <small style={{ color: '#888' }}>
            Argumentos adicionais para o servidor Hytale
          </small>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#1a3a4a', borderRadius: '6px' }}>
          <strong>Comando Java que será executado:</strong>
          <code style={{ 
            display: 'block', 
            marginTop: '12px', 
            padding: '12px', 
            background: '#0a0a0a', 
            borderRadius: '6px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: '12px'
          }}>
            {`java -Xms${settings.memoryMin} -Xmx${settings.memoryMax}${settings.enableAOT ? ' -XX:AOTCache=/data/HytaleServer.aot' : ''}${settings.extraJVMArgs ? ' ' + settings.extraJVMArgs : ''} -jar /data/HytaleServer.jar --assets ${settings.assetsPath} --bind ${settings.bindAddress}:${settings.port} --auth-mode ${settings.authMode}${settings.disableSentry ? ' --disable-sentry' : ''}${settings.enableBackup ? ` --backup --backup-frequency ${settings.backupFrequency} --backup-dir ${settings.backupDir}` : ''}${settings.extraServerArgs ? ' ' + settings.extraServerArgs : ''}`}
          </code>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/server/${id}`)}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
