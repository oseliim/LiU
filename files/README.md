Análise do Projeto web_installer_ltsp
Estrutura de Diretórios
O projeto web_installer_ltsp é composto por uma aplicação Flask (Python) e uma
série de scripts shell que automatizam a configuração de um servidor LTSP (Linux
Terminal Server Project). A estrutura de diretórios é a seguinte:

web_installer_ltsp/
├── app_flask/ # Aplicação web Flask
│ ├── requirements.txt # Dependências Python
│ └── src/ # Código fonte da aplicação Flask
│ ├── pycache/
│ ├── main.py # Lógica principal da aplicação Flask
│ ├── static / # Arquivos estáticos (CSS, imagens, JS)
│ │ ├── css/
│ │ ├── img/
│ │ └── js/
│ └── templates/ # Modelos HTML
│ └── index.html
├── apps_pre_install.sh # Script para instalação de aplicativos pré-
definidos
├── auto_install.sh # Script de instalação automática do LTSP
├── desinstala/ # Scripts de desinstalação
│ ├── apaga_dir_ltsp.sh
│ └── dell_user.sh
├── dnsmasq_conf.sh # Script de configuração do dnsmasq
├── gera_gdm.sh # Script para gerar imagem LTSP com GDM
├── gera_xfce.sh # Script para gerar imagem LTSP com XFCE
├── ipxe_menu.sh # Script para configurar o menu iPXE
├── LIFTO_BOOT_LOGO_256px.png
├── LIFTO_ICON.svg
├── LIFTO_WALLPAPER_LI_BLACK.jpg
├── LIFTO_WLL_BLACK.jpg
├── LIFTO_WLL_IF.jpg
├── montar_conf.sh # Script para montar configurações de usuário
LTSP
├── network.sh # Script para coletar informações de rede
├── pxelinux.cfg/ # Configurações PXELINUX
│ ├── Imagens/
│ ├── backup.txt
│ ├── copia.txt
│ └── default
├── reinicia.sh # Script para reiniciar serviços
├── tmp/ # Diretório temporário para dados
│ ├── additional_packages.txt
│ ├── network_data.txt
│ └── user_data.txt
├── uninstall_pre_apps.sh # Script para desinstalar aplicativos pré-
definidos
├── user_conf.sh # Script para configurar usuários
├── windows/ # Scripts relacionados a configurações de
Windows
│ ├── gera_windows.sh
│ └── importa_windows.sh
└── wget-log* # Logs de download

Análise Detalhada dos Componentes
Scripts Shell (.sh)

dnsmasq_conf.sh
Propósito: Este script é responsável por configurar o serviço dnsmasq no servidor
LTSP. Ele ajusta o range DHCP, o servidor DNS e as opções de boot para o iPXE,
garantindo que os clientes thin client possam inicializar corretamente na rede.

Funcionalidades Principais:

. Leitura de Dados de Rede: Tenta ler informações de rede (IP/CIDR, Gateway,
Servidores DNS) do arquivo tmp/network_data.txt. Se o arquivo não for
encontrado ou as informações estiverem incompletas, ele usa configurações
padrão.
. Extração do Prefixo de Rede: Deriva o prefixo de rede (ex: 192.168.1) do IP
configurado para definir o range DHCP.
. Definição de Range DHCP: Define um range DHCP padrão de .100 a.
dentro do prefixo de rede identificado.
. Geração da Configuração Base: Executa ltsp dnsmasq para gerar um arquivo
de configuração base para o dnsmasq em /etc/dnsmasq.d/ltsp-dnsmasq.conf.
. Ajuste de Configurações:
Atualiza o dhcp-range no arquivo de configuração.
Configura o servidor DNS (dhcp-option=6) e o gateway (dhcp-option=3)
com base nos dados coletados ou padrões.
. Ajuste de Opções de Boot iPXE: Comenta as opções de dhcp-boot padrão do
LTSP e adiciona uma nova linha para dhcp-boot=tag:X86PC,ltsp/pxelinux.0,
direcionando o boot para o PXELINUX.
. Configuração de IP Sequencial: Cria um arquivo /etc/dnsmasq.d/99-dhcp-
seq-ip.conf com a diretiva dhcp-sequential-ip para garantir que os IPs sejam
atribuídos sequencialmente.
. Reinício do Serviço: Reinicia o serviço dnsmasq para aplicar as novas
configurações e verifica o status para garantir que não houve erros.
Dependências:

dnsmasq: O serviço principal que este script configura.
ltsp comandos: Utiliza o comando ltsp dnsmasq.
systemctl: Para reiniciar o serviço dnsmasq.
tmp/network_data.txt: Arquivo gerado pelo script network.sh que contém as
informações de rede coletadas.
Variáveis Chave:

network_output_file: Caminho para o arquivo tmp/network_data.txt.
IP_CIDR: Endereço IP com CIDR (ex: 192.168.1.10/24).
DEFAULT_GATEWAY: Endereço IP do gateway padrão.
DNS_SERVERS_LIST: Lista de servidores DNS.
NETWORK_PREFIX: Os três primeiros octetos do IP de rede.
RANGE_INICIO, RANGE_FIM: Início e fim do range DHCP.
IP_DNS: Servidor DNS a ser configurado.
DNSMASQ_LTSP_CONF: Caminho para o arquivo de configuração do dnsmasq
(/etc/dnsmasq.d/ltsp-dnsmasq.conf).
SEQ_IP_CONF: Caminho para o arquivo de configuração de IP sequencial
(/etc/dnsmasq.d/99-dhcp-seq-ip.conf).
Observações:

O script utiliza sed para modificar o arquivo de configuração do dnsmasq, o que
requer cuidado para evitar erros de sintaxe ou substituições indesejadas.
A lógica de extração de dados de rede do network_data.txt é crucial para o
funcionamento correto do script.
A configuração do dhcp-boot para PXELINUX sugere que o projeto utiliza PXE
para inicialização dos thin clients, em vez do iPXE padrão do LTSP para algumas
configurações.
user_conf.sh
Propósito: Este script é responsável por criar e configurar novos usuários no sistema,
incluindo a definição de senhas e a adição a grupos padrão. Ele também registra as
credenciais do usuário em um arquivo temporário.

Funcionalidades Principais:

. Verificação de Permissões: Garante que o script seja executado como root.
. Validação de Argumentos: Verifica se o nome de usuário foi fornecido como
argumento. A senha é opcional; se não for fornecida, o nome de usuário é usado
como senha.
. Criação/Atualização de Usuário:
Se o usuário já existe, ele atualiza a senha do usuário no sistema e a entrada
no arquivo tmp/user_data.txt.
Se o usuário não existe, ele cria o usuário com um diretório /home e bash
como shell padrão, define a senha e adiciona o usuário a grupos padrão
(audio, video, cdrom, plugdev, netdev).
. Registro de Credenciais: Registra o par usuário:senha no arquivo
tmp/user_data.txt. Ele lida com a atualização de entradas existentes para
evitar duplicatas.
Dependências:

