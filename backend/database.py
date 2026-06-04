import os
from sqlmodel import create_engine, SQLModel, Session
from dotenv import load_dotenv

load_dotenv()

# Switch to SQLite for easier local demonstration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

engine = create_engine(
    DATABASE_URL, 
    echo=True, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

def init_db():
    from .models import User, Email, ImportantEmail
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
