import factory
from django.contrib.auth import get_user_model
from guana_know.subscriptions.models import Plan, Subscription

User = get_user_model()

class PlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Plan

    id = factory.Sequence(lambda n: f"plan{n}")
    name = factory.Sequence(lambda n: f"Plan {n}")
    description = "A plan"
    price_monthly = 0
    max_venues = 1
    max_events_per_month = 10
    features = {}
    is_active = True

class SubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subscription

    user = factory.SubFactory('guana_know.users.tests.factories.UserFactory')
    plan = factory.SubFactory(PlanFactory)
    status = 'active'
