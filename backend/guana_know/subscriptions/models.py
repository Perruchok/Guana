"""
Subscription models for Guana Know.
"""

from django.db import models
from django.contrib.auth import get_user_model
from guana_know.common.models import BaseModel

User = get_user_model()


class Plan(models.Model):
    """Subscription plan tiers."""
    
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('pro', 'Professional'),
    ]
    
    id = models.CharField(
        max_length=50,
        primary_key=True,
        choices=PLAN_CHOICES
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    price_monthly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Price in MXN per month. 0 for free plans.'
    )
    
    max_venues = models.IntegerField(
        default=1,
        help_text='Maximum number of venues this plan allows.'
    )
    
    max_events_per_month = models.IntegerField(
        default=10,
        help_text='Maximum events per month.'
    )
    
    features = models.JSONField(
        default=dict,
        help_text='Key features as JSON object.'
    )
    
    stripe_product_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='Stripe product ID for this plan.'
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['price_monthly']
        verbose_name = 'Subscription Plan'
        verbose_name_plural = 'Subscription Plans'
    
    def __str__(self):
        return self.name


class Subscription(BaseModel):
    """User subscription records."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('pending', 'Pending'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        default='free'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True
    )
    
    stripe_customer_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='Stripe customer ID.'
    )
    
    stripe_subscription_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='Stripe subscription ID.'
    )
    
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    renewal_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'
    
    def __str__(self):
        return f'{self.user.username} - {self.plan.name}'
