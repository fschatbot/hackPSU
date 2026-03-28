# CodeLens Backend Server

Backend API server for CodeLens with JWT authentication and PostgreSQL database.

## Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

## Setup Instructions

### 1. Install PostgreSQL

#### Windows
Download and install from: https://www.postgresql.org/download/windows/

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE codelens;

# Exit psql
\q
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Configure Environment

Create a `.env` file in the `server` directory:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codelens
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password

# JWT Configuration (IMPORTANT: Change this in production!)
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 5. Initialize Database Schema

```bash
# Connect to your database
psql -U postgres -d codelens -f database/schema.sql
```

Or manually run the SQL:

```bash
psql -U postgres -d codelens
\i database/schema.sql
\q
```

### 6. Start the Server

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════════╗
║     CodeLens Server Started               ║
║                                           ║
║  🚀 Server: http://localhost:3001         ║
║  🗄️  Database: PostgreSQL                 ║
║  🔐 Auth: JWT                             ║
║                                           ║
╚═══════════════════════════════════════════╝
```

## API Endpoints

### Authentication

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <your-jwt-token>

Response:
{
  "success": true,
  "user": { ... }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <your-jwt-token>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Health Check
```http
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database Schema

### users
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR UNIQUE)
- `password_hash` (VARCHAR)
- `name` (VARCHAR)
- `avatar` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### sessions (optional)
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users)
- `token_hash` (VARCHAR)
- `expires_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

### projects (future use)
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users)
- `name` (VARCHAR)
- `description` (TEXT)
- `files` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Security Notes

### Production Deployment

1. **Change JWT_SECRET**: Use a strong, random secret (minimum 32 characters)
   ```bash
   # Generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use HTTPS**: Always use HTTPS in production

3. **Database Security**:
   - Use strong PostgreSQL passwords
   - Limit database access to localhost or specific IPs
   - Enable SSL for database connections in production

4. **Environment Variables**: Never commit `.env` file to version control

5. **Rate Limiting**: Consider adding rate limiting for authentication endpoints

6. **CORS**: Update CORS_ORIGIN to match your production domain

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
# macOS/Linux
pg_isready

# Windows
pg_ctl status

# Test connection
psql -U postgres -d codelens -c "SELECT 1"
```

### Port Already in Use
```bash
# Change PORT in .env file or kill the process using port 3001
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### JWT Token Errors
- Ensure JWT_SECRET is set in .env
- Check token expiration time
- Verify token is being sent with "Bearer " prefix

## Development

### Run Tests (when implemented)
```bash
npm test
```

### Database Migrations (future)
```bash
npm run migrate
```

## License

MIT
