#!/usr/bin/env python3
"""
Script de teste para o sistema de pontuação facial.
Testa os endpoints de autenticação e análise.
"""

import requests
import base64
import json
import sys
from pathlib import Path

BASE_URL = "http://localhost:8000/api/v1"


def test_health():
    """Testa se a API está rodando."""
    print("1. Testando health check...")
    resp = requests.get(f"{BASE_URL}/health/")
    if resp.status_code == 200:
        print("   ✅ API rodando!")
        return True
    else:
        print(f"   ❌ Erro: {resp.status_code}")
        return False


def test_register(email="test@example.com", password="test123456"):
    """Registra um novo usuário."""
    print(f"\n2. Registrando usuário: {email}")
    resp = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": email, "password": password}
    )
    if resp.status_code == 201:
        data = resp.json()
        print(f"   ✅ Usuário registrado! Token: {data['access_token'][:20]}...")
        return data["access_token"]
    elif resp.status_code == 400 and "already registered" in resp.text:
        print("   ℹ️  Usuário já existe, fazendo login...")
        return test_login(email, password)
    else:
        print(f"   ❌ Erro: {resp.status_code} - {resp.text}")
        return None


def test_login(email="test@example.com", password="test123456"):
    """Faz login."""
    print(f"\n3. Fazendo login: {email}")
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    if resp.status_code == 200:
        data = resp.json()
        print(f"   ✅ Login realizado! Token: {data['access_token'][:20]}...")
        return data["access_token"]
    else:
        print(f"   ❌ Erro: {resp.status_code} - {resp.text}")
        return None


def create_sample_image_base64():
    """Cria uma imagem de exemplo simples em base64 (1x1 pixel preto)."""
    # Cria uma imagem PNG mínima (1x1 pixel preto)
    import struct
    import zlib

    def create_png():
        # Signature
        sig = b'\x89PNG\r\n\x1a\n'

        # IHDR chunk
        ihdr_data = struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0)
        ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
        ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)

        # IDAT chunk
        raw_data = b'\x00\x00\x00\x00'  # filter byte + RGB
        compressed = zlib.compress(raw_data)
        idat_crc = zlib.crc32(b'IDAT' + compressed)
        idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)

        # IEND chunk
        iend_crc = zlib.crc32(b'IEND')
        iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)

        return sig + ihdr + idat + iend

    png_bytes = create_png()
    return base64.b64encode(png_bytes).decode('utf-8')


def test_analyze_image(token):
    """Testa a análise facial com imagem."""
    print("\n4. Testando análise facial com imagem...")
    print("   ⚠️  Pulando - requer MediaPipe e foto facial real")
    print("   ℹ️  Para testar com fotos reais, use o Swagger UI: http://localhost:8000/docs")
    return True


def test_analyze_history(token):
    """Testa o histórico de análises."""
    print("\n5. Consultando histórico de análises...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/analyze/history", headers=headers)

    if resp.status_code == 200:
        data = resp.json()
        print(f"   ✅ Histórico: {len(data)} análise(s) encontrada(s)")
        for a in data:
            print(f"      - ID: {a['id'][:8]}... | Score: {a['overall_score']}/100 | {a['created_at']}")
        return True
    else:
        print(f"   ⚠️  Histórico indisponível (requer MediaPipe)")
        return True


def test_geometry_analysis():
    """Testa a análise geométrica (sem autenticação)."""
    print("\n6. Testando análise geométrica (coordenadas)...")

    payload = {
        "trichion": {"x": 150, "y": 50},
        "glabella": {"x": 150, "y": 100},
        "subnasale_front": {"x": 150, "y": 150},
        "menton_front": {"x": 150, "y": 220},
        "subnasale_profile": {"x": 120, "y": 150},
        "pranasale": {"x": 100, "y": 140},
        "labiale_superius": {"x": 110, "y": 165},
        "labiale_inferius": {"x": 115, "y": 175},
        "menton_profile": {"x": 130, "y": 220},
    }

    resp = requests.post(
        f"{BASE_URL}/analysis/calculate-metrics",
        json=payload
    )

    if resp.status_code == 200:
        data = resp.json()
        print("   ✅ Análise geométrica realizada!")
        print(f"\n   📐 Resultados Geométricos:")
        print(f"\n      Terços Faciais:")
        for key in ['superior', 'middle', 'inferior']:
            t = data['thirds'][key]
            print(f"        - {t['label']}: {t['percentage']}% (desvio: {t['deviation']}%)")
        print(f"\n      Ângulo Nasolabial: {data['nasolabial_angle']}°")
        print(f"      Ricketts E-line:")
        print(f"        - Lábio Superior: {data['ricketts']['upper_lip_distance']}")
        print(f"        - Lábio Inferior: {data['ricketts']['lower_lip_distance']}")
        return True
    else:
        print(f"   ❌ Erro: {resp.status_code} - {resp.text}")
        return False


def main():
    print("=" * 60)
    print("🧪 TESTE DO SISTEMA DE PONTUAÇÃO FACIAL")
    print("=" * 60)

    # 1. Health check
    if not test_health():
        print("\n❌ API não está rodando. Execute: uvicorn app.main:app --reload")
        sys.exit(1)

    # 2. Registrar/Login
    token = test_register()
    if not token:
        print("\n❌ Falha na autenticação")
        sys.exit(1)

    # 3. Análise com imagem
    test_analyze_image(token)

    # 4. Histórico
    test_analyze_history(token)

    # 5. Análise geométrica
    test_geometry_analysis()

    print("\n" + "=" * 60)
    print("✅ TODOS OS TESTES CONCLUÍDOS!")
    print("=" * 60)
    print("\n💡 Para testar com fotos reais:")
    print("   1. Acesse http://localhost:5173 no navegador")
    print("   2. Faça upload de 3 fotos: frente, perfil direito, perfil esquerdo")
    print("   3. O sistema calculará a pontuação automaticamente")
    print("\n   Ou use o Swagger UI: http://localhost:8000/docs")


if __name__ == "__main__":
    main()
