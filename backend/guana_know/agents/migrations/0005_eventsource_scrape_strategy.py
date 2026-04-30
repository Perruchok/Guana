from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("agents", "0004_remove_venue_from_eventsource"),
    ]

    operations = [
        migrations.AddField(
            model_name="eventsource",
            name="scrape_strategy",
            field=models.CharField(
                choices=[
                    ("generic", "Generic HTML scraper"),
                    ("json_ld", "JSON-LD structured data"),
                    ("ical", "iCal feed"),
                    ("apify_facebook", "Apify \u2014 Facebook"),
                    ("apify_instagram", "Apify \u2014 Instagram"),
                ],
                default="generic",
                help_text="Scraping strategy to use for this source.",
                max_length=30,
            ),
        ),
    ]
