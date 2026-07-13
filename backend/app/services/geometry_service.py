"""
Geometry Service - Pure mathematical computations for facial analysis.

Processes structured coordinate data (x, y) of anatomical landmarks
to derive geometric measurements used in facial aesthetic evaluation.
"""

import math
from typing import TypedDict


class Point(TypedDict):
    x: float
    y: float


class ThirdResult(TypedDict):
    label: str
    distance: float
    percentage: float
    deviation: float


class GeometryService:
    """
    Async service for geometric facial calculations.

    All methods are pure math — no database or I/O dependencies.
    Designed to receive pre-extracted landmark coordinates from
    upstream detection (MediaPipe, dlib, or manual annotation).
    """

    IDEAL_THIRD_RATIO: float = 100.0 / 3.0  # ~33.333...

    # ------------------------------------------------------------------ #
    #  1. Facial Thirds
    # ------------------------------------------------------------------ #

    async def calculate_facial_thirds(
        self,
        trichion: Point,
        glabella: Point,
        subnasale: Point,
        menton: Point,
    ) -> dict[str, ThirdResult]:
        """
        Compute the vertical thirds of the face.

        The face is divided into three segments:
          - Superior  : Trichion → Glabella
          - Middle    : Glabella → Subnasale
          - Inferior  : Subnasale → Menton

        Args:
            trichion:   Hairline midpoint `{"x", "y"}`.
            glabella:   Point between the eyebrows `{"x", "y"}`.
            subnasale:  Base of the nasal septum `{"x", "y"}`.
            menton:     Lowest point of the chin `{"x", "y"}`.

        Returns:
            Dict with keys ``"superior"``, ``"middle"``, ``"inferior"``,
            each containing distance (px), percentage of total height,
            and absolute deviation from the ideal 33.3% target.
        """
        superior = abs(glabella["y"] - trichion["y"])
        middle = abs(subnasale["y"] - glabella["y"])
        inferior = abs(menton["y"] - subnasale["y"])
        total = superior + middle + inferior

        if total == 0:
            zero = ThirdResult(label="", distance=0.0, percentage=0.0, deviation=0.0)
            return {"superior": zero, "middle": zero, "inferior": zero}

        pct_superior = (superior / total) * 100.0
        pct_middle = (middle / total) * 100.0
        pct_inferior = (inferior / total) * 100.0

        return {
            "superior": ThirdResult(
                label="Terço Superior (Testa)",
                distance=round(superior, 4),
                percentage=round(pct_superior, 2),
                deviation=round(abs(pct_superior - self.IDEAL_THIRD_RATIO), 2),
            ),
            "middle": ThirdResult(
                label="Terço Médio (Nariz)",
                distance=round(middle, 4),
                percentage=round(pct_middle, 2),
                deviation=round(abs(pct_middle - self.IDEAL_THIRD_RATIO), 2),
            ),
            "inferior": ThirdResult(
                label="Terço Inferior (Mandíbula)",
                distance=round(inferior, 4),
                percentage=round(pct_inferior, 2),
                deviation=round(abs(pct_inferior - self.IDEAL_THIRD_RATIO), 2),
            ),
        }

    # ------------------------------------------------------------------ #
    #  2. Nasolabial Angle
    # ------------------------------------------------------------------ #

    async def calculate_nasolabial_angle(
        self,
        subnasale: Point,
        pranasale: Point,
        labiale_superius: Point,
    ) -> float:
        """
        Compute the nasolabial angle (profile view).

        The angle is formed at the Subnasale between two vectors:
          - Vector A : Subnasale → Pranasale (nose tip)
          - Vector B : Subnasale → Labiale Superius (upper lip)

        Uses ``atan2`` for each vector's direction, then computes
        the absolute difference, converted to degrees.

        Args:
            subnasale:      Base of nasal septum `{"x", "y"}`.
            pranasale:      Nose tip `{"x", "y"}`.
            labiale_superius: Upper lip margin `{"x", "y"}`.

        Returns:
            Angle in degrees (float), always in [0, 180].
        """
        # Vector A: Subnasale → Pranasale
        dx_a = pranasale["x"] - subnasale["x"]
        dy_a = pranasale["y"] - subnasale["y"]
        angle_a = math.atan2(dy_a, dx_a)

        # Vector B: Subnasale → Labiale Superius
        dx_b = labiale_superius["x"] - subnasale["x"]
        dy_b = labiale_superius["y"] - subnasale["y"]
        angle_b = math.atan2(dy_b, dx_b)

        # Absolute difference, clamped to [0, π]
        diff = abs(angle_a - angle_b)
        if diff > math.pi:
            diff = 2 * math.pi - diff

        return round(math.degrees(diff), 2)

    # ------------------------------------------------------------------ #
    #  3. Ricketts E-Line (Esthetic Line)
    # ------------------------------------------------------------------ #

    async def calculate_ricketts_line(
        self,
        pranasale: Point,
        menton: Point,
        labiale_superius: Point,
        labiale_inferius: Point,
    ) -> dict[str, float]:
        """
        Compute the perpendicular distances from the lips to the
        Ricketts Esthetic Line (E-line).

        The E-line is drawn from Pranasale (nose tip) to Menton (chin tip).
        The perpendicular distance of each lip point to this line indicates
        lip prominence relative to the profile.

        Formula (point-to-line distance):
            For line through P₁, P₂ and point Q:
            d = |((P₂.y - P₁.y)·Q.x - (P₂.x - P₁.x)·Q.y + P₂.x·P₁.y - P₂.y·P₁.x)|
                / √((P₂.y - P₁.y)² + (P₂.x - P₁.x)²)

        Positive distance = lip is anterior (in front of) the E-line.
        Negative distance = lip is posterior (behind) the E-line.

        Args:
            pranasale:        Nose tip `{"x", "y"}`.
            menton:           Chin tip `{"x", "y"}`.
            labiale_superius: Upper lip margin `{"x", "y"}`.
            labiale_inferius: Lower lip margin `{"x", "y"}`.

        Returns:
            Dict with ``"upper_lip_distance"`` and ``"lower_lip_distance"``
            in the same coordinate units (px or mm depending on input).
        """
        dx = menton["x"] - pranasale["x"]
        dy = menton["y"] - pranasale["y"]
        line_length = math.hypot(dx, dy)

        if line_length == 0:
            return {"upper_lip_distance": 0.0, "lower_lip_distance": 0.0}

        def _perpendicular_distance(point: Point) -> float:
            """Signed perpendicular distance from *point* to the E-line."""
            cross = dy * point["x"] - dx * point["y"]
            cross += menton["x"] * pranasale["y"] - menton["y"] * pranasale["x"]
            return cross / line_length

        upper = _perpendicular_distance(labiale_superius)
        lower = _perpendicular_distance(labiale_inferius)

        return {
            "upper_lip_distance": round(upper, 4),
            "lower_lip_distance": round(lower, 4),
        }
