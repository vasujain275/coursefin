// Package player provides video serving and playback control functionality
package player

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// VideoHandler handles HTTP requests for serving video and subtitle files
// It supports range requests for seeking and provides secure file serving
type VideoHandler struct {
	coursesDir string
}

// NewVideoHandler creates a new video handler with the courses directory
func NewVideoHandler(coursesDir string) *VideoHandler {
	return &VideoHandler{
		coursesDir: coursesDir,
	}
}

// ServeHTTP implements the http.Handler interface
// Routes:
//   - /videos/* - Serves video files with range request support
//   - /subtitles/* - Serves subtitle files (SRT/VTT)
func (h *VideoHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// Route to appropriate handler
	if strings.HasPrefix(path, "/videos/") {
		h.serveVideo(w, r, strings.TrimPrefix(path, "/videos/"))
	} else if strings.HasPrefix(path, "/subtitles/") {
		h.serveSubtitle(w, r, strings.TrimPrefix(path, "/subtitles/"))
	} else {
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}

// serveVideo serves a video file with range request support for seeking
// Path format: /videos/{relative_path_to_video}
func (h *VideoHandler) serveVideo(w http.ResponseWriter, r *http.Request, relativePath string) {
	// Security: Prevent directory traversal attacks
	if strings.Contains(relativePath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Construct full file path
	filePath := filepath.Join(h.coursesDir, relativePath)

	// Check if file exists and is a regular file
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Video not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error accessing video", http.StatusInternalServerError)
		}
		return
	}

	if fileInfo.IsDir() {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Open the file
	file, err := os.Open(filePath)
	if err != nil {
		http.Error(w, "Error opening video", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	// Set content type based on file extension
	ext := strings.ToLower(filepath.Ext(filePath))
	contentType := getVideoContentType(ext)
	w.Header().Set("Content-Type", contentType)

	// Enable range requests for seeking
	w.Header().Set("Accept-Ranges", "bytes")

	// Allow CORS if needed (for Wails frontend)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range")

	// Handle OPTIONS preflight request
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Use http.ServeContent for automatic range request handling
	// This handles If-Range, If-Modified-Since, etc. automatically
	http.ServeContent(w, r, filepath.Base(filePath), fileInfo.ModTime(), file)
}

// serveSubtitle serves a subtitle file (SRT/VTT)
// Path format: /subtitles/{relative_path_to_subtitle}
func (h *VideoHandler) serveSubtitle(w http.ResponseWriter, r *http.Request, relativePath string) {
	// Security: Prevent directory traversal attacks
	if strings.Contains(relativePath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Construct full file path
	filePath := filepath.Join(h.coursesDir, relativePath)

	// Check if file exists
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Subtitle not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error accessing subtitle", http.StatusInternalServerError)
		}
		return
	}

	if fileInfo.IsDir() {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Read subtitle file
	content, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "Error reading subtitle", http.StatusInternalServerError)
		return
	}

	// Detect subtitle format and set content type
	ext := strings.ToLower(filepath.Ext(filePath))
	var contentType string
	var convertedContent []byte

	switch ext {
	case ".vtt":
		contentType = "text/vtt"
		convertedContent = content
	case ".srt":
		// Convert SRT to WebVTT if needed
		contentType = "text/vtt"
		convertedContent = convertSRTtoVTT(content)
	default:
		contentType = "text/plain"
		convertedContent = content
	}

	// Set headers
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", strconv.Itoa(len(convertedContent)))
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Write content
	w.WriteHeader(http.StatusOK)
	w.Write(convertedContent)
}

// getVideoContentType returns the MIME type for a video file extension
func getVideoContentType(ext string) string {
	switch ext {
	case ".mp4":
		return "video/mp4"
	case ".webm":
		return "video/webm"
	case ".ogg", ".ogv":
		return "video/ogg"
	case ".mkv":
		return "video/x-matroska"
	case ".avi":
		return "video/x-msvideo"
	case ".mov":
		return "video/quicktime"
	case ".m4v":
		return "video/x-m4v"
	default:
		return "video/mp4" // Default to MP4
	}
}

// convertSRTtoVTT converts SRT subtitle format to WebVTT format
// This is a simple conversion that adds the WEBVTT header and handles basic formatting
func convertSRTtoVTT(srtContent []byte) []byte {
	content := string(srtContent)

	// Check if already VTT
	if strings.HasPrefix(content, "WEBVTT") {
		return srtContent
	}

	// Add WEBVTT header
	vtt := "WEBVTT\n\n" + content

	// Replace SRT timestamp format (00:00:00,000) with VTT format (00:00:00.000)
	vtt = strings.ReplaceAll(vtt, ",", ".")

	return []byte(vtt)
}

// GetVideoPath constructs the relative path for a video URL
// This can be used by the service layer to generate video URLs
func GetVideoPath(coursePath, lecturePath string) string {
	// Remove leading slash if present
	coursePath = strings.TrimPrefix(coursePath, "/")
	lecturePath = strings.TrimPrefix(lecturePath, "/")

	// Construct relative path
	return filepath.Join(coursePath, lecturePath)
}

// ValidateVideoFile checks if a video file exists and is accessible
func (h *VideoHandler) ValidateVideoFile(relativePath string) error {
	if strings.Contains(relativePath, "..") {
		return fmt.Errorf("invalid path: contains directory traversal")
	}

	filePath := filepath.Join(h.coursesDir, relativePath)
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return fmt.Errorf("file not found: %w", err)
	}

	if fileInfo.IsDir() {
		return fmt.Errorf("path is a directory, not a file")
	}

	return nil
}
