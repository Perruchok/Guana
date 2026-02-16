"""
Views for users app.
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users.
    - GET /api/users/ - List all users (public)
    - POST /api/users/ - Register new user
    - GET /api/users/{id}/ - Get user profile (public)
    - PUT /api/users/{id}/ - Update own profile (auth required)
    - DELETE /api/users/{id}/ - Delete own profile (auth required)
    - GET /api/users/me/ - Get current user profile
    """
    
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        serializer.save()
    
    def perform_update(self, serializer):
        if self.request.user != self.get_object():
            self.permission_denied(
                self.request,
                'You can only edit your own profile.'
            )
        serializer.save()
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current authenticated user profile."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view with extended user data."""
    serializer_class = CustomTokenObtainPairSerializer