useradd, usermod, chpasswd: Comandos do sistema para gerenciamento de
usuários.
grep, mkdir, mv: Comandos básicos do shell.
tmp/user_data.txt: Arquivo onde as credenciais dos usuários são
armazenadas.
Variáveis Chave:

USUARIO: Nome de usuário a ser criado/configurado.
SENHA: Senha do usuário (padrão é o nome de usuário se não fornecida).
USER_DATA_FILE: Caminho para o arquivo tmp/user_data.txt.
Observações:

O armazenamento de senhas em texto simples no tmp/user_data.txt é uma
preocupação de segurança e deve ser considerado para melhorias futuras (ex:
criptografia ou uso de um método mais seguro para gerenciar credenciais).
O script tenta ser idempotente, ou seja, pode ser executado múltiplas vezes para
o mesmo usuário sem causar erros, apenas atualizando as informações.
gera_xfce.sh
Propósito: Este script automatiza a criação de um ambiente chroot LTSP baseado em
Ubuntu com o ambiente de desktop XFCE. Ele configura o sistema para thin clients,
incluindo a instalação de pacotes, criação de usuários, configuração de autologin e
ocultação de usuários, e a exportação da imagem final.

Funcionalidades Principais:

. Processamento de Parâmetros: Aceita argumentos para a versão do Ubuntu
(padrão: jammy), ativação de autologin (--autologin), ocultação de usuários (-
-hide-users) e o nome do usuário principal.
. Verificação de Dependências do Host: Instala pacotes essenciais no sistema
host como debootstrap, squashfs-tools, systemd-container e ltsp.
. Criação/Verificação do Chroot: Utiliza debootstrap para criar um novo
ambiente chroot no diretório /srv/ltsp/ubuntuxfce_<versao_ubuntu> se ele
ainda não existir. Se já existir, pula esta etapa.
. Montagens: Monta os sistemas de arquivos dev, proc e sys dentro do chroot
para que o ambiente funcione corretamente.
. Cópia de Arquivos Essenciais: Copia os scripts apps_pre_install.sh e o
diretório tmp para dentro do chroot. Também copia uma imagem de wallpaper
(LIFTO_WALLPAPER_LI_BLACK.jpg) para o diretório de backgrounds do chroot.
. Configuração de sources.list e Instalação de Pacotes:
Configura o arquivo /etc/apt/sources.list dentro do chroot para os
repositórios corretos do Ubuntu.
Instala uma série de pacotes essenciais dentro do chroot, incluindo linux-
generic, initramfs-tools, ltsp, xfce4, lightdm, lightdm-gtk-
greeter, network-manager, google-chrome-stable, entre outros.
Remove pacotes GNOME (gdm3, gnome-shell) se estiverem presentes para
evitar conflitos.
Executa o script apps_pre_install.sh dentro do chroot para instalar
aplicativos adicionais.
. Criação do Usuário: Cria o usuário especificado (padrão: aluno) dentro do
chroot, define sua senha (padrão: igual ao nome de usuário) e o adiciona a
grupos padrão.
. Configurações da Interface Gráfica e Autologin:
Cria e configura arquivos como .xsession, .dmrc e .xinitrc no diretório
home do usuário dentro do chroot para garantir que o XFCE inicie
corretamente.
Configura o AccountsService para o usuário.
Configura o LightDM (/etc/lightdm/lightdm.conf e lightdm.conf.d/)
para usar XFCE como sessão padrão e, opcionalmente, habilita o autologin
para o usuário principal.
Se hide-users for ativado, configura o LightDM para ocultar a lista de
usuários e desabilita a troca de usuário no XFCE via kioskrc.
. Definição de Wallpaper: Cria um script set-wallpaper.sh em /usr/local/bin
dentro do chroot e um arquivo .desktop em /etc/xdg/autostart para definir
o wallpaper personalizado do LTSP na inicialização do XFCE.
. Desmontagem de Segurança: Desmonta os sistemas de arquivos dev, proc e
sys do chroot.
. Exportação da Imagem LTSP: Utiliza ltsp image para exportar o ambiente
chroot como uma imagem squashfs, pronta para ser servida aos thin clients.
. Atualização de Serviços de Rede: Executa o script reinicia.sh para atualizar o
initrd e os serviços de rede, garantindo que as novas configurações sejam
aplicadas.
Dependências:

debootstrap, squashfs-tools, systemd-container, ltsp: Ferramentas para
criação e gerenciamento de chroots e imagens LTSP.
apt-get, chroot, mount, umount, useradd, usermod, chpasswd, curl, sed,
grep, mkdir, cp, chmod: Comandos básicos do sistema.
apps_pre_install.sh: Script para instalação de aplicativos adicionais.
reinicia.sh: Script para reiniciar serviços de rede.
LIFTO_WALLPAPER_LI_BLACK.jpg: Imagem de wallpaper.
Variáveis Chave:

UBUNTU_VERSION: Versão do Ubuntu para o chroot (ex: jammy).
AUTOLOGIN: Booleano, true se o autologin estiver ativado.
HIDE_USERS: Booleano, true se a ocultação de usuários estiver ativada.
USER: Nome do usuário principal a ser configurado.
DISTRO: Nome da distribuição LTSP (padrão: ubuntuxfce).
RELEASE: Versão do Ubuntu (igual a UBUNTU_VERSION).
CHROOT_DIR: Caminho completo para o diretório chroot (ex:
/srv/ltsp/ubuntuxfce_jammy).
ARCH: Arquitetura do sistema (padrão: amd64).
PASSWORD: Senha do usuário (padrão: igual a USER).
MIRROR: URL do espelho de pacotes do Ubuntu.
Observações:

Este script é fundamental para a criação do ambiente cliente LTSP. Quaisquer
alterações nos pacotes ou configurações do desktop devem ser feitas aqui.
A lógica de autologin e ocultação de usuários é configurada diretamente nos
arquivos de configuração do LightDM e XFCE dentro do chroot.
O script set-wallpaper.sh é uma solução robusta para garantir que o wallpaper
seja aplicado corretamente, mesmo com as nuances de inicialização do XFCE.
gera_gdm.sh
Propósito: Este script é similar ao gera_xfce.sh, mas focado na criação de um
ambiente chroot LTSP baseado em Ubuntu com o ambiente de desktop GNOME (GDM).
Ele automatiza a configuração do sistema para thin clients, incluindo a instalação de
pacotes GNOME, criação de usuários, configuração de autologin e ocultação de
usuários, e a exportação da imagem final.

Funcionalidades Principais:

. Processamento de Parâmetros: Aceita argumentos para a versão do Ubuntu
(padrão: jammy), ativação de autologin (--autologin), ocultação de usuários (-
-hide-users) e o nome do usuário principal.
. Verificação de Dependências do Host: Instala pacotes essenciais no sistema
host como debootstrap, squashfs-tools, systemd-container, ltsp, wget,
gnupg2 e curl.

