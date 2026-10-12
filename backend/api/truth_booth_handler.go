package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"matchmind/db"
)

// @Summary Add a new truth booth result to a specific season
// @Tags TruthBooths
// @Accept json
// @Produce json
// @Param id path int true "Season ID"
// @Param truthBooth body AddTruthBoothRequest true "Truth Booth details"
// @Success 201 {object} TruthBoothResponse
// @Failure 400 {string} string "Invalid request"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons/{id}/truth-booths [post]
func (s *Server) handleAddTruthBooth() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seasonID, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.Error(w, "Invalid Season ID", http.StatusBadRequest)
			return
		}

		var req AddTruthBoothRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON-Format", http.StatusBadRequest)
			return
		}

		if req.MaleID <= 0 || req.FemaleID <= 0 {
			http.Error(w, "Invalid MaleID or FemaleID", http.StatusBadRequest)
			return
		}

		tb, err := db.AddTruthBooth(s.db, seasonID, req.MaleID, req.FemaleID, req.IsMatch)
		if err != nil {
			http.Error(w, "Error saving Truth Booth result", http.StatusInternalServerError)
			return
		}

		resp := TruthBoothResponse{
			ID:       tb.ID,
			SeasonID: tb.SeasonID,
			MaleID:   tb.MaleID,
			FemaleID: tb.FemaleID,
			IsMatch:  tb.IsMatch,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(resp)
	}
}
