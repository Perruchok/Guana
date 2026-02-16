"""
URL configuration for Guana Know project.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    path('api/users/', include('guana_know.users.urls')),
    path('api/venues/', include('guana_know.venues.urls')),
    path('api/events/', include('guana_know.events.urls')),
    path('api/subscriptions/', include('guana_know.subscriptions.urls')),
]
