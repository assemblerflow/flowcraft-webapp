from django.urls import path

from . import views

urlpatterns = [
    path("api/reports", views.Reports.as_view()),
    path("api/reports/exists", views.QueryId.as_view())
]
