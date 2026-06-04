from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from datetime import datetime, timedelta

# Local imports
try:
    from .gmail_service import GmailService
    from .filter import is_important_email, detect_opportunity_type, extract_deadline
except ImportError:
    from gmail_service import GmailService
    from filter import is_important_email, detect_opportunity_type, extract_deadline

# ---------------------------------------------------
# FastAPI app
# ---------------------------------------------------
app = FastAPI(title="Find My Mail API")

# Enable CORS for any origin (frontend runs on localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple health check
@app.get("/")
def read_root():
    return {"message": "Welcome to Find My Mail API"}

# Store the last scan result in memory so the dashboard can retrieve it.
last_scan_results: List[Dict] = []

# ---------------------------------------------------
# Scan endpoint – optimized for speed and unread messages
# ---------------------------------------------------
@app.post("/scan")
async def scan_emails(request: Request):
    data = await request.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Access token required")

    print("[SCAN] Received optimized scan request")

    # Build a token payload for GmailService
    future_expiry = (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"
    token_data = {
        "token": access_token,
        "refresh_token": None,
        "token_uri": None,
        "client_id": None,
        "client_secret": None,
        "scopes": ["https://www.googleapis.com/auth/gmail.readonly"],
        "expiry": future_expiry,
    }

    service = GmailService(token_data=token_data)
    try:
        # OPTIMIZATION: Call fetch_unread_messages instead of pulling your entire mailbox!
        print("[SCAN] Requesting ONLY unread message summaries from Google...")
        messages = service.fetch_unread_messages()
        print(f"[SCAN] Found {len(messages)} unread messages to analyze.")
    except Exception as e:
        print(f"[SCAN] Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {str(e)}")

    important_emails: List[Dict] = []
    scanned = 0
    
    for msg_summary in messages:
        try:
            details = service.get_message_details(msg_summary["id"])
            if not details:
                continue
            scanned += 1
            print(f"[SCAN] Checking text index {scanned}: {details['subject'][:50]}")
            
            if is_important_email(details["subject"], details["snippet"]):
                print(f"[SCAN] ✓ MATCH FOUND: {details['subject'][:50]}")
                opp_type = detect_opportunity_type(details["subject"], details["snippet"])
                deadline = extract_deadline(details["snippet"])
                
                important_emails.append({
                    "gmail_id": details["id"],
                    "subject": details["subject"],
                    "sender": details["sender"],
                    "folder": details.get("folder", "INBOX"),
                    "snippet": details["snippet"],
                    "received_at": details["received_at"],
                    "is_read": False,  # Hardcoded fallback to fulfill frontend filter expectations
                    "opportunity": {
                        "opportunity_type": opp_type,
                        "deadline": deadline.isoformat() if deadline else None,
                        "action_required": True,
                    },
                })
        except Exception as e:
            print(f"[SCAN] Error processing message {msg_summary.get('id', 'unknown')}: {str(e)}")
            continue

    global last_scan_results
    MAX_CACHED = 200
    last_scan_results = important_emails[:MAX_CACHED]
    
    print(f"[SCAN] Completed super-speed pass: scanned={scanned}, important_found={len(important_emails)}")

    return {
        "status": "success",
        "scanned": scanned,
        "important_found": len(important_emails),
        "important_emails": important_emails,
    }

@app.get("/emails")
def get_emails():
    return []

@app.get("/emails/important")
def get_important_emails(limit: int = 50):
    if limit < 0:
        raise HTTPException(status_code=400, detail="limit must be >= 0")
    return last_scan_results[:limit]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
    )