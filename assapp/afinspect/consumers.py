from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import json


class StatusConsumer(WebsocketConsumer):

    def connect(self):

        self.run_id = self.scope["url_route"]["kwargs"]["run_id"]

        async_to_sync(self.channel_layer.group_add)(
            self.run_id,
            self.channel_name
        )

        self.accept()

    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self.run_id,
            self.channel_name
        )
        pass

    def receive(self, text_data=None, bytes_data=None):
        text_data = json.loads(text_data)
        message = text_data["message"]
        print(message)

        async_to_sync(self.channel_layer.group_send)(
            self.run_id,
            {
                "type": "message",
                "message": "ping"
            }
        )
        print("Message sent")

    def message(self, event):
        message = event["message"]

        self.send(text_data=json.dumps(
            {"message": message}
        ))
