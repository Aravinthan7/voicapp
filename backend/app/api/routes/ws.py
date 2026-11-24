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


async def _reset_status_after_delay(room_id: str, delay: float = 2.5):
    await asyncio.sleep(delay)
    await manager.broadcast_to_room(
        room_id,
        json.dumps({
            "type": "translation-status",
            "payload": {"state": "idle"},
            "seq": 0,
        }),
    )


class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}
        self.user_meta: Dict[WebSocket, dict] = {}

    async def connect(self, room_id: str, websocket: WebSocket, user_info: dict) -> bool:
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []

        # 1. Clean up stale/duplicate connections for the same user (reconnects or React StrictMode)
        user_id = user_info.get("userId")
        if user_id:
            stale_conns = [
                conn for conn in self.active_rooms[room_id]
                if self.user_meta.get(conn, {}).get("userId") == user_id
            ]
            for stale in stale_conns:
                self.active_rooms[room_id].remove(stale)
                if stale in self.user_meta:
                    del self.user_meta[stale]
                try:
                    await stale.close(code=1000)
                except Exception:
                    pass

        # 2. Strict One-to-One: Reject 3rd distinct participant
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

        # Inform existing peer in room about the newcomer, AND inform newcomer about existing peer
        for peer in self.active_rooms[room_id]:
            if peer != websocket:
                # To existing peer
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
                # To newcomer
                peer_info = self.user_meta.get(peer, {})
                await websocket.send_text(
                    json.dumps({
                        "type": "peer-joined",
                        "payload": {
                            "displayName": peer_info.get("displayName", "Peer"),
                            "speakingLanguage": peer_info.get("speakingLanguage", "ta-IN"),
                            "listeningLanguage": peer_info.get("listeningLanguage", "ml-IN"),
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
    user_id = decode_access_token(token)
    user_info = {
        "userId": user_id or f"anon_{id(websocket)}",
        "displayName": "Participant",
        "speakingLanguage": "ml-IN",
        "listeningLanguage": "ta-IN",
    }

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

                elif msg_type == "language-update":
                    speaking = payload.get("speakingLanguage")
                    listening = payload.get("listeningLanguage")
                    if speaking:
                        user_info["speakingLanguage"] = speaking
                    if listening:
                        user_info["listeningLanguage"] = listening
                    manager.user_meta[websocket] = user_info
                    await manager.broadcast_to_peer(
                        room_id,
                        websocket,
                        json.dumps({
                            "type": "peer-language-updated",
                            "payload": {
                                "speakingLanguage": user_info.get("speakingLanguage"),
                                "listeningLanguage": user_info.get("listeningLanguage"),
                            },
                            "seq": msg.get("seq", 0),
                        }),
                    )

                elif msg_type == "speech-utterance":
                    text = payload.get("text", "").strip()
                    if not text:
                        continue

                    # 1. Update room status to translating
                    await manager.broadcast_to_room(
                        room_id,
                        json.dumps({
                            "type": "translation-status",
                            "payload": {"state": "translating"},
                            "seq": msg.get("seq", 0),
                        }),
                    )

                    peer_meta = manager.get_peer_meta(room_id, websocket)
                    sender_lang = payload.get("speakingLanguage") or user_info.get("speakingLanguage", "ml-IN")
                    # Receiver-driven translation: target is peer's listeningLanguage (or explicit target)
                    target_lang = payload.get("targetLanguage") or (peer_meta.get("listeningLanguage", "ta-IN") if peer_meta else "ta-IN")
                    speaker_name = user_info.get("displayName", "You")
                    cap_id = f"cap_{asyncio.get_event_loop().time()}"

                    is_passthrough = sender_lang == target_lang
                    if is_passthrough:
                        translated_text = text
                    else:
                        translated_text = await translator.translate(text, sender_lang, target_lang)

                    # Send confirmation caption to the speaker
                    await websocket.send_text(
                        json.dumps({
                            "type": "caption",
                            "payload": {
                                "id": cap_id,
                                "speakerId": user_info.get("userId"),
                                "speakerName": speaker_name,
                                "originalText": text,
                                "translatedText": translated_text if not is_passthrough else text,
                                "originalLanguage": sender_lang,
                                "targetLanguage": target_lang,
                                "isFinal": True,
                                "isSelf": True,
                                "isPassthrough": is_passthrough,
                            },
                            "seq": msg.get("seq", 0),
                        })
                    )

                    # Send translated caption to the peer receiver
                    await manager.broadcast_to_peer(
                        room_id,
                        websocket,
                        json.dumps({
                            "type": "caption",
                            "payload": {
                                "id": cap_id,
                                "speakerId": user_info.get("userId"),
                                "speakerName": speaker_name,
                                "originalText": text,
                                "translatedText": translated_text,
                                "originalLanguage": sender_lang,
                                "targetLanguage": target_lang,
                                "isFinal": True,
                                "isSelf": False,
                                "isPassthrough": is_passthrough,
                            },
                            "seq": msg.get("seq", 0),
                        }),
                    )

                    # Update status to speaking, then idle
                    await manager.broadcast_to_room(
                        room_id,
                        json.dumps({
                            "type": "translation-status",
                            "payload": {"state": "speaking"},
                            "seq": msg.get("seq", 0),
                        }),
                    )
                    asyncio.create_task(_reset_status_after_delay(room_id, 2.5))

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
