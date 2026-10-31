import os
import hmac
import secrets
import string
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

from dotenv import load_dotenv
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_db_connection

load_dotenv()

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET_KEY") or "development-only-change-this-secret",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
    SESSION_COOKIE_SECURE=os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true",
)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://railway-ticket-booking-two.vercel.app",
]
extra_origin = os.environ.get("FRONTEND_ORIGIN")
if extra_origin and extra_origin not in allowed_origins:
    allowed_origins.append(extra_origin)

CORS(app, origins=allowed_origins, supports_credentials=True)


def close_db(cursor=None, connection=None):
    if cursor:
        try:
            cursor.close()
        except Exception:
            app.logger.exception("Could not close database cursor")
    if connection:
        try:
            connection.close()
        except Exception:
            app.logger.exception("Could not close database connection")


def format_mysql_time(value):
    if isinstance(value, timedelta):
        total_seconds = int(value.total_seconds())
        hours = (total_seconds // 3600) % 24
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        value = datetime(2000, 1, 1, hours, minutes, seconds)
    if isinstance(value, datetime):
        return value.strftime("%I:%M %p")
    if hasattr(value, "strftime"):
        return value.strftime("%I:%M %p")
    return str(value)


def generate_pnr():
    return "".join(secrets.choice(string.digits) for _ in range(10))


def error_response(message, status):
    return jsonify({"success": False, "message": message}), status


@app.get("/api/health")
def health():
    return jsonify({"success": True, "message": "Railway Flask API is running"})


@app.get("/api/db-check")
def db_check():
    connection = cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        row = cursor.fetchone()
        return jsonify({"success": True, "database": row[0] if row else None})
    except Exception:
        app.logger.exception("Database connection failed")
        return error_response("Database connection failed", 500)
    finally:
        close_db(cursor, connection)


@app.get("/api/trains")
def get_trains():
    connection = cursor = None
    try:
        source = request.args.get("source", "").strip()
        destination = request.args.get("destination", "").strip()
        journey_date = request.args.get("date", "").strip()

        if journey_date:
            try:
                datetime.strptime(journey_date, "%Y-%m-%d")
            except ValueError:
                return error_response("Date must use YYYY-MM-DD format", 400)

        query = """
            SELECT train_id, train_number, train_name, source, destination,
                   journey_date, departure_time, arrival_time, total_seats, base_fare
            FROM trains
            WHERE is_active = TRUE
        """
        params = []
        if source:
            query += " AND LOWER(source) = LOWER(%s)"
            params.append(source)
        if destination:
            query += " AND LOWER(destination) = LOWER(%s)"
            params.append(destination)
        if journey_date:
            query += " AND journey_date = %s"
            params.append(journey_date)
        query += " ORDER BY departure_time"

        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(query, tuple(params))
        train_rows = cursor.fetchall()
        trains = []

        for row in train_rows:
            (
                train_id, train_number, train_name, train_source, train_destination,
                date_value, departure, arrival, total_seats, base_fare,
            ) = row

            cursor.execute(
                """
                SELECT
                    tc.class_id,
                    tc.class_code,
                    tc.class_name,
                    tc.total_seats,
                    tc.fare,
                    GREATEST(
                        tc.total_seats - COALESCE(
                            (
                                SELECT SUM(b.passenger_count)
                                FROM bookings b
                                WHERE b.train_id = tc.train_id
                                AND b.class_id = tc.class_id
                                AND b.journey_date = t.journey_date
                                AND b.booking_status = 'CONFIRMED'
                            ),
                            0
                        ),
                        0
                    ) AS available_seats
                FROM train_classes tc
                JOIN trains t ON t.train_id = tc.train_id
                WHERE tc.train_id = %s
                ORDER BY tc.class_id
                """,
                (train_id,),
            )

            class_rows = cursor.fetchall()

            classes = {
                code: {
                    "classId": class_id,
                    "className": class_name,
                    "seats": int(available_seats),
                    "fare": float(fare),
                }
                for (
                    class_id,
                    code,
                    class_name,
                    total_seats,
                    fare,
                    available_seats,
                ) in class_rows
            }

            trains.append({
                "id": int(train_id),
                "trainNumber": str(train_number),
                "trainName": train_name,
                "source": train_source,
                "destination": train_destination,
                "date": date_value.isoformat() if hasattr(date_value, "isoformat") else str(date_value),
                "departure": format_mysql_time(departure),
                "arrival": format_mysql_time(arrival),
                "seats": int(total_seats),
                "fare": float(base_fare),
                "classes": classes,
            })

        return jsonify({"success": True, "count": len(trains), "trains": trains})
    except Exception:
        app.logger.exception("Train search failed")
        return error_response("Unable to retrieve trains", 500)
    finally:
        close_db(cursor, connection)


@app.post("/api/auth/register")
def register_passenger():
    connection = cursor = None
    try:
        data = request.get_json(silent=True) or {}
        name = data.get("name", "").strip() if isinstance(data.get("name", ""), str) else ""
        email = data.get("email", "").strip().lower() if isinstance(data.get("email", ""), str) else ""
        password = data.get("password", "")

        if not name or not email or not isinstance(password, str) or not password:
            return error_response("Please fill all the fields.", 400)
        if len(password) < 6:
            return error_response("Password must be at least 6 characters long.", 400)

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT user_id FROM users WHERE LOWER(email) = %s", (email,))
        if cursor.fetchone():
            return error_response("This email is already registered.", 409)

        cursor.execute(
            """
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES (%s, %s, %s, 'passenger')
            """,
            (name, email, generate_password_hash(password)),
        )
        user_id = cursor.lastrowid
        connection.commit()
        return jsonify({
            "success": True,
            "message": "Registration successful! Redirecting to login...",
            "user": {"id": user_id, "name": name, "email": email, "role": "passenger"},
        }), 201
    except Exception:
        if connection:
            try:
                connection.rollback()
            except Exception:
                pass
        app.logger.exception("Passenger registration failed")
        return error_response("Unable to register. Please try again.", 500)
    finally:
        close_db(cursor, connection)


@app.post("/api/auth/login")
def passenger_login():
    connection = cursor = None

    try:
        data = request.get_json(silent=True) or {}

        email = (
            data.get("email", "").strip().lower()
            if isinstance(data.get("email", ""), str)
            else ""
        )
        password = data.get("password", "")

        if not email or not isinstance(password, str) or not password:
            return error_response("Please enter your email and password.", 400)

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id, full_name, email, password_hash, role
            FROM users
            WHERE LOWER(email) = %s
            """,
            (email,),
        )

        user = cursor.fetchone()

        if not user or not check_password_hash(
            user["password_hash"], password
        ):
            return error_response("Invalid email or password.", 401)

        # Always start a fresh session after successful authentication.
        session.clear()
        session.permanent = True
        session["user_id"] = int(user["user_id"])
        session["role"] = str(user["role"]).strip().lower()

        app.logger.info(
            "Login successful: user_id=%s, role=%s",
            user["user_id"],
            session["role"],
        )

        return jsonify({
            "success": True,
            "message": "Login successful.",
            "user": {
                "id": int(user["user_id"]),
                "name": user["full_name"],
                "email": user["email"],
                "role": session["role"],
            },
        }), 200

    except Exception:
        app.logger.exception("Login failed")
        return error_response("Unable to log in. Please try again.", 500)

    finally:
        close_db(cursor, connection)




@app.post("/api/admin/login")
def admin_login():
    # Keep the existing admin username/password in backend environment variables.
    # Do not hardcode credentials in source code or expose them in the frontend.
    data = request.get_json(silent=True) or {}

    username = str(data.get("username", ""))
    password = str(data.get("password", ""))
    expected_username = os.environ.get("ADMIN_USERNAME", "")
    expected_password = os.environ.get("ADMIN_PASSWORD", "")

    if not expected_username or not expected_password:
        app.logger.error("Admin credentials are not configured in environment variables.")
        return jsonify({
            "success": False,
            "message": "Admin login is not configured on the server."
        }), 500

    if not (
        hmac.compare_digest(username, expected_username)
        and hmac.compare_digest(password, expected_password)
    ):
        return jsonify({
            "success": False,
            "message": "Invalid admin username or password."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT user_id, role FROM users WHERE user_id = %s",
            (1,)
        )
        user = cursor.fetchone()

        if not user or user["role"] != "admin":
            return jsonify({
                "success": False,
                "message": "Admin database account was not found."
            }), 403

        session.clear()
        session["user_id"] = int(user["user_id"])
        session["role"] = "admin"

        return jsonify({
            "success": True,
            "message": "Admin login successful.",
            "user": {
                "id": user["user_id"],
                "role": "admin"
            }
        }), 200


    except Exception:
        app.logger.exception("Admin login failed")
        return jsonify({
            "success": False,
            "message": "Unable to log in as admin."
        }), 500

    finally:
        close_db(cursor, connection)





@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully."})


@app.get("/api/auth/me")
def current_user():
    if not session.get("user_id"):
        return error_response("Not logged in.", 401)
    connection = cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT user_id, full_name, email, role FROM users WHERE user_id = %s",
            (session["user_id"],),
        )
        user = cursor.fetchone()
        if not user:
            session.clear()
            return error_response("User session is no longer valid.", 401)
        return jsonify({
            "success": True,
            "user": {
                "id": user["user_id"],
                "name": user["full_name"],
                "email": user["email"],
                "role": user["role"],
            },
        })
    except Exception:
        app.logger.exception("Could not retrieve current user")
        return error_response("Unable to retrieve user session.", 500)
    finally:
        close_db(cursor, connection)


@app.post("/api/bookings")
def create_booking():
    if not session.get("user_id"):
        return error_response("Please log in before booking.", 401)

    connection = cursor = None
    try:
        data = request.get_json(silent=True) or {}
        train_id = data.get("train_id")
        class_id = data.get("class_id")
        class_code = data.get("class_code")
        journey_date_raw = data.get("journey_date")
        passenger_list = data.get("passengers")

        if not train_id or not journey_date_raw:
            return error_response("Train and journey date are required.", 400)
        if not class_id and not class_code:
            return error_response("Please select a valid train class.", 400)
        if not isinstance(passenger_list, list) or not passenger_list:
            return error_response("Enter at least one passenger.", 400)
        if len(passenger_list) > 6:
            return error_response("Maximum 6 passengers per booking.", 400)

        try:
            train_id = int(train_id)
            class_id = int(class_id) if class_id else None
            journey_date = datetime.strptime(journey_date_raw, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return error_response("Invalid train, class, or journey date.", 400)

        cleaned_passengers = []
        for index, passenger in enumerate(passenger_list, start=1):
            if not isinstance(passenger, dict):
                return error_response(f"Invalid details for Passenger {index}.", 400)
            name_value = passenger.get("name", "")
            gender = passenger.get("gender", "")
            name = name_value.strip() if isinstance(name_value, str) else ""
            gender = gender.strip() if isinstance(gender, str) else ""
            try:
                age = int(passenger.get("age"))
            except (TypeError, ValueError):
                return error_response(f"Enter a valid age for Passenger {index}.", 400)
            if not name or len(name) > 100:
                return error_response(f"Enter a valid name for Passenger {index}.", 400)
            if age < 1 or age > 120:
                return error_response(f"Passenger {index} age must be between 1 and 120.", 400)
            if gender not in ("Male", "Female", "Other"):
                return error_response(f"Select a valid gender for Passenger {index}.", 400)
            cleaned_passengers.append({"name": name, "age": age, "gender": gender})

        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        # Lock the class row so two concurrent requests cannot both sell the same remaining seats.
        if class_id:
            cursor.execute(
                """
                SELECT tc.class_id, tc.class_code, tc.total_seats, tc.fare, t.train_id
                FROM train_classes tc
                JOIN trains t ON t.train_id = tc.train_id
                WHERE tc.class_id = %s AND tc.train_id = %s
                  AND t.journey_date = %s AND t.is_active = 1
                FOR UPDATE
                """,
                (class_id, train_id, journey_date),
            )
        else:
            cursor.execute(
                """
                SELECT tc.class_id, tc.class_code, tc.total_seats, tc.fare, t.train_id
                FROM train_classes tc
                JOIN trains t ON t.train_id = tc.train_id
                WHERE tc.class_code = %s AND tc.train_id = %s
                  AND t.journey_date = %s AND t.is_active = 1
                FOR UPDATE
                """,
                (class_code, train_id, journey_date),
            )
        selected_class = cursor.fetchone()

        if not selected_class:
            connection.rollback()
            return error_response("Train or selected class was not found for this journey date.", 404)

        cursor.execute(
            """
            SELECT COALESCE(SUM(passenger_count), 0) AS booked_seats
            FROM bookings
            WHERE train_id = %s AND class_id = %s
              AND journey_date = %s AND booking_status = 'CONFIRMED'
            """,
            (train_id, selected_class["class_id"], journey_date),
        )
        booked_seats = int(cursor.fetchone()["booked_seats"] or 0)
        available_seats = int(selected_class["total_seats"]) - booked_seats
        requested_seats = len(cleaned_passengers)

        if requested_seats > available_seats:
            connection.rollback()
            return error_response(
                f"Only {max(available_seats, 0)} seat(s) are available in this class.",
                409,
            )

        total_fare = Decimal(str(selected_class["fare"])) * requested_seats

        pnr = None
        for _ in range(10):
            candidate = generate_pnr()
            cursor.execute("SELECT booking_id FROM bookings WHERE pnr = %s", (candidate,))
            if cursor.fetchone() is None:
                pnr = candidate
                break
        if pnr is None:
            raise RuntimeError("Could not generate a unique PNR.")

        cursor.execute(
            """
            INSERT INTO bookings (
                pnr, user_id, train_id, class_id, journey_date,
                passenger_count, total_fare, booking_status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'CONFIRMED')
            """,
            (
                pnr, session["user_id"], train_id, selected_class["class_id"],
                journey_date, requested_seats, total_fare,
            ),
        )
        booking_id = cursor.lastrowid

        for passenger in cleaned_passengers:
            cursor.execute(
                """
                INSERT INTO passengers (booking_id, passenger_name, age, gender)
                VALUES (%s, %s, %s, %s)
                """,
                (booking_id, passenger["name"], passenger["age"], passenger["gender"]),
            )

        cursor.execute(
            """
            SELECT train_number, train_name, source, destination,
                   departure_time, arrival_time
            FROM trains WHERE train_id = %s
            """,
            (train_id,),
        )
        train = cursor.fetchone()
        cursor.execute(
            "SELECT full_name, email FROM users WHERE user_id = %s",
            (session["user_id"],),
        )
        user = cursor.fetchone()

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Ticket booked successfully.",
            "booking": {
                "booking_id": booking_id,
                "pnr": pnr,
                "passenger_email": user["email"] if user else "",
                "passenger_name": user["full_name"] if user else "",
                "train_id": train_id,
                "train_number": str(train["train_number"]) if train else "",
                "train_name": train["train_name"] if train else "",
                "source": train["source"] if train else "",
                "destination": train["destination"] if train else "",
                "departure": format_mysql_time(train["departure_time"]) if train else "",
                "arrival": format_mysql_time(train["arrival_time"]) if train else "",
                "class_id": int(selected_class["class_id"]),
                "class_code": selected_class["class_code"],
                "journey_date": journey_date.isoformat(),
                "passenger_count": requested_seats,
                "total_fare": float(total_fare),
                "booking_status": "CONFIRMED",
            },
        }), 201

    except Exception:
        if connection:
            try:
                connection.rollback()
            except Exception:
                pass
        app.logger.exception("Ticket booking failed")
        return error_response("Unable to complete booking. Please try again.", 500)
    finally:
        close_db(cursor, connection)


# =========================================================
# GET BOOKINGS FOR THE LOGGED-IN PASSENGER
# =========================================================

@app.get("/api/bookings/my")
def get_my_bookings():
    if not session.get("user_id"):
        return jsonify({
            "success": False,
            "message": "Please log in to view your bookings."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                b.booking_id,
                b.pnr,
                b.train_id,
                b.class_id,
                b.journey_date,
                b.passenger_count,
                b.total_fare,
                b.booking_status,
                t.train_number,
                t.train_name,
                t.source,
                t.destination,
                tc.class_code
            FROM bookings b
            JOIN trains t
                ON t.train_id = b.train_id
            JOIN train_classes tc
                ON tc.class_id = b.class_id
            WHERE b.user_id = %s
            ORDER BY b.booked_at DESC
            """,
            (session["user_id"],)
        )

        booking_rows = cursor.fetchall()
        bookings = []

        for row in booking_rows:
            cursor.execute(
                """
                SELECT
                    passenger_name,
                    age,
                    gender
                FROM passengers
                WHERE booking_id = %s
                ORDER BY passenger_id
                """,
                (row["booking_id"],)
            )

            passenger_rows = cursor.fetchall()

            bookings.append({
                "id": row["booking_id"],
                "pnr": row["pnr"],
                "trainId": row["train_id"],
                "trainNumber": row["train_number"],
                "trainName": row["train_name"],
                "source": row["source"],
                "destination": row["destination"],
                "date": row["journey_date"].isoformat(),
                "class": row["class_code"],
                "seats": row["passenger_count"],
                "totalFare": float(row["total_fare"]),
                "status": row["booking_status"],
                "passengers": [
                    {
                        "name": p["passenger_name"],
                        "age": p["age"],
                        "gender": p["gender"]
                    }
                    for p in passenger_rows
                ]
            })

        return jsonify({
            "success": True,
            "count": len(bookings),
            "bookings": bookings
        }), 200

    except Exception:
        app.logger.exception("Failed to retrieve passenger bookings")

        return jsonify({
            "success": False,
            "message": "Unable to retrieve bookings."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# =========================================================
# CANCEL AN ENTIRE BOOKING
# =========================================================

@app.post("/api/bookings/<int:booking_id>/cancel")
def cancel_my_booking(booking_id):
    if not session.get("user_id"):
        return jsonify({
            "success": False,
            "message": "Please log in to cancel a booking."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT booking_id, booking_status
            FROM bookings
            WHERE booking_id = %s
              AND user_id = %s
            FOR UPDATE
            """,
            (booking_id, session["user_id"])
        )

        booking = cursor.fetchone()

        if not booking:
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "Booking not found."
            }), 404

        if booking["booking_status"] != "CONFIRMED":
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "This booking is not eligible for cancellation."
            }), 409

        cursor.execute(
            """
            UPDATE bookings
            SET booking_status = 'CANCELLED'
            WHERE booking_id = %s
              AND user_id = %s
            """,
            (booking_id, session["user_id"])
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Booking cancelled successfully.",
            "booking_id": booking_id,
            "booking_status": "CANCELLED"
        }), 200

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()

        app.logger.exception("Booking cancellation failed")

        return jsonify({
            "success": False,
            "message": "Unable to cancel booking."
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()



# ============================================================
# ADMIN TRAIN MANAGEMENT APIs
# Add this section before: if __name__ == "__main__":
# ============================================================


def admin_access_error():
    """Check the current user's role directly against the database."""
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Please log in first."
        }), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT user_id, role FROM users WHERE user_id = %s",
            (user_id,)
        )
        user = cursor.fetchone()

        if not user:
            session.clear()
            return jsonify({
                "success": False,
                "message": "User not found. Please log in again."
            }), 401

        # Refresh the role stored in the current Flask session.
        session["role"] = user["role"]

        if user["role"] != "admin":
            return jsonify({
                "success": False,
                "message": "Admin access required. Please use an admin account."
            }), 403

        return None

    except Exception:
        app.logger.exception("Admin authorization check failed")
        return jsonify({
            "success": False,
            "message": "Unable to verify admin access."
        }), 500

    finally:
        close_db(cursor, connection)


# =========================================================
# GET ALL BOOKINGS FOR ADMIN
# =========================================================

@app.get("/api/admin/bookings")
def admin_get_all_bookings():
    error = admin_access_error()
    if error:
        return error

    connection = cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                b.booking_id,
                b.pnr,
                b.user_id,
                b.train_id,
                b.class_id,
                b.journey_date,
                b.passenger_count,
                b.total_fare,
                b.booking_status,
                b.booked_at,
                u.full_name,
                u.email,
                t.train_number,
                t.train_name,
                t.source,
                t.destination,
                t.departure_time,
                t.arrival_time,
                tc.class_code,
                tc.class_name
            FROM bookings b
            JOIN users u ON u.user_id = b.user_id
            JOIN trains t ON t.train_id = b.train_id
            JOIN train_classes tc ON tc.class_id = b.class_id
            ORDER BY b.booked_at DESC, b.booking_id DESC
        """)

        rows = cursor.fetchall()
        bookings = []

        for row in rows:
            cursor.execute("""
                SELECT passenger_name, age, gender
                FROM passengers
                WHERE booking_id = %s
                ORDER BY passenger_id
            """, (row["booking_id"],))

            passenger_rows = cursor.fetchall()

            journey_date = row["journey_date"]
            booked_at = row["booked_at"]

            bookings.append({
                "id": int(row["booking_id"]),
                "bookingId": int(row["booking_id"]),
                "pnr": row["pnr"],
                "userId": int(row["user_id"]),
                "passengerName": row["full_name"],
                "passengerEmail": row["email"],
                "trainId": int(row["train_id"]),
                "trainNumber": str(row["train_number"]),
                "trainName": row["train_name"],
                "source": row["source"],
                "destination": row["destination"],
                "date": journey_date.isoformat(),
                "classId": int(row["class_id"]),
                "class": row["class_code"],
                "className": row["class_name"],
                "seats": int(row["passenger_count"]),
                "passengerCount": int(row["passenger_count"]),
                "totalFare": float(row["total_fare"]),
                "status": row["booking_status"],
                "bookingStatus": row["booking_status"],
                "departure": format_mysql_time(row["departure_time"]),
                "arrival": format_mysql_time(row["arrival_time"]),
                "bookedAt": booked_at.isoformat() if booked_at else None,
                "passengers": [
                    {
                        "name": p["passenger_name"],
                        "age": p["age"],
                        "gender": p["gender"],
                    }
                    for p in passenger_rows
                ],
            })

        return jsonify({
            "success": True,
            "count": len(bookings),
            "bookings": bookings,
        }), 200

    except Exception:
        app.logger.exception("Admin booking list failed")
        return error_response("Unable to retrieve admin bookings.", 500)

    finally:
        close_db(cursor, connection)





# =========================================================
# ADMIN CANCEL A BOOKING (DATABASE-BACKED)
# =========================================================

@app.post("/api/admin/bookings/<int:booking_id>/cancel")
def admin_cancel_booking(booking_id):
    # Only a user whose role in MySQL is admin can cancel here.
    error = admin_access_error()
    if error:
        return error

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        # Lock the booking so duplicate/concurrent cancellation requests
        # cannot both act on the same confirmed booking.
        cursor.execute(
            """
            SELECT booking_id, pnr, booking_status
            FROM bookings
            WHERE booking_id = %s
            FOR UPDATE
            """,
            (booking_id,)
        )
        booking = cursor.fetchone()

        if not booking:
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "Booking not found."
            }), 404

        status = str(booking["booking_status"] or "").strip().upper()
        if status != "CONFIRMED":
            connection.rollback()
            return jsonify({
                "success": False,
                "message": (
                    "This booking is already cancelled or is not eligible "
                    "for cancellation."
                ),
                "bookingStatus": status
            }), 409

        cursor.execute(
            """
            UPDATE bookings
            SET booking_status = 'CANCELLED'
            WHERE booking_id = %s
              AND booking_status = 'CONFIRMED'
            """,
            (booking_id,)
        )

        if cursor.rowcount != 1:
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "Booking status changed. Refresh and try again."
            }), 409

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Booking cancelled successfully by admin.",
            "bookingId": int(booking_id),
            "pnr": booking["pnr"],
            "bookingStatus": "CANCELLED"
        }), 200

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()
        app.logger.exception("Admin booking cancellation failed")
        return jsonify({
            "success": False,
            "message": "Unable to cancel booking. Please try again."
        }), 500

    finally:
        close_db(cursor, connection)


def admin_normalize_time(value):
    """Normalize MySQL time values or user-entered times to HH:MM:SS."""

    if isinstance(value, timedelta):
        total_seconds = int(value.total_seconds()) % 86400
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    if hasattr(value, "strftime") and not isinstance(value, str):
        return value.strftime("%H:%M:%S")

    if value is None:
        raise ValueError("Departure and arrival times are required.")

    value = str(value).strip()
    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M:%S %p"):
        try:
            return datetime.strptime(value, fmt).strftime("%H:%M:%S")
        except ValueError:
            continue

    raise ValueError(
        "Invalid time. Use HH:MM, such as 08:30, or 08:30 AM."
    )

def admin_validate_train(data, partial=False):
    """Validate train fields without changing the database schema."""
    def get_value(camel, snake, default=None):
        if camel in data:
            return data[camel]
        return data.get(snake, default)

    train = {
        "train_number": get_value("trainNumber", "train_number"),
        "train_name": get_value("trainName", "train_name"),
        "source": data.get("source"),
        "destination": data.get("destination"),
        "journey_date": get_value("date", "journey_date"),
        "departure_time": get_value("departure", "departure_time"),
        "arrival_time": get_value("arrival", "arrival_time"),
        "duration": data.get("duration"),
        "running_days": get_value("runningDays", "running_days"),
        "total_seats": get_value("totalSeats", "total_seats"),
        "base_fare": get_value("baseFare", "base_fare"),
    }

    if partial:
        return train

    required = [
        "train_number", "train_name", "source", "destination",
        "journey_date", "departure_time", "arrival_time",
        "total_seats", "base_fare"
    ]

    for field in required:
        value = train[field]
        if value is None or (isinstance(value, str) and not value.strip()):
            raise ValueError(f"{field.replace('_', ' ').title()} is required.")

    for field in (
        "train_number", "train_name", "source", "destination"
    ):
        train[field] = str(train[field]).strip()

    if train["source"].lower() == train["destination"].lower():
        raise ValueError("Source and destination must be different.")

    try:
        train["journey_date"] = datetime.strptime(
            str(train["journey_date"]), "%Y-%m-%d"
        ).date()
    except ValueError:
        raise ValueError("Journey date must use YYYY-MM-DD format.")

    train["departure_time"] = admin_normalize_time(
        str(train["departure_time"])
    )
    train["arrival_time"] = admin_normalize_time(
        str(train["arrival_time"])
    )

    try:
        train["total_seats"] = int(train["total_seats"])
        train["base_fare"] = Decimal(str(train["base_fare"]))
    except (ValueError, TypeError, ArithmeticError):
        raise ValueError("Total seats and base fare must be valid numbers.")

    if train["total_seats"] < 1:
        raise ValueError("Total seats must be at least 1.")

    if not train["base_fare"].is_finite() or train["base_fare"] < 0:
        raise ValueError("Base fare must be a non-negative amount.")

    train["duration"] = train["duration"] or None
    train["running_days"] = train["running_days"] or None

    return train


def admin_validate_classes(classes):
    """Validate optional class details sent by the Admin Dashboard."""
    if not isinstance(classes, list):
        raise ValueError("Classes must be provided as a list.")

    if not classes:
        raise ValueError("Add at least one train class.")

    validated = []
    seen_codes = set()

    for item in classes:
        if not isinstance(item, dict):
            raise ValueError("Each class must be an object.")

        code = item.get("classCode", item.get("class_code", ""))
        name = item.get("className", item.get("class_name", ""))
        seats = item.get("totalSeats", item.get("total_seats"))
        fare = item.get("fare")

        code = str(code).strip().upper()
        name = str(name).strip()

        if not code or not name:
            raise ValueError("Every class needs a code and a name.")

        if code in seen_codes:
            raise ValueError(f"Duplicate class code: {code}")

        seen_codes.add(code)

        try:
            seats = int(seats)
            fare = Decimal(str(fare))
        except (ValueError, TypeError, ArithmeticError):
            raise ValueError(f"Invalid seats or fare for class {code}.")

        if seats < 1:
            raise ValueError(f"Class {code} must have at least one seat.")

        if not fare.is_finite() or fare < 0:
            raise ValueError(f"Class {code} fare must be non-negative.")

        validated.append({
            "class_code": code,
            "class_name": name,
            "total_seats": seats,
            "fare": fare
        })

    return validated


def admin_save_classes(cursor, train_id, classes):
    """
    Insert new class codes or update existing ones.
    Existing class rows are not deleted, protecting booking references.
    """
    for item in classes:
        cursor.execute(
            """
            SELECT class_id
            FROM train_classes
            WHERE train_id = %s AND class_code = %s
            """,
            (train_id, item["class_code"])
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                SELECT COALESCE(SUM(passenger_count), 0) AS booked
                FROM bookings
                WHERE train_id = %s
                  AND class_id = %s
                  AND booking_status = 'CONFIRMED'
                """,
                (train_id, existing["class_id"])
            )
            booked = cursor.fetchone()["booked"]

            if item["total_seats"] < booked:
                raise ValueError(
                    f"Class {item['class_code']} cannot have fewer seats "
                    f"than the {booked} currently booked."
                )

            cursor.execute(
                """
                UPDATE train_classes
                SET class_name = %s, total_seats = %s, fare = %s
                WHERE class_id = %s
                """,
                (
                    item["class_name"],
                    item["total_seats"],
                    item["fare"],
                    existing["class_id"]
                )
            )
        else:
            cursor.execute(
                """
                INSERT INTO train_classes
                    (train_id, class_code, class_name, total_seats, fare)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    train_id,
                    item["class_code"],
                    item["class_name"],
                    item["total_seats"],
                    item["fare"]
                )
            )


# GET: List all trains for the admin, including inactive ones.
@app.get("/api/admin/trains")
def admin_get_trains():
    error = admin_access_error()
    if error:
        return error

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT train_id, train_number, train_name, source, destination,
                   journey_date, departure_time, arrival_time, duration,
                   running_days, is_active, total_seats, base_fare
            FROM trains
            ORDER BY journey_date DESC, departure_time
            """
        )
        rows = cursor.fetchall()
        result = []

        for train in rows:
            cursor.execute(
                """
                SELECT class_id, class_code, class_name, total_seats, fare
                FROM train_classes
                WHERE train_id = %s
                ORDER BY class_id
                """,
                (train["train_id"],)
            )
            classes = cursor.fetchall()

            result.append({
                "id": train["train_id"],
                "trainNumber": train["train_number"],
                "trainName": train["train_name"],
                "source": train["source"],
                "destination": train["destination"],
                "date": (
                    train["journey_date"].isoformat()
                    if train["journey_date"] else None
                ),
                "departure": admin_normalize_time(
                    str(train["departure_time"])
                )[:5],
                "arrival": admin_normalize_time(
                    str(train["arrival_time"])
                )[:5],
                "duration": train["duration"],
                "runningDays": train["running_days"],
                "isActive": bool(train["is_active"]),
                "totalSeats": train["total_seats"],
                "baseFare": float(train["base_fare"]),
                "classes": [
                    {
                        "classId": c["class_id"],
                        "classCode": c["class_code"],
                        "className": c["class_name"],
                        "totalSeats": c["total_seats"],
                        "fare": float(c["fare"])
                    }
                    for c in classes
                ]
            })

        return jsonify({
            "success": True,
            "count": len(result),
            "trains": result
        }), 200

    except Exception:
        app.logger.exception("Admin train listing failed")
        return jsonify({
            "success": False,
            "message": "Unable to retrieve admin train list."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# POST: Add a train and its classes.
@app.post("/api/admin/trains")
def admin_add_train():
    error = admin_access_error()
    if error:
        return error

    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True) or {}
        train = admin_validate_train(data)
        classes = admin_validate_classes(data.get("classes"))

        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            INSERT INTO trains (
                train_number, train_name, source, destination,
                departure_time, arrival_time, duration, running_days,
                is_active, journey_date, total_seats, base_fare
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, %s, %s, %s)
            """,
            (
                train["train_number"], train["train_name"],
                train["source"], train["destination"],
                train["departure_time"], train["arrival_time"],
                train["duration"], train["running_days"],
                train["journey_date"], train["total_seats"],
                train["base_fare"]
            )
        )

        train_id = cursor.lastrowid
        admin_save_classes(cursor, train_id, classes)
        connection.commit()

        return jsonify({
            "success": True,
            "message": "Train added successfully.",
            "trainId": train_id
        }), 201

    except ValueError as exc:
        if connection and connection.is_connected():
            connection.rollback()
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 400

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()
        app.logger.exception("Admin add train failed")
        return jsonify({
            "success": False,
            "message": "Unable to add train. Check server logs."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# PUT: Edit a train. If "classes" is supplied, upsert those class codes.
@app.put("/api/admin/trains/<int:train_id>")
def admin_update_train(train_id):
    error = admin_access_error()
    if error:
        return error

    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True) or {}
        train = admin_validate_train(data)

        classes = None
        if "classes" in data:
            classes = admin_validate_classes(data["classes"])

        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT train_id FROM trains WHERE train_id = %s FOR UPDATE",
            (train_id,)
        )
        if not cursor.fetchone():
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "Train not found."
            }), 404

        cursor.execute(
            """
            UPDATE trains
            SET train_number = %s,
                train_name = %s,
                source = %s,
                destination = %s,
                departure_time = %s,
                arrival_time = %s,
                duration = %s,
                running_days = %s,
                journey_date = %s,
                total_seats = %s,
                base_fare = %s
            WHERE train_id = %s
            """,
            (
                train["train_number"], train["train_name"],
                train["source"], train["destination"],
                train["departure_time"], train["arrival_time"],
                train["duration"], train["running_days"],
                train["journey_date"], train["total_seats"],
                train["base_fare"], train_id
            )
        )

        if classes is not None:
            admin_save_classes(cursor, train_id, classes)

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Train updated successfully."
        }), 200

    except ValueError as exc:
        if connection and connection.is_connected():
            connection.rollback()
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 400

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()
        app.logger.exception("Admin update train failed")
        return jsonify({
            "success": False,
            "message": "Unable to update train. Check server logs."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# DELETE: Soft-delete a train; preserve existing bookings and history.
@app.delete("/api/admin/trains/<int:train_id>")
def admin_deactivate_train(train_id):
    error = admin_access_error()
    if error:
        return error

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "UPDATE trains SET is_active = 0 WHERE train_id = %s",
            (train_id,)
        )

        if cursor.rowcount == 0:
            connection.rollback()
            return jsonify({
                "success": False,
                "message": "Train not found or already inactive."
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Train deactivated successfully."
        }), 200

    except Exception:
        if connection and connection.is_connected():
            connection.rollback()
        app.logger.exception("Admin deactivate train failed")
        return jsonify({
            "success": False,
            "message": "Unable to deactivate train."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()






if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=os.environ.get("FLASK_DEBUG", "true").lower() == "true")
