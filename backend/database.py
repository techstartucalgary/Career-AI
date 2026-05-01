"""
Database connection and configuration
"""
import pymongo
import certifi
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
database = os.environ.get("DATABASE", "mongodb://localhost:27017/")
db_info = os.environ.get("DATABASE_INFO", "career_ai")

# Initialize MongoDB connection
clientdb = None
db = None
col = None

deleted_users_col = None
applications_col = None
field_meanings_col = None
worker_health_col = None
activity_events_col = None
agent_sessions_col = None

try:
    clientdb = pymongo.MongoClient(database, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    clientdb.server_info()  # Force connection check
    print(f"MongoDB connected to {database}")
    db = clientdb[db_info]
    col = db["users"]
    deleted_users_col = db["deleted_users"]
    deleted_users_col.create_index("purge_at", expireAfterSeconds=0)

    # Auto-apply worker collections
    applications_col = db["applications"]
    field_meanings_col = db["field_meanings"]
    worker_health_col = db["worker_health"]
    activity_events_col = db["activity_events"]
    agent_sessions_col = db["agent_sessions"]

    # Applications indexes
    applications_col.create_index([("user_id", pymongo.ASCENDING), ("status", pymongo.ASCENDING)])
    applications_col.create_index([("status", pymongo.ASCENDING), ("queued_at", pymongo.ASCENDING)])
    applications_col.create_index(
        [("user_id", pymongo.ASCENDING), ("job_id", pymongo.ASCENDING)],
        unique=True,
    )

    # Field meanings cache index
    field_meanings_col.create_index("label_hash", unique=True)

    # Activity events: 30-day TTL + tailing index
    activity_events_col.create_index("created_at", expireAfterSeconds=2592000)
    activity_events_col.create_index([("user_id", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)])

except Exception as e:
    print(f"⚠ MongoDB connection failed: {e}")
    print("  Backend will start but DB-dependent routes will not work.")
