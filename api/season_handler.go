package api

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"matchmind/db"
)

// @Summary Create a new season
// @Tags Seasons
// @Accept json
// @Produce json
// @Param season body CreateSeasonRequest true "Season details"
// @Success 201 {object} SeasonResponse
// @Failure 400 {string} string "Invalid request"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons [post]
func (s *Server) handleCreateSeason() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreateSeasonRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid json format", http.StatusBadRequest)
			return
		}

		req.Name = strings.TrimSpace(req.Name)
		if req.Name == "" {
			http.Error(w, "Name is required", http.StatusBadRequest)
			return
		}

		season, err := db.CreateSeason(s.db, req.Name)
		if err != nil {
			http.Error(w, "Failed to create season", http.StatusInternalServerError)
			return
		}

		res := SeasonResponse{
			ID:        season.ID,
			Name:      season.Name,
			CreatedAt: season.CreatedAt,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(res)
	}
}

// @Summary Get details of a specific season
// @Tags Seasons
// @Produce json
// @Param id path int true "Season ID"
// @Success 200 {object} GetSeasonDetailResponse
// @Failure 400 {string} string "Invalid season ID"
// @Failure 404 {string} string "Season not found"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons/{id} [get]
func (s *Server) handleGetSeason() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seasonID, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.Error(w, "Invalid Season ID", http.StatusBadRequest)
			return
		}

		// 1. Load season details
		season, err := db.GetSeasonByID(s.db, seasonID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				http.Error(w, "Season not found", http.StatusNotFound)
				return
			}
			http.Error(w, "Error loading season", http.StatusInternalServerError)
			return
		}

		// 2. Load contenders
		contendersList, err := db.GetContendersBySeason(s.db, seasonID)
		if err != nil {
			http.Error(w, "Error loading contenders", http.StatusInternalServerError)
			return
		}

		menCount, womenCount := 0, 0
		contendersResp := make([]ContenderResponse, 0, len(contendersList))

		for _, c := range contendersList {
			switch c.Gender {
			case "M":
				menCount++
			case "F":
				womenCount++
			}

			contendersResp = append(contendersResp, ContenderResponse{
				ID:       c.ID,
				SeasonID: c.SeasonID,
				Name:     c.Name,
				Gender:   c.Gender,
			})
		}

		// 3. Load Truth Booths
		rawTBs, err := db.GetTruthBoothsBySeason(s.db, seasonID)
		if err != nil {
			http.Error(w, "Error loading Truth Booths", http.StatusInternalServerError)
			return
		}

		tbDetails := make([]TruthBoothDetail, 0, len(rawTBs))
		for _, tb := range rawTBs {
			tbDetails = append(tbDetails, TruthBoothDetail{
				ID:       tb.ID,
				MaleID:   int(tb.MaleID),
				FemaleID: int(tb.FemaleID),
				IsMatch:  tb.IsMatch,
			})
		}

		// 4. Load Matching Nights
		rawMNs, err := db.GetMatchingNightsBySeason(s.db, seasonID)
		if err != nil {
			http.Error(w, "Error loading Matching Nights", http.StatusInternalServerError)
			return
		}

		mnDetails := make([]MatchingNightDetail, 0, len(rawMNs))
		for _, mn := range rawMNs {
			pairDetails := make([]MatchingNightPairDetail, 0, len(mn.Pairs))
			for _, p := range mn.Pairs {
				pairDetails = append(pairDetails, MatchingNightPairDetail{
					MaleID:   p.MaleID,
					FemaleID: p.FemaleID,
				})
			}

			mnDetails = append(mnDetails, MatchingNightDetail{
				ID:          mn.ID,
				NightNumber: mn.NightNumber,
				LightsCount: mn.LightsCount,
				Pairs:       pairDetails,
			})
		}

		// 5. Send whole season detail response
		resp := GetSeasonDetailResponse{
			ID:             season.ID,
			Name:           season.Name,
			CreatedAt:      season.CreatedAt,
			MenCount:       menCount,
			WomenCount:     womenCount,
			Contenders:     contendersResp,
			TruthBooths:    tbDetails,
			MatchingNights: mnDetails,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
