
// src/utils/helpers.js

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// --------------------------------------------------
// CLASS LABELS
// --------------------------------------------------

export const CLASS_LABELS = {
  SL: "Sleeper",
  "3A": "AC 3 Tier",
  "2A": "AC 2 Tier",
  "1A": "AC First Class",
  CC: "Chair Car",
  EC: "Executive Chair Car",
  "3E": "AC 3 Economy",
  "2S": "Second Sitting",
};

export const getClassName = (classCode) => {
  if (!classCode) return "General";

  return (
    CLASS_LABELS[String(classCode).toUpperCase()] ||
    String(classCode)
  );
};

// --------------------------------------------------
// API RESPONSE HELPER
// --------------------------------------------------

const readApiResponse = async (response) => {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from server.");
  }

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

// --------------------------------------------------
// LOAD TRAINS FROM FLASK API
// --------------------------------------------------

export const loadTrains = async (filters = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();

  const url = `${API_BASE_URL}/api/trains${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await readApiResponse(response);

    // Supports either { trains: [...] } or a direct array.
    if (Array.isArray(data)) {
      return data;
    }

    return Array.isArray(data.trains) ? data.trains : [];
  } catch (error) {
    console.error("Error loading trains:", error);
    throw error;
  }
};

// --------------------------------------------------
// --------------------------------------------------
// LOAD ALL TRAINS FOR ADMIN FROM MYSQL / FLASK API
// Includes inactive trains, unlike the public train search.
// --------------------------------------------------

export const loadAdminTrains = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/trains`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const data = await readApiResponse(response);
  return Array.isArray(data.trains) ? data.trains : [];
};

// LOAD ALL BOOKINGS FOR ADMIN FROM MYSQL / FLASK API
// --------------------------------------------------

export const loadAdminBookings = async () => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/bookings`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const data = await readApiResponse(response);
  return Array.isArray(data.bookings) ? data.bookings : [];
};

// --------------------------------------------------
// LOAD LOGGED-IN USER'S BOOKINGS FROM FLASK API
// --------------------------------------------------

export const loadMyBookings = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/bookings/my`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await readApiResponse(response);

    return Array.isArray(data.bookings) ? data.bookings : [];
  } catch (error) {
    console.error("Error loading my bookings:", error);
    throw error;
  }
};

// --------------------------------------------------
// LOCALSTORAGE BOOKINGS
// Kept for compatibility with older frontend components.
// Admin Manage Bookings should use loadAdminBookings()
// to get current booking statuses from MySQL.
// --------------------------------------------------

export const getBookings = () => {
  try {
    const savedBookings = localStorage.getItem("bookings");

    if (!savedBookings) {
      return [];
    }

    const parsedBookings = JSON.parse(savedBookings);

    return Array.isArray(parsedBookings) ? parsedBookings : [];
  } catch (error) {
    console.error("Error reading local bookings:", error);
    return [];
  }
};

export const saveBookings = (bookings) => {
  try {
    if (!Array.isArray(bookings)) {
      throw new Error("Bookings must be an array.");
    }

    localStorage.setItem("bookings", JSON.stringify(bookings));

    return true;
  } catch (error) {
    console.error("Error saving local bookings:", error);
    return false;
  }
};

export const saveBooking = (booking) => {
  try {
    if (!booking || typeof booking !== "object") {
      throw new Error("Invalid booking data.");
    }

    const bookings = getBookings();

    const bookingId = booking.id ?? booking.bookingId;

    const existingIndex = bookings.findIndex((item) => {
      const itemId = item.id ?? item.bookingId;

      return (
        (bookingId != null && String(itemId) === String(bookingId)) ||
        (booking.pnr && item.pnr === booking.pnr)
      );
    });

    if (existingIndex >= 0) {
      bookings[existingIndex] = {
        ...bookings[existingIndex],
        ...booking,
      };
    } else {
      bookings.push(booking);
    }

    return saveBookings(bookings);
  } catch (error) {
    console.error("Error saving booking:", error);
    return false;
  }
};

