# test_analysis_engine.py - Pytest version with proper fixtures
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest
import numpy as np
from typing import TypedDict


# ======================================================================
# MOCKS
# ======================================================================

class MockLandmark:
    """Mock que simula um landmark do MediaPipe com atributos x, y, z."""
    def __init__(self, x: float, y: float, z: float = 0.0):
        self.x = x
        self.y = y
        self.z = z


class MockLandmarks:
    """Mock que simula o resultado do MediaPipe FaceMesh (468 landmarks, indices 0-467)."""

    def __init__(self):
        self.landmarks = [MockLandmark(0.0, 0.0, 0.0) for _ in range(468)]

    def __getitem__(self, idx):
        return self.landmarks[idx]


def criar_rosto_perfeito() -> MockLandmarks:
    """Cria landmarks de um rosto frontal perfeito e simetrico.
    Indices baseados em MediaPipe FaceMesh (0-467).
    Tercos ideais: cada um ~33.3% (distancia igual em y normalizado por DIP)
    """
    lm = MockLandmarks()

    # DIP = 0.4 (distancia entre cantos dos olhos: 0.3 a 0.7)
    # Para tercos ideais (33.3% cada), cada terco deve ter 0.133 * DIP = 0.053 em y
    trichion_y = 0.20
    glabella_y = trichion_y + 0.053   # 0.253
    subnasale_y = glabella_y + 0.053  # 0.306
    menton_y = subnasale_y + 0.053    # 0.359

    # Olhos - cantos (usados para DIP)
    lm.landmarks[33] = MockLandmark(x=0.30, y=0.40, z=0.0)    # canto interno olho esq (OLHO_ESQ_CENTRO)
    lm.landmarks[263] = MockLandmark(x=0.70, y=0.40, z=0.0)   # canto externo olho dir (OLHO_DIR_CENTRO)
    lm.landmarks[133] = MockLandmark(x=0.40, y=0.40, z=0.0)   # canto externo olho esq
    lm.landmarks[362] = MockLandmark(x=0.60, y=0.40, z=0.0)   # canto interno olho dir

    # Sobrancelhas (para roll)
    lm.landmarks[70] = MockLandmark(x=0.35, y=0.35, z=0.0)    # sobrancelha esq
    lm.landmarks[300] = MockLandmark(x=0.65, y=0.35, z=0.0)   # sobrancelha dir

    # Nariz (para yaw) - NARIZ_PONTA = 1, raiz do nariz = 4
    lm.landmarks[1] = MockLandmark(x=0.50, y=0.48, z=0.0)     # ponta do nariz
    lm.landmarks[4] = MockLandmark(x=0.50, y=0.45, z=0.0)     # raiz do nariz

    # Queixo e testa (para tercos) - QUEIXO = 152, TRICHION = 10, GLABELLA = 8, SUBNASALE = 2
    lm.landmarks[10] = MockLandmark(x=0.50, y=trichion_y, z=0.0)    # trichion (testa)
    lm.landmarks[152] = MockLandmark(x=0.50, y=menton_y, z=0.0)     # menton (queixo)
    lm.landmarks[8] = MockLandmark(x=0.50, y=glabella_y, z=0.0)     # glabela (entre olhos)
    lm.landmarks[2] = MockLandmark(x=0.50, y=subnasale_y, z=0.0)    # subnasale

    # Labios - LABIALE_SUPERIUS = 13, LABIALE_INFERIUS = 14
    lm.landmarks[13] = MockLandmark(x=0.50, y=0.60, z=0.0)    # labiale superius
    lm.landmarks[14] = MockLandmark(x=0.50, y=0.65, z=0.0)    # labiale inferius

    # PRANASALE = 1 (ja definido acima como ponta do nariz)

    # Pontos para simetria (pares bilaterais)
    # Olhos - cantos
    lm.landmarks[130] = MockLandmark(x=0.30, y=0.40, z=0.0)
    lm.landmarks[243] = MockLandmark(x=0.40, y=0.40, z=0.0)
    lm.landmarks[463] = MockLandmark(x=0.60, y=0.40, z=0.0)
    lm.landmarks[359] = MockLandmark(x=0.70, y=0.40, z=0.0)

    # Sobrancelhas
    lm.landmarks[66] = MockLandmark(x=0.33, y=0.33, z=0.0)
    lm.landmarks[296] = MockLandmark(x=0.67, y=0.33, z=0.0)

    # Narinas
    lm.landmarks[197] = MockLandmark(x=0.48, y=0.50, z=0.0)
    lm.landmarks[420] = MockLandmark(x=0.52, y=0.50, z=0.0)

    # Comissuras labiais - BOCA_ESQ = 61, BOCA_DIR = 291
    lm.landmarks[61] = MockLandmark(x=0.42, y=0.62, z=0.0)
    lm.landmarks[291] = MockLandmark(x=0.58, y=0.62, z=0.0)

    # Mandibula - LATERAL_ESQ = 234, LATERAL_DIR = 454, MANDIBULA_PONTOS[0] = 172, [1] = 397
    lm.landmarks[234] = MockLandmark(x=0.35, y=0.45, z=0.0)   # lateral esq
    lm.landmarks[454] = MockLandmark(x=0.65, y=0.45, z=0.0)   # lateral dir
    lm.landmarks[172] = MockLandmark(x=0.35, y=0.70, z=0.0)   # angulo mandibular esq
    lm.landmarks[397] = MockLandmark(x=0.65, y=0.70, z=0.0)   # angulo mandibular dir
    lm.landmarks[149] = MockLandmark(x=0.38, y=0.55, z=0.0)   # lateral mandibula esq
    lm.landmarks[378] = MockLandmark(x=0.62, y=0.55, z=0.0)   # lateral mandibula dir
    lm.landmarks[150] = MockLandmark(x=0.40, y=0.65, z=0.0)   # queixo lateral esq
    lm.landmarks[379] = MockLandmark(x=0.60, y=0.65, z=0.0)   # queixo lateral dir

    # Bochechas - BOCHECHA_ESQ = 127, BOCHECHA_DIR = 356
    lm.landmarks[127] = MockLandmark(x=0.35, y=0.50, z=0.0)
    lm.landmarks[356] = MockLandmark(x=0.65, y=0.50, z=0.0)

    return lm


