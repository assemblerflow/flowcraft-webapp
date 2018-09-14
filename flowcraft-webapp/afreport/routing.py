from django.conf.urls import url

from . import consumers

websocket_urlpatterns = [
    url(r'^ws/report/(?P<run_id>[^/]+)/$', consumers.ReportsConsumer),
]

