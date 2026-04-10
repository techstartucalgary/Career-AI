"""
Database connection and configuration
"""
import pymongo
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
database = os.environ.get("DATABASE")
db_info = os.environ.get("DATABASE_INFO")

# Initialize MongoDB connection
try:
    clientdb = pymongo.MongoClient(f"{database}")
    print(f"MongoDB connected: {clientdb.server_info()}")
except Exception as e:
    print(f"MongoDB connection failed: {e}")

# Get database and collection
db = clientdb[f'{db_info}']
col = db["users"]
deleted_users_col = db["deleted_users"]

try:
    deleted_users_col.create_index("purge_at", expireAfterSeconds=0)
except Exception as e:
    print(f"Deleted users TTL index setup failed: {e}")
