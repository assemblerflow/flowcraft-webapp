import json

from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework.decorators import api_view

from django.http import HttpResponse, JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from . import models
from afinspect.serializers import StatusSerializer


class Status(View):

    def get(self, request):

        print(request.GET.get("status_id"))

        print(request.session)

        f = models.Status.objects.get(status_id=request.GET.get("status_id"))

        return HttpResponse(f.status_json)

    def put(self, request):

        data = JSONParser().parse(request)
        print(data)
        serializer = StatusSerializer(data=data)

        if serializer.is_valid():
            instance = models.Status.objects.get(
                status_id=serializer.data["status_id"])
            instance.status_json = serializer.data["status_json"]
            instance.save()

            return JsonResponse(serializer.data,
                                status=status.HTTP_202_ACCEPTED)
        else:
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):

        data = JSONParser().parse(request)
        serializer = StatusSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data,
                                status=status.HTTP_201_CREATED)
        else:
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):

        data = JSONParser().parse(request)
        serializer = StatusSerializer(data=data)

        if serializer.is_valid():
            instance = models.Status.objects.get(
                status_id=serializer.data["status_id"])
            instance.delete()

            return JsonResponse(serializer.data,
                                status=status.HTTP_202_ACCEPTED)
        else:
            print(serializer.errors)
            return JsonResponse(serializer.errors,
                                status=status.HTTP_400_BAD_REQUEST)
