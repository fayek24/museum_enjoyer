<?php
header('Content-Type: application/json');
require_once 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Δεν είστε συνδεδεμένος."]);
    exit();
}

$userId = $_SESSION['user_id'];
$stmt = $conn->prepare("SELECT museum_title AS museum, visit_date AS date, ticket_type AS type, quantity AS qty, total_price AS totalPrice FROM tickets WHERE user_id = ? ORDER BY visit_date DESC");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$tickets = [];
while ($row = $result->fetch_assoc()) {
    $tickets[] = $row;
}

echo json_encode(["status" => "success", "tickets" => $tickets]);
?>