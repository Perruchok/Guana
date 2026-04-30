"""
Admin configuration for the agents app.
Allows staff to review, approve, and reject EventDrafts.
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import EventDraft, EventSource


@admin.action(description='Run discovery agent for selected sources')
def run_discovery(modeladmin, request, queryset):
    from agents.orchestrator import run_for_source
    for source in queryset.filter(is_active=True):
        run_for_source(source.url, source.source_type, strategy=source.scrape_strategy, dry_run=False)
    modeladmin.message_user(request, f'Discovery triggered for {queryset.count()} source(s).')


@admin.register(EventSource)
class EventSourceAdmin(admin.ModelAdmin):
    actions = [run_discovery]
    list_display = ['url', 'source_type', 'scrape_strategy', 'is_active', 'last_scraped_at', 'error_count']
    list_filter = ('source_type', 'scrape_strategy', 'is_active')
    search_fields = ('url',)
    raw_id_fields = ()
    readonly_fields = ('last_scraped_at', 'error_count', 'last_error', 'created_at', 'updated_at')


@admin.register(EventDraft)
class EventDraftAdmin(admin.ModelAdmin):
    list_display = ('title_display', 'source', 'status', 'confidence', 'created_at')
    list_filter = ('status',)
    search_fields = ('parsed_data',)
    readonly_fields = ('raw_text', 'parsed_data', 'confidence', 'issues', 'source',
                       'resolved_event', 'created_at', 'updated_at')
    actions = ['approve_drafts', 'reject_drafts']

    @admin.display(description='Title')
    def title_display(self, obj):
        return obj.parsed_data.get('title', '—')

    @admin.action(description='Approve selected drafts and promote to Event')
    def approve_drafts(self, request, queryset):
        from .services import promote_draft_to_event

        promoted = 0
        failed = 0

        for draft in queryset.filter(status='pending_review'):
            event = promote_draft_to_event(draft)
            if event:
                promoted += 1
            else:
                # Promotion failed (missing fields) — still mark approved so it
                # doesn't stay in the queue, but log the failure.
                draft.status = 'approved'
                draft.save(update_fields=['status'])
                failed += 1

        if promoted:
            self.message_user(request, f'{promoted} draft(s) approved and promoted to Event.')
        if failed:
            self.message_user(
                request,
                f'{failed} draft(s) approved but could not be promoted to Event '
                '(missing required fields — check logs).',
                level='warning',
            )

    @admin.action(description='Reject selected drafts')
    def reject_drafts(self, request, queryset):
        updated = queryset.filter(status='pending_review').update(status='rejected')
        self.message_user(request, f'{updated} draft(s) rejected.')
