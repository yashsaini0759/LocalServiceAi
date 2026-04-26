import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
# Some environments use postgresql:// direct parsing which works with psycopg2 if set as defaults

engine = create_engine(db_url)
