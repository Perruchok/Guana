"""
URL configuration for Guana Know project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/health/', lambda r: JsonResponse({'status': 'ok'}), name='health'),

    path('api/users/', include('guana_know.users.urls')),
    path('api/venues/', include('guana_know.venues.urls')),
    path('api/events/', include('guana_know.events.urls')),
    path('api/subscriptions/', include('guana_know.subscriptions.urls')),
]

if settings.DEBUG:
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ]
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
