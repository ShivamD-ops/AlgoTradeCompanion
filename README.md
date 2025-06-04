# Algorithmic Trading Platform

A comprehensive full-stack trading platform with strategy management, backtesting, and live trading capabilities integrated with AngelOne SmartAPI.

## Features

### Core Trading Features
- **Strategy Management**: Create, edit, and deploy algorithmic trading strategies
- **Backtesting Engine**: Test strategies against historical data with detailed analytics
- **Live Trading**: Execute trades in real-time with paper and live trading modes
- **Portfolio Management**: Track positions, holdings, and performance metrics
- **Real-time Market Data**: Live price feeds and market data from AngelOne

### Technical Features
- **User Authentication**: Secure session-based authentication
- **PostgreSQL Database**: Persistent data storage for all trading data
- **AngelOne Integration**: Complete SmartAPI integration for live trading
- **Modern UI**: Responsive React interface with shadcn/ui components
- **Real-time Updates**: WebSocket connections for live data feeds

## Technology Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** web framework
- **PostgreSQL** database with Drizzle ORM
- **Python** service layer for AngelOne API
- **Session-based authentication**

### Frontend
- **React** with TypeScript
- **Vite** build tool
- **TailwindCSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **Wouter** for routing

### External Integrations
- **AngelOne SmartAPI** for live trading and market data
- **Python smartapi-python** library for API communication

## Prerequisites

- Node.js 18+ 
- Python 3.11+
- PostgreSQL database
- AngelOne trading account with API access

## Installation

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd algorithmic-trading-platform

# Install Node.js dependencies
npm install

# Install Python dependencies (automatically handled by the platform)
```

### 2. Database Setup

The platform uses PostgreSQL for persistent data storage.

```bash
# Ensure PostgreSQL is running
# Create a database for the application

# Push the database schema
npm run db:push
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# AngelOne SmartAPI Configuration
ANGEL_ONE_API_KEY=your_angel_one_api_key
ANGEL_ONE_USERNAME=your_angel_one_username
ANGEL_ONE_PASSWORD=your_angel_one_password
ANGEL_ONE_TOTP_SECRET=your_angel_one_totp_secret
ANGEL_ONE_CLIENT_CODE=your_angel_one_client_code

# Application Configuration
NODE_ENV=development
SESSION_SECRET=your_secure_session_secret
ANGEL_API_BASE_URL=http://localhost:5001
```

### 4. AngelOne API Setup

To enable live trading, you need to set up AngelOne SmartAPI:

1. **Create AngelOne Account**: Sign up for a trading account at AngelOne
2. **Apply for API Access**: Request API access through AngelOne developer portal
3. **Get API Credentials**: Obtain your API key, username, password, and TOTP secret
4. **Configure TOTP**: Set up two-factor authentication and get your TOTP secret key
5. **Update Environment Variables**: Add all credentials to your `.env` file

### 5. Start the Application

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

## Usage

### Getting Started

1. **Register Account**: Create a new user account
2. **Login**: Authenticate with your credentials
3. **Connect AngelOne**: Configure your AngelOne API credentials
4. **Create Strategy**: Build your first trading strategy
5. **Backtest**: Test your strategy against historical data
6. **Deploy**: Activate your strategy for live trading

### Strategy Development

1. Navigate to the **Strategies** page
2. Click **Create Strategy** 
3. Define your strategy parameters:
   - Strategy name and description
   - Trading logic code
   - Risk management parameters
   - Position sizing rules
4. Save and test your strategy

### Backtesting

1. Go to the **Backtesting** page
2. Select a strategy to test
3. Configure backtest parameters:
   - Date range
   - Initial capital
   - Commission settings
4. Run the backtest and analyze results

### Live Trading

1. Navigate to **Live Trading** page
2. Connect to AngelOne API
3. Switch between Paper Trading and Live Trading modes
4. Monitor active strategies and positions
5. Place manual orders if needed

## Database Schema

The platform uses the following main tables:

- **users**: User authentication and profile data
- **strategies**: Trading strategy definitions and code
- **backtests**: Backtest configurations and results
- **trades**: Executed trade records
- **positions**: Current portfolio positions
- **portfolio_history**: Historical portfolio value tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Strategies
- `GET /api/strategies` - Get user strategies
- `POST /api/strategies` - Create new strategy
- `PUT /api/strategies/:id` - Update strategy
- `DELETE /api/strategies/:id` - Delete strategy

### Backtesting
- `GET /api/backtests` - Get backtest history
- `POST /api/backtests` - Run new backtest
- `GET /api/backtests/:id` - Get backtest details

### Trading
- `GET /api/trades` - Get trade history
- `POST /api/trades` - Execute trade
- `GET /api/portfolio/positions` - Get positions
- `GET /api/portfolio/value` - Get portfolio value

### AngelOne Integration
- `POST /api/angel/auth` - Authenticate with AngelOne
- `GET /api/angel/holdings` - Get holdings
- `GET /api/angel/positions` - Get positions
- `POST /api/angel/orders` - Place order
- `GET /api/angel/orders` - Get order book
- `GET /api/angel/search` - Search instruments
- `GET /api/angel/ltp` - Get live prices

## Security Considerations

- All API credentials are stored as environment variables
- Session-based authentication with secure cookies
- Database passwords and sensitive data are encrypted
- API requests are validated and sanitized
- CORS protection for cross-origin requests

## Development

### Database Migrations

```bash
# Push schema changes to database
npm run db:push

# Generate migration files (if needed)
npm run db:generate
```

### Code Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility libraries
├── server/               # Node.js backend
│   ├── services/         # Business logic services
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations
│   └── index.ts          # Server entry point
├── shared/               # Shared TypeScript types
│   └── schema.ts         # Database schema and types
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists and user has permissions

### AngelOne API Issues
- Verify all API credentials are correct
- Check TOTP secret is properly configured
- Ensure API access is enabled in AngelOne account
- Confirm trading account is active

### Application Errors
- Check console logs for detailed error messages
- Verify all environment variables are set
- Ensure all dependencies are installed
- Check network connectivity for API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Contact the development team

## Disclaimer

This trading platform is for educational and development purposes. Always test thoroughly with paper trading before using real money. Trading involves risk and you may lose money. Use at your own risk.