import os 
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError('cant find anything ')
engine = create_engine(DATABASE_URL,pool_pre_ping=True)
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)

if __name__ == "__main__":
    try:
        with engine.connect() as conn:
            result = conn.execute(text('SELECT 1')).scalar_one()
            print(f'the response is actually {result}')
    except Exception as e:
        print(f'the error is {e}')