def criar_rosto_inclinado() -> MockLandmarks:
    """Cria landmarks de um rosto inclinado (roll ~10°, yaw ~8°)."""
    lm = criar_rosto_perfeito()

    # Inclinar olhos (roll) - OLHO_ESQ_CENTRO=33, OLHO_DIR_CENTRO=263
    lm.landmarks[33] = MockLandmark(x=0.30, y=0.42, z=0.0)    # olho esq mais alto
    lm.landmarks[263] = MockLandmark(x=0.70, y=0.38, z=0.0)   # olho dir mais baixo

    # Deslocar laterais (yaw) - LATERAL_ESQ=234, LATERAL_DIR=454, BOCHECHA_ESQ=127, BOCHECHA_DIR=356
    lm.landmarks[234] = MockLandmark(x=0.33, y=0.45, z=0.0)   # lateral esq mais central
    lm.landmarks[127] = MockLandmark(x=0.33, y=0.50, z=0.0)   # bochecha esq mais central
    lm.landmarks[454] = MockLandmark(x=0.67, y=0.45, z=0.0)   # lateral dir mais externa
    lm.landmarks[356] = MockLandmark(x=0.67, y=0.50, z=0.0)   # bochecha dir mais externa

    return lm


def criar_rosto_asimetrico() -> MockLandmarks:
    """Cria landmarks com assimetria clara (lado esquerdo diferente do direito)."""
    lm = criar_rosto_perfeito()

    # Deslocar pontos dos PARES_SIMETRIA do lado esquerdo
    # OLHO_EXT_ESQ = 33, OLHO_EXT_DIR = 263
    lm.landmarks[33] = MockLandmark(x=0.25, y=0.40, z=0.0)    # olho esq mais para fora
    # OLHO_INT_ESQ = 133, OLHO_INT_DIR = 362
    lm.landmarks[133] = MockLandmark(x=0.35, y=0.40, z=0.0)
    # BOCHECHA_ESQ = 127, BOCHECHA_DIR = 356
    lm.landmarks[127] = MockLandmark(x=0.30, y=0.50, z=0.0)    # bochecha esq
    # LATERAL_ESQ = 234, LATERAL_DIR = 454
    lm.landmarks[234] = MockLandmark(x=0.28, y=0.45, z=0.0)   # lateral esq mais central
    # BOCA_ESQ = 61, BOCA_DIR = 291
    lm.landmarks[61] = MockLandmark(x=0.35, y=0.62, z=0.0)    # comissura esq

    # Lado direito permanece simetrico
    return lm


def criar_tercos_desbalanceados() -> MockLandmarks:
    """Rosto com tercos desbalanceados (testa grande, queixo pequeno)."""
    lm = criar_rosto_perfeito()
    lm.landmarks[10] = MockLandmark(x=0.50, y=0.15, z=0.0)  # trichion mais alto (testa maior)
    lm.landmarks[8] = MockLandmark(x=0.50, y=0.38, z=0.0)   # glabela
    lm.landmarks[2] = MockLandmark(x=0.50, y=0.50, z=0.0)   # subnasale
    lm.landmarks[152] = MockLandmark(x=0.50, y=0.70, z=0.0) # menton mais perto (queixo menor)
    return lm


# ======================================================================
# FIXTURES
# ======================================================================

