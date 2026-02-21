# Análise: chroot_scripts e init_windows

**Documento gerado:** 2026-02-21
**Versão:** 1.0
**Escopo:** Fluxo de execução e relacionamento entre chroot_scripts e init_windows no projeto LiU LTSP Installer

---

## 1. Visão Geral

O projeto LiU é um **LTSP (Linux Terminal Server Project) Installer** baseado em web, que automatiza a implantação de ambientes de boot de rede. A estrutura `chroot_scripts` é fundamental para esse processo.

**Localização principal:**
- `/files/chroot_scripts/` - Scripts copiados para o chroot
- `/files/chroot_scripts/init_windows/` - Subsistema de gerenciamento Windows

---

## 2. Componentes de chroot_scripts

### Estrutura de Arquivos

| Arquivo | Propósito | Destino no Chroot |
|---------|----------|-------------------|
| `init_file` | Script de inicialização SSH e VMs | `/etc/init.d/ltsp-ssh-init` |
| `desmonta_home.sh` | Desmontar /home (remoto) para usar local | `/bin/desmonta_home.sh` |
| `mount_home.sh` | Montar partições ext4/NTFS em /home | `/usr/local/sbin/mount_home.sh` |
| `mount_home.service` | Systemd service para mount_home.sh | `/etc/systemd/system/mount_home.service` |
| `executa.sh` | Servidor nc para executar comandos remotos | `/usr/bin/executa.sh` |
| `d` | Script de desligamento (permite WoL) | `/usr/bin/d` |
| `apps_windows.sh` | Instalar pacotes específicos para Windows | Copiado ao chroot |
| `init_windows/` | Diretório com scripts de inicialização Windows | `/usr/local/bin/init_windows/` |

### Detalhes de Cada Componente

#### 2.1 init_file (ltsp-ssh-init service)
**Função:** Inicialização de SSH e desmontagem de home NFS
```bash
Sequência de execução (systemd):
1. ssh-keygen -A          # Gera chaves SSH
2. systemctl restart ssh  # Reinicia SSH
3. vmware-modconfig       # Recompila módulos VMware (se existir)
4. /bin/desmonta_home.sh  # Sleep 10s, depois executa
5. /bin/executa.sh        # Abre servidor nc na porta 3535
```

**[VULNERABILIDADE]** executa.sh abre porta 3535 sem autenticação.

---

#### 2.2 desmonta_home.sh
**Função:** Desmontar /home NFS e preparar para montagem local
```bash
Análise:
- Lista discos físicos e partições
- Busca partições ext4 disponíveis
- Seleciona a maior partição ext4
- Desmontar /home (se for NFS/overlay)
- Monta partição local em /home
- Copia /etc/skel para /home/$USER
- Atualiza XDG user directories
```

---

#### 2.3 mount_home.sh (versão mais recente/robusta)
**Função:** Montagem inteligente de /home com retry loop
```bash
Características avançadas:
- Detecta usuário real (ignora root/nobody/systemd)
- Prioriza ext4 sobre NTFS
- Para NTFS: calcula maior espaço livre
- Executa ntfsfix antes de montar NTFS
- Retry em loop cada 10 segundos
- Cria /home/$USER com permissions corretas
- Atualiza xdg-user-dirs-update
```

**[STATUS]** Este é o script mais robusto e deve ser preferido sobre desmonta_home.sh.

---

#### 2.4 mount_home.service (systemd)
**Função:** Executar mount_home.sh como serviço systemd
```ini
[Unit]
Description=Mount /home from first available external ext4 partition
After=local-fs.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/mount_home.sh
RemainAfterExit=yes
TimeoutStartSec=300
```

---

#### 2.5 executa.sh
**Função:** Servidor de comando remoto para execução de comandos
```bash
Comportamento:
while :
do
  nc -l 3535 > b          # Aceita conexão na porta 3535
  a=`cat b`               # Lê comando
  $a &                    # Executa em background
done
```

**[VULNERABILIDADE CRÍTICA]**
- Sem autenticação
- Sem validação de entrada
- Executa ANY comando recebido
- Porta 3535 aberta para rede
- Executado em boot automático

Este é um **vetor de segurança significativo** que precisará de revisão.

---

#### 2.6 apps_windows.sh
**Função:** Instalar dependências para ambiente Windows
```bash
- Requer root
- Instala GTK4 dev files (libgtk-4-dev, build-essential, pkg-config)
- Instala Docker stack (Docker, Docker Compose, xfreerdp)
- Habilita serviço Docker
```

---

#### 2.7 d (Desligamento)
**Função:** Script de desligamento que permite WoL (Wake-on-LAN)

---

## 3. O Subsistema init_windows

### Estrutura de Arquivos

