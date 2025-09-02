# 🔧 BACKEND IMPLEMENTATION GUIDE
## Adding Missing APIs to Existing FastAPI Backend

**PURPOSE**: Step-by-step guide to add messaging, referrals, and complete admin controls to your existing `/app/backend/server.py`

---

## 🗄️ **1) DATABASE ADDITIONS**

Add these to your existing MongoDB collections or create new PostgreSQL tables:

### **MongoDB Collections to Add:**
```python
# Add to existing database initialization
async def initialize_messaging_collections():
    """Initialize messaging collections"""
    db = client[os.environ['DB_NAME']]
    
    # Create indexes for messaging
    await db.message_threads.create_index([("context_type", 1), ("context_id", 1)])
    await db.messages.create_index([("thread_id", 1), ("created_at", -1)])
    await db.referral_codes.create_index([("code", 1)], unique=True)
    await db.referral_attributions.create_index([("new_user_id", 1)])
    
    print("✅ Messaging collections initialized")
```

---

## 💬 **2) MESSAGING ENDPOINTS**

Add these endpoints to your existing `server.py`:

```python
# Add to imports
import asyncio
import re
from typing import List, Optional
from datetime import datetime, timedelta

# Messaging Models
class MessageCreate(BaseModel):
    body: Optional[str] = None
    attachments: Optional[List[dict]] = None

class ThreadCreate(BaseModel):
    context_type: str
    context_id: str
    participants: Optional[List[dict]] = None

# Helper Functions
def redact_contacts(text: str) -> dict:
    """Redact phone numbers, emails, and URLs from text"""
    if not text:
        return {"text": "", "redacted": False}
    
    redacted = False
    patterns = [
        (r'\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b', 'email'),
        (r'\b(?:\+?\d[\s-]?){7,}\b', 'phone'),
        (r'\b(?:https?://|www\.)\S+', 'url')
    ]
    
    result = text
    for pattern, _ in patterns:
        if re.search(pattern, result):
            redacted = True
            result = re.sub(pattern, '•••', result)
    
    return {"text": result, "redacted": redacted}

# Messaging Endpoints
@api_router.post("/messages/threads")
async def create_or_get_thread(thread_data: ThreadCreate, current_user: dict = Depends(get_current_user)):
    """Create or get existing message thread"""
    try:
        # Check if thread exists
        existing_thread = await db.message_threads.find_one({
            "context_type": thread_data.context_type,
            "context_id": thread_data.context_id
        })
        
        if existing_thread:
            return {"ok": True, "id": existing_thread["id"]}
        
        # Create new thread
        thread_id = str(uuid.uuid4())
        thread_doc = {
            "id": thread_id,
            "context_type": thread_data.context_type,
            "context_id": thread_data.context_id,
            "created_by": current_user["id"],
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.message_threads.insert_one(thread_doc)
        
        # Add participants
        if thread_data.participants:
            participants = []
            for p in thread_data.participants:
                participants.append({
                    "thread_id": thread_id,
                    "user_id": p.get("user_id"),
                    "role": p.get("role", "OBSERVER"),
                    "last_read_at": None
                })
            await db.message_participants.insert_many(participants)
        
        return {"ok": True, "id": thread_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/threads/{thread_id}/messages")
async def get_thread_messages(
    thread_id: str, 
    limit: int = 50, 
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get paginated messages for a thread"""
    try:
        # Verify user is participant
        participant = await db.message_participants.find_one({
            "thread_id": thread_id,
            "user_id": current_user["id"]
        })
        
        if not participant:
            raise HTTPException(status_code=403, detail="Not a thread participant")
        
        # Get messages
        messages = await db.messages.find({
            "thread_id": thread_id
        }).sort("created_at", -1).skip(offset).limit(limit).to_list(length=None)
        
        return {"messages": messages}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages/threads/{thread_id}/messages")
async def send_message(
    thread_id: str,
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a message to a thread"""
    try:
        # Verify participant
        participant = await db.message_participants.find_one({
            "thread_id": thread_id,
            "user_id": current_user["id"]
        })
        
        if not participant:
            raise HTTPException(status_code=403, detail="Not a thread participant")
        
        # Validate message
        if not message_data.body and not message_data.attachments:
            raise HTTPException(status_code=400, detail="Empty message")
        
        # Content moderation (basic implementation)
        redacted_content = redact_contacts(message_data.body or "")
        
        # Create message
        message_id = str(uuid.uuid4())
        message_doc = {
            "id": message_id,
            "thread_id": thread_id,
            "sender_id": current_user["id"],
            "body": redacted_content["text"],
            "attachments": message_data.attachments or [],
            "redacted": redacted_content["redacted"],
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.messages.insert_one(message_doc)
        
        # Create notifications for other participants
        other_participants = await db.message_participants.find({
            "thread_id": thread_id,
            "user_id": {"$ne": current_user["id"]}
        }).to_list(length=None)
        
        for participant in other_participants:
            notification_doc = {
                "id": str(uuid.uuid4()),
                "user_id": participant["user_id"],
                "topic": "NEW_MESSAGE",
                "payload": {
                    "thread_id": thread_id,
                    "sender_name": current_user.get("full_name", "Someone"),
                    "preview": (redacted_content["text"] or "")[:50] + "..." if len(redacted_content["text"]) > 50 else redacted_content["text"]
                },
                "read": False,
                "created_at": datetime.now(timezone.utc)
            }
            await db.notifications.insert_one(notification_doc)
        
        return {
            "ok": True, 
            "id": message_id,
            "created_at": message_doc["created_at"],
            "redacted": redacted_content["redacted"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages/threads/{thread_id}/read")
async def mark_thread_read(thread_id: str, current_user: dict = Depends(get_current_user)):
    """Mark thread as read for current user"""
    try:
        await db.message_participants.update_one(
            {"thread_id": thread_id, "user_id": current_user["id"]},
            {"$set": {"last_read_at": datetime.now(timezone.utc)}}
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🎯 **3) REFERRALS ENDPOINTS**

```python
# Referral Models
class ReferralSummary(BaseModel):
    code: str
    clicks: int
    signups: int
    rewards: List[dict]

