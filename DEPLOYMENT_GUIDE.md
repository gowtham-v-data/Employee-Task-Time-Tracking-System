# Deployment Guide

## Employee Task Performance & Productivity Tracker

This guide covers deploying the application to production environments.

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] Environment variables configured
- [ ] Database created and accessible
- [ ] Database migrations ready
- [ ] Email service configured (SMTP)
- [ ] JWT secret generated (strong, random)
- [ ] CORS origins configured for production
- [ ] Rate limiting configured appropriately
- [ ] Error logging configured
- [ ] Health check endpoint tested

### Frontend
- [ ] API base URL updated for production
- [ ] Build tested locally (`npm run build`)
- [ ] Environment variables configured
- [ ] Assets optimized
- [ ] Service worker configured (if using)

### Security
- [ ] All secrets removed from code
- [ ] HTTPS enabled
- [ ] Security headers configured (Helmet)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

---

## 🚀 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, Linode)

#### Backend Deployment

1. **Provision Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2 (process manager)
sudo npm install -g pm2
```

2. **Setup Application**
```bash
# Clone repository
git clone <your-repo-url>
cd employee-task-tracker/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add production environment variables

# Run migrations (if using)
npm run migrate

# Seed database (optional, for initial data)
npm run seed
```

3. **Configure PM2**
```bash
# Start application with PM2
pm2 start src/server.js --name "task-tracker-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

4. **Setup Nginx as Reverse Proxy**
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/task-tracker-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/task-tracker-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

5. **Setup SSL with Let's Encrypt**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

#### Frontend Deployment

1. **Build Frontend**
```bash
cd frontend
npm install
npm run build
# This creates a 'dist' folder
```

2. **Deploy to Nginx**
```bash
# Copy build files to web root
sudo cp -r dist/* /var/www/task-tracker/

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/task-tracker-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/task-tracker;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/task-tracker-frontend /etc/nginx/sites-enabled/

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option 2: Heroku

#### Backend Deployment

1. **Prepare Application**
```bash
# Create Procfile in backend directory
echo "web: node src/server.js" > backend/Procfile

# Ensure package.json has start script
# "start": "node src/server.js"
```

2. **Deploy to Heroku**
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create your-app-name-api

# Add MySQL addon (ClearDB or JawsDB)
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-here
heroku config:set JWT_EXPIRES_IN=8h
# ... set all other environment variables

# Deploy
git subtree push --prefix backend heroku main

# Run migrations (if using)
heroku run npm run migrate

# Check logs
heroku logs --tail
```

#### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel

# Follow prompts
# Set build command: npm run build
# Set output directory: dist
```

3. **Configure Environment Variables**
- Go to Vercel dashboard
- Add `VITE_API_URL` with your backend URL

---

### Option 3: Docker Deployment

#### Create Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Frontend nginx.conf**:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - app-network

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}
      EMAIL_HOST: ${EMAIL_HOST}
      EMAIL_PORT: ${EMAIL_PORT}
      EMAIL_USER: ${EMAIL_USER}
      EMAIL_PASSWORD: ${EMAIL_PASSWORD}
      EMAIL_FROM: ${EMAIL_FROM}
      FRONTEND_URL: ${FRONTEND_URL}
    ports:
      - "5000:5000"
    depends_on:
      - mysql
    networks:
      - app-network

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mysql_data:

networks:
  app-network:
    driver: bridge
```

**Deploy with Docker Compose**:
```bash
# Create .env file with all variables
cp .env.example .env
# Edit .env with production values

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

### Option 4: AWS Deployment

#### Backend (AWS Elastic Beanstalk)

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize and Deploy**
```bash
cd backend
eb init -p node.js-18 task-tracker-api --region us-east-1
eb create task-tracker-api-env

# Set environment variables
eb setenv NODE_ENV=production JWT_SECRET=your-secret ...

# Deploy
eb deploy

