"""
Analysis API Endpoints - PRODUCTION GRADE
==========================================
Physics-based grid analysis with real validation.
"""

from fastapi import APIRouter, Request, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from app.core.physics_engine import GridComponent, PhysicsEngine

router = APIRouter()


class AnalysisRequest(BaseModel):
    """Request for grid analysis"""
    substation_id: str = Field(..., description="Substation identifier")
    input_energy_mwh: float = Field(..., gt=0, description="Input energy in MWh")
    output_energy_mwh: float = Field(..., ge=0, description="Output energy in MWh")
    components: List[Dict[str, Any]] = Field(..., description="Grid components")
    time_window_hours: float = Field(24.0, description="Analysis window in hours")
    
    class Config:
        json_schema_extra = {
            "example": {
                "substation_id": "SS001",
                "input_energy_mwh": 1000.0,
                "output_energy_mwh": 975.0,
                "time_window_hours": 24.0,
                "components": [
                    {
                        "component_id": "TX001",
                        "component_type": "transformer",
                        "rated_capacity_kva": 1000,
                        "efficiency_rating": 0.98,
                        "age_years": 10
                    },
                    {
                        "component_id": "LINE001",
                        "component_type": "distribution_line",
                        "rated_capacity_kva": 500,
                        "length_km": 5.0,
                        "resistance_ohms": 0.5
                    }
                ]
            }
        }


@router.post("/validate")
async def validate_grid_section(
    request: AnalysisRequest,
    fastapi_request: Request
) -> Dict[str, Any]:
    """
    Validate energy conservation for a grid section.
    
    Uses physics-based analysis to:
    1. Check First Law of Thermodynamics
    2. Compute expected technical losses
    3. Identify residual (unexplained) losses
    4. Quantify uncertainty
    5. Refuse if confidence too low
    
    Returns:
        Physics validation result with confidence scores
    """
    # Get physics engine from app state
    physics_engine: PhysicsEngine = fastapi_request.app.state.physics_engine
    
    # Convert component dicts to GridComponent objects
    try:
        components = [
            GridComponent(
                component_id=c.get("component_id", "unknown"),
                component_type=c.get("component_type", "generic"),
                rated_capacity_kva=c.get("rated_capacity_kva", 100),
                voltage_kv=c.get("voltage_kv"),
                resistance_ohms=c.get("resistance_ohms"),
                length_km=c.get("length_km"),
                efficiency_rating=c.get("efficiency_rating"),
                age_years=c.get("age_years"),
                load_factor=c.get("load_factor")
            )
            for c in request.components
        ]
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid component data: {str(e)}"
        )
    
    # Run physics validation
    result = physics_engine.validate_energy_conservation(
        input_energy_mwh=request.input_energy_mwh,
        output_energy_mwh=request.output_energy_mwh,
        components=components,
        time_window_hours=request.time_window_hours
    )
    
    # Return as dict
    return {
        "substation_id": request.substation_id,
        "analysis": result.to_dict(),
        "metadata": {
            "engine": "Physics Truth Engine",
            "version": "2.0.0",
            "methodology": "First-principles thermodynamics"
        }
    }


@router.get("/")
async def list_analyses():
    """
    List recent analyses.
    
    Note: Requires database schema - not yet implemented.
    """
    return {
        "message": "Analysis history requires database implementation",
        "todo": "Create analyses table and implement query"
    }
