import factory
from django.contrib.auth import get_user_model

User = get_user_model()

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@test.com")
    first_name = "Test"
    last_name = "User"
    user_type = "business"
    password = factory.PostGenerationMethodCall("set_password", "testpass123")
