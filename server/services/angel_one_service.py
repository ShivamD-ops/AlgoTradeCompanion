import os
import json
import pyotp
import logging
from typing import Dict, List, Optional, Any
from SmartApi import SmartConnect
from SmartApi.smartWebSocketV2 import SmartWebSocketV2
import requests
from datetime import datetime, timedelta
import threading
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AngelOneService:
    def __init__(self):
        self.api_key = os.getenv('ANGEL_ONE_API_KEY')
        self.username = os.getenv('ANGEL_ONE_USERNAME')
        self.password = os.getenv('ANGEL_ONE_PASSWORD')
        self.totp_secret = os.getenv('ANGEL_ONE_TOTP_SECRET')
        self.client_code = os.getenv('ANGEL_ONE_CLIENT_CODE')
        
        self.smart_api = None
        self.auth_token = None
        self.feed_token = None
        self.refresh_token = None
        self.websocket = None
        self.session_active = False
        
        # WebSocket data storage
        self.live_data = {}
        self.subscribers = {}
        
    def authenticate(self) -> Dict[str, Any]:
        """Authenticate with AngelOne API"""
        try:
            if not all([self.api_key, self.username, self.password, self.totp_secret, self.client_code]):
                raise Exception("Missing required API credentials")
            
            # Initialize SmartAPI
            self.smart_api = SmartConnect(api_key=self.api_key)
            
            # Generate TOTP
            totp = pyotp.TOTP(self.totp_secret).now()
            
            # Generate session
            session = self.smart_api.generateSession(self.username, self.password, totp)
            
            if session['status']:
                self.auth_token = session['data']['jwtToken']
                self.refresh_token = session['data']['refreshToken']
                self.feed_token = self.smart_api.getfeedToken()
                self.session_active = True
                
                logger.info("AngelOne authentication successful")
                return {
                    "status": "success",
                    "message": "Authentication successful",
                    "data": {
                        "auth_token": self.auth_token,
                        "feed_token": self.feed_token
                    }
                }
            else:
                raise Exception(f"Authentication failed: {session.get('message', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    def get_profile(self) -> Dict[str, Any]:
        """Get user profile information"""
        try:
            if not self.smart_api or not self.refresh_token:
                return {"status": "error", "message": "Not authenticated"}
            
            profile = self.smart_api.getProfile(self.refresh_token)
            return {
                "status": "success",
                "data": profile
            }
        except Exception as e:
            logger.error(f"Profile fetch error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def get_holdings(self) -> Dict[str, Any]:
        """Get user holdings"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            holdings = self.smart_api.holding()
            return {
                "status": "success",
                "data": holdings
            }
        except Exception as e:
            logger.error(f"Holdings fetch error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def get_positions(self) -> Dict[str, Any]:
        """Get user positions"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            positions = self.smart_api.position()
            return {
                "status": "success",
                "data": positions
            }
        except Exception as e:
            logger.error(f"Positions fetch error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def place_order(self, order_params: Dict[str, Any]) -> Dict[str, Any]:
        """Place an order"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            order_response = self.smart_api.placeOrder(order_params)
            
            if order_response['status']:
                logger.info(f"Order placed successfully: {order_response['data']['orderid']}")
                return {
                    "status": "success",
                    "data": order_response['data']
                }
            else:
                raise Exception(f"Order placement failed: {order_response.get('message', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Order placement error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def modify_order(self, order_params: Dict[str, Any]) -> Dict[str, Any]:
        """Modify an existing order"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            response = self.smart_api.modifyOrder(order_params)
            return {
                "status": "success" if response['status'] else "error",
                "data": response.get('data'),
                "message": response.get('message')
            }
        except Exception as e:
            logger.error(f"Order modification error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def cancel_order(self, order_id: str, variety: str = "NORMAL") -> Dict[str, Any]:
        """Cancel an order"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            response = self.smart_api.cancelOrder(order_id, variety)
            return {
                "status": "success" if response['status'] else "error",
                "data": response.get('data'),
                "message": response.get('message')
            }
        except Exception as e:
            logger.error(f"Order cancellation error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def get_order_book(self) -> Dict[str, Any]:
        """Get order book"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            orders = self.smart_api.orderBook()
            return {
                "status": "success",
                "data": orders
            }
        except Exception as e:
            logger.error(f"Order book fetch error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def get_trade_book(self) -> Dict[str, Any]:
        """Get trade book"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            trades = self.smart_api.tradeBook()
            return {
                "status": "success",
                "data": trades
            }
        except Exception as e:
            logger.error(f"Trade book fetch error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def get_historical_data(self, symbol_token: str, exchange: str, 
                          duration: str, from_date: str, to_date: str) -> Dict[str, Any]:
        """Get historical candle data"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            historical_params = {
                "exchange": exchange,
                "symboltoken": symbol_token,
                "interval": duration,
                "fromdate": from_date,
                "todate": to_date
            }
            
            data = self.smart_api.getCandleData(historical_params)
            return {
                "status": "success",
                "data": data
            }
        except Exception as e:
            logger.error(f"Historical data fetch error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def search_scrip(self, search_term: str) -> Dict[str, Any]:
        """Search for scrip/instrument"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            search_params = {
                "exchange": "NSE",
                "searchscrip": search_term
            }
            
            results = self.smart_api.searchScrip(search_params)
            return {
                "status": "success",
                "data": results
            }
        except Exception as e:
            logger.error(f"Scrip search error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def get_ltp_data(self, exchange: str, trading_symbol: str, symbol_token: str) -> Dict[str, Any]:
        """Get Last Traded Price data"""
        try:
            if not self.smart_api:
                return {"status": "error", "message": "Not authenticated"}
            
            ltp_params = {
                "exchange": exchange,
                "tradingsymbol": trading_symbol,
                "symboltoken": symbol_token
            }
            
            ltp_data = self.smart_api.ltpData(ltp_params)
            return {
                "status": "success",
                "data": ltp_data
            }
        except Exception as e:
            logger.error(f"LTP data fetch error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def start_websocket(self, tokens: List[Dict[str, str]]) -> Dict[str, Any]:
        """Start WebSocket connection for live data"""
        try:
            if not self.auth_token or not self.feed_token:
                return {"status": "error", "message": "Not authenticated"}
            
            def on_message(ws, message):
                try:
                    data = json.loads(message)
                    # Store live data
                    if 'token' in data:
                        self.live_data[data['token']] = data
                    logger.info(f"Live data received: {data}")
                except Exception as e:
                    logger.error(f"WebSocket message processing error: {str(e)}")
            
            def on_error(ws, error):
                logger.error(f"WebSocket error: {error}")
            
            def on_close(ws, close_status_code, close_msg):
                logger.info("WebSocket connection closed")
            
            def on_open(ws):
                logger.info("WebSocket connection opened")
                # Subscribe to tokens
                if tokens:
                    correlation_id = "stream_1"
                    mode = 3  # FULL mode
                    token_list = [{"exchangeType": token["exchange"], "tokens": [token["token"]]} for token in tokens]
                    ws.send(json.dumps({
                        "correlationID": correlation_id,
                        "action": 1,
                        "params": {
                            "mode": mode,
                            "tokenList": token_list
                        }
                    }))
            
            self.websocket = SmartWebSocketV2(
                auth_token=self.auth_token,
                api_key=self.api_key,
                client_code=self.client_code,
                feed_token=self.feed_token
            )
            
            self.websocket.on_open = on_open
            self.websocket.on_message = on_message
            self.websocket.on_error = on_error
            self.websocket.on_close = on_close
            
            # Start WebSocket in a separate thread
            websocket_thread = threading.Thread(target=self.websocket.connect)
            websocket_thread.daemon = True
            websocket_thread.start()
            
            return {
                "status": "success",
                "message": "WebSocket connection started"
            }
            
        except Exception as e:
            logger.error(f"WebSocket start error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def get_live_data(self, token: str) -> Dict[str, Any]:
        """Get live data for a specific token"""
        try:
            if token in self.live_data:
                return {
                    "status": "success",
                    "data": self.live_data[token]
                }
            else:
                return {
                    "status": "error",
                    "message": "No live data available for token"
                }
        except Exception as e:
            logger.error(f"Live data fetch error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def logout(self) -> Dict[str, Any]:
        """Logout and terminate session"""
        try:
            if self.smart_api:
                logout_response = self.smart_api.terminateSession(self.client_code)
                self.session_active = False
                
                if self.websocket:
                    self.websocket.close()
                
                logger.info("Session terminated successfully")
                return {
                    "status": "success",
                    "message": "Session terminated",
                    "data": logout_response
                }
            else:
                return {"status": "error", "message": "No active session"}
                
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return {"status": "error", "message": str(e)}

# Global service instance
angel_service = AngelOneService()