package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"sort"
	"strings" // Added for string manipulation
	"time"

	"cloud.google.com/go/bigtable"
	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// Constants for Bigtable - ***REPLACE THESE WITH YOUR ACTUAL VALUES***
// These must match your GCP Project ID, Bigtable Instance ID, and Table ID.
const (
	// It's highly recommended to load projectID, instanceID, and tableID from environment variables
	// or a config file for production deployments, similar to how GEMINI_API_KEY is handled.
	// For demonstration, these are placeholders.
	projectID  = "landing-page-463915" // <-- IMPORTANT: Replace this!
	instanceID = "chat-instance"       // <-- IMPORTANT: Replace this with your actual Bigtable instance ID
	tableID    = "chat_history"        // <-- IMPORTANT: Replace this with your actual Bigtable table ID

	// Column family and qualifiers for chat messages
	columnFamilyName   = "messages"
	userTextQualifier  = "user_text"
	botTextQualifier   = "bot_text"
	timestampQualifier = "timestamp"
	senderQualifier    = "sender" // This qualifier might be redundant if sender is in rowKey
)

// ChatRequest defines the structure for incoming JSON requests from the frontend.
type ChatRequest struct {
	Query  string `json:"query"`
	UserID string `json:"userId"`
}

// ChatResponse defines the structure for outgoing JSON responses to the frontend.
type ChatResponse struct {
	Response string `json:"response"`
}

// HistoryEntry represents a single message in the chat history for frontend display.
// This structure will be sent as JSON to the frontend.
type HistoryEntry struct {
	RowKey    string `json:"rowKey"`
	Timestamp string `json:"timestamp"` // Store as string for frontend display
	Sender    string `json:"sender"`
	Text      string `json:"text"`
}

