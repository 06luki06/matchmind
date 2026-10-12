package db

import (
	"database/sql"
	"fmt"
)

type MatchingNightPair struct {
	ID              int
	MatchingNightID int
	MaleID          int
	FemaleID        int
}

type MatchingNight struct {
	ID          int
	SeasonID    int
	NightNumber int
	LightsCount int
	Pairs       []MatchingNightPair
}

func AddMatchingNight(db *sql.DB, seasonID, nightNumber, lightsCount int, pairs []MatchingNightPair) (*MatchingNight, error) {
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	queryNight := `
		INSERT INTO matching_nights (season_id, night_number, lights_count)
		VALUES (?, ?, ?)
		RETURNING id
	`
	var nightID int
	err = tx.QueryRow(queryNight, seasonID, nightNumber, lightsCount).Scan(&nightID)
	if err != nil {
		return nil, err
	}

	queryPair := `
		INSERT INTO matching_night_pairs (matching_night_id, male_id, female_id)
		VALUES (?, ?, ?)
	`
	stmt, err := tx.Prepare(queryPair)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	for _, pair := range pairs {
		_, err := stmt.Exec(nightID, pair.MaleID, pair.FemaleID)
		if err != nil {
			return nil, fmt.Errorf("Fehler beim Speichern von Paar (%d, %d): %w", pair.MaleID, pair.FemaleID, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &MatchingNight{
		ID:          nightID,
		SeasonID:    seasonID,
		NightNumber: nightNumber,
		LightsCount: lightsCount,
		Pairs:       pairs,
	}, nil
}

// GetMatchingNightsBySeason loads all matching nights including pairs for the solver
func GetMatchingNightsBySeason(db *sql.DB, seasonID int) ([]MatchingNight, error) {
	queryNights := `
		SELECT id, season_id, night_number, lights_count
		FROM matching_nights
		WHERE season_id = ?
		ORDER BY night_number ASC
	`
	rows, err := db.Query(queryNights, seasonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var nights []MatchingNight

	for rows.Next() {
		var mn MatchingNight
		if err := rows.Scan(&mn.ID, &mn.SeasonID, &mn.NightNumber, &mn.LightsCount); err != nil {
			return nil, err
		}

		pairs, err := getPairsForMatchingNight(db, mn.ID)
		if err != nil {
			return nil, err
		}
		mn.Pairs = pairs

		nights = append(nights, mn)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return nights, nil
}

func getPairsForMatchingNight(db *sql.DB, mnID int) ([]MatchingNightPair, error) {
	queryPairs := `
		SELECT id, matching_night_id, male_id, female_id
		FROM matching_night_pairs
		WHERE matching_night_id = ?
		ORDER BY id ASC
	`
	rows, err := db.Query(queryPairs, mnID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pairs []MatchingNightPair
	for rows.Next() {
		var p MatchingNightPair
		if err := rows.Scan(&p.ID, &p.MatchingNightID, &p.MaleID, &p.FemaleID); err != nil {
			return nil, err
		}
		pairs = append(pairs, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return pairs, nil
}