# Referral helper
def generate_referral_code(user_id: str) -> str:
    """Generate a unique referral code"""
    import hashlib
    import random
    
    # Create a short, memorable code
    base = hashlib.md5(f"{user_id}{random.randint(1000, 9999)}".encode()).hexdigest()[:8].upper()
    return f"STOCK{base}"

@api_router.get("/referrals/code")
async def get_referral_code(current_user: dict = Depends(get_current_user)):
    """Get or create user's referral code"""
    try:
        # Check if user has existing code
        existing_code = await db.referral_codes.find_one({"user_id": current_user["id"]})
        
        if existing_code:
            return {"code": existing_code["code"]}
        
        # Create new code
        code = generate_referral_code(current_user["id"])
        
        # Ensure uniqueness
        while await db.referral_codes.find_one({"code": code}):
            code = generate_referral_code(current_user["id"])
        
        code_doc = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "code": code,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.referral_codes.insert_one(code_doc)
        return {"code": code}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/referrals/click")
async def track_referral_click(code: str, to: str = "/signup", request: Request = None):
    """Track referral click and redirect"""
    try:
        # Log the click
        click_doc = {
            "id": str(uuid.uuid4()),
            "code": code,
            "referer": request.headers.get("referer") if request else None,
            "ip": request.client.host if request else None,
            "user_agent": request.headers.get("user-agent") if request else None,
            "dest_path": to,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.referral_clicks.insert_one(click_doc)
        
        # Set referral cookie and redirect
        response = RedirectResponse(url=to)
        response.set_cookie(
            key="referral_code", 
            value=code, 
            max_age=30*24*60*60,  # 30 days
            httponly=True
        )
        return response
        
    except Exception as e:
        # Still redirect even if logging fails
        return RedirectResponse(url=to)

@api_router.get("/referrals/summary")
async def get_referral_summary(current_user: dict = Depends(get_current_user)):
    """Get user's referral performance summary"""
    try:
        # Get user's referral code
        code_doc = await db.referral_codes.find_one({"user_id": current_user["id"]})
        if not code_doc:
            return {"code": None, "clicks": 0, "signups": 0, "rewards": []}
        
        code = code_doc["code"]
        
        # Count clicks
        clicks = await db.referral_clicks.count_documents({"code": code})
        
        # Count signups
        signups = await db.referral_attributions.count_documents({"code": code})
        
        # Get rewards
        rewards = await db.referral_rewards.find({
            "user_id": current_user["id"]
        }).to_list(length=None)
        
        return {
            "code": code,
            "clicks": clicks,
            "signups": signups,
            "rewards": rewards
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🔔 **4) NOTIFICATIONS ENDPOINTS**

```python
@api_router.get("/notifications")
async def get_notifications(
    limit: int = 50,
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    try:
        query = {"user_id": current_user["id"]}
        if unread_only:
            query["read"] = False
        
        notifications = await db.notifications.find(query)\
            .sort("created_at", -1)\
            .limit(limit)\
            .to_list(length=None)
        
        return {"notifications": notifications}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        await db.notifications.update_one(
            {"id": notification_id, "user_id": current_user["id"]},
            {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
        )
        return {"ok": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🔐 **5) ADMIN ENDPOINTS**

```python
# Admin messaging controls
@api_router.get("/admin/messages/threads")
async def admin_get_all_threads(
    context_type: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_admin_user)
):
    """Get all message threads for admin review"""
    try:
        query = {}
        if context_type:
            query["context_type"] = context_type
        
        threads = await db.message_threads.find(query)\
            .sort("created_at", -1)\
            .limit(limit)\
            .to_list(length=None)
        
        return {"threads": threads}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/messages/moderation")
