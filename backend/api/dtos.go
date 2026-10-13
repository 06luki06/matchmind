package api

import (
	"time"
)

type CreateSeasonRequest struct {
	Name string `json:"name"`
}

type SeasonResponse struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type AddContenderRequest struct {
	Name        string `json:"name"`
	Gender      string `json:"gender"` // "M" or "F"
	JoinedNight int    `json:"joined_night,omitempty"`
}

type ContenderResponse struct {
	ID          int    `json:"id"`
	SeasonID    int    `json:"season_id"`
	Name        string `json:"name"`
	Gender      string `json:"gender"`
	JoinedNight int    `json:"joined_night"`
}

type ContendersListResponse struct {
	SeasonID   int                 `json:"season_id"`
	MenCount   int                 `json:"men_count"`
	WomenCount int                 `json:"women_count"`
	Contenders []ContenderResponse `json:"contenders"`
}

type AddTruthBoothRequest struct {
	MaleID   int  `json:"male_id"`
	FemaleID int  `json:"female_id"`
	IsMatch  bool `json:"is_match"`
}

type TruthBoothResponse struct {
	ID       int  `json:"id"`
	SeasonID int  `json:"season_id"`
	MaleID   int  `json:"male_id"`
	FemaleID int  `json:"female_id"`
	IsMatch  bool `json:"is_match"`
}

type PairRequest struct {
	MaleID   int `json:"male_id"`
	FemaleID int `json:"female_id"`
}

type AddMatchingNightRequest struct {
	NightNumber int           `json:"night_number"`
	LightsCount int           `json:"lights_count"`
	Pairs       []PairRequest `json:"pairs"`
}

type MatchingNightResponse struct {
	ID          int           `json:"id"`
	SeasonID    int           `json:"season_id"`
	NightNumber int           `json:"night_number"`
	LightsCount int           `json:"lights_count"`
	Pairs       []PairRequest `json:"pairs"`
}

type SolveSeasonResponse struct {
	SeasonID              int                 `json:"season_id"`
	MenCount              int                 `json:"men_count"`
	WomenCount            int                 `json:"women_count"`
	RemainingCombinations int                 `json:"remaining_combinations"`
	Men                   []ContenderResponse `json:"men"`
	Women                 []ContenderResponse `json:"women"`
	Probabilities         [][]float64         `json:"probabilities"`
}

type TruthBoothDetail struct {
	ID       int  `json:"id"`
	MaleID   int  `json:"male_id"`
	FemaleID int  `json:"female_id"`
	IsMatch  bool `json:"is_match"`
}

type MatchingNightPairDetail struct {
	MaleID   int `json:"male_id"`
	FemaleID int `json:"female_id"`
}

type MatchingNightDetail struct {
	ID          int                       `json:"id"`
	NightNumber int                       `json:"night_number"`
	LightsCount int                       `json:"lights_count"`
	Pairs       []MatchingNightPairDetail `json:"pairs"`
}

type GetSeasonDetailResponse struct {
	ID             int                   `json:"id"`
	Name           string                `json:"name"`
	CreatedAt      time.Time             `json:"created_at"`
	MenCount       int                   `json:"men_count"`
	WomenCount     int                   `json:"women_count"`
	Contenders     []ContenderResponse   `json:"contenders"`
	TruthBooths    []TruthBoothDetail    `json:"truth_booths"`
	MatchingNights []MatchingNightDetail `json:"matching_nights"`
}
