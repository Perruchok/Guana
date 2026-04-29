from django.core.management.base import BaseCommand
from django.utils import timezone
from guana_know.events.models import Event


class Command(BaseCommand):
    help = 'Archives published events whose end_datetime has passed.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be archived without making changes.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        qs = Event.objects.filter(
            status='published',
            end_datetime__lt=timezone.now(),
        )

        count = qs.count()

        if count == 0:
            self.stdout.write('No events to archive.')
            return

        if dry_run:
            self.stdout.write(f'Would archive {count} event(s):')
            for event in qs.order_by('end_datetime'):
                self.stdout.write(
                    f'  - {event.title} '
                    f'(ended: {event.end_datetime.strftime("%Y-%m-%d %H:%M")})'
                )
        else:
            qs.update(status='archived')
            self.stdout.write(
                self.style.SUCCESS(f'Archived {count} event(s).')
            )
