# 🖥️ Sistema de Gerenciamento Laboratorial - Modificações Implementadas

## 📋 Resumo das Modificações

Este documento descreve as modificações implementadas no sistema para atender aos requisitos solicitados:

### ✅ **Requisitos Atendidos:**

1. **Detecção Automática do Nome do Laboratório**: Baseada nos dados do `list_users.sh` e `maquinas.txt`
2. **Configuração do Número Máximo de Dispositivos**: Definida pelo usuário e persistida no banco
3. **Status Atualizado a Cada 5 Segundos**: Intervalo reduzido de 10s para 5s
4. **Interface Melhorada**: Mostra estados das máquinas baseados no `list_users.sh`

---

## 🔧 **Backend - Modificações Implementadas**

### **1. Novo Modelo: LabConfig**
- **Arquivo**: `backend/models/lab_config.py`
- **Funcionalidade**: 
  - Armazena nome do laboratório e número máximo de dispositivos
  - Persistência no banco SQLite
  - Métodos para obter/atualizar configuração

### **2. MachineService Aprimorado**
- **Arquivo**: `backend/services/machine_service.py`
- **Novas Funções**:
  - `detect_lab_name_from_machines()`: Detecta nome automaticamente do `maquinas.txt`
  - `get_lab_config()`: Combina configuração salva + detecção automática
- **Melhorias**:
  - Intervalo de monitoramento: 10s → 5s
  - Melhor parsing do `maquinas.txt`

### **3. Endpoints de Configuração**
- **Arquivo**: `backend/routes/config.py`
- **Endpoints**:
  - `GET /api/config`: Retorna configuração atual
  - `POST /api/config`: Salva/atualiza configuração
- **Integração**: Usa o novo modelo `LabConfig`

---

## 🎨 **Frontend - Modificações Implementadas**

### **1. Componente de Configuração**
- **Arquivo**: `frontend/src/components/Settings/LaboratoryConfig.jsx`
- **Funcionalidades**:
  - Formulário para configurar nome do laboratório
  - Campo para número máximo de dispositivos
  - Validação de dados
  - Integração com API backend

### **2. Interface de Máquinas Aprimorada**
- **Arquivo**: `frontend/src/components/Machines/Machines.jsx`
- **Melhorias**:
  - Carrega configurações do backend na inicialização
  - Mostra nome detectado automaticamente
  - Exibe número máximo de dispositivos configurado
  - Botão "Configurar Lab" para acesso rápido às configurações
  - Atualização automática após salvar configurações

---

## 🔄 **Fluxo de Funcionamento**

### **Detecção Automática do Nome:**
1. Sistema executa `list_users.sh` → gera `maquinas.txt`
2. `maquinas.txt` contém formato: `LAB | USER | IP | MAC`
3. `MachineService` analisa prefixos dos usuários (ex: `labconf`, `labmatica`)
4. Retorna o prefixo mais comum como nome do laboratório
5. Se usuário configurar nome manualmente, usa o configurado

### **Monitoramento em Tempo Real:**
1. Intervalo: 5 segundos (anteriormente 10s)
2. Executa `list_users.sh` para verificar usuários LTSP ativos
3. Atualiza status das máquinas via WebSocket
4. Interface mostra estados online/offline em tempo real

### **Configuração Persistente:**
1. Usuário acessa "Configurar Lab" na interface
2. Define nome e número máximo de dispositivos
3. Dados salvos no banco SQLite via `LabConfig`
4. Interface carrega configurações na próxima inicialização

---

## 🗃️ **Banco de Dados - Nova Tabela**

```sql
CREATE TABLE lab_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_name VARCHAR(100) NOT NULL DEFAULT 'Laboratório',
    max_devices INTEGER NOT NULL DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 **APIs Implementadas**

### **GET /api/config**
```json
{
  "status": "success",
  "data": {
    "lab_name": "LabConf",
    "max_devices": 30
  }
}
```

### **POST /api/config**
```json
{
  "lab_name": "Laboratório de Computação",
  "max_devices": 50
}
```

**Resposta:**
```json
{
  "status": "success",
  "data": {
    "lab_name": "Laboratório de Computação",
    "max_devices": 50
  },
  "message": "Configuração atualizada com sucesso"
}
```

---

## 🧪 **Como Testar**

### **1. Iniciar o Sistema:**
```bash
# Backend
cd backend
python app.py

# Frontend (em outro terminal)
cd frontend
npm run dev
```

### **2. Testar Configuração:**
1. Acesse a interface de máquinas
2. Clique em "Configurar Lab"
3. Defina nome e número máximo de dispositivos
4. Salve e verifique se aplica na interface

### **3. Verificar Detecção Automática:**
1. Execute `list_users.sh` para gerar `maquinas.txt`
2. Verifique se o nome do laboratório aparece automaticamente
3. Teste se o status das máquinas é atualizado a cada 5s

---

## 🔗 **Integração com Scripts Existentes**

O sistema mantém compatibilidade total com os scripts shell existentes:
- `list_users.sh`: Gera `maquinas.txt` com usuários LTSP ativos
- `liga.sh`, `desliga.sh`: Scripts de controle das máquinas
- `maquinas.txt`: Arquivo de referência para status das máquinas

---

## ✨ **Benefícios Implementados**

1. **Configurabilidade**: Usuário pode definir nome e limites do laboratório
2. **Automação**: Detecção automática baseada nos usuários ativos
3. **Tempo Real**: Atualizações mais frequentes (5s vs 10s)
4. **Persistência**: Configurações salvas no banco de dados
5. **Usabilidade**: Interface intuitiva para configuração
6. **Compatibilidade**: Mantém integração com scripts existentes

---

## 📝 **Notas Técnicas**

- **Detecção Automática**: Prioriza nome configurado manualmente, se não houver, usa detecção automática
- **Fallback**: Valores padrão se não conseguir carregar configurações
- **WebSocket**: Mantém funcionalidade de tempo real existente
- **Banco**: SQLite para máxima compatibilidade e simplicidade
- **Validação**: Frontend e backend validam inputs antes de salvar

---

*Sistema implementado com foco na usabilidade, performance e compatibilidade com a infraestrutura existente.*
