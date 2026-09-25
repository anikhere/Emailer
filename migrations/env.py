from logging.config import fileConfig

from app.database import tables
from app.database.base import Base
from app.database.connection import DATABASE_URL

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context


config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Alembic needs to know about our SQLAlchemy tables
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without connecting to the database."""

    config.set_main_option(
        "sqlalchemy.url",
        DATABASE_URL.replace("%", "%%"),
    )

    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations by connecting to the database."""

    connectable = create_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()