import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('events', '0002_initial'),
        ('venues', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventSource',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('url', models.URLField(unique=True)),
                ('source_type', models.CharField(
                    choices=[
                        ('instagram', 'Instagram'),
                        ('facebook', 'Facebook'),
                        ('website', 'Website'),
                        ('twitter', 'Twitter/X'),
                    ],
                    db_index=True,
                    default='website',
                    max_length=20,
                )),
                ('venue', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='event_sources',
                    to='venues.venue',
                )),
                ('last_scraped_at', models.DateTimeField(blank=True, null=True)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
            ],
            options={
                'verbose_name': 'Event Source',
                'verbose_name_plural': 'Event Sources',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='EventDraft',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('source', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='drafts',
                    to='agents.eventsource',
                )),
                ('raw_text', models.TextField(help_text='Raw content scraped from the source.')),
                ('parsed_data', models.JSONField(
                    default=dict,
                    help_text='Structured event data inferred by the LLM.',
                )),
                ('confidence', models.FloatField(
                    default=0.0,
                    help_text='Agent confidence score between 0.0 and 1.0.',
                )),
                ('issues', models.JSONField(
                    default=list,
                    help_text='List of issue keys, e.g. ["missing_date", "venue_unresolved"].',
                )),
                ('status', models.CharField(
                    choices=[
                        ('pending_review', 'Pending Review'),
                        ('approved', 'Approved'),
                        ('rejected', 'Rejected'),
                    ],
                    db_index=True,
                    default='pending_review',
                    max_length=20,
                )),
                ('resolved_event', models.OneToOneField(
                    blank=True,
                    help_text='Set when the draft is approved and promoted to an Event.',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='draft_origin',
                    to='events.event',
                )),
            ],
            options={
                'verbose_name': 'Event Draft',
                'verbose_name_plural': 'Event Drafts',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='eventdraft',
            index=models.Index(fields=['status', 'confidence'], name='agents_eventdraft_status_conf_idx'),
        ),
    ]
