# Railway Ticket Booking System 🚆

A responsive Railway Ticket Booking System developed using React, JavaScript, HTML, and Bootstrap. The application allows passengers to search trains, check seat availability, book tickets, view bookings, and manage cancellations. It also provides an admin panel for managing trains and bookings.

## 📌 Project Overview

This project is a frontend-based railway ticket booking application designed to simulate a complete passenger and admin booking workflow. It uses React for the user interface, Bootstrap for responsive design, and local JSON and localStorage for managing application data.

## ✨ Key Features

### 👤 Passenger Features

- Passenger Registration and Login
- Search trains by source, destination, and journey date
- Station suggestions
- View train availability
- Select travel class
- View fare and available seats
- Seat availability validation
- Book tickets with passenger details
- Generate PNR number
- View My Bookings
- View booking details
- Ticket cancellation
- Protected passenger routes

### 🛠️ Admin Features

- Admin Login
- Protected Admin Dashboard
- Add new trains
- Update train details
- Delete trains
- Manage routes and schedules
- View and manage bookings
- View passenger and booking details
- Manage booking status
- Ticket cancellation management

### 📱 UI Features

- Responsive design using Bootstrap
- React Router based navigation
- Protected passenger and admin routes
- Form validation
- Seat availability validation
- User-friendly error and success messages
- Responsive navigation bar
- Mobile-friendly interface

## 🛠️ Technologies Used

- React.js
- JavaScript
- HTML5
- CSS3
- Bootstrap
- React Router DOM
- Vite
- JSON
- LocalStorage

## 📂 Project Structure

```text
Railway-main/
├── public/
│   └── data/
│       └── data.json
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── package-lock.json
├── vite.config.js
├── index.html
└── README.md
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-github-repository-url>
```

### 2. Navigate to the Project Folder

```bash
cd Railway-main
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Open in Browser

Open the local URL displayed in the terminal:

```text
http://localhost:5173
```

## 👥 Team Members

### Dinesh Kumar
**Role:** Frontend Developer – Admin & Ticket Management

### Sree Vardhan Sai Kurra
**Role:** Frontend Developer – Passenger Booking & UI

## 👨‍💻 Contributions

### Dinesh

- Developed admin-side user interface
- Implemented admin authentication
- Implemented protected admin routes
- Implemented train management functionality
- Added train creation, update, and delete operations
- Worked on route and schedule management
- Implemented booking management
- Worked on booking status functionality
- Worked on ticket cancellation management
- Worked on responsive admin UI using Bootstrap

### Sree Vardhan Sai Kurra

- Developed passenger-side user interface
- Implemented train search and availability
- Implemented source and destination station suggestions
- Implemented passenger registration and login
- Developed ticket booking workflow
- Implemented seat availability and fare validation
- Developed My Bookings section
- Implemented booking confirmation and PNR functionality
- Implemented passenger route protection
- Worked on responsive UI using Bootstrap

## 📋 Application Modules

The application contains the following major modules:

1. Home / Train Search
2. Train Availability
3. Passenger Registration
4. Passenger Login
5. Ticket Booking
6. Booking Confirmation
7. My Bookings
8. Ticket Cancellation
9. Admin Login
10. Admin Dashboard
11. Train Management
12. Booking Management
13. Route and Schedule Management

## 🔐 Authentication & Route Protection

The application provides separate authentication flows for passengers and administrators.

- Passenger routes are protected from unauthorized access.
- Admin routes are protected using admin authentication.
- Users are redirected to the appropriate login page when they try to access protected pages without authentication.
- Separate navigation options are provided for passengers and administrators.

## 💾 Data Management

The project uses a local JSON file for initial train data and browser localStorage for managing application data during the session.

This approach allows the application to demonstrate train management, booking management, authentication state, and ticket-related workflows without requiring a separate backend server.

## 📱 Responsive Design

The application is designed to work across different screen sizes including:

- Desktop
- Laptop
- Tablet
- Mobile

Bootstrap responsive classes and components are used to provide a mobile-friendly user interface.

## 🌐 Deployment

The application can be deployed using platforms such as Vercel or Netlify.

## ⚠️ Disclaimer

This project is developed for educational and demonstration purposes. It does not process real railway reservations, payments, or official railway services.

## 📄 License

This project is developed for educational and learning purposes.
