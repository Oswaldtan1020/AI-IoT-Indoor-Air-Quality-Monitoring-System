from flask import Blueprint, jsonify, request
from backend.database import get_db

readings_api = Blueprint('readings_api', __name__)

@readings_api.route('/readings', methods=['GET'])
def get_readings():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT r.room_id, rooms.name as room_name,
            r.temperature, r.humidity, r.co2, r.pm25, r.timestamp
        FROM readings r
        JOIN (
            SELECT room_id, MAX(id) as latest_id
            FROM readings
            GROUP BY room_id
        ) latest_data
        ON r.id = latest_data.latest_id
        JOIN rooms ON r.room_id = rooms.id
        ORDER BY r.room_id
    """)

    rows = cursor.fetchall()
    conn.close()

    data = []
    for row in rows:
        room_name = row[1]
        temperature = row[2]
        humidity = row[3]
        co2 = row[4]
        pm25 = row[5]
        timestamp = str(row[6])

        # 🔥 AI LOGIC
        status = "GOOD"
        actions = []

        if co2 > 1000:
            status = "WARNING"
            actions.append("Increase ventilation (open windows or doors)")

        if pm25 > 35:
            status = "WARNING"
            actions.append("Use air purifier or reduce dust sources")

        if temperature > 28:
            status = "WARNING"
            actions.append("Lower temperature using air conditioning")

        if humidity > 70:
            status = "WARNING"
            actions.append("Reduce humidity using dehumidifier")

        # 🔴 Optional: DANGEROUS level
        if co2 > 1500 or pm25 > 55:
            status = "DANGEROUS"
        elif co2 > 1000 or pm25 > 35 or temperature > 28 or humidity > 70:
            status = "WARNING"

        data.append({
            "room_name": room_name,
            "temperature": temperature,
            "humidity": humidity,
            "co2": co2,
            "pm25": pm25,
            "timestamp": timestamp,
            "status": status,
            "aiSuggestions": actions
        })

    return jsonify(data)

@readings_api.route('/history', methods=['GET'])
def get_history():
    start = request.args.get('start')
    end = request.args.get('end')
    room = request.args.get('room')

    query = """
        SELECT r.room_id, rm.name as room_name,
               r.temperature, r.humidity, r.co2, r.pm25, r.timestamp
        FROM readings r
        JOIN rooms rm ON r.room_id = rm.id
        WHERE 1=1
    """

    params = []

    if start:
        query += " AND DATE(r.timestamp) >= %s"
        params.append(start)

    if end:
        query += " AND DATE(r.timestamp) <= %s"
        params.append(end)

    if room:
        query += " AND rm.name = %s"
        params.append(room)

    query += " ORDER BY r.timestamp DESC"

    # ✅ USE SAME DB STYLE AS get_readings()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(query, params)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    # ✅ Convert to JSON format (IMPORTANT)
    data = []
    for row in rows:
        data.append({
            "room_name": row[1],
            "temperature": row[2],
            "humidity": row[3],
            "co2": row[4],
            "pm25": row[5],
            "timestamp": str(row[6])
        })

    return jsonify(data)