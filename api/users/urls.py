from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, UserViewSet, SellerKYCViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'kyc', SellerKYCViewSet, basename='kyc')

urlpatterns = [
    path('api/', include(router.urls)),
]
