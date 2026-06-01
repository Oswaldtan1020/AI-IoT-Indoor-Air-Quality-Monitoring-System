import time
import random
import mysql.connector

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="iaq_admin"
)

cursor = db.cursor()

# Simulated rooms only
rooms = [2, 3, 4, 5]

while True:

    for room in rooms:

        # Default normal values
        temperature = round(random.uniform(24, 30), 1)
        humidity = random.randint(45, 70)
        co2 = random.randint(500, 900)
        pm25 = round(random.uniform(5, 20), 1)

        # Different room scenarios
        if room == 2:
            # High CO2 room
            co2 = random.randint(1200, 1800)

        elif room == 3:
            # Dusty room
            pm25 = round(random.uniform(35, 60), 1)

        elif room == 4:
            # Hot room
            temperature = round(random.uniform(30, 35), 1)

        elif room == 5:
            # Humid room
            humidity = random.randint(75, 95)

        cursor.execute("""
            INSERT INTO readings
            (room_id, temperature, humidity, co2, pm25, timestamp)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (room, temperature, humidity, co2, pm25))

    db.commit()

    print("✅ Simulation data inserted")

    time.sleep(30)