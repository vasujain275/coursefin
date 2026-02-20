// Package player provides video serving and playback control functionality
package player

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// VideoServer manages a local HTTP server for serving video files.
// A dedicated HTTP server is used because WebKitGTK (Linux) and WebView2
// (Windows) both have limitations with the Wails AssetHandler for media:
//
//   - WebKitGTK does not support range requests through the asset handler,
//     which breaks seeking in HTML5 video.
//   - On Windows, embedding a Windows-style absolute path (e.g. C:\Users\...)
//     directly in a URL path causes Chromium/WebView2 to misinterpret "C:" as
//     a URL scheme, silently failing to load the video.
//
// The solution is a plain net/http server on a loopback port that:
//  1. Receives the file path as a query parameter (?path=...) so that it is
//     percent-encoded as an opaque value, avoiding any scheme/path ambiguity.
//  2. Manually handles byte-range requests so seeking works cross-platform.
type VideoServer struct {
	server   *http.Server
	listener net.Listener
	port     int
}

// NewVideoServer creates and starts a local HTTP server for video serving
func NewVideoServer() (*VideoServer, error) {
	// Find an available port
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, fmt.Errorf("failed to find available port: %w", err)
	}

	port := listener.Addr().(*net.TCPAddr).Port

	vs := &VideoServer{
		listener: listener,
		port:     port,
	}

	// Register handlers on exact paths (no trailing slash) so the mux does
	// not strip any path prefix — the file path is carried in the query string.
	mux := http.NewServeMux()
	mux.HandleFunc("/video", vs.handleVideo)
	mux.HandleFunc("/subtitle", vs.handleSubtitle)

	vs.server = &http.Server{
		Handler: mux,
	}

	// Start server in background
	go func() {
		if err := vs.server.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[VideoServer] Server error: %v\n", err)
		}
	}()

	return vs, nil
}

// GetPort returns the port the server is running on
func (vs *VideoServer) GetPort() int {
	return vs.port
}

// GetVideoURL returns the full URL for serving a video file.
//
// The absolute file-system path is passed as a query parameter rather than
// embedded in the URL path.  This avoids the well-known Chromium/WebView2
// issue where a Windows drive letter ("C:") in the URL path is interpreted as
// a URL scheme, preventing the video from loading.
func (vs *VideoServer) GetVideoURL(absolutePath string) string {
	return fmt.Sprintf("http://127.0.0.1:%d/video?path=%s", vs.port, url.QueryEscape(absolutePath))
}

// GetSubtitleURL returns the full URL for serving a subtitle file.
// See GetVideoURL for why the path is a query parameter.
func (vs *VideoServer) GetSubtitleURL(absolutePath string) string {
	return fmt.Sprintf("http://127.0.0.1:%d/subtitle?path=%s", vs.port, url.QueryEscape(absolutePath))
}

// Stop gracefully shuts down the video server
func (vs *VideoServer) Stop() error {
	if vs.server != nil {
		return vs.server.Shutdown(context.Background())
	}
	return nil
}