```
/files/chroot_scripts/init_windows/
├── autorun.sh                        # Script principal GTK4
├── install_windows.sh                # Instalador Docker Windows
├── apps_windows.sh                   # Pacotes para Windows
├── gtk_app                           # Aplicativo GTK compilado
├── interface_simples_gtk.c           # Código-fonte da interface GTK4
├── my_gtk_app                        # Binário pré-compilado
├── image.png / image.jpg             # Recursos gráficos
└── test_windows_deployment.sh        # Testes de implantação
```

### Detalhes dos Componentes

#### 3.1 autorun.sh
**Função:** Gerenciar interface GTK4 e acesso ao Windows
```bash
Fluxo:
1. Detecta se binary já existe → usar se possível
2. Se não: compila interface_simples_gtk.c
3. Força GSK_RENDERER=cairo para compatibilidade GPU
4. Lança aplicativo GTK4
```

---

#### 3.2 install_windows.sh
**Função:** Setup completo de Docker Windows com RDP
```bash
Passos:
1. Detecta usuário real (com e sem sudo)
2. Verifica dependências (Docker, xfreerdp)
3. Busca/extrai windows10.tgz ($HOME/docker_windows)
4. Inicia container com docker compose
5. Aguarda inicialização (60 segundos)
6. Conecta via xfreerdp com RDP
7. Oferece fallback via terminal se falhar
```

**[CREDENCIAIS PADRÃO]** Windows Docker usa: `user:aluno`, `password:aluno`

---

#### 3.3 interface_simples_gtk.c
**Função:** Interface gráfica GTK4 para controle do Windows
- Permite iniciar/parar Windows
- Oferece acesso RDP
- Interface simples e intuitiva

---

#### 3.4 test_windows_deployment.sh
**Função:** Testes de implantação do subsistema Windows

---

## 4. Fluxo de Execução Completo

### 4.1 Criação da Imagem Chroot (gera_windows.sh)

```
gera_windows.sh (exec no HOST)
├─ [1] Instala dependências no host
│       (debootstrap, ltsp, squashfs-tools)
│
├─ [2] Cria chroot em /srv/ltsp/Windows
│
├─ [3] Configura visualização
│       (wallpapers, ícones)
│
├─ [4] Copia scripts chroot_scripts para o chroot:
│   ├─ init_file → /etc/init.d/ltsp-ssh-init
│   ├─ desmonta_home.sh → /bin/
│   ├─ mount_home.sh → /usr/local/sbin/
│   ├─ mount_home.service → /etc/systemd/system/
│   ├─ executa.sh → /usr/bin/
│   ├─ d → /usr/bin/
│   ├─ apps_windows.sh → /
│   └─ init_windows/ → /usr/local/bin/init_windows/
│
├─ [5] Monta sistemas de arquivos críticos
│       (dev, proc, sys)
│
├─ [6] DENTRO DO CHROOT (chroot /srv/ltsp/Windows /bin/bash):
│   ├─ Instala pacotes base
│   │   (epoptes-client, ltsp, ubuntu-desktop, gdm3)
│   │
│   ├─ Instala pacotes Windows
│   │   (via apps_windows.sh)
│   │
│   ├─ Configura SSH e epoptes
│   │
│   ├─ Configura DConf
│   │   (wallpaper, bloqueios de segurança)
│   │
│   ├─ Configura polkit
│   │   (desabilita shutdown/reboot)
│   │
│   ├─ Ativa ltsp-ssh-init service
│   │
│   ├─ Ativa mount_home.service
│   │
│   ├─ Define autostart da aplicação Windows:
│   │   └─ /etc/xdg/autostart/win10.desktop
│   │      └─ Exec=/usr/local/bin/init_windows/autorun.sh
│   │
│   └─ Instala VMware (se bundle disponível)
│
├─ [7] Desmonta bind mounts
│
├─ [8] Cria imagem squashfs com ltsp image
│
├─ [9] Reinicia serviços
│
└─ [10] Gera menu iPXE
```

---

### 4.2 Boot do Cliente LTSP (via PXE)

