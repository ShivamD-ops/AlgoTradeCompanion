import axios from 'axios';

const ANGEL_API_BASE_URL = process.env.ANGEL_API_BASE_URL || 'http://localhost:5001';

export class MarketDataService {
  private angelApiClient = axios.create({
    baseURL: ANGEL_API_BASE_URL,
    timeout: 30000,
  });

  async authenticateAngelOne(): Promise<any> {
    try {
      const response = await this.angelApiClient.post('/auth/login');
      return response.data;
    } catch (error: any) {
      throw new Error(`AngelOne authentication failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getProfile(): Promise<any> {
    try {
      const response = await this.angelApiClient.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(`Profile fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getHoldings(): Promise<any> {
    try {
      const response = await this.angelApiClient.get('/portfolio/holdings');
      return response.data;
    } catch (error: any) {
      throw new Error(`Holdings fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPositions(): Promise<any> {
    try {
      const response = await this.angelApiClient.get('/portfolio/positions');
      return response.data;
    } catch (error: any) {
      throw new Error(`Positions fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async placeOrder(orderParams: any): Promise<any> {
    try {
      const response = await this.angelApiClient.post('/orders', orderParams);
      return response.data;
    } catch (error: any) {
      throw new Error(`Order placement failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async modifyOrder(orderId: string, orderParams: any): Promise<any> {
    try {
      const response = await this.angelApiClient.put(`/orders/${orderId}`, orderParams);
      return response.data;
    } catch (error: any) {
      throw new Error(`Order modification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async cancelOrder(orderId: string, variety: string = 'NORMAL'): Promise<any> {
    try {
      const response = await this.angelApiClient.delete(`/orders/${orderId}?variety=${variety}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Order cancellation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getOrderBook(): Promise<any> {
    try {
      const response = await this.angelApiClient.get('/orders');
      return response.data;
    } catch (error: any) {
      throw new Error(`Order book fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTradeBook(): Promise<any> {
    try {
      const response = await this.angelApiClient.get('/trades');
      return response.data;
    } catch (error: any) {
      throw new Error(`Trade book fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async searchInstruments(searchTerm: string): Promise<any> {
    try {
      const response = await this.angelApiClient.get(`/market/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Instrument search failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getLTP(exchange: string, symbol: string, token: string): Promise<any> {
    try {
      const response = await this.angelApiClient.get(`/market/ltp?exchange=${exchange}&symbol=${symbol}&token=${token}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`LTP fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getHistoricalData(token: string, exchange: string, duration: string, fromDate: string, toDate: string): Promise<any> {
    try {
      const response = await this.angelApiClient.get(`/market/historical?token=${token}&exchange=${exchange}&duration=${duration}&from_date=${fromDate}&to_date=${toDate}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Historical data fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async startWebSocket(tokens: Array<{exchange: string, token: string}>): Promise<any> {
    try {
      const response = await this.angelApiClient.post('/market/websocket/start', tokens);
      return response.data;
    } catch (error: any) {
      throw new Error(`WebSocket start failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getLiveData(token: string): Promise<any> {
    try {
      const response = await this.angelApiClient.get(`/market/live/${token}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Live data fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async logout(): Promise<any> {
    try {
      const response = await this.angelApiClient.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      throw new Error(`Logout failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

export const marketDataService = new MarketDataService();