# 🗑️ Smart Waste Management System

A comprehensive MERN stack web application designed to modernize and optimize waste collection through digital automation, user interaction, and real-time monitoring.

## 🌟 Features

### Multi-User System
- **Resident Users (Free)**: Scan bins, view nearby bins, basic waste disposal tracking
- **Premium Residents**: All free features + bulk waste removal, online payments, scheduled pickups
- **Waste Collectors**: Route management, real-time collection updates, performance tracking
- **Admin**: System-wide monitoring, user management, analytics, and reports

### Core Functionality
- 🔍 **QR Code Scanning**: Scan smart bins to update disposal details
- 🗺️ **Interactive Maps**: View nearby bins and their fill status
- 📱 **Real-time Updates**: Live bin status tracking and notifications
- 💳 **Payment Integration**: Stripe payment system for premium features
- 📊 **Analytics Dashboard**: Comprehensive reporting and statistics
- 🔔 **Notifications**: Real-time alerts and system notifications

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Stripe** for payment processing
- **QRCode** generation library

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Socket.io Client** for real-time updates
- **React Hook Form** for form management

## 📁 Project Structure

```
smart-waste-management/
├── backend/
│   ├── controllers/          # API route handlers
│   ├── middleware/           # Authentication & validation
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── server.js            # Express server setup
│   └── package.json
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Socket)
│   │   ├── pages/           # Page components
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-waste-management
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-waste-management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   
   # Stripe Payment (Optional)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   
   # Email Configuration (Optional)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

7. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   ```

8. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 👥 Demo Accounts

The application includes demo accounts for testing different user roles:

| Role | Email | Password | Features |
|------|-------|----------|----------|
| Resident | resident@demo.com | password123 | Basic waste disposal, bin scanning |
| Premium Resident | premium@demo.com | password123 | All resident features + bulk collection, payments |
| Collector | collector@demo.com | password123 | Route management, collection updates |
| Admin | admin@demo.com | password123 | System management, analytics, user management |

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Bins Management
- `GET /api/bins/nearby` - Get nearby bins
- `GET /api/bins` - Get all bins (with filters)
- `POST /api/bins` - Create new bin (admin)
- `PUT /api/bins/:id/status` - Update bin status

### Collections
- `GET /api/collections` - Get collections
- `POST /api/collections` - Create collection request
- `PUT /api/collections/:id/status` - Update collection status

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/health` - System health check
- `POST /api/admin/reports/generate` - Generate reports

## 🎨 User Interfaces

### Resident Dashboard
- Waste disposal tracking
- Nearby bins map
- QR code scanner
- Upgrade to premium option

### Premium Dashboard
- All resident features
- Bulk collection requests
- Payment history
- Scheduled pickups

### Collector Dashboard
- Assigned routes
- Collection updates
- Performance metrics
- Real-time notifications

### Admin Dashboard
- System overview
- User management
- Bin management
- Analytics and reports

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password encryption with bcrypt
- Input validation and sanitization
- Protected routes and API endpoints

## 📱 Real-time Features

- Live bin status updates
- Collection notifications
- Route progress tracking
- System health monitoring
- Admin notifications

## 💳 Payment Integration

- Stripe payment processing
- Premium subscription management
- Bulk collection payments
- Payment history tracking

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku app
2. Set environment variables
3. Deploy using Git or Heroku CLI

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the build folder to your hosting service

### Database
- Use MongoDB Atlas for cloud database
- Update MONGODB_URI in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Mobile app development
- IoT sensor integration
- Machine learning for waste prediction
- Advanced analytics and reporting
- Multi-language support
- API rate limiting
- Advanced notification system

---

**Built with ❤️ for a cleaner, smarter future**
