package solver_test

import (
	"testing"

	"matchmind/solver"
)

func TestMatchesTruthBooth(t *testing.T) {
	tests := []struct {
		name         string
		comb         solver.Combination
		rule         solver.TruthBoothRule
		isMenSurplus bool
		expected     bool
	}{
		{
			name: "Match confirmed (Woman-Perspective Index = FemaleID)",
			comb: solver.Combination{0, 1, 2}, // Frau 0 -> Mann 0, Frau 1 -> Mann 1
			rule: solver.TruthBoothRule{
				MaleID:   1,
				FemaleID: 1,
				IsMatch:  true,
			},
			isMenSurplus: false,
			expected:     true,
		},
		{
			name: "No Match recognized",
			comb: solver.Combination{0, 2, 1}, // Woman 1 -> Man 2
			rule: solver.TruthBoothRule{
				MaleID:   1,
				FemaleID: 1,
				IsMatch:  false,
			},
			isMenSurplus: false,
			expected:     true, // Rule compliance is satisfied (it IS a No-Match)
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := solver.MatchesTruthBooth(tt.comb, tt.rule, tt.isMenSurplus)
			if got != tt.expected {
				t.Errorf("MatchesTruthBooth() = %v, expected %v", got, tt.expected)
			}
		})
	}
}
