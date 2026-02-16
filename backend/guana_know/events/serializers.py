"""
Serializers for events app.
"""

from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    """Serializer for event details."""
    
    owner_name = serializers.CharField(
        source='owner.get_full_name',
        read_only=True
    )
    venue_name = serializers.CharField(
        source='venue.name',
        read_only=True
    )
    is_upcoming = serializers.SerializerMethodField()
    is_ongoing = serializers.SerializerMethodField()
    is_past = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id',
            'owner',
            'owner_name',
            'venue',
            'venue_name',
            'title',
            'slug',
            'description',
            'category',
            'image',
            'start_datetime',
            'end_datetime',
            'capacity',
            'registered_count',
            'price',
            'is_free',
            'registration_url',
            'status',
            'is_featured',
            'is_upcoming',
            'is_ongoing',
            'is_past',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'registered_count', 'created_at', 'updated_at']
    
    def get_is_upcoming(self, obj):
        return obj.is_upcoming()
    
    def get_is_ongoing(self, obj):
        return obj.is_ongoing()
    
    def get_is_past(self, obj):
        return obj.is_past()
    
    def validate_slug(self, value):
        event_id = self.instance.id if self.instance else None
        queryset = Event.objects.filter(slug=value)
        if event_id:
            queryset = queryset.exclude(id=event_id)
        if queryset.exists():
            raise serializers.ValidationError('An event with this slug already exists.')
        return value
    
    def validate(self, data):
        if data.get('end_datetime') and data.get('start_datetime'):
            if data['end_datetime'] <= data['start_datetime']:
                raise serializers.ValidationError({
                    'end_datetime': 'End time must be after start time.'
                })
        
        if data.get('price') and data['price'] > 0:
            data['is_free'] = False
        
        return data


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event listings."""
    
    venue_name = serializers.CharField(
        source='venue.name',
        read_only=True
    )
    owner_name = serializers.CharField(
        source='owner.get_full_name',
        read_only=True
    )
    
    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'slug',
            'category',
            'image',
            'start_datetime',
            'venue_name',
            'is_free',
            'price',
            'is_featured',
            'owner_name',
        ]
