"""
Database connection and Prisma client setup
"""
from prisma import Prisma

# Global Prisma client instance
db = Prisma()


async def connect_db():
    """Connect to the database"""
    if not db.is_connected():
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
