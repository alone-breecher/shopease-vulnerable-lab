-- ShopEase Database Schema

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('user','admin') DEFAULT 'user',
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200),
  description TEXT,
  price DECIMAL(10,2),
  stock INT,
  category VARCHAR(100),
  image_url VARCHAR(255)
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  total DECIMAL(10,2),
  status VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  price DECIMAL(10,2)
);

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  subject VARCHAR(200),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discount_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50),
  discount_percent INT,
  created_by INT
);

-- Seed Users (plain text passwords)
INSERT INTO users (name, email, password, role, phone, address) VALUES
('Admin User', 'admin@shopease.in', 'admin123', 'admin', '9876543210', '123 Admin Street, Mumbai, Maharashtra 400001'),
('Rajesh Kumar', 'rajesh@gmail.com', 'password123', 'user', '9123456789', '45 MG Road, Bangalore, Karnataka 560001'),
('Priya Sharma', 'priya.sharma@yahoo.com', 'user1234', 'user', '9234567890', '78 Park Street, Kolkata, West Bengal 700016'),
('Amit Patel', 'amit.patel@outlook.com', 'test@123', 'user', '9345678901', '12 Civil Lines, Delhi 110054'),
('Sneha Reddy', 'sneha.reddy@gmail.com', 'mypass456', 'user', '9456789012', '23 Hitech City, Hyderabad, Telangana 500081'),
('Vikram Singh', 'vikram.singh@hotmail.com', '12345678', 'user', '9567890123', '56 Marine Drive, Mumbai, Maharashtra 400002');

-- Seed Products
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('Apple iPhone 15 Pro Max', 'Latest flagship smartphone with A17 Pro chip, 256GB storage, Titanium design', 159900.00, 25, 'Smartphones', '/images/iphone15.jpg'),
('Samsung Galaxy S24 Ultra', '200MP camera, Snapdragon 8 Gen 3, 12GB RAM, 256GB storage', 134999.00, 30, 'Smartphones', '/images/galaxy-s24.jpg'),
('OnePlus 12', '5G smartphone with 16GB RAM, Hasselblad camera, 120Hz display', 64999.00, 40, 'Smartphones', '/images/oneplus12.jpg'),
('MacBook Air M3', '13-inch Retina display, Apple M3 chip, 8GB RAM, 256GB SSD', 114900.00, 15, 'Laptops', '/images/macbook-air.jpg'),
('Dell XPS 13', '13.4-inch FHD+, Intel i7 13th Gen, 16GB RAM, 512GB SSD', 119990.00, 20, 'Laptops', '/images/dell-xps13.jpg'),
('HP Pavilion Gaming', '15.6-inch FHD, AMD Ryzen 5, 8GB RAM, RTX 3050, 512GB SSD', 64990.00, 18, 'Laptops', '/images/hp-pavilion.jpg'),
('Lenovo ThinkPad E14', 'Business laptop, Intel i5 12th Gen, 8GB RAM, 256GB SSD', 54990.00, 22, 'Laptops', '/images/lenovo-thinkpad.jpg'),
('boAt Airdopes 141', 'True wireless earbuds, 42H playback, ASAP Charge, IPX4', 1299.00, 150, 'Audio', '/images/boat-airdopes.jpg'),
('Sony WH-1000XM5', 'Premium noise cancelling headphones, 30H battery, Hi-Res Audio', 29990.00, 35, 'Audio', '/images/sony-xm5.jpg'),
('JBL Flip 6', 'Portable Bluetooth speaker, IP67 waterproof, 12H playtime', 9999.00, 60, 'Audio', '/images/jbl-flip6.jpg'),
('Apple AirPods Pro 2', 'Active noise cancellation, spatial audio, USB-C charging', 24900.00, 45, 'Audio', '/images/airpods-pro.jpg'),
('Samsung 43 inch 4K Smart TV', 'Crystal 4K UHD, HDR, Tizen OS, 3 HDMI ports', 32990.00, 12, 'Electronics', '/images/samsung-tv.jpg'),
('LG 55 inch OLED TV', '4K OLED evo, α9 Gen6 AI Processor, Dolby Vision IQ', 139990.00, 8, 'Electronics', '/images/lg-oled.jpg'),
('Mi Smart Band 7', 'Fitness tracker, 1.62 AMOLED display, 14 days battery', 2799.00, 200, 'Wearables', '/images/mi-band7.jpg'),
('Apple Watch Series 9', 'GPS + Cellular, Always-on Retina display, Health monitoring', 49900.00, 28, 'Wearables', '/images/apple-watch9.jpg'),
('Fitbit Charge 6', 'Advanced fitness tracker, heart rate monitor, GPS', 13999.00, 50, 'Wearables', '/images/fitbit-charge6.jpg'),
('Canon EOS 1500D DSLR', '24.1MP, WiFi, Full HD video, 18-55mm lens kit', 36999.00, 14, 'Cameras', '/images/canon-1500d.jpg'),
('GoPro Hero 12 Black', '5.3K60 video, HyperSmooth 6.0, waterproof to 10m', 44990.00, 20, 'Cameras', '/images/gopro-hero12.jpg'),
('Sony PlayStation 5', 'Gaming console, 825GB SSD, 4K gaming, DualSense controller', 54990.00, 10, 'Gaming', '/images/ps5.jpg'),
('Logitech G502 Hero', 'Gaming mouse, 25K DPI sensor, 11 programmable buttons', 4995.00, 80, 'Gaming', '/images/logitech-g502.jpg');

-- Seed Orders
INSERT INTO orders (user_id, total, status, address, created_at) VALUES
(2, 159900.00, 'Delivered', '45 MG Road, Bangalore, Karnataka 560001', '2024-05-15 10:30:00'),
(3, 24900.00, 'Shipped', '78 Park Street, Kolkata, West Bengal 700016', '2024-05-20 14:45:00'),
(4, 114900.00, 'Processing', '12 Civil Lines, Delhi 110054', '2024-06-01 09:15:00'),
(2, 11298.00, 'Delivered', '45 MG Road, Bangalore, Karnataka 560001', '2024-06-05 16:20:00'),
(5, 64999.00, 'Delivered', '23 Hitech City, Hyderabad, Telangana 500081', '2024-06-10 11:00:00'),
(6, 32990.00, 'Shipped', '56 Marine Drive, Mumbai, Maharashtra 400002', '2024-06-12 13:30:00'),
(3, 139990.00, 'Processing', '78 Park Street, Kolkata, West Bengal 700016', '2024-06-15 10:00:00'),
(4, 8994.00, 'Delivered', '12 Civil Lines, Delhi 110054', '2024-06-18 15:45:00'),
(5, 54990.00, 'Shipped', '23 Hitech City, Hyderabad, Telangana 500081', '2024-06-20 12:00:00'),
(2, 36999.00, 'Processing', '45 MG Road, Bangalore, Karnataka 560001', '2024-06-22 09:30:00');

-- Seed Order Items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 159900.00),
(2, 11, 1, 24900.00),
(3, 4, 1, 114900.00),
(4, 8, 2, 1299.00),
(4, 14, 3, 2799.00),
(5, 3, 1, 64999.00),
(6, 12, 1, 32990.00),
(7, 13, 1, 139990.00),
(8, 10, 1, 9999.00),
(9, 18, 1, 54990.00),
(10, 17, 1, 36999.00);

-- Seed Discount Codes
INSERT INTO discount_codes (code, discount_percent, created_by) VALUES
('WELCOME10', 10, 1),
('ADMIN50', 50, 1),
('SUMMER25', 25, 1);
