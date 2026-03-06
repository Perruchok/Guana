import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from guana_know.users.tests.factories import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def other_user(db):
    return UserFactory()


@pytest.fixture
def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def other_auth_client(other_user):
    client = APIClient()
    refresh = RefreshToken.for_user(other_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.mark.django_db
class TestUserViews:
    def test_user_can_update_own_profile(self, auth_client, user):
        resp = auth_client.put(
            f"/api/users/{user.id}/",
            {"first_name": "Changed", "username": user.username, "email": user.email, "user_type": user.user_type},
            format="json"
        )
        assert resp.status_code == 200
        assert resp.json()["first_name"] == "Changed"

    def test_user_cannot_update_another_profile(self, auth_client, other_user):
        resp = auth_client.put(
            f"/api/users/{other_user.id}/",
            {"first_name": "X", "username": other_user.username, "email": other_user.email, "user_type": other_user.user_type},
            format="json"
        )
        assert resp.status_code == 403
