---
title: PostgreSQL CLI backups need explicit connection variables and schema-aware restore
author: Abudi
date: 2026-10-26
branch: fix-network-persist-flake
id: l-51de39fc
scope: repo
status: active
src: agent
touches:
  - ".devcontainer/README.md"
  - ".github/workflows/deploy.yml"
  - README.md
  - scripts/redeploy.sh
---

## Decided
Oracle migration and backup commands use scripts/oracle/postgres_env.py to turn a URI or libpq conninfo into explicit PGHOST, PGPORT, PGUSER, PGPASSWORD and PGDATABASE variables. This keeps credentials out of command arguments and avoids connecting to a default local server. pg_restore also receives --dbname with only the database name. Public-schema dumps include CREATE SCHEMA public, so deployment rollback drops public without recreating it; an empty-database import uses --clean --if-exists in one restore transaction. db/tests/test_oracle_restore.py verifies the actual dump/restore as a database owner and checks canonical table hashes and copied file bytes.

## Tried and ruled out
Assigning the whole connection string to PGDATABASE did not expand its host/port and attempted the default local socket. Passing PGDATABASE alone to pg_restore did not request a restore and failed because --dbname or --file was absent. Precreating public before restoring a dump that includes CREATE SCHEMA public conflicts with the dump's schema creation.

## Watch out
Keep pg_restore --list separate from restore invocations: listing needs no database. Deployment preparation must finish before maintenance; snapshots must reach private Object Storage before a migration changes schema. Database recovery failure must retain maintenance and leave the service stopped. The source database is PostgreSQL 18; use matching client tools for its final export.
