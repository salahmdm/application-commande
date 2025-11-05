-- ================================================================
-- TABLE: news
-- Actualités et événements pour la page d'accueil
-- ================================================================
CREATE TABLE IF NOT EXISTS news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date VARCHAR(100),
    image_url VARCHAR(500),
    icon VARCHAR(10) DEFAULT '🍃',
    gradient VARCHAR(100) DEFAULT 'from-emerald-400 via-teal-500 to-cyan-600',
    bg_pattern VARCHAR(255),
    `order` INT DEFAULT 0 COMMENT 'Ordre d\'affichage',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order (`order`),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
