from django.urls import path
from django.conf.urls import url

from . import views

urlpatterns = [
    # path("", views.index),
    url("status_id.*$", views.index)
]
