# Django Backend Project Structure

```
/workspaces/Guana/backend/
│
├── config/                          # Django configuration
│   ├── __init__.py
│   ├── settings.py                  # Main settings (PostgreSQL, JWT, Stripe, CORS)
│   ├── urls.py                      # Main URL router (API endpoints)
│   ├── wsgi.py                      # WSGI for production
│   └── user_settings.py             # Custom user model config
│
├── guana_know/                      # Main project namespace
│   ├── __init__.py
│   │
│   ├── common/                      # Shared code across apps
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py                # BaseModel with UUID + timestamps
│   │   └── permissions.py           # IsOwnerOrReadOnly, IsAuthenticated
│   │
│   ├── users/                       # User authentication & profiles
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py                # Custom User model (individual/business)
│   │   ├── serializers.py           # UserSerializer, JWT token serializer
│   │   ├── views.py                 # UserViewSet, JWT endpoints
│   │   ├── urls.py                  # Router: users/token/, users/
│   │   └── admin.py                 # Django admin config
│   │
│   ├── venues/                      # Venue (cultural space) management
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py                # Venue model (categories, status, featured)
│   │   ├── serializers.py           # VenueSerializer (detail + list)
│   │   ├── views.py                 # VenueViewSet (CRUD + filters)
│   │   ├── permissions.py           # IsOwnerOrReadOnly
│   │   ├── urls.py                  # Router: venues/
│   │   └── admin.py                 # Django admin config
│   │
│   ├── events/                      # Event listing & management
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py                # Event model (linked to Venue)
│   │   ├── serializers.py           # EventSerializer (detail + list)
│   │   ├── views.py                 # EventViewSet (list, create, update)
│   │   ├── permissions.py           # IsOwnerOrReadOnly
│   │   ├── urls.py                  # Router: events/
│   │   └── admin.py                 # Django admin config
│   │
│   └── subscriptions/               # Billing & subscription management
│       ├── __init__.py
│       ├── apps.py
│       ├── models.py                # Plan, Subscription models
│       ├── serializers.py           # Plan & Subscription serializers
│       ├── views.py                 # PlansViewSet, SubscriptionViewSet
│       ├── urls.py                  # Router: subscriptions/
│       └── admin.py                 # Django admin config
│
├── manage.py                        # Django CLI
├── requirements.txt                 # Python dependencies
├── .gitignore                       # Git ignore rules
├── .env.example                     # Environment variables template
├── Dockerfile                       # Docker image definition
├── docker-compose.yml               # PostgreSQL + Redis + Django
├── README.md                        # Setup and API documentation
└── SETUP_COMPLETE.md               # This bootstrap summary
```

---

## File Descriptions

### Core Django Files

**config/settings.py**
- Database: PostgreSQL configuration
- Authentication: JWT with SimpleJWT
- CORS: Frontend domain whitelist
- Stripe: API key configuration
- Media: Image uploads for avatars, venues, events
- Logging: File + console logging

**config/urls.py**
- API routing for all apps
- Swagger/ReDoc documentation endpoints
- Namespace: `/api/users/`, `/api/venues/`, `/api/events/`, `/api/subscriptions/`

**manage.py**
- Run Django commands: `migrate`, `runserver`, `shell`, `createsuperuser`

---

### App: Users

**models.py - User**
- Extends Django's AbstractUser
- Fields: username, email, first_name, last_name, password
- New fields: user_type (individual/business), bio, avatar
- Timestamps: created_at, updated_at

**serializers.py**
- `UserSerializer`: Full user profile (public read)
- `UserCreateSerializer`: Registration with password validation
- `CustomTokenObtainPairSerializer`: JWT token with user data

**views.py - UserViewSet**
- `POST /api/users/` - Register new user
- `GET /api/users/` - List users (public)
- `GET /api/users/{id}/` - Get user profile (public)
- `GET /api/users/me/` - Get authenticated user
- `PUT /api/users/{id}/` - Update profile (owner only)
- `DELETE /api/users/{id}/` - Delete account (owner only)

