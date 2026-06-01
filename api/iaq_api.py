from flask import Blueprint, jsonify
from backend.database import get_db

iaq_api = Blueprint('iaq_api', __name__)

@iaq_api.route('/iaq-live', methods=['GET'])
def get_live_data():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM readings
        ORDER BY timestamp DESC
        LIMIT 5
    """)

    data = cursor.fetchall()
    conn.close()

    return jsonify(data)