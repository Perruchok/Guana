# Prompt: Configure Azure Blob Storage for Guana Know

Configure django-storages with Azure Blob Storage for all media
file handling (venue images, event images, user avatars).

---

## STEP 1: Install dependencies

Add to backend/requirements.txt and install:

  django-storages[azure]==1.14.2
  azure-storage-blob==12.19.0

Run:
  pip install django-storages[azure] azure-storage-blob
  pip freeze > requirements.txt

---

## STEP 2: Environment variables

Add these to backend/.env.example:

  # Azure Blob Storage
  AZURE_ACCOUNT_NAME=your_storage_account_name
  AZURE_ACCOUNT_KEY=your_storage_account_key
  AZURE_CONTAINER=media
  AZURE_CUSTOM_DOMAIN=        # optional CDN domain, leave blank for now

Add the actual values to backend/.env (never commit this file).
The connection string from Azure Portal contains both account name
and key — extract them:
  AccountName=xxx → AZURE_ACCOUNT_NAME
  AccountKey=xxx  → AZURE_ACCOUNT_KEY

---

## STEP 3: Django settings

In backend/config/settings.py, add a storage configuration block.
Place it after the existing MEDIA_URL / MEDIA_ROOT settings.

USE_AZURE_STORAGE = config('USE_AZURE_STORAGE', default=False, cast=bool)

if USE_AZURE_STORAGE:
    # Azure Blob Storage settings
    AZURE_ACCOUNT_NAME = config('AZURE_ACCOUNT_NAME')
    AZURE_ACCOUNT_KEY  = config('AZURE_ACCOUNT_KEY')
    AZURE_CONTAINER    = config('AZURE_CONTAINER', default='media')
    AZURE_CUSTOM_DOMAIN = config('AZURE_CUSTOM_DOMAIN', default=None)

    # All media files go to Azure
    DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'

    # Public URL for serving files
    if AZURE_CUSTOM_DOMAIN:
        MEDIA_URL = f'https://{AZURE_CUSTOM_DOMAIN}/'
    else:
        MEDIA_URL = f'https://{AZURE_ACCOUNT_NAME}.blob.core.windows.net/{AZURE_CONTAINER}/'

else:
    # Local development — files saved to /media/ folder
    MEDIA_URL  = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

This design means:
- Local dev:        USE_AZURE_STORAGE=False  (default, no Azure needed)
- Staging/prod:     USE_AZURE_STORAGE=True   (requires Azure credentials)

---

## STEP 4: Serve local media files in development

In backend/config/urls.py, add media file serving for local dev.
This is already needed even without Azure:

  from django.conf import settings
  from django.conf.urls.static import static

  urlpatterns = [
      # ... existing urls
  ]

  if settings.DEBUG:
      urlpatterns += static(settings.MEDIA_URL,
                            document_root=settings.MEDIA_ROOT)

---

## STEP 5: Add image upload endpoints

### 5a — Venue images endpoint

In backend/guana_know/venues/views.py, add a new action to
VenueViewSet for uploading multiple images:

  from rest_framework.decorators import action
  from rest_framework.parsers import MultiPartParser, FormParser
  from rest_framework.response import Response
  from rest_framework import status

  @action(
      detail=True,
      methods=['post'],
      url_path='upload-image',
      parser_classes=[MultiPartParser, FormParser],
      permission_classes=[IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
  )
  def upload_image(self, request, pk=None):
      """
      POST /api/venues/{id}/upload-image/
      Accepts: multipart/form-data with field 'image'
      Returns: updated venue with new image URL
      """
      venue = self.get_object()
      if 'image' not in request.FILES:
          return Response(
              {'detail': 'No se proporcionó ninguna imagen.'},
              status=status.HTTP_400_BAD_REQUEST
          )

      file = request.FILES['image']

      # Validate file type
      allowed_types = ['image/jpeg', 'image/png', 'image/webp']
      if file.content_type not in allowed_types:
          return Response(
              {'detail': 'Formato no válido. Usa JPG, PNG o WebP.'},
              status=status.HTTP_400_BAD_REQUEST
          )

      # Validate file size (max 5MB)
      if file.size > 5 * 1024 * 1024:
          return Response(
              {'detail': 'La imagen no puede pesar más de 5MB.'},
              status=status.HTTP_400_BAD_REQUEST
          )

      venue.image = file
      venue.save()
      serializer = self.get_serializer(venue)
      return Response(serializer.data)

### 5b — Event image upload

Add the same pattern to EventViewSet in
backend/guana_know/events/views.py:

  @action(
      detail=True,
      methods=['post'],
      url_path='upload-image',
      parser_classes=[MultiPartParser, FormParser],
      permission_classes=[IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
  )
  def upload_image(self, request, pk=None):
      event = self.get_object()
      if 'image' not in request.FILES:
          return Response(
              {'detail': 'No se proporcionó ninguna imagen.'},
              status=status.HTTP_400_BAD_REQUEST
          )
      file = request.FILES['image']
      allowed_types = ['image/jpeg', 'image/png', 'image/webp']
      if file.content_type not in allowed_types:
          return Response(
              {'detail': 'Formato no válido. Usa JPG, PNG o WebP.'},
              status=status.HTTP_400_BAD_REQUEST
          )
      if file.size > 5 * 1024 * 1024:
          return Response(
              {'detail': 'La imagen no puede pesar más de 5MB.'},
              status=status.HTTP_400_BAD_REQUEST
          )
      event.image = file
      event.save()
      serializer = self.get_serializer(event)
      return Response(serializer.data)

---

## STEP 6: Add upload functions to frontend API client

In frontend/lib/api.ts, add these upload functions:

  export const uploads = {
    /**
     * POST /venues/{id}/upload-image/
     * Uploads a single image file for a venue.
     */
    venueImage: async (token: string, venueId: string, file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(
        `${BASE}/venues/${venueId}/upload-image/`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          // Do NOT set Content-Type here — browser sets it with boundary
          body: formData,
        }
      )
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Error al subir imagen' }))
        throw error
      }
      return res.json() as Promise<Venue>
    },

    /**
     * POST /events/{id}/upload-image/
     * Uploads a single image file for an event.
     */
    eventImage: async (token: string, eventId: string, file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch(
        `${BASE}/events/${eventId}/upload-image/`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      )
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Error al subir imagen' }))
        throw error
      }
      return res.json() as Promise<Event>
    },
  }

