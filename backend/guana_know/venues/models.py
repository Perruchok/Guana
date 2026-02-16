"""
Venue models for Guana Know.
"""

from django.db import models
from django.contrib.auth import get_user_model
from guana_know.common.models import BaseModel

User = get_user_model()


class Venue(BaseModel):
    """Model for cultural spaces and venues."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    CATEGORY_CHOICES = [
        ('museum', 'Museum'),
        ('gallery', 'Gallery'),
        ('theater', 'Theater'),
        ('cinema', 'Cinema'),
        ('cafe', 'Café/Bar'),
        ('cultural_center', 'Cultural Center'),
        ('library', 'Library'),
        ('market', 'Market'),
        ('public_space', 'Public Space'),
        ('other', 'Other'),
    ]
    
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='venues'
    )
    
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, db_index=True)
    description = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        db_index=True
    )
    
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100, default='Guanajuato', db_index=True)
    state = models.CharField(max_length=100, default='Guanajuato')
    postal_code = models.CharField(max_length=20, blank=True)
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    
    image = models.ImageField(upload_to='venues/', null=True, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    
    is_featured = models.BooleanField(default=False, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['city', 'category']),
            models.Index(fields=['is_featured', '-created_at']),
        ]
    
    def __str__(self):
        return self.name
