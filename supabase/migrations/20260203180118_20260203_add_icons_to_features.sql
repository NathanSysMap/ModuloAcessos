/*
  # Add icons to features table

  1. Add icon_name column to features table
    - This will store the name of the lucide-react icon to display in the menu
    - Default to null for backward compatibility
  
  2. Seed default icons for existing features
    - Home icon for Home
    - Package icon for Catálogo
    - Users icon for Usuários
    - Lock icon for Perfis
    - Settings icon for Funcionalidades
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'features' AND column_name = 'icon_name'
  ) THEN
    ALTER TABLE features ADD COLUMN icon_name text;
  END IF;
END $$;

-- Update features with appropriate icons
UPDATE features SET icon_name = 'home' WHERE menu_label = 'Home';
UPDATE features SET icon_name = 'package' WHERE menu_label = 'Catálogo';
UPDATE features SET icon_name = 'users' WHERE menu_label = 'Usuários';
UPDATE features SET icon_name = 'shield-check' WHERE menu_label = 'Perfis';
UPDATE features SET icon_name = 'settings' WHERE menu_label = 'Funcionalidades';
UPDATE features SET icon_name = 'user-plus' WHERE menu_label = 'Novo Usuário';
UPDATE features SET icon_name = 'shield-plus' WHERE menu_label = 'Novo Perfil';
UPDATE features SET icon_name = 'plus' WHERE menu_label = 'Nova Funcionalidade';