@pytest.fixture
def rosto_perfeito():
    """Fixture: rosto perfeitamente simetrico."""
    return criar_rosto_perfeito()


@pytest.fixture
def rosto_inclinado():
    """Fixture: rosto com inclinacao (roll/yaw)."""
    return criar_rosto_inclinado()


@pytest.fixture
def rosto_asimetrico():
    """Fixture: rosto com assimetria."""
    return criar_rosto_asimetrico()


@pytest.fixture
def dip():
    """Fixture: DIP conhecido (0.4 = distancia entre cantos dos olhos)."""
    return 0.4


# ======================================================================
# TESTES - DIP (Distancia Interpupilar)
# ======================================================================

class TestDIP:
    def test_dip_perfeito(self, rosto_perfeito, dip):
        from app.services.analysis_service import calcular_dip
        result = calcular_dip(rosto_perfeito)
        assert abs(result - dip) < 0.001, f"DIP incorreto: {result}"

    def test_dip_positivo(self, rosto_perfeito):
        from app.services.analysis_service import calcular_dip
        result = calcular_dip(rosto_perfeito)
        assert result > 0, "DIP deve ser positivo"


# ======================================================================
# TESTES - INCLINACAO (Roll/Yaw)
# ======================================================================

class TestInclinacao:
    def test_inclinacao_perfeita(self, rosto_perfeito):
        from app.services.analysis_service import calcular_inclinacao
        roll, yaw = calcular_inclinacao(rosto_perfeito)
        assert abs(roll) < 0.5, f"Roll deveria ser ~0, recebeu {roll}"
        assert abs(yaw) < 0.5, f"Yaw deveria ser ~0, recebeu {yaw}"

    def test_inclinacao_rejeicao(self, rosto_inclinado):
        from app.services.analysis_service import calcular_inclinacao
        roll, yaw = calcular_inclinacao(rosto_inclinado)
        rejeitado = abs(roll) > 5 or abs(yaw) > 5
        assert rejeitado, f"Rosto inclinado deveria ser rejeitado: roll={roll}, yaw={yaw}"


# ======================================================================
# TESTES - SIMETRIA
# ======================================================================

class TestSimetria:
    def test_simetria_perfeita(self, rosto_perfeito, dip):
        from app.services.analysis_service import calcular_simetria
        score, detalhes = calcular_simetria(rosto_perfeito, dip)
        assert score >= 90, f"Simetria deveria ser >= 90, recebeu {score}"
        assert "desvio_medio" in detalhes

    def test_simetria_baixa(self, rosto_asimetrico, dip):
        from app.services.analysis_service import calcular_simetria
        score, detalhes = calcular_simetria(rosto_asimetrico, dip)
        assert score < 90, f"Simetria deveria ser < 90 para rosto asimetrico, recebeu {score}"


# ======================================================================
# TESTES - TERCOS FACIAIS
# ======================================================================

class TestTercos:
    def test_tercos_ideais(self, rosto_perfeito, dip):
        from app.services.analysis_service import calcular_tercos
        tercos, detalhes = calcular_tercos(rosto_perfeito, dip)
        for key in ["superior", "medio", "inferior"]:
            assert abs(tercos[key] - 33.3) < 2, f"Terco {key} incorreto: {tercos[key]}"

    def test_tercos_desbalanceados(self, dip):
        from app.services.analysis_service import calcular_tercos
        lm = criar_tercos_desbalanceados()
        tercos, detalhes = calcular_tercos(lm, dip)
        assert tercos["superior"] > 35, f"Terco superior deveria ser > 35%"
        assert tercos["inferior"] < 40, f"Terco inferior deveria ser < 40%"


# ======================================================================
# TESTES - Z-SCORE
# ======================================================================

class TestZScore:
    def test_zscore_ideal(self):
        from app.services.analysis_service import zscore_to_score
        s = zscore_to_score(33.3, 33.3, 3.0)
        assert s == 100.0, f"Valor ideal deveria dar score 100, recebeu {s}"

    def test_zscore_1_sigma(self):
        from app.services.analysis_service import zscore_to_score
        s = zscore_to_score(36.3, 33.3, 3.0)
        assert 55 <= s <= 65, f"1 sigma deveria dar ~60.7, recebeu {s}"

    def test_zscore_2_sigma(self):
        from app.services.analysis_service import zscore_to_score
        s = zscore_to_score(39.3, 33.3, 3.0)
        assert 10 <= s <= 20, f"2 sigma deveria dar ~13.5, recebeu {s}"


# ======================================================================
# TESTES - ANGULO NASOLABIAL
# ======================================================================