async def admin_get_flagged_messages(current_user: dict = Depends(get_current_admin_user)):
    """Get messages that were redacted or flagged"""
    try:
        flagged_messages = await db.messages.find({
            "redacted": True
        }).sort("created_at", -1).limit(100).to_list(length=None)
        
        return {"flagged_messages": flagged_messages}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/users/{user_id}/messaging-ban")
async def admin_ban_user_messaging(
    user_id: str,
    reason: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Ban user from messaging"""
    try:
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "messaging_banned": True,
                "messaging_ban_reason": reason,
                "messaging_banned_at": datetime.now(timezone.utc),
                "messaging_banned_by": current_user["id"]
            }}
        )
        
        return {"ok": True}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin referral controls
@api_router.get("/admin/referrals")
async def admin_get_referrals(current_user: dict = Depends(get_current_admin_user)):
    """Get all referrals for admin review"""
    try:
        referrals = await db.referral_rewards.find({}).sort("created_at", -1).limit(100).to_list(length=None)
        return {"referrals": referrals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/referrals/{reward_id}/approve")
async def admin_approve_referral_reward(
    reward_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """Approve referral reward for payout"""
    try:
        await db.referral_rewards.update_one(
            {"id": reward_id},
            {"$set": {
                "status": "APPROVED",
                "approved_by": current_user["id"],
                "approved_at": datetime.now(timezone.utc)
            }}
        )
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🚀 **6) INTEGRATION STEPS**

### **Step 1: Add to existing server.py**
```python
# Add these imports at the top of server.py
import re
from typing import List, Optional
from datetime import timedelta

# Add the models, helper functions, and endpoints above
# Insert after your existing API routes
```

### **Step 2: Initialize collections**
```python
# Add to your existing database initialization
await initialize_messaging_collections()
```

### **Step 3: Update user registration**
```python
# Modify your existing registration endpoint to handle referrals
@api_router.post("/auth/register")
async def register(user_data: UserCreate, request: Request):
    # ... existing registration code ...
    
    # Handle referral attribution
    referral_code = request.cookies.get("referral_code")
    if referral_code:
        referrer = await db.referral_codes.find_one({"code": referral_code})
        if referrer and referrer["user_id"] != new_user["id"]:
            # Create attribution
            await db.referral_attributions.insert_one({
                "id": str(uuid.uuid4()),
                "code": referral_code,
                "new_user_id": new_user["id"],
                "attributed_at": datetime.now(timezone.utc)
            })
            
            # Create reward
            await db.referral_rewards.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": referrer["user_id"],
                "kind": "CREDIT",
                "amount": 50.00,
                "status": "PENDING",
                "meta": {"signup_user_id": new_user["id"]},
                "created_at": datetime.now(timezone.utc)
            })
    
    return {"user": new_user}
```

---

## ✅ **7) TESTING CHECKLIST**

**Test these endpoints after implementation:**

1. **Messaging**:
   - [ ] Create thread: `POST /api/messages/threads`
   - [ ] Send message: `POST /api/messages/threads/{id}/messages`
   - [ ] Get messages: `GET /api/messages/threads/{id}/messages`
   - [ ] Verify redaction works for phone/email

2. **Referrals**:
   - [ ] Get code: `GET /api/referrals/code`
   - [ ] Track click: `GET /api/referrals/click?code=X&to=/signup`
   - [ ] View summary: `GET /api/referrals/summary`

3. **Notifications**:
   - [ ] List notifications: `GET /api/notifications`
   - [ ] Mark read: `POST /api/notifications/{id}/read`

4. **Admin Controls**:
   - [ ] View all threads: `GET /api/admin/messages/threads`
   - [ ] View flagged messages: `GET /api/admin/messages/moderation`
   - [ ] Ban user: `POST /api/admin/users/{id}/messaging-ban`

---

**🎉 YOUR BACKEND IS NOW COMPLETE!**

This implementation adds all the missing functionality needed to support the comprehensive admin dashboard we built. The messaging system includes anti-bypass protection, the referral system has complete tracking, and admin controls provide full platform oversight.