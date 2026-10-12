package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"matchmind/db"
)

// @Summary Add a new matching night to a specific season
// @Tags MatchingNights
// @Accept json
// @Produce json
// @Param id path int true "Season ID"
// @Param matchingNight body AddMatchingNightRequest true "Matching Night details"
// @Success 201 {object} MatchingNightResponse
// @Failure 400 {string} string "Invalid request"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons/{id}/matching-nights [post]
func (s *Server) handleAddMatchingNight() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seasonID, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.Error(w, "Invalid Season ID", http.StatusBadRequest)
			return
		}

		var req AddMatchingNightRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}

		if req.NightNumber <= 0 {
			http.Error(w, "NightNumber must be greater than 0", http.StatusBadRequest)
			return
		}

		if len(req.Pairs) == 0 {
			http.Error(w, "Matching Night must contain at least one pair", http.StatusBadRequest)
			return
		}

		dbPairs := make([]db.MatchingNightPair, 0, len(req.Pairs))
		for _, p := range req.Pairs {
			dbPairs = append(dbPairs, db.MatchingNightPair{
				MaleID:   p.MaleID,
				FemaleID: p.FemaleID,
			})
		}

		mn, err := db.AddMatchingNight(s.db, seasonID, req.NightNumber, req.LightsCount, dbPairs)
		if err != nil {
			http.Error(w, "Error saving Matching Night", http.StatusInternalServerError)
			return
		}

		respPairs := make([]PairRequest, 0, len(mn.Pairs))
		for _, p := range mn.Pairs {
			respPairs = append(respPairs, PairRequest{
				MaleID:   p.MaleID,
				FemaleID: p.FemaleID,
			})
		}

		resp := MatchingNightResponse{
			ID:          mn.ID,
			SeasonID:    mn.SeasonID,
			NightNumber: mn.NightNumber,
			LightsCount: mn.LightsCount,
			Pairs:       respPairs,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(resp)
	}
}
