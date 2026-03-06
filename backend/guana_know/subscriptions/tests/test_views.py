import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from guana_know.subscriptions.tests.factories import PlanFactory, SubscriptionFactory
from guana_know.users.tests.factories import UserFactory


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
class TestSubscriptionViews:
    def test_get_plans_unauthenticated(self, api_client):
        PlanFactory(id='free')
        resp = api_client.get('/api/subscriptions/plans/')
        assert resp.status_code == 200
        data = resp.json()
        # plans endpoint returns array (not paginated)
        assert isinstance(data, list) or (isinstance(data, dict) and 'results' in data)
        plans_list = data if isinstance(data, list) else data.get('results', [])
        assert any(p['id'] == 'free' for p in plans_list)

    def test_get_me_unauthenticated_returns_401(self, api_client):
        resp = api_client.get('/api/subscriptions/me/')
        assert resp.status_code == 401

    def test_get_me_authenticated_returns_correct_plan(self, auth_client, user):
        plan = PlanFactory(id='free')
        SubscriptionFactory(user=user, plan=plan)
        resp = auth_client.get('/api/subscriptions/me/')
        assert resp.status_code == 200
        data = resp.json()
        assert data['plan'] == plan.id

    def test_post_upgrade_changes_plan(self, auth_client, user):
        p1 = PlanFactory(id='free')
        p2 = PlanFactory(id='basic')
        sub = SubscriptionFactory(user=user, plan=p1)
        resp = auth_client.post('/api/subscriptions/upgrade/', {'plan_id': p2.id}, format='json')
        assert resp.status_code == 200
        data = resp.json()
        assert data['plan'] == p2.id
        sub.refresh_from_db()
        assert sub.plan.id == p2.id

    def test_post_upgrade_invalid_plan_returns_404(self, auth_client):
        resp = auth_client.post('/api/subscriptions/upgrade/', {'plan_id': 'nonexistent'}, format='json')
        assert resp.status_code == 404
