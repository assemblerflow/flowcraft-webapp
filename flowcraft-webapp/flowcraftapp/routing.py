from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import afinspect.routing
import afreport.routing

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(
            afinspect.routing.websocket_urlpatterns +
            afreport.routing.websocket_urlpatterns
        )
    ),
})
