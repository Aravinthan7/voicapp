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
