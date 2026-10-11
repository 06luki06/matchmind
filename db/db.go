package db

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

func InitDB(filepath string) (*sql.DB, error) {
	database, err := sql.Open("sqlite", filepath)
	if err != nil {
		return nil, fmt.Errorf("Error when opening the database: %w", err)
	}

	schema := `
	CREATE TABLE IF NOT EXISTS seasons (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		max_rounds INTEGER NOT NULL DEFAULT 10
	);

	CREATE TABLE IF NOT EXISTS contestants (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		season_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		gender TEXT NOT NULL CHECK(gender IN ('M', 'F')),
		joined_in_round INTEGER NOT NULL DEFAULT 1,
		FOREIGN KEY(season_id) REFERENCES seasons(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS truth_booths (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		season_id INTEGER NOT NULL,
		male_id INTEGER NOT NULL,
		female_id INTEGER NOT NULL,
		is_match BOOLEAN NOT NULL,
		FOREIGN KEY(season_id) REFERENCES seasons(id) ON DELETE CASCADE,
		FOREIGN KEY(male_id) REFERENCES contestants(id),
		FOREIGN KEY(female_id) REFERENCES contestants(id)
	);

	CREATE TABLE IF NOT EXISTS matching_nights (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		season_id INTEGER NOT NULL,
		round_number INTEGER NOT NULL,
		lights_count INTEGER NOT NULL,
		FOREIGN KEY(season_id) REFERENCES seasons(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS matching_night_pairs (
		matching_night_id INTEGER NOT NULL,
		male_id INTEGER NOT NULL,
		female_id INTEGER NOT NULL,
		PRIMARY KEY (matching_night_id, male_id, female_id),
		FOREIGN KEY(matching_night_id) REFERENCES matching_nights(id) ON DELETE CASCADE,
		FOREIGN KEY(male_id) REFERENCES contestants(id),
		FOREIGN KEY(female_id) REFERENCES contestants(id)
	);
	`

	_, err = database.Exec(schema)
	if err != nil {
		return nil, fmt.Errorf("Error when creating database schema: %w", err)
	}

	return database, nil
}
