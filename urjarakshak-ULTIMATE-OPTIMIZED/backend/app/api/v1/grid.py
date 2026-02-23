"""Grid Management API"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_grids():
    return {"grids": [], "message": "Grid management requires database"}
