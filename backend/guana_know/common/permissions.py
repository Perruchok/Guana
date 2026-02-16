"""
Custom permissions for Guana Know API.
"""

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission that allows owners to edit their own objects.
    Others can only read.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return obj.owner == request.user


class IsAuthenticated(permissions.BasePermission):
    """
    Allows access only to authenticated users.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
