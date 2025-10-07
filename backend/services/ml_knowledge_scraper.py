"""
🧠 ML Knowledge Scraper Service
Advanced web scraping and learning service for FAQ enhancement
"""

import asyncio
import aiohttp
import logging
import re
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import openai

logger = logging.getLogger(__name__)

class MLKnowledgeScraper:
    def __init__(self, db, openai_api_key: str):
        self.db = db
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        self.session = None
        
        # Livestock-focused websites for scraping
        self.target_sources = [
            {
                "name": "South African Livestock",
                "base_url": "https://www.farmersweekly.co.za",
                "sections": ["/livestock", "/cattle", "/sheep", "/goats"],
                "relevance": "high"
            },
            {
                "name": "AgriOrbit",
                "base_url": "https://www.agriorbit.com",
                "sections": ["/livestock-farming", "/animal-health"],
                "relevance": "high"
            },
            {
                "name": "Stockfarm Magazine",
                "base_url": "https://www.stockfarm.co.za",
                "sections": ["/cattle", "/sheep", "/goats", "/pigs"],
                "relevance": "high"
            }
        ]
        
        # Common FAQ patterns to identify
        self.faq_patterns = [
            r"how to\s+(.+?)\?",
            r"what is\s+(.+?)\?",
            r"why do\s+(.+?)\?",
            r"when should\s+(.+?)\?",
            r"where can\s+(.+?)\?",
            r"how much\s+(.+?)\?",
            r"(.+?)\s+cost\?",
            r"best\s+(.+?)\s+for",
            r"(.+?)\s+requirements\?",
            r"(.+?)\s+regulations\?",
        ]
    
    async def setup_session(self):
        """Initialize HTTP session for web scraping"""
        headers = {
            'User-Agent': 'StockLot-Knowledge-Bot/1.0 (Livestock FAQ Enhancement)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive'
        }
        
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(headers=headers, timeout=timeout)
    
    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
    
    async def scrape_livestock_knowledge(self) -> Dict[str, Any]:
        """Main scraping function to gather livestock knowledge"""
        await self.setup_session()
        
        try:
            scraped_data = {
                "scrape_id": f"scrape_{int(datetime.now().timestamp())}",
                "timestamp": datetime.now(timezone.utc),
                "sources_processed": 0,
                "articles_found": 0,
                "faqs_extracted": 0,
                "knowledge_items": []
            }
            
            for source in self.target_sources:
                try:
                    logger.info(f"Scraping {source['name']}...")
                    source_data = await self._scrape_source(source)
                    
                    scraped_data["sources_processed"] += 1
                    scraped_data["articles_found"] += len(source_data["articles"])
                    scraped_data["knowledge_items"].extend(source_data["knowledge_items"])
                    
                    # Rate limiting
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Error scraping {source['name']}: {e}")
                    continue
            
            # Process and enhance scraped data with AI
            enhanced_data = await self._enhance_with_ai(scraped_data["knowledge_items"])
            scraped_data["faqs_extracted"] = len(enhanced_data)
            scraped_data["enhanced_faqs"] = enhanced_data
            
            # Store in database
            await self.db.knowledge_scrapes.insert_one(scraped_data)
            
            return {
                "success": True,
                "scrape_id": scraped_data["scrape_id"],
                "stats": {
                    "sources_processed": scraped_data["sources_processed"],
                    "articles_found": scraped_data["articles_found"],
                    "faqs_extracted": scraped_data["faqs_extracted"]
                }
            }
            
        finally:
            await self.close_session()
    
    async def _scrape_source(self, source: Dict) -> Dict[str, Any]:
        """Scrape a specific source for livestock information"""
        articles = []
        knowledge_items = []
        
        for section in source["sections"]:
            try:
                url = urljoin(source["base_url"], section)
                
                async with self.session.get(url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Extract articles
                        article_links = soup.find_all('a', href=True)
                        
                        for link in article_links[:10]:  # Limit to 10 per section
                            href = link.get('href')
                            title = link.get_text().strip()
                            
                            if href and title and len(title) > 10:
                                full_url = urljoin(url, href)
                                
                                # Extract article content
                                article_content = await self._extract_article_content(full_url)
                                if article_content:
                                    articles.append({
                                        "title": title,
                                        "url": full_url,
                                        "content": article_content,
                                        "source": source["name"],
                                        "section": section
                                    })
                                    
                                    # Extract potential FAQs from content
                                    faqs = self._extract_faqs_from_content(article_content, title)
                                    knowledge_items.extend(faqs)
                        
                        await asyncio.sleep(1)  # Rate limiting
                        
            except Exception as e:
                logger.error(f"Error scraping section {section}: {e}")
                continue
        
        return {"articles": articles, "knowledge_items": knowledge_items}
    
    async def _extract_article_content(self, url: str) -> Optional[str]:
        """Extract clean text content from an article"""
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Remove script, style, and nav elements
                    for element in soup(['script', 'style', 'nav', 'header', 'footer']):
                        element.decompose()
                    
                    # Try to find main content
                    content_selectors = [
                        'article', '.article-content', '.content', 
                        '.post-content', 'main', '.main-content'
                    ]
                    
                    content = None
                    for selector in content_selectors:
                        element = soup.select_one(selector)
                        if element:
                            content = element.get_text()
                            break
                    
                    if not content:
                        content = soup.get_text()
                    
                    # Clean and normalize text
                    content = re.sub(r'\s+', ' ', content).strip()
                    
                    # Return only if substantial content
                    return content if len(content) > 500 else None
                    
        except Exception as e:
            logger.error(f"Error extracting content from {url}: {e}")
            return None
    
    def _extract_faqs_from_content(self, content: str, title: str) -> List[Dict]:
        """Extract potential FAQ patterns from content"""
        faqs = []
        
        # Split content into sentences
        sentences = re.split(r'[.!?]+', content)
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            
            # Look for question patterns
            for pattern in self.faq_patterns:
                match = re.search(pattern, sentence.lower())
                if match:
                    # Try to find answer in next sentence(s)
                    answer_candidates = sentences[i+1:i+3]  # Next 2 sentences
                    answer = ' '.join(answer_candidates).strip()
                    
                    if len(answer) > 20 and len(answer) < 500:
                        faqs.append({
                            "question": sentence,
                            "answer": answer,
                            "source_title": title,
                            "pattern_matched": pattern,
                            "confidence": 0.7,
                            "category": self._categorize_question(sentence)
                        })
        
        return faqs
    
    def _categorize_question(self, question: str) -> str:
        """Categorize question based on content"""
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['price', 'cost', 'buy', 'sell', 'payment']):
            return "Pricing & Sales"
        elif any(word in question_lower for word in ['health', 'disease', 'vaccine', 'vet']):
            return "Animal Health"
        elif any(word in question_lower for word in ['feed', 'nutrition', 'grass', 'hay']):
            return "Feeding & Nutrition"
        elif any(word in question_lower for word in ['breed', 'breeding', 'genetics']):
            return "Breeding & Genetics"
        elif any(word in question_lower for word in ['transport', 'delivery', 'ship']):
            return "Transport & Logistics"
        else:
            return "General Livestock"
    
    async def _enhance_with_ai(self, knowledge_items: List[Dict]) -> List[Dict]:
        """Use AI to enhance and improve extracted knowledge"""
        enhanced_faqs = []
        
        # Process in batches to avoid API limits
        batch_size = 5
        for i in range(0, len(knowledge_items), batch_size):
            batch = knowledge_items[i:i+batch_size]
            
            try:
                # Create prompt for AI enhancement
                questions_text = "\n".join([
                    f"Q: {item['question']}\nA: {item['answer']}\n"
                    for item in batch
                ])
                
                prompt = f"""
You are an expert livestock consultant. Please review and improve these FAQ entries for a South African livestock trading platform:

{questions_text}

For each Q&A pair, provide:
1. An improved, clear question
2. A comprehensive, accurate answer
3. Relevant livestock trading context for South Africa
4. Category classification

Format your response as JSON array with improved questions and answers.
"""

                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a livestock expert helping create helpful FAQ content."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                
                # Parse AI response
                ai_content = response.choices[0].message.content
                
                # Try to extract JSON from AI response
                try:
                    import json
                    enhanced_batch = json.loads(ai_content)
                    enhanced_faqs.extend(enhanced_batch)
                except json.JSONDecodeError:
                    # Fallback: use original content with AI improvements
                    for item in batch:
                        enhanced_faqs.append({
                            "question": item["question"],
                            "answer": item["answer"],
                            "category": item["category"],
                            "enhanced": False,
                            "ai_processed": True
                        })
                
                # Rate limiting for OpenAI API
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"AI enhancement error: {e}")
                # Fallback to original data
                enhanced_faqs.extend(batch)
        
        return enhanced_faqs
    
    async def learn_from_user_interactions(self) -> Dict[str, Any]:
        """Analyze user interactions to identify knowledge gaps"""
        try:
            # Get recent unanswered questions
            recent_questions = await self.db.faq_interactions.find({
                "answered": False,
                "timestamp": {"$gte": datetime.now(timezone.utc) - timedelta(days=7)}
            }).to_list(100)
            
            if not recent_questions:
                return {"success": True, "gaps_identified": 0}
            
            # Cluster similar unanswered questions
            questions_text = [q["question"] for q in recent_questions]
            
            if len(questions_text) > 2:
                vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
                X = vectorizer.fit_transform(questions_text)
                
                n_clusters = min(5, len(questions_text))
                kmeans = KMeans(n_clusters=n_clusters, random_state=42)
                clusters = kmeans.fit_predict(X)
                
                # Identify top knowledge gaps
                knowledge_gaps = []
                for cluster_id in range(n_clusters):
                    cluster_questions = [
                        questions_text[i] for i, c in enumerate(clusters) if c == cluster_id
                    ]
                    
                    if cluster_questions:
                        knowledge_gaps.append({
                            "cluster_id": cluster_id,
                            "questions": cluster_questions,
                            "frequency": len(cluster_questions),
                            "priority": "high" if len(cluster_questions) > 3 else "medium"
                        })
                
                # Store learning insights
                learning_record = {
                    "learning_id": f"learn_{int(datetime.now().timestamp())}",
                    "timestamp": datetime.now(timezone.utc),
                    "total_questions_analyzed": len(questions_text),
                    "knowledge_gaps": knowledge_gaps,
                    "recommendations": await self._generate_learning_recommendations(knowledge_gaps)
                }
                
                await self.db.ml_learning_insights.insert_one(learning_record)
                
                return {
                    "success": True,
                    "gaps_identified": len(knowledge_gaps),
                    "learning_id": learning_record["learning_id"]
                }
            
            return {"success": True, "gaps_identified": 0}
            
        except Exception as e:
            logger.error(f"Learning from interactions error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _generate_learning_recommendations(self, knowledge_gaps: List[Dict]) -> List[str]:
        """Generate recommendations for improving knowledge base"""
        recommendations = []
        
        for gap in knowledge_gaps:
            if gap["frequency"] > 3:
                recommendations.append(f"High priority: Create FAQ section for '{gap['questions'][0]}' - asked {gap['frequency']} times")
            elif gap["frequency"] > 1:
                recommendations.append(f"Medium priority: Address question cluster about '{gap['questions'][0]}'")
        
        # Add general recommendations
        recommendations.extend([
            "Schedule weekly knowledge scraping from livestock websites",
            "Review and update existing FAQ answers based on user feedback",
            "Consider adding video content for complex livestock topics",
            "Expand FAQ coverage for South African livestock regulations"
        ])
        
        return recommendations[:10]  # Return top 10 recommendations