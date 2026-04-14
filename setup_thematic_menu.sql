-- Script thêm menu item "Đơn Vị Hành Chính" vào Sidebar
-- Chạy script này trên database PostgreSQL

-- Thêm menu item mới cho bản đồ đơn vị hành chính
INSERT INTO menu_items (id, label, icon, roles, order_index, is_active, type, url)
VALUES (
  'thematic',
  'Đơn Vị Hành Chính',
  'MapPin',
  '{"VIEWER","EDITOR","ADMIN"}',
  2,
  true,
  'INTERNAL',
  '/donvihanhchinh'
)
ON CONFLICT (id) DO UPDATE SET
  label = 'Đơn Vị Hành Chính',
  icon = 'MapPin',
  roles = '{"VIEWER","EDITOR","ADMIN"}',
  order_index = 2,
  is_active = true;

-- Kiểm tra kết quả
SELECT id, label, icon, roles, order_index, is_active, type, url FROM menu_items WHERE id = 'thematic';
