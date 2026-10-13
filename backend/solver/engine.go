package solver

// Combination represents a possible global matching configuration.
// Array index corresponds to the woman ID (0-based)
// Value at each index corresponds to the matched man ID (0-based)
type Combination []uint8

// TruthBoothRule describes the outcome of the match box.
type TruthBoothRule struct {
	MaleID   uint8
	FemaleID uint8
	IsMatch  bool
}

// Pair represents a tip of a possible match between a man and a woman within a matching night.
type Pair struct {
	MaleID   uint8
	FemaleID uint8
}

// MatchingNightRule represents the outcome of a matching night
type MatchingNightRule struct {
	NightNumber int
	Pairs       []Pair
	LightsCount int
}

// MatchesTruthBooth checks if a combination complies with a Match Box result.
func MatchesTruthBooth(comb Combination, rule TruthBoothRule, isMenSurplus bool) bool {
	var isCurrentlyMatched bool
	if isMenSurplus {
		if int(rule.MaleID) >= len(comb) {
			return !rule.IsMatch
		}
		isCurrentlyMatched = comb[rule.MaleID] == rule.FemaleID
	} else {
		if int(rule.FemaleID) >= len(comb) {
			return !rule.IsMatch
		}
		isCurrentlyMatched = comb[rule.FemaleID] == rule.MaleID
	}

	if rule.IsMatch {
		return isCurrentlyMatched
	}
	return !isCurrentlyMatched
}

// MatchesMatchingNight checks if a combination yields the exact lights count for a given round.
func MatchesMatchingNight(comb Combination, rule MatchingNightRule, isMenSurplus bool, menJoined []int, womenJoined []int) bool {
	var lights uint8 = 0
	for _, pair := range rule.Pairs {
		if int(pair.MaleID) < len(menJoined) && rule.NightNumber < menJoined[pair.MaleID] {
			continue
		}

		if int(pair.FemaleID) < len(womenJoined) && rule.NightNumber < womenJoined[pair.FemaleID] {
			continue
		}

		if isMenSurplus {
			if int(pair.MaleID) < len(comb) && comb[pair.MaleID] == pair.FemaleID {
				lights++
			}
		} else {
			if int(pair.FemaleID) < len(comb) && comb[pair.FemaleID] == pair.MaleID {
				lights++
			}
		}
	}
	return lights == uint8(rule.LightsCount)
}
