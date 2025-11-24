-- CAD Engine Database Schema for Cloudflare D1
-- Created: 2025-11-24

-- Users table (synced with Clerk authentication)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  data TEXT, -- JSON blob of project data
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Versions table (version history)
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  name TEXT,
  data TEXT, -- JSON blob of version data
  thumbnail_url TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Features table (CAD feature history)
CREATE TABLE features (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'box', 'cylinder', 'extrude', 'fillet', etc.
  parameters TEXT NOT NULL, -- JSON blob of feature parameters
  parent_id TEXT, -- For feature dependencies
  order_index INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (parent_id) REFERENCES features(id)
);

-- Create indexes for query performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX idx_versions_project_id ON versions(project_id);
CREATE INDEX idx_versions_number ON versions(project_id, version_number);
CREATE INDEX idx_features_project_id ON features(project_id);
CREATE INDEX idx_features_order ON features(project_id, order_index);
