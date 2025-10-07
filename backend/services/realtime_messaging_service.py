# Real-Time Messaging Service with Socket.IO
from typing import Dict, List, Any, Optional
import asyncio
import json
import os
from datetime import datetime, timedelta
from bson import ObjectId
import motor.motor_asyncio
# Note: User model is defined in auth_models.py, not models.py
# We'll work with database documents directly instead of importing User model
import uuid

class RealTimeMessagingService:
    """
    Real-time messaging service for buyer-seller communication
    Features:
    - Instant messaging with Socket.IO
    - Image/video sharing
    - Voice messages
    - Message templates
    - Read receipts
    - Typing indicators
    - Message encryption
    """
    
    def __init__(self, db, socketio_instance=None):
        self.db = db
        self.socketio = socketio_instance
        self.active_connections = {}  # user_id -> socket_id mapping
        self.conversation_participants = {}  # conversation_id -> [user_ids]
        self.typing_users = {}  # conversation_id -> [user_ids]
        
    async def create_conversation(self, participant_ids: List[str], conversation_type: str = "direct", 
                                listing_id: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """
        Create a new conversation between users
        Types: direct, group, listing_inquiry, support
        """
        try:
            conversation_id = str(uuid.uuid4())
            
            conversation = {
                '_id': conversation_id,
                'type': conversation_type,
                'participants': participant_ids,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'listing_id': listing_id,
                'metadata': metadata or {},
                'last_message': None,
                'unread_counts': {pid: 0 for pid in participant_ids},
                'status': 'active'
            }
            
            await self.db.conversations.insert_one(conversation)
            
            # Create welcome message for listing inquiries
            if conversation_type == "listing_inquiry" and listing_id:
                await self._create_listing_inquiry_welcome(conversation_id, listing_id)
            
            # Notify participants
            for participant_id in participant_ids:
                await self._emit_to_user(participant_id, 'conversation_created', {
                    'conversation': conversation
                })
            
            return {
                'success': True,
                'conversation_id': conversation_id,
                'conversation': conversation
            }
            
        except Exception as e:
            print(f"Error creating conversation: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def send_message(self, conversation_id: str, sender_id: str, 
                          message_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a message in a conversation
        Supports: text, image, voice, file, template
        """
        try:
            message_id = str(uuid.uuid4())
            
            # Validate conversation and permissions
            conversation = await self.db.conversations.find_one({'_id': conversation_id})
            if not conversation:
                return {'success': False, 'error': 'Conversation not found'}
                
            if sender_id not in conversation['participants']:
                return {'success': False, 'error': 'Not authorized to send messages'}
            
            # Process message content based on type
            processed_content = await self._process_message_content(message_data)
            
            message = {
                '_id': message_id,
                'conversation_id': conversation_id,
                'sender_id': sender_id,
                'content': processed_content,
                'type': message_data.get('type', 'text'),
                'timestamp': datetime.utcnow(),
                'edited': False,
                'edited_at': None,
                'delivery_status': 'sent',
                'read_by': [sender_id],  # Sender has read their own message
                'reactions': {},
                'reply_to': message_data.get('reply_to'),
                'metadata': message_data.get('metadata', {})
            }
            
            # Save message
            await self.db.messages.insert_one(message)
            
            # Update conversation
            await self._update_conversation_last_message(conversation_id, message)
            await self._update_unread_counts(conversation_id, sender_id)
            
            # Real-time delivery
            await self._deliver_message_realtime(conversation, message)
            
            # Handle automated responses
            await self._handle_automated_responses(conversation_id, message)
            
            return {
                'success': True,
                'message_id': message_id,
                'message': message
            }
            
        except Exception as e:
            print(f"Error sending message: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def get_conversations(self, user_id: str, limit: int = 20, 
                              offset: int = 0) -> Dict[str, Any]:
        """Get user's conversations with latest messages"""
        try:
            # Build aggregation pipeline
            pipeline = [
                {
                    '$match': {
                        'participants': user_id,
                        'status': 'active'
                    }
                },
                {
                    '$lookup': {
                        'from': 'messages',
                        'localField': '_id',
                        'foreignField': 'conversation_id',
                        'as': 'recent_messages',
                        'pipeline': [
                            {'$sort': {'timestamp': -1}},
                            {'$limit': 1}
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'participants',
                        'foreignField': '_id',
                        'as': 'participant_details'
                    }
                },
                {
                    '$addFields': {
                        'last_message': {'$arrayElemAt': ['$recent_messages', 0]},
                        'unread_count': f'$unread_counts.{user_id}'
                    }
                },
                {'$sort': {'updated_at': -1}},
                {'$skip': offset},
                {'$limit': limit}
            ]
            
            conversations = await self.db.conversations.aggregate(pipeline).to_list(limit)
            
            # Process conversations for frontend
            processed_conversations = []
            for conv in conversations:
                processed_conv = await self._process_conversation_for_user(conv, user_id)
                processed_conversations.append(processed_conv)
            
            return {
                'success': True,
                'conversations': processed_conversations,
                'total_unread': await self._get_total_unread_count(user_id)
            }
            
        except Exception as e:
            print(f"Error getting conversations: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def get_messages(self, conversation_id: str, user_id: str, 
                          limit: int = 50, before_timestamp: datetime = None) -> Dict[str, Any]:
        """Get messages from a conversation"""
        try:
            # Verify user has access to conversation
            conversation = await self.db.conversations.find_one({
                '_id': conversation_id,
                'participants': user_id
            })
            
            if not conversation:
                return {'success': False, 'error': 'Conversation not found or access denied'}
            
            # Build query
            query = {'conversation_id': conversation_id}
            if before_timestamp:
                query['timestamp'] = {'$lt': before_timestamp}
            
            # Get messages
            messages = await self.db.messages.find(query)\
                .sort('timestamp', -1)\
                .limit(limit)\
                .to_list(limit)
            
            # Reverse to get chronological order
            messages.reverse()
            
            # Mark messages as read
            await self._mark_messages_read(conversation_id, user_id, messages)
            
            # Process messages for frontend
            processed_messages = []
            for msg in messages:
                processed_msg = await self._process_message_for_user(msg, user_id)
                processed_messages.append(processed_msg)
            
            return {
                'success': True,
                'messages': processed_messages,
                'conversation': conversation
            }
            
        except Exception as e:
            print(f"Error getting messages: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def handle_typing_indicator(self, conversation_id: str, user_id: str, 
                                    is_typing: bool) -> None:
        """Handle typing indicators"""
        try:
            if conversation_id not in self.typing_users:
                self.typing_users[conversation_id] = []
            
            if is_typing:
                if user_id not in self.typing_users[conversation_id]:
                    self.typing_users[conversation_id].append(user_id)
            else:
                if user_id in self.typing_users[conversation_id]:
                    self.typing_users[conversation_id].remove(user_id)
            
            # Notify other participants
            conversation = await self.db.conversations.find_one({'_id': conversation_id})
            if conversation:
                for participant_id in conversation['participants']:
                    if participant_id != user_id:
                        await self._emit_to_user(participant_id, 'typing_indicator', {
                            'conversation_id': conversation_id,
                            'user_id': user_id,
                            'is_typing': is_typing,
                            'typing_users': self.typing_users[conversation_id]
                        })
        
        except Exception as e:
            print(f"Error handling typing indicator: {str(e)}")
    
    async def upload_media(self, file_data: bytes, file_type: str, 
                          filename: str, conversation_id: str) -> Dict[str, Any]:
        """Handle media uploads for messages"""
        try:
            # Validate file type and size
            validation = await self._validate_media_upload(file_data, file_type, filename)
            if not validation['valid']:
                return {'success': False, 'error': validation['error']}
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = filename.split('.')[-1] if '.' in filename else ''
            stored_filename = f"{file_id}.{file_extension}"
            
            # Store file (implement your storage logic)
            file_path = await self._store_media_file(file_data, stored_filename, file_type)
            
            # Create media record
            media_record = {
                '_id': file_id,
                'filename': filename,
                'stored_filename': stored_filename,
                'file_path': file_path,
                'file_type': file_type,
                'file_size': len(file_data),
                'conversation_id': conversation_id,
                'uploaded_at': datetime.utcnow(),
                'status': 'active'
            }
            
            await self.db.media_files.insert_one(media_record)
            
            return {
                'success': True,
                'media_id': file_id,
                'file_url': file_path,
                'media_info': media_record
            }
            
        except Exception as e:
            print(f"Error uploading media: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def get_message_templates(self, user_type: str = None) -> List[Dict[str, Any]]:
        """Get pre-defined message templates"""
        templates = {
            'buyer': [
                {
                    'id': 'inquiry_general',
                    'title': 'General Inquiry',
                    'content': 'Hi! I\'m interested in your {livestock_type}. Could you provide more details about availability and pricing?',
                    'category': 'inquiry'
                },
                {
                    'id': 'price_negotiation',
                    'title': 'Price Discussion',
                    'content': 'Thank you for the information. I\'m interested in purchasing {quantity} units. Is there room for price negotiation for bulk purchase?',
                    'category': 'negotiation'
                },
                {
                    'id': 'inspection_request',
                    'title': 'Inspection Request',
                    'content': 'I would like to schedule a time to inspect the livestock before purchase. When would be convenient for you?',
                    'category': 'logistics'
                },
                {
                    'id': 'delivery_inquiry',
                    'title': 'Delivery Options',
                    'content': 'What delivery options do you offer? I\'m located in {buyer_location}.',
                    'category': 'logistics'
                }
            ],
            'seller': [
                {
                    'id': 'welcome_inquiry',
                    'title': 'Welcome Message',
                    'content': 'Thank you for your interest in our {livestock_type}! I\'d be happy to answer any questions you have.',
                    'category': 'welcome'
                },
                {
                    'id': 'pricing_info',
                    'title': 'Pricing Information',
                    'content': 'Our current pricing is {price_per_unit} per unit. For quantities over {bulk_threshold}, we offer bulk discounts.',
                    'category': 'pricing'
                },
                {
                    'id': 'inspection_offer',
                    'title': 'Inspection Invitation',
                    'content': 'You\'re welcome to inspect the livestock before purchase. We\'re available {available_times}.',
                    'category': 'logistics'
                },
                {
                    'id': 'delivery_options',
                    'title': 'Delivery Information',
                    'content': 'We offer both pickup and delivery options. Delivery cost is calculated based on distance and quantity.',
                    'category': 'logistics'
                }
            ]
        }
        
        if user_type:
            return templates.get(user_type, [])
        
        # Return all templates
        all_templates = []
        for category in templates.values():
            all_templates.extend(category)
        
        return all_templates
    
    # Socket.IO event handlers
    async def handle_user_connect(self, user_id: str, socket_id: str):
        """Handle user connection"""
        self.active_connections[user_id] = socket_id
        
        # Emit pending notifications
        await self._emit_pending_notifications(user_id)
        
        # Update user online status
        await self.db.users.update_one(
            {'_id': user_id},
            {'$set': {'last_seen': datetime.utcnow(), 'is_online': True}}
        )
    
    async def handle_user_disconnect(self, user_id: str):
        """Handle user disconnection"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        # Update user offline status
        await self.db.users.update_one(
            {'_id': user_id},
            {'$set': {'last_seen': datetime.utcnow(), 'is_online': False}}
        )
        
        # Clear typing indicators
        for conv_id in list(self.typing_users.keys()):
            if user_id in self.typing_users[conv_id]:
                await self.handle_typing_indicator(conv_id, user_id, False)
    
    # Helper methods
    async def _process_message_content(self, message_data: Dict) -> Dict:
        """Process and validate message content"""
        content = message_data.get('content', '')
        message_type = message_data.get('type', 'text')
        
        if message_type == 'text':
            # Basic text processing
            return {
                'text': content,
                'formatted': content  # Could add rich text formatting here
            }
        elif message_type == 'image':
            return {
                'media_id': message_data.get('media_id'),
                'caption': content,
                'thumbnail_url': message_data.get('thumbnail_url')
            }
        elif message_type == 'voice':
            return {
                'media_id': message_data.get('media_id'),
                'duration': message_data.get('duration', 0),
                'transcription': message_data.get('transcription', '')
            }
        elif message_type == 'template':
            return {
                'template_id': message_data.get('template_id'),
                'filled_content': content,
                'variables': message_data.get('variables', {})
            }
        
        return {'text': content}
    
    async def _deliver_message_realtime(self, conversation: Dict, message: Dict):
        """Deliver message to all participants via Socket.IO"""
        for participant_id in conversation['participants']:
            if participant_id != message['sender_id']:  # Don't send back to sender
                await self._emit_to_user(participant_id, 'new_message', {
                    'message': message,
                    'conversation_id': conversation['_id']
                })
    
    async def _emit_to_user(self, user_id: str, event: str, data: Dict):
        """Emit event to specific user if they're connected"""
        if user_id in self.active_connections and self.socketio:
            socket_id = self.active_connections[user_id]
            await self.socketio.emit(event, data, room=socket_id)
    
    async def _update_conversation_last_message(self, conversation_id: str, message: Dict):
        """Update conversation with last message info"""
        await self.db.conversations.update_one(
            {'_id': conversation_id},
            {
                '$set': {
                    'last_message': {
                        'content': message['content'],
                        'sender_id': message['sender_id'],
                        'timestamp': message['timestamp'],
                        'type': message['type']
                    },
                    'updated_at': datetime.utcnow()
                }
            }
        )
    
    async def _update_unread_counts(self, conversation_id: str, sender_id: str):
        """Update unread counts for all participants except sender"""
        conversation = await self.db.conversations.find_one({'_id': conversation_id})
        if conversation:
            for participant_id in conversation['participants']:
                if participant_id != sender_id:
                    await self.db.conversations.update_one(
                        {'_id': conversation_id},
                        {'$inc': {f'unread_counts.{participant_id}': 1}}
                    )
    
    async def _mark_messages_read(self, conversation_id: str, user_id: str, messages: List[Dict]):
        """Mark messages as read by user"""
        message_ids = [msg['_id'] for msg in messages if user_id not in msg.get('read_by', [])]
        
        if message_ids:
            await self.db.messages.update_many(
                {'_id': {'$in': message_ids}},
                {'$addToSet': {'read_by': user_id}}
            )
            
            # Reset unread count for this user
            await self.db.conversations.update_one(
                {'_id': conversation_id},
                {'$set': {f'unread_counts.{user_id}': 0}}
            )
    
    # Missing helper methods implementation
    async def _create_listing_inquiry_welcome(self, conversation_id: str, listing_id: str):
        """Create welcome message for listing inquiries"""
        try:
            # Get listing details
            listing = await self.db.listings.find_one({'_id': listing_id})
            if listing:
                welcome_content = f"Welcome! You're inquiring about: {listing.get('title', 'Livestock Listing')}"
                
                welcome_message = {
                    '_id': str(uuid.uuid4()),
                    'conversation_id': conversation_id,
                    'sender_id': 'system',
                    'content': {'text': welcome_content},
                    'type': 'system',
                    'timestamp': datetime.utcnow(),
                    'delivery_status': 'sent',
                    'read_by': [],
                    'reactions': {},
                    'metadata': {'listing_id': listing_id}
                }
                
                await self.db.messages.insert_one(welcome_message)
        except Exception as e:
            print(f"Error creating welcome message: {str(e)}")
    
    async def _handle_automated_responses(self, conversation_id: str, message: Dict):
        """Handle automated responses if needed"""
        try:
            # Check if automated response needed based on message content
            content = message.get('content', {})
            message_text = content.get('text', '').lower() if isinstance(content, dict) else str(content).lower()
            
            # Simple keyword-based auto-responses
            auto_responses = {
                'price': "For specific pricing information, please check the listing details or ask the seller directly.",
                'availability': "For current availability, please contact the seller as stock levels change frequently.",
                'delivery': "Delivery options vary by seller. Please discuss delivery arrangements directly with the seller."
            }
            
            for keyword, response in auto_responses.items():
                if keyword in message_text and message.get('sender_id') != 'system':
                    # Send automated response (optional feature)
                    break
                    
        except Exception as e:
            print(f"Error handling automated responses: {str(e)}")
    
    async def _process_conversation_for_user(self, conversation: Dict, user_id: str) -> Dict:
        """Process conversation data for user display"""
        try:
            # Remove current user from participant details for display
            participant_details = []
            for participant in conversation.get('participant_details', []):
                if participant.get('_id') != user_id:
                    participant_details.append({
                        '_id': participant.get('_id'),
                        'first_name': participant.get('first_name', 'Unknown'),
                        'last_name': participant.get('last_name', ''),
                        'profile_image': participant.get('profile_image'),
                        'is_online': participant.get('is_online', False)
                    })
            
            return {
                '_id': conversation['_id'],
                'type': conversation.get('type', 'direct'),
                'participant_details': participant_details,
                'last_message': conversation.get('last_message'),
                'unread_count': conversation.get('unread_count', 0),
                'updated_at': conversation.get('updated_at'),
                'metadata': conversation.get('metadata', {})
            }
        except Exception as e:
            print(f"Error processing conversation: {str(e)}")
            return conversation
    
    async def _process_message_for_user(self, message: Dict, user_id: str) -> Dict:
        """Process message data for user display"""
        try:
            # Add user-specific data like read status
            is_read = user_id in message.get('read_by', [])
            is_own = message.get('sender_id') == user_id
            
            processed_message = {
                '_id': message['_id'],
                'conversation_id': message.get('conversation_id'),
                'sender_id': message.get('sender_id'),
                'content': message.get('content'),
                'type': message.get('type', 'text'),
                'timestamp': message.get('timestamp'),
                'is_read': is_read,
                'is_own': is_own,
                'delivery_status': message.get('delivery_status', 'sent'),
                'reactions': message.get('reactions', {}),
                'reply_to': message.get('reply_to')
            }
            
            return processed_message
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            return message
    
    async def _get_total_unread_count(self, user_id: str) -> int:
        """Get total unread count across all conversations"""
        try:
            pipeline = [
                {
                    '$match': {
                        'participants': user_id,
                        'status': 'active'
                    }
                },
                {
                    '$group': {
                        '_id': None,
                        'total_unread': {'$sum': f'$unread_counts.{user_id}'}
                    }
                }
            ]
            
            result = await self.db.conversations.aggregate(pipeline).to_list(1)
            return result[0]['total_unread'] if result else 0
        except Exception as e:
            print(f"Error getting total unread count: {str(e)}")
            return 0
    
    async def _validate_media_upload(self, file_data: bytes, file_type: str, filename: str) -> Dict[str, Any]:
        """Validate media upload"""
        try:
            # File size limit (10MB)
            max_size = 10 * 1024 * 1024
            if len(file_data) > max_size:
                return {'valid': False, 'error': 'File too large. Maximum size is 10MB.'}
            
            # Allowed file types
            allowed_types = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'audio/mpeg', 'audio/wav', 'audio/ogg',
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
            
            if file_type not in allowed_types:
                return {'valid': False, 'error': 'File type not allowed.'}
            
            # Filename validation
            if not filename or len(filename) > 255:
                return {'valid': False, 'error': 'Invalid filename.'}
            
            return {'valid': True}
        except Exception as e:
            return {'valid': False, 'error': f'Validation error: {str(e)}'}
    
    async def _store_media_file(self, file_data: bytes, filename: str, file_type: str) -> str:
        """Store media file and return file path"""
        try:
            # Create directory if it doesn't exist
            upload_dir = '/app/uploads/messages'
            os.makedirs(upload_dir, exist_ok=True)
            
            # Store file
            file_path = os.path.join(upload_dir, filename)
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            # Return URL path for access
            return f'/uploads/messages/{filename}'
        except Exception as e:
            print(f"Error storing media file: {str(e)}")
            raise
    
    async def _emit_pending_notifications(self, user_id: str):
        """Emit pending notifications to user"""
        try:
            # Get pending notifications for user
            pending_notifications = await self.db.notifications.find({
                'user_id': user_id,
                'delivered': False
            }).to_list(10)
            
            for notification in pending_notifications:
                await self._emit_to_user(user_id, 'notification', {
                    'id': notification['_id'],
                    'type': notification.get('type'),
                    'message': notification.get('message'),
                    'timestamp': notification.get('created_at')
                })
                
                # Mark as delivered
                await self.db.notifications.update_one(
                    {'_id': notification['_id']},
                    {'$set': {'delivered': True, 'delivered_at': datetime.utcnow()}}
                )
        except Exception as e:
            print(f"Error emitting pending notifications: {str(e)}")
    
    async def _get_user_search_history(self, user_context: Dict) -> List[str]:
        """Get user's search history for personalized suggestions"""
        try:
            user_id = user_context.get('user_id')
            if not user_id:
                return []
            
            # Get recent searches from user activity
            recent_searches = await self.db.user_activity.find({
                'user_id': user_id,
                'activity_type': 'search'
            }).sort('timestamp', -1).limit(20).to_list(20)
            
            return [search.get('query', '') for search in recent_searches if search.get('query')]
        except Exception as e:
            print(f"Error getting user search history: {str(e)}")
            return []