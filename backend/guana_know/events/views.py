"""
Views for events app.
"""

from rest_framework import viewsets, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.utils import timezone
from django.utils.dateparse import parse_date
from .models import Event
from .serializers import EventSerializer, EventListSerializer
from .permissions import IsOwnerOrReadOnly


class EventPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 12


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
    pagination_class = EventPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # allow filtering by owner for dashboard context
    filterset_fields = ['slug', 'category', 'venue__city', 'is_featured', 'is_free', 'owner', 'venue']  # 'venue' ya está incluido
    search_fields = ['title', 'description', 'venue__name']
    ordering_fields = ['start_datetime', 'created_at', 'is_featured']
    ordering = ['-is_featured', 'start_datetime']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventSerializer
    
    def get_queryset(self):
        now = timezone.now()
        user = self.request.user

        if user.is_authenticated:
            # Owners can see their own events regardless of date
            # (so they can review past drafts in the dashboard)
            # But published events are still filtered to upcoming only
            queryset = Event.objects.filter(
                models.Q(status='published', start_datetime__gte=now)
                | models.Q(owner=user)
            )
        else:
            # Public: only upcoming published events
            queryset = Event.objects.filter(
                status='published',
                start_datetime__gte=now,
            )

        categories = self.request.query_params.get('categories')
        if categories:
            queryset = queryset.filter(category__in=categories.split(','))

        start_date = parse_date(self.request.query_params.get('start_date', ''))
        if start_date:
            queryset = queryset.filter(start_datetime__date__gte=start_date)

        end_date = parse_date(self.request.query_params.get('end_date', ''))
        if end_date:
            queryset = queryset.filter(start_datetime__date__lte=end_date)

        return queryset.select_related('venue')
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(
        detail=True,
        methods=['post'],
        url_path='upload-image',
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    )
    def upload_image(self, request, pk=None):
        """
        POST /api/events/{id}/upload-image/
        Accepts: multipart/form-data with field 'image'
        Returns: updated event with new image URL
        """
        event = self.get_object()
        if 'image' not in request.FILES:
            return Response(
                {'detail': 'No se proporcionó ninguna imagen.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        file = request.FILES['image']
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if file.content_type not in allowed_types:
            return Response(
                {'detail': 'Formato no válido. Usa JPG, PNG o WebP.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if file.size > 5 * 1024 * 1024:
            return Response(
                {'detail': 'La imagen no puede pesar más de 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        event.image = file
        event.save()
        serializer = self.get_serializer(event)
        return Response(serializer.data)
    
    def perform_update(self, serializer):
        serializer.save()
