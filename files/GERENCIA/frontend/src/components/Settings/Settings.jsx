import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Settings.css';

const Settings = () => {
    const [labName, setLabName] = useState('');
    const [maxDevices, setMaxDevices] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await api.get('/config');
                setLabName(response.data.labName || 'Laboratório Padrão');
                setMaxDevices(response.data.maxDevices || 50);
                setIsLoading(false);
            } catch (err) {
                setError('Falha ao carregar a configuração.');
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const config = {
                labName,
                maxDevices: parseInt(maxDevices, 10),
            };
            await api.put('/config', config);
            setSuccess('Configuração salva com sucesso!');
        } catch (err) {
            setError('Falha ao salvar a configuração. Verifique o backend.');
        }
    };

    if (isLoading) {
        return <div className="settings-container">Carregando...</div>;
    }

    return (
        <div className="settings-container">
            <h2>Configurações do Laboratório</h2>
            {error && <div className="settings-error">{error}</div>}
            {success && <div className="settings-success">{success}</div>}
            <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                    <label htmlFor="labName">Nome do Laboratório</label>
                    <input
                        type="text"
                        id="labName"
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        placeholder="Ex: Laboratório de Informática"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="maxDevices">Número Máximo de Dispositivos</label>
                    <input
                        type="number"
                        id="maxDevices"
                        value={maxDevices}
                        onChange={(e) => setMaxDevices(e.target.value)}
                        placeholder="Ex: 50"
                        required
                    />
                </div>
                <button type="submit" className="save-button">
                    Salvar Alterações
                </button>
            </form>
        </div>
    );
};

export default Settings;