# Open in browser
eb open
```

#### Frontend (AWS S3 + CloudFront)

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Create S3 Bucket**
```bash
aws s3 mb s3://your-app-name
aws s3 website s3://your-app-name --index-document index.html --error-document index.html
```

3. **Upload Files**
```bash
aws s3 sync dist/ s3://your-app-name --delete
```

4. **Setup CloudFront** (via AWS Console)
- Create CloudFront distribution
- Set origin to S3 bucket
- Configure custom error pages (404 → /index.html)
- Add custom domain (optional)
- Enable HTTPS

#### Database (AWS RDS)

1. **Create RDS MySQL Instance** (via AWS Console)
- Choose MySQL 8.0
- Select instance size
- Configure security groups
- Note endpoint URL

2. **Update Backend Environment Variables**
```bash
eb setenv DB_HOST=your-rds-endpoint.rds.amazonaws.com
```

---

## 🔒 Security Best Practices

### Environment Variables

**Never commit these to version control!**

Required production environment variables:

```bash
# Backend (.env)
NODE_ENV=production
PORT=5000

# Database
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=employee_tracker
DB_USER=your-db-user
DB_PASSWORD=strong-password-here

# JWT
JWT_SECRET=very-strong-random-secret-at-least-32-chars
JWT_EXPIRES_IN=8h

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL (for CORS and email links)
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generate Strong JWT Secret

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database Security

1. **Use strong passwords**
2. **Restrict database access** to backend server only
3. **Enable SSL/TLS** for database connections
4. **Regular backups** (automated)
5. **Keep MySQL updated**

### Application Security

1. **Enable HTTPS** (Let's Encrypt or CloudFlare)
2. **Configure CORS** properly
3. **Enable rate limiting**
4. **Use Helmet.js** (already configured)
5. **Keep dependencies updated**
6. **Monitor logs** for suspicious activity

---

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs task-tracker-api

# Monitor resources
pm2 monit

# View process info
pm2 info task-tracker-api
```

### Application Logging

Consider adding logging service:
- **Papertrail**
- **Loggly**
- **CloudWatch** (AWS)
- **Stackdriver** (Google Cloud)

### Uptime Monitoring

Use services like:
- **UptimeRobot**
- **Pingdom**
- **StatusCake**

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/task-tracker/backend
            git pull origin main
            npm install --production
            pm2 restart task-tracker-api

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "frontend/dist/*"
          target: "/var/www/task-tracker/"
```

---

## 🗄️ Database Backup

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

# Configuration
DB_NAME="employee_tracker"
DB_USER="your_user"
DB_PASSWORD="your_password"
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Setup Cron Job

```bash
# Make script executable
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /path/to/backup.sh
```

---

## 🔧 Troubleshooting

### Backend Issues

**Application won't start:**
```bash
# Check logs
pm2 logs task-tracker-api

# Check environment variables
pm2 env 0

# Restart application
pm2 restart task-tracker-api
```

**Database connection issues:**
```bash
# Test MySQL connection
mysql -h DB_HOST -u DB_USER -p

# Check MySQL status
sudo systemctl status mysql
```

### Frontend Issues

**404 errors on refresh:**
- Ensure Nginx is configured with `try_files $uri $uri/ /index.html`

**API calls failing:**
- Check CORS configuration
- Verify API URL in frontend environment variables
- Check browser console for errors

### Performance Issues

**High CPU usage:**
```bash
# Check PM2 metrics
pm2 monit

# Check system resources
htop
```

**Slow database queries:**
```bash
# Enable MySQL slow query log
# Add to /etc/mysql/mysql.conf.d/mysqld.cnf:
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

---

## 📈 Scaling

### Horizontal Scaling

1. **Load Balancer** (Nginx, HAProxy, AWS ELB)
2. **Multiple Backend Instances**
3. **Database Read Replicas**
4. **Redis for Session Storage**

### Vertical Scaling

1. **Increase server resources** (CPU, RAM)
2. **Optimize database** (indexes, query optimization)
3. **Enable caching** (Redis, Memcached)

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] All features working correctly
- [ ] Database backups configured
- [ ] Monitoring setup
- [ ] Error logging configured
- [ ] SSL certificate auto-renewal working
- [ ] Email notifications working
- [ ] Performance acceptable
- [ ] Security headers configured
- [ ] CORS working correctly
- [ ] Rate limiting active
- [ ] Documentation updated with production URLs

---

## 📞 Support

For deployment issues:
1. Check application logs
2. Review this deployment guide
3. Check SETUP.md for configuration issues
4. Review API_DOCUMENTATION.md for endpoint issues

---

**Deployment Guide Version**: 1.0  
**Last Updated**: May 1, 2026  
**Application**: Employee Task Performance & Productivity Tracker
