# TCN - Complaint Management System

**Tanuku Communication Network (TCN)** - A comprehensive web application for managing customer complaints in a local cable network office.

## 🎯 Features

### Core Functionality
- **Phone Number Authentication** - Customers login using their 10-digit phone number as a unique ID
- **Block-Based Assignment** - Complaints are assigned to technicians based on their service block (A1, B2, C3, etc.)
- **Round-Robin Assignment** - Fair workload distribution among available technicians
- **Leave Management** - Technicians can mark themselves on leave, preventing auto-assignment
- **Real-time Dashboard** - Manager dashboard with performance metrics and analytics
- **Performance Tracking** - Acknowledgement time and resolution time tracking for each complaint

### Role-Based Dashboards

#### 👤 Customer Dashboard
- View all personal complaints
- Register new complaints
- Track complaint status in real-time

#### 🔧 Technician Dashboard
- View assigned complaints
- Acknowledge complaints
- Mark complaints as resolved
- Toggle availability status
- Performance metrics

#### 👔 Manager Dashboard
- Overall system statistics
- Technician performance analytics
- Pause/Resume auto-assignment engine
- Complaint trends and charts
- Block-wise complaint distribution

#### 📞 Call Center Staff Dashboard
- Register complaints on behalf of customers
- View all complaints system-wide
- Monitor technician availability

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Create a .env file (see backend/.env for reference)

# Seed the database with sample data
node scripts/seed.js

# Start the development server
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🗄️ Database Schema

### Collections

#### Users
- Stores all user accounts (customers, technicians, staff, managers)
- Phone number is the unique identifier

#### Technicians
- Extended profile for technician users
- Tracks availability, workload, performance metrics

#### Complaints
- All complaint records
- Linked to customers and assigned technicians
- Tracks lifecycle: Open → Assigned → In Progress → Closed

#### Settings
- System configuration
- Auto-assignment toggle

## 🔐 Authentication

- Phone number-based login (10 digits)
- JWT tokens for session management
- Role-based access control (RBAC)
- Automatic customer registration on first login

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface with Tailwind CSS
- **Responsive** - Works on desktop, tablet, and mobile
- **Dark Accents** - Professional color scheme with blue gradients
- **Smooth Animations** - Subtle transitions and hover effects
- **Toast Notifications** - Real-time feedback for user actions

## 📊 Dashboard Features

### Manager Dashboard Includes:
- ✅ Total complaints, open, in-progress, and closed counts
- ✅ Average resolution and acknowledgement times
- ✅ Bar chart showing technician performance
- ✅ Line chart showing 30-day complaint trends
- ✅ Block-wise complaint distribution
- ✅ Pause/Resume auto-assignment toggle

## 🔄 Auto-Assignment Logic

The system uses a **block-based round-robin algorithm**:

1. When a complaint is registered, the system identifies the block (e.g., A1)
2. Finds all available technicians in that block
3. Filters out technicians who are:
   - On leave (`onLeave: true`)
   - Not available (`isAvailable: false`)
4. Selects the technician with the lowest `roundRobinIndex`
5. Assigns the complaint and increments the technician's index

This ensures:
- Fair workload distribution
- Block-based locality
- Respect for leave schedules

## 🧪 Sample Data

After running the seed script, you'll have:

### Login Credentials:
- **Manager**: `9999999999`
- **Staff**: `9888888888`
- **Technician (Rambabu)**: `9876543201`
- **Customers**: `9876540001` to `9876540010`

### Sample Data Includes:
- 1 Manager
- 1 Staff member
- 6 Technicians across 3 blocks (A1, B2, C3)
- 10 Sample customers
- 20 Sample complaints with various statuses

## 🚀 Deployment

### Production Build

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

### Environment Variables (Production)

```env
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
PORT=5000
NODE_ENV=production
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with phone number
- `POST /api/auth/register` - Register new user

### Complaints
- `GET /api/complaints` - Get complaints (filtered by role)
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/:id` - Get complaint details
- `PATCH /api/complaints/:id/acknowledge` - Acknowledge complaint
- `PATCH /api/complaints/:id/close` - Close complaint
- `PATCH /api/complaints/:id/reassign` - Reassign to different technician

### Technicians
- `GET /api/technicians` - Get all technicians
- `PATCH /api/technicians/:id/leave` - Update leave status
- `PATCH /api/technicians/:id/availability` - Toggle availability

### Dashboard
- `GET /api/dashboard/stats` - Manager dashboard statistics
- `GET /api/dashboard/technician/:id` - Technician dashboard

### Settings
- `GET /api/settings` - Get system settings
- `PATCH /api/settings/autoassign` - Toggle auto-assignment

## 🤝 Contributing

This is a project for TCN (Tanuku Communication Network). For internal use only.

## 📄 License

Proprietary - All rights reserved by TCN

## 👥 Credits

Developed for **Tanuku Communication Network (TCN)** to streamline complaint management and improve customer service efficiency.

---

**Built with ❤️ for TCN**

