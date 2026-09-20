<?php
// Καθαρισμός τυχόν προηγούμενων outputs/warnings για να μην χαλάσει το JSON
ob_start();
header('Content-Type: application/json; charset=utf-8');

// Συμπερίληψη του αρχείου σύνδεσης (έλεγξε αν το αρχείο σου λέγεται database.php ή db.php)
if (file_exists('database.php')) {
    require_once 'database.php';
} else if (file_exists('db.php')) {
    require_once 'db.php';
} else {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Δεν βρέθηκε το αρχείο σύνδεσης με τη βάση (database.php/db.php)."]);
    exit();
}

session_start();

if (!isset($_SESSION['user_id'])) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Δεν είστε συνδεδεμένος. Παρακαλώ συνδεθείτε ξανά."]);
    exit();
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Δεν παραλήφθηκαν έγκυρα δεδομένα JSON."]);
    exit();
}

$userId = $_SESSION['user_id'];
$museum = trim($data['museum'] ?? '');
$date = $data['date'] ?? '';
$type = $data['type'] ?? '';
$quantity = intval($data['quantity'] ?? 1);
$totalPrice = floatval($data['totalPrice'] ?? 0);

if (empty($museum) || empty($date) || empty($type) || $quantity <= 0) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Παρακαλώ συμπληρώστε όλα τα στοιχεία του εισιτηρίου."]);
    exit();
}

// Εισαγωγή στη βάση δεδομένων
$stmt = $conn->prepare("INSERT INTO tickets (user_id, museum_title, visit_date, ticket_type, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Σφάλμα SQL Prepare: " . $conn->error]);
    exit();
}

$stmt->bind_param("isssid", $userId, $museum, $date, $type, $quantity, $totalPrice);

if ($stmt->execute()) {
    ob_end_clean();
    echo json_encode(["status" => "success", "message" => "Η αγορά ολοκληρώθηκε επιτυχώς!"]);
} else {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Αποτυχία εγγραφής στη βάση: " . $stmt->error]);
}
?>