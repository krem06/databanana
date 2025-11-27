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
    template VARCHAR(50),
    exclude_tags TEXT,
    image_count INTEGER NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    exclusive_ownership BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'processing',
    gemini_batch_id VARCHAR(255),
    error_message TEXT,
    current_step VARCHAR(50),
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_batch_status CHECK (status IN ('processing', 'completed', 'failed', 'cancelled'))
);

-- Images belong to a specific batch (no delete, only validate/reject)
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    dataset_id INTEGER REFERENCES datasets(id),
    prompt TEXT,
    url TEXT,
    tags JSONB,
    rekognition_labels JSONB,
    bounding_boxes JSONB,
    validated BOOLEAN DEFAULT false,
    rejected BOOLEAN DEFAULT false,
    public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reference images uploaded by users for generation context
CREATE TABLE reference_images (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    s3_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WebSocket connections table (if using PostgreSQL instead of DynamoDB)
CREATE TABLE IF NOT EXISTS websocket_connections (
    connection_id VARCHAR(255) PRIMARY KEY,
    execution_id VARCHAR(255),
    connected_at TIMESTAMP DEFAULT NOW(),
    subscribed_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour')
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
CREATE INDEX idx_reference_images_batch ON reference_images (batch_id);

-- Additional indexes from migrations
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_user_id_status ON batches(user_id, status);
CREATE INDEX idx_batches_gemini_batch_id ON batches(gemini_batch_id);
CREATE INDEX idx_websocket_execution_id ON websocket_connections(execution_id);
CREATE INDEX idx_websocket_expires_at ON websocket_connections(expires_at);