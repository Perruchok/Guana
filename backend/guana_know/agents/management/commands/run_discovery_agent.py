"""
Management command: run_discovery_agent

Runs the event discovery agent for all active EventSources (or a specific one).

Usage:
    python manage.py run_discovery_agent
    python manage.py run_discovery_agent --url <url>
    python manage.py run_discovery_agent --dry-run

Quick examples:
    # Normal run: all active sources
    python manage.py run_discovery_agent

    # Dry run: all active sources
    python manage.py run_discovery_agent --dry-run

    # Normal run: one source by URL
    python manage.py run_discovery_agent --url "https://example.com/events"

    # Dry run: one source by URL
    python manage.py run_discovery_agent --url "https://example.com/events" --dry-run

    # Dry run: all sources using Apify Facebook strategy
    python manage.py run_discovery_agent --strategy apify_facebook --dry-run

    # Normal run: all sources using JSON-LD strategy
    python manage.py run_discovery_agent --strategy json_ld
"""

import logging
from datetime import datetime, timezone
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        'Runs the autonomous event discovery agent for registered EventSources. '
        'Supports filtering by URL and scrape strategy, and optional dry-run mode.'
    )

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
        parser.add_argument(
            '--strategy',
            type=str,
            default=None,
            choices=['generic', 'json_ld', 'ical', 'apify_facebook', 'apify_instagram'],
            help=(
                'Process only sources with this scrape strategy. '
                'Examples: apify_facebook, generic, json_ld.'
            ),
        )

    def handle(self, *args, **options):
        from guana_know.agents.models import EventSource
        from agents.orchestrator import run_for_source

        url = options['url']
        dry_run = options['dry_run']
        strategy = options['strategy']

        if url:
            try:
                source = EventSource.objects.get(url=url, is_active=True)
            except EventSource.DoesNotExist:
                raise CommandError(f'No active EventSource found for URL: {url}')

            if strategy and source.scrape_strategy != strategy:
                raise CommandError(
                    'The selected source does not match the requested strategy. '
                    f'Source strategy: {source.scrape_strategy}; requested: {strategy}.'
                )

            sources = [source]
        else:
            qs = EventSource.objects.filter(is_active=True)
            if strategy:
                qs = qs.filter(scrape_strategy=strategy)

            sources = list(qs.order_by('last_scraped_at'))
            if not sources:
                if strategy:
                    self.stdout.write(f'No active EventSources registered for strategy: {strategy}')
                else:
                    self.stdout.write('No active EventSources registered.')
                return

        for source in sources:
            self.stdout.write(f'Processing: {source.url}')
            try:
                result = run_for_source(source.url, source.source_type, strategy=source.scrape_strategy, dry_run=dry_run)
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
        total_raw = result.get('total_raw_found', total)

        geo_kept_local = result.get('geo_kept_local')
        geo_skipped_non_local = result.get('geo_skipped_non_local')
        geo_skipped_unknown = result.get('geo_skipped_unknown_location')
        geo_llm_checked = result.get('geo_llm_checked')

        stdout.write('')
        stdout.write('━' * 60)
        stdout.write('  DRY RUN REPORT')
        stdout.write(f'  Events found: {total}  |  Duplicates: {duplicates}')
        if total_raw != total:
            stdout.write(f'  Raw events from source: {total_raw}')
        if geo_kept_local is not None:
            stdout.write(
                '  Geo filter: '
                f'kept_local={geo_kept_local}, '
                f'skipped_non_local={geo_skipped_non_local}, '
                f'skipped_unknown={geo_skipped_unknown}, '
                f'llm_checked={geo_llm_checked}'
            )
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
