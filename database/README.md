# Database

This directory contains the database schema and migration files for the project.

## Structure

- `schema/`: Contains the initial database schema files.
  - `initial_schema.sql`: The initial SQL schema for setting up the database.
- `migrations/`: Contains versioned migration scripts for database changes.
  - Each subdirectory contains a timestamped migration with its SQL file.

## Available Migrations

1. `20250929114230_init` - Initial database setup with users, user_types, admin_modules, and user_access tables
2. `20251001081719_add_city_state` - Add city and state columns to users table
3. `20251001092419_add_category_to_admin_module` - Add category column to admin_modules and create settings table
4. `20251003092553_update_schema_to_match_provided` - Update schema (drop city/state, add short_description/tool_tip)
5. `20251003124051_add_category_back` - Re-add category column to admin_modules
6. `20251003130627_add_logs_and_category` - Create logs table
7. `20251006103050_add_city_state_to_users` - Re-add city and state columns to users
8. `20251006124730_add_user_preferences` - Create user_preferences table
9. `20251006130843_add_support_tickets` - Create support_tickets table with enums
10. `20251006132142_add_image_to_users` - Add image column to users table

## Usage

To apply the initial schema, run the `initial_schema.sql` file against your PostgreSQL database.

For migrations, use the scripts in the `migrations/` directory in chronological order. Each migration builds upon the previous state of the database.