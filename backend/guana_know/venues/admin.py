"""
Admin configuration for venues app.
"""

from django.contrib import admin
from .models import Venue


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'category', 'city', 'status', 'is_featured', 'created_at']
    list_filter = ['status', 'category', 'city', 'is_featured', 'created_at']
    search_fields = ['name', 'description', 'owner__username']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'category', 'owner')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'postal_code', 'latitude', 'longitude')
        }),
        ('Contact', {
            'fields': ('phone', 'email', 'website')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Status', {
            'fields': ('status', 'is_featured')
        }),
    )
