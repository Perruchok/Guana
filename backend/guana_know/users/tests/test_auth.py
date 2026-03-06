import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from guana_know.users.tests.factories import UserFactory
from guana_know.subscriptions.tests.factories import PlanFactory
from guana_know.subscriptions.models import Subscription


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.mark.django_db
class TestAuth:
    def test_registration_creates_user_and_subscription(self, api_client, db):
        # arrange: ensure free plan exists
        free = PlanFactory(id='free', name='Free', price_monthly=0)
        payload = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'abc12345',
            'password_confirm': 'abc12345',
            'first_name': 'New',
            'last_name': 'User',
            'user_type': 'business',
        }
        # act
        resp = api_client.post('/api/users/', payload, format='json')
        # assert
        assert resp.status_code == 201
        data = resp.json()
        assert data['username'] == 'newuser'
        # subscription created
        user_id = data['id']
        sub = Subscription.objects.get(user__id=user_id)
        assert sub.plan.id == 'free'
        assert sub.status == 'active'

    def test_token_returns_access_and_refresh(self, api_client, user):
        resp = api_client.post(
            '/api/users/token/',
            {'username': user.username, 'password': 'testpass123'},
            format='json',
        )
        assert resp.status_code == 200
        data = resp.json()
        assert 'access' in data and 'refresh' in data

    def test_token_invalid_credentials_returns_401(self, api_client, user):
        resp = api_client.post(
            '/api/users/token/',
            {'username': user.username, 'password': 'wrong'},
            format='json',
        )
        assert resp.status_code == 401

    def test_get_me_authenticated(self, auth_client, user):
        resp = auth_client.get('/api/users/me/')
        assert resp.status_code == 200
        data = resp.json()
        assert str(data['id']) == str(user.id)
        assert data['username'] == user.username

    def test_get_me_not_authenticated(self, api_client):
        resp = api_client.get('/api/users/me/')
        assert resp.status_code == 401
