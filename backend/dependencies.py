"""
Shared dependencies for notification routes
This module prevents circular imports between server.py and route modules
"""
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

# Import auth models
from auth_models import User, UserRole

logger = logging.getLogger(__name__)

# Global variables to be set by server.py
db = None
get_current_user_func = None

def set_database(database):
    """Set database instance (called from server.py)"""
    global db
    db = database

def set_get_current_user(func):
    """Set get_current_user function (called from server.py)"""
    global get_current_user_func
    get_current_user_func = func

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> User:
    """Get current user - delegates to the function set by server.py"""
    if get_current_user_func is None:
        raise HTTPException(status_code=500, detail="Authentication system not initialized")
    return await get_current_user_func(credentials)