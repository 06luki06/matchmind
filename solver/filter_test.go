package solver_test

import (
	"testing"

	"matchmind/solver"
)

func TestSolveStream_AYTO_Scenario(t *testing.T) {
	// 3 men, 3 women (1-to-1 matchings = 3! = 6 possible combinations)
	menCount := 3
	womenCount := 3

	// Rule 1: Match Box / Truth Booth (Man 0 & Woman 0 are a Perfect Match)
	tbRules := []solver.TruthBoothRule{
		{MaleID: 0, FemaleID: 0, IsMatch: true},
	}

	// Rule 2: Matching Night 1 -> 1 light for pair (1,1) and (2,2)
	mnRules := []solver.MatchingNightRule{
		{
			Pairs: []solver.Pair{
				{MaleID: 1, FemaleID: 1},
				{MaleID: 2, FemaleID: 2},
			},
			LightsCount: 0, // No lights for these two -> so they must match oppositely
		},
	}

	// Act
	validCombs := solver.SolveStream(menCount, womenCount, tbRules, mnRules)

	// Assert
	if len(validCombs) == 0 {
		t.Fatalf("Expected valid combinations, but found 0")
	}

	matrix := solver.CalculateProbabilityMatrix(validCombs, menCount, womenCount)

	// Man 0 and Woman 0 MUST have 100% probability
	if matrix.Probabilities[0][0] != 100.0 {
		t.Errorf("Expected 100%% probability for Pair (0,0), got: %.2f%%", matrix.Probabilities[0][0])
	}
}
