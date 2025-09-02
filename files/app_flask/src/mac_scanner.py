import os
import subprocess
import re

def run_mac_scanner(output_filename, logger):
    """
    Executa 'arp-scan' para encontrar MACs e os salva em um arquivo.
    Retorna True/False.
    """
    logger.info(f"Iniciando escaneamento de MAC addresses para salvar em '{os.path.basename(output_filename)}'...")
    try:
        command_output = subprocess.check_output(
            ["sudo", "arp-scan", "--localnet"],
            text=True,
            stderr=subprocess.DEVNULL
        )
    except FileNotFoundError:
        logger.error("Comando 'arp-scan' não foi encontrado. O arquivo de MACs não será gerado.")
        return False
    except subprocess.CalledProcessError as e:
        logger.error(f"Falha ao executar 'arp-scan' (código: {e.returncode}). Verifique as permissões.")
        return False

    mac_pattern = re.compile(r"((?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2})")
    found_macs = mac_pattern.findall(command_output)

    if not found_macs:
        logger.warning("Nenhum MAC address foi encontrado na rede.")
        open(output_filename, 'w').close()
        return False
    
    try:
        with open(output_filename, "w") as f:
            for mac in found_macs:
                f.write(mac + "\n")
        logger.info(f"SUCESSO: {len(found_macs)} MACs salvos em '{os.path.basename(output_filename)}'.")
        return True
    except IOError as e:
        logger.error(f"Erro de I/O ao salvar o arquivo de MACs: {e}")
        return False

