"""API package - uses lazy import to avoid circular dependency"""

def get_endpoints():
    """Lazy import of endpoints to avoid circular import"""
    from app.api.v1 import endpoints
    return endpoints

__all__ = ["get_endpoints"]
