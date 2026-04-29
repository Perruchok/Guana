"""
Management command to import venues from an Excel (.xlsx) file.

Usage:
    python manage.py import_venues path/to/venues.xlsx
    python manage.py import_venues path/to/venues.xlsx --dry-run
    python manage.py import_venues path/to/venues.xlsx --update-existing
"""

import sys
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()


class Command(BaseCommand):
    help = "Import venues from an Excel (.xlsx) file into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "file",
            type=str,
            help="Path to the .xlsx file to import."
        )
        parser.add_argument(
            "--owner-email",
            type=str,
            default=None,
            help="Email of the user to assign as owner of all imported venues. Defaults to the first superuser found.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Validate and preview the import without saving anything to the database.",
        )
        parser.add_argument(
            "--update-existing",
            action="store_true",
            default=False,
            help="Update venues that already exist (matched by slug) instead of skipping them.",
        )

    def handle(self, *args, **options):
        try:
            import openpyxl
        except ImportError:
            raise CommandError(
                "openpyxl is required. Install it with: pip install openpyxl"
            )

        file_path = options["file"]
        dry_run = options["dry_run"]
        update_existing = options["update_existing"]
        owner_email = options["owner_email"]

        # Resolve owner
        owner = self._resolve_owner(owner_email)
        self.stdout.write(f"Owner: {owner.email} ({owner.username})")

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN — no changes will be saved."))

        # Load workbook
        try:
            wb = openpyxl.load_workbook(file_path)
        except FileNotFoundError:
            raise CommandError(f"File not found: {file_path}")
        except Exception as e:
            raise CommandError(f"Could not open file: {e}")

        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))

        if not rows:
            raise CommandError("The spreadsheet is empty.")

        headers = [str(h).strip() if h else "" for h in rows[0]]
        data_rows = rows[1:]

        self.stdout.write(f"Found {len(data_rows)} venues to process.")

        required_fields = ["name", "slug", "description", "category", "address", "city", "state", "status"]
        self._validate_headers(headers, required_fields)

        # Import venues from within the app to avoid circular imports
        from guana_know.venues.models import Venue

        created = 0
        updated = 0
        skipped = 0
        errors = 0

        for row_num, row in enumerate(data_rows, start=2):
            row_data = dict(zip(headers, row))

            # Skip fully empty rows
            if not any(row_data.values()):
                continue

            name = self._clean(row_data.get("name"))
            if not name:
                self.stdout.write(self.style.WARNING(f"  Row {row_num}: missing name, skipping."))
                errors += 1
                continue

            slug = self._clean(row_data.get("slug")) or slugify(name)

            try:
                venue_data = self._build_venue_data(row_data, slug, owner)
            except ValueError as e:
                self.stdout.write(self.style.ERROR(f"  Row {row_num} ({name}): {e}"))
                errors += 1
                continue

            existing = Venue.objects.filter(slug=slug).first()

            if existing:
                if update_existing:
                    if not dry_run:
                        for field, value in venue_data.items():
                            if field != "owner":
                                setattr(existing, field, value)
                        existing.save()
                    self.stdout.write(f"  Updated: {name} ({slug})")
                    updated += 1
                else:
                    self.stdout.write(self.style.WARNING(f"  Skipped (already exists): {name} ({slug})"))
                    skipped += 1
            else:
                if not dry_run:
                    Venue.objects.create(**venue_data)
                self.stdout.write(f"  Created: {name} ({slug})")
                created += 1

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            f"Done. Created: {created} | Updated: {updated} | Skipped: {skipped} | Errors: {errors}"
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN complete — nothing was saved."))

    def _resolve_owner(self, owner_email):
        if owner_email:
            try:
                return User.objects.get(email=owner_email)
            except User.DoesNotExist:
                raise CommandError(f"No user found with email: {owner_email}")

        superuser = User.objects.filter(is_superuser=True).order_by("date_joined").first()
        if not superuser:
            raise CommandError(
                "No superuser found. Create one first with: python manage.py createsuperuser\n"
                "Or specify an owner with: --owner-email user@example.com"
            )
        return superuser

    def _validate_headers(self, headers, required_fields):
        missing = [f for f in required_fields if f not in headers]
        if missing:
            raise CommandError(
                f"Missing required columns in spreadsheet: {', '.join(missing)}\n"
                f"Found columns: {', '.join(headers)}"
            )

    def _build_venue_data(self, row_data, slug, owner):
        valid_categories = [
            "museum", "gallery", "theater", "cinema", "cafe",
            "cultural_center", "library", "market", "public_space", "other"
        ]
        valid_statuses = ["draft", "published", "archived"]

        category = self._clean(row_data.get("category", "other"))
        if category not in valid_categories:
            raise ValueError(
                f"Invalid category '{category}'. Must be one of: {', '.join(valid_categories)}"
            )

        status = self._clean(row_data.get("status", "draft"))
        if status not in valid_statuses:
            raise ValueError(
                f"Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}"
            )

        is_featured_raw = row_data.get("is_featured", False)
        if isinstance(is_featured_raw, bool):
            is_featured = is_featured_raw
        elif isinstance(is_featured_raw, str):
            is_featured = is_featured_raw.strip().upper() in ("TRUE", "1", "YES", "SI", "SÍ")
        else:
            is_featured = bool(is_featured_raw)

        return {
            "owner": owner,
            "name": self._clean(row_data.get("name")),
            "slug": slug,
            "description": self._clean(row_data.get("description", "")),
            "category": category,
            "address": self._clean(row_data.get("address", "")),
            "city": self._clean(row_data.get("city", "Guanajuato")),
            "state": self._clean(row_data.get("state", "Guanajuato")),
            "postal_code": self._clean(row_data.get("postal_code", "")) or "",
            "phone": self._clean(row_data.get("phone", "")) or "",
            "email": self._clean(row_data.get("email", "")) or "",
            "website": self._clean(row_data.get("website", "")) or "",
            "status": status,
            "is_featured": is_featured,
        }

    def _clean(self, value):
        if value is None:
            return ""
        return str(value).strip()