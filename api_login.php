<?php
header('Content-Type: application/json; charset=utf-8');

// Συμπερίληψη της σύνδεσης
require_once 'db.php'; 

session_start();

// Λήψη των JSON δεδομένων από το αίτημα (fetch)
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data) {
    echo json_encode([
        "status" => "error",
        "message" => "Δεν παραλήφθηκαν έγκυρα δεδομένα JSON από το frontend."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

// Έλεγχος αν συμπληρώθηκαν τα πεδία
if (empty($username) || empty($password)) {
    echo json_encode([
        "status" => "error",
        "message" => "Παρακαλώ συμπληρώστε όνομα χρήστη και κωδικό πρόσβασης."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (strlen($password) < 8) {
    echo json_encode([
        "status" => "error",
        "message" => "Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 8 χαρακτήρες."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 1. Αναζήτηση χρήστη στη βάση
$stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");

if (!$stmt) {
    echo json_encode([
        "status" => "error",
        "message" => "Σφάλμα SQL (Prepare): " . $conn->error
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$stmt->bind_param("s", $username);

if (!$stmt->execute()) {
    echo json_encode([
        "status" => "error",
        "message" => "Σφάλμα κατά την εκτέλεση του ερωτήματος: " . $stmt->error
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    // Ο χρήστης υπάρχει -> Έλεγχος κωδικού
    if (password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;

        echo json_encode([
            "status" => "success",
            "message" => "Επιτυχής σύνδεση! Καλώς ήρθατε, " . $username,
            "username" => $username
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Λάθος κωδικός πρόσβασης για τον χρήστη '" . $username . "'."
        ], JSON_UNESCAPED_UNICODE);
    }
} else {
    // Νέος χρήστης -> Αυτόματη Εγγραφή
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $stmt_insert = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    
    if (!$stmt_insert) {
        echo json_encode([
            "status" => "error",
            "message" => "Σφάλμα SQL κατά την εγγραφή (Prepare): " . $conn->error
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $stmt_insert->bind_param("ss", $username, $hashedPassword);
    
    if ($stmt_insert->execute()) {
        $_SESSION['user_id'] = $stmt_insert->insert_id;
        $_SESSION['username'] = $username;

        echo json_encode([
            "status" => "success",
            "message" => "Ο λογαριασμός δημιουργήθηκε επιτυχώς! Συνδεθήκατε ως " . $username,
            "username" => $username
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Αποτυχία δημιουργίας χρήστη στη βάση: " . $stmt_insert->error
        ], JSON_UNESCAPED_UNICODE);
    }
}
?>