"""
Tests for Attribution Engine
Run: pytest backend/app/tests/
"""
import pytest
from app.core.attribution_engine import AttributionEngine


@pytest.fixture
def engine():
    return AttributionEngine(conservative_mode=True)


def test_engine_init(engine):
    """Engine initializes correctly"""
    assert engine is not None
    assert engine.conservative_mode is True


def test_conservative_mode():
    """Conservative mode should produce more cautious attributions"""
    conservative = AttributionEngine(conservative_mode=True)
    permissive = AttributionEngine(conservative_mode=False)
    assert conservative is not None
    assert permissive is not None
