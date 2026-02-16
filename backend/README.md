# Guana Know - Backend

Production-ready Django REST API for Guana Know cultural calendar platform.

## Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 13+
- Redis (optional, for future caching/celery)

### Installation

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

6. **Load initial subscription plans**
   ```bash
   python manage.py shell
   ```
   Then run:
   ```python
   from guana_know.subscriptions.models import Plan
   
   Plan.objects.get_or_create(
       id='free',
       defaults={
           'name': 'Free',
           'description': 'Basic free tier',
           'price_monthly': 0,
           'max_venues': 1,
           'max_events_per_month': 10,
           'features': {'analytics': False, 'priority_support': False}
       }
   )
   
   Plan.objects.get_or_create(
       id='basic',
       defaults={
           'name': 'Basic',
           'description': 'For small businesses',
           'price_monthly': 99,
           'max_venues': 3,
           'max_events_per_month': 30,
           'features': {'analytics': True, 'priority_support': False}
       }
   )
   
   Plan.objects.get_or_create(
       id='pro',
       defaults={
           'name': 'Professional',
           'description': 'For established venues',
           'price_monthly': 299,
           'max_venues': 10,
           'max_events_per_month': 100,
           'features': {'analytics': True, 'priority_support': True}
       }
   )
   ```

### Running Development Server

```bash
python manage.py runserver
```

Access at: http://localhost:8000

### API Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/schema/

### Docker Setup

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- Django development server

## Project Structure

```
backend/
├── config/                 # Django configuration
│   ├── settings.py        # Settings
│   ├── urls.py            # Main URL router
│   └── wsgi.py            # WSGI application
├── guana_know/            # Main project apps
│   ├── common/            # Shared models, permissions, utilities
│   ├── users/             # User authentication and profiles
│   ├── venues/            # Venue management
│   ├── events/            # Event listings and management
│   └── subscriptions/     # Subscription and billing
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
├── Dockerfile             # Docker image definition
└── docker-compose.yml     # Multi-container setup
```

## API Endpoints

### Authentication
- `POST /api/users/token/` - Obtain JWT token
- `POST /api/users/token/refresh/` - Refresh JWT token
- `POST /api/users/` - Register new user
- `GET /api/users/me/` - Get current user

### Users
- `GET /api/users/` - List users
- `GET /api/users/{id}/` - Get user profile
- `PUT /api/users/{id}/` - Update profile

### Venues
- `GET /api/venues/` - List published venues
- `POST /api/venues/` - Create venue (auth required)
- `GET /api/venues/{id}/` - Get venue details
- `PUT /api/venues/{id}/` - Update venue (owner only)
- `DELETE /api/venues/{id}/` - Delete venue (owner only)

### Events
- `GET /api/events/` - List published events
- `POST /api/events/` - Create event (auth required)
- `GET /api/events/{id}/` - Get event details
- `PUT /api/events/{id}/` - Update event (owner only)
- `DELETE /api/events/{id}/` - Delete event (owner only)

### Subscriptions
- `GET /api/subscriptions/plans/` - List subscription plans
- `GET /api/subscriptions/me/` - Get current user subscription
- `POST /api/subscriptions/upgrade/` - Upgrade subscription

## Key Features

- **RESTful API** with DRF ViewSets
- **JWT Authentication** with SimpleJWT
- **UUID Primary Keys** for all models
- **Timestamps** (created_at, updated_at) on all models
- **Role-based Access** with custom permissions
- **Stripe Integration** for subscriptions
- **PostgreSQL** for robust data storage
- **CORS Support** for frontend integration
- **API Documentation** with drf-spectacular
- **Admin Interface** with Django admin

## Architecture Principles

- **Modular Monolith**: Clear separation of concerns by feature
- **Clean Domain Boundaries**: Each app manages its own models
- **No Cross-App Logic**: Business logic stays within apps
- **Production-Ready**: Proper error handling and logging
- **Extensible**: Easy to add new features without refactoring

## Environment Variables

See `.env.example` for all available configuration options.

## Security Considerations

- Always use HTTPS in production
- Rotate SECRET_KEY regularly
- Keep dependencies updated
- Use strong database passwords
- Protect Stripe API keys
- Set DEBUG=False in production
- Configure ALLOWED_HOSTS properly
- Use environment variables for secrets

## Next Steps

1. Setup frontend with Next.js
2. Implement Stripe webhook handlers
3. Add email notifications
4. Create admin dashboards
5. Setup logging and monitoring
6. Deploy to Azure App Service
