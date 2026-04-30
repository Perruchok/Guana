from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Change image_source_url from URLField(max_length=200) to TextField
    to accommodate long CDN URLs from Facebook and other sources.
    """

    dependencies = [
        ("events", "0004_event_image_source_url"),
    ]

    operations = [
        migrations.AlterField(
            model_name="event",
            name="image_source_url",
            field=models.TextField(
                blank=True,
                help_text="Original image URL from the scraped event source.",
            ),
        ),
    ]
