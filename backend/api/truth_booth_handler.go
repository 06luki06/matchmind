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

		if req.IsMatch {
			_, _ = s.db.Exec("UPDATE contenders SET is_active = 0 WHERE id IN (?, ?)", req.MaleID, req.FemaleID)
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

// @Summary Delete a truth booth result for a specific season
// @Tags TruthBooths
// @Param season_id path int true "Season ID"
// @Param id path int true "Truth Booth ID"
// @Failure 400 {string} string "Invalid season ID or truth booth ID"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons/{season_id}/truth-booths/{id} [delete]
func (s *Server) handleDeleteTruthBooth() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seasonID, err := strconv.Atoi(r.PathValue("season_id"))
		if err != nil {
			http.Error(w, "Invalid season ID or truth booth ID", http.StatusBadRequest)
			return
		}
		tbID, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.Error(w, "Invalid season ID or truth booth ID", http.StatusBadRequest)
			return
		}

		var maleID, femaleID int
		var isMatch bool
		err = s.db.QueryRow("SELECT male_id, female_id, is_match FROM truth_booths WHERE id = ? AND season_id = ?", tbID, seasonID).Scan(&maleID, &femaleID, &isMatch)
		if err == nil && isMatch {
			_, _ = s.db.Exec("UPDATE contenders SET is_active = 1 WHERE id IN (?, ?)", maleID, femaleID)
		}

		if err := db.DeleteTruthBooth(s.db, seasonID, tbID); err != nil {
			http.Error(w, "Fehler beim Löschen des Truth Booths", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
