"""Core module - redirects to app.api.core for backwards compatibility"""
from app.api.core import config, security

__all__ = ["config", "security"]

