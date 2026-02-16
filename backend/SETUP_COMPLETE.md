# Django Project Bootstrap Complete ✓

## What Has Been Created

### Core Configuration
- ✓ `config/settings.py` - Django settings with all required apps, middleware, JWT auth, and Stripe configuration
- ✓ `config/urls.py` - Main URL router with API endpoints
- ✓ `config/wsgi.py` - WSGI application for production servers
- ✓ `manage.py` - Django management script
- ✓ `requirements.txt` - Python dependencies (Django 4.2, DRF, JWT, Stripe, etc.)
- ✓ `.env.example` - Environment variables template
- ✓ `Dockerfile` - Docker image for containerized deployment
- ✓ `docker-compose.yml` - Multi-container setup (PostgreSQL, Redis, Django)

### Apps Structure (Modular Monolith)

#### 1. **Common** (`guana_know/common/`)
- Base model with UUID primary keys and timestamps
- Custom permissions (`IsOwnerOrReadOnly`, `IsAuthenticated`)
- Shared utilities for all apps

#### 2. **Users** (`guana_know/users/`)
- Custom `User` model extending Django's AbstractUser
- User types: `individual`, `business`
- ViewSet for registration, profile management, JWT authentication
- Integrated JWT token generation with extended user data

#### 3. **Venues** (`guana_know/venues/`)
- `Venue` model for cultural spaces
- Categories: museum, gallery, theater, cinema, café, etc.
- Status management: draft, published, archived
- Ownership tracking and access control
- Location data (address, coordinates)
- Contact information

#### 4. **Events** (`guana_know/events/`)
- `Event` model linked to venues
- Event categories: exhibition, performance, workshop, etc.
- DateTime tracking: start, end, timezone-aware
- Registration support: capacity, registered count, registration URL
- Pricing support: free and paid events
- Status and featured flags
- Helper methods: `is_upcoming()`, `is_ongoing()`, `is_past()`

#### 5. **Subscriptions** (`guana_know/subscriptions/`)
- `Plan` model for subscription tiers: free, basic, pro
- `Subscription` model linking users to plans
- Stripe integration fields: customer ID, subscription ID
- Plan features: max venues, max events/month, feature flags
- Status tracking: active, cancelled, expired, pending

### API Endpoints

**Authentication**
- `POST /api/users/token/` - Get JWT token
- `POST /api/users/token/refresh/` - Refresh token

**Users**
- `POST /api/users/` - Register
- `GET /api/users/` - List (public)
- `GET /api/users/me/` - Current user (auth)
- `GET /api/users/{id}/` - Profile (public)
- `PUT /api/users/{id}/` - Update (owner only)

**Venues**
- `GET /api/venues/` - List published
- `POST /api/venues/` - Create (auth)
- `GET /api/venues/{id}/` - Detail
- `PUT /api/venues/{id}/` - Update (owner)
- `DELETE /api/venues/{id}/` - Delete (owner)
- **Filters**: category, city, is_featured
- **Search**: name, description, address

**Events**
- `GET /api/events/` - List published & upcoming
- `POST /api/events/` - Create (auth)
- `GET /api/events/{id}/` - Detail
- `PUT /api/events/{id}/` - Update (owner)
- `DELETE /api/events/{id}/` - Delete (owner)
- **Filters**: category, venue city, is_featured, is_free
- **Search**: title, description, venue name
- **Ordering**: start_datetime, created_at, is_featured

**Subscriptions**
- `GET /api/subscriptions/plans/` - List active plans
- `GET /api/subscriptions/me/` - Get user subscription (auth)
- `POST /api/subscriptions/upgrade/` - Change plan (auth)

---

## Key Features Implemented

✓ **Clean Architecture**
- Modular separation of concerns
- Clear domain boundaries per app
- No circular dependencies

✓ **Database Design**
- UUID primary keys on all models
- Timestamps (created_at, updated_at) everywhere
- Proper indexing for queries
- Foreign keys with cascading/protected relationships

