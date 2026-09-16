/* ==================================================
   AUTH HELPER
   --------------------------------------------------
   Login information is stored in sessionStorage.

   sessionStorage is cleared automatically by the
   browser when the tab / window is closed, so the
   user is logged out when the window is closed.

   Permanent data (users, trains, bookings) still
   uses localStorage.
================================================== */

const PASSENGER_FLAG = "isPassenger";
const PASSENGER_DATA = "loggedInPassenger";
const ADMIN_FLAG = "isAdmin";

/* ---------- PASSENGER ---------- */

export const isPassengerLoggedIn = () =>
  sessionStorage.getItem(PASSENGER_FLAG) === "true";

export const getLoggedInPassenger = () => {
  try {
    return JSON.parse(
      sessionStorage.getItem(PASSENGER_DATA)
    );
  } catch {
    return null;
  }
};

export const loginPassenger = (user) => {
  sessionStorage.setItem(PASSENGER_FLAG, "true");

  sessionStorage.setItem(
    PASSENGER_DATA,
    JSON.stringify(user)
  );
};

export const logoutPassenger = () => {
  sessionStorage.removeItem(PASSENGER_FLAG);
  sessionStorage.removeItem(PASSENGER_DATA);
  sessionStorage.removeItem("pendingBookingTrainId");
  sessionStorage.removeItem("pendingBookingClass");
};

/* ---------- ADMIN ---------- */

export const isAdminLoggedIn = () =>
  sessionStorage.getItem(ADMIN_FLAG) === "true";

export const loginAdmin = () => {
  sessionStorage.setItem(ADMIN_FLAG, "true");
};

export const logoutAdmin = () => {
  sessionStorage.removeItem(ADMIN_FLAG);
};

/* ---------- CLEAN OLD LOGIN DATA ---------- */

/*
  Older versions of this project kept the login
  details in localStorage. Those old values would
  keep the user logged in even after closing the
  window, so they are removed once on app start.
*/
export const clearOldLocalLogin = () => {
  localStorage.removeItem(PASSENGER_FLAG);
  localStorage.removeItem(PASSENGER_DATA);
  localStorage.removeItem(ADMIN_FLAG);
  localStorage.removeItem("pendingBookingTrainId");
  localStorage.removeItem("pendingBookingClass");
};
