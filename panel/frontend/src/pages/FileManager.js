import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder, File, Download, Trash2, Edit, Plus } from 'lucide-react';
import { filesAPI } from '../api';

function FileManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState('/data');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await filesAPI.list(id, currentPath);
      setFiles(response.data.files);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file) => {
    if (file.isDirectory) {
      setCurrentPath(`${currentPath}/${file.name}`.replace('//', '/'));
    } else {
      try {
        const response = await filesAPI.getContent(id, `${currentPath}/${file.name}`);
        setFileContent(response.data.content);
        setEditingFile(file.name);
      } catch (error) {
        alert('Erro ao abrir arquivo: ' + error.message);
      }
    }
  };

  const handleSaveFile = async () => {
    try {
      await filesAPI.setContent(id, `${currentPath}/${editingFile}`, fileContent);
      alert('Arquivo salvo com sucesso!');
      setEditingFile(null);
    } catch (error) {
      alert('Erro ao salvar arquivo: ' + error.message);
    }
  };

  const handleDelete = async (fileName) => {
    if (window.confirm(`Tem certeza que deseja deletar ${fileName}?`)) {
      try {
        await filesAPI.delete(id, `${currentPath}/${fileName}`);
        loadFiles();
      } catch (error) {
        alert('Erro ao deletar: ' + error.message);
      }
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);
      await filesAPI.upload(id, formData);
      loadFiles();
    } catch (error) {
      alert('Erro ao fazer upload: ' + error.message);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nome da pasta:');
    if (!name) return;

    try {
      await filesAPI.mkdir(id, `${currentPath}/${name}`);
      loadFiles();
    } catch (error) {
      alert('Erro ao criar pasta: ' + error.message);
    }
  };

  const goBack = () => {
    if (currentPath === '/data') return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/') || '/data');
  };

  if (editingFile) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => setEditingFile(null)} style={{ marginBottom: '20px' }}>
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="card">
          <h2>Editando: {editingFile}</h2>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            style={{
              width: '100%',
              height: '400px',
              fontFamily: 'monospace',
              padding: '12px',
              background: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              color: '#e0e0e0',
              marginBottom: '12px'
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleSaveFile}>
              Salvar
            </button>
            <button className="btn btn-secondary" onClick={() => setEditingFile(null)}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(`/server/${id}`)} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={18} /> Voltar
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Gerenciador de Arquivos</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleCreateFolder}>
              <Plus size={18} /> Nova Pasta
            </button>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Plus size={18} /> Upload
              <input type="file" style={{ display: 'none' }} onChange={handleUpload} />
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentPath !== '/data' && (
            <button className="btn btn-secondary" onClick={goBack}>
              <ArrowLeft size={18} /> Voltar
            </button>
          )}
          <div style={{ color: '#888' }}>Caminho: {currentPath}</div>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="file-list">
            {files.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                Pasta vazia
              </div>
            ) : (
              files.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-info" onClick={() => handleFileClick(file)}>
                    {file.isDirectory ? (
                      <Folder size={20} color="#4a9eff" />
                    ) : (
                      <File size={20} color="#888" />
                    )}
                    <div>
                      <div>{file.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {file.size} • {file.modified}
                      </div>
                    </div>
                  </div>
                  <div className="file-actions">
                    {!file.isDirectory && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => handleFileClick(file)}
                      >
                        <Edit size={14} /> Editar
                      </button>
                    )}
                    <button 
                      className="btn btn-danger" 
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => handleDelete(file.name)}
                    >
                      <Trash2 size={14} /> Deletar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FileManager;