export const cancelBooking = (bookingId) => {
  try {
    const bookings = getBookings();

    const updatedBookings = bookings.map((booking) => {
      const id = booking.id ?? booking.bookingId;

      if (String(id) === String(bookingId)) {
        return {
          ...booking,
          status: "CANCELLED",
          bookingStatus: "CANCELLED",
        };
      }

      return booking;
    });

    return saveBookings(updatedBookings);
  } catch (error) {
    console.error("Error cancelling local booking:", error);
    return false;
  }
};

// --------------------------------------------------
// GET SEATS ALREADY BOOKED IN LOCALSTORAGE
// Legacy frontend helper.
// The Flask backend should be the source of truth.
// --------------------------------------------------

export const getBookedSeats = (trainId, classCode, journeyDate) => {
  const bookings = getBookings();

  return bookings
    .filter((booking) => {
      const sameTrain =
        String(booking.trainId ?? booking.train_id) ===
        String(trainId);

      const bookingClass =
        booking.classCode ?? booking.class ?? booking.class_code;

      const sameClass =
        String(bookingClass).toUpperCase() ===
        String(classCode).toUpperCase();

      const sameDate =
        !journeyDate ||
        !booking.date ||
        String(booking.date).slice(0, 10) ===
          String(journeyDate).slice(0, 10);

      const status = String(
        booking.status ?? booking.bookingStatus ?? "CONFIRMED"
      ).toUpperCase();

      return (
        sameTrain &&
        sameClass &&
        sameDate &&
        status !== "CANCELLED"
      );
    })
    .reduce((total, booking) => {
      const passengerCount =
        booking.passengers?.length ??
        booking.passengerCount ??
        booking.seats ??
        0;

      return total + Number(passengerCount || 0);
    }, 0);
};

// --------------------------------------------------
// FORMAT DATE
// Handles YYYY-MM-DD without timezone shifting.
// --------------------------------------------------

export const formatDate = (dateValue) => {
  if (!dateValue) {
    return "N/A";
  }

  try {
    const dateString = String(dateValue).slice(0, 10);
    const parts = dateString.split("-");

    if (
      parts.length === 3 &&
      parts[0].length === 4 &&
      parts.every((part) => part !== "")
    ) {
      const [year, month, day] = parts;

      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );

      if (Number.isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
};

// --------------------------------------------------
// FORMAT TIME
// --------------------------------------------------

export const formatTime = (timeValue) => {
  if (!timeValue) {
    return "N/A";
  }

  const timeString = String(timeValue);

  // Handles HH:mm:ss or HH:mm.
  const match = timeString.match(/^(\d{1,2}):(\d{2})/);

  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) {
      return timeString;
    }

    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  }

  return timeString;
};

// --------------------------------------------------
// CURRENCY FORMAT
// --------------------------------------------------

export const formatCurrency = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "₹0";
  }

  return numericAmount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
};

// --------------------------------------------------
// GET BOOKING STATUS
// --------------------------------------------------

export const getBookingStatus = (booking) => {
  return String(
    booking?.status ??
      booking?.bookingStatus ??
      booking?.booking_status ??
      "UNKNOWN"
  ).toUpperCase();
};

// --------------------------------------------------
// CHECK WHETHER BOOKING IS CANCELLED
// --------------------------------------------------

export const isBookingCancelled = (booking) => {
  return getBookingStatus(booking) === "CANCELLED";
};

// --------------------------------------------------
// CANCEL BOOKING THROUGH FLASK API
// This is for the logged-in passenger's own booking.
// --------------------------------------------------

export const cancelMyBooking = async (bookingId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/bookings/${encodeURIComponent(
        bookingId
      )}/cancel`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const data = await readApiResponse(response);

    return data;
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

// --------------------------------------------------
// CANCEL A BOOKING AS ADMIN (MYSQL / FLASK API)
// --------------------------------------------------

export const cancelAdminBooking = async (bookingId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  return await readApiResponse(response);
};

// --------------------------------------------------
// EXPORT API BASE URL
// --------------------------------------------------

export { API_BASE_URL };