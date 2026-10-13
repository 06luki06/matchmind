package api

import (
	"encoding/json"
	"matchmind/db"
	"net/http"
	"strconv"
	"strings"
)

// @Summary Add a new contender to a specific season
// @Tags Contenders
// @Accept json
// @Produce json
// @Param id path int true "Season ID"
// @Param contender body AddContenderRequest true "Contender details"
// @Success 201 {object} ContenderResponse
// @Failure 400 {string} string "Invalid request"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons/{id}/contenders [post]
func (s *Server) handleAddContender() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seasonID, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.Error(w, "Invalid season ID", http.StatusBadRequest)
			return
		}

		var req AddContenderRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		req.Name = strings.TrimSpace(req.Name)
		req.Gender = strings.ToUpper(strings.TrimSpace(req.Gender))

		if req.Name == "" {
			http.Error(w, "Name is required", http.StatusBadRequest)
			return
		}

		if req.Gender != "M" && req.Gender != "F" {
			http.Error(w, "Gender must be 'M' or 'F'", http.StatusBadRequest)
			return
		}

		joinedNight := req.JoinedNight
		if joinedNight <= 0 {
			joinedNight = 1
		}

		contender, err := db.AddContender(s.db, seasonID, req.Name, req.Gender, joinedNight)
		if err != nil {
			http.Error(w, "Error when creating a contender", http.StatusInternalServerError)
			return
		}

		resp := ContenderResponse{
			ID:          contender.ID,
			Name:        contender.Name,
			Gender:      contender.Gender,
			SeasonID:    contender.SeasonID,
			JoinedNight: contender.JoinedNight,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(resp)
	}
}

// @Summary Get all contenders for a specific season
// @Tags Contenders
// @Produce json
// @Param id path int true "Season ID"
// @Success 200 {object} ContendersListResponse
// @Failure 400 {string} string "Invalid season ID"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons/{id}/contenders [get]
func (s *Server) handleGetContenders() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seasonID, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.Error(w, "Invalid season ID", http.StatusBadRequest)
			return
		}

		contenders, err := db.GetContendersBySeason(s.db, seasonID)
		if err != nil {
			http.Error(w, "Error when fetching contenders", http.StatusInternalServerError)
			return
		}

		menCount, womenCount := 0, 0
		contenderResp := make([]ContenderResponse, 0, len(contenders))

		for _, c := range contenders {
			switch c.Gender {
			case "M":
				menCount++
			case "F":
				womenCount++
			}

			contenderResp = append(contenderResp, ContenderResponse{
				ID:          c.ID,
				Name:        c.Name,
				Gender:      c.Gender,
				SeasonID:    c.SeasonID,
				JoinedNight: c.JoinedNight,
			})
		}

		resp := ContendersListResponse{
			SeasonID:   seasonID,
			MenCount:   menCount,
			WomenCount: womenCount,
			Contenders: contenderResp,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

// @Summary Delete a contender for a specific season
// @Tags Contenders
// @Param season_id path int true "Season ID"
// @Param id path int true "Contender ID"
// @Failure 400 {string} string "Invalid season ID or contender ID"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons/{season_id}/contenders/{id} [delete]
func (s *Server) handleDeleteContender() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seasonID, err := strconv.Atoi(r.PathValue("season_id"))
		if err != nil {
			http.Error(w, "Invalid season ID or contender ID", http.StatusBadRequest)
			return
		}
		contenderID, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.Error(w, "Invalid season ID or contender ID", http.StatusBadRequest)
			return
		}

		if err := db.DeleteContender(s.db, seasonID, contenderID); err != nil {
			http.Error(w, "Fehler beim Löschen des Teilnehmers", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
