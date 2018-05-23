from django.db import models
from django.contrib.postgres.fields import JSONField


# Create your models here.
class Status(models.Model):

    run_id = models.CharField(max_length=1024)
    timestamp = models.DateTimeField(auto_now=True)
    status_json = JSONField(blank=True, default={})
    dag_json = JSONField(blank=True, default={})
