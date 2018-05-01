from django.db import models
from django.contrib.postgres.fields import JSONField


# Create your models here.
class Status(models.Model):

    status_id = models.IntegerField()
    timestamp = models.DateTimeField(auto_now=True)
    status_json = JSONField(blank=True, default={})
