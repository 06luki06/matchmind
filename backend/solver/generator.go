package solver

// ChunkSize defines how many combinations are sent per batch to optimize CPU cache usage.
const ChunkSize = 500000

// Chunker encapsulates chunk buffering and channel emission to eliminate boilerplate code.
type Chunker struct {
	outChan chan<- []Combination
	buffer  []Combination
}

// GenerateStandardCombinations generates all possible permutations of a given count.
// It uses Heap's algorithm for generating permutations efficiently.
// Array index = Female ID, Value = male ID
func GenerateStandardCombinations(count int) []Combination {
	totalCount := factorial(count)
	results := make([]Combination, 0, totalCount)

	p := make([]uint8, count)
	for i := 0; i < count; i++ {
		p[i] = uint8(i)
	}

	var generate func(n int)
	generate = func(n int) {
		if n == 1 {
			comb := make(Combination, count)
			copy(comb, p)
			results = append(results, comb)
			return
		}

		for i := 0; i < n; i++ {
			generate(n - 1)
			if n%2 == 0 {
				p[i], p[n-1] = p[n-1], p[i]
			} else {
				p[0], p[n-1] = p[n-1], p[0]
			}
		}
	}
	generate(count)
	return results
}

func NewChunker(outChan chan<- []Combination) *Chunker {
	return &Chunker{
		outChan: outChan,
		buffer:  make([]Combination, 0, ChunkSize),
	}
}

func (c *Chunker) Add(comb Combination) {
	c.buffer = append(c.buffer, comb)
	if len(c.buffer) == ChunkSize {
		c.outChan <- c.buffer
		c.buffer = make([]Combination, 0, ChunkSize)
	}
}

func (c *Chunker) Flush() {
	if len(c.buffer) > 0 {
		c.outChan <- c.buffer
		c.buffer = nil
	}
}

// StreamCombinations is the single unified entry point for streaming all combination types.
func StreamCombinations(menCount, womenCount int, outChan chan<- []Combination) {
	defer close(outChan)

	chunker := NewChunker(outChan)
	defer chunker.Flush()

	// Case 1: Standard 1-to-1 matching (Equal counts, e.g., 10x10 or 11x11)
	if menCount == womenCount {
		generateStandardStream(menCount, chunker)
		return
	}

	// Case 2: Women Surplus (e.g., 10 Men, 11 Women)
	if womenCount == menCount+1 {
		generateSurplusStream(womenCount, menCount, true, chunker)
		return
	}

	// Case 3: Men Surplus (e.g., 11 Men, 10 Women)
	if menCount == womenCount+1 {
		generateSurplusStream(menCount, womenCount, false, chunker)
		return
	}
}

func generateStandardStream(count int, chunker *Chunker) {
	allCombs := GenerateStandardCombinations(count)
	for _, comb := range allCombs {
		chunker.Add(comb)
	}
}

// generateSurplusStream efficiently generates combinations with zero dynamic heap allocations in hot loops.
func generateSurplusStream(surplusCount, targetCount int, isWomenSurplus bool, chunker *Chunker) {
	remainingCount := targetCount - 1
	basePermutations := GenerateStandardCombinations(remainingCount)

	// Pre-allocate slice buffers once to avoid heap allocations inside loops
	remainingSurplus := make([]uint8, remainingCount)
	remainingTargets := make([]uint8, remainingCount)

	for s1 := range surplusCount {
		for s2 := s1 + 1; s2 < surplusCount; s2++ {

			// Fill remaining surplus indices without dynamic allocation
			idxS := 0
			for s := range surplusCount {
				if s != s1 && s != s2 {
					remainingSurplus[idxS] = uint8(s)
					idxS++
				}
			}

			for sharedTarget := range targetCount {

				// Fill remaining target indices without dynamic allocation
				idxT := 0
				for t := range targetCount {
					if t != sharedTarget {
						remainingTargets[idxT] = uint8(t)
						idxT++
					}
				}

				for _, basePerm := range basePermutations {
					comb := make(Combination, surplusCount)
					comb[s1] = uint8(sharedTarget)
					comb[s2] = uint8(sharedTarget)

					if isWomenSurplus {
						// Index = Female ID, Value = Male ID
						for idx, femaleIdx := range remainingSurplus {
							comb[femaleIdx] = remainingTargets[basePerm[idx]]
						}
					} else {
						// Index = Male ID, Value = Female ID
						for idx, maleIdx := range remainingSurplus {
							comb[maleIdx] = remainingTargets[basePerm[idx]]
						}
					}

					chunker.Add(comb)
				}
			}
		}
	}
}

// Helper function to calculate the factorial of a number.
// uses an iterative approach because it is more efficient O(1)
// compared to a recursive approach which has O(n) complexity.
func factorial(n int) int {
	if n <= 1 {
		return 1
	}

	result := 1
	for i := 2; i <= n; i++ {
		result *= i
	}
	return result
}
