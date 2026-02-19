// ============================================================================
// Course Scanner - CourseFin
// ============================================================================
// Purpose: Filesystem scanning utilities for course import
// Pattern: Parse Udemy course folder structure (sections → lectures)
// Usage: Called by course service during import operations
// ============================================================================

package course

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// CourseMetadata represents scanned course information
type CourseMetadata struct {
	Title        string
	ThumbnailURL string // Optional - can be empty
	Sections     []SectionMetadata
}

// SectionMetadata represents a scanned section
type SectionMetadata struct {
	Title         string
	SectionNumber int
	Lectures      []LectureMetadata
}

// LectureMetadata represents a scanned lecture
type LectureMetadata struct {
	Title         string
	LectureNumber int
	VideoPath     string // Relative to courses_directory
	Duration      int64  // In seconds (0 if unknown)
	SubtitlePaths []string
}

// Section folder pattern: "1 - Introduction AWS Certified..." or "10 - Route 53"
var sectionFolderRegex = regexp.MustCompile(`^(\d+)\s*-\s*(.+)$`)

// Lecture file pattern: "1. Course Introduction....mp4" or "001. Title.mp4"
var lectureFileRegex = regexp.MustCompile(`^(\d+)\.?\s*(.+)\.(mp4|mkv|webm|avi)$`)

// ScanCourseFolder scans a course directory and extracts metadata
// coursePath: absolute path to course folder
// coursesDir: absolute path to courses library root (for relative path calculation)
func ScanCourseFolder(coursePath string, coursesDir string) (*CourseMetadata, error) {
	// Verify course folder exists
	info, err := os.Stat(coursePath)
	if err != nil {
		return nil, fmt.Errorf("course folder not accessible: %w", err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("path is not a directory: %s", coursePath)
	}

	// Extract course title from folder name
	courseTitle := filepath.Base(coursePath)

	// Find all section folders
	entries, err := os.ReadDir(coursePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read course directory: %w", err)
	}

	var sections []SectionMetadata
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		// Parse section folder name
		sectionNumber, sectionTitle := parseSectionFolderName(entry.Name())
		if sectionNumber == 0 {
			// Not a valid section folder, skip
			continue
		}

		// Scan lectures in this section
		sectionPath := filepath.Join(coursePath, entry.Name())
		lectures, err := scanSectionLectures(sectionPath, coursePath)
		if err != nil {
			return nil, fmt.Errorf("failed to scan section %s: %w", entry.Name(), err)
		}

		if len(lectures) == 0 {
			// Section has no video lectures, skip
			continue
		}

		sections = append(sections, SectionMetadata{
			Title:         sectionTitle,
			SectionNumber: sectionNumber,
			Lectures:      lectures,
		})
	}

	// Sort sections by section number
	sort.Slice(sections, func(i, j int) bool {
		return sections[i].SectionNumber < sections[j].SectionNumber
	})

	if len(sections) == 0 {
		return nil, fmt.Errorf("no valid sections found in course folder")
	}

	return &CourseMetadata{
		Title:    courseTitle,
		Sections: sections,
	}, nil
}

// parseSectionFolderName extracts section number and title from folder name
// Examples:
//
//	"1 - Introduction" → (1, "Introduction")
//	"10 - Route 53" → (10, "Route 53")
//	"invalid" → (0, "")
func parseSectionFolderName(folderName string) (int, string) {
	matches := sectionFolderRegex.FindStringSubmatch(folderName)
	if len(matches) != 3 {
		return 0, ""
	}

	sectionNumber, err := strconv.Atoi(matches[1])
	if err != nil {
		return 0, ""
	}

	sectionTitle := strings.TrimSpace(matches[2])
	return sectionNumber, sectionTitle
}

// scanSectionLectures scans a section folder for video lectures
func scanSectionLectures(sectionPath string, coursePath string) ([]LectureMetadata, error) {
	entries, err := os.ReadDir(sectionPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read section directory: %w", err)
	}

	var lectures []LectureMetadata
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		// Parse lecture file name
		lectureNumber, lectureTitle, ext := parseLectureFileName(entry.Name())
		if lectureNumber == 0 {
			// Not a valid lecture file, skip
			continue
		}

		// Calculate relative path from course folder (not coursesDir)
		videoAbsPath := filepath.Join(sectionPath, entry.Name())
		videoRelPath, err := filepath.Rel(coursePath, videoAbsPath)
		if err != nil {
			return nil, fmt.Errorf("failed to calculate relative path: %w", err)
		}

		// Find matching subtitle files
		subtitlePaths := findSubtitles(sectionPath, coursePath, entry.Name())

		lectures = append(lectures, LectureMetadata{
			Title:         lectureTitle,
			LectureNumber: lectureNumber,
			VideoPath:     videoRelPath,
			Duration:      0, // Duration will be extracted later by ffprobe if needed
			SubtitlePaths: subtitlePaths,
		})

		_ = ext // Unused, but keep for clarity
	}

	// Sort lectures by lecture number
	sort.Slice(lectures, func(i, j int) bool {
		return lectures[i].LectureNumber < lectures[j].LectureNumber
	})

	return lectures, nil
}

// parseLectureFileName extracts lecture number, title, and extension from file name
// Examples:
//
//	"1. Course Introduction.mp4" → (1, "Course Introduction", "mp4")
//	"001. Title.mp4" → (1, "Title", "mp4")
//	"10 Advanced Topics.mkv" → (10, "Advanced Topics", "mkv")
func parseLectureFileName(fileName string) (int, string, string) {
	matches := lectureFileRegex.FindStringSubmatch(fileName)
	if len(matches) != 4 {
		return 0, "", ""
	}

	lectureNumber, err := strconv.Atoi(matches[1])
	if err != nil {
		return 0, "", ""
	}

	lectureTitle := strings.TrimSpace(matches[2])
	ext := matches[3]

	return lectureNumber, lectureTitle, ext
}

// findSubtitles finds subtitle files matching a video file
// Looks for files with same base name and .srt/.vtt extension
// Examples:
//
//	"1. Course Introduction.mp4" → ["1. Course Introduction.en_US.srt", "1. Course Introduction.srt"]
func findSubtitles(sectionPath string, coursePath string, videoFileName string) []string {
	// Remove video extension
	baseName := strings.TrimSuffix(videoFileName, filepath.Ext(videoFileName))

	entries, err := os.ReadDir(sectionPath)
	if err != nil {
		return nil
	}

	var subtitles []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()

		// Check if file starts with video base name and has subtitle extension
		if strings.HasPrefix(name, baseName) {
			ext := strings.ToLower(filepath.Ext(name))
			if ext == ".srt" || ext == ".vtt" {
				// Calculate relative path from course folder
				subtitleAbsPath := filepath.Join(sectionPath, name)
				subtitleRelPath, err := filepath.Rel(coursePath, subtitleAbsPath)
				if err != nil {
					continue
				}
				subtitles = append(subtitles, subtitleRelPath)
			}
		}
	}

	return subtitles
}
