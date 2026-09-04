import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_url = os.getenv("DBURL")

engine = create_engine(db_url)

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()
with engine.connect() as conn:
    print(f'suceeessss{db_url}')
