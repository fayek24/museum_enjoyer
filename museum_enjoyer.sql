CREATE DATABASE IF NOT EXISTS museum_enjoyer DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE museum_enjoyer;

-- Πίνακας Χρηστών --
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Πίνακας Εισιτηρίων --
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    museum_title VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    ticket_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
