
import json
from datetime import datetime
from pathlib import Path

from db import get_db_connection

DATA_FILE = Path(__file__).parent / "data.json"

CLASS_NAMES = {
    "1A": "First AC",
    "2A": "Second AC",
    "SL": "Sleeper",
}


def convert_time(value):
    return datetime.strptime(value, "%I:%M %p").strftime("%H:%M:%S")


def import_trains():
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Train data file not found: {DATA_FILE}"
        )

    with DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    connection = get_db_connection()
    cursor = connection.cursor()

    try:
        for train in data["trains"]:
            journey_date = datetime.strptime(
                train["date"], "%Y-%m-%d"
            ).date()

            cursor.execute(
                """
                INSERT INTO trains (
                    train_number,
                    train_name,
                    source,
                    destination,
                    departure_time,
                    arrival_time,
                    journey_date,
                    duration,
                    running_days,
                    is_active,
                    total_seats,
                    base_fare
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s
                )
                ON DUPLICATE KEY UPDATE
                    train_name = VALUES(train_name),
                    source = VALUES(source),
                    destination = VALUES(destination),
                    departure_time = VALUES(departure_time),
                    arrival_time = VALUES(arrival_time),
                    is_active = VALUES(is_active),
                    total_seats = VALUES(total_seats),
                    base_fare = VALUES(base_fare)
                """,
                (
                    train["trainNumber"],
                    train["trainName"],
                    train["source"],
                    train["destination"],
                    convert_time(train["departure"]),
                    convert_time(train["arrival"]),
                    journey_date,
                    None,
                    None,
                    True,
                    train["seats"],
                    train["fare"],
                ),
            )

            cursor.execute(
                """
                SELECT train_id
                FROM trains
                WHERE train_number = %s
                  AND journey_date = %s
                """,
                (train["trainNumber"], journey_date),
            )

            result = cursor.fetchone()

            if result is None:
                raise RuntimeError(
                    f"Could not find train {train['trainNumber']}"
                )

            train_id = result[0]

            for class_code, details in train["classes"].items():
                cursor.execute(
                    """
                    INSERT INTO train_classes (
                        train_id,
                        class_code,
                        class_name,
                        total_seats,
                        fare
                    )
                    VALUES (%s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        class_name = VALUES(class_name),
                        total_seats = VALUES(total_seats),
                        fare = VALUES(fare)
                    """,
                    (
                        train_id,
                        class_code,
                        CLASS_NAMES.get(class_code, class_code),
                        details["seats"],
                        details["fare"],
                    ),
                )

        connection.commit()
        print(
            f"Successfully imported {len(data['trains'])} trains."
        )

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    import_trains()
