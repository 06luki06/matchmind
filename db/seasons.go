package db

import (
	"database/sql"
	"time"
)

type Season struct {
	ID        int
	Name      string
	CreatedAt time.Time
}

func CreateSeason(db *sql.DB, name string) (*Season, error) {
	query := `
		INSERT INTO seasons (name)
		VALUES (?)
		RETURNING id, name, created_at
	`

	var season Season
	err := db.QueryRow(query, name).Scan(&season.ID, &season.Name, &season.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &season, nil
}

func GetSeasonByID(db *sql.DB, seasonID int) (*Season, error) {
	query := `
		SELECT id, name, created_at
		FROM seasons
		WHERE id = ?
	`
	var season Season
	err := db.QueryRow(query, seasonID).Scan(&season.ID, &season.Name, &season.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &season, nil
}
