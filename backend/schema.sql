-- Data Banana Database Schema

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    cognito_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    credits DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datasets are user-named collections of batches (user can rename)
CREATE TABLE datasets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    total_images INTEGER DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches are individual generation runs within a dataset
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    context VARCHAR(80) NOT NULL,
    exclude_tags TEXT,
    image_count INTEGER NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Images belong to a specific batch (no delete, only validate/reject)
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    dataset_id INTEGER REFERENCES datasets(id),
    prompt TEXT,
    url VARCHAR(500),
    tags JSONB,
    validated BOOLEAN DEFAULT false,
    rejected BOOLEAN DEFAULT false,
    public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimized indexes
CREATE INDEX idx_images_tags ON images USING GIN (tags);
CREATE INDEX idx_images_public_created ON images (public, created_at DESC) WHERE public = true;
CREATE INDEX idx_datasets_user_created ON datasets (user_id, created_at DESC);
CREATE INDEX idx_batches_dataset_created ON batches (dataset_id, created_at DESC);
CREATE INDEX idx_batches_user_created ON batches (user_id, created_at DESC);
CREATE INDEX idx_users_cognito ON users (cognito_id);
CREATE INDEX idx_images_batch_created ON images (batch_id, created_at);
CREATE INDEX idx_images_dataset_created ON images (dataset_id, created_at);
CREATE INDEX idx_images_validated ON images (dataset_id, validated) WHERE validated = true;
CREATE INDEX idx_images_rejected ON images (dataset_id, rejected) WHERE rejected = true;