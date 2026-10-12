package solver

// ProbabilityMatrix holds the match percentages for all possible pairs.
// Probabilities[maleID][femaleID] contains the percentage value (0.0 to 100.0).
type ProbabilityMatrix struct {
	TotalValidCombinations int
	Probabilities          [][]float64 // [maleID][femaleID]
}

// CalculateProbabilityMatrix computes the percentage likelihood of each pair
// based on the remaining valid combinations.
func CalculateProbabilityMatrix(validCombinations []Combination, menCount, womenCount int) ProbabilityMatrix {
	total := len(validCombinations)
	if total == 0 {
		probs := make([][]float64, menCount)
		for m := range menCount {
			probs[m] = make([]float64, womenCount)
		}
		return ProbabilityMatrix{
			TotalValidCombinations: 0,
			Probabilities:          probs,
		}
	}

	isMenSurplus := menCount > womenCount

	// Initialize occurrence counts matrix [menCount][womenCount]
	counts := make([][]int, menCount)
	for m := range menCount {
		counts[m] = make([]int, womenCount)
	}

	// Aggregate match occurrences across all valid combinations
	for _, comb := range validCombinations {
		if isMenSurplus {
			// Index = Male ID, Value = Female ID
			for maleID, femaleID := range comb {
				if int(maleID) < menCount && int(femaleID) < womenCount {
					counts[maleID][femaleID]++
				}
			}
		} else {
			// Index = Female ID, Value = Male ID
			for femaleID, maleID := range comb {
				if int(femaleID) < womenCount && int(maleID) < menCount {
					counts[maleID][femaleID]++
				}
			}
		}
	}

	// Calculate percentage for each pair
	probs := make([][]float64, menCount)
	for m := range menCount {
		probs[m] = make([]float64, womenCount)
		for w := range womenCount {
			probs[m][w] = (float64(counts[m][w]) / float64(total)) * 100.0
		}
	}

	return ProbabilityMatrix{
		TotalValidCombinations: total,
		Probabilities:          probs,
	}
}