. Criação/Verificação do Chroot: Utiliza debootstrap para criar um novo
ambiente chroot no diretório /srv/ltsp/ubuntugdm_<versao_ubuntu> se ele
ainda não existir. Se já existir, pula esta etapa.

. Adição de Conteúdo Personalizado: Copia o wallpaper
(LIFTO_WALLPAPER_LI_BLACK.jpg) e um ícone (LIFTO_ICON.svg) para dentro do
chroot. Configura um script em /etc/profile.d/ para definir o wallpaper via
gsettings em sessões GNOME.

. Montagens: Monta os sistemas de arquivos dev, proc e sys dentro do chroot.

. Cópia de Arquivos Essenciais: Copia os scripts apps_pre_install.sh e o
diretório tmp para dentro do chroot.

. Configuração de sources.list e Instalação de Pacotes:
Configura o arquivo /etc/apt/sources.list dentro do chroot.
Instala pacotes essenciais para o ambiente GNOME, incluindo gdm3,
ubuntu-desktop-minimal, xterm, firefox, epoptes-client, network-
manager, google-chrome-stable, entre outros.
Configura o dconf para definir o wallpaper e aplicar bloqueios de
segurança (desabilitar troca de usuário e tela de bloqueio).
Executa o script apps_pre_install.sh dentro do chroot.

. Criação do Usuário: Cria o usuário especificado (padrão: aluno) dentro do
chroot, define sua senha e o adiciona a grupos padrão, incluindo sudo para
resolver problemas de acesso.

. Configurações da Interface Gráfica e Autologin:
Configura o AccountsService para o usuário, definindo a sessão padrão
como ubuntu.
Configura o GDM (/etc/gdm3/custom.conf) para, opcionalmente, habilitar
o autologin para o usuário principal e ocultar a lista de usuários
(DisableUserList=true).
Aplica bloqueios de segurança via dconf para desabilitar a troca de usuário
e a tela de bloqueio.

. Configuração PAM: Garante que o módulo pam_mkhomedir.so esteja habilitado
em common-session para criar o diretório home do usuário se não existir.
. Desmontagem de Segurança: Desmonta os sistemas de arquivos dev, proc e
sys do chroot.
. Exportação da Imagem LTSP: Utiliza ltsp image para exportar o ambiente
chroot como uma imagem squashfs.
. Atualização de Serviços de Rede: Executa o script reinicia.sh para atualizar o
initrd e os serviços de rede.
Dependências:

debootstrap, squashfs-tools, systemd-container, ltsp: Ferramentas para
criação e gerenciamento de chroots e imagens LTSP.
apt-get, chroot, mount, umount, useradd, usermod, chpasswd, curl, sed,
grep, mkdir, cp, chmod, dconf: Comandos básicos do sistema.
apps_pre_install.sh: Script para instalação de aplicativos adicionais.
reinicia.sh: Script para reiniciar serviços de rede.
LIFTO_WALLPAPER_LI_BLACK.jpg, LIFTO_ICON.svg: Imagens e ícones
personalizados.
Variáveis Chave:

UBUNTU_VERSION: Versão do Ubuntu para o chroot (ex: jammy).
AUTOLOGIN: Booleano, true se o autologin estiver ativado.
HIDE_USERS: Booleano, true se a ocultação de usuários estiver ativada.
USER: Nome do usuário principal a ser configurado.
DISTRO: Nome da distribuição LTSP (padrão: ubuntugdm).
RELEASE: Versão do Ubuntu (igual a UBUNTU_VERSION).
CHROOT_DIR: Caminho completo para o diretório chroot (ex:
/srv/ltsp/ubuntugdm_jammy).
ARCH: Arquitetura do sistema (padrão: amd64).
PASSWORD: Senha do usuário (padrão: igual a USER).
MIRROR: URL do espelho de pacotes do Ubuntu.
Observações:

Este script é a contraparte do gera_xfce.sh para ambientes GNOME. As
escolhas de desktop (XFCE vs. GNOME) são feitas com base nas necessidades do
usuário.
A configuração do GDM e do dconf é crucial para o comportamento do ambiente
GNOME, especialmente para autologin e restrições de usuário.
auto_install.sh
Propósito: Este script automatiza a instalação inicial e a configuração básica do
servidor LTSP, incluindo a instalação de pacotes necessários, configuração de
diretórios PXE e DNS, e a criação de um arquivo de configuração LTSP básico.

Funcionalidades Principais:

. Detecção da Versão do Ubuntu: Detecta a versão principal do Ubuntu do
sistema operacional host para adaptar a instalação dos pacotes LTSP.
. Atualização de Pacotes: Atualiza a lista de pacotes do sistema (apt update).
. Instalação de Pacotes LTSP:
Para versões do Ubuntu anteriores à , adiciona o PPA do LTSP e instala
pacotes comuns, incluindo ltsp-binaries.
Para versões  ou superiores, instala pacotes comuns e ipxe (sem ltsp-
binaries, indicando uma abordagem mais moderna do LTSP).
Os pacotes comuns incluem ltsp, dnsmasq, nfs-kernel-server,
openssh-server, squashfs-tools, ethtool, net-tools, epoptes,
debootstrap, pxelinux, syslinux.
. Configuração de Diretórios e Arquivos PXE:
Cria o diretório /srv/tftp/ltsp.
Baixa ipxe.pxe (undionly.kpxe) para o diretório TFTP.
Cria links simbólicos para pxelinux.0 e o diretório bios do syslinux.
Cria o diretório pxelinux.cfg e baixa um arquivo default de
configuração PXELINUX.
. Configuração de DNS: Remove o arquivo /etc/resolv.conf existente e cria um
novo com os servidores DNS do Google (8.8.8.8 e 8.8.4.4).
. Montagem do ltsp.conf Básico:
Cria o diretório /etc/ltsp se não existir.
Cria ou sobrescreve o arquivo /etc/ltsp/ltsp.conf com uma seção
[common] básica, definindo RELOGIN=1, HOSTNAME=lifto,
LIGHTDM_CONF="greeter-hide-users=true" e DNS_SERVER="8.8.8.8",
além de uma seção [clients] vazia.
Dependências:

apt, lsb_release, add-apt-repository, wget, ln, mkdir, rm, echo, cat:
Comandos básicos do sistema.
Pacotes listados em COMMON_PKGS e ltsp-binaries ou ipxe.
Variáveis Chave:

UBUNTU_VERSION: Versão do Ubuntu detectada.
COMMON_PKGS: Lista de pacotes comuns a serem instalados.
ltsp_conf_file: Caminho para o arquivo de configuração principal do LTSP
(/etc/ltsp/ltsp.conf).
Observações:

Este script é o ponto de partida para a instalação do servidor LTSP. Ele garante
que todas as dependências e configurações iniciais estejam no lugar antes que os
scripts de geração de imagem possam ser executados.
A lógica de instalação condicional baseada na versão do Ubuntu é importante
para garantir a compatibilidade com diferentes releases.
A configuração do ltsp.conf é fundamental para o comportamento geral do
servidor LTSP e dos thin clients.
network.sh
Propósito: Este script coleta informações detalhadas sobre a configuração de rede da
interface ativa principal do sistema e salva esses dados em um arquivo temporário
(tmp/network_data.txt). As informações coletadas são cruciais para outros scripts,
como o dnsmasq_conf.sh, que dependem desses dados para configurar os serviços
de rede do LTSP.

