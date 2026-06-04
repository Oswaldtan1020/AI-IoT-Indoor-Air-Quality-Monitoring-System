import time
import random
import requests

API_URL = "https://ai-iot-indoor-air-quality-monitoring.onrender.com/api/insert-reading"

# Simulated rooms
rooms = [2, 3, 4, 5, 8]

while True:

    for room in rooms:

        # Normal values
        temperature = round(random.uniform(24, 30), 1)
        humidity = random.randint(45, 70)
        co2 = random.randint(500, 900)
        pm25 = round(random.uniform(5, 20), 1)

        # Room scenarios
        if room == 2:
            # High CO2
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

        payload = {
            "room_id": room,
            "temperature": temperature,
            "humidity": humidity,
            "co2": co2,
            "pm25": pm25
        }

        try:

            response = requests.post(
                API_URL,
                json=payload,
                timeout=30
            )

            print("\n=================================")
            print("Room:", room)
            print("Payload:", payload)
            print("HTTP:", response.status_code)
            print("Response:", response.text)
            print("=================================")

        except Exception as e:

            print("\n❌ Failed to send data")
            print("Room:", room)
            print("Error:", e)

    print("\n✅ Simulation cycle completed")
    print("Waiting 30 seconds...\n")

    time.sleep(30)