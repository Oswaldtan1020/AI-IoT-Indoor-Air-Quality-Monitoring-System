<?php

// Database connection
$conn = new mysqli("localhost", "root", "", "iaq_admin");

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if all values exist
if (
    isset($_GET['room_id']) &&
    isset($_GET['temperature']) &&
    isset($_GET['humidity']) &&
    isset($_GET['co2']) &&
    isset($_GET['pm25'])
) {

    // Receive data
    $room_id = $_GET['room_id'];
    $temperature = $_GET['temperature'];
    $humidity = $_GET['humidity'];
    $co2 = $_GET['co2'];
    $pm25 = $_GET['pm25'];

    // SQL query
    $sql = "INSERT INTO readings
    (room_id, temperature, humidity, co2, pm25)
    VALUES
    ('$room_id', '$temperature', '$humidity', '$co2', '$pm25')";

    // Execute query
    if ($conn->query($sql) === TRUE) {

        echo "Data inserted successfully";

    } else {

        echo "Insert failed: " . $conn->error;
    }

} else {

    echo "Missing parameters";
}

// Close connection
$conn->close();

?>