Funcionalidades Principais:

. Determinação da Interface Ativa: Identifica a interface de rede principal do
sistema usando a rota padrão (ip route).
. Coleta de Informações da Interface:
Nome da interface.
Estado da interface (UP/DOWN).
Endereço IP com CIDR.
Máscara de rede (calculada a partir do CIDR).
Gateway padrão.
. Coleta de Servidores DNS:
Lê os servidores DNS configurados em /etc/resolv.conf.
Se resolvectl estiver disponível, tenta obter informações de DNS via
systemd-resolved (tanto da interface específica quanto globalmente).
. Salvamento de Dados: Todas as informações coletadas são salvas no arquivo
tmp/network_data.txt.
Dependências:

ip: Ferramenta para manipulação de rotas e interfaces de rede.
grep, awk, cut, head, tee, mkdir, rm: Comandos básicos do shell.
resolvectl: (Opcional) Utilizado se disponível para obter informações de DNS
de systemd-resolved.
Variáveis Chave:

network_output_file: Caminho para o arquivo de saída
(tmp/network_data.txt).
active_iface: Nome da interface de rede ativa principal.
IP_CIDR: Endereço IP com CIDR da interface ativa.
CALCULATED_NETMASK: Máscara de rede calculada.
DEFAULT_GATEWAY: Endereço IP do gateway padrão.
DNS_SERVERS_RESOLVCONF: Array de servidores DNS de /etc/resolv.conf.
DNS_SERVERS_RESOLVECTL: Servidores DNS obtidos via resolvectl.
Observações:

Este script é um pré-requisito para a configuração de rede do LTSP, pois fornece
os dados de entrada para o dnsmasq_conf.sh.
A robustez na coleta de informações de rede é importante, pois falhas aqui
podem levar a problemas de conectividade no ambiente LTSP.
A inclusão de resolvectl demonstra uma tentativa de compatibilidade com
sistemas que utilizam systemd-resolved para gerenciamento de DNS.
montar_conf.sh
Propósito: Este script é utilizado para adicionar configurações de cliente ao arquivo
/etc/ltsp/ltsp.conf, garantindo a integridade e estrutura do arquivo. Ele mapeia
usuários únicos sequenciais a IPs DHCP dentro de um range definido e inclui as senhas
dos usuários (codificadas em Base) no arquivo de configuração do LTSP.

Funcionalidades Principais:

. Processamento de Argumentos: Aceita uma lista de nomes de usuário como
argumentos. Opcionalmente, pode-se especificar um range de IPs DHCP usando
--range INICIO-FIM.
. Validações:
Verifica se o script está sendo executado como root.
Verifica se nomes de usuário foram fornecidos.
Verifica a existência do arquivo tmp/user_data.txt, que contém os pares
usuário:senha.
Valida o formato dos nomes de usuário.
. Determinação do Prefixo de Rede: Obtém o prefixo de rede (ex: 192.168.1) do
arquivo tmp/network_data.txt. Se não encontrado, usa 192.168.1 como
padrão.
. Garantia da Estrutura do ltsp.conf: Se o arquivo /etc/ltsp/ltsp.conf não
existir, ele é criado com uma seção [common] básica, incluindo configurações
como XKBMODEL, TIMEZONE, RELOGIN, HOSTNAME e LIGHTDM_CONF.
. Adição de Usuários e IPs:
Itera sobre a lista de usuários únicos fornecidos.
Para cada usuário, encontra o próximo IP disponível no range DHCP
definido, evitando IPs já configurados no ltsp.conf.
Lê a senha do usuário do tmp/user_data.txt.
Adiciona uma nova seção [<IP_do_cliente>] ao ltsp.conf com as
seguintes configurações:
AUTOLOGIN=<nome_do_usuario>: Configura o autologin para o
usuário.
PASSWORDS_LAB="<nome_do_usuario>/<senha_em_base64>":
Armazena o nome de usuário e a senha (codificada em Base) para
uso pelo LTSP.
Dependências:

grep, awk, cut, printf, sort, base64, mkdir, cat, echo: Comandos
básicos do shell.
tmp/network_data.txt: Arquivo gerado pelo network.sh com informações de
rede.
tmp/user_data.txt: Arquivo gerado pelo user_conf.sh com credenciais de
usuário.
Variáveis Chave:

SCRIPT_DIR: Diretório onde o script está localizado.
network_output_file: Caminho para tmp/network_data.txt.
user_data_file: Caminho para tmp/user_data.txt.
ltsp_conf_file: Caminho para /etc/ltsp/ltsp.conf.
range_start, range_end: Início e fim do range de IPs DHCP.
usuarios_input: Array de nomes de usuário fornecidos como argumento.
usuarios_unicos: Array de nomes de usuário únicos e validados.
network_prefix: Os três primeiros octetos do IP de rede.
ip_suffix: O último octeto do IP a ser atribuído.
Observações:

Este script é crucial para o gerenciamento de clientes thin client, pois ele associa
usuários a IPs específicos e configura o autologin.
A codificação da senha em Base é uma medida de ofuscação, mas não de
segurança. A senha ainda está presente no arquivo de configuração e pode ser
facilmente decodificada. Para ambientes de produção, métodos mais seguros de
gerenciamento de credenciais devem ser considerados.
A lógica de atribuição de IP sequencial e a verificação de IPs já em uso são
importantes para evitar conflitos na rede LTSP.
ipxe_menu.sh
Propósito: Este script automatiza a configuração do menu PXE (Preboot Execution
Environment) no servidor LTSP. Ele limpa o diretório de configuração PXE existente,
copia uma nova estrutura de menu e ajusta dinamicamente o arquivo default para
apontar para a imagem LTSP correta.

Funcionalidades Principais:

. Verificações Iniciais: Garante que o script seja executado como root e que o
diretório de origem dos arquivos PXE (pxelinux.cfg) exista.
. Determinação do Nome da Imagem: O script pode receber o nome da imagem
LTSP como argumento. Se nenhum nome for fornecido, ele tenta detectar
automaticamente o primeiro diretório em /srv/ltsp/images/.
. Preparação do Diretório de Destino: Cria o diretório
/srv/tftp/ltsp/pxelinux.cfg se não existir e limpa seu conteúdo se já existir.
. Cópia da Estrutura do Menu: Copia todos os arquivos e subdiretórios do
diretório de origem (pxelinux.cfg) para o diretório de destino
(/srv/tftp/ltsp/pxelinux.cfg).
. Ajuste Dinâmico do Arquivo default:
Modifica o arquivo /srv/tftp/ltsp/pxelinux.cfg/default para substituir
placeholders pelo nome da imagem LTSP real.
Isso inclui o caminho para o vmlinuz (kernel Linux), ltsp.image (imagem
squashfs) e initrd.img (initramfs).
Também ajusta o MENU LABEL no arquivo para refletir o nome da imagem.
Dependências:

