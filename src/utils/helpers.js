/* ==================================================
   COMMON HELPERS
================================================== */

export const CLASS_LABELS = {
  "1A": "1A - First AC",
  "2A": "2A - AC 2-Tier",
  SL: "SL - Sleeper",
};

export const getClassName = (classCode) =>
  CLASS_LABELS[classCode] ||
  classCode ||
  "Not Available";

/* Read trains from localStorage, otherwise from data.json */
export const loadTrains = async () => {
  const savedTrains = localStorage.getItem("trains");

  if (savedTrains) {
    try {
      return JSON.parse(savedTrains);
    } catch {
      /* ignore broken data and reload from file */
    }
  }

  try {
    const response = await fetch("/data/data.json");
    const data = await response.json();

    localStorage.setItem(
      "trains",
      JSON.stringify(data.trains)
    );

    return data.trains;
  } catch (error) {
    console.error("Error loading train data:", error);
    return [];
  }
};

export const getBookings = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("bookings")) || []
    );
  } catch {
    return [];
  }
};

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