✓ **Authentication & Permissions**
- JWT-based authentication
- Custom permissions (IsOwnerOrReadOnly)
- Public read, authenticated write pattern
- Owner-only update/delete

✓ **API Quality**
- DRF ViewSets with proper HTTP methods
- Custom serializers per action (list vs detail)
- Django Filter + Search + Ordering
- Pagination (20 items/page)
- Error handling

✓ **Admin Interface**
- Registered models in Django admin
- Custom display columns
- Filtering and search
- Proper fieldsets

✓ **Configuration**
- Environment variables via python-decouple
- PostgreSQL database (configured)
- CORS support for frontend
- Stripe API keys ready
- Logging configuration
- Timezone set to America/Mexico_City

---

## Next Steps

### Phase 1: Database & Testing (Priority: HIGH)
1. **Create SQL migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Create default subscription plans** (see backend/README.md)

3. **Test API endpoints** using Swagger UI
   ```bash
   python manage.py runserver
   # Visit http://localhost:8000/api/docs/
   ```

4. **Create test suite**
   - Add `pytest` and `pytest-django` to requirements.txt
   - Create test files in each app: `tests/test_models.py`, `test_views.py`
   - Test venue ownership, event filtering, subscription logic

### Phase 2: Advanced Features (Priority: MEDIUM)
1. **Stripe Webhook Handler**
   - Create `guana_know/subscriptions/webhooks.py`
   - Handle payment_intent.succeeded, invoice.payment_failed
   - Update subscription status

2. **Email Notifications**
   - Add celery for async tasks
   - Create email templates
   - Send on: registration, event creation, subscription change

3. **Additional APIs**
   - User profile completion endpoint
   - Venue image upload optimization
   - Event registration/attendance tracking
   - Venue follow/favorite system

### Phase 3: Frontend Integration (Priority: MEDIUM)
1. **Setup Next.js backend** (separate repo)
2. **Implement authentication pages**
3. **Create venue discovery interface**
4. **Build event listing with filters**
5. **Subscription management dashboard**

### Phase 4: Deployment (Priority: HIGH for production)
1. **Environment setup**
   - Create separate settings for dev/prod
   - Setup Azure PostgreSQL
   - Configure Azure Blob Storage for media

2. **CI/CD Pipeline**
   - GitHub Actions for automated testing
   - Docker image building
   - Auto-deployment to Azure

3. **Monitoring**
   - Application Insights integration
   - Error tracking (Sentry)
   - Performance monitoring

---

## Important Notes

### Database Setup
- Use PostgreSQL 13+ (Azure PostgreSQL)
- Update `.env` file with real credentials before running migrations
- All models have proper indexes for queries

### Security
- Change `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Use HTTPS only
- Implement rate limiting (add to next iteration)
- Validate Stripe webhook signatures

### Code Quality
- All code follows PEP8
- Models use proper Field types
- Serializers validate data properly
- ViewSets use appropriate permission classes
- No hardcoded secrets or credentials

### Extensibility
- Design allows easy addition of notification system
- Community groups can be added without schema changes
- Analytics features can be plugged in
- Messaging system ready to implement

---

## Running the Project

### Local Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with PostgreSQL credentials
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### With Docker
```bash
cd backend
cp .env.example .env
docker-compose up -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
# Visit http://localhost:8000
```

---

## Architecture Alignment

✓ **Matches PROJECT_CHARTER.md**
- Django + DRF + PostgreSQL
- JWT Authentication
- UUID primary keys
- Production-ready code

✓ **Follows architecture.md**
- Modular monolith structure
- Clear app boundaries
- No cross-app logic
- UUID keys + timestamps

✓ **Respects ai_rules.md**
- No pseudocode
- Production-ready implementations
- Proper permission classes
- No business logic in serializers
- Clean separation of concerns

---

**Status**: Django backbone 100% complete and ready for testing.
