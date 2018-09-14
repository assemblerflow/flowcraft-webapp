from django.db import models
from django.contrib.postgres.fields import JSONField


class Reports(models.Model):

    run_id = models.CharField(max_length=1024)
    timestamp = models.DateTimeField(auto_now=True)
    report_json = JSONField(blank=True, default={})
    status = JSONField(blank=True, default={})
