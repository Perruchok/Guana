"""
Serializers for venues app.
"""

from django.utils.text import slugify
from rest_framework import serializers
from .models import Venue


class VenueSerializer(serializers.ModelSerializer):
    """Serializer for venue details."""

    slug = serializers.SlugField(required=False, allow_blank=True, max_length=255)
    
    owner_name = serializers.CharField(
        source='owner.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = Venue
        fields = [
            'id',
            'owner',
            'owner_name',
            'name',
            'slug',
            'description',
            'category',
            'address',
            'city',
            'state',
            'postal_code',
            'latitude',
            'longitude',
            'phone',
            'email',
            'website',
            'image',
            'status',
            'is_featured',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate(self, data):
        slug = (data.get('slug') or '').strip()
        name = (data.get('name') or getattr(self.instance, 'name', '') or '').strip()

        if not slug and name:
            slug = slugify(name)

        if not slug:
            raise serializers.ValidationError({'slug': 'Slug is required.'})

        data['slug'] = slug[:255]
        self._validate_unique_slug(data['slug'])
        return data

    def _validate_unique_slug(self, slug):
        venue_id = self.instance.id if self.instance else None
        queryset = Venue.objects.filter(slug=slug)
        if venue_id:
            queryset = queryset.exclude(id=venue_id)
        if queryset.exists():
            raise serializers.ValidationError({'slug': 'A venue with this slug already exists.'})


class VenueListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for venue listings."""
    
    owner_name = serializers.CharField(
        source='owner.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = Venue
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'city',
            'status',
            'image',
            'is_featured',
            'owner',
            'owner_name',
        ]
