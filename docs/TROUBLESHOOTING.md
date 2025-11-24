# Troubleshooting Guide

## Common Issues and Solutions

### Backend Issues

#### Backend Won't Start

**Problem:** Backend server fails to start or crashes on startup.

**Solutions:**
1. **Check Python version:**
   ```bash
   python3 --version  # Should be 3.8 or higher
   ```

2. **Verify model files exist:**
   - `kokoro-v0_19.onnx` - TTS model
   - `voices.json` or `voices.bin.npy` - Voice definitions
   - `SadTalker/checkpoints/` - Avatar model checkpoints

3. **Check port availability:**
   ```bash
   lsof -i :8000  # Check if port 8000 is in use
   ```

4. **Reinstall dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt --force-reinstall
   ```

5. **Check error logs:**
   - Look for detailed error messages in the console output
   - Check for missing system dependencies (FFmpeg, etc.)

#### TTS Service Not Initializing

**Problem:** TTS service fails to initialize, returns 500 errors.

**Solutions:**
1. **Verify model file:**
   ```bash
   ls -lh kokoro-v0_19.onnx
   ```

2. **Check voices file:**
   ```bash
   ls -lh voices.json voices.bin.npy
   ```

3. **Test model loading:**
   ```python
   from kokoro_onnx import Kokoro
   kokoro = Kokoro("kokoro-v0_19.onnx", "voices.json")
   ```

4. **Check NumPy version:**
   - Ensure NumPy < 2.0 (required by Kokoro)
   ```bash
   pip install "numpy<2.0"
   ```

#### Avatar Generation Fails

**Problem:** Avatar generation returns errors or produces no output.

**Solutions:**
1. **Verify SadTalker installation:**
   ```bash
   ls -la SadTalker/inference.py
   ```

2. **Check checkpoints:**
   ```bash
   ls -la SadTalker/checkpoints/
   ```

3. **Verify FFmpeg:**
   ```bash
   ffmpeg -version
   ```

4. **Check image format:**
   - Ensure image is PNG, JPG, or JPEG
   - Verify image contains a detectable face
   - Try a different image

5. **Check disk space:**
   - Avatar generation creates temporary files
   - Ensure sufficient disk space available

6. **Review subprocess output:**
   - Check backend logs for SadTalker error messages
   - Look for Python import errors

### Frontend Issues

#### Frontend Won't Start

**Problem:** Frontend development server fails to start.

**Solutions:**
1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18 or higher
   ```

2. **Clear and reinstall dependencies:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check port availability:**
   ```bash
   lsof -i :5173  # Check if port 5173 is in use
   ```

4. **Update Vite:**
   ```bash
   npm update vite @vitejs/plugin-react
   ```

#### API Connection Errors

**Problem:** Frontend cannot connect to backend API.

**Solutions:**
1. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Check API base URL:**
   - Verify `VITE_API_BASE_URL` in `.env` file
   - Default should be `http://localhost:8000/api`

3. **Check CORS configuration:**
   - Ensure backend CORS allows frontend origin
   - Check browser console for CORS errors

4. **Test API directly:**
   ```bash
   curl http://localhost:8000/api/voices
   ```

#### Audio/Video Not Playing

**Problem:** Generated audio or video doesn't play in browser.

**Solutions:**
1. **Check browser console:**
   - Look for JavaScript errors
   - Check network tab for failed requests

2. **Verify blob URLs:**
   - Check that `URL.createObjectURL()` is working
   - Ensure blob data is valid

3. **Test file download:**
   - Try downloading the file directly
   - Verify file format is correct

4. **Check browser compatibility:**
   - Ensure browser supports audio/video playback
   - Try a different browser

### Testing Issues

#### Tests Failing

**Problem:** Unit or integration tests fail.

**Solutions:**
1. **Backend tests:**
   ```bash
   cd backend
   pytest -v  # Run with verbose output
   pytest --pdb  # Drop into debugger on failure
   ```

2. **Frontend tests:**
   ```bash
   cd frontend
   npm test -- --run  # Run tests once
   npm test -- --ui  # Run with UI for debugging
   ```

3. **Check test dependencies:**
   - Ensure all test dependencies are installed
   - Verify test data files exist

4. **Clear test cache:**
   ```bash
   # Backend
   rm -rf .pytest_cache
   
   # Frontend
   rm -rf node_modules/.vite
   ```

### Performance Issues

#### Slow Generation

**Problem:** Audio or avatar generation is very slow.

**Solutions:**
1. **Check system resources:**
   - Monitor CPU usage
   - Check available RAM
   - Verify disk I/O speed

2. **Optimize settings:**
   - Reduce text length for faster processing
   - Use lower resolution images for avatars
   - Close other resource-intensive applications

3. **Check for bottlenecks:**
   - Monitor backend logs for slow operations
   - Profile code to identify bottlenecks

#### High Memory Usage

**Problem:** Application uses excessive memory.

**Solutions:**
1. **Clear browser cache:**
   - Clear old blob URLs
   - Restart browser

2. **Limit concurrent requests:**
   - Don't generate multiple avatars simultaneously
   - Cancel old requests before starting new ones

3. **Check for memory leaks:**
   - Monitor memory usage over time
   - Review code for unclosed resources

### Deployment Issues

#### Docker Build Fails

**Problem:** Docker image build fails.

**Solutions:**
1. **Check Dockerfile syntax:**
   - Verify all paths are correct
   - Ensure dependencies are listed

2. **Check build context:**
   - Verify all required files are included
   - Check `.dockerignore` doesn't exclude needed files

3. **Review build logs:**
   - Look for specific error messages
   - Check for missing dependencies

#### Production Errors

**Problem:** Application works in development but fails in production.

**Solutions:**
1. **Check environment variables:**
   - Verify all required env vars are set
   - Check for typos in variable names

2. **Review production logs:**
   - Check application logs
   - Review server error logs

3. **Test production build locally:**
   ```bash
   npm run build
   npm run preview
   ```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:**
   - Backend: Console output and log files
   - Frontend: Browser console and network tab

2. **Review documentation:**
   - API Documentation: `docs/API.md`
   - Developer Guide: `docs/DEVELOPER_GUIDE.md`
   - User Guide: `docs/USER_GUIDE.md`

3. **Run diagnostics:**
   ```bash
   # Backend health check
   curl http://localhost:8000/api/health
   
   # Backend status
   curl http://localhost:8000/api/status
   ```

4. **Create a minimal reproduction:**
   - Isolate the issue
   - Document steps to reproduce
   - Include error messages and logs

## Error Codes Reference

- `SERVICE_UNAVAILABLE` - Required service not initialized
- `VALIDATION_ERROR` - Input validation failed
- `FILE_ERROR` - File operation failed
- `AUDIO_GENERATION_ERROR` - TTS generation failed
- `AVATAR_GENERATION_ERROR` - Avatar generation failed
- `INTERNAL_ERROR` - Unexpected server error

