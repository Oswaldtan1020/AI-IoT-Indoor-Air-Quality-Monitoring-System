from flask import Blueprint, request, jsonify
from backend.database import get_db

insert_api = Blueprint("insert_api", __name__)

@insert_api.route("/insert-reading", methods=["POST"])
def insert_reading():
    try:
        data = request.json

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO readings
            (room_id, temperature, humidity, co2, pm25)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            data["room_id"],
            data["temperature"],
            data["humidity"],
            data["co2"],
            data["pm25"]
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