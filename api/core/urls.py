"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# from drf_yasg.views import get_schema_view
# from drf_yasg import openapi
from rest_framework import permissions
from . import logs

# schema_view = get_schema_view(
#     openapi.Info(
#         title="BookZone API",
#         default_version="v1",
#         description="API for BookZone marketplace",
#         terms_of_service="https://www.google.com/policies/terms/",
#         contact=openapi.Contact(email="contact@bookzone.local"),
#         license=openapi.License(name="BSD License"),
#     ),
#     public=True,
#     permission_classes=(permissions.AllowAny,),
# )
urlpatterns = [
    path("admin/", admin.site.urls),
    path("logs/", logs.index_directory_log, name="logs-dir"),
    path("logs/<str:filename>", logs.serve_file, name="log-file"),
    path("", include("users.urls")),
    path("", include("books.urls")),
    path("", include("orders.urls")),
    path("", include("reviews.urls")),
    path("", include("chat_messages.urls")),
    # path(
    #     "swagger/",
    #     schema_view.with_ui("swagger", cache_timeout=0),
    #     name="schema-swagger-ui",
    # ),
    # path(
    #     "redoc/",
    #     schema_view.with_ui("redoc", cache_timeout=0),
    #     name="schema-redoc",
    # ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
