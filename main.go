package main

import (
	"fmt"
	"log"

	"matchmind/db"
)

func main() {
	fmt.Println("Start MatchMind Server...")

	database, err := db.InitDB("./matchmind.db")

	if err != nil {
		log.Fatalf("Database initialisation failed: %v", err)
	}

	defer database.Close()

	fmt.Println("Database initialized successfully.")
}
