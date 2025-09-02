# 🚀 STOCKLOT COMPLETE API SPECIFICATION
## Messaging, Referrals, Buy-Requests, Notifications & Real-time

**PURPOSE**: Complete REST API specification for closing the loop with messaging and all related systems. This bolts onto the admin dashboard we built and provides complete platform control.

---

## 🔐 **0) CORE PRINCIPLES (Apply to Every Endpoint)**

### **Authentication & Authorization**
```
Auth: JWT session tokens
Headers: x-selling-context: USER|ORG:<id>
RBAC: Buyer/Seller/Admin + Org roles (Owner/Admin/Manager/Staff/Viewer)
```

### **Security & Rate Limiting**
```
Rate limits: 100/min per user, 20/min for guests
hCaptcha: Required for guest flows and public POSTs
Moderation: All text/images through content guard
PII Masking: No phone/email in messages until escrow=PAID
```

---

## 💬 **1) MESSAGING SYSTEM (Complete Implementation)**

### **1.1 Database Schema (PostgreSQL)**

```sql
-- Core messaging tables
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT NOT NULL CHECK (context_type IN ('LISTING','ORDER','BUY_REQUEST','AUCTION','SUPPORT')),
  context_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_msg_threads_ctx ON message_threads(context_type, context_id);

CREATE TABLE message_participants (
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('BUYER','SELLER','ADMIN','OBSERVER')),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  body TEXT,
  attachments JSONB,                          -- [{url,mime,name,size}]
  redacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);

-- Real-time event log for SSE/WebSocket
CREATE TABLE message_events (
  id BIGSERIAL PRIMARY KEY,
  thread_id UUID NOT NULL,
  kind TEXT NOT NULL,                          -- 'NEW_MESSAGE'
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### **1.2 REST Endpoints**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| `POST` | `/api/messages/threads` | Create/find thread for context | ✅ |
| `GET` | `/api/messages/threads?context=TYPE:ID` | Get or create thread ID | ✅ |
| `GET` | `/api/messages/threads/:id` | Thread metadata + participants | ✅ |
| `GET` | `/api/messages/threads/:id/messages` | Paginated message history | ✅ |
| `POST` | `/api/messages/threads/:id/messages` | Send message (with guards) | ✅ |
| `POST` | `/api/messages/threads/:id/read` | Mark thread as read | ✅ |
| `POST` | `/api/messages/threads/:id/participants` | Add/remove participants (admin) | 🔐 Admin |
| `GET` | `/api/messages/threads/:id/stream` | SSE real-time updates | ✅ |

### **1.3 Request/Response Examples**

**Send Message:**
```json
POST /api/messages/threads/:id/messages
{
  "body": "Hi, is transport included?",
  "attachments": [{ 
    "name": "vaccine.jpg", 
    "mime": "image/jpeg", 
    "url": "https://..." 
  }]
}

Response:
{
  "ok": true,
  "id": "msg-uuid",
  "created_at": "2024-01-15T10:30:00Z",
  "redacted": false
}
```

### **1.4 Server-Side Guards**

**Context Gate Rules:**
- `LISTING` → participants = seller + authenticated buyer
- `ORDER` → buyer + seller + admin
- `BUY_REQUEST` → buyer + offering sellers
- `AUCTION` → seller + bidders (after bid placement)

**Anti-Bypass Protection:**
```javascript
// Redact phone/emails/URLs if order not PAID
function redactContacts(text) {
  let redacted = false;
  const patterns = [
    /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g,          // emails
    /\b(?:\+?\d[\s-]?){7,}\b/g,                     // phones  
    /\b(?:https?:\/\/|www\.)\S+/gi                  // urls
  ];
  let out = text;
  for (const re of patterns) {
    if (re.test(out)) { 
      redacted = true; 
      out = out.replace(re, '•••'); 
    }
  }
  return { text: out, redacted };
}
```

---

## 🛒 **2) BUY REQUESTS (Missing Operations)**

### **2.1 Additional Endpoints**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| `PATCH` | `/api/buy-requests/:id/close` | Owner closes request | ✅ Owner |
| `PATCH` | `/api/buy-requests/:id/reopen` | Reopen if not fulfilled | ✅ Owner |
| `POST` | `/api/buy-requests/:id/report` | Report abuse/spam | ✅ |
| `GET` | `/api/buy-requests/my` | Buyer's own requests | ✅ Buyer |
| `GET` | `/api/seller/requests/in-range` | Nearby requests for seller | ✅ Seller |
| `GET` | `/api/seller/offers` | Seller's submitted offers | ✅ Seller |
| `PATCH` | `/api/buy-requests/:id/offers/:offerId` | Counter/decline offer | ✅ |

### **2.2 Admin Controls**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/buy-requests` | List all requests with filters |
| `POST` | `/api/admin/buy-requests/:id/approve` | Approve request |
| `POST` | `/api/admin/buy-requests/:id/reject` | Reject with reason |
| `PATCH` | `/api/admin/buy-requests/:id/edit` | Edit request content |
| `POST` | `/api/admin/buy-requests/:id/force-close` | Force close request |
| `POST` | `/api/admin/buy-requests/:id/notify-nearby` | Manually notify sellers |

