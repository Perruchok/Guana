from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.db import transaction
from decimal import Decimal
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from guana_know.subscriptions.models import Plan, Subscription
from guana_know.venues.models import Venue
from guana_know.events.models import Event


class Command(BaseCommand):
    help = 'Seed the development database with sample plans, subscriptions, venues and events.'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete all venues and events before seeding')
        parser.add_argument('--fix-subscriptions', action='store_true', help='Assign free plan to users that lack a subscription')

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        reset = options.get('reset', False)

        # Step 0: optional reset
        if reset:
            self.stdout.write('✓ Reset flag provided — deleting existing events and venues')
            Event.objects.all().delete()
            Venue.objects.all().delete()

        # 1. Create subscription plans
        plans_data = [
            {
                'id': 'free',
                'name': 'Gratuito',
                'description': 'Plan gratuito',
                'price_monthly': Decimal('0.00'),
                'max_venues': 1,
                'max_events_per_month': 10,
                'features': {'analytics': False, 'priority_support': False},
            },
            {
                'id': 'basic',
                'name': 'Básico',
                'description': 'Plan básico',
                'price_monthly': Decimal('99.00'),
                'max_venues': 3,
                'max_events_per_month': 30,
                'features': {'analytics': True, 'priority_support': False},
            },
            {
                'id': 'pro',
                'name': 'Profesional',
                'description': 'Plan profesional',
                'price_monthly': Decimal('299.00'),
                'max_venues': 10,
                'max_events_per_month': 100,
                'features': {'analytics': True, 'priority_support': True},
            },
        ]

        created_plans = []
        for p in plans_data:
            plan, created = Plan.objects.get_or_create(
                id=p['id'],
                defaults={
                    'name': p['name'],
                    'description': p['description'],
                    'price_monthly': p['price_monthly'],
                    'max_venues': p['max_venues'],
                    'max_events_per_month': p['max_events_per_month'],
                    'features': p['features'],
                },
            )
            if not created:
                # ensure fields are up to date
                plan.name = p['name']
                plan.description = p['description']
                plan.price_monthly = p['price_monthly']
                plan.max_venues = p['max_venues']
                plan.max_events_per_month = p['max_events_per_month']
                plan.features = p['features']
                plan.save()
            created_plans.append(plan)

        self.stdout.write(f'✓ Created/updated {len(created_plans)} subscription plans')

        User = get_user_model()

        # 2. Assign free plan to users without subscription (optional)
        if options.get('fix_subscriptions'):
            free_plan = Plan.objects.get(id='free')
            assigned = 0
            for user in User.objects.all():
                sub, created = Subscription.objects.get_or_create(
                    user=user,
                    defaults={'plan': free_plan, 'status': 'active'}
                )
                if created:
                    assigned += 1
            self.stdout.write(f'✓ Assigned free plan to {assigned} users (if any)')
        else:
            self.stdout.write('✓ Subscription fix skip (use --fix-subscriptions to apply)')

        # 3 & 4: Create sample venues and events assigned to first superuser
        superuser = User.objects.filter(is_superuser=True).first()
        if not superuser:
            self.stdout.write(self.style.WARNING('No superuser found — skipping venues and events creation'))
        else:
            # 3. Venues
            venues_data = [
                {
                    'name': 'Teatro Juárez',
                    'slug': 'teatro-juarez',
                    'category': 'theater',
                    'address': 'Calle Sopeña s/n, Centro',
                    'city': 'Guanajuato',
                    'description': 'Uno de los teatros más emblemáticos de México, construido en estilo neoclásico.',
                    'phone': '473 732 0183',
                    'website': 'https://teatrojuarez.gob.mx',
                    'status': 'published',
                    'is_featured': True,
                },
                {
                    'name': 'Museo Iconográfico del Quijote',
                    'slug': 'museo-iconografico-quijote',
                    'category': 'museum',
                    'address': 'Manuel Doblado 1, Centro',
                    'city': 'Guanajuato',
                    'description': 'Museo dedicado a las representaciones artísticas de Don Quijote de la Mancha.',
                    'phone': '473 732 6721',
                    'website': '',
                    'status': 'published',
                    'is_featured': True,
                },
            ]

            created_venues = []
            for v in venues_data:
                venue, created = Venue.objects.get_or_create(
                    slug=v['slug'],
                    defaults={
                        'owner': superuser,
                        'name': v['name'],
                        'description': v['description'],
                        'category': v['category'],
                        'address': v['address'],
                        'city': v['city'],
                        'phone': v['phone'],
                        'website': v['website'],
                        'status': v['status'],
                        'is_featured': v['is_featured'],
                    },
                )
                if not created:
                    # update basic fields to ensure published & featured
                    venue.owner = superuser
                    venue.name = v['name']
                    venue.description = v['description']
                    venue.category = v['category']
                    venue.address = v['address']
                    venue.city = v['city']
                    venue.phone = v['phone']
                    venue.website = v['website']
                    venue.status = v['status']
                    venue.is_featured = v['is_featured']
                    venue.save()
                created_venues.append(venue)

            self.stdout.write(f'✓ Created/updated {len(created_venues)} venues')

            # 4. Events
            tz = ZoneInfo('America/Mexico_City')
            today = datetime.now(tz)

            # Choose start offsets across next 14 days
            offsets = [2, 5, 8, 11]

            events_data = [
                {
                    'title': 'Noche de Jazz en el Claustro',
                    'category': 'music',
                    'is_free': False,
                    'price': Decimal('150.00'),
                    'venue_slug': 'teatro-juarez',
                    'is_featured': True,
                },
                {
                    'title': 'Exposición: Fotografía Urbana',
                    'category': 'exhibition',
                    'is_free': True,
                    'price': Decimal('0.00'),
                    'venue_slug': 'museo-iconografico-quijote',
                    'is_featured': True,
                },
                {
                    'title': 'Taller de Cerámica para Principiantes',
                    'category': 'workshop',
                    'is_free': False,
                    'price': Decimal('200.00'),
                    'venue_slug': 'teatro-juarez',
                    'is_featured': False,
                },
                {
                    'title': 'Cineforo: Nuevo Cine Mexicano',
                    'category': 'cinema',
                    'is_free': True,
                    'price': Decimal('0.00'),
                    'venue_slug': 'museo-iconografico-quijote',
                    'is_featured': False,
                },
            ]

            created_events = []
            for idx, e in enumerate(events_data):
                start = (today + timedelta(days=offsets[idx])).replace(hour=19, minute=0, second=0, microsecond=0)
                end = start + timedelta(hours=2)

                # find venue
                venue = Venue.objects.filter(slug=e['venue_slug']).first()
                if not venue:
                    continue

                base_slug = slugify(e['title'])
                slug_candidate = base_slug
                counter = 1
                while Event.objects.filter(slug=slug_candidate).exists():
                    slug_candidate = f"{base_slug}-{counter}"
                    counter += 1

                event, created = Event.objects.get_or_create(
                    slug=slug_candidate,
                    defaults={
                        'owner': superuser,
                        'venue': venue,
                        'title': e['title'],
                        'description': e['title'],
                        'category': e['category'],
                        'start_datetime': start,
                        'end_datetime': end,
                        'capacity': 50 if not e['is_free'] else None,
                        'price': e['price'],
                        'is_free': e['is_free'],
                        'status': 'published',
                        'is_featured': e['is_featured'],
                    },
                )
                if not created:
                    event.owner = superuser
                    event.venue = venue
                    event.title = e['title']
                    event.description = e['title']
                    event.category = e['category']
                    event.start_datetime = start
                    event.end_datetime = end
                    event.capacity = 50 if not e['is_free'] else None
                    event.price = e['price']
                    event.is_free = e['is_free']
                    event.status = 'published'
                    event.is_featured = e['is_featured']
                    event.save()

                created_events.append(event)

            self.stdout.write(f'✓ Created/updated {len(created_events)} events')

        # 5. Final summary
        plans_count = Plan.objects.count()
        venues_count = Venue.objects.count()
        events_count = Event.objects.count()
        subs_count = Subscription.objects.count()

        self.stdout.write('')
        self.stdout.write(f'Plans: {plans_count}')
        self.stdout.write(f'Venues: {venues_count}')
        self.stdout.write(f'Events: {events_count}')
        self.stdout.write(f'Subscriptions: {subs_count}')

        self.stdout.write('Database seeded successfully.')
