#!/usr/bin/env python
"""
Diagnostic script to check what the API returns for the mi-casa venue
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from guana_know.venues.models import Venue
from guana_know.venues.serializers import VenueSerializer

print("=" * 80)
print("VENUE IMAGE DIAGNOSTIC")
print("=" * 80)

# Check database
print("\n[1] DATABASE CHECK")
print("-" * 80)
try:
    venue = Venue.objects.get(slug='mi-casa')
    print(f"✓ Found venue: {venue.name}")
    print(f"  - Image field (raw): {venue.image}")
    print(f"  - Image URL: {venue.image.url if venue.image else 'NULL'}")
    print(f"  - Storage backend: {'Azure Blob Storage' if venue.image else 'N/A'}")
except Venue.DoesNotExist:
    print("✗ No venue with slug 'mi-casa' found")
    print("\n  Available venues:")
    for v in Venue.objects.all()[:5]:
        url = v.image.url if v.image else 'NULL'
        print(f"    - {v.slug}: image={'YES' if v.image else 'NO'} | URL={url}")
    print("\nAborting diagnostic...")
    exit(1)

# Check serializer output
print("\n[2] SERIALIZER OUTPUT CHECK")
print("-" * 80)
serializer = VenueSerializer(venue)
data = serializer.data
print(f"Serializer output (full 'image' field):")
print(f"  {json.dumps({'image': data.get('image')}, indent=2)}")

if data.get('image'):
    print(f"\n✓ Image field is present in serializer output")
    print(f"  Value: {data['image']}")
else:
    print(f"\n✗ Image field is NULL or missing in serializer output!")

# Check settings
print("\n[3] SETTINGS CHECK")
print("-" * 80)
from django.conf import settings

print(f"USE_AZURE_STORAGE: {getattr(settings, 'USE_AZURE_STORAGE', 'NOT SET')}")
print(f"MEDIA_URL: {getattr(settings, 'MEDIA_URL', 'NOT SET')}")
print(f"AZURE_ACCOUNT_NAME: {getattr(settings, 'AZURE_ACCOUNT_NAME', 'NOT SET')}")
print(f"AZURE_CONTAINER: {getattr(settings, 'AZURE_CONTAINER', 'NOT SET')}")

print("\n[4] EXPECTED URL")
print("-" * 80)
if venue.image:
    expected_url = venue.image.url
    print(f"Expected full URL: {expected_url}")
    print(f"Expected format: https://guanamedia.blob.core.windows.net/media/venues/<filename>")
    print(f"✓ Matches expected Azure format: {expected_url.startswith('https://guanamedia.blob.core.windows.net')}")
else:
    print("Cannot determine - no image in database")

print("\n" + "=" * 80)
print("END DIAGNOSTIC")
print("=" * 80)
