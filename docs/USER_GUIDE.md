# Natural Speech - User Guide

## Introduction

Natural Speech is an AI-powered application that converts text into lifelike speech and generates talking avatar videos. This guide will help you get started and make the most of the application.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- An internet connection (for initial setup)
- Backend server running (see Developer Guide for setup)

### Accessing the Application

1. Ensure the backend server is running (default: `http://localhost:8000`)
2. Open the frontend application in your browser (default: `http://localhost:5173`)
3. You should see the Natural Speech interface

## Features

### Text-to-Speech (TTS)

Convert any text into natural-sounding speech audio.

**How to use:**
1. Navigate to the "Text to Speech" tab
2. Enter your text in the script input field (up to 5000 characters)
3. Select a voice from the dropdown menu
4. Adjust the speech speed using the slider (0.5x to 2.0x)
5. Click "Generate Content"
6. Wait for processing (usually < 1 second)
7. Play the generated audio using the audio player

**Tips:**
- Use punctuation for natural pauses
- Longer texts may take slightly longer to process
- Try different voices to find your preferred style
- Adjust speed for different use cases (slow for narration, fast for quick messages)

### Avatar Studio

Create talking avatar videos from text and an image.

**How to use:**
1. Navigate to the "Avatar Studio" tab
2. Enter your text in the script input field (up to 5000 characters)
3. Upload an image file (PNG, JPG, or JPEG)
   - Best results with clear face images
   - Recommended size: 512x512 pixels or larger
4. Select a voice from the dropdown menu
5. Adjust the speech speed if needed
6. Click "Generate Content"
7. Wait for processing (30-60 seconds)
8. Watch the generated video using the video player

**Tips:**
- Use images with clear, front-facing faces for best results
- Avoid images with multiple faces
- Higher resolution images generally produce better results
- Avatar generation takes longer than audio-only generation

## Voice Selection

The application includes multiple voice models, each with unique characteristics:
- Different accents and tones
- Male and female voices
- Various speaking styles

Experiment with different voices to find the one that best fits your content.

## Speed Control

The speed slider allows you to control how fast the speech is generated:
- **0.5x - 0.9x**: Slow, deliberate speech (good for narration)
- **1.0x**: Normal speed (default)
- **1.1x - 1.5x**: Fast speech (good for quick messages)
- **1.6x - 2.0x**: Very fast speech (use sparingly)

## Best Practices

### Text Input
- Write clear, well-punctuated text
- Use proper capitalization
- Break long sentences for better natural flow
- Avoid special characters that may cause issues

### Image Selection (Avatar)
- Use high-quality images
- Ensure the face is clearly visible
- Front-facing portraits work best
- Avoid heavily edited or filtered images
- Crop to focus on the face if needed

### Performance
- Shorter texts process faster
- Audio generation is typically instant
- Avatar generation requires more time - be patient
- Close other resource-intensive applications if generation is slow

## Troubleshooting

### Audio Not Playing
- Check your browser's audio settings
- Ensure the backend server is running
- Try refreshing the page
- Check browser console for errors

### Avatar Generation Fails
- Verify the image file is valid (PNG, JPG, JPEG)
- Ensure the image contains a detectable face
- Check that the backend server is running
- Try a different image
- Check server logs for detailed error messages

### Slow Generation
- Avatar generation is computationally intensive
- Ensure your system meets minimum requirements
- Close other applications to free up resources
- Shorter texts process faster

### No Voices Available
- Ensure the backend server is running
- Check that the voices.json file exists
- Restart the backend server
- Check server logs for initialization errors

## Keyboard Shortcuts

- `Tab` - Navigate between form fields
- `Enter` - Submit form (when focused on input)
- `Escape` - Close dialogs or cancel operations

## Browser Compatibility

The application works best with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Older browsers may experience limited functionality.

## Limitations

- Maximum text length: 5000 characters
- Supported image formats: PNG, JPG, JPEG
- Avatar generation requires significant processing time
- Requires backend server to be running
- Internet connection needed for initial setup

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Check backend server logs
4. Ensure all prerequisites are met
5. Try refreshing the page

For technical support or feature requests, please refer to the Developer Guide or project documentation.

