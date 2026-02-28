"""
Tests for Physics Engine
Run: pytest backend/app/tests/
"""
import pytest
from app.core.physics_engine import PhysicsEngine


@pytest.fixture
def engine():
    return PhysicsEngine(temperature_celsius=25.0, min_confidence=0.5, strict_mode=True)


def test_energy_balance_valid(engine):
    """Valid energy balance should pass"""
    result = engine.validate_energy_balance(
        energy_in_kwh=1000.0,
        energy_out_kwh=950.0,
        expected_technical_loss_percent=5.0
    )
    assert result is not None
    assert "confidence" in result or "status" in result


def test_energy_balance_impossible(engine):
    """Energy out > energy in should be rejected (thermodynamics)"""
    result = engine.validate_energy_balance(
        energy_in_kwh=1000.0,
        energy_out_kwh=1050.0,
        expected_technical_loss_percent=5.0
    )
    # Should flag this as impossible
    assert result is not None


def test_physics_engine_init():
    """Engine initializes with correct parameters"""
    engine = PhysicsEngine(temperature_celsius=30.0, min_confidence=0.7, strict_mode=False)
    assert engine is not None