cp, rm, mkdir, sed, grep, echo: Comandos básicos do shell.
pxelinux.cfg/: Diretório contendo os arquivos de configuração PXE de origem.
/srv/tftp/ltsp/: Diretório raiz do servidor TFTP.
/srv/ltsp/images/: Diretório onde as imagens LTSP são armazenadas.
Variáveis Chave:

SOURCE_PXE_DIR: Diretório de origem dos arquivos PXE (relativo ao script).
TARGET_PXE_DIR: Diretório de destino dos arquivos PXE no servidor TFTP.
TFTP_ROOT_DIR: Diretório raiz do servidor TFTP.
IMAGES_DIR: Diretório onde as imagens LTSP são armazenadas.
DEFAULT_FILE_PATH: Caminho completo para o arquivo default do PXELINUX.
IMAGE_NAME: Nome da imagem LTSP a ser configurada no menu.
Observações:

Este script é essencial para que os thin clients possam inicializar via rede e
selecionar a imagem LTSP correta a partir do menu PXE.
A detecção automática do nome da imagem e o ajuste dinâmico do arquivo
default tornam o processo mais flexível.
A utilização de sed para modificar o arquivo default requer cuidado para
garantir que as substituições sejam precisas e não causem efeitos colaterais
indesejados.
apps_pre_install.sh
Propósito: Este script é executado dentro do ambiente chroot (seja XFCE ou GNOME)
para instalar aplicativos adicionais que o usuário tenha selecionado. Ele lê uma lista
de aplicativos de um arquivo de seleção e executa comandos de instalação específicos
para cada um, incluindo a adição de repositórios e chaves GPG quando necessário.

Funcionalidades Principais:

