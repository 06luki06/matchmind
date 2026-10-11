package db_test

import (
	"testing"

	"matchmind/db"
)

func TestInitDB_InMemory(t *testing.T) {
	// Create a temporary SQLite DB in memory
	database, err := db.InitDB(":memory:")
	if err != nil {
		t.Fatalf("Failed to initialize the in-memory DB: %v", err)
	}
	defer database.Close()

	// Check if a table exists
	var tableName string
	err = database.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='seasons';").Scan(&tableName)
	if err != nil {
		t.Fatalf("Table 'seasons' was not found in the schema: %v", err)
	}

	if tableName != "seasons" {
		t.Errorf("Expected table name 'seasons', got: %s", tableName)
	}
}
