from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0003_event_agent_source'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='image_source_url',
            field=models.URLField(
                blank=True,
                help_text='Original image URL from the scraped event source.',
            ),
        ),
    ]
