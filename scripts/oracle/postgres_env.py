"""Pass libpq connection settings through environment variables, without argv secrets."""

from __future__ import annotations

import os
import sys

from psycopg.conninfo import conninfo_to_dict

# Explicitly reject unsupported options instead of silently connecting elsewhere.
VARIABLES = {
    "dbname": "PGDATABASE",
    "host": "PGHOST",
    "hostaddr": "PGHOSTADDR",
    "port": "PGPORT",
    "user": "PGUSER",
    "password": "PGPASSWORD",
    "passfile": "PGPASSFILE",
    "sslmode": "PGSSLMODE",
    "sslcert": "PGSSLCERT",
    "sslkey": "PGSSLKEY",
    "sslrootcert": "PGSSLROOTCERT",
    "sslcrl": "PGSSLCRL",
    "connect_timeout": "PGCONNECT_TIMEOUT",
    "application_name": "PGAPPNAME",
    "options": "PGOPTIONS",
    "channel_binding": "PGCHANNELBINDING",
    "target_session_attrs": "PGTARGETSESSIONATTRS",
    "service": "PGSERVICE",
}


def postgres_env(dsn: str) -> dict[str, str]:
    parameters = conninfo_to_dict(dsn)
    unsupported = parameters.keys() - VARIABLES.keys()
    if unsupported:
        raise ValueError(f"Unsupported libpq options: {', '.join(sorted(unsupported))}")
    # Clear inherited connection defaults so a caller cannot redirect a backup.
    env = {
        key: value for key, value in os.environ.items() if key not in VARIABLES.values()
    }
    return {**env, **{VARIABLES[key]: value for key, value in parameters.items()}}


if __name__ == "__main__":
    os.execvpe(sys.argv[1], sys.argv[1:], postgres_env(os.environ["DATABASE_URL"]))
