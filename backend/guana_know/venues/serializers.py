"""
Serializers for venues app.
"""

from rest_framework import serializers
from .models import Venue


class VenueSerializer(serializers.ModelSerializer):
    """Serializer for venue details."""
    
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
    
    def validate_slug(self, value):
        venue_id = self.instance.id if self.instance else None
        queryset = Venue.objects.filter(slug=value)
        if venue_id:
            queryset = queryset.exclude(id=venue_id)
        if queryset.exists():
            raise serializers.ValidationError('A venue with this slug already exists.')
        return value


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
            'image',
            'is_featured',
            'owner_name',
        ]
