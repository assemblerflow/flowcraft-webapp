import json
from websocket import create_connection

from rest_framework import status
from rest_framework.parsers import JSONParser

from django.http import JsonResponse
from django.views import View
from django.core.exceptions import ObjectDoesNotExist

from . import models
from afinspect.serializers import StatusSerializer


class Status(View):

    def get(self, request):

        f = models.Status.objects.get(run_id=request.GET.get("run_id"))

        return JsonResponse(f.status_json)

    def put(self, request):

        data = JSONParser().parse(request)
        serializer = StatusSerializer(data=data)

        if serializer.is_valid():
            instance = models.Status.objects.get(
                run_id=serializer.data["run_id"])
            instance.status_json = serializer.data["status_json"]
            instance.save()

            ws_addr = "ws://{}/ws/inspect/{}/".format(
                request.get_host(),
                data["run_id"]
            )
            ws_con = create_connection(ws_addr)
            ws_con.send(json.dumps({
                "message": data["run_id"]
            }))

            return JsonResponse(serializer.data,
                                status=status.HTTP_202_ACCEPTED)
        else:
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):

        data = JSONParser().parse(request)
        serializer = StatusSerializer(data=data)

        if serializer.is_valid():

            try:
                instance = models.Status.objects.get(
                    run_id=data["run_id"])
                instance.delete()
            except ObjectDoesNotExist:
                pass

            serializer.save()

            # self.ws_con = create_connection()
            return JsonResponse(serializer.data,
                                status=status.HTTP_201_CREATED)
        else:
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):

        data = JSONParser().parse(request)
        print(data)
        serializer = StatusSerializer(data=data)

        if serializer.is_valid():

            try:
                instance = models.Status.objects.get(
                    run_id=serializer.data["run_id"])
                instance.delete()
            except ObjectDoesNotExist:
                pass

            return JsonResponse(serializer.data,
                                status=status.HTTP_202_ACCEPTED)
        else:
            print(serializer.errors)
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)
