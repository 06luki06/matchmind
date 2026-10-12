package db

import (
	"database/sql"
)

type TruthBooth struct {
	ID       int
	SeasonID int
	MaleID   int
	FemaleID int
	IsMatch  bool
}

func AddTruthBooth(db *sql.DB, seasonID, maleID, femaleID int, isMatch bool) (*TruthBooth, error) {
	query := `
		INSERT INTO truth_booths (season_id, male_id, female_id, is_match)
		VALUES (?, ?, ?, ?)
		RETURNING id, season_id, male_id, female_id, is_match
	`
	var tb TruthBooth
	err := db.QueryRow(query, seasonID, maleID, femaleID, isMatch).Scan(
		&tb.ID, &tb.SeasonID, &tb.MaleID, &tb.FemaleID, &tb.IsMatch,
	)
	if err != nil {
		return nil, err
	}

	return &tb, nil
}

func GetTruthBoothsBySeason(db *sql.DB, seasonID int) ([]TruthBooth, error) {
	query := `
		SELECT id, male_id, female_id, is_match
		FROM truth_booths
		WHERE season_id = ?
		ORDER BY id ASC
	`
	rows, err := db.Query(query, seasonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tbs []TruthBooth
	for rows.Next() {
		var tb TruthBooth
		if err := rows.Scan(&tb.ID, &tb.MaleID, &tb.FemaleID, &tb.IsMatch); err != nil {
			return nil, err
		}
		tbs = append(tbs, tb)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tbs, nil
}

func DeleteTruthBooth(db *sql.DB, seasonID, tbID int) error {
	_, err := db.Exec("DELETE FROM truth_booths WHERE id = ? AND season_id = ?", tbID, seasonID)
	return err
}
