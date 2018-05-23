from rest_framework import serializers
from afinspect.models import Status


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ("run_id", "status_json", "dag_json")
