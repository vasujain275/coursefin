# CourseFin System Requirements

## Overview
CourseFin is a Wails-based desktop application for managing and viewing locally downloaded Udemy courses. It uses WebKitGTK for rendering on Linux.

## Core Dependencies

### Build Requirements
- **Go** 1.21 or higher
- **Node.js** 18+ and npm/pnpm
- **Wails CLI** v2.11.0+

### Runtime Requirements (Linux)

#### Essential Packages
```bash
# Arch Linux / Manjaro
sudo pacman -S webkit2gtk-4.1 gtk3

# Ubuntu / PopOS / Debian
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0
```

#### Media Playback Support (CRITICAL)
WebKitGTK uses **GStreamer** for all media playback. The following packages are **required** for video/audio to work:

```bash
# Arch Linux / Manjaro
sudo pacman -S gstreamer gst-plugins-base gst-plugins-good gst-libav

# Ubuntu / PopOS / Debian
sudo apt install gstreamer1.0-plugins-base \
                 gstreamer1.0-plugins-good \
                 gstreamer1.0-libav
```

**Why gst-libav is critical:**
- Most Udemy courses use **AAC** or **HE-AAC** audio codecs
- Without `gst-libav`, videos will play **WITHOUT AUDIO**
- `gst-libav` provides FFmpeg-based codecs (AAC, H.264, etc.)

#### Optional But Recommended
```bash
# Arch Linux / Manjaro
sudo pacman -S gst-plugins-bad gst-plugins-ugly

# Ubuntu / PopOS / Debian  
sudo apt install gstreamer1.0-plugins-bad \
                 gstreamer1.0-plugins-ugly
```

These provide additional codec support for edge cases.

## Verification

### Check GStreamer Installation
```bash
# Verify AAC decoder is available
gst-inspect-1.0 avdec_aac

# List all available codecs
gst-inspect-1.0 | grep -i dec

# Test video playback (replace with actual path)
gst-play-1.0 /path/to/course/video.mp4
```

Expected output from `gst-inspect-1.0 avdec_aac`:
```
Plugin Details:
  Name                     libav
  Description              All FFmpeg codecs
  ...
Factory Details:
  Rank                     primary (256)
  Long-name                libav AAC (Advanced Audio Coding) decoder
```

### Diagnose Missing Codecs
If a video has no audio, check what's missing:
```bash
# Analyze video file
ffprobe video.mp4 2>&1 | grep Stream

# Check if GStreamer can decode it
gst-discoverer-1.0 video.mp4
```

If you see "Missing plugins" mentioning AAC, install `gst-libav`.

## Installation Instructions

### Arch Linux / Manjaro
```bash
# Install all required packages
sudo pacman -S webkit2gtk-4.1 gtk3 \
               gstreamer gst-plugins-base \
               gst-plugins-good gst-libav \
               gst-plugins-bad gst-plugins-ugly
```

### Ubuntu 22.04+ / PopOS / Debian
```bash
# Update package list
sudo apt update

# Install WebKit and GTK
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0

# Install GStreamer with full codec support
sudo apt install gstreamer1.0-tools \
                 gstreamer1.0-plugins-base \
                 gstreamer1.0-plugins-good \
                 gstreamer1.0-plugins-bad \
                 gstreamer1.0-plugins-ugly \
                 gstreamer1.0-libav
```

### Fedora
```bash
# Install WebKit and GTK
sudo dnf install webkit2gtk4.1 gtk3

# Install GStreamer
sudo dnf install gstreamer1 \
                 gstreamer1-plugins-base \
                 gstreamer1-plugins-good \
                 gstreamer1-libav

# Enable RPM Fusion for additional codecs
sudo dnf install gstreamer1-plugins-bad-free \
                 gstreamer1-plugins-ugly-free
```

## Common Issues

### ❌ Video plays but no audio
**Cause:** Missing `gst-libav` package  
**Solution:** Install `gst-libav` and restart the app

### ❌ Video doesn't load at all
**Cause:** Missing WebKitGTK or base GStreamer plugins  
**Solution:** Install `webkit2gtk-4.1` and `gst-plugins-base`

### ❌ Audio quality issues or crackling
**Cause:** Audio backend (PulseAudio/PipeWire) configuration  
**Solution:** Check system audio settings, ensure PipeWire/PulseAudio is running

## Development Environment

For developers, install additional tools:
```bash
# Build tools
sudo pacman -S base-devel git

# Go language
sudo pacman -S go

# Node.js and pnpm
sudo pacman -S nodejs pnpm

# Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

## Platform Support

### Officially Supported
- **Linux** (Primary platform)
  - Arch Linux
  - Ubuntu 22.04+
  - PopOS 22.04+
  - Debian 12+
  - Fedora 38+

### Planned
- **Windows** (via WebView2)
- **macOS** (via WKWebView)

## Notes for Package Maintainers

If creating a distribution package (AUR, DEB, RPM), ensure these runtime dependencies:

**Required:**
- `webkit2gtk-4.1` (or `webkit2gtk-4.0`)
- `gtk3`
- `gstreamer`
- `gst-plugins-base`
- `gst-plugins-good`
- `gst-libav` ⚠️ **CRITICAL**

**Recommended:**
- `gst-plugins-bad`
- `gst-plugins-ugly`

## Technical Details

### Why WebKitGTK?
Wails v2 uses native OS webviews:
- **Linux:** WebKitGTK
- **Windows:** WebView2 (Edge)
- **macOS:** WKWebView (Safari)

### Media Architecture
```
CourseFin App
    ↓
Wails Runtime
    ↓
WebKitGTK (Linux WebView)
    ↓
GStreamer (Media Backend)
    ↓
gst-libav (FFmpeg Codecs)
    ↓
Video/Audio Playback
```

### Video Server
CourseFin runs a **localhost HTTP server** (random port) to serve video files because WebKitGTK has limitations with custom protocol handlers for media elements. This is a known Wails issue (#1568).

Videos are served via: `http://127.0.0.1:<port>/video/<path>`

## License
This documentation is part of the CourseFin project.
