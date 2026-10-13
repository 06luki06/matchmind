package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"matchmind/db"
	"matchmind/solver"
)

// @Summary Solve a specific season using the solver engine
// @Tags Solver
// @Produce json
// @Param id path int true "Season ID"
// @Success 200 {object} SolveSeasonResponse
// @Failure 400 {string} string "Invalid season ID or not enough contenders"
// @Failure 500 {string} string "Internal server error"
// @Router /api/v1/seasons/{id}/solve [get]
func (s *Server) handleSolveSeason() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		seasonID, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.Error(w, "Invalid Season ID", http.StatusBadRequest)
			return
		}

		// 1. Load contenders from the database
		contenders, err := db.GetContendersBySeason(s.db, seasonID)
		if err != nil {
			http.Error(w, "Error loading contenders", http.StatusInternalServerError)
			return
		}

		// 2. Map contenders by gender and create ID-to-index mappings for the solver
		var men, women []ContenderResponse
		dbIDToMaleIdx := make(map[int]int)
		dbIDToFemaleIdx := make(map[int]int)

		var menJoined []int
		var womenJoined []int

		for _, c := range contenders {
			if !c.IsActive {
				continue
			}

			resp := ContenderResponse{
				ID:          c.ID,
				SeasonID:    c.SeasonID,
				Name:        c.Name,
				Gender:      c.Gender,
				JoinedNight: c.JoinedNight,
			}

			switch c.Gender {
			case "M":
				dbIDToMaleIdx[c.ID] = len(men)
				men = append(men, resp)
				menJoined = append(menJoined, c.JoinedNight)
			case "F":
				dbIDToFemaleIdx[c.ID] = len(women)
				women = append(women, resp)
				womenJoined = append(womenJoined, c.JoinedNight)
			}
		}

		menCount := len(men)
		womenCount := len(women)

		if menCount == 0 || womenCount == 0 {
			http.Error(w, "Not enough contenders for calculation", http.StatusBadRequest)
			return
		}

		// 3. Load Truth Booth Rules from the DB & map IDs to solver indices
		rawTBRules, err := db.GetTruthBoothsBySeason(s.db, seasonID)
		if err != nil {
			http.Error(w, "Error loading Truth Booths", http.StatusInternalServerError)
			return
		}

		perfectMatches := make(map[string]bool)
		for _, tb := range rawTBRules {
			if tb.IsMatch {
				key := strconv.Itoa(tb.MaleID) + "-" + strconv.Itoa(tb.FemaleID)
				perfectMatches[key] = true
			}
		}

		tbRules := make([]solver.TruthBoothRule, 0, len(rawTBRules))
		for _, tb := range rawTBRules {
			mIdx, mOk := dbIDToMaleIdx[int(tb.MaleID)]
			fIdx, fOk := dbIDToFemaleIdx[int(tb.FemaleID)]
			if !mOk || !fOk {
				continue // Ignore if ID cannot be mapped
			}
			tbRules = append(tbRules, solver.TruthBoothRule{
				MaleID:   uint8(mIdx),
				FemaleID: uint8(fIdx),
				IsMatch:  tb.IsMatch,
			})
		}

		// 4. Load Matching Night Rules from the DB & map IDs to solver indices
		rawMNRules, err := db.GetMatchingNightsBySeason(s.db, seasonID)
		if err != nil {
			http.Error(w, "Error loading Matching Nights", http.StatusInternalServerError)
			return
		}

		mnRules := make([]solver.MatchingNightRule, 0, len(rawMNRules))
		for _, mn := range rawMNRules {
			mappedPairs := make([]solver.Pair, 0, len(mn.Pairs))
			adjustedLights := mn.LightsCount

			for _, p := range mn.Pairs {
				mIdx, mOk := dbIDToMaleIdx[p.MaleID]
				fIdx, fOk := dbIDToFemaleIdx[p.FemaleID]
				if mOk && fOk {
					mappedPairs = append(mappedPairs, solver.Pair{
						MaleID:   uint8(mIdx),
						FemaleID: uint8(fIdx),
					})
				} else {
					key := strconv.Itoa(p.MaleID) + "-" + strconv.Itoa(p.FemaleID)
					if perfectMatches[key] {
						adjustedLights--
					}
				}
			}

			if adjustedLights < 0 {
				adjustedLights = 0
			}

			mnRules = append(mnRules, solver.MatchingNightRule{
				NightNumber: mn.NightNumber,
				Pairs:       mappedPairs,
				LightsCount: adjustedLights,
			})
		}

		// 5. Solve the season using the solver engine
		validCombs := solver.SolveStream(menCount, womenCount, tbRules, mnRules, menJoined, womenJoined)
		matrix := solver.CalculateProbabilityMatrix(validCombs, menCount, womenCount)

		// 6. Respond with remaining combinations and probability matrix
		resp := SolveSeasonResponse{
			SeasonID:              seasonID,
			MenCount:              menCount,
			WomenCount:            womenCount,
			RemainingCombinations: len(validCombs),
			Men:                   men,
			Women:                 women,
			Probabilities:         matrix.Probabilities,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