class TestAnguloNasolabial:
    def test_angulo_nasolabial(self):
        from app.services.analysis_service import calcular_angulo_nasolabial
        lm = MockLandmarks()
        # SUBNASALE = 2, PRANASALE = 1, LABIALE_SUPERIUS = 13
        lm.landmarks[2] = MockLandmark(x=0.5, y=0.5, z=0.0)    # subnasale (vertice)
        lm.landmarks[1] = MockLandmark(x=0.45, y=0.5, z=0.0)   # pranasale (horizontal)
        lm.landmarks[13] = MockLandmark(x=0.5, y=0.55, z=0.0)  # labiale superius (vertical)

        angulo = calcular_angulo_nasolabial(lm)
        assert 85 <= angulo <= 95, f"Angulo deveria ser ~90, recebeu {angulo}"


# ======================================================================
# TESTES - RICKETTS E-LINE
# ======================================================================

class TestRicketts:
    def test_ricketts(self, rosto_perfeito, dip):
        from app.services.analysis_service import calcular_ricketts
        lm = rosto_perfeito
        # Ajustar para perfil
        lm.landmarks[1] = MockLandmark(x=0.5, y=0.48, z=0.0)    # pranasale
        lm.landmarks[152] = MockLandmark(x=0.5, y=0.65, z=0.0)  # menton
        lm.landmarks[13] = MockLandmark(x=0.5, y=0.54, z=0.0)   # labio superior
        lm.landmarks[14] = MockLandmark(x=0.5, y=0.57, z=0.0)   # labio inferior

        ricketts = calcular_ricketts(lm, dip)
        assert ricketts is not None
        assert "superior" in ricketts
        assert "inferior" in ricketts


# ======================================================================
# TESTES - DUPLICATAS DE IMAGEM
# ======================================================================

class TestDuplicatas:
    def test_imagens_identicas(self):
        from app.services.analysis_service import calcular_histograma_cor, comparar_histogramas
        img1 = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        img2 = img1.copy()

        hist1 = calcular_histograma_cor(img1)
        hist2 = calcular_histograma_cor(img2)
        similaridade = comparar_histogramas(hist1, hist2)

        assert similaridade > 0.95, f"Imagens identicas deveriam ter similaridade > 0.95, recebeu {similaridade}"

    def test_imagens_diferentes(self):
        from app.services.analysis_service import calcular_histograma_cor, comparar_histogramas
        img1 = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        img2 = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)

        hist1 = calcular_histograma_cor(img1)
        hist2 = calcular_histograma_cor(img2)
        similaridade = comparar_histogramas(hist1, hist2)

        assert similaridade < 0.95, f"Imagens diferentes deveriam ter similaridade < 0.95, recebeu {similaridade}"


# ======================================================================
# TESTES - VALIDACAO DE PERFIL
# ======================================================================

class TestValidacaoPerfil:
    def test_perfil_ausente_rejeitado(self):
        from app.services.analysis_service import validar_perfil_landmarks
        from fastapi import HTTPException

        lm = MockLandmarks()
        # Todos os pontos em (0,0) = nao detectados

        with pytest.raises(HTTPException) as exc_info:
            validar_perfil_landmarks(lm, "teste")

        assert exc_info.value.status_code == 422


# ======================================================================
# TESTES - SCORE DE PERFIL
# ======================================================================

class TestScorePerfil:
    def test_score_perfil(self, dip):
        from app.services.analysis_service import _calcular_score_perfil
        lm = criar_rosto_perfeito()

        # Adicionar pontos de mandibula com proporcoes realisticas
        lm.landmarks[172] = MockLandmark(x=0.38, y=0.42, z=0.0)   # angulo mandibular esq
        lm.landmarks[397] = MockLandmark(x=0.62, y=0.42, z=0.0)   # angulo mandibular dir
        lm.landmarks[149] = MockLandmark(x=0.40, y=0.45, z=0.0)   # lateral mandibula esq
        lm.landmarks[378] = MockLandmark(x=0.60, y=0.45, z=0.0)   # lateral mandibula dir
        lm.landmarks[150] = MockLandmark(x=0.42, y=0.48, z=0.0)   # queixo lat esq
        lm.landmarks[379] = MockLandmark(x=0.58, y=0.48, z=0.0)   # queixo lat dir
        lm.landmarks[152] = MockLandmark(x=0.50, y=0.60, z=0.0)   # menton

        # Angulo nasolabial (perfil)
        lm.landmarks[2] = MockLandmark(x=0.5, y=0.50, z=0.0)    # subnasale
        lm.landmarks[1] = MockLandmark(x=0.45, y=0.50, z=0.0)   # pranasale (horizontal)
        lm.landmarks[13] = MockLandmark(x=0.5, y=0.55, z=0.0)   # labiale superius (vertical)

        score = _calcular_score_perfil(lm, dip)
        assert 0 <= score <= 100, f"Score de perfil invalido: {score}"


# ======================================================================
# MAIN
# ======================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])