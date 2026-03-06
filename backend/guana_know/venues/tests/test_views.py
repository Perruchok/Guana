import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from guana_know.venues.tests.factories import VenueFactory
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
class TestVenueViews:
    def test_get_unauthenticated_returns_only_published(self, api_client):
        VenueFactory(status='published')
        VenueFactory(status='draft')
        resp = api_client.get('/api/venues/')
        assert resp.status_code == 200
        data = resp.json()
        assert all(v['status'] == 'published' for v in data['results'])

    def test_get_authenticated_owner_sees_own_draft(self, auth_client, user):
        # create one draft owned by user and one published by other
        VenueFactory(owner=user, status='draft')
        VenueFactory(status='published')
        resp = auth_client.get('/api/venues/')
        assert resp.status_code == 200
        data = resp.json()
        # at least one draft with owner user
        assert any(v['status'] == 'draft' and str(v['owner']) == str(user.id) for v in data['results'])

    def test_post_unauthenticated_returns_401(self, api_client):
        resp = api_client.post('/api/venues/', {}, format='json')
        assert resp.status_code == 401

    def test_post_authenticated_creates_with_owner(self, auth_client, user):
        payload = {
            'name': 'MyVenue',
            'slug': 'myvenue',
            'description': 'desc',
            'category': 'museum',
            'address': 'addr',
            'city': 'Gto',
            'status': 'draft',
        }
        resp = auth_client.post('/api/venues/', payload, format='json')
        assert resp.status_code == 201
        data = resp.json()
        assert str(data['owner']) == str(user.id)

    def test_put_owner_can_update(self, auth_client, user):
        v = VenueFactory(owner=user)
        resp = auth_client.put(
            f"/api/venues/{v.id}/",
            {"name": "new", "slug": v.slug, "description": "d", "category": "museum", 
             "address": "a", "city": "G", "status": "draft"},
            format="json"
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "new"

    def test_put_non_owner_gets_403(self, auth_client, other_user):
        # create a published venue so it's visible to auth_client
        v = VenueFactory(owner=other_user, status='published')
        resp = auth_client.put(f"/api/venues/{v.id}/", {"name": "no"}, format="json")
        assert resp.status_code == 403

    def test_delete_non_owner_gets_403(self, auth_client, other_user):
        # create a published venue so it's visible to auth_client
        v = VenueFactory(owner=other_user, status='published')
        resp = auth_client.delete(f"/api/venues/{v.id}/")
        assert resp.status_code == 403

    def test_put_owner_can_publish_draft_venue(self, auth_client, user):
        """Test changing venue status from draft to published"""
        v = VenueFactory(owner=user, status='draft')
        resp = auth_client.put(
            f"/api/venues/{v.id}/",
            {"name": v.name, "slug": v.slug, "description": v.description, 
             "category": v.category, "address": v.address, "city": v.city, 
             "status": "published"},
            format="json"
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "published"

    def test_put_owner_can_unpublish_venue(self, auth_client, user):
        """Test changing venue status from published to draft"""
        v = VenueFactory(owner=user, status='published')
        resp = auth_client.put(
            f"/api/venues/{v.id}/",
            {"name": v.name, "slug": v.slug, "description": v.description, 
             "category": v.category, "address": v.address, "city": v.city, 
             "status": "draft"},
            format="json"
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "draft"

    def test_delete_owner_can_delete(self, auth_client, user):
        """Test that owner can delete their venue"""
        v = VenueFactory(owner=user)
        resp = auth_client.delete(f"/api/venues/{v.id}/")
        assert resp.status_code == 204
        # verify venue is deleted
        resp = auth_client.get(f"/api/venues/{v.id}/")
        assert resp.status_code == 404

    def test_put_owner_can_edit_all_fields(self, auth_client, user):
        """Test updating all venue fields"""
        v = VenueFactory(owner=user)
        resp = auth_client.put(
            f"/api/venues/{v.id}/",
            {"name": "Updated Venue", "slug": v.slug, 
             "description": "New description", "category": "gallery",
             "address": "New Address 123", "city": "San Miguel",
             "phone": "4734567890", "email": "info@venue.mx",
             "website": "https://venue.mx", "status": "published"},
            format="json"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Updated Venue"
        assert data["description"] == "New description"
        assert data["category"] == "gallery"
        assert data["address"] == "New Address 123"
        assert data["city"] == "San Miguel"
        assert data["phone"] == "4734567890"
        assert data["email"] == "info@venue.mx"
        assert data["website"] == "https://venue.mx"
        assert data["status"] == "published"
