"""
Database connection and Prisma client setup
"""
import asyncio
import logging
import sys

from prisma import Prisma
from prisma.engine.errors import BinaryNotFoundError

logger = logging.getLogger(__name__)

# Global Prisma client instance
db = Prisma()


async def _fetch_prisma_engine() -> None:
    """Download the Prisma query engine (used when the build didn't ship it,
    e.g. on Render where the build cache isn't available at runtime)."""
    logger.warning("Prisma query engine missing; running `prisma py fetch`")
    proc = await asyncio.create_subprocess_exec(
        sys.executable, "-m", "prisma", "py", "fetch",
    )
    if await proc.wait() != 0:
        raise RuntimeError("`prisma py fetch` failed; see logs above")


async def connect_db():
    """Connect to the database"""
    if db.is_connected():
        return
    try:
        await db.connect()
    except BinaryNotFoundError:
        await _fetch_prisma_engine()
        # Call connect directly: after the failed attempt is_connected()
        # already reports True even though the engine never started.
        await db.connect()


async def disconnect_db():
    """Disconnect from the database"""
    if db.is_connected():
        await db.disconnect()


async def get_db():
    """
    Dependency for getting database session
    Use in FastAPI route dependencies
    """
    if not db.is_connected():
        await connect_db()
    return db
