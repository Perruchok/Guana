"""
Admin configuration for events app.
"""

from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'venue', 'start_datetime', 'status', 'is_featured', 'created_at']
    list_filter = ['status', 'category', 'is_featured', 'is_free', 'start_datetime']
    search_fields = ['title', 'description', 'owner__username', 'venue__name']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'category', 'owner', 'venue')
        }),
        ('Date & Time', {
            'fields': ('start_datetime', 'end_datetime')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Registration', {
            'fields': ('capacity', 'registered_count', 'is_free', 'price', 'registration_url')
        }),
        ('Status', {
            'fields': ('status', 'is_featured')
        }),
    )
