import os
import logging
import openai
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import json
import uuid
from collections import Counter
from .website_info_fetcher import WebsiteInfoFetcher

logger = logging.getLogger(__name__)

class MLFAQService:
    def __init__(self, db):
        self.db = db
        self.openai_client = openai.OpenAI(
            api_key=os.environ.get('OPENAI_API_KEY')
        )
        self.embedding_model = "text-embedding-3-large"
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.website_fetcher = WebsiteInfoFetcher()
        
    async def ingest_questions_from_sources(self) -> Dict[str, Any]:
        """Ingest and process questions from multiple sources"""
        
        try:
            questions_data = []
            
            # 1. Support tickets (messages marked as questions)
            support_questions = await self._extract_support_questions()
            questions_data.extend(support_questions)
            
            # 2. Buy request notes (first message/question pattern)
            request_questions = await self._extract_buy_request_questions()
            questions_data.extend(request_questions)
            
            # 3. Search queries with no results
            search_questions = await self._extract_failed_searches()
            questions_data.extend(search_questions)
            
            # 4. Message thread first messages
            thread_questions = await self._extract_thread_questions()
            questions_data.extend(thread_questions)
            
            # Normalize and clean questions
            cleaned_questions = []
            for question_data in questions_data:
                cleaned = await self._normalize_question(question_data)
                if cleaned:
                    cleaned_questions.append(cleaned)
            
            # Deduplicate similar questions
            deduplicated = await self._deduplicate_questions(cleaned_questions)
            
            # Store in knowledge base
            ingestion_id = str(uuid.uuid4())
            ingestion_record = {
                "id": ingestion_id,
                "ingested_at": datetime.now(timezone.utc),
                "total_raw_questions": len(questions_data),
                "cleaned_questions": len(cleaned_questions),
                "deduplicated_questions": len(deduplicated),
                "questions": deduplicated
            }
            
            await self.db.faq_ingestions.insert_one(ingestion_record)
            
            return {
                "success": True,
                "ingestion_id": ingestion_id,
                "stats": {
                    "raw_questions": len(questions_data),
                    "cleaned": len(cleaned_questions),
                    "deduplicated": len(deduplicated)
                }
            }
            
        except Exception as e:
            logger.error(f"FAQ ingestion failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _extract_support_questions(self) -> List[Dict[str, Any]]:
        """Extract questions from support tickets and messages"""
        
        try:
            # Get messages that look like questions
            cursor = self.db.messages.find({
                "message": {"$regex": r"\?", "$options": "i"},
                "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=30)}
            }).limit(100)
            
            messages = await cursor.to_list(length=None)
            
            questions = []
            for msg in messages:
                if self._is_question(msg.get("message", "")):
                    questions.append({
                        "text": msg["message"],
                        "source": "support_ticket",
                        "user_id": msg.get("sender_id"),
                        "created_at": msg.get("created_at"),
                        "context": {
                            "thread_id": msg.get("thread_id"),
                            "category": "support"
                        }
                    })
            
            return questions
            
        except Exception as e:
            logger.error(f"Support question extraction failed: {e}")
            return []
    
    async def _extract_buy_request_questions(self) -> List[Dict[str, Any]]:
        """Extract questions from buy request notes"""
        
        try:
            cursor = self.db.buy_requests.find({
                "notes": {"$regex": r"\?", "$options": "i"},
                "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=30)}
            }).limit(100)
            
            requests = await cursor.to_list(length=None)
            
            questions = []
            for req in requests:
                notes = req.get("notes", "")
                if self._is_question(notes):
                    questions.append({
                        "text": notes,
                        "source": "buy_request",
                        "user_id": req.get("buyer_id"),
                        "created_at": req.get("created_at"),
                        "context": {
                            "species": req.get("species"),
                            "product_type": req.get("product_type"),
                            "category": "buy_request"
                        }
                    })
            
            return questions
            
        except Exception as e:
            logger.error(f"Buy request question extraction failed: {e}")
            return []
    
    async def _extract_failed_searches(self) -> List[Dict[str, Any]]:
        """Extract search queries that returned no results"""
        
        try:
            # This would require search logging - placeholder for now
            cursor = self.db.search_logs.find({
                "results_count": 0,
                "query": {"$ne": ""},
                "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=7)}
            }).limit(50)
            
            searches = await cursor.to_list(length=None)
            
            questions = []
            for search in searches:
                query = search.get("query", "")
                if len(query) > 3:  # Meaningful queries only
                    questions.append({
                        "text": f"How do I find {query}?",
                        "source": "failed_search",
                        "user_id": search.get("user_id"),
                        "created_at": search.get("created_at"),
                        "context": {
                            "original_query": query,
                            "category": "search"
                        }
                    })
            
            return questions
            
        except Exception as e:
            logger.error(f"Failed search extraction failed: {e}")
            return []
    
    async def _extract_thread_questions(self) -> List[Dict[str, Any]]:
        """Extract first messages from conversation threads that are questions"""
        
        try:
            # Get first message in each thread that's a question
            pipeline = [
                {"$sort": {"created_at": 1}},
                {"$group": {
                    "_id": "$thread_id",
                    "first_message": {"$first": "$$ROOT"}
                }},
                {"$match": {
                    "first_message.message": {"$regex": r"\?", "$options": "i"}
                }},
                {"$limit": 50}
            ]
            
            cursor = self.db.messages.aggregate(pipeline)
            threads = await cursor.to_list(length=None)
            
            questions = []
            for thread in threads:
                msg = thread["first_message"]
                if self._is_question(msg.get("message", "")):
                    questions.append({
                        "text": msg["message"],
                        "source": "thread_start",
                        "user_id": msg.get("sender_id"),
                        "created_at": msg.get("created_at"),
                        "context": {
                            "thread_id": msg.get("thread_id"),
                            "category": "conversation"
                        }
                    })
            
            return questions
            
        except Exception as e:
            logger.error(f"Thread question extraction failed: {e}")
            return []
    
    def _is_question(self, text: str) -> bool:
        """Determine if text is a question"""
        if not text or len(text.strip()) < 10:
            return False
        
        # Check for question patterns
        question_patterns = [
            r'\?',  # Contains question mark
            r'^(how|what|where|when|why|which|who)',  # Starts with question words
            r'^(can|could|would|should|do|does|did|is|are|was|were)',  # Question verbs
            r'(help|explain|clarify|understand)'  # Help-seeking words
        ]
        
        text_lower = text.lower()
        return any(re.search(pattern, text_lower) for pattern in question_patterns)
    
    async def _normalize_question(self, question_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Normalize and clean question text"""
        
        try:
            text = question_data.get("text", "").strip()
            if not text:
                return None
            
            # Remove PII patterns
            text = self._redact_pii(text)
            
            # Clean and normalize
            text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
            text = text[:500]  # Limit length
            
            # Language detection (simple check for English)
            if not self._is_english(text):
                return None
            
            return {
                **question_data,
                "normalized_text": text,
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Question normalization failed: {e}")
            return None
    
    def _redact_pii(self, text: str) -> str:
        """Remove personally identifiable information"""
        
        # Email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
        
        # Phone numbers (South African format)
        text = re.sub(r'\b(?:\+27|0)[0-9]{9}\b', '[PHONE]', text)
        
        # ID numbers (13 digits)
        text = re.sub(r'\b[0-9]{13}\b', '[ID_NUMBER]', text)
        
        # Bank account numbers
        text = re.sub(r'\b[0-9]{8,12}\b', '[ACCOUNT]', text)
        
        return text
    
    def _is_english(self, text: str) -> bool:
        """Simple English language detection"""
        # Basic check - contains common English words
        english_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'where', 'when', 'why'}
        words = set(text.lower().split())
        return len(words.intersection(english_words)) > 0
    
    async def _deduplicate_questions(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate or very similar questions"""
        
        if not questions:
            return []
        
        try:
            # Extract texts for similarity comparison
            texts = [q.get("normalized_text", "") for q in questions]
            
            # Simple TF-IDF based deduplication
            if len(texts) > 1:
                tfidf_matrix = self.vectorizer.fit_transform(texts)
                similarity_matrix = cosine_similarity(tfidf_matrix)
                
                # Group similar questions (similarity > 0.8)
                keep_indices = []
                processed = set()
                
                for i, question in enumerate(questions):
                    if i in processed:
                        continue
                    
                    keep_indices.append(i)
                    
                    # Mark similar questions as processed
                    for j in range(i + 1, len(questions)):
                        if similarity_matrix[i][j] > 0.8:
                            processed.add(j)
                
                return [questions[i] for i in keep_indices]
            
            return questions
            
        except Exception as e:
            logger.error(f"Deduplication failed: {e}")
            return questions
    
    async def cluster_questions(self, ingestion_id: str) -> Dict[str, Any]:
        """Cluster similar questions and generate topics"""
        
        try:
            # Get ingested questions
            ingestion = await self.db.faq_ingestions.find_one({"id": ingestion_id})
            if not ingestion:
                raise ValueError("Ingestion not found")
            
            questions = ingestion.get("questions", [])
            if len(questions) < 3:
                return {"success": False, "error": "Not enough questions to cluster"}
            
            # Generate embeddings
            texts = [q["normalized_text"] for q in questions]
            embeddings = await self._generate_embeddings(texts)
            
            # Determine number of clusters (heuristic: sqrt of questions, max 20)
            n_clusters = min(20, max(3, int(np.sqrt(len(questions)))))
            
            # Perform clustering
            clustering = KMeans(n_clusters=n_clusters, random_state=42)
            cluster_labels = clustering.fit_predict(embeddings)
            
            # Group questions by cluster
            clusters = {}
            for i, (question, label) in enumerate(zip(questions, cluster_labels)):
                if label not in clusters:
                    clusters[label] = []
                clusters[label].append(question)
            
            # Generate cluster topics and keywords
            cluster_results = []
            for cluster_id, cluster_questions in clusters.items():
                topic_info = await self._analyze_cluster_topic(cluster_questions)
                
                cluster_results.append({
                    "cluster_id": cluster_id,
                    "question_count": len(cluster_questions),
                    "topic": topic_info["topic"],
                    "keywords": topic_info["keywords"],
                    "representative_questions": cluster_questions[:3],  # Top 3 questions
                    "needs_answer": not topic_info.get("has_existing_answer", False)
                })
            
            # Save clustering results
            clustering_record = {
                "id": str(uuid.uuid4()),
                "ingestion_id": ingestion_id,
                "clustered_at": datetime.now(timezone.utc),
                "n_clusters": n_clusters,
                "total_questions": len(questions),
                "clusters": cluster_results
            }
            
            await self.db.faq_clusters.insert_one(clustering_record)
            
            return {
                "success": True,
                "clustering_id": clustering_record["id"],
                "stats": {
                    "total_questions": len(questions),
                    "clusters_created": len(cluster_results),
                    "need_answers": sum(1 for c in cluster_results if c["needs_answer"])
                }
            }
            
        except Exception as e:
            logger.error(f"Question clustering failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts using OpenAI"""
        
        try:
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=texts
            )
            
            embeddings = [item.embedding for item in response.data]
            return np.array(embeddings)
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            # Fallback to TF-IDF
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            return tfidf_matrix.toarray()
    
    async def _analyze_cluster_topic(self, questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze cluster to determine topic and keywords"""
        
        try:
            texts = [q["normalized_text"] for q in questions]
            
            # Extract keywords using TF-IDF
            tfidf = TfidfVectorizer(max_features=10, stop_words='english', ngram_range=(1, 2))
            tfidf_matrix = tfidf.fit_transform(texts)
            
            feature_names = tfidf.get_feature_names_out()
            scores = tfidf_matrix.sum(axis=0).A1
            keywords = [feature_names[i] for i in scores.argsort()[-5:][::-1]]
            
            # Generate topic using LLM
            sample_questions = "\n".join([f"- {q['normalized_text']}" for q in questions[:5]])
            
            prompt = f"""Analyze these similar questions and provide a concise topic/category:

Questions:
{sample_questions}

Provide a JSON response with:
- topic: A clear, concise topic name (2-4 words)
- category: One of [buying, selling, payments, delivery, account, livestock, technical, policy]
- has_existing_answer: true if this is covered in standard FAQ/documentation
"""
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are analyzing customer support questions for a livestock marketplace. Respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            analysis = json.loads(response.choices[0].message.content)
            
            return {
                "topic": analysis.get("topic", "General Questions"),
                "category": analysis.get("category", "general"),
                "keywords": keywords,
                "has_existing_answer": analysis.get("has_existing_answer", False)
            }
            
        except Exception as e:
            logger.error(f"Topic analysis failed: {e}")
            return {
                "topic": "General Questions",
                "category": "general", 
                "keywords": ["question", "help"],
                "has_existing_answer": False
            }
    
    async def generate_draft_answers(self, clustering_id: str) -> Dict[str, Any]:
        """Generate draft answers for clusters that need them"""
        
        try:
            # Get clustering results
            clustering = await self.db.faq_clusters.find_one({"id": clustering_id})
            if not clustering:
                raise ValueError("Clustering not found")
            
            # Get knowledge base content
            knowledge_base = await self._get_knowledge_base()
            
            draft_answers = []
            
            for cluster in clustering.get("clusters", []):
                if cluster.get("needs_answer", False):
                    draft = await self._generate_cluster_answer(cluster, knowledge_base)
                    if draft:
                        draft_answers.append(draft)
            
            # Save draft answers for admin review
            draft_record = {
                "id": str(uuid.uuid4()),
                "clustering_id": clustering_id,
                "generated_at": datetime.now(timezone.utc),
                "draft_answers": draft_answers,
                "status": "pending_review"
            }
            
            await self.db.faq_draft_answers.insert_one(draft_record)
            
            return {
                "success": True,
                "draft_id": draft_record["id"],
                "answers_generated": len(draft_answers)
            }
            
        except Exception as e:
            logger.error(f"Draft answer generation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _get_knowledge_base(self) -> str:
        """Get existing knowledge base content"""
        
        # This would fetch from your existing documentation
        knowledge_base = """
        StockLot Livestock Marketplace Knowledge Base:
        
        BUYING PROCESS:
        - Create buy requests with species, quantity, location
        - Receive offers from verified sellers
        - Accept offers and proceed to secure checkout
        - Payment held in escrow until delivery confirmed
        
        SELLING PROCESS:
        - Create seller profile and verify account
        - Browse buy requests in your service area
        - Send offers with competitive pricing
        - Fulfill orders after payment confirmation
        
        PAYMENTS & FEES:
        - 2.5% platform fee on merchandise value
        - 15% VAT on platform fees
        - Secure escrow protection for all transactions
        - Paystack payment processing
        
        DELIVERY:
        - Seller delivery, buyer pickup, or third-party logistics
        - Distance-based delivery cost calculation
        - Delivery must match buyer specifications
        
        LIVESTOCK CATEGORIES:
        - Cattle: Live animals, day-old, breeding stock
        - Poultry: Chickens, eggs, day-old chicks
        - Sheep & Goats: Live animals, breeding stock
        - Swine: Live pigs, breeding stock
        
        ACCOUNT & VERIFICATION:
        - KYC required for high-value or live animal transactions
        - Service area setup for sellers
        - Address management for buyers
        """
        
        return knowledge_base
    
    async def _generate_cluster_answer(
        self, 
        cluster: Dict[str, Any], 
        knowledge_base: str
    ) -> Optional[Dict[str, Any]]:
        """Generate answer for a specific question cluster"""
        
        try:
            questions = cluster.get("representative_questions", [])
            topic = cluster.get("topic", "")
            
            if not questions:
                return None
            
            sample_questions = "\n".join([f"- {q['normalized_text']}" for q in questions])
            
            prompt = f"""Based on the knowledge base, generate a helpful answer for these related questions about "{topic}":

Questions:
{sample_questions}

Knowledge Base:
{knowledge_base}

Generate a JSON response with:
- title: Clear FAQ title (question format)
- answer: Comprehensive but concise answer
- category: One of [buying, selling, payments, delivery, account, livestock, technical, policy]
- keywords: Array of relevant search keywords
- confidence: How confident you are this answers the questions (0-100)

Make the answer helpful, accurate, and specific to livestock marketplace context.
"""
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for a livestock marketplace. Generate accurate FAQ answers based on the knowledge base."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            draft = json.loads(response.choices[0].message.content)
            
            return {
                "cluster_id": cluster["cluster_id"],
                "title": draft.get("title", f"Questions about {topic}"),
                "answer": draft.get("answer", ""),
                "category": draft.get("category", "general"),
                "keywords": draft.get("keywords", []),
                "confidence": draft.get("confidence", 50),
                "source_questions": len(questions),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Cluster answer generation failed: {e}")
            return None
    
    async def semantic_search_faq(
        self, 
        query: str, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search FAQ using semantic similarity"""
        
        try:
            # Get published FAQ entries
            cursor = self.db.faq_entries.find({"status": "published"})
            faq_entries = await cursor.to_list(length=None)
            
            if not faq_entries:
                return []
            
            # Generate query embedding
            query_embedding = await self._generate_embeddings([query])
            query_vector = query_embedding[0]
            
            # Calculate similarities
            results = []
            for entry in faq_entries:
                entry_embedding = entry.get("embedding")
                if entry_embedding:
                    similarity = cosine_similarity([query_vector], [entry_embedding])[0][0]
                    results.append({
                        "entry": entry,
                        "similarity": float(similarity)
                    })
            
            # Sort by similarity and return top results
            results.sort(key=lambda x: x["similarity"], reverse=True)
            
            return [
                {
                    "id": r["entry"]["id"],
                    "title": r["entry"]["title"],
                    "answer": r["entry"]["answer"],
                    "category": r["entry"]["category"],
                    "similarity": r["similarity"],
                    "keywords": r["entry"].get("keywords", [])
                }
                for r in results[:limit]
                if r["similarity"] > 0.7  # Minimum similarity threshold
            ]
            
        except Exception as e:
            logger.error(f"FAQ semantic search failed: {e}")
            return []
    
    async def record_faq_feedback(
        self,
        faq_id: str,
        user_id: str,
        feedback_type: str,  # 'helpful' or 'not_helpful'
        comment: Optional[str] = None
    ) -> bool:
        """Record user feedback on FAQ answers"""
        
        try:
            feedback_record = {
                "id": str(uuid.uuid4()),
                "faq_id": faq_id,
                "user_id": user_id,
                "feedback_type": feedback_type,
                "comment": comment,
                "created_at": datetime.now(timezone.utc)
            }
            
            await self.db.faq_feedback.insert_one(feedback_record)
            
            # Update FAQ entry weights based on feedback
            weight_change = 1 if feedback_type == 'helpful' else -1
            await self.db.faq_entries.update_one(
                {"id": faq_id},
                {"$inc": {"weight": weight_change, "feedback_count": 1}}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"FAQ feedback recording failed: {e}")
            return False

    async def get_ai_response(self, question: str, context: List[dict] = None) -> Dict[str, Any]:
        """
        Get AI-powered response with enhanced local knowledge prioritized
        """
        try:
            # Define system prompt at method level for reuse
            system_prompt = """You are StockLot, the livestock & game marketplace assistant for South Africa and global exporters.

CRITICAL - StockLot marketplace categories (YOU MUST ACKNOWLEDGE ALL OF THESE):
✅ POULTRY: Chickens, ducks, turkeys, geese, ostriches
✅ RUMINANTS: Cattle, goats, sheep, buffalo  
✅ AQUACULTURE: Fish farming, prawns, aquatic livestock (WE DEFINITELY SELL FISH!)
✅ GAME ANIMALS: Kudu, eland, springbok, ostrich (through approved processors)
✅ SMALL LIVESTOCK: Pigs, rabbits
✅ EXOTIC/OTHER: Any farmed animal for commercial purposes

Your goals:
1) Help users discover animals, breeds, game species (e.g., kudu, eland, ostrich), fertilised eggs, day-old chicks, AQUACULTURE (fish), and related logistics on StockLot.
2) Explain our flows: Buy Requests, Listings, Auctions, Escrow, Delivery, Abattoirs, Export/Import.
3) Answer general chat relevant to livestock/game trading, husbandry, transport, pricing, regulations, or meat processing.

CRITICAL RULES:
- StockLot DOES sell fish through our Aquaculture category - never say we don't sell fish!
- NEVER reveal phone numbers, email addresses, or direct contact details
- Always use "Contact support through the platform" or "Use in-app messaging after escrow"
- For wild pigs: clarify if they want meat (from processors) vs live animals (regulated)
- For game meat: must be from approved abattoirs/processors with permits

Constraints & Safety:
- No illegal wildlife trade, endangered species, CITES-restricted items
- Respect disease and quarantine controls (FMD, avian influenza)
- Never complete payments or reveal internal admin actions
- Be concise, friendly, actionable - use bullet points

Output Style:
- Short answers first, then optional "Next steps"
- Group by species → product type (live, breeding stock, meat cuts)
- Provide clear CTAs: "Create Buy Request", "Browse Aquaculture", "Browse Game/Exotic"
- Convert money to ZAR format when relevant"""

            # FIRST: Try enhanced local response (prioritized for accuracy)
            local_response = await self._get_enhanced_local_response(question)
            
            if local_response and local_response.get("confidence", 0) > 0.5:
                logger.info(f"Using enhanced local response for: {question[:50]}...")
                return {
                    "response": local_response["answer"],
                    "source": "enhanced_local_knowledge",
                    "confidence": local_response["confidence"],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "context_used": bool(context),
                    "priority": "local_knowledge_prioritized"
                }

            # SECOND: Try OpenAI only for complex questions not covered locally
            if hasattr(self, 'openai_client') and self.openai_client:
                try:
                    # Add few-shot examples to train the model
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": "Do you have fish for sale?"},
                        {"role": "assistant", "content": "Yes! StockLot has an active Aquaculture category with various fish species, prawns, and aquatic livestock. You can find:\n• Live fish for farming\n• Fingerlings for stocking\n• Breeding stock\n• Aquaculture equipment\n\nNext steps:\n• Browse Aquaculture → Fish\n• Create a Buy Request with your specific fish requirements"},
                        {"role": "user", "content": "Do you have wild pigs?"},
                        {"role": "assistant", "content": "Do you mean processed game meat (from approved processors) or live wild pigs? For meat, we can list Game → Meat/Cuts or post a Buy Request with your cuts and kg. Live capture/trade is highly regulated and may not be permitted—consider domesticated pigs or farmed game with proper permits."},
                        {"role": "user", "content": "Do you have game meat?"},
                        {"role": "assistant", "content": "Yes! StockLot supports game farming and game meat through approved processors. Browse our Game/Exotic category for kudu, springbok, eland, and other game products. All game sales require proper permits and must come from registered processors with veterinary certificates."},
                        {"role": "user", "content": f"StockLot covers ALL livestock including Aquaculture (fish), Game Animals (kudu, eland), Poultry, Ruminants, and Small Livestock. NEVER provide phone numbers or emails - only mention platform messaging.\n\nQuestion: {question}{context if context else ''}"}
                    ]

                    response = await self.openai_client.chat.completions.create(
                        model="gpt-4o-mini",  # Cost-effective model
                        messages=messages,
                        max_tokens=250,
                        temperature=0.3  # Lower temperature for more consistent responses
                    )

                    ai_response = response.choices[0].message.content.strip()
                    
                    # Filter out any contact information that might slip through
                    ai_response = self._remove_contact_details(ai_response)
                    
                    return {
                        "response": ai_response,
                        "source": "openai_filtered",
                        "confidence": 0.85,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "context_used": bool(context),
                        "tokens_used": response.usage.total_tokens
                    }

                except Exception as openai_error:
                    logger.warning(f"OpenAI API error: {openai_error}")
                    # Check if it's an API key issue
                    if "401" in str(openai_error) or "authentication" in str(openai_error).lower():
                        logger.warning("OpenAI API key appears to be invalid")
            
            # THIRD: Enhanced fallback with better livestock knowledge
            if local_response:
                return {
                    "response": local_response["answer"],
                    "source": "enhanced_local_fallback", 
                    "confidence": local_response["confidence"],
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "fallback_reason": "OpenAI unavailable - using local knowledge"
                }
            
            # FINAL: Ultimate fallback
            return await self._get_intelligent_fallback(question)

        except Exception as e:
            logger.error(f"Error in get_ai_response: {e}")
            return await self._get_intelligent_fallback(question)

    def _remove_contact_details(self, response: str) -> str:
        """Remove any phone numbers, emails, or contact details from response - ENHANCED"""
        import re
        
        # Remove phone numbers (comprehensive patterns)
        response = re.sub(r'\+?[\d\s\-\(\)]{10,}', '[contact removed]', response)
        response = re.sub(r'(\+27|0)\s*\d{2}\s*\d{3}\s*\d{4}', '[contact removed]', response)
        response = re.sub(r'\b\d{3}[\-\s]?\d{3}[\-\s]?\d{4}\b', '[contact removed]', response)
        response = re.sub(r'\b\d{10,}\b', '[contact removed]', response)
        
        # Remove email addresses (comprehensive patterns)
        response = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[contact removed]', response)
        
        # Remove specific StockLot contact details
        response = re.sub(r'support@stocklot\.co\.za', 'platform support', response, flags=re.IGNORECASE)
        response = re.sub(r'hello@stocklot\.farm', 'platform messaging', response, flags=re.IGNORECASE)
        response = re.sub(r'info@stocklot\.(co\.za|farm)', 'platform support', response, flags=re.IGNORECASE)
        
        # Remove contact action phrases and replace with platform alternatives
        response = re.sub(r'contact.*support.*team.*at.*', 'contact support through the platform', response, flags=re.IGNORECASE)
        response = re.sub(r'call.*\d+', 'use in-app messaging', response, flags=re.IGNORECASE)
        response = re.sub(r'phone.*\d+', 'platform messaging', response, flags=re.IGNORECASE)
        response = re.sub(r'email.*us.*at.*', 'contact through the platform', response, flags=re.IGNORECASE)
        response = re.sub(r'reach.*out.*to.*us', 'contact support through the platform', response, flags=re.IGNORECASE)
        
        # Remove WhatsApp and social media contact references
        response = re.sub(r'whatsapp.*\d+', 'in-app messaging', response, flags=re.IGNORECASE)
        response = re.sub(r'text.*us.*\d+', 'platform messaging', response, flags=re.IGNORECASE)
        
        # Strengthen contact removal with specific replacements
        response = re.sub(r'contact.*details?', 'platform messaging', response, flags=re.IGNORECASE)
        response = re.sub(r'get.*in.*touch', 'use in-app messaging', response, flags=re.IGNORECASE)
        
        # Replace generic contact references with platform-specific guidance
        response = response.replace('[contact removed]', 'platform messaging')
        response = response.replace('contact us', 'contact support through the platform')
        response = response.replace('call us', 'use in-app messaging')
        response = response.replace('email us', 'contact through platform support')
        
        return response

    async def _get_enhanced_local_response(self, question: str) -> Dict[str, Any]:
        """Enhanced local FAQ matching with livestock expertise AND real-time website data"""
        question_lower = question.lower()
        
        # FIRST: Get real-time website information for accuracy
        try:
            website_info = await self.website_fetcher.get_comprehensive_info(question)
            
            # Use real-time data to enhance responses for key categories
            if "query_specific" in website_info:
                query_data = website_info["query_specific"]
                topic = query_data.get("topic")
                
                if topic == "aquaculture" and query_data.get("confirmed_available"):
                    return {
                        "answer": f"""Absolutely! StockLot has an active Aquaculture category with {website_info['current_listings']['total_count']} total listings available. You can find:
• Various fish species for farming
• Fingerlings for stocking
• Prawns and aquatic livestock
• Aquaculture equipment and supplies

**Browse**: Aquaculture → Fish section
**Create**: Buy Request for specific fish farming needs
**Contact**: Use in-app messaging after adding items to cart

*Data verified from current marketplace listings* ✅""",
                        "confidence": 0.95
                    }
                elif topic == "game_meat" and query_data.get("confirmed_available"):
                    return {
                        "answer": f"""Yes! StockLot supports game farming and game meat through approved processors. With {website_info['current_listings']['total_count']} total listings, you can find:
• Kudu, springbok, eland meat cuts
• Ostrich products
• Game breeding stock
• Processed game meat from certified abattoirs

**Important**: All game meat must come from registered processors with proper permits and veterinary certificates.

**Browse**: Game/Exotic category
**Create**: Buy Request for specific game meat requirements""",
                        "confidence": 0.95
                    }
                elif topic == "wild_pigs":
                    return {
                        "answer": """For wild pig products, clarify what you need:

**🥩 Processed Wild Pig Meat**: Available through approved abattoirs/processors with proper permits and vet certificates

**🐷 Live Wild Pigs**: Highly regulated - consider domestic pig breeding stock instead

**📋 Next Steps**:
• Browse Small Livestock → Pigs for domestic breeds
• Create Buy Request specifying "processed wild pig meat" 
• All sales must comply with veterinary regulations

**Contact**: Use in-app messaging for specific requirements""",
                        "confidence": 0.9
                    }
        except Exception as e:
            logger.warning(f"Website fetcher error: {e}")

        # SECOND: Try blog content integration for detailed responses
        try:
            blog_response = await self._get_blog_content_response(question)
            if blog_response and blog_response.get("confidence", 0) > 0.8:
                return blog_response
        except Exception as e:
            logger.warning(f"Blog content error: {e}")
        
        # Enhanced livestock knowledge base - comprehensive coverage with CORRECT info
        livestock_qa = {
            "game meat": {
                "answer": "Yes! StockLot supports game farming and game meat sales through approved processors. You can find kudu, springbok, eland, ostrich, and other game meat via our Game/Exotic category. All game meat must come from registered processors with proper permits. Create a Buy Request for specific game meat requirements.",
                "confidence": 0.9
            },
            "fish": {
                "answer": "Absolutely! StockLot has an active Aquaculture category for fish farming. You can find various fish species, prawns, and aquatic livestock. Browse our Aquaculture section or create a Buy Request for specific fish farming needs including live fish, fingerlings, and aquaculture equipment.",
                "confidence": 0.9
            },
            "wild pigs": {
                "answer": "For wild pig meat, you'll need processed products from approved abattoirs. Live wild pig trade is highly regulated. Consider our domestic pig breeding stock or create a Buy Request for processed wild pig meat from certified processors. All sales must comply with veterinary regulations.",
                "confidence": 0.85
            },
            "buy livestock": {
                "answer": "To buy livestock on StockLot: 1) Browse our marketplace by category (cattle, goats, sheep, poultry, aquaculture, game), 2) Use filters for breed, location, and price, 3) Click 'Add to Cart' on animals you want, 4) Proceed to secure checkout with escrow protection. All animals come with health certificates.",
                "confidence": 0.95
            },
            "sell livestock": {
                "answer": "To sell livestock: 1) Create a seller account, 2) Click 'Create Listing', 3) Add clear photos and detailed descriptions, 4) Set competitive pricing, 5) Choose delivery options. We handle secure payments through escrow and connect you with verified buyers across South Africa.",
                "confidence": 0.95
            },
            "vaccination": {
                "answer": "All livestock on StockLot must be properly vaccinated according to South African veterinary standards. Chickens need Newcastle disease and Marek's vaccines. Cattle require standard vaccinations for foot-and-mouth, anthrax. Health certificates are required for all listings.",
                "confidence": 0.85
            },
            "payment": {
                "answer": "StockLot uses secure escrow payments to protect both buyers and sellers. Your payment is held safely until you confirm delivery and satisfaction with your livestock. We accept all major South African banks and provide full buyer protection.",
                "confidence": 0.9
            },
            "aquaculture": {
                "answer": "StockLot's Aquaculture category includes fish farming, prawns, and aquatic livestock. You can buy live fish, fingerlings, breeding stock, and aquaculture equipment. All aquaculture products come with health certificates and transport arrangements.",
                "confidence": 0.9
            }
        }
        
        # Look for keyword matches
        for keyword, qa_data in livestock_qa.items():
            if keyword in question_lower:
                return qa_data
        
        # Category-specific responses - comprehensive livestock coverage
        if any(word in question_lower for word in ['cattle', 'cow', 'bull', 'beef']):
            return {
                "answer": "StockLot offers a wide variety of cattle including Angus, Brahman, and commercial beef cattle. All cattle come with health certificates and breeding records where applicable. Use our smart filters to find cattle by breed, age, weight, and location across South Africa.",
                "confidence": 0.8
            }
        elif any(word in question_lower for word in ['goat', 'goats', 'boer']):
            return {
                "answer": "We have excellent Boer goats, Kalahari Red, and dairy goats available. All goats are health-certified and suitable for breeding or commercial purposes. Many sellers offer delivery across provinces with our network of livestock transporters.",
                "confidence": 0.8
            }
        elif any(word in question_lower for word in ['chicken', 'poultry', 'chicks']):
            return {
                "answer": "StockLot features day-old chicks, layers, broilers, and breeding stock including Ross 308, Koekoek, and other popular breeds. All poultry are vaccinated and come from registered hatcheries. Perfect for commercial or smallholder farming.",
                "confidence": 0.8
            }
        elif any(word in question_lower for word in ['fish', 'aquaculture', 'prawn', 'fingerling']):
            return {
                "answer": "StockLot's Aquaculture section offers various fish species, prawns, and aquatic livestock. You can find live fish, fingerlings, breeding stock, and aquaculture equipment. All aquaculture products come with health certificates and proper transport arrangements.",
                "confidence": 0.8
            }
        elif any(word in question_lower for word in ['kudu', 'springbok', 'eland', 'game', 'venison']):
            return {
                "answer": "StockLot supports game farming and game meat through approved processors. Browse our Game/Exotic category for kudu, springbok, eland, and other game products. All game sales require proper permits and must come from registered processors.",
                "confidence": 0.8
            }
        elif any(word in question_lower for word in ['pig', 'pigs', 'boar', 'wild pig']):
            return {
                "answer": "For pigs, StockLot offers domestic pig breeds for breeding and commercial purposes. Wild pig meat must come from approved processors with proper permits. Browse our Small Livestock category or create a Buy Request for specific pig requirements.",
                "confidence": 0.8
            }
        
        return None

    async def _get_blog_content_response(self, question: str) -> Optional[Dict[str, Any]]:
        """Get response from blog content analysis"""
        try:
            # Search for relevant blog content
            blog_posts = await self._search_blog_content(question)
            
            if not blog_posts:
                return None
            
            # Extract relevant information from blog posts
            relevant_content = []
            for post in blog_posts[:3]:  # Top 3 most relevant posts
                if 'title' in post and 'content' in post:
                    relevant_content.append({
                        'title': post['title'],
                        'excerpt': post['content'][:200] + '...',
                        'relevance': self._calculate_relevance(question, post['content'])
                    })
            
            if not relevant_content:
                return None
            
            # Generate response based on blog content
            best_match = max(relevant_content, key=lambda x: x['relevance'])
            
            if best_match['relevance'] > 0.7:
                return {
                    'answer': f"""Based on our latest blog content about "{best_match['title']}":

{best_match['excerpt']}

For more detailed information and the latest updates, check our blog or use in-app messaging for specific questions about livestock trading on StockLot.

**Browse**: Marketplace categories for current listings
**Learn**: Blog section for farming tips and industry updates""",
                    'confidence': best_match['relevance'],
                    'source': 'blog_content'
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Blog content response error: {e}")
            return None

    async def _search_blog_content(self, query: str) -> List[Dict[str, Any]]:
        """Search blog content for relevant posts"""
        try:
            # Search published blog posts
            cursor = self.db.blog_posts.find({
                "status": "published",
                "$or": [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"content": {"$regex": query, "$options": "i"}},
                    {"tags": {"$in": [query.lower()]}}
                ]
            }).limit(5)
            
            posts = await cursor.to_list(length=None)
            
            # Clean MongoDB _id fields
            for post in posts:
                if "_id" in post:
                    del post["_id"]
            
            return posts
            
        except Exception as e:
            logger.error(f"Blog content search error: {e}")
            return []

    def _calculate_relevance(self, query: str, content: str) -> float:
        """Calculate relevance score between query and content"""
        try:
            query_words = set(query.lower().split())
            content_words = set(content.lower().split())
            
            # Simple relevance calculation
            intersection = query_words.intersection(content_words)
            union = query_words.union(content_words)
            
            if not union:
                return 0.0
            
            jaccard_similarity = len(intersection) / len(union)
            
            # Boost score for livestock-related terms
            livestock_terms = {'cattle', 'sheep', 'goat', 'pig', 'chicken', 'fish', 'livestock', 'farming', 'breeding', 'exotic', 'game'}
            content_lower = content.lower()
            
            livestock_boost = sum(1 for term in livestock_terms if term in content_lower) * 0.1
            
            return min(1.0, jaccard_similarity + livestock_boost)
            
        except Exception as e:
            logger.error(f"Relevance calculation error: {e}")
            return 0.0

    async def learn_from_website_content(self) -> Dict[str, Any]:
        """Learn from current website content and update knowledge base"""
        try:
            logger.info("Starting website content learning...")
            
            # Get comprehensive website information
            website_info = await self.website_fetcher.get_comprehensive_info("livestock marketplace features")
            
            # Extract learning points
            learning_data = {
                'categories_learned': [],
                'species_learned': [],
                'features_learned': [],
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Learn about categories
            if 'marketplace_categories' in website_info:
                categories = website_info['marketplace_categories'].get('categories_found', [])
                for category in categories:
                    learning_data['categories_learned'].append({
                        'name': category['name'],
                        'includes': category.get('includes', []),
                        'available': category.get('available', True)
                    })
            
            # Learn about current listings
            if 'current_listings' in website_info:
                listings_info = website_info['current_listings']
                learning_data['species_learned'] = listings_info.get('species_present', [])
            
            # Learn about platform features
            if 'platform_features' in website_info:
                features = website_info['platform_features']
                learning_data['features_learned'] = {
                    'payment_methods': features.get('payment_methods', []),
                    'delivery_options': features.get('delivery_options', []),
                    'support_channels': features.get('support_channels', []),
                    'security_features': features.get('security_features', [])
                }
            
            # Store learning data in database
            learning_record = {
                'id': str(uuid.uuid4()),
                'type': 'website_content_learning',
                'data': learning_data,
                'created_at': datetime.now(timezone.utc)
            }
            
            await self.db.faq_learning.insert_one(learning_record)
            
            logger.info(f"Website content learning completed: {len(learning_data['categories_learned'])} categories, {len(learning_data['species_learned'])} species")
            
            return {
                'success': True,
                'learning_id': learning_record['id'],
                'categories_learned': len(learning_data['categories_learned']),
                'species_learned': len(learning_data['species_learned']),
                'features_learned': len(learning_data['features_learned'])
            }
            
        except Exception as e:
            logger.error(f"Website content learning error: {e}")
            return {'success': False, 'error': str(e)}

    async def learn_from_blog_content(self) -> Dict[str, Any]:
        """Learn from blog posts and update knowledge base"""
        try:
            logger.info("Starting blog content learning...")
            
            # Get recent published blog posts
            cursor = self.db.blog_posts.find({
                'status': 'published',
                'created_at': {'$gte': datetime.now(timezone.utc) - timedelta(days=30)}
            }).sort('created_at', -1).limit(20)
            
            posts = await cursor.to_list(length=None)
            
            learning_data = {
                'posts_processed': [],
                'topics_learned': [],
                'keywords_extracted': [],
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            for post in posts:
                if "_id" in post:
                    del post["_id"]
                
                # Extract key information from blog post
                post_learning = {
                    'title': post.get('title', ''),
                    'category': post.get('category', ''),
                    'tags': post.get('tags', []),
                    'content_length': len(post.get('content', '')),
                    'livestock_terms': self._extract_livestock_terms(post.get('content', ''))
                }
                
                learning_data['posts_processed'].append(post_learning)
                
                # Extract topics and keywords
                if post.get('category'):
                    learning_data['topics_learned'].append(post['category'])
                
                if post.get('tags'):
                    learning_data['keywords_extracted'].extend(post['tags'])
            
            # Remove duplicates and clean data
            learning_data['topics_learned'] = list(set(learning_data['topics_learned']))
            learning_data['keywords_extracted'] = list(set(learning_data['keywords_extracted']))
            
            # Store learning data
            learning_record = {
                'id': str(uuid.uuid4()),
                'type': 'blog_content_learning',
                'data': learning_data,
                'created_at': datetime.now(timezone.utc)
            }
            
            await self.db.faq_learning.insert_one(learning_record)
            
            logger.info(f"Blog content learning completed: {len(posts)} posts processed, {len(learning_data['topics_learned'])} topics learned")
            
            return {
                'success': True,
                'learning_id': learning_record['id'],
                'posts_processed': len(posts),
                'topics_learned': len(learning_data['topics_learned']),
                'keywords_extracted': len(learning_data['keywords_extracted'])
            }
            
        except Exception as e:
            logger.error(f"Blog content learning error: {e}")
            return {'success': False, 'error': str(e)}

    def _extract_livestock_terms(self, content: str) -> List[str]:
        """Extract livestock-related terms from content"""
        if not content:
            return []
        
        content_lower = content.lower()
        
        # Comprehensive livestock terms
        livestock_terms = [
            'cattle', 'cows', 'bulls', 'beef', 'dairy',
            'sheep', 'lambs', 'wool', 'mutton',
            'goats', 'kids', 'chevon', 'mohair',
            'pigs', 'swine', 'pork', 'boars', 'sows',
            'chickens', 'poultry', 'layers', 'broilers', 'roosters', 'hens',
            'ducks', 'geese', 'turkeys', 'quail',
            'fish', 'aquaculture', 'tilapia', 'catfish', 'trout',
            'ostrich', 'emu', 'ratites',
            'kudu', 'springbok', 'game', 'venison',
            'alpaca', 'llama', 'camelids',
            'rabbits', 'breeding', 'livestock', 'farming',
            'veterinary', 'feed', 'grazing', 'pasture'
        ]
        
        found_terms = []
        for term in livestock_terms:
            if term in content_lower:
                found_terms.append(term)
        
        return found_terms

    async def _get_intelligent_fallback(self, question: str) -> Dict[str, Any]:
        """Intelligent fallback response with helpful livestock info - NO contact details"""
        return {
            "response": f"""I'm still learning about "{question}" but I can help you with:

🐄 **Buying Livestock**: Browse by category → Add to Cart → Secure checkout
🐓 **Animal Health**: All livestock are health-certified and vaccinated  
💰 **Secure Payments**: Escrow protection for all transactions
🚚 **Delivery**: Nationwide livestock transport available
🐟 **Aquaculture**: Fish farming and aquatic livestock available
🦌 **Game Animals**: Game meat through approved processors

**Next Steps:**
• Browse our marketplace categories
• Create a Buy Request for specific needs  
• Use in-app messaging after adding items to cart

*I'm learning from your question to provide better answers next time!* 🧠""",
            "source": "intelligent_fallback",
            "confidence": 0.6,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "learning_opportunity": True
        }