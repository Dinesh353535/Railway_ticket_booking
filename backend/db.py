
import os
from dotenv import load_dotenv
from mysql.connector import connect

load_dotenv()


def get_db_connection():
    return connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "railway_booking"),
    )
