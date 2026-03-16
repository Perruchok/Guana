"""
URL configuration for subscriptions app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlanViewSet, SubscriptionViewSet, stripe_webhook

router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('webhook/', stripe_webhook, name='stripe-webhook'),
    path('', include(router.urls)),
]
