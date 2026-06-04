from flask import Flask
from flask_cors import CORS

from api.sensor_api import sensor_api
from api.alert_api import alert_api
from api.readings_api import readings_api
from api.insert_api import insert_api

app = Flask(__name__)
CORS(app)

# ✅ USE SAME PREFIX FOR ALL
app.register_blueprint(sensor_api, url_prefix="/api")
app.register_blueprint(alert_api, url_prefix="/api")
app.register_blueprint(readings_api, url_prefix="/api")
app.register_blueprint(insert_api, url_prefix="/api")

# 🔥 DEBUG ROUTES
print(app.url_map)

import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )