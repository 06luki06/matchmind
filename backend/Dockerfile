# Stage 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cache Dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code & build binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o matchmind-server main.go

# Stage 2: Minimal Runtime Image
FROM alpine:latest

WORKDIR /app

# SSL Certificates & Timezone
RUN apk --no-cache add ca-certificates tzdata

# Create folder for SQLite database
RUN mkdir -p /app/data

# Copy binary & documentation
COPY --from=builder /app/matchmind-server .
COPY --from=builder /app/docs ./docs

# Environment variable for SQLite DB path
ENV DB_PATH=/app/data/matchmind.db

EXPOSE 8080

CMD ["./matchmind-server"]