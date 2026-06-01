from flask import Blueprint, jsonify
from backend.database import get_db

alert_api = Blueprint('alert_api', __name__)

@alert_api.route('/alerts', methods=['GET'])
def get_alerts():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)  # 🔥 important

    cursor.execute("""
        SELECT r.id, rm.name AS room, 'CO2' AS parameter, r.co2 AS value, 'High CO2 level' AS message, r.timestamp
        FROM readings r
        JOIN (
            SELECT room_id, MAX(timestamp) AS latest
            FROM readings
            GROUP BY room_id
        ) latest_data
        ON r.room_id = latest_data.room_id AND r.timestamp = latest_data.latest
        JOIN rooms rm ON r.room_id = rm.id
        WHERE r.co2 > 1000

        UNION ALL

        SELECT r.id, rm.name, 'PM2.5', r.pm25, 'High PM2.5 level', r.timestamp
        FROM readings r
        JOIN (
            SELECT room_id, MAX(timestamp) AS latest
            FROM readings
            GROUP BY room_id
        ) latest_data
        ON r.room_id = latest_data.room_id AND r.timestamp = latest_data.latest
        JOIN rooms rm ON r.room_id = rm.id
        WHERE r.pm25 > 35

        UNION ALL

        SELECT r.id, rm.name, 'Temperature', r.temperature, 'Abnormal temperature', r.timestamp
        FROM readings r
        JOIN (
            SELECT room_id, MAX(timestamp) AS latest
            FROM readings
            GROUP BY room_id
        ) latest_data
        ON r.room_id = latest_data.room_id AND r.timestamp = latest_data.latest
        JOIN rooms rm ON r.room_id = rm.id
        WHERE r.temperature > 28 OR r.temperature < 18

        UNION ALL

        SELECT r.id, rm.name, 'Humidity', r.humidity, 'Abnormal humidity', r.timestamp
        FROM readings r
        JOIN (
            SELECT room_id, MAX(timestamp) AS latest
            FROM readings
            GROUP BY room_id
        ) latest_data
        ON r.room_id = latest_data.room_id AND r.timestamp = latest_data.latest
        JOIN rooms rm ON r.room_id = rm.id
        WHERE r.humidity > 70 OR r.humidity < 30

        ORDER BY timestamp DESC
        LIMIT 20
    """)

    rows = cursor.fetchall()
    conn.close()

    return jsonify(rows)