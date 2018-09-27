from rest_framework.parsers import JSONParser
import json
from websocket import create_connection

from django.views import View
from rest_framework import status

from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist

from . import models
from afreport.serializers import ReportsSerializer


class Reports(View):

    def get(self, request):

        f = models.Reports.objects.get(run_id=request.GET.get("run_id"))

        if request.GET.get("status"):
            return JsonResponse({"status": f.status})

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

    def put(self, request):

        data = JSONParser().parse(request)
        serializer = ReportsSerializer(data=data)

        if serializer.is_valid():
            print(serializer.data.keys())
            instance = models.Reports.objects.get(
                run_id=serializer.data["run_id"])
            instance.report_json["data"]["results"].extend(
                serializer.data["report_json"])
            instance.report_json = instance.report_json
            instance.status = serializer.data["status"]
            instance.save()

            ws_addr = "ws://{}/ws/report/{}/".format(
                request.get_host(),
                data["run_id"]
            )
            ws_con = create_connection(ws_addr)
            ws_con.send(json.dumps({
                "message": len(serializer.data["report_json"])
            }))

            return JsonResponse(serializer.data,
                                status=status.HTTP_202_ACCEPTED)
        else:
            JsonResponse(serializer.data,
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


class QueryId(View):

    def get(self, request):

        try:
            models.Reports.objects.get(run_id=request.GET.get("run_id"))
            return JsonResponse({"message": True}, status=status.HTTP_200_OK)
        except ObjectDoesNotExist:
            return JsonResponse({"message": False}, status=status.HTTP_200_OK)
