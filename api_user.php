<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

if (isset($_SESSION['username'])) {
    echo json_encode([
        "loggedIn" => true,
        "username" => $_SESSION['username']
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "loggedIn" => false
    ], JSON_UNESCAPED_UNICODE);
}
?>