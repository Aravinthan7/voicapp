import json
import asyncio
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.speech.simulator import SimulatedTranslator

router = APIRouter(tags=["websocket"])
translator = SimulatedTranslator()

# In-memory room connection registry for active WebRTC signaling
class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        self.user_meta: Dict[WebSocket, dict] = {}

    async def connect(self, room_id: str, websocket: WebSocket, user_info: dict):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []

        if len(self.active_rooms[room_id]) >= 2:
            await websocket.send_text(
                json.dumps({
                    "type": "error",
                    "payload": {"code": "ROOM_FULL", "message": "VoiceApp call rooms support maximum 2 participants in Phase 1."},
                    "seq": 0,
                })
            )
            await websocket.close(code=1008)
            return False

        self.active_rooms[room_id].append(websocket)
        self.user_meta[websocket] = user_info

        # Notify existing participant that peer joined
        for peer in self.active_rooms[room_id]:
            if peer != websocket:
                await peer.send_text(
                    json.dumps({
                        "type": "peer-joined",
                        "payload": {
                            "displayName": user_info.get("displayName", "Peer"),
                            "speakingLanguage": user_info.get("speakingLanguage", "ta-IN"),
                        },
                        "seq": 1,
                    })
                )
        return True

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_rooms:
            if websocket in self.active_rooms[room_id]:
                self.active_rooms[room_id].remove(websocket)
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]
        if websocket in self.user_meta:
            del self.user_meta[websocket]

    async def broadcast_to_peer(self, room_id: str, sender: WebSocket, message: str):
        if room_id in self.active_rooms:
            for conn in self.active_rooms[room_id]:
                if conn != sender:
                    await conn.send_text(message)

    async def broadcast_to_room(self, room_id: str, message: str):
        if room_id in self.active_rooms:
            for conn in self.active_rooms[room_id]:
                await conn.send_text(message)


manager = ConnectionManager()


@router.websocket("/ws/calls/{room_id}")
async def websocket_call_endpoint(websocket: WebSocket, room_id: str, token: str = "guest"):
    user_info = {
        "displayName": "Participant",
        "speakingLanguage": "ml-IN",
    }
    
    connected = await manager.connect(room_id, websocket, user_info)
    if not connected:
        return

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg_type = msg.get("type")
                payload = msg.get("payload", {})

                if msg_type == "join":
                    # Broadcast peer joined
                    pass

                elif msg_type in ("offer", "answer", "ice-candidate", "mute-state", "output-mode"):
                    # Relay WebRTC signaling directly to peer in the room
                    await manager.broadcast_to_peer(room_id, websocket, data)

                elif msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "payload": {}, "seq": msg.get("seq", 0)}))

                elif msg_type == "end-call":
                    await manager.broadcast_to_peer(room_id, websocket, json.dumps({"type": "end-call", "payload": {}, "seq": 999}))
                    break

            except json.JSONDecodeError:
                continue

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(room_id, websocket)
        await manager.broadcast_to_room(
            room_id,
            json.dumps({"type": "peer-left", "payload": {}, "seq": 999}),
        )
