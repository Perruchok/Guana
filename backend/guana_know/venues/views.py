"""
Views for venues app.
"""

from rest_framework import viewsets, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
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
    - GET /api/venues/me/ - List venues owned by current user
    """
    
    queryset = Venue.objects.filter(status='published')
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'city', 'is_featured', 'slug', 'status']
    search_fields = ['name', 'description', 'address', 'slug']
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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return venues owned by the authenticated user."""
        qs = Venue.objects.filter(owner=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=['post'],
        url_path='upload-image',
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    )
    def upload_image(self, request, pk=None):
        """
        POST /api/venues/{id}/upload-image/
        Accepts: multipart/form-data with field 'image'
        Returns: updated venue with new image URL
        """
        venue = self.get_object()
        if 'image' not in request.FILES:
            return Response(
                {'detail': 'No se proporcionó ninguna imagen.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['image']

        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if file.content_type not in allowed_types:
            return Response(
                {'detail': 'Formato no válido. Usa JPG, PNG o WebP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (max 5MB)
        if file.size > 5 * 1024 * 1024:
            return Response(
                {'detail': 'La imagen no puede pesar más de 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        venue.image = file
        venue.save()
        serializer = self.get_serializer(venue)
        return Response(serializer.data)
