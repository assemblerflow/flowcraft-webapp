from rest_framework.parsers import JSONParser

from django.views import View
from rest_framework import status

from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist

from . import models
from afreport.serializers import ReportsSerializer


class Reports(View):

    def get(self, request):

        f = models.Reports.objects.get(run_id=request.GET.get("run_id"))

        return JsonResponse({"data": f.report_json})

    def post(self, request):

        data = JSONParser().parse(request)
        serializer = ReportsSerializer(data=data)

        if serializer.is_valid():

            try:
                instance = models.Reports.objects.get(
                    run_id=data["run_id"])
                instance.delete()
            except ObjectDoesNotExist:
                pass

            serializer.save()

            return JsonResponse(serializer.data,
                                status=status.HTTP_201_CREATED)

        else:
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):

        data = JSONParser().parse(request)
        serializer = ReportsSerializer(data=data)

        if serializer.is_valid():

            try:
                instance = models.Reports.objects.get(
                    run_id=serializer.data["run_id"])
                instance.delete()
            except ObjectDoesNotExist:
                pass

            return JsonResponse(serializer.data,
                                status=status.HTTP_202_ACCEPTED)

        else:
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)
