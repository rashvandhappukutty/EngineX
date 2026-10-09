import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("enginex.notifications")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, payload: Dict[str, Any]):
        """Broadcast event to all connected WebSocket clients asynchronously without blocking HTTP response."""
        if not self.active_connections:
            return

        message = {
            "event": event_type,
            "data": payload,
        }

        disconnected = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"Failed to send message to websocket client: {exc}")
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


notification_manager = ConnectionManager()
