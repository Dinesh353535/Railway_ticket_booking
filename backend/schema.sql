
CREATE DATABASE IF NOT EXISTS railway_booking
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE railway_booking;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('passenger', 'admin') NOT NULL DEFAULT 'passenger',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- 2. TRAINS TABLE
CREATE TABLE IF NOT EXISTS trains (
    train_id INT NOT NULL AUTO_INCREMENT,
    train_number VARCHAR(20) NOT NULL,
    train_name VARCHAR(150) NOT NULL,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration VARCHAR(50) DEFAULT NULL,
    running_days VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    journey_date DATE NOT NULL,
    total_seats INT NOT NULL DEFAULT 0,
    base_fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (train_id),
    UNIQUE KEY uq_train_date (train_number, journey_date),
    KEY idx_train_route (source, destination)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- 3. TRAIN CLASSES TABLE
CREATE TABLE IF NOT EXISTS train_classes (
    class_id INT NOT NULL AUTO_INCREMENT,
    train_id INT NOT NULL,
    class_code VARCHAR(10) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    total_seats INT NOT NULL DEFAULT 0,
    fare DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (class_id),
    UNIQUE KEY uq_train_class (train_id, class_code),
    CONSTRAINT fk_train_classes_train
        FOREIGN KEY (train_id)
        REFERENCES trains (train_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT NOT NULL AUTO_INCREMENT,
    pnr VARCHAR(20) NOT NULL,
    user_id INT NOT NULL,
    train_id INT NOT NULL,
    class_id INT NOT NULL,
    journey_date DATE NOT NULL,
    passenger_count INT NOT NULL,
    total_fare DECIMAL(10,2) NOT NULL,
    booking_status ENUM('CONFIRMED', 'CANCELLED')
        NOT NULL DEFAULT 'CONFIRMED',
    booked_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_id),
    UNIQUE KEY uq_bookings_pnr (pnr),
    KEY idx_bookings_train (train_id),
    KEY idx_bookings_class (class_id),
    KEY idx_booking_user_date (user_id, journey_date),
    CONSTRAINT fk_bookings_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id),
    CONSTRAINT fk_bookings_train
        FOREIGN KEY (train_id)
        REFERENCES trains (train_id),
    CONSTRAINT fk_bookings_class
        FOREIGN KEY (class_id)
        REFERENCES train_classes (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- 5. PASSENGERS TABLE
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id INT NOT NULL AUTO_INCREMENT,
    booking_id INT NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) DEFAULT NULL,
    seat_number VARCHAR(20) DEFAULT NULL,
    PRIMARY KEY (passenger_id),
    KEY idx_passengers_booking (booking_id),
    CONSTRAINT fk_passengers_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings (booking_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
