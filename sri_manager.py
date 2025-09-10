#!/usr/bin/env python3
"""
Gerenciador de SRI (Subresource Integrity) para o projeto LiU
Automatiza a geração, aplicação e validação de hashes SRI para recursos CDN.

Uso:
    python3 sri_manager.py generate    # Gera hashes SRI
    python3 sri_manager.py apply       # Aplica hashes nos templates
    python3 sri_manager.py validate    # Valida implementação
    python3 sri_manager.py monitor     # Monitora mudanças
"""

import hashlib
import requests
import re
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class SRIManager:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.config_file = self.project_root / "sri_config.json"
        self.hashes_file = self.project_root / "sri-hashes.json"
        self.templates_config = {
            "files/interface_gerencia/templates/index.html": {
                "resources": [
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
                        "type": "css",
                        "selector": "link[href*='bootstrap@5.3.0']"
                    },
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
                        "type": "js",
                        "selector": "script[src*='bootstrap@5.3.0']"
                    },
                    {
                        "url": "https://cdn.jsdelivr.net/npm/chart.js",
                        "type": "js",
                        "selector": "script[src*='chart.js']"
                    }
                ]
            },
            "files/app_flask/src/templates/index.html": {
                "resources": [
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                        "type": "css",
                        "selector": "link[href*='bootstrap@5.3.3']"
                    },
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
                        "type": "js",
                        "selector": "script[src*='bootstrap@5.3.3']"
                    }
                ]
            },
            "files/app_flask/src/templates/expresso.html": {
                "resources": [
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                        "type": "css",
                        "selector": "link[href*='bootstrap@5.3.3']"
                    },
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
                        "type": "css",
                        "selector": "link[href*='bootstrap-icons']"
                    },
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
                        "type": "js",
                        "selector": "script[src*='bootstrap@5.3.3']"
                    }
                ]
            },
            "files/app_flask/src/templates/wizard.html": {
                "resources": [
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
                        "type": "css",
                        "selector": "link[href*='bootstrap@5.3.3']"
                    },
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css",
                        "type": "css",
                        "selector": "link[href*='bootstrap-icons']"
                    },
                    {
                        "url": "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
                        "type": "js",
                        "selector": "script[src*='bootstrap@5.3.3']"
                    }
                ]
            }
        }

    def generate_sri(self, url: str) -> Optional[str]:
        """Gera hash SRI para uma URL"""
        try:
            print(f"📦 Baixando: {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            content = response.content
            hash_obj = hashlib.sha384(content)
            hash_b64 = hash_obj.digest().encode('base64').decode().strip()
            
            sri = f"sha384-{hash_b64}"
            print(f"   ✅ SRI gerado: {sri}")
            return sri
            
        except Exception as e:
            print(f"   ❌ Erro ao gerar SRI para {url}: {e}")
            return None

    def generate_all_sris(self) -> Dict[str, str]:
        """Gera hashes SRI para todos os recursos"""
        print("🔐 Gerando hashes SRI para todos os recursos...")
        print("=" * 50)
        
        sris = {}
        all_urls = set()
        
        # Coleta todas as URLs únicas
        for template_config in self.templates_config.values():
            for resource in template_config["resources"]:
                all_urls.add(resource["url"])
        
        # Gera SRI para cada URL única
        for url in sorted(all_urls):
            sri = self.generate_sri(url)
            if sri:
                sris[url] = sri
            print()
        
        # Salva hashes em arquivo
        hash_data = {
            "generated_at": datetime.now().isoformat(),
            "sris": sris
        }
        
        with open(self.hashes_file, 'w') as f:
            json.dump(hash_data, f, indent=2)
        
        print(f"💾 Hashes salvos em: {self.hashes_file}")
        return sris

    def load_sris(self) -> Dict[str, str]:
        """Carrega hashes SRI do arquivo"""
        if not self.hashes_file.exists():
            print("❌ Arquivo de hashes não encontrado!")
            print("   Execute primeiro: python3 sri_manager.py generate")
            return {}
        
        with open(self.hashes_file, 'r') as f:
            data = json.load(f)
        
        return data.get("sris", {})

    def apply_sri_to_template(self, template_path: str, sris: Dict[str, str]) -> bool:
        """Aplica hashes SRI em um template"""
        template_file = self.project_root / template_path
        
        if not template_file.exists():
            print(f"⚠️  Template não encontrado: {template_path}")
            return False
        
        print(f"📝 Processando: {template_path}")
        
        with open(template_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        template_config = self.templates_config[template_path]
        
        for resource in template_config["resources"]:
            url = resource["url"]
            resource_type = resource["type"]
            
            if url not in sris:
                print(f"   ⚠️  SRI não encontrado para: {url}")
                continue
            
            sri = sris[url]
            
            if resource_type == "css":
                # Para CSS (link)
                pattern = rf'(<link[^>]*href="{re.escape(url)}"[^>]*?)(?:\s+integrity="[^"]*")?([^>]*?>)'
                replacement = rf'\1 integrity="{sri}" crossorigin="anonymous"\2'
            else:
                # Para JS (script)
                pattern = rf'(<script[^>]*src="{re.escape(url)}"[^>]*?)(?:\s+integrity="[^"]*")?([^>]*?>)'
                replacement = rf'\1 integrity="{sri}" crossorigin="anonymous"\2'
            
            content = re.sub(pattern, replacement, content)
            print(f"   ✅ SRI aplicado para {url}")
        
        if content != original_content:
            with open(template_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"   💾 Template atualizado: {template_path}")
            return True
        else:
            print(f"   ℹ️  Nenhuma alteração necessária: {template_path}")
            return False

    def apply_all_sris(self) -> None:
        """Aplica hashes SRI em todos os templates"""
        print("🔧 Aplicando hashes SRI nos templates...")
        print("=" * 40)
        
        sris = self.load_sris()
        if not sris:
            return
        
        updated_templates = 0
        
        for template_path in self.templates_config.keys():
            if self.apply_sri_to_template(template_path, sris):
                updated_templates += 1
            print()
        
        print(f"✅ SRI aplicado em {updated_templates} templates!")

    def validate_sri(self, url: str, expected_sri: str) -> bool:
        """Valida se o hash SRI está correto para uma URL"""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            content = response.content
            hash_obj = hashlib.sha384(content)
            hash_b64 = hash_obj.digest().encode('base64').decode().strip()
            actual_sri = f"sha384-{hash_b64}"
            
            return actual_sri == expected_sri
            
        except Exception as e:
            print(f"❌ Erro ao validar {url}: {e}")
            return False

    def validate_all_sris(self) -> None:
        """Valida todos os hashes SRI implementados"""
        print("🔍 Validando implementação de SRI...")
        print("=" * 35)
        
        sris = self.load_sris()
        if not sris:
            return
        
        valid_count = 0
        invalid_count = 0
        
        for url, expected_sri in sris.items():
            print(f"📦 Validando: {url}")
            
            if self.validate_sri(url, expected_sri):
                print(f"   ✅ SRI válido")
                valid_count += 1
            else:
                print(f"   ❌ SRI inválido - recurso foi alterado!")
                invalid_count += 1
            print()
        
        print("📊 Relatório de Validação:")
        print("=" * 25)
        print(f"Total de recursos: {len(sris)}")
        print(f"Recursos válidos:  {valid_count}")
        print(f"Recursos inválidos: {invalid_count}")
        
        if invalid_count == 0:
            print("\n🎉 Todos os recursos estão válidos!")
        else:
            print(f"\n⚠️  {invalid_count} recursos precisam de atualização")
            print("🔄 Execute: python3 sri_manager.py generate")

    def monitor_changes(self) -> None:
        """Monitora mudanças nos recursos CDN"""
        print("👁️  Monitorando mudanças nos recursos CDN...")
        print("=" * 40)
        
        sris = self.load_sris()
        if not sris:
            return
        
        changes_detected = False
        
        for url, stored_sri in sris.items():
            print(f"🔍 Verificando: {url}")
            
            current_sri = self.generate_sri(url)
            if current_sri and current_sri != stored_sri:
                print(f"   ⚠️  MUDANÇA DETECTADA!")
                print(f"   Hash armazenado: {stored_sri}")
                print(f"   Hash atual:      {current_sri}")
                changes_detected = True
            elif current_sri:
                print(f"   ✅ Sem mudanças")
            print()
        
        if changes_detected:
            print("🚨 Mudanças detectadas nos recursos CDN!")
            print("🔄 Execute: python3 sri_manager.py generate")
        else:
            print("✅ Nenhuma mudança detectada")

    def check_template_implementation(self) -> None:
        """Verifica se SRI está implementado nos templates"""
        print("🔍 Verificando implementação nos templates...")
        print("=" * 40)
        
        for template_path in self.templates_config.keys():
            template_file = self.project_root / template_path
            
            if not template_file.exists():
                print(f"⚠️  Template não encontrado: {template_path}")
                continue
            
            with open(template_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            print(f"📄 {template_path}")
            
            if "integrity=" in content:
                print("   ✅ SRI implementado")
            else:
                print("   ❌ SRI NÃO implementado")
            print()

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 sri_manager.py [generate|apply|validate|monitor|check]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    manager = SRIManager()
    
    if command == "generate":
        manager.generate_all_sris()
    elif command == "apply":
        manager.apply_all_sris()
    elif command == "validate":
        manager.validate_all_sris()
    elif command == "monitor":
        manager.monitor_changes()
    elif command == "check":
        manager.check_template_implementation()
    else:
        print(f"Comando inválido: {command}")
        print("Comandos disponíveis: generate, apply, validate, monitor, check")
        sys.exit(1)

if __name__ == "__main__":
    main()
