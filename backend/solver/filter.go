package solver

import (
	"runtime"
	"sync"
)

// SolveStream processes incoming combination chunks on the fly and returns ONLY valid combinations.
func SolveStream(menCount, womenCount int, tbRules []TruthBoothRule, mnRules []MatchingNightRule, menJoined []int, womenJoined []int) []Combination {
	combChan := make(chan []Combination, runtime.NumCPU()*2)
	validChan := make(chan Combination, 10000)

	isMenSurplus := menCount > womenCount

	// Start streaming generator in a background goroutine
	go StreamCombinations(menCount, womenCount, combChan)

	var wg sync.WaitGroup
	numWorkers := runtime.NumCPU()

	// Worker pool to process chunks concurrently
	for range numWorkers {
		wg.Add(1)
		go func() {
			defer wg.Done()

			for chunk := range combChan {
				for _, comb := range chunk {
					valid := true

					// 1. Check Truth Booths
					for _, rule := range tbRules {
						if !MatchesTruthBooth(comb, rule, isMenSurplus) {
							valid = false
							break
						}
					}

					if !valid {
						continue
					}

					// 2. Check Matching Nights
					for _, rule := range mnRules {
						if !MatchesMatchingNight(comb, rule, isMenSurplus, menJoined, womenJoined) {
							valid = false
							break
						}
					}

					if valid {
						validChan <- comb
					}
				}
			}
		}()
	}

	// Collector goroutine to close validChan when all workers finish
	go func() {
		wg.Wait()
		close(validChan)
	}()

	// Collect valid results into a small slice
	var validCombinations []Combination
	for comb := range validChan {
		validCombinations = append(validCombinations, comb)
	}

	return validCombinations
}
