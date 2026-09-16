import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedPassengerRoute from "./components/ProtectedPassengerRoute";

import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import PNRDetails from "./pages/PNRDetails";
import NotFound from "./pages/NotFound";

import PassengerLogin from "./pages/PassengerLogin";
import Register from "./pages/Register";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ManageTrains from "./pages/ManageTrains";
import ManageBookings from "./pages/ManageBookings";
import TrainBookings from "./pages/TrainBookings";

function App() {
  return (
    <BrowserRouter>

      <ScrollToTop />

      <Navbar />

      <main className="app-main">
        <Routes>

          <Route path="/" element={<Home />} />

          <Route
            path="/passenger-login"
            element={<PassengerLogin />}
          />

          <Route path="/register" element={<Register />} />

          <Route path="/search" element={<SearchResults />} />

          {/* PNR details page (opens for a correct PNR) */}
          <Route
            path="/pnr-status/:pnr"
            element={<PNRDetails />}
          />

          <Route
            path="/booking/:trainId"
            element={
              <ProtectedPassengerRoute>
                <Booking />
              </ProtectedPassengerRoute>
            }
          />

          <Route
            path="/booking-confirmation"
            element={
              <ProtectedPassengerRoute>
                <BookingConfirmation />
              </ProtectedPassengerRoute>
            }
          />

          <Route
            path="/my-bookings"
            element={
              <ProtectedPassengerRoute>
                <MyBookings />
              </ProtectedPassengerRoute>
            }
          />

          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/trains"
            element={
              <ProtectedAdminRoute>
                <ManageTrains />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <ProtectedAdminRoute>
                <ManageBookings />
              </ProtectedAdminRoute>
            }
          />

          {/* Bookings of one particular train */}
          <Route
            path="/admin/bookings/:trainId"
            element={
              <ProtectedAdminRoute>
                <TrainBookings />
              </ProtectedAdminRoute>
            }
          />

          <Route path="*" element={<NotFound />} />

        </Routes>
      </main>

      <Footer />

    </BrowserRouter>
  );
}

export default App;
