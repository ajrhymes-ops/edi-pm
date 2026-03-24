-- Stages table
CREATE TABLE IF NOT EXISTS stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_name VARCHAR(255),
  project_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  current_stage_id INTEGER REFERENCES stages(id),
  parent_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  start_date DATE,
  target_date DATE,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  health_status VARCHAR(20) NOT NULL DEFAULT 'on_track',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_id INTEGER REFERENCES stages(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assignee VARCHAR(100),
  due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'todo',
  sort_order INTEGER NOT NULL DEFAULT 0,
  depends_on INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  detail JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage_id ON tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_project_id ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_health ON projects(health_status);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(current_stage_id);

-- Seed default stages
INSERT INTO stages (name, slug, sort_order, color, is_default) VALUES
  ('Discovery', 'discovery', 1, '#6366f1', true),
  ('Setup', 'setup', 2, '#f59e0b', true),
  ('Testing', 'testing', 3, '#3b82f6', true),
  ('Go-Live', 'go-live', 4, '#10b981', true),
  ('Complete', 'complete', 5, '#6b7280', true)
ON CONFLICT (slug) DO NOTHING;
