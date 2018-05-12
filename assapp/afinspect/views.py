import json

from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework.decorators import api_view

from django.http import HttpResponse, JsonResponse
from django.views import View
from django.core.exceptions import ObjectDoesNotExist
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from . import models
from afinspect.serializers import StatusSerializer


class Status(View):

    def get(self, request):

        f = models.Status.objects.get(run_id=request.GET.get("run_id"))

        return JsonResponse(f.status_json)

    def put(self, request):

        data = JSONParser().parse(request)
        print(data)
        serializer = StatusSerializer(data=data)

        if serializer.is_valid():
            instance = models.Status.objects.get(
                run_id=serializer.data["run_id"])
            instance.status_json = serializer.data["status_json"]
            instance.save()

            return JsonResponse(serializer.data,
                                status=status.HTTP_202_ACCEPTED)
        else:
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):

        data = JSONParser().parse(request)
        print(data)
        serializer = StatusSerializer(data=data)
        # print(serializer.data)

        if serializer.is_valid():

            try:
                instance = models.Status.objects.get(
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