---

## 🎯 **3) REFERRALS (End-to-End System)**

### **3.1 Database Schema**

```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE referral_clicks (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  referer TEXT, 
  ip INET, 
  user_agent TEXT,
  dest_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE referral_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  new_user_id UUID NOT NULL REFERENCES users(id),
  attributed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),        -- who earns
  kind TEXT NOT NULL CHECK (kind IN ('CASH','CREDIT')),
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',            -- PENDING|APPROVED|PAID|REJECTED
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### **3.2 REST Endpoints**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| `GET` | `/api/referrals/code` | Get/create my referral code | ✅ |
| `GET` | `/api/referrals/click?code=...&to=/signup` | Track click + redirect | ❌ |
| `POST` | `/api/auth/register` | Attributes referral by cookie | ❌ |
| `GET` | `/api/referrals/summary` | My clicks, signups, rewards | ✅ |
| `POST` | `/api/referrals/payouts` | Request payout (CASH/CREDIT) | ✅ |

### **3.3 Admin Referral Controls**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/referrals` | Review all referrals + fraud flags |
| `POST` | `/api/admin/referrals/:id/approve` | Approve reward payout |
| `POST` | `/api/admin/referrals/:id/reject` | Reject with reason |
| `POST` | `/api/admin/payouts/run` | Process Paystack payouts |
| `POST` | `/api/admin/referrals/:userId/flag-fraud` | Flag fraudulent activity |

### **3.4 Attribution Rules**
- **Last-click attribution** within 30 days
- **Ignore self-referrals** (same device/email/IP)
- **Reward structure**: 10% commission on first transaction

---

## 🔔 **4) NOTIFICATIONS (In-App + Email)**

### **4.1 Notification Events**

**Auto-Generated Events:**
- `NEW_MESSAGE` - New message in thread
- `BUY_REQUEST_NEARBY` - New request in seller's area
- `OFFER_RECEIVED` - Offer received on buy request
- `OFFER_ACCEPTED` - Your offer was accepted
- `ORDER_PAID` - Order payment completed
- `ORDER_FULFILLMENT_UPDATED` - Delivery status update
- `DISPUTE_OPENED` - Dispute opened on order
- `DOC_EXPIRING` - Document expiring soon
- `DOC_REJECTED` - Document rejected
- `OUTBID` - Outbid in auction
- `AUCTION_WON` - Won auction

### **4.2 Notification Endpoints**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| `GET` | `/api/notifications` | List notifications (unread first) | ✅ |
| `POST` | `/api/notifications/:id/read` | Mark as read | ✅ |
| `POST` | `/api/notifications/subscribe` | Register web push token | ✅ |
| `POST` | `/api/notifications/test` | Test notification (admin/dev) | 🔐 |

### **4.3 Mailgun Webhook**
```
POST /api/notifications/mailgun/webhook
```
Handle delivered/opened/clicked/bounced events

---

## ⚡ **5) REAL-TIME (SSE or WebSocket)**

### **5.1 Server-Sent Events (SSE)**

| Endpoint | Purpose | Events Emitted |
|----------|---------|----------------|
| `GET /api/messages/threads/:id/stream` | Real-time messages | `NEW_MESSAGE`, `USER_TYPING` |
| `GET /api/auctions/:id/stream` | Real-time bidding | `NEW_BID`, `OUTBID`, `AUCTION_ENDED` |
| `GET /api/notifications/stream` | Real-time notifications | All notification types |

### **5.2 WebSocket Alternative**
```
WS /ws
```
Multi-channel real-time updates with subscription management

---

## 🛡️ **6) ADMIN MESSAGING CONTROLS**

### **6.1 Admin Messaging Endpoints**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/messages/threads` | List all threads with filters |
| `GET` | `/api/admin/messages/moderation` | View redacted/flagged messages |
| `POST` | `/api/admin/messages/:id/redact` | Force redact message |
| `POST` | `/api/admin/users/:id/messaging-ban` | Ban user from messaging |  
| `PATCH` | `/api/admin/settings/messaging` | Configure messaging rules |

### **6.2 Moderation Features**
- **Contact leak detection** with automatic redaction
- **Spam pattern recognition** and auto-flagging
- **User messaging bans** for policy violations
- **Kill switch** for high-risk category messaging