```
Cliente thin client boota via PXE
│
├─ Carrega kernel e initramfs da imagem squashfs
│
├─ Monta sistema de arquivos
│
├─ Inicia systemd
│
├─ Services ativados (no boot):
│   │
│   ├─ ltsp-ssh-init (init_file)
│   │   ├─ ssh-keygen -A
│   │   ├─ systemctl restart ssh
│   │   ├─ vmware-modconfig (recompila módulos)
│   │   ├─ /bin/desmonta_home.sh (ou usa mount_home.sh?)
│   │   └─ /bin/executa.sh (servidor nc porta 3535)
│   │
│   └─ mount_home.service
│       └─ /usr/local/sbin/mount_home.sh
│           ├─ Procura partições ext4 não montadas
│           ├─ Tenta montar em /home
│           ├─ Se não houver ext4, tenta NTFS
│           └─ Aguarda em loop com retry a cada 10 segundos
│
├─ Inicia GUI (GDM3)
│
├─ Desktop autostart dispara:
│   └─ /usr/local/bin/init_windows/autorun.sh
│       ├─ Verifica GTK4
│       ├─ Compila interface se necessário
│       ├─ Lança aplicativo GTK4
│       └─ Aplicativo gerencia Windows (Docker)
│
└─ Usuário acessa Windows Docker via interface GTK4
```

---

## 5. Fluxograma Relacionamento

