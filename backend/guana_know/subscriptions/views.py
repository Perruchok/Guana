"""
Views for subscriptions app.
"""

import logging

import stripe
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Subscription, Plan
from .serializers import SubscriptionSerializer, PlanSerializer

logger = logging.getLogger(__name__)


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


# ---------------------------------------------------------------------------
# Stripe Webhook — must be outside of the DRF ViewSet because it needs the
# raw request body for signature verification before any parsing happens.
# ---------------------------------------------------------------------------

@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Receive and validate Stripe webhook events.
    Registered in Stripe dashboard at: /api/subscriptions/webhook/
    Expected events:
      - checkout.session.completed
      - customer.subscription.updated
      - customer.subscription.deleted
      - invoice.payment_failed
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.warning('Stripe webhook: invalid payload')
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        logger.warning('Stripe webhook: invalid signature')
        return HttpResponse(status=400)

    event_type = event['type']
    data = event['data']['object']

    handlers = {
        'checkout.session.completed': _handle_checkout_session_completed,
        'customer.subscription.updated': _handle_subscription_updated,
        'customer.subscription.deleted': _handle_subscription_deleted,
        'invoice.payment_failed': _handle_invoice_payment_failed,
    }

    handler = handlers.get(event_type)
    if handler:
        handler(data)
    else:
        logger.debug('Stripe webhook: unhandled event type %s', event_type)

    return JsonResponse({'status': 'ok'})


def _handle_checkout_session_completed(session):
    stripe_customer_id = session.get('customer')
    stripe_subscription_id = session.get('subscription')

    if not stripe_subscription_id:
        return

    try:
        subscription = Subscription.objects.get(stripe_customer_id=stripe_customer_id)
        subscription.stripe_subscription_id = stripe_subscription_id
        subscription.status = 'active'
        subscription.save(update_fields=['stripe_subscription_id', 'status'])
    except Subscription.DoesNotExist:
        logger.warning(
            'Stripe webhook: no subscription found for customer %s', stripe_customer_id
        )


_STRIPE_STATUS_MAP = {
    'active': 'active',
    'trialing': 'active',
    'past_due': 'active',
    'canceled': 'cancelled',
    'incomplete': 'pending',
    'incomplete_expired': 'expired',
    'unpaid': 'expired',
}


def _handle_subscription_updated(stripe_sub):
    stripe_sub_id = stripe_sub.get('id')
    stripe_status = stripe_sub.get('status')

    try:
        subscription = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        subscription.status = _STRIPE_STATUS_MAP.get(stripe_status, subscription.status)
        subscription.save(update_fields=['status'])
    except Subscription.DoesNotExist:
        logger.warning(
            'Stripe webhook: no subscription found for stripe_subscription_id %s', stripe_sub_id
        )


def _handle_subscription_deleted(stripe_sub):
    stripe_sub_id = stripe_sub.get('id')

    try:
        subscription = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        subscription.status = 'cancelled'
        subscription.save(update_fields=['status'])
    except Subscription.DoesNotExist:
        logger.warning(
            'Stripe webhook: no subscription found for stripe_subscription_id %s', stripe_sub_id
        )


def _handle_invoice_payment_failed(invoice):
    stripe_customer_id = invoice.get('customer')

    try:
        subscription = Subscription.objects.get(stripe_customer_id=stripe_customer_id)
        subscription.status = 'expired'
        subscription.save(update_fields=['status'])
    except Subscription.DoesNotExist:
        logger.warning(
            'Stripe webhook: no subscription found for customer %s', stripe_customer_id
        )
