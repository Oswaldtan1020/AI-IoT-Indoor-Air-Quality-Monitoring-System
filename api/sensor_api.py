# api/sensor_api.py

from flask import Blueprint, request, jsonify
from backend.alert import check_alert, trigger_alerts
from backend.database import get_db

sensor_api = Blueprint('sensor_api', __name__)

@sensor_api.route('/sensor-data', methods=['POST'])
def receive_sensor():
    data = request.json

    alerts = check_alert(data)

    if alerts:
        conn = get_db()
        cursor = conn.cursor()

        for a in alerts:
            cursor.execute("""
            INSERT INTO alerts (parameter, value, message)
            VALUES (?, ?, ?)
            """, (a[0], a[1], a[2]))

        conn.commit()
        conn.close()

        # ✅ FIX HERE
        trigger_alerts(data, alerts)

    return jsonify({
        "status": "ok",
        "alerts": alerts
    })