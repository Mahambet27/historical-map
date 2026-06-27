# Future Backend Architecture

## Goal

Move the current static historical dataset into a secure database and add moderation, publishing, and admin workflows without exposing private data in the frontend.

## Recommended Stack

- Supabase
- PostgreSQL
- PostGIS
- Supabase Storage
- Supabase Auth
- Row Level Security

## Core Tables

- `places`
- `place_translations`
- `eras`
- `categories`
- `place_categories`
- `images`
- `sources`
- `routes`
- `route_places`
- `users` / `profiles`
- `favorites`
- `reviews`
- `moderation_logs`

Related database prep docs:

- [SQL schema](docs/database/schema.sql)
- [Database README](docs/database/README.md)
- [Seed plan](docs/database/SEED_PLAN.md)
- [Migration checklist](docs/database/MIGRATION_CHECKLIST.md)

## Roles

- `guest`
- `user`
- `moderator`
- `admin`

## RLS Rules

- Guests can read published places only.
- Users can manage their own favorites and reviews.
- Moderators can review content and handle moderation workflows.
- Admins can create, edit, publish, unpublish, and manage places.
- Only admins can publish or unpublish content.

## Admin Panel

The future admin panel should support:

- Add and edit place records
- Upload and manage images
- Add sources and translations
- Publish and unpublish places
- Review user-submitted photos
- Manage categories and eras
- Moderate flagged content

## AI Guide Future Plan

The future AI guide should use the database as the source of truth, retrieve verified facts through embeddings and RAG, show sources to the user, avoid hallucinations, and support RU / KZ / EN output. The assistant should answer only from verified data that is published or explicitly approved for guidance use.
