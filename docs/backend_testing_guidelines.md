# Guana Know — Backend Testing Guidelines

## Philosophy

Test business logic and API contracts. Do not test Django internals.

**Test this:**
- Authentication and permission boundaries
- Business rules (subscription limits, ownership checks)
- API response shapes (contracts the frontend depends on)
- Critical flows (registration → subscription auto-creation)

**Do not test this:**
- That Django can save a model field
- That Django ORM queries work
- Third-party library behavior (Stripe, JWT internals)

---

## Stack

```
pytest
pytest-django
factory-boy     # model factories, never hardcode test data
```

Install:
```bash
pip install pytest pytest-django factory-boy
pip freeze > requirements.txt
```

Add to root `backend/` directory:

```ini
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
python_files = tests/test_*.py
python_classes = Test*
python_functions = test_*
```

---

## File Structure

Each app gets its own `tests/` folder. No exceptions.

```
backend/
└── guana_know/
    ├── users/
    │   └── tests/
    │       ├── __init__.py
    │       ├── factories.py
    │       ├── test_auth.py
    │       └── test_views.py
    ├── venues/
    │   └── tests/
    │       ├── __init__.py
    │       ├── factories.py
    │       └── test_views.py
    ├── events/
    │   └── tests/
    │       ├── __init__.py
    │       ├── factories.py
    │       └── test_views.py
    └── subscriptions/
        └── tests/
            ├── __init__.py
            ├── factories.py
            └── test_views.py
```

---

## Factories Pattern

Every app defines its own factories. Tests use factories — never
hardcode model data inline in test functions.

```python
# Example: guana_know/users/tests/factories.py
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
```

---

## What to Test Per App

### users/

**test_auth.py**
- `POST /api/users/` — registration creates user AND subscription
- `POST /api/users/token/` — valid credentials return access + refresh tokens
- `POST /api/users/token/` — invalid credentials return 401
- `GET /api/users/me/` — returns current user when authenticated
- `GET /api/users/me/` — returns 401 when not authenticated

**test_views.py**
- `PUT /api/users/{id}/` — user can update their own profile
- `PUT /api/users/{id}/` — user cannot update another user's profile (403)

---

### venues/

**test_views.py**
- `GET /api/venues/` — unauthenticated returns only published venues
- `GET /api/venues/` — authenticated owner also sees their own draft venues
- `POST /api/venues/` — unauthenticated returns 401
- `POST /api/venues/` — authenticated creates venue with correct owner
- `PUT /api/venues/{id}/` — owner can update their venue
- `PUT /api/venues/{id}/` — non-owner gets 403
- `DELETE /api/venues/{id}/` — non-owner gets 403

---

### events/

**test_views.py**
- `GET /api/events/` — unauthenticated returns only published events
- `GET /api/events/?owner={id}` — authenticated returns only that user's events
- `POST /api/events/` — unauthenticated returns 401
- `POST /api/events/` — authenticated creates event assigned to correct owner
- `PUT /api/events/{id}/` — owner can update
- `PUT /api/events/{id}/` — non-owner gets 403
- `DELETE /api/events/{id}/` — non-owner gets 403

---

### subscriptions/

**test_views.py**
- `GET /api/subscriptions/plans/` — unauthenticated can list plans
- `GET /api/subscriptions/me/` — unauthenticated returns 401
- `GET /api/subscriptions/me/` — authenticated returns correct plan
- `POST /api/subscriptions/upgrade/` — changes user plan correctly
- `POST /api/subscriptions/upgrade/` — invalid plan_id returns 404

---

## Test Template

Every test file follows this structure:

```python
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from guana_know.users.tests.factories import UserFactory

# Always use pytest fixtures, never setUp/tearDown
@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(db):
    return UserFactory()

@pytest.fixture
def auth_client(user):
    """Authenticated API client."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


class TestSomeFeature:
    def test_descriptive_name(self, api_client, db):
        # Arrange
        # Act
        # Assert
        pass
```

---

## Naming Conventions

Test function names must be descriptive enough to understand the
failure without reading the code:

```python
# BAD
def test_venues():

# GOOD
def test_unauthenticated_user_cannot_create_venue():
def test_owner_can_update_their_venue():
def test_non_owner_gets_403_on_venue_update():
```

---

## Running Tests

```bash
# All tests
cd backend && pytest

# Single app
pytest guana_know/users/

# Single file
pytest guana_know/users/tests/test_auth.py

# Single test
pytest guana_know/users/tests/test_auth.py::TestAuth::test_registration_creates_subscription

# With coverage
pytest --cov=guana_know --cov-report=term-missing
```

---

## When to Write Tests

Write tests **alongside** feature work, not after. The rule:

- New API endpoint → write tests for it before moving to the next feature
- Bug fixed → write a test that would have caught it
- Never ship an endpoint that touches auth or permissions without tests

## Current Priority

Write these first — they cover the most critical paths that are
already built and working:

1. `users/tests/test_auth.py` — registration + auto-subscription + login
2. `events/tests/test_views.py` — owner filter + permission boundaries
3. `venues/tests/test_views.py` — permission boundaries
4. `subscriptions/tests/test_views.py` — plan assignment

---

## Coverage Target

- Auth flows: 100%
- Permission checks: 100%
- Business logic: 100%
- Serializer field presence: only for fields the frontend depends on
- Do not chase overall % coverage — chase meaningful coverage