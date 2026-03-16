"""
Custom DRF throttle classes for auth-sensitive endpoints.
"""

from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Limit login attempts to 5/minute per IP."""
    scope = 'login'


class RegisterRateThrottle(AnonRateThrottle):
    """Limit registration attempts to 10/hour per IP."""
    scope = 'register'
