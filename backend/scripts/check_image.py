#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from guana_know.venues.models import Venue

venue = Venue.objects.filter(slug='mi-casa').first()
if venue:
    print(f"Venue: {venue.name}")
    print(f"Image field value: {venue.image}")
    print(f"Image URL (if exists): {venue.image.url if venue.image else 'NULL'}")
else:
    print("No venue found with slug 'mi-casa'")
    print("\nAvailable venues:")
    for v in Venue.objects.all():
        url = v.image.url if v.image else 'NULL'
        print(f"  - {v.slug}: image={v.image} | URL={url}")
