"""
Views for venues app.
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from .models import Venue
from .serializers import VenueSerializer, VenueListSerializer
from .permissions import IsOwnerOrReadOnly


class VenueViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing venues.
    - GET /api/venues/ - List all published venues
    - POST /api/venues/ - Create venue (auth required)
    - GET /api/venues/{id}/ - Get venue details
    - PUT /api/venues/{id}/ - Update venue (owner only)
    - DELETE /api/venues/{id}/ - Delete venue (owner only)
    """
    
    queryset = Venue.objects.filter(status='published')
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'city', 'is_featured']
    search_fields = ['name', 'description', 'address']
    ordering_fields = ['created_at', 'name', 'is_featured']
    ordering = ['-is_featured', '-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VenueListSerializer
        return VenueSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Venue.objects.filter(
                models.Q(status='published') | models.Q(owner=user)
            )
        return Venue.objects.filter(status='published')
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save()


from django.db import models
