import uuid
from fastapi.testclient import TestClient
from app.main import app


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "VoiceApp"


def test_languages_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/languages")
        assert response.status_code == 200
        data = response.json()
        langs = {lang["code"]: lang for lang in data["languages"]}
        assert "ml-IN" in langs
        assert "ta-IN" in langs
        assert langs["ml-IN"]["nativeName"] == "മലയാളം"
        assert langs["ta-IN"]["nativeName"] == "தமிழ்"


def test_auth_and_user_flow():
    with TestClient(app) as client:
        # Register user
        reg_payload = {
            "displayName": "Aravinth Test",
            "email": "test.user.unit@example.com",
            "password": "securepassword123",
            "speakingLanguage": "ml-IN",
            "listeningLanguage": "ta-IN",
        }
        reg_res = client.post("/api/v1/auth/register", json=reg_payload)
        if reg_res.status_code == 200:
            token = reg_res.json()["accessToken"]
        else:
            login_res = client.post(
                "/api/v1/auth/login",
                json={"email": "test.user.unit@example.com", "password": "securepassword123"},
            )
            token = login_res.json()["accessToken"]

        headers = {"Authorization": f"Bearer {token}"}

        # Read Me
        me_res = client.get("/api/v1/users/me", headers=headers)
        assert me_res.status_code == 200
        assert "displayName" in me_res.json()

        # Update language preference
        patch_res = client.patch("/api/v1/users/me", json={"displayName": "Aravinth Updated"}, headers=headers)
        assert patch_res.status_code == 200
        assert patch_res.json()["displayName"] == "Aravinth Updated"