---

## 📋 **7) IMPLEMENTATION CHECKLIST**

### **Phase 1: Core Messaging**
- [ ] Create database tables
- [ ] Implement thread creation/retrieval
- [ ] Add message sending with redaction
- [ ] Set up participant management
- [ ] Add real-time SSE endpoints

### **Phase 2: Buy Request Integration** 
- [ ] Add missing buy request operations
- [ ] Integrate messaging with buy requests
- [ ] Implement offer management
- [ ] Add admin moderation controls

### **Phase 3: Referral System**
- [ ] Create referral tracking tables
- [ ] Implement click tracking and attribution
- [ ] Add reward calculation and payout
- [ ] Build admin fraud detection

### **Phase 4: Notifications**
- [ ] Set up notification event system
- [ ] Integrate Mailgun email notifications
- [ ] Add web push notifications
- [ ] Create notification preferences

### **Phase 5: Admin Integration**
- [ ] Wire admin controls to frontend
- [ ] Add moderation interfaces
- [ ] Implement bulk operations
- [ ] Set up monitoring dashboards

---

## 🧪 **8) TESTING VERIFICATION**

**Core Functionality Tests:**
1. ✅ Can open thread from listing/order/request and send message
2. ✅ Messages with phone/email get redacted if order not PAID
3. ✅ Receive in-app + email notifications for new messages
4. ✅ Buy request offers sorted by landed cost
5. ✅ Offer acceptance triggers Paystack escrow
6. ✅ Referral codes attribute signups and generate rewards
7. ✅ Admin can approve/reject buy requests
8. ✅ Admin can view message moderation actions
9. ✅ Real-time updates work via SSE
10. ✅ Bulk operations work for admin functions

---

## 💻 **9) SAMPLE IMPLEMENTATION CODE**

### **Message Send Handler (FastAPI)**
```python
@app.post("/api/messages/threads/{thread_id}/messages")
async def send_message(
    thread_id: str,
    message: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    # Verify participant
    participant = await db.message_participants.find_one({
        "thread_id": thread_id,
        "user_id": current_user.id
    })
    if not participant:
        raise HTTPException(status_code=403)
    
    # Content moderation
    moderation = await moderate_content(message.body)
    if not moderation.approved:
        raise HTTPException(status_code=400, detail="Message rejected")
    
    # Anti-bypass redaction
    redacted_content = redact_contacts(message.body)
    
    # Save message
    new_message = await db.messages.insert_one({
        "id": str(uuid.uuid4()),
        "thread_id": thread_id,
        "sender_id": current_user.id,
        "body": redacted_content.text,
        "redacted": redacted_content.redacted,
        "created_at": datetime.utcnow()
    })
    
    # Notify participants
    await notify_thread_participants(thread_id, current_user.id, "NEW_MESSAGE")
    
    return {"ok": True, "id": new_message.id}
```

### **Referral Attribution (Registration Hook)**
```python
@app.post("/api/auth/register") 
async def register_user(user_data: UserCreate, request: Request):
    # Create user
    new_user = await create_user(user_data)
    
    # Check referral attribution
    referral_code = request.cookies.get("referral_code")
    if referral_code:
        # Verify code exists and isn't self-referral
        referrer = await db.referral_codes.find_one({"code": referral_code})
        if referrer and referrer.user_id != new_user.id:
            # Create attribution
            await db.referral_attributions.insert_one({
                "code": referral_code,
                "new_user_id": new_user.id,
                "attributed_at": datetime.utcnow()
            })
            
            # Create pending reward
            await db.referral_rewards.insert_one({
                "user_id": referrer.user_id,
                "kind": "CREDIT",
                "amount": 50.00,  # R50 signup bonus
                "status": "PENDING"
            })
    
    return {"user": new_user}
```

---

## 🚀 **10) DEPLOYMENT INSTRUCTIONS**

### **Backend Setup**
1. Run database migrations for all new tables
2. Configure Mailgun API keys for notifications
3. Set up Paystack API for referral payouts
4. Enable Redis for real-time event caching
5. Configure rate limiting and hCaptcha

### **Frontend Integration**
1. Wire admin controls to REST endpoints
2. Add real-time message components
3. Integrate notification system
4. Set up referral tracking scripts
5. Add admin moderation interfaces

### **Environment Variables**
```bash
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=your_domain
PAYSTACK_SECRET_KEY=your_paystack_key
REDIS_URL=your_redis_url
HCAPTCHA_SECRET=your_hcaptcha_secret
```

---

**🎉 COMPLETE SYSTEM READY FOR IMPLEMENTATION!**

This specification provides everything needed to build a production-ready messaging, referrals, and notification system that integrates seamlessly with the admin dashboard we built.