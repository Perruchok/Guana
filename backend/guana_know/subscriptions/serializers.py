"""
Serializers for subscriptions app.
"""

from rest_framework import serializers
from .models import Subscription, Plan


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""
    
    class Meta:
        model = Plan
        fields = [
            'id',
            'name',
            'description',
            'price_monthly',
            'max_venues',
            'max_events_per_month',
            'features',
            'is_active',
        ]
        read_only_fields = ['id']


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for user subscriptions."""
    
    plan_name = serializers.CharField(
        source='plan.name',
        read_only=True
    )
    user_email = serializers.CharField(
        source='user.email',
        read_only=True
    )
    
    class Meta:
        model = Subscription
        fields = [
            'id',
            'user',
            'user_email',
            'plan',
            'plan_name',
            'status',
            'start_date',
            'end_date',
            'renewal_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'stripe_customer_id',
            'stripe_subscription_id',
            'start_date',
            'created_at',
            'updated_at',
        ]
