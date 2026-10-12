package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"matchmind/api"
	"matchmind/db"
)

func main() {
	fmt.Println("Start MatchMind Server...")

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "matchmind.db"
	}

	database, err := db.InitDB(dbPath)

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
