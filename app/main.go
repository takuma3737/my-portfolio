package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load("../.env")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading .env file: %v\n", err)
		return
	} 

	connString := os.Getenv("DATABASE_URL")

	if connString == "" {
		fmt.Fprintf(os.Stderr, "DATABASE_URL not set\n")
		return
	}
	ctx := context.Background()

	conn, err := pgx.Connect(ctx, connString)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		return
	}
	defer conn.Close(ctx)

	fmt.Println("Connection established")
}
