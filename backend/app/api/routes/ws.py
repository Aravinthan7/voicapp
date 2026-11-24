import json
import asyncio
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.security import decode_access_token
from app.speech.simulator import SimulatedTranslator
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.call import CallRoom, CallParticipant
from sqlalchemy import select

router = APIRouter(tags=["websocket"])
translator = SimulatedTranslator()


class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        self.user_meta: Dict[WebSocket, dict] = {}

    async def connect(self, room_id: str, websocket: WebSocket, user_info: dict) -> bool:
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []

        # Strict One-to-One: Reject 3rd participant
        if len(self.active_rooms[room_id]) >= 2:
            await websocket.send_text(
                json.dumps({
                    "type": "error",
                    "payload": {
                        "code": "CALL_FULL",
                        "message": "VoiceApp Phase 1 is strictly one-to-one (maximum 2 participants). This room is full.",
                    },
                    "seq": 0,
                })
            )
            await websocket.close(code=1008)
            return False

        self.active_rooms[room_id].append(websocket)
        self.user_meta[websocket] = user_info

        # Inform existing peer in room about the newly joined participant
        for peer in self.active_rooms[room_id]:
            if peer != websocket:
                await peer.send_text(
                    json.dumps({
                        "type": "peer-joined",
                        "payload": {
                            "displayName": user_info.get("displayName", "Peer"),
                            "speakingLanguage": user_info.get("speakingLanguage", "ta-IN"),
                            "listeningLanguage": user_info.get("listeningLanguage", "ml-IN"),
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

    def get_peer_meta(self, room_id: str, sender: WebSocket) -> Optional[dict]:
        if room_id in self.active_rooms:
            for conn in self.active_rooms[room_id]:
                if conn != sender:
                    return self.user_meta.get(conn)
        return None


manager = ConnectionManager()


@router.websocket("/ws/calls/{room_id}")
async def websocket_call_endpoint(websocket: WebSocket, room_id: str, token: str = "guest"):
    # Resolve user details from token if authenticated
    user_info = {
        "displayName": "Participant",
        "speakingLanguage": "ml-IN",
        "listeningLanguage": "ta-IN",
    }

    user_id = decode_access_token(token)
    if user_id:
        async with AsyncSessionLocal() as db:
            stmt = select(User).where(User.id == user_id)
            user = (await db.execute(stmt)).scalar_one_or_none()
            if user:
                user_info["displayName"] = user.display_name
                user_info["speakingLanguage"] = user.speaking_language
                user_info["listeningLanguage"] = user.listening_language

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
                    # Send back current peer info if peer is already in room
                    peer_meta = manager.get_peer_meta(room_id, websocket)
                    if peer_meta:
                        await websocket.send_text(
                            json.dumps({
                                "type": "peer-joined",
                                "payload": {
                                    "displayName": peer_meta.get("displayName", "Peer"),
                                    "speakingLanguage": peer_meta.get("speakingLanguage", "ta-IN"),
                                    "listeningLanguage": peer_meta.get("listeningLanguage", "ml-IN"),
                                },
                                "seq": 1,
                            })
                        )

                elif msg_type in ("offer", "answer", "ice-candidate", "mute-state", "output-mode"):
                    # Relay WebRTC signaling directly to peer
                    await manager.broadcast_to_peer(room_id, websocket, data)

                elif msg_type == "speech-utterance":
                    # Simulated speech processing driven by receiver's listening language
                    text = payload.get("text", "")
                    sender_lang = user_info.get("speakingLanguage", "ml-IN")
                    peer_meta = manager.get_peer_meta(room_id, websocket)

                    # The receiver always decides what they hear!
                    target_lang = peer_meta.get("listeningLanguage", "ta-IN") if peer_meta else "ta-IN"

                    # Same-language passthrough check
                    if sender_lang == target_lang:
                        # Original audio delivery without translation
                        await manager.broadcast_to_peer(
                            room_id,
                            websocket,
                            json.dumps({
                                "type": "caption",
                                "payload": {
                                    "id": f"cap_{asyncio.get_event_loop().time()}",
                                    "speakerName": user_info.get("displayName", "Peer"),
                                    "originalText": text,
                                    "translatedText": text,
                                    "originalLanguage": sender_lang,
                                    "targetLanguage": target_lang,
                                    "isFinal": True,
                                    "isPassthrough": True,
                                },
                                "seq": msg.get("seq", 0),
                            }),
                        )
                    else:
                        translated_text = await translator.translate(text, sender_lang, target_lang)
                        await manager.broadcast_to_peer(
                            room_id,
                            websocket,
                            json.dumps({
                                "type": "caption",
                                "payload": {
                                    "id": f"cap_{asyncio.get_event_loop().time()}",
                                    "speakerName": user_info.get("displayName", "Peer"),
                                    "originalText": text,
                                    "translatedText": translated_text,
                                    "originalLanguage": sender_lang,
                                    "targetLanguage": target_lang,
                                    "isFinal": True,
                                    "isPassthrough": False,
                                },
                                "seq": msg.get("seq", 0),
                            }),
                        )

                elif msg_type == "ping":
                    await websocket.send_text(
                        json.dumps({"type": "pong", "payload": {}, "seq": msg.get("seq", 0)})
                    )

                elif msg_type == "end-call":
                    await manager.broadcast_to_peer(
                        room_id, websocket, json.dumps({"type": "end-call", "payload": {}, "seq": 999})
                    )
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
