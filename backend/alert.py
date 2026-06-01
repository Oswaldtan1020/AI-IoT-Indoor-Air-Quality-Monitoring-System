# backend/alert.py

import requests
import smtplib
import time
from email.mime.text import MIMEText

# ==============================
# 🔧 CONFIG (EDIT THIS)
# ==============================

TELEGRAM_TOKEN = "8666155156:AAGIJVpMXUWKCfII9HMSFMd1r0Q2jA1bnl0"
CHAT_ID = "1460208101"

EMAIL = "oswaldtan1020@gmail.com"
EMAIL_PASSWORD = "pussirkuyeiqtqkt"

# Thresholds
THRESHOLDS = {
    "co2": 1000,
    "pm25": 25,
    "temperature_min": 18,
    "temperature_max": 26,
    "humidity_min": 30,
    "humidity_max": 60
}

# Cooldown (seconds)
COOLDOWN = 300  # 5 minutes
last_sent_time = 0


# ==============================
# 🧠 CHECK ALERT CONDITIONS
# ==============================

def check_alert(data):
    alerts = []

    if data["co2"] > THRESHOLDS["co2"]:
        alerts.append(("CO2", data["co2"], "High CO2 level"))

    if data["pm25"] > THRESHOLDS["pm25"]:
        alerts.append(("PM2.5", data["pm25"], "High PM2.5 level"))

    if data["temperature"] < THRESHOLDS["temperature_min"] or data["temperature"] > THRESHOLDS["temperature_max"]:
        alerts.append(("Temperature", data["temperature"], "Abnormal temperature"))

    if data["humidity"] < THRESHOLDS["humidity_min"] or data["humidity"] > THRESHOLDS["humidity_max"]:
        alerts.append(("Humidity", data["humidity"], "Abnormal humidity"))

    return alerts


# ==============================
# 🚨 SEVERITY LEVEL
# ==============================

def get_severity(data):
    if data["pm25"] > 50 or data["co2"] > 1500:
        return "🚨 CRITICAL"
    elif data["pm25"] > 25 or data["co2"] > 1000:
        return "⚠️ WARNING"
    else:
        return "✅ NORMAL"


# ==============================
# ⛔ COOLDOWN CONTROL
# ==============================

def can_send():
    global last_sent_time
    current_time = time.time()

    if current_time - last_sent_time > COOLDOWN:
        last_sent_time = current_time
        return True

    return False


# ==============================
# 📲 TELEGRAM ALERT
# ==============================

def send_telegram(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

    requests.post(url, data={
        "chat_id": CHAT_ID,
        "text": message
    })


# ==============================
# 📧 EMAIL ALERT
# ==============================

def send_email(subject, message):
    msg = MIMEText(message)
    msg['Subject'] = subject
    msg['From'] = EMAIL
    msg['To'] = EMAIL

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL, EMAIL_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print("Email error:", e)


# ==============================
# 🚀 MAIN TRIGGER FUNCTION
# ==============================

def trigger_alerts(data, alerts):
    if not alerts:
        return

    if not can_send():
        return

    severity = get_severity(data)

    message = f"""
{severity} AIR QUALITY ALERT

CO2: {data['co2']} ppm
PM2.5: {data['pm25']} µg/m³
Temperature: {data['temperature']}°C
Humidity: {data['humidity']}%

⚠️ Action Recommended:
- Open windows
- Turn on ventilation
- Reduce occupancy
"""

    # Send notifications
    send_telegram(message)
    send_email("🚨 Air Quality Alert", message)

    print("Alert sent successfully")



if __name__ == "__main__":
    test_data = {
        "co2": 1500,
        "pm25": 60,
        "temperature": 30,
        "humidity": 70
    }

    alerts = check_alert(test_data)
    trigger_alerts(test_data, alerts)