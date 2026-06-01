from backend.database import get_db

conn = get_db()
cursor = conn.cursor()

cursor.execute("SELECT * FROM readings")
rows = cursor.fetchall()

for row in rows:
    room_id = row[1]
    temp = row[2]
    hum = row[3]
    co2 = row[4]
    pm25 = row[5]

    # Check conditions
    if co2 > 1000:
        cursor.execute("""
        INSERT INTO alerts (parameter, value, message)
        VALUES (?, ?, ?)
        """, ("CO2", co2, "High CO2 level"))

    if pm25 > 35:
        cursor.execute("""
        INSERT INTO alerts (parameter, value, message)
        VALUES (?, ?, ?)
        """, ("PM2.5", pm25, "High PM2.5 level"))

    if temp > 28 or temp < 18:
        cursor.execute("""
        INSERT INTO alerts (parameter, value, message)
        VALUES (?, ?, ?)
        """, ("Temperature", temp, "Abnormal temperature"))

    if hum > 70 or hum < 30:
        cursor.execute("""
        INSERT INTO alerts (parameter, value, message)
        VALUES (?, ?, ?)
        """, ("Humidity", hum, "Abnormal humidity"))

conn.commit()
conn.close()

print("✅ Alerts generated successfully!")