```
┌─────────────────────────────────────────────────────────────┐
│ HOST - gera_windows.sh (criação da imagem)                 │
├─────────────────────────────────────────────────────────────┤
│ - Cria ambiente chroot                                      │
│ - Copia chroot_scripts para chroot                          │
│ - Instala pacotes base no chroot                            │
│ - Configura autostart de init_windows                       │
└─────────────────────────────────────────────────────────────┘
                          ↓ (exporta)
┌─────────────────────────────────────────────────────────────┐
│ CHROOT /srv/ltsp/Windows (preparação)                       │
├─────────────────────────────────────────────────────────────┤
│ - Cópia: init_file, mount_home.sh, executa.sh, d           │
│ - Cópia: init_windows/ → /usr/local/bin/init_windows/      │
│ - Config: GDM3, autostart win10.desktop                     │
│ - Ativa: ltsp-ssh-init, mount_home.service                  │
└─────────────────────────────────────────────────────────────┘
                          ↓ (empacota)
┌─────────────────────────────────────────────────────────────┐
│ IMAGEM SQUASHFS → LTSP Boot Image (iPXE)                   │
└─────────────────────────────────────────────────────────────┘
                          ↓ (boot via PXE)
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE LTSP BOOT (executa chroot_scripts)                 │
├─────────────────────────────────────────────────────────────┤
│ 1. Boot kernel + initramfs                                  │
│ 2. Mount /                                                  │
│ 3. Inicia systemd                                           │
│    ├─ ltsp-ssh-init:                                        │
│    │  ├─ ssh-keygen -A                                      │
│    │  ├─ systemctl restart ssh                              │
│    │  └─ exec /bin/executa.sh (listener nc porta 3535)      │
│    │                                                         │
│    └─ mount_home.service:                                   │
│       └─ /usr/local/sbin/mount_home.sh (retry loop)         │
│ 4. Inicia GDM3                                              │
│ 5. Autostart dispara init_windows/autorun.sh               │
│    └─ Interface GTK4 → controla Docker Windows              │
└─────────────────────────────────────────────────────────────┘
                          ↓ (user interaction)
┌─────────────────────────────────────────────────────────────┐
│ USER ACCESS - Interface Windows (Docker + RDP)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Comparação: gera_windows.sh vs gera_gdm.sh

Ambos são muito semelhantes, mas com focos diferentes:

| Aspecto | gera_windows.sh | gera_gdm.sh |
|---------|-----------------|-------------|
| Distro | "Windows" | "Linux" |
| Desktop | GDM3 + Windows (Docker) | GDM3 + Linux |
| Apps especiais | apps_windows.sh | apps_pre_install.sh |
| Extras | init_windows/ | Google Chrome |
| Autostart | win10.desktop (init_windows) | Nenhum |
| VM suportada | VMware | VMware + VirtualBox |

---

## 7. Problemas de Segurança Identificados

### [CRÍTICO] executa.sh
- **Problema:** Servidor nc que executa qualquer comando recebido
- **Localização:** `/usr/bin/executa.sh` (porta 3535)
- **Impacto:** Execução remota de código arbitrário
- **Recomendação:** Revisão urgente de segurança

### [ALTO] Falta de Autenticação
- Nenhum mecanismo de autenticação em executa.sh
- Qualquer pessoa com acesso à rede pode executar comandos

### [MÉDIO] Credenciais Padrão
- Windows Docker usa: `user:aluno`, `password:aluno`
- Deve ser alterado em produção

### [MÉDIO] Permissões de Arquivo
- Vários scripts copiados com permissões abertas durante cópia ao chroot

---

## 8. Scripts Relacionados (fora de chroot_scripts)

**gera_windows.sh** - Script principal que:
1. Cria chroot `/srv/ltsp/Windows`
2. Copia estrutura de chroot_scripts
3. Instala pacotes dentro do chroot
4. Exporta imagem squashfs
5. Configura PXE/iPXE para boot

**gera_gdm.sh** - Versão similar para Linux (sem Windows)

---

## 9. Resumo Funcional

### chroot_scripts
Conjunto de scripts de **inicialização e gerenciamento de recursos** que são copiados para o ambiente LTSP thin client:
- Gerencia SSH, recompila drivers VMware
- Monta `/home` a partir de partições locais
- Oferece callback remoto via nc (porta 3535)
- Inicia interface Windows (Docker)

### init_windows
Subsistema especializado para gerenciar ambientes Windows:
- Interface GTK4 para interação do usuário
- Automação Docker para Windows containers
- Conexão RDP para acesso remoto
- Testes de implantação

**Integração:** Ambos trabalham em conjunto para criar um **thin client LTSP capaz de executar Windows via Docker** com interface gráfica e gerenciamento automático de home directory.

---

## 10. Próximos Passos Recomendados

1. **Auditoria de Segurança** - Revisar especialmente `executa.sh`
2. **Testes de Montagem** - Validar fluxo de mount_home.sh
3. **Documentação GTK4** - Entender interface_simples_gtk.c em profundidade
4. **Testes de Boot** - Validar todo fluxo de PXE até Windows rodando

---

## 11. Solução: Fix para RDP Connection Timeout (2026-02-21)

### Problema Identificado
Alguns clientes conseguiam subir o container Docker, mas a conexão RDP falhava com erro:
```
[ERROR][com.freerdp.core.transport] - BIO_read returned a system error 104: Conexão fechada pela outra ponta
[ERROR][com.freerdp.core] - ERRCONNECT_CONNECT_TRANSPORT_FAILED
```

**Causa Raiz:** Race condition - o script tentava conectar RDP antes de ele estar 100% pronto.

### Solução Implementada

**Arquivo modificado:** `/files/chroot_scripts/init_windows/install_windows.sh`

#### 1. Nova função `wait_windows_ready()` (linhas 164-190)

Monitora logs do Docker em vez de usar sleep fixo:

```bash
wait_windows_ready() {
    echo "⏳ Aguardando Windows inicializar 100%..."
    local timeout=600  # 10 minutos
    while [ $elapsed -lt $timeout ]; do
        # Procura pela mensagem de sucesso nos logs
        if docker logs "$CONTAINER_NAME" 2>/dev/null | grep -q "Windows started successfully"; then
            echo "✅ Windows inicializado com sucesso!"
            echo "⏳ Aguardando mais 10 segundos para RDP ficar 100% pronto..."
            sleep 10
            return 0
        fi
        sleep 10
    done
}
```

**Benefícios:**
- Detecta quando Windows realmente iniciou (procura por "Windows started successfully")
- Aguarda 10 segundos extras para RDP ficar pronto
- Verifica a cada 10 segundos (não fica esperando tempo fixo)
- Timeout máximo de 10 minutos

#### 2. Função melhorada `connect_rdp()` (linhas 192-251)

Implementa retry inteligente com 30 tentativas (5 minutos):

```bash
connect_rdp() {
    local max_attempts=30  # 30 tentativas a cada 10 segundos
    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))

        if nc -z "$IP" "$RDP_PORT" 2>/dev/null; then
            # Porta aberta, tenta conectar
            xfreerdp /v:"$IP" /u:"$USERNAME" /p:"$PASSWORD" ...

            if [ $RDP_EXIT_CODE -eq 0 ]; then
                return 0  # Sucesso!
            else
                sleep 10  # RDP respondeu mas falhou, aguarda mais
            fi
        else
            sleep 10  # Porta não respondendo, aguarda mais
        fi
    done
}
```

**Benefícios:**
- Retry automático a cada 10 segundos
- Até 30 tentativas (total máximo de 5 minutos de tentativa)
- Diferencia entre "porta não respondendo" e "RDP respondeu mas conexão falhou"
- Logging indicando tentativa N de 30

### Comparativo

| Aspecto | Antes | Depois |
|---------|--------|--------|
| Espera por Windows | Sleep fixo 60s | Monitorar logs até sucesso |
| Retry RDP | Uma tentativa | 30 tentativas cada 10s |
| Comportamento com falha | Erro imediato | Retry automático |
| Timeout máximo | ~60s | ~600-650s (windows + retries) |

### Fluxo Esperado Agora

```
1. Container inicia
2. Script aguarda "Windows started successfully" nos logs (cada 10s)
3. Quando encontra a mensagem → aguarda mais 10s
4. Tenta conectar RDP (até 30 tentativas, cada 10s)
5. Se conectar → sessão RDP abre normalmente
6. Se falhar após 30 tentativas → fallback para terminal
```

**Resultado esperado:** Sem mais erros "Conexão fechada pela outra ponta" pois RDP terá tempo suficiente para inicializar.

---


