package api

import (
	"database/sql"
	"net/http"

	_ "matchmind/docs"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

type Server struct {
	db     *sql.DB
	router *http.ServeMux
}

func NewServer(database *sql.DB) *Server {
	s := &Server{
		db:     database,
		router: http.NewServeMux(),
	}

	s.routes()
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}

// @title MatchMind API
// @version 1.0
// @description REST API for the MatchMind application.
// @host localhost:8080
// @BasePath /
func (s *Server) routes() {
	s.router.HandleFunc("/health", s.handleHealth())

	s.router.Handle("GET /swagger/", httpSwagger.WrapHandler)

	// Seasons
	s.router.HandleFunc("POST /api/v1/seasons", s.handleCreateSeason())
	s.router.HandleFunc("GET /api/v1/seasons/{id}", s.handleGetSeason())

	// Contenders
	s.router.HandleFunc("POST /api/v1/seasons/{id}/contenders", s.handleAddContender())
	s.router.HandleFunc("GET /api/v1/seasons/{id}/contenders", s.handleGetContenders())

	// Truth Booth
	s.router.HandleFunc("POST /api/v1/seasons/{id}/truth-booths", s.handleAddTruthBooth())

	// Matching Nights
	s.router.HandleFunc("POST /api/v1/seasons/{id}/matching-nights", s.handleAddMatchingNight())

	// Solver
	s.router.HandleFunc("GET /api/v1/seasons/{id}/solve", s.handleSolveSeason())
}

func (s *Server) handleHealth() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}
}
