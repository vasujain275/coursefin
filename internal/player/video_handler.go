// Package player provides video serving and playback control functionality
package player

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
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
// The solution is a plain net/http server on a loopback port that receives
// the file path as a query parameter (?path=...), percent-encoded as an opaque
// value to avoid any scheme/path ambiguity.
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

	if fileInfo.IsDir() {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

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

	http.ServeContent(w, r, filepath.Base(absolutePath), fileInfo.ModTime(), file)
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
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(responseContent)))
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)
	w.Write(responseContent)
}

var srtTimestampCommaRegex = regexp.MustCompile(`(\d{2}:\d{2}:\d{2}),(\d{3})`)

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

	vtt = srtTimestampCommaRegex.ReplaceAllString(vtt, "$1.$2")

	return []byte(vtt)
}