// handleVideo serves video files with range request support
func (vs *VideoServer) handleVideo(w http.ResponseWriter, r *http.Request) {
	// The file path is passed as ?path=<url.QueryEscape(absolutePath)>.
	// url.QueryEscape encodes the entire path atomically (including drive
	// letters such as "C:" and directory separators), so no ambiguity arises
	// when the URL is parsed by Chromium/WebView2 or any other client.
	rawPath := r.URL.Query().Get("path")
	if rawPath == "" {
		http.Error(w, "Missing path parameter", http.StatusBadRequest)
		return
	}

	// QueryEscape / QueryUnescape round-trips cleanly — no manual
	// percent-decoding needed beyond what Go's url package already did for us
	// when populating r.URL.Query().
	// filepath.FromSlash is a no-op on Unix; on Windows it converts forward
	// slashes to backslashes so os.Open works correctly.
	absolutePath := filepath.FromSlash(rawPath)

	// Security check
	if strings.Contains(absolutePath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Open file
	file, err := os.Open(absolutePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Video not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error opening video", http.StatusInternalServerError)
		}
		return
	}
	defer file.Close()

	// Get file info
	fileInfo, err := file.Stat()
	if err != nil {
		http.Error(w, "Error reading file info", http.StatusInternalServerError)
		return
	}

	fileSize := fileInfo.Size()
	contentType := getVideoContentType(strings.ToLower(filepath.Ext(absolutePath)))

	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")

	// Handle OPTIONS preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Parse range header
	rangeHeader := r.Header.Get("Range")

	if rangeHeader == "" {
		// Serve full file
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Content-Length", strconv.FormatInt(fileSize, 10))
		w.Header().Set("Accept-Ranges", "bytes")
		w.WriteHeader(http.StatusOK)
		io.Copy(w, file)
		return
	}

	// Parse range: bytes=start-end
	rangeHeader = strings.TrimPrefix(rangeHeader, "bytes=")
	rangeParts := strings.Split(rangeHeader, "-")

	if len(rangeParts) != 2 {
		http.Error(w, "Invalid range", http.StatusBadRequest)
		return
	}

	var start, end int64

	if rangeParts[0] != "" {
		start, err = strconv.ParseInt(rangeParts[0], 10, 64)
		if err != nil {
			http.Error(w, "Invalid range start", http.StatusBadRequest)
			return
		}
	}

	if rangeParts[1] != "" {
		end, err = strconv.ParseInt(rangeParts[1], 10, 64)
		if err != nil {
			http.Error(w, "Invalid range end", http.StatusBadRequest)
			return
		}
	} else {
		end = fileSize - 1
	}

	// Validate range
	if start < 0 || start >= fileSize || end < start || end >= fileSize {
		w.Header().Set("Content-Range", fmt.Sprintf("bytes */%d", fileSize))
		http.Error(w, "Range not satisfiable", http.StatusRequestedRangeNotSatisfiable)
		return
	}

	contentLength := end - start + 1

	// Seek to start
	file.Seek(start, io.SeekStart)

	// Set headers for partial content
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", strconv.FormatInt(contentLength, 10))
	w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
	w.Header().Set("Accept-Ranges", "bytes")
	w.WriteHeader(http.StatusPartialContent)

	// Copy the range
	io.CopyN(w, file, contentLength)
}

// handleSubtitle serves subtitle files
func (vs *VideoServer) handleSubtitle(w http.ResponseWriter, r *http.Request) {
	// Extract path from query parameter — same scheme as handleVideo.
	rawPath := r.URL.Query().Get("path")
	if rawPath == "" {
		http.Error(w, "Missing path parameter", http.StatusBadRequest)
		return
	}

	absolutePath := filepath.FromSlash(rawPath)

	// Security check
	if strings.Contains(absolutePath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Read file
	content, err := os.ReadFile(absolutePath)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Subtitle not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error reading subtitle", http.StatusInternalServerError)
		}
		return
	}

	// Determine content type and convert if needed
	ext := strings.ToLower(filepath.Ext(absolutePath))
	var contentType string
	var responseContent []byte

	switch ext {
	case ".vtt":
		contentType = "text/vtt"
		responseContent = content
	case ".srt":
		contentType = "text/vtt"
		responseContent = convertSRTtoVTT(content)
	default:
		contentType = "text/plain"
		responseContent = content
	}

	// Set headers
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", strconv.Itoa(len(responseContent)))
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	w.Write(responseContent)
}

// VideoHandler handles HTTP requests for serving video and subtitle files
// It supports range requests for seeking and provides secure file serving
type VideoHandler struct {
	// No coursesDir needed - paths are now absolute
}

// NewVideoHandler creates a new video handler
// No longer requires coursesDir as paths are now absolute
func NewVideoHandler() *VideoHandler {
	return &VideoHandler{}
}

// ServeHTTP implements the http.Handler interface
// Routes:
//   - /videos/* - Serves video files with range request support
//   - /subtitles/* - Serves subtitle files (SRT/VTT)
func (h *VideoHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// Route to appropriate handler
	// Strip only "/videos" or "/subtitles" prefix, keeping the leading slash of the absolute path
	if strings.HasPrefix(path, "/videos/") {
		h.serveVideo(w, r, strings.TrimPrefix(path, "/videos"))
	} else if strings.HasPrefix(path, "/subtitles/") {
		h.serveSubtitle(w, r, strings.TrimPrefix(path, "/subtitles"))
	} else {
		http.Error(w, "Not Found", http.StatusNotFound)
	}
}

