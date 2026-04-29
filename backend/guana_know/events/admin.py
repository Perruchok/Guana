"""
Admin configuration for events app.
"""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Event


def publish_events(modeladmin, request, queryset):
    updated = queryset.filter(status='draft').update(status='published')
    modeladmin.message_user(request, _(f'{updated} event(s) published successfully.'))

publish_events.short_description = 'Publish selected events'


def unpublish_events(modeladmin, request, queryset):
    updated = queryset.exclude(status='draft').update(status='draft')
    modeladmin.message_user(request, _(f'{updated} event(s) moved back to draft.'))

unpublish_events.short_description = 'Move selected events to draft'


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'venue', 'start_datetime', 'status', 'is_featured', 'created_at']
    list_filter = ['status', 'category', 'is_featured', 'is_free', 'start_datetime']
    search_fields = ['title', 'description', 'owner__username', 'venue__name']
    prepopulated_fields = {'slug': ('title',)}
    ordering = ['-created_at']
    actions = [publish_events, unpublish_events]

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
