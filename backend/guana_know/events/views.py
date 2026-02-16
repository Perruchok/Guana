"""
Views for events app.
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.utils import timezone
from .models import Event
from .serializers import EventSerializer, EventListSerializer
from .permissions import IsOwnerOrReadOnly


class EventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing events.
    - GET /api/events/ - List all published upcoming events
    - POST /api/events/ - Create event (auth required)
    - GET /api/events/{id}/ - Get event details
    - PUT /api/events/{id}/ - Update event (owner only)
    - DELETE /api/events/{id}/ - Delete event (owner only)
    """
    
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'venue__city', 'is_featured', 'is_free']
    search_fields = ['title', 'description', 'venue__name']
    ordering_fields = ['start_datetime', 'created_at', 'is_featured']
    ordering = ['-is_featured', 'start_datetime']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.filter(status='published')
        
        if user.is_authenticated:
            queryset = Event.objects.filter(
                models.Q(status='published') | models.Q(owner=user)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save()
