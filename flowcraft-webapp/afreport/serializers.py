from rest_framework import serializers
from afreport.models import Reports


class ReportsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reports
        fields = ("run_id", "report_json", "status")
