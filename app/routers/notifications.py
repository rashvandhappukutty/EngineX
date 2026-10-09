from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.notification_service import notification_manager

router = APIRouter(tags=["Real-time Notifications"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time crisis event notifications.

    NOTE: In-memory notification manager suitable for single-process prototype.
    """
    await notification_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and receive optional ping messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket)
    except Exception:
        notification_manager.disconnect(websocket)
