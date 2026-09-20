<?php
// Ρύθμιση για να επιστρέφει JSON σε σφάλματα σύνδεσης
header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$db_user = "root";
$db_pass = ""; 
$db_name = "museum_enjoyer";

// Ενεργοποίηση αναφοράς σφαλμάτων mysqli
mysqli_report(MYSQLI_REPORT_OFF);

$conn = @new mysqli($host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Σφάλμα Σύνδεσης στη Βάση Δεδομένων: " . $conn->connect_error,
        "code" => $conn->connect_errno
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$conn->set_charset("utf8mb4");
?>