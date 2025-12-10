# Scripts Shell

Este diretório contém os scripts shell necessários para o funcionamento do sistema.

## Scripts Necessários

- `liga.sh` - Liga todas as máquinas do laboratório usando Wake-on-LAN
- `desliga.sh` - Desliga todas as máquinas
- `desliga_um.sh` - Desliga uma máquina específica
- `ping.sh` - Verifica status das máquinas (online/offline)
- `executa.sh` - Executa comando em todas as máquinas
- `executa_um.sh` - Executa comando em uma máquina específica
- `liga_net.sh` - Liga internet para as máquinas
- `desliga_net.sh` - Desliga internet para as máquinas
- `crontab.sh` - Gerencia agendamentos (cron)
- `edit_crontab.sh` - Edita crontab

## Arquivos de Configuração

- `maquinas` - Lista de IPs das máquinas (gerado automaticamente)
- `mac_maquinas` - Lista de MAC addresses das máquinas

## Nota

Se você já tem esses scripts no diretório `interface_gerencia/scripts/`, você pode:
1. Copiar os scripts para este diretório
2. Ou criar links simbólicos
3. Ou ajustar o caminho no código para apontar para o diretório original