// serveVideo serves a video file with range request support for seeking
// Path format: /videos/{url_encoded_absolute_path_to_video}
func (h *VideoHandler) serveVideo(w http.ResponseWriter, r *http.Request, encodedPath string) {
	// URL-decode the path to handle spaces and special characters
	absolutePath, err := url.PathUnescape(encodedPath)
	if err != nil {
		http.Error(w, "Invalid path encoding", http.StatusBadRequest)
		return
	}

	// Security: Prevent directory traversal attacks
	if strings.Contains(absolutePath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// The path is already absolute from the URL
	filePath := absolutePath

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

	// Get file size
	fileSize := fileInfo.Size()

	// Handle OPTIONS preflight request
	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Range")
		w.WriteHeader(http.StatusOK)
		return
	}

	// Manual range request handling for WebKitGTK compatibility
	rangeHeader := r.Header.Get("Range")

	if rangeHeader == "" {
		// No range request - serve the entire file
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Content-Length", strconv.FormatInt(fileSize, 10))
		w.Header().Set("Accept-Ranges", "bytes")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("X-Content-Type-Options", "nosniff")

		w.WriteHeader(http.StatusOK)

		// Copy entire file
		_, err = io.Copy(w, file)
		if err != nil {
			fmt.Printf("[VideoHandler] Error copying file: %v\n", err)
			return
		}

		return
	}

	// Parse range request (format: "bytes=start-end")
	var start, end int64
	rangeHeader = strings.TrimPrefix(rangeHeader, "bytes=")
	rangeParts := strings.Split(rangeHeader, "-")

	if len(rangeParts) != 2 {
		http.Error(w, "Invalid range header", http.StatusBadRequest)
		return
	}

	// Parse start byte
	if rangeParts[0] != "" {
		start, err = strconv.ParseInt(rangeParts[0], 10, 64)
		if err != nil {
			http.Error(w, "Invalid range start", http.StatusBadRequest)
			return
		}
	}

	// Parse end byte
	if rangeParts[1] != "" {
		end, err = strconv.ParseInt(rangeParts[1], 10, 64)
		if err != nil {
			http.Error(w, "Invalid range end", http.StatusBadRequest)
			return
		}
	} else {
		// If no end specified, serve to end of file
		end = fileSize - 1
	}

	// Validate range
	if start < 0 || start >= fileSize || end < start || end >= fileSize {
		w.Header().Set("Content-Range", fmt.Sprintf("bytes */%d", fileSize))
		http.Error(w, "Requested range not satisfiable", http.StatusRequestedRangeNotSatisfiable)
		return
	}

	// Calculate content length for this range
	contentLength := end - start + 1

	// Seek to start position
	_, err = file.Seek(start, io.SeekStart)
	if err != nil {
		fmt.Printf("[VideoHandler] Error seeking: %v\n", err)
		http.Error(w, "Error reading file", http.StatusInternalServerError)
		return
	}

	// Set response headers for range request
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", strconv.FormatInt(contentLength, 10))
	w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Content-Type-Options", "nosniff")

	// Send 206 Partial Content status
	w.WriteHeader(http.StatusPartialContent)

	// Copy the requested range
	_, err = io.CopyN(w, file, contentLength)
	if err != nil && err != io.EOF {
		fmt.Printf("[VideoHandler] Error copying range: %v\n", err)
		return
	}
}

// serveSubtitle serves a subtitle file (SRT/VTT)
// Path format: /subtitles/{url_encoded_absolute_path_to_subtitle}
func (h *VideoHandler) serveSubtitle(w http.ResponseWriter, r *http.Request, encodedPath string) {
	// URL-decode the path to handle spaces and special characters
	absolutePath, err := url.PathUnescape(encodedPath)
	if err != nil {
		http.Error(w, "Invalid path encoding", http.StatusBadRequest)
		return
	}

	// Security: Prevent directory traversal attacks
	if strings.Contains(absolutePath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// The path is already absolute from the URL
	filePath := absolutePath

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

// getVideoContentType returns the MIME type for a given file extension.
// The function handles both video formats and HTML lecture files.
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
	case ".html", ".htm":
		return "text/html; charset=utf-8"
	default:
		return "application/octet-stream"
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
func (h *VideoHandler) ValidateVideoFile(absolutePath string) error {
	if strings.Contains(absolutePath, "..") {
		return fmt.Errorf("invalid path: contains directory traversal")
	}

	filePath := absolutePath
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return fmt.Errorf("file not found: %w", err)
	}

	if fileInfo.IsDir() {
		return fmt.Errorf("path is a directory, not a file")
	}

	return nil
}