---

## STEP 7: Image upload UI component

Create frontend/components/ui/ImageUploader.tsx

This is a reusable drag-and-drop image upload component used in
both the venue profile editor and event creation form.

Props:
  currentImage: string | null   -- existing image URL to preview
  onUpload: (file: File) => Promise<void>  -- called with selected file
  label?: string                -- defaults to "Imagen"
  hint?: string                 -- shown below, e.g. "JPG, PNG o WebP · Máx 5MB"
  loading?: boolean             -- shows spinner overlay during upload

Behavior:
- Shows current image preview if currentImage exists
  (use next/image with unoptimized={true} if domain not configured)
- Drag and drop area with dashed border when no image
- Click to open file picker (input type=file, accept="image/*", hidden)
- On file select: call onUpload(file) immediately
- During upload (loading=true): show spinner overlay on the preview
- On success: preview updates automatically (parent re-fetches venue)
- On error: show error message below the uploader

Styling:
- Drop zone: border-2 border-dashed border-border rounded-sm
- bg-pale when empty, shows image when populated
- Height: 200px
- Hover state on drop zone: border-terracota bg-cream
- Drag-over state: border-terracota bg-pale scale-[1.01]
- Upload button below image: "Cambiar imagen" in text-xs text-stone
  with a small camera icon

---

## STEP 8: Wire ImageUploader into venue dashboard

In frontend/app/(dashboard)/dashboard/perfil/page.tsx:

Import ImageUploader and uploads from lib/api.ts.

Add image upload section above the form fields:

  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (file: File) => {
    if (!venue || !token) return
    setUploading(true)
    try {
      const updated = await uploads.venueImage(token, venue.id, file)
      setVenue(updated)  // update local state with new image URL
    } catch (err) {
      setError('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  // In the JSX:
  <ImageUploader
    currentImage={venue.image}
    onUpload={handleImageUpload}
    loading={uploading}
    label="Foto principal de tu lugar"
    hint="JPG, PNG o WebP · Máx 5MB · Esta imagen aparece en el directorio y en tu perfil"
  />

---

## STEP 9: Wire ImageUploader into event creation form

In frontend/app/(dashboard)/dashboard/eventos/nuevo/page.tsx:

The event image upload has a different flow — the event must be
created first (to get an ID), then the image can be uploaded.

Implement as two-step:
  Step 1: POST /api/events/ with all text fields → get event.id back
  Step 2: If user selected an image, POST to /api/events/{id}/upload-image/
  Step 3: Redirect to /dashboard/eventos

In the form, add an optional image field using ImageUploader with
onUpload storing the file in local state (not uploading yet):

  const [pendingImage, setPendingImage] = useState<File | null>(null)

  // ImageUploader in event form — previews locally, uploads after submit
  <ImageUploader
    currentImage={pendingImage ? URL.createObjectURL(pendingImage) : null}
    onUpload={async (file) => setPendingImage(file)}
    label="Imagen del evento (opcional)"
    hint="JPG, PNG o WebP · Máx 5MB"
  />

  // In handleSubmit, after creating the event:
  if (pendingImage && newEvent.id) {
    await uploads.eventImage(token, newEvent.id, pendingImage)
  }

---

## STEP 10: Update next.config.js for image domains

In frontend/next.config.js, add Azure Blob Storage to the
allowed image domains so next/image works with remote URLs:

  const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '8000',
          pathname: '/media/**',
        },
        {
          // GitHub Codespaces backend
          protocol: 'https',
          hostname: '*.app.github.dev',
          pathname: '/media/**',
        },
        {
          // Azure Blob Storage
          protocol: 'https',
          hostname: '*.blob.core.windows.net',
          pathname: '/**',
        },
      ],
    },
  }

---

## Testing checklist

After implementation, verify in this order:

Local dev (USE_AZURE_STORAGE=False):
  [ ] Upload venue image from /dashboard/perfil
  [ ] Image saves to backend/media/venues/ folder
  [ ] Image appears in venue profile at /lugares/{slug}
  [ ] Upload event image during event creation
  [ ] Image appears in event card on homepage

Azure (USE_AZURE_STORAGE=True) — test after Azure container created:
  [ ] Upload venue image
  [ ] Image URL is *.blob.core.windows.net/media/venues/filename.jpg
  [ ] Image loads in venue profile
  [ ] Django admin shows correct URL in ImageField

---

## Environment variable summary

backend/.env for local dev:
  USE_AZURE_STORAGE=False

backend/.env for production:
  USE_AZURE_STORAGE=True
  AZURE_ACCOUNT_NAME=guanaknowmedia
  AZURE_ACCOUNT_KEY=your_key_here
  AZURE_CONTAINER=media

frontend/.env.local — no changes needed for images.
Azure URLs are absolute and served directly from Blob Storage.