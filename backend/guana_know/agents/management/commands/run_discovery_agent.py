"""
Management command: run_discovery_agent

Runs the event discovery agent for all active EventSources (or a specific one).

Usage:
    python manage.py run_discovery_agent
    python manage.py run_discovery_agent --url <url>
    python manage.py run_discovery_agent --dry-run
"""

import logging
from datetime import datetime, timezone
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Runs the autonomous event discovery agent for registered EventSources.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            type=str,
            default=None,
            help='URL of a specific EventSource to process. '
                 'If omitted, all active sources are processed.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Run the full agent loop but do not write anything to the database.',
        )

    def handle(self, *args, **options):
        from guana_know.agents.models import EventSource
        from agents.orchestrator import run_for_source

        url = options['url']
        dry_run = options['dry_run']

        if url:
            try:
                sources = [EventSource.objects.get(url=url, is_active=True)]
            except EventSource.DoesNotExist:
                raise CommandError(f'No active EventSource found for URL: {url}')
        else:
            sources = list(
                EventSource.objects.filter(is_active=True)
                .order_by('last_scraped_at')
            )
            if not sources:
                self.stdout.write('No active EventSources registered.')
                return

        for source in sources:
            self.stdout.write(f'Processing: {source.url}')
            try:
                result = run_for_source(source.url, source.source_type, dry_run=dry_run)
            except EnvironmentError as exc:
                raise CommandError(str(exc))

            if dry_run:
                self._print_dry_run_report(result, self.stdout)
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Done. Events created: {result.get('written_events', 0)}, "
                        f"Drafts: {result.get('written_drafts', 0)}, "
                        f"Duplicates skipped: {result.get('total_duplicates', 0)}"
                    )
                )

            if not dry_run:
                source.last_scraped_at = datetime.now(timezone.utc)
                source.save(update_fields=['last_scraped_at'])

    def _print_dry_run_report(self, result: dict, stdout) -> None:
        candidates = result.get('candidates', [])
        total = result.get('total_found', 0)
        duplicates = result.get('total_duplicates', 0)

        stdout.write('')
        stdout.write('━' * 60)
        stdout.write('  DRY RUN REPORT')
        stdout.write(f'  Events found: {total}  |  Duplicates: {duplicates}')
        stdout.write('━' * 60)

        if not candidates:
            stdout.write('  No candidates found.')
            error = result.get('error')
            if error:
                stdout.write(f'  Error: {error}')
            return

        for i, candidate in enumerate(candidates, 1):
            data = candidate.get('event_data', {})
            confidence = candidate.get('confidence', 0.0)
            issues = candidate.get('issues', [])
            is_duplicate = candidate.get('is_duplicate', False)
            img_check = candidate.get('image_verification', {})

            is_past = candidate.get('is_past', False)

            if is_duplicate:
                would_save = 'SKIP (duplicate)'
                save_style = self.style.WARNING
            elif is_past:
                would_save = 'SKIP (past event)'
                save_style = self.style.WARNING
            elif confidence >= 0.80 and not issues:
                would_save = 'Event (auto-draft)'
                save_style = self.style.SUCCESS
            else:
                would_save = 'EventDraft (pending review)'
                save_style = self.style.NOTICE

            img_status = img_check.get('status', 'none')
            if img_status == 'ok':
                ct = img_check.get('content_type', '')
                kb = img_check.get('size_kb')
                size_str = f', {kb}KB' if kb else ''
                img_line = f'✅ reachable ({ct}{size_str})'
            elif img_status == 'none':
                img_line = '— no image found'
            elif img_status == 'unreachable':
                img_line = f'❌ unreachable — {img_check.get("detail", "")}'
            else:
                img_line = f'⚠️  {img_status} — HTTP {img_check.get("http_status", "?")}'

            description = data.get('description') or ''
            if len(description) > 120:
                description = description[:117] + '...'

            stdout.write('')
            stdout.write(f'  [{i}] {data.get("title", "untitled")}')
            if description:
                stdout.write(f'      Description: {description}')
            stdout.write(f'      Date:       {data.get("start_datetime", "unknown")}')
            if candidate.get('is_past'):
                stdout.write(f'      ⚠️  Past event — would be skipped')
            stdout.write(f'      Venue:      {data.get("venue_name", "unknown")}')
            stdout.write(f'      Category:   {data.get("category", "other")}')
            stdout.write(f'      Price:      {"Free" if data.get("is_free") else data.get("price")}')
            stdout.write(f'      Confidence: {confidence:.0%}')
            if issues:
                stdout.write(f'      Issues:     {", ".join(issues)}')
            stdout.write(f'      Image:      {img_line}')
            stdout.write(f'      Image URL:  {data.get("image_url", "none")}')
            stdout.write(f'      Duplicate:  {"Yes" if is_duplicate else "No"}')
            stdout.write(f'      Would save: {save_style(would_save)}')

        stdout.write('')
        stdout.write('━' * 60)
        stdout.write('')
