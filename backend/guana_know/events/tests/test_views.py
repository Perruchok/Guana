import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from guana_know.events.tests.factories import EventFactory
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
class TestEventViews:
    def test_get_unauthenticated_returns_only_published(self, api_client):
        # create one published and one draft event
        EventFactory(status='published')
        EventFactory(status='draft')
        resp = api_client.get('/api/events/')
        assert resp.status_code == 200
        data = resp.json()
        # results should only include published
        assert all(ev['status'] == 'published' for ev in data['results'])

    def test_owner_filter_returns_only_user_events(self, auth_client, user, other_user):
        # create events for both users
        e1 = EventFactory(owner=user)
        e2 = EventFactory(owner=other_user)
        resp = auth_client.get(f'/api/events/?owner={user.id}')
        assert resp.status_code == 200
        data = resp.json()
        ids = [str(ev['id']) for ev in data['results']]
        assert str(e1.id) in ids
        assert str(e2.id) not in ids

    def test_post_unauthenticated_returns_401(self, api_client):
        resp = api_client.post('/api/events/', {}, format='json')
        assert resp.status_code == 401

    def test_post_authenticated_creates_event_with_owner(self, auth_client, user):
        venue = VenueFactory(owner=user)
        payload = {
            'title': 'X',
            'slug': 'x',
            'description': 'desc',
            'category': 'exhibition',
            'venue': venue.id,
            'start_datetime': '2030-01-01T10:00:00Z',
            'end_datetime': '2030-01-01T12:00:00Z',
            'status': 'published',
        }
        resp = auth_client.post('/api/events/', payload, format='json')
        assert resp.status_code == 201
        data = resp.json()
        assert str(data['owner']) == str(user.id)
        assert str(data['venue']) == str(venue.id)

    def test_put_owner_can_update(self, auth_client, user):
        ev = EventFactory(owner=user)
        resp = auth_client.put(
            f"/api/events/{ev.id}/",
            {"title": "new", "slug": "new", "description": "d", "category": "exhibition", 
             "start_datetime": "2030-01-01T10:00:00Z", "end_datetime": "2030-01-01T12:00:00Z", 
             "venue": ev.venue.id, "status": "published"},
            format="json"
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "new"

    def test_put_non_owner_gets_403(self, auth_client, other_user):
        ev = EventFactory(owner=other_user)
        resp = auth_client.put(
            f"/api/events/{ev.id}/",
            {"title": "no", "slug": "no-slug"},
            format="json"
        )
        assert resp.status_code == 403

    def test_delete_non_owner_gets_403(self, auth_client, other_user):
        ev = EventFactory(owner=other_user)
        resp = auth_client.delete(f"/api/events/{ev.id}/")
        assert resp.status_code == 403

    def test_put_owner_can_change_status_draft_to_published(self, auth_client, user):
        """Test event status change from draft to published"""
        ev = EventFactory(owner=user, status='draft')
        resp = auth_client.put(
            f"/api/events/{ev.id}/",
            {"title": ev.title, "slug": ev.slug, "description": ev.description, 
             "category": ev.category, "start_datetime": ev.start_datetime.isoformat(), 
             "end_datetime": ev.end_datetime.isoformat(), "venue": ev.venue.id, 
             "status": "published"},
            format="json"
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "published"

    def test_put_owner_can_change_status_published_to_draft(self, auth_client, user):
        """Test event status change from published to draft"""
        ev = EventFactory(owner=user, status='published')
        resp = auth_client.put(
            f"/api/events/{ev.id}/",
            {"title": ev.title, "slug": ev.slug, "description": ev.description, 
             "category": ev.category, "start_datetime": ev.start_datetime.isoformat(), 
             "end_datetime": ev.end_datetime.isoformat(), "venue": ev.venue.id, 
             "status": "draft"},
            format="json"
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "draft"

    def test_put_owner_can_change_status_to_cancelled(self, auth_client, user):
        """Test event status change to cancelled"""
        ev = EventFactory(owner=user, status='published')
        resp = auth_client.put(
            f"/api/events/{ev.id}/",
            {"title": ev.title, "slug": ev.slug, "description": ev.description, 
             "category": ev.category, "start_datetime": ev.start_datetime.isoformat(), 
             "end_datetime": ev.end_datetime.isoformat(), "venue": ev.venue.id, 
             "status": "cancelled"},
            format="json"
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_delete_owner_can_delete(self, auth_client, user):
        """Test that owner can delete their event"""
        ev = EventFactory(owner=user)
        resp = auth_client.delete(f"/api/events/{ev.id}/")
        assert resp.status_code == 204
        # verify event is deleted
        resp = auth_client.get(f"/api/events/{ev.id}/")
        assert resp.status_code == 404

    def test_put_owner_can_edit_all_fields(self, auth_client, user):
        """Test updating all event fields"""
        ev = EventFactory(owner=user)
        new_venue = VenueFactory(owner=user)
        resp = auth_client.put(
            f"/api/events/{ev.id}/",
            {"title": "Updated Title", "slug": ev.slug, 
             "description": "New description here", "category": "workshop",
             "start_datetime": "2030-06-01T14:00:00Z", 
             "end_datetime": "2030-06-01T16:00:00Z", 
             "venue": new_venue.id, "status": "published",
             "price": 250, "is_free": False, "capacity": 50},
            format="json"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "New description here"
        assert data["category"] == "workshop"
        assert str(data["venue"]) == str(new_venue.id)
        assert data["status"] == "published"
        assert float(data["price"]) == 250.0
        assert data["is_free"] == False
        assert data["capacity"] == 50
