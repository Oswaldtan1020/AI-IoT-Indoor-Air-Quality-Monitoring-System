from flask import Blueprint, request, jsonify
from backend.database import get_db
from datetime import datetime, timedelta

insert_api = Blueprint("insert_api", __name__)

@insert_api.route("/insert-reading", methods=["POST"])
def insert_reading():
    try:
        data = request.json

        malaysia_time = datetime.utcnow() + timedelta(hours=8)

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO readings
            (room_id, temperature, humidity, co2, pm25, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data["room_id"],
            data["temperature"],
            data["humidity"],
            data["co2"],
            data["pm25"],
            malaysia_time
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Reading inserted"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500