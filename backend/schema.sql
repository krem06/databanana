-- Data Banana Database Schema

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    cognito_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    credits DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    context VARCHAR(80) NOT NULL,
    status VARCHAR(20) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    prompt TEXT,
    url VARCHAR(500),
    tags JSONB,
    selected BOOLEAN DEFAULT false,
    public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimized indexes
CREATE INDEX idx_images_tags ON images USING GIN (tags);
CREATE INDEX idx_images_public_created ON images (public, created_at DESC) WHERE public = true;
CREATE INDEX idx_batches_user_created ON batches (user_id, created_at DESC);
CREATE INDEX idx_users_cognito ON users (cognito_id);
CREATE INDEX idx_images_batch_created ON images (batch_id, created_at);