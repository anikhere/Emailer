import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database.tables import Student

load_dotenv()

DATABASE_URL = os.getenv("DBURL")

if not DATABASE_URL:
    raise RuntimeError("Database URL not found")


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


# Used by FastAPI
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# Smoke test
if __name__ == "__main__":
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 5")).scalar_one()
        print(f"Database connection successful: {result}")

    # student = Student(
    #     name="Taha",
    #     email="ta@example.com",
    #     phone="1234567890",
    #     resume_text="Python developer",
    # )

    # db = SessionLocal()

    # try:
    #     db.add(student)
    #     db.commit()
    #     print("Test student inserted successfully")
    #     student = db.query(Student).filter(Student.name == "Taha").first()

    #     print(student.name)
    #     print(student.email)
    # finally:
    #     db.close()