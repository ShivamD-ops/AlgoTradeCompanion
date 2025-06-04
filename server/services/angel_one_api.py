#!/usr/bin/env python3
"""
AngelOne SmartAPI Bridge Service
This Flask service provides REST endpoints to interact with AngelOne's SmartAPI
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import threading
import time
from angel_one_service import angel_service

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "AngelOne API Bridge"})

@app.route('/auth/login', methods=['POST'])
def authenticate():
    """Authenticate with AngelOne API"""
    result = angel_service.authenticate()
    return jsonify(result)

@app.route('/auth/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    result = angel_service.get_profile()
    return jsonify(result)

@app.route('/auth/logout', methods=['POST'])
def logout():
    """Logout from AngelOne API"""
    result = angel_service.logout()
    return jsonify(result)

@app.route('/portfolio/holdings', methods=['GET'])
def get_holdings():
    """Get user holdings"""
    result = angel_service.get_holdings()
    return jsonify(result)

@app.route('/portfolio/positions', methods=['GET'])
def get_positions():
    """Get user positions"""
    result = angel_service.get_positions()
    return jsonify(result)

@app.route('/orders', methods=['POST'])
def place_order():
    """Place a new order"""
    order_params = request.get_json()
    if not order_params:
        return jsonify({"status": "error", "message": "Invalid order parameters"}), 400
    
    result = angel_service.place_order(order_params)
    return jsonify(result)

@app.route('/orders/<order_id>', methods=['PUT'])
def modify_order(order_id):
    """Modify an existing order"""
    order_params = request.get_json()
    if not order_params:
        return jsonify({"status": "error", "message": "Invalid order parameters"}), 400
    
    order_params['orderid'] = order_id
    result = angel_service.modify_order(order_params)
    return jsonify(result)

@app.route('/orders/<order_id>', methods=['DELETE'])
def cancel_order(order_id):
    """Cancel an order"""
    variety = request.args.get('variety', 'NORMAL')
    result = angel_service.cancel_order(order_id, variety)
    return jsonify(result)

@app.route('/orders', methods=['GET'])
def get_order_book():
    """Get order book"""
    result = angel_service.get_order_book()
    return jsonify(result)

@app.route('/trades', methods=['GET'])
def get_trade_book():
    """Get trade book"""
    result = angel_service.get_trade_book()
    return jsonify(result)

@app.route('/market/search', methods=['GET'])
def search_scrip():
    """Search for instruments"""
    search_term = request.args.get('q', '')
    if not search_term:
        return jsonify({"status": "error", "message": "Search term required"}), 400
    
    result = angel_service.search_scrip(search_term)
    return jsonify(result)

@app.route('/market/ltp', methods=['GET'])
def get_ltp():
    """Get Last Traded Price"""
    exchange = request.args.get('exchange', 'NSE')
    trading_symbol = request.args.get('symbol', '')
    symbol_token = request.args.get('token', '')
    
    if not trading_symbol or not symbol_token:
        return jsonify({"status": "error", "message": "Symbol and token required"}), 400
    
    result = angel_service.get_ltp_data(exchange, trading_symbol, symbol_token)
    return jsonify(result)

@app.route('/market/historical', methods=['GET'])
def get_historical_data():
    """Get historical candle data"""
    symbol_token = request.args.get('token', '')
    exchange = request.args.get('exchange', 'NSE')
    duration = request.args.get('duration', 'ONE_DAY')
    from_date = request.args.get('from_date', '')
    to_date = request.args.get('to_date', '')
    
    if not all([symbol_token, from_date, to_date]):
        return jsonify({"status": "error", "message": "Token, from_date, and to_date required"}), 400
    
    result = angel_service.get_historical_data(symbol_token, exchange, duration, from_date, to_date)
    return jsonify(result)

@app.route('/market/websocket/start', methods=['POST'])
def start_websocket():
    """Start WebSocket for live data"""
    tokens = request.get_json()
    if not tokens:
        return jsonify({"status": "error", "message": "Tokens required"}), 400
    
    result = angel_service.start_websocket(tokens)
    return jsonify(result)

@app.route('/market/live/<token>', methods=['GET'])
def get_live_data(token):
    """Get live data for a token"""
    result = angel_service.get_live_data(token)
    return jsonify(result)

@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"status": "error", "message": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.getenv('ANGEL_API_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)