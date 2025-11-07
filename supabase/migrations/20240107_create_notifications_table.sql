CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view their own notifications" ON notifications;
CREATE POLICY "Vendors can view their own notifications"
ON notifications FOR SELECT
USING (true);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Vendors can update their own notifications" ON notifications;
CREATE POLICY "Vendors can update their own notifications"
ON notifications FOR UPDATE
USING (true);

alter publication supabase_realtime add table notifications;
