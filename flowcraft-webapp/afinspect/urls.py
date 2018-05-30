from django.urls import path

from . import views

urlpatterns = [
    # inspect/api/status
    path("api/status", views.Status.as_view())
]
