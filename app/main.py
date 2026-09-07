from fastapi import FastAPI
from app.schemas.student import router as students_router
app = FastAPI(title='Emailer API')
app.include_router(students_router)
@app.get('/health')
def health_check():
    return {'status':True}