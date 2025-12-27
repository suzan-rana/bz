from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, WishlistViewSet

router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('api/', include(router.urls)),
]
