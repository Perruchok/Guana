"""
Agent state models for Guana Know.

EventSource: a URL the agent monitors for events.
EventDraft: a candidate event discovered by the agent, pending human review.
"""

from django.db import models
from guana_know.common.models import BaseModel


class EventSource(BaseModel):
    """A URL the discovery agent monitors periodically."""

    SOURCE_TYPE_CHOICES = [
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
        ('website', 'Website'),
        ('twitter', 'Twitter/X'),
    ]

    STRATEGY_CHOICES = [
        ('generic', 'Generic HTML scraper'),
        ('json_ld', 'JSON-LD structured data'),
        ('ical', 'iCal feed'),
        ('apify_facebook', 'Apify — Facebook'),
        ('apify_instagram', 'Apify — Instagram'),
    ]

    url = models.URLField(unique=True)
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
        default='website',
        db_index=True,
    )
    scrape_strategy = models.CharField(
        max_length=30,
        choices=STRATEGY_CHOICES,
        default='generic',
        help_text='Scraping strategy to use for this source.',
    )
    last_scraped_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    crawl_interval_hours = models.PositiveIntegerField(
        default=24,
        help_text='Minimum hours between crawls for this source.',
    )
    error_count = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Event Source'
        verbose_name_plural = 'Event Sources'

    def __str__(self):
        return f'{self.source_type}: {self.url}'


class EventDraft(BaseModel):
    """
    A candidate event discovered by the agent.

    High-confidence drafts (≥ 0.80) are promoted directly to Event(status=draft).
    Low-confidence drafts stay here for human review.
    """

    STATUS_CHOICES = [
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    source = models.ForeignKey(
        EventSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='drafts',
    )
    raw_text = models.TextField(help_text='Raw content scraped from the source.')
    parsed_data = models.JSONField(
        default=dict,
        help_text='Structured event data inferred by the LLM.',
    )
    confidence = models.FloatField(
        default=0.0,
        help_text='Agent confidence score between 0.0 and 1.0.',
    )
    issues = models.JSONField(
        default=list,
        help_text='List of issue keys, e.g. ["missing_date", "venue_unresolved"].',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending_review',
        db_index=True,
    )
    resolved_event = models.OneToOneField(
        'events.Event',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='draft_origin',
        help_text='Set when the draft is approved and promoted to an Event.',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Event Draft'
        verbose_name_plural = 'Event Drafts'
        indexes = [
            models.Index(fields=['status', 'confidence']),
        ]

    def __str__(self):
        title = self.parsed_data.get('title', 'Untitled')
        return f'[{self.status}] {title} (confidence={self.confidence:.2f})'

class AgentRun(BaseModel):
    status = models.CharField(
        max_length=20,
        choices=[
            ('running', 'Running'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='running',
    )
    finished_at = models.DateTimeField(null=True, blank=True)
    sources_processed = models.IntegerField(default=0)
    events_created = models.IntegerField(default=0)
    events_deduped = models.IntegerField(default=0)
    errors = models.JSONField(default=list)