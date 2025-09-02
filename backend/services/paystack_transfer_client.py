"""
Paystack Transfer Client for South African Livestock Marketplace
Handles all Paystack transfer-related operations with comprehensive error handling
"""
import httpx
import asyncio
import logging
import hmac
import hashlib
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from urllib.parse import urljoin
import os

from .transfer_models import PaystackResponse

logger = logging.getLogger(__name__)

class PaystackError(Exception):
    def __init__(self, message: str, status_code: int = None, response_data: Dict = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data or {}
        super().__init__(message)

class PaystackTransferClient:
    def __init__(self, secret_key: str = None, base_url: str = "https://api.paystack.co"):
        self.secret_key = secret_key or os.getenv("PAYSTACK_SECRET_KEY")
        self.base_url = base_url
        
        if not self.secret_key:
            raise ValueError("Paystack secret key is required")
            
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        # Configure HTTP client with retry and timeout settings
        self.timeout = httpx.Timeout(30.0, connect=10.0)
        self.limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        retry_count: int = 0,
        max_retries: int = 3
    ) -> PaystackResponse:
        """Make HTTP request with retry logic and error handling"""
        url = urljoin(self.base_url, endpoint.lstrip('/'))
        
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout, 
                limits=self.limits,
                headers=self.headers
            ) as client:
                
                logger.info(f"Making {method} request to {url}")
                
                if method.upper() == "GET":
                    response = await client.get(url, params=params)
                elif method.upper() == "POST":
                    response = await client.post(url, json=data, params=params)
                elif method.upper() == "PUT":
                    response = await client.put(url, json=data, params=params)
                elif method.upper() == "DELETE":
                    response = await client.delete(url, params=params)
                else:
                    raise PaystackError(f"Unsupported HTTP method: {method}")
                
                # Parse response
                try:
                    response_data = response.json()
                except:
                    response_data = {"message": response.text}
                
                # Handle successful responses
                if response.status_code == 200 and response_data.get("status", False):
                    return PaystackResponse(
                        status=True,
                        message=response_data.get("message", "Success"),
                        data=response_data.get("data"),
                        meta=response_data.get("meta"),
                        status_code=response.status_code
                    )
                
                # Handle client errors (4xx) - don't retry
                if 400 <= response.status_code < 500:
                    error_message = response_data.get("message", f"Client error: {response.status_code}")
                    logger.error(f"Client error {response.status_code}: {error_message}")
                    
                    return PaystackResponse(
                        status=False,
                        message=error_message,
                        error=error_message,
                        status_code=response.status_code
                    )
                
                # Handle server errors (5xx) - retry if possible
                if response.status_code >= 500 and retry_count < max_retries:
                    wait_time = min(2 ** retry_count, 30)  # Exponential backoff, max 30s
                    logger.warning(f"Server error {response.status_code}, retrying in {wait_time}s (attempt {retry_count + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    return await self._make_request(method, endpoint, data, params, retry_count + 1, max_retries)
                
                # Final failure
                error_message = response_data.get("message", f"Request failed: {response.status_code}")
                return PaystackResponse(
                    status=False,
                    message=error_message,
                    error=error_message,
                    status_code=response.status_code
                )
                
        except httpx.TimeoutException:
            if retry_count < max_retries:
                wait_time = min(2 ** retry_count, 30)
                logger.warning(f"Request timeout, retrying in {wait_time}s (attempt {retry_count + 1}/{max_retries})")
                await asyncio.sleep(wait_time)
                return await self._make_request(method, endpoint, data, params, retry_count + 1, max_retries)
            
            raise PaystackError("Request timeout after retries", status_code=408)
        
        except httpx.ConnectError:
            if retry_count < max_retries:
                wait_time = min(2 ** retry_count, 30)
                logger.warning(f"Connection error, retrying in {wait_time}s (attempt {retry_count + 1}/{max_retries})")
                await asyncio.sleep(wait_time)
                return await self._make_request(method, endpoint, data, params, retry_count + 1, max_retries)
            
            raise PaystackError("Connection failed after retries", status_code=503)
        
        except Exception as e:
            logger.error(f"Unexpected error in request: {str(e)}")
            raise PaystackError(f"Request failed: {str(e)}")

    # Bank and Account Validation Methods
    async def list_banks(self, country: str = "south africa") -> PaystackResponse:
        """List available banks for South Africa"""
        params = {"country": country, "use_cursor": False, "perPage": 100}
        return await self._make_request("GET", "/bank", params=params)
    
    async def validate_account(
        self,
        account_number: str,
        bank_code: str,
        account_name: str,
        account_type: str = "personal",
        document_type: str = "identityNumber",
        document_number: str = None
    ) -> PaystackResponse:
        """Validate South African bank account"""
        data = {
            "bank_code": bank_code,
            "country_code": "ZA",
            "account_number": account_number,
            "account_name": account_name,
            "account_type": account_type,
            "document_type": document_type,
            "document_number": document_number
        }
        
        logger.info(f"Validating account {account_number} with bank {bank_code}")
        return await self._make_request("POST", "/bank/validate", data=data)
    
    # Transfer Recipient Methods
    async def create_transfer_recipient(
        self,
        recipient_type: str,
        name: str,
        account_number: str = None,
        bank_code: str = None,
        authorization_code: str = None,
        email: str = None,
        description: str = None,
        currency: str = "ZAR"
    ) -> PaystackResponse:
        """Create a transfer recipient"""
        data = {
            "type": recipient_type,
            "name": name,
            "currency": currency
        }
        
        if description:
            data["description"] = description
        
        if recipient_type == "basa":
            if not account_number or not bank_code:
                raise PaystackError("Account number and bank code required for BASA recipients")
            data.update({
                "account_number": account_number,
                "bank_code": bank_code
            })
        elif recipient_type == "authorization":
            if not authorization_code or not email:
                raise PaystackError("Authorization code and email required for authorization recipients")
            data.update({
                "authorization_code": authorization_code,
                "email": email
            })
        
        logger.info(f"Creating transfer recipient: {name} ({recipient_type})")
        return await self._make_request("POST", "/transferrecipient", data=data)
    
    async def list_transfer_recipients(
        self,
        page: int = 1,
        per_page: int = 50,
        from_date: datetime = None,
        to_date: datetime = None
    ) -> PaystackResponse:
        """List transfer recipients"""
        params = {"page": page, "perPage": per_page}
        
        if from_date:
            params["from"] = from_date.isoformat()
        if to_date:
            params["to"] = to_date.isoformat()
        
        return await self._make_request("GET", "/transferrecipient", params=params)
    
    async def fetch_transfer_recipient(self, recipient_code: str) -> PaystackResponse:
        """Fetch transfer recipient details"""
        return await self._make_request("GET", f"/transferrecipient/{recipient_code}")
    
    async def update_transfer_recipient(
        self,
        recipient_code: str,
        name: str = None,
        email: str = None
    ) -> PaystackResponse:
        """Update transfer recipient"""
        data = {}
        if name:
            data["name"] = name
        if email:
            data["email"] = email
        
        return await self._make_request("PUT", f"/transferrecipient/{recipient_code}", data=data)
    
    async def delete_transfer_recipient(self, recipient_code: str) -> PaystackResponse:
        """Delete (deactivate) transfer recipient"""
        return await self._make_request("DELETE", f"/transferrecipient/{recipient_code}")
    
    # Transfer Methods
    async def initiate_transfer(
        self,
        recipient_code: str,
        amount: int,  # Amount in cents
        reference: str,
        reason: str = None,
        currency: str = "ZAR"
    ) -> PaystackResponse:
        """Initiate a transfer"""
        data = {
            "source": "balance",
            "recipient": recipient_code,
            "amount": amount,
            "currency": currency,
            "reference": reference
        }
        
        if reason:
            data["reason"] = reason
        
        logger.info(f"Initiating transfer of {amount/100:.2f} ZAR to {recipient_code}")
        return await self._make_request("POST", "/transfer", data=data)
    
    async def fetch_transfer(self, transfer_code: str) -> PaystackResponse:
        """Fetch transfer details"""
        return await self._make_request("GET", f"/transfer/{transfer_code}")
    
    async def list_transfers(
        self,
        page: int = 1,
        per_page: int = 50,
        from_date: datetime = None,
        to_date: datetime = None
    ) -> PaystackResponse:
        """List transfers"""
        params = {"page": page, "perPage": per_page}
        
        if from_date:
            params["from"] = from_date.isoformat()
        if to_date:
            params["to"] = to_date.isoformat()
        
        return await self._make_request("GET", "/transfer", params=params)
    
    # Webhook Verification
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Paystack webhook signature using HMAC SHA512"""
        webhook_secret = os.getenv("PAYSTACK_WEBHOOK_SECRET")
        if not webhook_secret:
            logger.error("PAYSTACK_WEBHOOK_SECRET not configured")
            return False
            
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)