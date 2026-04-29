from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='source',
            field=models.CharField(
                choices=[('manual', 'Manual'), ('agent', 'Agent')],
                db_index=True,
                default='manual',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='event',
            name='source_url',
            field=models.URLField(
                blank=True,
                help_text='Original URL where the agent discovered this event.',
            ),
        ),
    ]
