import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const LaboratoryConfig = ({ open, onClose, onSuccess }) => {
  const [labName, setLabName] = useState('');
  const [maxDevices, setMaxDevices] = useState(50);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Carregar configurações atuais
  useEffect(() => {
    if (open) {
      loadCurrentConfig();
    }
  }, [open]);

  const loadCurrentConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/config');
      if (response.data.status === 'success') {
        const { lab_name, max_devices } = response.data.data;
        setLabName(lab_name || '');
        setMaxDevices(max_devices || 50);
      }
    } catch (err) {
      setError('Erro ao carregar configurações do laboratório');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!labName.trim()) {
      setError('Nome do laboratório é obrigatório');
      return;
    }

    if (maxDevices <= 0) {
      setError('Número máximo de dispositivos deve ser maior que zero');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await api.post('/config', {
        lab_name: labName.trim(),
        max_devices: parseInt(maxDevices)
      });

      if (response.data.status === 'success') {
        toast.success('Configurações salvas com sucesso!');
        onSuccess && onSuccess();
        onClose();
      } else {
        setError(response.data.error || 'Erro ao salvar configurações');
      }
    } catch (err) {
      setError('Erro ao salvar configurações');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          ⚙️ Configuração do Laboratório
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Nome do Laboratório"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Ex: Laboratório de Computação"
                helperText="Nome que aparecerá no cabeçalho da interface"
              />

              <TextField
                label="Número Máximo de Dispositivos"
                type="number"
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                fullWidth
                variant="outlined"
                inputProps={{ min: 1, max: 1000 }}
                helperText="Número total de máquinas que o laboratório pode ter"
              />

              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                  📋 <strong>Nota:</strong> O nome do laboratório será detectado automaticamente 
                  dos usuários ativos se não for configurado manualmente.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={saving}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading || saving || !labName.trim()}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LaboratoryConfig;
