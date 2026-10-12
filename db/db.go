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
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS contenders (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		season_id INTEGER NOT NULL,
		name TEXT NOT NULL,
		gender TEXT NOT NULL CHECK(gender IN ('M', 'F')),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(season_id) REFERENCES seasons(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS truth_booths (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		season_id INTEGER NOT NULL,
		male_id INTEGER NOT NULL,
		female_id INTEGER NOT NULL,
		is_match BOOLEAN NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(season_id) REFERENCES seasons(id) ON DELETE CASCADE,
		FOREIGN KEY(male_id) REFERENCES contenders(id),
		FOREIGN KEY(female_id) REFERENCES contenders(id)
	);

	CREATE TABLE IF NOT EXISTS matching_nights (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		season_id INTEGER NOT NULL,
		night_number INTEGER NOT NULL,
		lights_count INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(season_id) REFERENCES seasons(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS matching_night_pairs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			matching_night_id INTEGER NOT NULL,
			male_id INTEGER NOT NULL,
			female_id INTEGER NOT NULL,
			FOREIGN KEY (matching_night_id) REFERENCES matching_nights(id) ON DELETE CASCADE,
			FOREIGN KEY (male_id) REFERENCES contenders(id),
			FOREIGN KEY (female_id) REFERENCES contenders(id)
	);
	`

	_, err = database.Exec(schema)
	if err != nil {
		return nil, fmt.Errorf("Error when creating database schema: %w", err)
	}

	return database, nil
}
