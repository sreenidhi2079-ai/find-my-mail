from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    google_id: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    emails: List["Email"] = Relationship(back_populates="user")

class Email(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    gmail_id: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id")
    subject: str
    sender: str
    folder: str
    snippet: str
    is_read: bool = Field(default=False)
    received_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="emails")
    opportunity: Optional["ImportantEmail"] = Relationship(back_populates="email")

class ImportantEmail(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email_id: int = Field(foreign_key="email.id", unique=True)
    opportunity_type: str  # Internship, Job, Interview, etc.
    deadline: Optional[datetime] = None
    action_required: bool = Field(default=False)
    detected_at: datetime = Field(default_factory=datetime.utcnow)

    email: Email = Relationship(back_populates="opportunity")
