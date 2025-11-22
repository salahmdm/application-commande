-- Migration: Ajouter un identifiant unique pour chaque client
-- Date: 2024
-- Description: Ajoute un champ client_identifier (11 caractères, mélange lettres et chiffres) pour chaque utilisateur de type client

-- Ajouter la colonne client_identifier
ALTER TABLE users
ADD COLUMN client_identifier VARCHAR(11) NULL UNIQUE AFTER last_name;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX idx_client_identifier ON users(client_identifier);

-- Générer un identifiant pour tous les clients existants qui n'en ont pas
-- Note: Cette partie sera gérée par le code Node.js lors de la première connexion ou lors d'une mise à jour

