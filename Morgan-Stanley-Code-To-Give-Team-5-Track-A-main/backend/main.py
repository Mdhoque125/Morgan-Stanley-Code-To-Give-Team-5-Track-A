from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import events, users, zesty, scoreboard, chat

app = FastAPI(title="API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(scoreboard.router, prefix="/api/scoreboard", tags=["scoreboard"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(zesty.router, prefix="/api/zesty", tags=["zesty"])

@app.get("/")
async def root():
    return {"status": "ok", "message": "api is up"}