func main() {
	// Load Gemini API Key from environment variable.
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY environment variable not set. Please set it before running.")
	}

	// It's good practice to also load Bigtable credentials from env vars for production
	// For now, using the constants, but mentioning for future improvement.
	gcpProjectID := os.Getenv("GCP_PROJECT_ID")
	if gcpProjectID == "" {
		gcpProjectID = projectID // Fallback to constant if not set
	}
	btInstanceID := os.Getenv("BIGTABLE_INSTANCE_ID")
	if btInstanceID == "" {
		btInstanceID = instanceID // Fallback to constant if not set
	}
	btTableID := os.Getenv("BIGTABLE_TABLE_ID")
	if btTableID == "" {
		btTableID = tableID // Fallback to constant if not set
	}

	// Initialize Gin router with default middleware.
	router := gin.Default()

	// --- CORS Configuration ---
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Initialize Bigtable client.
	ctx := context.Background()
	btClient, err := bigtable.NewClient(ctx, gcpProjectID, btInstanceID)
	if err != nil {
		log.Fatalf("Failed to create Bigtable client: %v", err)
	}
	defer btClient.Close()

	// Get a table handle for the specified table ID.
	tbl := btClient.Open(btTableID)

	// --- API endpoint for handling chat messages ---
	router.POST("/chat", func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			log.Printf("Bad request: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
			return
		}

		currentTime := time.Now().UTC()
		// Using nanoseconds for higher precision in row key and timestamp column
		timestampNano := currentTime.Format("20060102150405.000000000") // Format for row key
		timestampRFC3339 := currentTime.Format(time.RFC3339Nano)        // Format for timestamp column

		rowKeyPrefix := req.UserID

		// --- Prepare User Message Mutation ---
		// Include full timestamp in row key to ensure uniqueness and ordering
		userRowKeyStr := rowKeyPrefix + "#user#" + timestampNano
		userMut := bigtable.NewMutation()
		userMut.Set(columnFamilyName, userTextQualifier, bigtable.Timestamp(currentTime.UnixNano()/1000), []byte(req.Query)) // Set Bigtable timestamp
		userMut.Set(columnFamilyName, timestampQualifier, bigtable.Timestamp(currentTime.UnixNano()/1000), []byte(timestampRFC3339))
		// Note: senderQualifier can be redundant if parsed from rowKey, but keeping for now.
		userMut.Set(columnFamilyName, senderQualifier, bigtable.Timestamp(currentTime.UnixNano()/1000), []byte("user"))

		// --- Call Gemini API ---
		genaiClient, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
		if err != nil {
			log.Printf("Error creating Gemini client: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to AI service"})
			return
		}
		defer genaiClient.Close()

		model := genaiClient.GenerativeModel("gemini-1.5-flash-latest") // Consider using -latest models
		resp, err := model.GenerateContent(ctx, genai.Text(req.Query))
		if err != nil {
			log.Printf("Error generating content from Gemini: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get response from AI"})
			return
		}

		var geminiResponse string
		if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
			if text, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
				geminiResponse = string(text)
			}
		}

		if geminiResponse == "" {
			geminiResponse = "Sorry, I couldn't generate a response."
		}

		// --- Prepare Bot Message Mutation ---
		// Ensure both user and bot messages have distinct, ordered row keys
		botRowKeyStr := rowKeyPrefix + "#bot#" + timestampNano // Use the same timestamp for pairing
		botMut := bigtable.NewMutation()
		botMut.Set(columnFamilyName, botTextQualifier, bigtable.Timestamp(currentTime.UnixNano()/1000), []byte(geminiResponse))
		botMut.Set(columnFamilyName, timestampQualifier, bigtable.Timestamp(currentTime.UnixNano()/1000), []byte(timestampRFC3339))
		botMut.Set(columnFamilyName, senderQualifier, bigtable.Timestamp(currentTime.UnixNano()/1000), []byte("bot"))

		// --- Apply both mutations in bulk ---
		rowKeys := []string{userRowKeyStr, botRowKeyStr}
		mutations := []*bigtable.Mutation{userMut, botMut}

		// ApplyBulk can return a slice of errors, one for each row.
		// It's crucial to check both the main error and the rowErrs slice.
		rowErrs, err := tbl.ApplyBulk(ctx, rowKeys, mutations)
		if err != nil {
			log.Printf("Failed to apply bulk mutations to Bigtable: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save chat history"}) // Inform frontend
			return
		}
		if rowErrs != nil {
			// Log individual row errors but still try to return Gemini response
			for i, rowErr := range rowErrs {
				if rowErr != nil {
					log.Printf("Error writing row '%s' in bulk: %v", rowKeys[i], rowErr)
				}
			}
		}

		// Send the Gemini response back to the frontend.
		c.JSON(http.StatusOK, ChatResponse{Response: geminiResponse})
	})

	// --- API endpoint to fetch chat history for a user ---
	// --- API endpoint to fetch chat history for a user ---
	router.GET("/history/:userId", func(c *gin.Context) {
		userID := c.Param("userId")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
			return
		}

		rowRange := bigtable.PrefixRange(userID + "#")

		var history []HistoryEntry

		// Read rows from Bigtable
		err := tbl.ReadRows(ctx, rowRange, func(row bigtable.Row) bool {
			var sender, text, timestampVal string
			rowKey := row.Key() // Get the full row key directly

			// Parse sender from the row key (e.g., "userId#user#timestamp" or "userId#bot#timestamp")
			parts := strings.Split(string(rowKey), "#")
			if len(parts) >= 2 {
				sender = parts[len(parts)-2] // "user" or "bot"
			}

			// Access cells by column family
			// You'll typically have one column family for messages.
			// Get all items in the 'messages' column family
			messageItems := row[columnFamilyName]

			// Iterate through all cells in the 'messages' column family to find the data.
			for _, item := range messageItems {
				switch item.Column {
				case columnFamilyName + ":" + userTextQualifier:
					text = string(item.Value)
				case columnFamilyName + ":" + botTextQualifier:
					text = string(item.Value)
				case columnFamilyName + ":" + timestampQualifier:
					timestampVal = string(item.Value) // This is the RFC3339Nano string
				}
			}

			if text != "" {
				displayTime := timestampVal
				if t, err := time.Parse(time.RFC3339Nano, timestampVal); err == nil {
					displayTime = t.Format("2006-01-02 15:04:05 MST") // More readable format
				}

				history = append(history, HistoryEntry{
					RowKey:    string(rowKey),
					Timestamp: displayTime,
					Sender:    sender, // Use parsed sender from rowKey
					Text:      text,
				})
			}
			return true
		})

		if err != nil {
			log.Printf("Failed to read chat history from Bigtable: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chat history"})
			return
		}

		// History is naturally ordered by row key from Bigtable,
		// but explicit sort ensures it if multiple cells trigger appends in weird order.
		sort.Slice(history, func(i, j int) bool {
			return history[i].RowKey < history[j].RowKey
		})

		c.JSON(http.StatusOK, history)
	})

	log.Println("Go server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
