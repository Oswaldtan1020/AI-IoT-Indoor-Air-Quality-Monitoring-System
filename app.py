from flask import Flask
from flask_cors import CORS

from api.sensor_api import sensor_api
from api.alert_api import alert_api
from api.readings_api import readings_api

app = Flask(__name__)
CORS(app)

# ✅ USE SAME PREFIX FOR ALL
app.register_blueprint(sensor_api, url_prefix="/api")
app.register_blueprint(alert_api, url_prefix="/api")
app.register_blueprint(readings_api, url_prefix="/api")

# 🔥 DEBUG ROUTES
print(app.url_map)

if __name__ == '__main__':
    app.run(debug=True)