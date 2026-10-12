package solver_test

import (
	"testing"

	"matchmind/solver"
)

// Mapping candidates to fixed IDs (0 to 9 for men, 0 to 10 for women)
const (
	Alex = iota
	Antonino
	Chris
	Kaan
	Lars
	Lukas
	MarcRobin
	Nikola
	Oguzhan
	Tim
)

const (
	Anastasia = iota
	Asena
	Dana
	Emmy
	Gabriela
	Jennifer
	LauraL
	LauraM
	Linda
	Nadja
	Tara
)

func TestSolveStream_AYTO_VIP_Staffel4_MostProbableMatchesAfterMN8(t *testing.T) {
	menCount := 10
	womenCount := 11

	// 1. Truth Booth / Matchbox decisions up to Matchbox 8
	tbRules := []solver.TruthBoothRule{
		{MaleID: MarcRobin, FemaleID: LauraL, IsMatch: false}, // Matchbox 1
		{MaleID: Chris, FemaleID: Emmy, IsMatch: true},        // Matchbox 2
		{MaleID: MarcRobin, FemaleID: Asena, IsMatch: false},  // Matchbox 4
		{MaleID: Oguzhan, FemaleID: Anastasia, IsMatch: true}, // Matchbox 6
		{MaleID: Lukas, FemaleID: Jennifer, IsMatch: false},   // Matchbox 7
		{MaleID: Tim, FemaleID: Linda, IsMatch: true},         // Matchbox 8
	}

	// 2. Matching Nights 1 to 8 ONLY
	mnRules := []solver.MatchingNightRule{
		// MN 1 (2 lights)
		{
			Pairs: []solver.Pair{
				{MaleID: Tim, FemaleID: Linda},
				{MaleID: Lukas, FemaleID: Jennifer},
				{MaleID: Nikola, FemaleID: Tara},
				{MaleID: Lars, FemaleID: Nadja},
				{MaleID: Kaan, FemaleID: Asena},
				{MaleID: Chris, FemaleID: Emmy},
				{MaleID: Alex, FemaleID: LauraL},
				{MaleID: MarcRobin, FemaleID: Anastasia},
				{MaleID: Oguzhan, FemaleID: Gabriela},
				{MaleID: Antonino, FemaleID: LauraM},
			},
			LightsCount: 2,
		},
		// MN 2 (3 lights)
		{
			Pairs: []solver.Pair{
				{MaleID: Chris, FemaleID: Emmy},
				{MaleID: Antonino, FemaleID: Dana},
				{MaleID: Alex, FemaleID: Jennifer},
				{MaleID: Lars, FemaleID: Anastasia},
				{MaleID: Kaan, FemaleID: Nadja},
				{MaleID: Tim, FemaleID: Linda},
				{MaleID: MarcRobin, FemaleID: Asena},
				{MaleID: Oguzhan, FemaleID: LauraL},
				{MaleID: Nikola, FemaleID: Tara},
				{MaleID: Lukas, FemaleID: LauraM},
			},
			LightsCount: 3,
		},
		// MN 3 (3 lights)
		{
			Pairs: []solver.Pair{
				{MaleID: Chris, FemaleID: Emmy},
				{MaleID: Kaan, FemaleID: Jennifer},
				{MaleID: Alex, FemaleID: Anastasia},
				{MaleID: MarcRobin, FemaleID: Asena},
				{MaleID: Tim, FemaleID: Dana},
				{MaleID: Antonino, FemaleID: Nadja},
				{MaleID: Lukas, FemaleID: Linda},
				{MaleID: Oguzhan, FemaleID: LauraM},
				{MaleID: Nikola, FemaleID: LauraL},
				{MaleID: Lars, FemaleID: Gabriela},
			},
			LightsCount: 3,
		},
		// MN 4: BLACKOUT (1 light = Chris & Emmy)
		{
			Pairs: []solver.Pair{
				{MaleID: Chris, FemaleID: Emmy},
				{MaleID: Kaan, FemaleID: Asena},
				{MaleID: MarcRobin, FemaleID: Linda},
				{MaleID: Nikola, FemaleID: Anastasia},
				{MaleID: Tim, FemaleID: LauraL},
				{MaleID: Antonino, FemaleID: Nadja},
				{MaleID: Lukas, FemaleID: Gabriela},
				{MaleID: Oguzhan, FemaleID: LauraM},
				{MaleID: Lars, FemaleID: Tara},
				{MaleID: Alex, FemaleID: Jennifer},
			},
			LightsCount: 1,
		},
		// MN 5 (5 lights)
		{
			Pairs: []solver.Pair{
				{MaleID: Chris, FemaleID: Emmy},
				{MaleID: Oguzhan, FemaleID: Dana},
				{MaleID: MarcRobin, FemaleID: Anastasia},
				{MaleID: Kaan, FemaleID: Tara},
				{MaleID: Antonino, FemaleID: Asena},
				{MaleID: Nikola, FemaleID: LauraL},
				{MaleID: Alex, FemaleID: Gabriela},
				{MaleID: Lukas, FemaleID: Jennifer},
				{MaleID: Tim, FemaleID: Linda},
				{MaleID: Lars, FemaleID: Nadja},
			},
			LightsCount: 5,
		},
		// MN 6 (6 lights)
		{
			Pairs: []solver.Pair{
				{MaleID: Chris, FemaleID: Emmy},
				{MaleID: Oguzhan, FemaleID: Anastasia},
				{MaleID: Lukas, FemaleID: Jennifer},
				{MaleID: MarcRobin, FemaleID: LauraM},
				{MaleID: Lars, FemaleID: Dana},
				{MaleID: Tim, FemaleID: Linda},
				{MaleID: Antonino, FemaleID: Asena},
				{MaleID: Alex, FemaleID: Gabriela},
				{MaleID: Nikola, FemaleID: Nadja},
				{MaleID: Kaan, FemaleID: Tara},
			},
			LightsCount: 6,
		},
		// MN 7 (6 lights)
		{
			Pairs: []solver.Pair{
				{MaleID: Chris, FemaleID: Emmy},
				{MaleID: Oguzhan, FemaleID: Anastasia},
				{MaleID: Tim, FemaleID: Linda},
				{MaleID: Lukas, FemaleID: Dana},
				{MaleID: Lars, FemaleID: LauraL},
				{MaleID: Antonino, FemaleID: Asena},
				{MaleID: Kaan, FemaleID: Tara},
				{MaleID: Nikola, FemaleID: Nadja},
				{MaleID: Alex, FemaleID: Gabriela},
				{MaleID: MarcRobin, FemaleID: LauraM},
			},
			LightsCount: 6,
		},
		// MN 8 (7 lights)
		{
			Pairs: []solver.Pair{
				{MaleID: Chris, FemaleID: Emmy},
				{MaleID: Oguzhan, FemaleID: Anastasia},
				{MaleID: Tim, FemaleID: Linda},
				{MaleID: Lukas, FemaleID: Tara},
				{MaleID: MarcRobin, FemaleID: LauraM},
				{MaleID: Nikola, FemaleID: Nadja},
				{MaleID: Kaan, FemaleID: Jennifer},
				{MaleID: Alex, FemaleID: Gabriela},
				{MaleID: Lars, FemaleID: LauraL},
				{MaleID: Antonino, FemaleID: Asena},
			},
			LightsCount: 7,
		},
	}

	// Actual Perfect Matches revealed at the end of the show (from HTML)
	actualPerfectMatches := []struct {
		male   int
		female int
		name   string
	}{
		{Chris, Emmy, "Chris & Emmy"},
		{Oguzhan, Anastasia, "Oguzhan & Anastasia"},
		{Tim, Linda, "Tim & Linda"},
		{Tim, Dana, "Tim & Dana"}, // Double match for Tim
		{Kaan, Nadja, "Kaan & Nadja"},
		{Nikola, LauraL, "Nikola & Laura L."},
		{MarcRobin, LauraM, "Marc Robin & Laura M."},
		{Antonino, Asena, "Antonino & Asena"},
		{Alex, Gabriela, "Alex & Gabriela"},
		{Lukas, Tara, "Lukas & Tara"},
		{Lars, Jennifer, "Lars & Jennifer"},
	}

	// Act
	validCombs := solver.SolveStream(menCount, womenCount, tbRules, mnRules)

	if len(validCombs) == 0 {
		t.Fatalf("No valid combinations found after MN8!")
	}

	t.Logf("Number of valid combinations remaining after MN8: %d", len(validCombs))

	matrix := solver.CalculateProbabilityMatrix(validCombs, menCount, womenCount)

	// Verify for each man whether his highest probability match is indeed his actual Perfect Match
	for _, match := range actualPerfectMatches {
		actualProb := matrix.Probabilities[match.male][match.female]

		// Find the highest probability for this man among all women
		maxProb := 0.0
		bestFemaleID := -1
		for f := range womenCount {
			if matrix.Probabilities[match.male][f] > maxProb {
				maxProb = matrix.Probabilities[match.male][f]
				bestFemaleID = f
			}
		}

		t.Logf("Man %s -> Actual Match Prob: %.2f%% | Top Candidate Prob: %.2f%% (Female ID %d)",
			match.name, actualProb, maxProb, bestFemaleID)

		// Assert that the actual match has the highest probability (or is tied for highest)
		if actualProb < maxProb {
			t.Errorf("For %s, actual match probability (%.2f%%) is strictly lower than top candidate (%.2f%%)",
				match.name, actualProb, maxProb)
		}
	}
}