. Definição de Comandos de Instalação: Contém um array associativo
(INSTALL_COMMANDS) que mapeia nomes de aplicativos (ex: vscode, spotify,
virtualbox, vlc) para os comandos shell necessários para instalá-los de forma
não interativa. Isso inclui a adição de repositórios PPA, chaves GPG e a execução
de apt-get install.
. Leitura de Aplicativos Selecionados: Lê o arquivo
tmp/additional_packages.txt para obter a lista de aplicativos que devem ser
instalados. Linhas comentadas (#) são ignoradas.
. Instalação de Pré-requisitos: Instala pacotes básicos como curl, wget, gpg,
apt-transport-https, ca-certificates e software-properties-common, que
são frequentemente necessários para adicionar repositórios externos.
. Processamento de Instalações: Itera sobre a lista de aplicativos selecionados:
Verifica se o aplicativo é suportado (se existe uma entrada no
INSTALL_COMMANDS).
Executa os comandos de instalação associados ao aplicativo,
redirecionando a saída para /dev/null para manter a instalação não
interativa e silenciosa.
Realiza uma verificação simplificada para confirmar se a instalação foi bem-
sucedida (ex: command -v spotify).
. Limpeza Final: Executa apt-get --fix-broken install -y e apt-get
autoremove -y para corrigir quaisquer dependências quebradas e remover
pacotes desnecessários.
Dependências:

apt-get, wget, curl, gpg, snap (para Spotify fallback), rm, tee, grep, tr,
xargs, mapfile, command, echo, eval: Comandos básicos do shell.
tmp/additional_packages.txt: Arquivo de entrada que lista os aplicativos a
serem instalados.
Variáveis Chave:

INSTALL_COMMANDS: Array associativo contendo os comandos de instalação para
cada aplicativo.
SELECTION_FILE: Caminho para o arquivo tmp/additional_packages.txt.
selected_apps: Array contendo os nomes dos aplicativos a serem instalados.
Observações:

Este script é fundamental para personalizar as imagens LTSP com software
adicional solicitado pelo usuário.
A estrutura do INSTALL_COMMANDS permite fácil adição ou modificação de novos
aplicativos.
A utilização de DEBIAN_FRONTEND=noninteractive e redirecionamento de saída
é crucial para a automação e para evitar interações durante a instalação.
O fallback para snap install spotify é uma boa prática para aumentar a
robustez da instalação do Spotify.
reinicia.sh
Propósito: Este script é um utilitário simples, mas crucial, que reinicia os principais
serviços e componentes do LTSP. Ele garante que as alterações de configuração feitas
por outros scripts (como dnsmasq_conf.sh, gera_xfce.sh, gera_gdm.sh) sejam
aplicadas e que o ambiente LTSP esteja operacional.

Funcionalidades Principais:

. Reinício de Serviços: O script reinicia sequencialmente os seguintes serviços e
executa comandos relacionados ao LTSP:
NetworkManager: Gerenciador de conexões de rede.
ltsp ipxe: Comando para configurar o iPXE do LTSP.
ltsp initrd: Comando para atualizar o initrd do LTSP.
ltsp nfs: Comando para configurar o NFS do LTSP (serviço de
compartilhamento de arquivos).
ltsp daemon: O serviço principal do LTSP.
dnsmasq: O servidor DHCP e DNS utilizado pelo LTSP.
. Verificação de Sucesso: Para cada serviço/comando, ele verifica se a operação
foi bem-sucedida. Se qualquer reinício falhar, o script é encerrado com um erro.
Dependências:

systemctl: Para reiniciar os serviços do sistema (NetworkManager, ltsp,
dnsmasq).
ltsp: Comandos específicos do LTSP (ltsp ipxe, ltsp initrd, ltsp nfs).
Variáveis Chave:

Nenhuma variável de configuração explícita, o script opera diretamente nos
serviços.
Observações:

Este script é frequentemente chamado ao final de outros scripts de configuração
para garantir que as mudanças entrem em vigor.
É um ponto central para solucionar problemas de serviços no LTSP, pois permite
reiniciar todos os componentes relevantes de uma só vez.
uninstall_pre_apps.sh
Propósito: Este script complementa o apps_pre_install.sh, sendo responsável por
desinstalar os aplicativos que foram previamente instalados no ambiente chroot. Ele
remove os pacotes, seus repositórios e chaves GPG associadas, garantindo uma
limpeza completa.

Funcionalidades Principais:

. Definição de Comandos de Desinstalação: Contém um array associativo
(UNINSTALL_COMMANDS) que mapeia nomes de aplicativos (ex: vscode, spotify,
virtualbox, vlc) para os comandos shell necessários para desinstalá-los. Isso
inclui apt purge para remover completamente os pacotes e rm para limpar
arquivos de repositório e chaves GPG.
. Leitura de Aplicativos Selecionados: Lê o arquivo
tmp/additional_packages.txt (o mesmo usado para instalação) para
determinar quais aplicativos devem ser desinstalados. Linhas comentadas são
ignoradas.
. Processamento de Desinstalações: Itera sobre a lista de aplicativos
selecionados:
Verifica se existem comandos de desinstalação definidos para o aplicativo.
Executa os comandos de desinstalação associados ao aplicativo.
Realiza uma verificação simplificada para confirmar se a desinstalação foi
bem-sucedida (ex: command -v spotify ou snap list).
. Limpeza Final: Executa apt autoremove -y e apt autoclean para remover
dependências não utilizadas e limpar o cache de pacotes.
Dependências:

apt, snap (para Spotify), rm, grep, command, echo: Comandos básicos do
shell.
tmp/additional_packages.txt: Arquivo de entrada que lista os aplicativos a
serem desinstalados.
Variáveis Chave:

UNINSTALL_COMMANDS: Array associativo contendo os comandos de desinstalação
para cada aplicativo.
SELECTION_FILE: Caminho para o arquivo tmp/additional_packages.txt.
selected_apps: Array contendo os nomes dos aplicativos a serem
desinstalados.
Observações:

Este script é útil para reverter instalações ou para criar imagens LTSP mais
enxutas, removendo software desnecessário.
A robustez dos comandos de remoção (incluindo a limpeza de repositórios e
chaves) é importante para evitar resíduos no sistema.
A verificação de sucesso pós-desinstalação ajuda a confirmar que o aplicativo foi
removido conforme o esperado.
Arquivos HTML (.html)

index.html
Propósito: Este é o arquivo HTML principal da aplicação Flask, servindo como a
interface do usuário para o assistente de instalação e configuração do LTSP. Ele é uma
Single Page Application (SPA) que utiliza JavaScript para navegar entre as diferentes
etapas do processo de configuração.

Estrutura e Componentes Principais:

. Cabeçalho (<head>):
Define o charset como UTF- e a viewport para responsividade.
Define o título da página: "Laboratórios Inteligentes do IFTO".
Inclui folhas de estilo CSS:
Bootstrap .. (via CDN).
static/css/style.css (estilos personalizados).
static/css/progress-bars.css (estilos para a barra de progresso).
. Corpo ():

Título e Subtítulo: <h1> e <p> centrais com textos "Laboratórios
Inteligentes do IFTO" e "Assistente de Instalação e Configuração",
respectivamente. Ambos possuem atributos data-translate para
internacionalização.
Barra de Progresso (progress-container):
Exibe as etapas do processo de instalação (Instalação, Rede, Imagem,
Usuários, Resumo, Configuração, Concluído).
Cada etapa (progress-step) tem um círculo numerado e um rótulo
(step-label) com data-translate.
Linhas (progress-line) conectam as etapas visualmente.
Conteúdo das Etapas (step-content): Um contêiner principal que abriga
os diferentes painéis de etapa (step-pane). A visibilidade de cada painel é
controlada por JavaScript.
Step : Instalação dos Pacotes Padrão (id="step-1"):
Título, descrição e um botão "Iniciar Instalação" (start-
installation-btn).
Uma barra de progresso (installation-progress-bar) e uma
área de saída (installation-output) para exibir o log da
instalação.
Um botão "Próximo" (step-1-next-btn) que é exibido após a
conclusão da instalação.
Step : Configurações de Rede (id="step-2"):
Título, descrição e uma área para exibir informações de rede
(network-info-display-area).
Uma área de carregamento (network-info-loading) com
spinner.
Um formulário (network-form) para editar as configurações de
rede (Interface, IP, Máscara, Gateway, DNS, Faixa DHCP).
Botões para "Salvar alterações" (save-network-changes-btn) e
"Editar Configurações" (toggle-network-edit-btn).
Área para mensagens de erro (network-info-error).
Botões "Voltar" e "Próximo".
Step : Criação de Imagem (id="step-3"):
Título e um formulário (image-form).
Seleção da versão do Ubuntu (ubuntu-version).
Seleção de aplicações adicionais (app-hub) com checkboxes e
ícones (VSCode, Spotify, VirtualBox, VLC).
Seleção do ambiente gráfico (XFCE ou GDM) com radio buttons.
Checkbox para habilitar autologin (autologin-check).
Botões "Voltar" e "Próximo".

Step .: Configuração de Usuários (id="step-3.5"):
Título e descrição.
Formulário (users-form) para configuração de usuários.
Seção para Geração Automática de Usuários (com prefixo,
quantidade, senha).
Seção para Adicionar Usuários Manualmente (com campos para
nome de usuário e senha).
Checkbox para ocultar usuários na tela de login (hide-users-
check).
Botões "Voltar" e "Próximo".

Step : Resumo da Configuração (id="step-4"):
Título e uma área (summary-content) para exibir um resumo das
configurações selecionadas nas etapas anteriores.
Botões "Voltar" e "Próximo".

Step : Execução da Configuração (id="step-5"):
Título e um botão "Iniciar Configuração" (start-full-
configuration-btn).
Área de saída (full-configuration-output) para exibir o log da
execução.
Botões "Voltar" e "Próximo" (este último visível após a
conclusão).
Step : Concluído (id="step-6"):
Título e uma mensagem de sucesso.
Botão "Finalizar" (finish-btn).
. Scripts JavaScript:
script.js: Contém a lógica principal para navegação entre as etapas,
validação de formulários, chamadas AJAX para o backend Flask e
manipulação da interface do usuário.
dark_mode.js: Provavelmente para alternar entre modos claro/escuro
(não diretamente visível no snippet, mas presente na estrutura de
arquivos).
i18n.js: Para internacionalização dos textos da interface, utilizando os
atributos data-translate.
Dependências Externas:

Bootstrap .. (CSS e JS - embora o JS não esteja explicitamente linkado no
<head>, é comum ser usado).
Observações:

A interface é projetada para ser um assistente passo a passo, guiando o usuário
através do processo de configuração do LTSP.
O uso extensivo de data-translate indica que a aplicação é preparada para
internacionalização.
A interação com o backend Flask é feita via JavaScript, que envia e recebe dados
JSON e streams de texto para exibir o progresso das operações.
dark_mode.js
Propósito: Este script JavaScript implementa a funcionalidade de alternar entre o
modo claro e escuro na interface do usuário. Ele adiciona um botão flutuante à página
e persiste a preferência do usuário no localStorage.

Funcionalidades Principais:

. Criação do Botão: Ao carregar o DOM, um botão é criado dinamicamente,
posicionado no canto inferior direito da tela (position-fixed, bottom-0, end-
0 , m-3) e adicionado ao body do documento.
. Alternância de Modo:
A função setDarkMode(isDark) adiciona ou remove a classe dark-mode
do body do documento, que é responsável por aplicar os estilos visuais do
modo escuro (presumivelmente definidos em style.css).
O ícone do botão é atualizado para refletir o modo atual (lua para modo
claro, sol para modo escuro).
A preferência do usuário (enabled ou disabled) é salva no localStorage
para persistência entre as sessões.
. Persistência: Ao carregar a página, o script verifica o localStorage para aplicar
o modo escuro se a preferência estiver salva como enabled.
. Evento de Clique: Um event listener é adicionado ao botão para alternar o
modo quando clicado.
Dependências:

localStorage (API do navegador).
Classes CSS dark-mode (definidas em static/css/style.css).
Classes Bootstrap para estilização do botão (btn, btn-outline-secondary,
position-fixed, etc.).
Observações:

Este script é um componente de usabilidade que melhora a experiência do
usuário, permitindo a personalização visual da interface.
A lógica é simples e direta, focando apenas na alternância de classes CSS e
persistência de estado.
i18n.js
Propósito: Este script JavaScript é responsável pela internacionalização (in) da
interface do usuário, permitindo que o texto exibido na aplicação seja traduzido para
diferentes idiomas (atualmente, inglês e português do Brasil). Ele gerencia as
traduções e as aplica dinamicamente aos elementos HTML.

Funcionalidades Principais:

. Armazenamento de Traduções: Um objeto translations contém as traduções
para cada idioma suportado (en e pt-BR). Cada idioma tem um conjunto de
chaves-valor onde a chave é o identificador do texto e o valor é a string traduzida.
. Idioma Atual: A variável currentLanguage armazena o idioma atualmente
selecionado, que é persistido no localStorage do navegador para lembrar a
preferência do usuário.
. Função translate(key): Retorna a string traduzida para uma dada chave no
idioma atual. Se a chave não for encontrada no idioma atual, ele tenta usar o
inglês como fallback.
. Função updateTranslations(): Percorre todos os elementos HTML que
possuem o atributo data-translate. Para cada elemento, ele obtém a chave de
tradução do data-translate e atualiza o textContent do elemento com a
string traduzida correspondente. Também tenta atualizar placeholders de inputs.
. Seleção de Idioma:
Ao carregar o DOM, um grupo de botões (pt-BR e en) é criado
dinamicamente e adicionado ao canto inferior esquerdo da tela.
setLanguage(lang): Função que define o idioma atual, salva-o no
localStorage, atualiza os estilos dos botões de idioma e chama
updateTranslations() para aplicar as novas traduções.
updateButtonStyles(): Atualiza as classes CSS dos botões de idioma para
indicar qual idioma está ativo.
. Inicialização: Na carga inicial da página, o script define o idioma com base na
preferência salva no localStorage (ou pt-BR como padrão) e chama
updateTranslations() para aplicar as traduções iniciais.
. Acessibilidade Global: As funções updateTranslations e translate são
expostas globalmente (window.updateTranslations, window.translate) para
que outros scripts (como script.js) possam utilizá-las para atualizar a interface
ou obter textos traduzidos.
Dependências:

localStorage (API do navegador).
Atributos data-translate nos elementos HTML.
Classes Bootstrap para estilização dos botões de idioma (btn, btn-sm, btn-
primary, btn-outline-primary, btn-group, position-fixed, etc.).
Variáveis Chave:

translations: Objeto contendo todas as traduções.
currentLanguage: String que representa o idioma ativo (ex: pt-BR, en).
Observações:

Este script é essencial para a usabilidade da aplicação, permitindo que usuários
de diferentes idiomas compreendam e interajam com o assistente de instalação.
A abordagem de usar data-translate e um objeto JavaScript para traduções é
comum em SPAs leves.
A persistência do idioma via localStorage melhora a experiência do usuário,
evitando que ele precise selecionar o idioma a cada visita.
Rotas da Aplicação Flask (main.py)

A aplicação Flask serve como o backend para a interface web, orquestrando a
execução dos scripts shell e o gerenciamento de dados. As principais rotas e suas
funcionalidades são:

. / (GET)
Função: index()
Descrição: Renderiza a página principal index.html, que é a interface do
usuário para o assistente de instalação do LTSP.
Retorno: index.html.
. /run_network_info (POST)
Função: run_network_info()
Descrição: Executa o script shell network.sh para coletar informações de
rede do servidor. Este script salva os dados coletados em
tmp/network_data.txt.
Retorno: Um stream HTML com o output da execução do script. Em caso de
erro, retorna uma mensagem de erro HTML com status  se o script não
for encontrado.
. /get_parsed_network_data (GET)

Função: get_parsed_network_data()
Descrição: Lê o arquivo tmp/network_data.txt (gerado por network.sh),
analisa seu conteúdo e retorna os dados de rede parseados em formato
JSON. Inclui informações como interface, IP, máscara, gateway e servidores
DNS.
Retorno: JSON contendo os dados de rede. Em caso de erro (arquivo não
encontrado, dados incompletos ou erro de parsing), retorna um JSON de
erro com status  ou .
. /save_network_config (POST)

Função: save_network_config()
Descrição: Recebe configurações de rede em formato JSON do frontend e
atualiza o arquivo tmp/network_data.txt com esses novos dados. Realiza
validação básica dos dados recebidos.
Parâmetros (JSON Body): json { "network": { "interface": "eth0",
"serverIp": "192.168.1.10", "netmask": "255.255.255.0",
"gateway": "192.168.1.1", "dnsServer": "8.8.8.8", "dhcpRange":
"192.168.1.100 - 192.168.1.150" } }
Retorno: JSON indicando sucesso ({"success": true, "message":
"..."}) ou erro ({"error": "..."}) com status  ou /.
. /run_auto_install (POST)

Função: run_auto_install()
Descrição: Executa o script shell auto_install.sh, que realiza a instalação
inicial dos pacotes padrão do LTSP no servidor.
Retorno: Um stream HTML com o output da execução do script. Em caso de
erro, retorna uma mensagem de erro HTML com status  se o script não
for encontrado.
. /run_montar_conf (POST)

Função: run_montar_conf()
Descrição: Executa o script shell montar_conf.sh para configurar usuários
no ltsp.conf. Espera um JSON com uma lista de usuários (username e
password).
Parâmetros (JSON Body): json { "users": [ {"username": "user1",
"password": "pass1"}, {"username": "user2", "password": "pass2"}
] }
Retorno: Um stream HTML com o output da execução do script. Em caso de
erro, retorna uma mensagem de erro HTML com status  se nenhum
usuário for fornecido.
. /run_all_configurations (POST)

Função: run_all_configurations()
Descrição: Esta é a rota principal para orquestrar todas as etapas de
configuração do LTSP de forma sequencial. Recebe um JSON contendo
configurações de rede, imagem e usuários.
Fluxo de Execução:
. Atualiza tmp/network_data.txt com as configurações de rede
fornecidas.
. Cria tmp/additional_packages.txt com a lista de pacotes adicionais
selecionados.
. Determina qual script de imagem (gera_gdm.sh ou gera_xfce.sh)
deve ser executado com base na seleção do ambiente gráfico.
. Executa sequencialmente os seguintes scripts/operações,
transmitindo o output para o frontend:
dnsmasq_conf.sh (configuração do DHCP/DNS).
user_conf.sh para cada usuário fornecido (criação de
usuários).
O script de imagem selecionado (gera_gdm.sh ou
gera_xfce.sh).
montar_conf.sh (configuração de autologin e senhas no
ltsp.conf).
ipxe_menu.sh (configuração do menu PXE).
reinicia.sh (reinício dos serviços LTSP).
Parâmetros (JSON Body): json { "network": { /* ... dados de rede
... */ }, "image": { "version": "jammy", "desktopEnvironment":
"xfce", // ou "gdm" "hideUsers": false, "autologin": true,
"additionalPackages": ["vscode", "spotify"] }, "users": [
{"username": "user1", "password": "pass1"}, {"username": "user2",
"password": "pass2"} ] }
Retorno: Um stream HTML com o output combinado de todas as execuções
de script. Em caso de erro, retorna uma mensagem de erro HTML com
status  se nenhum usuário for fornecido ou se alguma etapa falhar.
Dependências

O projeto web_installer_ltsp possui as seguintes dependências:

Backend (Python/Flask):
Flask: Framework web para o servidor HTTP e roteamento de requisições.
subprocess: Módulo Python para executar comandos shell externos.
os, sys: Módulos Python para interação com o sistema operacional e
caminhos de arquivos.
Frontend (JavaScript/HTML/CSS):
Bootstrap 5.3.3: Framework CSS para estilização e componentes da
interface do usuário.
JavaScript nativo: Para lógica de interação, validação e chamadas AJAX.
Scripts Shell (Ferramentas de Sistema):
ltsp: Comandos e ferramentas do Linux Terminal Server Project para
gerenciamento de chroots, imagens e serviços LTSP.

dnsmasq: Servidor DHCP e DNS para a rede LTSP.
nfs-kernel-server: Servidor NFS para compartilhamento de arquivos
com os thin clients.

openssh-server: Servidor SSH (provavelmente para acesso remoto ao
servidor LTSP).

squashfs-tools: Ferramentas para criar e manipular imagens SquashFS
(usadas para as imagens dos thin clients).

ethtool, net-tools, ip: Ferramentas para configuração e diagnóstico de
rede.

epoptes: Ferramenta de gerenciamento de laboratório (cliente e servidor).
debootstrap: Ferramenta para criar um sistema Debian/Ubuntu básico em
um diretório.

pxelinux, syslinux: Componentes para inicialização via PXE.
ipxe: Firmware de boot de rede (usado para baixar o undionly.kpxe).
systemctl: Ferramenta para controlar o systemd (iniciar/parar serviços).
apt, add-apt-repository: Ferramentas de gerenciamento de pacotes
Debian/Ubuntu.

snap: Gerenciador de pacotes universal (usado como fallback para
Spotify).

curl, wget: Ferramentas para download de arquivos via HTTP/HTTPS.
gpg: GNU Privacy Guard (para verificar assinaturas de pacotes).
useradd, usermod, chpasswd: Ferramentas para gerenciamento de
usuários e senhas.

sed, grep, awk, cut, printf, sort, base64, mapfile, xargs, eval:
Utilitários de linha de comando para manipulação de texto e dados.

mkdir, rm, cp, ln, chmod, chown, mount, umount: Comandos básicos
de manipulação de arquivos e diretórios.

dconf: Ferramenta para gerenciar o banco de dados de configurações do
GNOME.

gsettings: Ferramenta de linha de comando para interagir com o dconf.
lightdm, lightdm-gtk-greeter, gdm3: Gerenciadores de display/login.
xfce4, ubuntu-desktop-minimal: Ambientes de desktop.
Arquitetura Geral do Projeto

O web_installer_ltsp adota uma arquitetura cliente-servidor com uma interface
web para facilitar a configuração de um servidor LTSP. A interação ocorre da seguinte
forma:

. Frontend (Navegador Web):
Desenvolvido com HTML, CSS (Bootstrap) e JavaScript.
Apresenta uma interface de usuário passo a passo (index.html) para guiar
o usuário através das configurações de rede, imagem e usuários do LTSP.
Utiliza JavaScript (script.js) para:
Gerenciar a navegação entre as etapas.
Coletar dados de entrada do usuário através de formulários.
Realizar chamadas AJAX (assíncronas) para o backend Flask.
Exibir o progresso e o output das operações em tempo real (via Server-
Sent Events ou streaming de resposta).
Lidar com validações de formulário e interações do usuário.
Inclui funcionalidades de internacionalização (i18n.js) e alternância de
modo claro/escuro (dark_mode.js).
. Backend (Aplicação Flask - main.py):
Uma aplicação Python baseada no framework Flask.
Atua como uma API RESTful que recebe requisições do frontend.
Orquestração de Scripts: A principal função do backend é atuar como um
orquestrador para os diversos scripts shell. Em vez de implementar a lógica
de configuração diretamente em Python, ele invoca os scripts shell
apropriados usando subprocess.
Gerenciamento de Dados: Lê e escreve dados de configuração em arquivos
temporários (tmp/network_data.txt, tmp/user_data.txt,
tmp/additional_packages.txt) que são usados como entrada pelos
scripts shell.
Streaming de Output: Transmite o output (stdout e stderr) dos scripts shell
de volta para o frontend, permitindo que o usuário veja o progresso e
quaisquer erros em tempo real.
Rotas: Expõe endpoints para:
Servir a página HTML principal.
Coletar e exibir informações de rede.
Salvar configurações de rede.
Executar a instalação inicial do LTSP.
Configurar usuários.
Executar a sequência completa de configuração (a rota
/run_all_configurations é o ponto central de orquestração).
. Scripts Shell (.sh):
Coleção de scripts Bash que realizam as operações de baixo nível no
sistema operacional.
Cada script é especializado em uma tarefa específica (ex: configurar
dnsmasq, criar usuários, gerar imagens chroot, configurar menu PXE,
reiniciar serviços).
Eles interagem com ferramentas de sistema como ltsp, apt, systemctl,
debootstrap, etc.
Lêem dados de configuração dos arquivos no diretório tmp/ e escrevem
logs ou resultados para a saída padrão, que é capturada pelo backend
Flask.
Fluxo de Operação Típico:

. O usuário acessa a interface web no navegador.
. O frontend (JavaScript) faz uma requisição ao backend Flask para coletar
informações de rede.
. O backend executa network.sh, que coleta os dados e os salva em
tmp/network_data.txt.
. O backend lê tmp/network_data.txt, parseia os dados e os envia de volta ao
frontend em JSON.
. O usuário preenche os formulários na interface, selecionando opções de
imagem, usuários, etc.
. Ao final, o frontend envia todos os dados de configuração consolidados para a
rota /run_all_configurations do backend.
. O backend, então, executa uma sequência de scripts shell (dnsmasq_conf.sh,
user_conf.sh, gera_xfce.sh/gera_gdm.sh, montar_conf.sh, ipxe_menu.sh,
reinicia.sh), passando os parâmetros necessários e transmitindo o output de
volta ao navegador.
. Após a conclusão bem-sucedida de todos os scripts, o frontend exibe uma
mensagem de sucesso.
Esta arquitetura modular permite que a lógica de negócio complexa (configuração do
LTSP) seja encapsulada em scripts shell, enquanto a aplicação Flask fornece uma
camada de interface amigável e orquestração, tornando o processo de instalação mais
acessível.