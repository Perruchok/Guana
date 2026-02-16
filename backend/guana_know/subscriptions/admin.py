"""
Admin configuration for subscriptions app.
"""

from django.contrib import admin
from .models import Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price_monthly', 'max_venues', 'max_events_per_month', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'start_date', 'renewal_date']
    list_filter = ['status', 'plan', 'start_date']
    search_fields = ['user__username', 'user__email']
    ordering = ['-created_at']