**urls.py**
- Router at root: users/
- JWT Token routes: token/, token/refresh/

---

### App: Venues

**models.py - Venue**
- Owner: Foreign key to User
- Basic: name, slug, description, category (10 types)
- Location: address, city, state, postal_code, lat/long
- Contact: phone, email, website
- Media: image file
- Status: draft, published, archived
- Featured: boolean flag for homepage

**serializers.py**
- `VenueSerializer`: Full details with owner info
- `VenueListSerializer`: Lightweight for listings

**views.py - VenueViewSet**
- Filters: category, city, is_featured
- Search: name, description, address
- Ordering: created_at, name, is_featured
- Permissions: Public read, authenticated create, owner edit/delete

---

### App: Events

**models.py - Event**
- Owner: Foreign key to User
- Venue: Required venue link
- Basic: title, slug, description, category (12 types)
- Timing: start_datetime, end_datetime (timezone-aware)
- Registration: capacity, registered_count, registration_url
- Pricing: price (MXN), is_free flag
- Status: draft, published, cancelled, archived
- Featured: boolean flag

**serializers.py**
- `EventSerializer`: Full event details + computed fields
- `EventListSerializer`: Lightweight for listings
- Computed fields: is_upcoming, is_ongoing, is_past

**views.py - EventViewSet**
- Filters: category, venue city, is_featured, is_free
- Search: title, description, venue name
- Ordering: start_datetime, created_at, is_featured
- Permissions: Public read, authenticated create, owner edit/delete

---

### App: Subscriptions

**models.py**
- `Plan`: Subscription tiers (free, basic, pro)
  - Fields: name, description, price_monthly, max_venues, max_events_per_month
  - Stripe integration: stripe_product_id
  - Features: JSON storage for feature flags

- `Subscription`: User subscription record
  - User: One-to-one relationship
  - Plan: Foreign key to Plan
  - Stripe: customer_id, subscription_id
  - Dates: start_date, end_date, renewal_date

**serializers.py**
- `PlanSerializer`: Public plan details
- `SubscriptionSerializer`: User subscription status

**views.py**
- `PlanViewSet`: List active plans (public)
- `SubscriptionViewSet`: User subscription management
  - `GET /me/` - Current subscription
  - `POST /upgrade/` - Change to different plan

---

## Environment Variables (.env)

```
DEBUG=True
SECRET_KEY=your-secret-key-here

DB_NAME=guana_know
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Dependencies (requirements.txt)

- **Django 4.2.10** - Web framework
- **djangorestframework 3.14.0** - REST API toolkit
- **djangorestframework-simplejwt 5.3.2** - JWT authentication
- **psycopg2-binary 2.9.9** - PostgreSQL driver
- **stripe 7.4.0** - Stripe payments
- **django-cors-headers 4.3.1** - CORS support
- **drf-spectacular 0.26.5** - API documentation
- **django-filter 23.5** - QuerySet filtering
- **python-decouple 3.8** - Environment variables
- **Pillow 10.1.0** - Image processing
- **gunicorn 21.2.0** - Production server

---

## What's Production-Ready

✓ Database indexing for performance
✓ Proper error handling and validation
✓ CORS configuration for frontend
✓ JWT authentication with refresh tokens
✓ Permission classes on all endpoints
✓ Serializer validation
✓ UUID primary keys
✓ Timestamps on all models
✓ Django admin integration
✓ Logging configuration
✓ Docker containerization
✓ Environment variable management
✓ Timezone configuration (Mexico City)
✓ Media file uploads
✓ API documentation (Swagger + ReDoc)

---

## Quick Commands

```bash
# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Database
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Run
python manage.py runserver
# Open http://localhost:8000/api/docs/ for Swagger UI

# Docker
docker-compose up -d
docker-compose exec web python manage.py migrate
```

---

**Next**: Run migrations and test the API!
