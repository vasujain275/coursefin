# Audio Playback Fix for CourseFin

## Problem
Videos play correctly but **no audio** is heard, even though the video file contains an AAC audio track.

## Root Cause
WebKitGTK uses **GStreamer** for media playback. The system is missing the **MPEG-4 AAC decoder** plugin required to decode the audio track.

### Diagnosis Output:
```
Missing plugins
 (gstreamer|1.0|gst-discoverer-1.0|MPEG-4 AAC decoder|decoder-audio/mpeg, mpegversion=(int)4...)
```

### Video File Audio Info:
```bash
Stream #0:1: Audio: aac (HE-AAC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 62 kb/s
```

## Solution

Install the **gst-libav** package which provides FFmpeg-based codecs including AAC:

### Arch Linux / PopOS / Ubuntu:
```bash
# Arch Linux
sudo pacman -S gst-libav

# Ubuntu/PopOS
sudo apt install gstreamer1.0-libav
```

### Verify Installation:
```bash
# Check if AAC decoder is now available
gst-inspect-1.0 avdec_aac
```

Expected output:
```
Plugin Details:
  Name                     libav
  Description              All FFmpeg codecs
  ...
Element Implementation:
  Has Bin extension: no
  Type: <something>/avdec_aac
```

### Test Video Playback:
```bash
# Test with GStreamer directly
gst-play-1.0 "path/to/video.mp4"
```

You should now hear audio!

## Technical Details

- **WebKitGTK** (used by Wails) relies on **GStreamer** for all media playback
- GStreamer has a **plugin architecture** where codecs are separate packages
- **gst-libav** wraps FFmpeg's codecs and makes them available to GStreamer
- Without this plugin, GStreamer can only play basic formats (Vorbis, Opus, FLAC, etc.)
- **AAC** (especially HE-AAC) requires the libav/FFmpeg plugin

## Alternative Solution (if gst-libav doesn't work)

Some systems might have `gst-plugins-bad` which includes a native AAC decoder:
```bash
# Arch Linux
sudo pacman -S gst-plugins-bad

# Ubuntu/PopOS  
sudo apt install gstreamer1.0-plugins-bad
```

## Verification Commands

```bash
# List all available GStreamer decoders
gst-inspect-1.0 | grep -i dec

# Check specific AAC decoder
gst-inspect-1.0 avdec_aac

# Analyze video file codecs
ffprobe "video.mp4" 2>&1 | grep Stream

# Test if GStreamer can discover the file
gst-discoverer-1.0 "video.mp4"
```

## After Installation

1. **Restart the CourseFin application**
2. Click on any lecture
3. Audio should now play correctly!

No code changes needed - this is purely a system dependency issue.
