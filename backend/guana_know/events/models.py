"""
Event models for Guana Know.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from guana_know.common.models import BaseModel
from guana_know.venues.models import Venue

User = get_user_model()


class Event(BaseModel):
    """Model for cultural events."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('cancelled', 'Cancelled'),
        ('archived', 'Archived'),
    ]
    
    CATEGORY_CHOICES = [
        ('exhibition', 'Exhibition'),
        ('performance', 'Performance'),
        ('workshop', 'Workshop'),
        ('conference', 'Conference'),
        ('festival', 'Festival'),
        ('cinema', 'Cinema'),
        ('music', 'Music'),
        ('theater', 'Theater'),
        ('dance', 'Dance'),
        ('art', 'Art'),
        ('literature', 'Literature'),
        ('other', 'Other'),
    ]
    
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='events'
    )
    
    venue = models.ForeignKey(
        Venue,
        on_delete=models.PROTECT,
        related_name='events'
    )
    
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, db_index=True)
    description = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        db_index=True
    )
    
    image = models.ImageField(upload_to='events/', null=True, blank=True)
    
    start_datetime = models.DateTimeField(db_index=True)
    end_datetime = models.DateTimeField()
    
    capacity = models.IntegerField(null=True, blank=True)
    registered_count = models.IntegerField(default=0)
    
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Price in MXN. 0 for free events.'
    )
    
    is_free = models.BooleanField(default=True, db_index=True)
    
    registration_url = models.URLField(blank=True, null=True)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    
    is_featured = models.BooleanField(default=False, db_index=True)
    
    class Meta:
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['venue', 'start_datetime']),
            models.Index(fields=['status', 'start_datetime']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['is_featured', 'start_datetime']),
        ]
    
    def __str__(self):
        return self.title
    
    def is_upcoming(self):
        return self.start_datetime > timezone.now()
    
    def is_ongoing(self):
        now = timezone.now()
        return self.start_datetime <= now <= self.end_datetime
    
    def is_past(self):
        return self.end_datetime < timezone.now()
