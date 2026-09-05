import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker

db_url = os.getenv("DBURL")
if not db_url:
    raise RuntimeError('DatabaseUrl not found ')

engine = create_engine(db_url,pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine,autoflush=False,expire_on_commit=False)
def get_db():
    db = SessionLocal()
    try:
        yield db 
    finally:
        db.close()
if __name__ == '__main__':
    with engine.connect() as conn:
        result = conn.execute(text('SELECT 5')).scalar_one()
        print(f'Database created received {result}')