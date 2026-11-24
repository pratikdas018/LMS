# 📚 Learning Management System (LMS)

A comprehensive Learning Management System designed to streamline online education. This web application offers an intuitive interface for instructors to create courses and for students to track their progress, fostering a seamless digital learning environment.

## ✨ Features

### For Students
- 📖 Browse and enroll in courses
- 📊 Track learning progress with visual progress bars
- 📝 Complete quizzes and assignments
- 🏆 Earn certificates upon course completion
- 👤 Personalized student dashboard
- 📈 View performance analytics

### For Teachers
- ➕ Create and manage courses
- 📋 Create quizzes with multiple question types
- ✅ Assign and grade tasks/assignments
- 📊 View detailed analytics on student performance
- 👥 Monitor student progress across courses
- 🎓 Issue certificates to students

### For Administrators
- 👥 User management (students, teachers, admins)
- 📚 Course oversight and management
- 📊 System-wide analytics and reporting
- 🔐 Role-based access control

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js
- **Styling:** Tailwind CSS + Custom CSS
- **Build Tool:** Vite
- **HTTP Client:** Axios
- **Routing:** React Router

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt

## 📁 Project Structure

```
LMS/
├── backend/                    # Server-side application
│   ├── config/                # Database configuration
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Authentication & authorization
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── utils/                 # Utility functions & seeders
│   └── server.js              # Entry point
│
└── frontend/                  # Client-side application
    ├── public/                # Static assets
    ├── src/
    │   ├── components/        # Reusable React components
    │   ├── context/           # React Context (Auth)
    │   ├── pages/             # Page components
    │   ├── utils/             # Utility functions
    │   └── main.jsx           # Entry point
    └── index.html             # HTML template
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LMS
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/lms
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

5. **Seed Database (Optional)**
   ```bash
   cd backend
   npm run seed
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Server will run on `http://localhost:5000`

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Application will run on `http://localhost:5173` (or another port if 5173 is busy)

## 📊 Database Models

- **User** - Student, teacher, and admin accounts
- **Course** - Course information and content
- **Progress** - Student progress tracking
- **Quiz** - Quiz questions and structure
- **QuizAttempt** - Student quiz attempts
- **QuizResult** - Quiz scores and results
- **Task** - Assignments and tasks
- **TaskSubmission** - Student task submissions
- **Certificate** - Course completion certificates

## 🔐 Authentication & Authorization

The application uses JWT-based authentication with role-based access control:
- **Student** - Access to enrolled courses, quizzes, and personal dashboard
- **Teacher** - Create courses, manage content, grade assignments
- **Admin** - Full system access and user management

Protected routes ensure users can only access features appropriate to their role.

## 🎨 Key Components

- **Sidebar** - Navigation menu
- **Topbar** - Header with user information
- **ProgressBar** - Visual progress indicator
- **PrivateRoute** - Authentication protection
- **RoleRoute** - Role-based access control

## 📄 API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Teacher)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course (Teacher)
- `DELETE /api/courses/:id` - Delete course (Teacher)

### Quizzes
- `GET /api/quizzes/:courseId` - Get course quizzes
- `POST /api/quizzes` - Create quiz (Teacher)
- `POST /api/quizzes/:id/submit` - Submit quiz attempt

### Tasks
- `GET /api/tasks/:courseId` - Get course tasks
- `POST /api/tasks` - Create task (Teacher)
- `POST /api/tasks/:id/submit` - Submit task solution

### Progress
- `GET /api/progress/:courseId` - Get course progress
- `PUT /api/progress/:courseId` - Update progress

### Certificates
- `GET /api/certificates/:courseId` - Get course certificate
- `POST /api/certificates` - Issue certificate

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

Pratik Ch: Das

## 🐛 Bug Reports

If you discover any bugs, please create an issue on GitHub with detailed information about the bug and steps to reproduce it.

## 📧 Contact

For questions or support, please contact: pratikdassonu@gmail.com

---

**Built with ❤️ for better education**
