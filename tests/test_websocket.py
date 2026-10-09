def test_websocket_connection_and_ping(client):
    with client.websocket_connect("/api/v1/ws") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_text()
        assert data == "pong"
