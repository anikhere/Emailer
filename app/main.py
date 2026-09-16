from fastapi import FastAPI
from app.schemas.student import router as students_router
from app.schemas.application import router as applications_router
from app.services.llm import router as llm_router
from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title='Emailer API')
app.mount(
    '/static',
    StaticFiles(directory=BASE_DIR / 'static'),
    name='static'
)
app.include_router(students_router)
app.include_router(applications_router)
app.include_router(llm_router)
@app.get('/health')
def health_check():
    return {'status':True}

@app.get('/',include_in_schema=False)
def frontend():
    return FileResponse(
        BASE_DIR / 'static' / 'index.html'
    )
@app.get('/applicant',include_in_schema=False)
def applicant_page():
    return FileResponse(
        BASE_DIR / 'static' / 'app.html'
    )