def test_call_room_flow():
    with TestClient(app) as client:
        # Login with seed user
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "malayalam.speaker@test.com", "password": "testpass123"},
        )
        token = login_res.json()["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create room
        create_res = client.post(
            "/api/v1/calls",
            json={"primaryLanguage": "ml-IN", "secondaryLanguage": "ta-IN"},
            headers=headers,
        )
        assert create_res.status_code == 200
        room = create_res.json()
        assert room["code"].startswith("VA-")
        assert room["status"] == "waiting"

        # Get room by code
        get_res = client.get(f"/api/v1/calls/{room['code']}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["id"] == room["id"]

        # End call
        end_res = client.post(f"/api/v1/calls/{room['id']}/end", headers=headers)
        assert end_res.status_code == 200
        assert end_res.json()["success"] is True


def test_voice_consent_and_profile_flow():
    with TestClient(app) as client:
        # Login with seed tamil speaker
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "tamil.speaker@test.com", "password": "testpass123"},
        )
        token = login_res.json()["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}

        # Submit consent
        consent_res = client.post(
            "/api/v1/voice-profiles/consent",
            json={"consentTextVersion": "v1.0-test"},
            headers=headers,
        )
        assert consent_res.status_code == 200
        assert consent_res.json()["consentVersion"] == "v1.0-test"

        # Upload sample
        files = {"sample": ("test.webm", b"RIFFsimulated_sample_bytes_1234567890" * 10, "audio/webm")}
        upload_res = client.post("/api/v1/voice-profiles/sample", files=files, headers=headers)
        assert upload_res.status_code == 200
        assert upload_res.json()["status"] == "ready"

        # Delete profile
        del_res = client.delete("/api/v1/voice-profiles/me", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["success"] is True


def test_workspace_and_usage():
    with TestClient(app) as client:
        # Register a unique user
        reg_payload = {
            "displayName": "Workspace Test User",
            "email": "workspace.test@example.com",
            "password": "securepassword123",
            "speakingLanguage": "ml-IN",
            "listeningLanguage": "ta-IN",
        }
        res = client.post("/api/v1/auth/register", json=reg_payload)
        if res.status_code == 200:
            token = res.json()["accessToken"]
        else:
            login_res = client.post(
                "/api/v1/auth/login",
                json={"email": reg_payload["email"], "password": reg_payload["password"]},
            )
            token = login_res.json()["accessToken"]

        headers = {"Authorization": f"Bearer {token}"}

        # Check workspace auto-provisioning
        ws_res = client.get("/api/v1/workspaces/me", headers=headers)
        assert ws_res.status_code == 200
        ws_data = ws_res.json()
        assert ws_data["planType"] == "starter"
        assert ws_data["monthlyMinuteLimit"] == 60

        # Check workspace usage summary
        usage_res = client.get("/api/v1/workspaces/me/usage", headers=headers)
        assert usage_res.status_code == 200
        usage_data = usage_res.json()
        assert usage_data["monthlyMinuteLimit"] == 60
        assert usage_data["minutesRemaining"] <= 60
        assert "totalMinutesUsed" in usage_data


def test_dynamic_language_registration():
    with TestClient(app) as client:
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "malayalam.speaker@test.com", "password": "testpass123"},
        )
        token = login_res.json()["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}

        # Register a new language dynamically with unique code for idempotency
        test_code = f"te-{uuid.uuid4().hex[:4]}"
        new_lang_payload = {
            "code": test_code,
            "name": f"Language {test_code}",
            "nativeName": "తెలుగు",
            "flag": "🇮🇳",
            "sttSupported": True,
            "translationSupported": True,
            "ttsSupported": True,
            "voiceCloningSupported": False,
        }
        add_lang_res = client.post("/api/v1/languages", json=new_lang_payload, headers=headers)
        assert add_lang_res.status_code == 200
        assert add_lang_res.json()["code"] == test_code

        # Register a language pair dynamically
        pair_payload = {
            "sourceLanguage": test_code,
            "targetLanguage": "ta-IN",
        }
        add_pair_res = client.post("/api/v1/languages/pairs", json=pair_payload, headers=headers)
        assert add_pair_res.status_code == 200
        assert add_pair_res.json()["sourceLanguage"] == test_code

        # Verify dynamic availability in language list
        list_res = client.get("/api/v1/languages")
        assert list_res.status_code == 200
        data = list_res.json()
        codes = [l["code"] for l in data["languages"]]
        assert test_code in codes


def test_strict_one_to_one_call_rejection():
    with TestClient(app) as client:
        # Helper to register or login a user
        def get_user_token(name: str, email: str):
            res = client.post(
                "/api/v1/auth/register",
                json={
                    "displayName": name,
                    "email": email,
                    "password": "password123",
                    "speakingLanguage": "ml-IN",
                    "listeningLanguage": "ta-IN",
                },
            )
            if res.status_code == 200:
                return res.json()["accessToken"]
            login_res = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "password123"},
            )
            return login_res.json()["accessToken"]

        token1 = get_user_token("User One", "user1.call@example.com")
        token2 = get_user_token("User Two", "user2.call@example.com")
        token3 = get_user_token("User Three", "user3.call@example.com")

        # User 1 creates room (becomes Participant #1)
        create_res = client.post(
            "/api/v1/calls",
            json={"primaryLanguage": "ml-IN", "secondaryLanguage": "ta-IN"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        assert create_res.status_code == 200
        room_code = create_res.json()["code"]

        # User 2 joins room (becomes Participant #2 -> call is now full at exactly 2)
        join2_res = client.post(
            "/api/v1/calls/join",
            json={"codeOrId": room_code},
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert join2_res.status_code == 200

        # User 3 attempts to join -> MUST BE REJECTED with 403 CALL_FULL
        join3_res = client.post(
            "/api/v1/calls/join",
            json={"codeOrId": room_code},
            headers={"Authorization": f"Bearer {token3}"},
        )
        assert join3_res.status_code == 403
        data = join3_res.json()
        assert data["error"]["code"] == "CALL_FULL"
        assert "strictly one-to-one" in data["error"]["message"]


def test_unsupported_language_pair_rejection():
    with TestClient(app) as client:
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "malayalam.speaker@test.com", "password": "testpass123"},
        )
        token = login_res.json()["accessToken"]
        headers = {"Authorization": f"Bearer {token}"}

        # Attempt to create room with unsupported language pair
        create_res = client.post(
            "/api/v1/calls",
            json={"primaryLanguage": "fr-FR", "secondaryLanguage": "de-DE"},
            headers=headers,
        )
        assert create_res.status_code == 400
        data = create_res.json()
        assert data["error"]["code"] == "UNSUPPORTED_LANGUAGE_PAIR"

