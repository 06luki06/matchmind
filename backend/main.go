package main

import (
	"fmt"
	"log"
	"net/http"

	"matchmind/api"
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

	server := api.NewServer(database)

	fmt.Println("Server running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", server); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
