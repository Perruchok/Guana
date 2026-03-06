import factory
from django.contrib.auth import get_user_model
from guana_know.venues.models import Venue

User = get_user_model()

class VenueFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Venue

    owner = factory.SubFactory('guana_know.users.tests.factories.UserFactory')
    name = factory.Sequence(lambda n: f"Venue {n}")
    slug = factory.Sequence(lambda n: f"venue-{n}")
    description = "A nice place"
    category = "cultural_center"
    address = "Some address"
    city = "Guanajuato"
    phone = "1234567890"
    email = factory.LazyAttribute(lambda o: f"{o.slug}@example.com")
    website = "https://example.com"
    status = "draft"
