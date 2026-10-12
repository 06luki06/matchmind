package db

import "database/sql"

type Contender struct {
	ID       int
	SeasonID int
	Name     string
	Gender   string
}

func AddContender(db *sql.DB, seasonID int, name, gender string) (*Contender, error) {
	query := `
		INSERT INTO contenders (season_id, name, gender)
		VALUES (?, ?, ?)
		RETURNING id, season_id, name, gender
	`

	var contender Contender
	err := db.QueryRow(query, seasonID, name, gender).Scan(
		&contender.ID,
		&contender.SeasonID,
		&contender.Name,
		&contender.Gender,
	)
	if err != nil {
		return nil, err
	}
	return &contender, nil
}

func GetContendersBySeason(db *sql.DB, seasonID int) ([]*Contender, error) {
	query := `
		SELECT id, season_id, name, gender
		FROM contenders
		WHERE season_id = ?
		ORDER BY gender DESC, id ASC
	`

	rows, err := db.Query(query, seasonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contenders []*Contender
	for rows.Next() {
		var contender Contender
		err := rows.Scan(
			&contender.ID,
			&contender.SeasonID,
			&contender.Name,
			&contender.Gender,
		)
		if err != nil {
			return nil, err
		}
		contenders = append(contenders, &contender)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return contenders, nil
}

func DeleteContender(db *sql.DB, seasonID, contenderID int) error {
	_, err := db.Exec("DELETE FROM contenders WHERE id = ? AND season_id = ?", contenderID, seasonID)
	return err
}
