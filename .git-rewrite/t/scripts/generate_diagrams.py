#!/usr/bin/env python3
"""
Script pour générer des images PNG/SVG à partir des diagrammes Mermaid
Utilise mermaid-cli (mmdc)
"""

import subprocess
import os
from pathlib import Path

def check_mmdc():
    """Vérifie si mermaid-cli est installé"""
    try:
        subprocess.run(['mmdc', '--version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def install_mmdc():
    """Instructions pour installer mermaid-cli"""
    print("❌ mermaid-cli (mmdc) n'est pas installé")
    print("\nPour installer:")
    print("  npm install -g @mermaid-js/mermaid-cli")
    print("\nOu avec Homebrew:")
    print("  brew install mermaid-cli")

def extract_mermaid_blocks(md_file):
    """Extrait les blocs Mermaid d'un fichier Markdown"""
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    blocks = []
    in_mermaid = False
    current_block = []
    block_name = None
    
    for line in content.split('\n'):
        if line.strip() == '```mermaid':
            in_mermaid = True
            current_block = []
        elif line.strip() == '```' and in_mermaid:
            in_mermaid = False
            if current_block:
                blocks.append('\n'.join(current_block))
            current_block = []
        elif in_mermaid:
            current_block.append(line)
    
    return blocks

def generate_images(md_file, output_dir='docs/images'):
    """Génère des images PNG et SVG pour chaque diagramme"""
    
    if not check_mmdc():
        install_mmdc()
        return
    
    # Créer le dossier de sortie
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Extraire les blocs Mermaid
    blocks = extract_mermaid_blocks(md_file)
    
    print(f"✅ Trouvé {len(blocks)} diagrammes Mermaid")
    
    # Noms des diagrammes
    names = [
        'architecture-complete',
        'flux-scenario',
        'flux-analyse',
        'rate-limiting',
        'dynamodb-schema',
        'monitoring',
        'costs',
        'security-layers'
    ]
    
    for i, (block, name) in enumerate(zip(blocks, names), 1):
        # Créer un fichier temporaire
        temp_file = f'/tmp/mermaid_{i}.mmd'
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(block)
        
        # Générer PNG
        png_output = f'{output_dir}/{name}.png'
        svg_output = f'{output_dir}/{name}.svg'
        
        try:
            # PNG avec fond blanc
            subprocess.run([
                'mmdc',
                '-i', temp_file,
                '-o', png_output,
                '-b', 'white',
                '-w', '2000',
                '-H', '1500'
            ], check=True, capture_output=True)
            print(f"✅ Généré: {png_output}")
            
            # SVG
            subprocess.run([
                'mmdc',
                '-i', temp_file,
                '-o', svg_output,
                '-b', 'white'
            ], check=True, capture_output=True)
            print(f"✅ Généré: {svg_output}")
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Erreur pour {name}: {e.stderr.decode()}")
        
        # Nettoyer
        os.remove(temp_file)
    
    print(f"\n🎉 Images générées dans {output_dir}/")

if __name__ == '__main__':
    generate_images('docs/architecture-diagram.md')
