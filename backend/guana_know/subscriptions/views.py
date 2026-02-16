"""
Views for subscriptions app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Subscription, Plan
from .serializers import SubscriptionSerializer, PlanSerializer


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing subscription plans.
    - GET /api/subscriptions/plans/ - List all active plans
    - GET /api/subscriptions/plans/{id}/ - Get plan details
    """
    
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = []  # Public access


class SubscriptionViewSet(viewsets.ViewSet):
    """
    ViewSet for managing user subscriptions.
    - GET /api/subscriptions/me/ - Get current user subscription
    - POST /api/subscriptions/upgrade/ - Upgrade subscription plan
    """
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's subscription."""
        try:
            subscription = request.user.subscription
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response(
                {'detail': 'User has no subscription.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def upgrade(self, request):
        """Upgrade subscription plan."""
        plan_id = request.data.get('plan_id')
        
        if not plan_id:
            return Response(
                {'detail': 'plan_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            plan = Plan.objects.get(id=plan_id)
        except Plan.DoesNotExist:
            return Response(
                {'detail': 'Plan not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        subscription, created = Subscription.objects.get_or_create(
            user=request.user,
            defaults={'plan': plan}
        )
        
        if not created:
            subscription.plan = plan
            subscription.save()
        
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data, status=status.HTTP_200_OK)
