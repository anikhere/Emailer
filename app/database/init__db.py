from tables import *
from base import Base
from sqlalchemy import inspect
from connection import engine
Base.metadata.create_all(bind=engine)
def Inspect():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if 'applications' in tables and 'student' in tables:
        print(f'successssssssss')
if __name__ == '__main__':
    Inspect()
