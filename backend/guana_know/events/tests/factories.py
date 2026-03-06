import factory
from django.utils import timezone
from django.contrib.auth import get_user_model
from guana_know.events.models import Event
from guana_know.venues.tests.factories import VenueFactory

User = get_user_model()

class EventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Event

    owner = factory.SubFactory('guana_know.users.tests.factories.UserFactory')
    venue = factory.SubFactory(VenueFactory)
    title = factory.Sequence(lambda n: f"Event {n}")
    slug = factory.Sequence(lambda n: f"event-{n}")
    description = "An event description"
    category = "exhibition"
    start_datetime = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(days=1))
    end_datetime = factory.LazyAttribute(lambda o: o.start_datetime + timezone.timedelta(hours=2))
    price = 0
    is_free = True
    status = "published"
