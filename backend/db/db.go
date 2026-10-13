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
		joined_night INTEGER NOT NULL DEFAULT 1,
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

	if err := runMigrations(database); err != nil {
		return nil, fmt.Errorf("Error running migrations: %w", err)
	}

	return database, nil
}

func runMigrations(db *sql.DB) error {
	rows, err := db.Query("PRAGMA table_info(contenders)")
	if err != nil {
		return err
	}
	defer rows.Close()

	hasJoinedNight := false
	for rows.Next() {
		var cid int
		var name, ctype string
		var notnull int
		var dfltValue any
		var pk int

		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dfltValue, &pk); err != nil {
			return err
		}
		if name == "joined_night" {
			hasJoinedNight = true
			break
		}
	}

	if rows.Err() != nil {
		return rows.Err()
	}

	if !hasJoinedNight {
		_, err := db.Exec("ALTER TABLE contenders ADD COLUMN joined_night INTEGER NOT NULL DEFAULT 1")
		if err != nil {
			return fmt.Errorf("failed to add joined_night column: %w", err)
		}
	}

	return nil
}
