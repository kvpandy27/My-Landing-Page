# Use a Golang image that meets or exceeds the required version (e.g., 1.24.4 or a later stable version)
FROM golang:1.24.4-alpine AS builder

# Set the current working directory inside the container
WORKDIR /app

# Copy go mod and sum files
COPY go.mod ./
COPY go.sum ./

# Explicitly get the required versions of Google Cloud Go libraries
# This helps resolve issues where older cached versions might be used.
RUN go get -u cloud.google.com/go/bigtable@latest && \
    go get -u google.golang.org/api@latest

# Download all other dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the Go application
RUN go build -o /go-chat-backend .

# Use a minimal image to run the application
FROM alpine:latest

# Set the working directory
WORKDIR /app

# Copy the compiled application from the builder stage
COPY --from=builder /go-chat-backend .

# Set the environment variable for Gemini API Key
# IMPORTANT: For production, use Cloud Run's secrets management or environment variables
# when deploying, DO NOT hardcode it in Dockerfile.
# If you are testing locally with Docker, you'd set this via `docker run -e GEMINI_API_KEY=...`
# or ensure it's set in your Cloud Run deployment settings.

# Expose the port your application listens on
EXPOSE 8080

# Command to run the executable
CMD ["/app/go-chat-backend"]