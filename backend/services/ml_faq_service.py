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

logger = logging.getLogger(__name__)

class MLFAQService:
    def __init__(self, db):
        self.db = db
        self.openai_client = openai.OpenAI(
            api_key=os.environ.get('OPENAI_API_KEY')
        )
        self.embedding_model = "text-embedding-3-large"
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        
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