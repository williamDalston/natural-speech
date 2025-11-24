import React, { useState, useEffect } from 'react';
import TextInput from './components/TextInput';
import Controls from './components/Controls';
import AudioPlayer from './components/AudioPlayer';
import ImageUpload from './components/ImageUpload';
import VideoPlayer from './components/VideoPlayer';
import Layout from './components/Layout';
import { getVoices, generateSpeech, generateAvatar } from './api';
import { motion } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('tts');
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [image, setImage] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const data = await getVoices();
        setVoices(data.voices);
        if (data.voices.length > 0) {
          setSelectedVoice(data.voices[0]);
        }
      } catch (err) {
        console.error("Failed to load voices:", err);
        setError("Failed to load voices. Is the backend running?");
      }
    };

    fetchVoices();
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    setVideoUrl(null);

    try {
      if (activeTab === 'avatar' && image) {
        // Generate Avatar Video
        const videoBlob = await generateAvatar(text, selectedVoice, speed, image);
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
      } else {
        // Generate Audio Only
        const audioBlob = await generateSpeech(text, selectedVoice, speed);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      }
    } catch (err) {
      console.error("Generation failed:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {activeTab === 'tts' ? 'Text to Speech' : 'Avatar Studio'}
          </h2>
          <p className="text-gray-400">
            {activeTab === 'tts'
              ? 'Transform your text into lifelike speech with our advanced AI models.'
              : 'Bring your text to life with AI-generated talking avatars.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <TextInput text={text} setText={setText} />

              {activeTab === 'avatar' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <ImageUpload image={image} setImage={setImage} />
                </motion.div>
              )}
            </div>

            <div className="glass-card p-6">
              <Controls
                voices={voices}
                selectedVoice={selectedVoice}
                setSelectedVoice={setSelectedVoice}
                speed={speed}
                setSpeed={setSpeed}
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 h-full min-h-[400px] flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">Output</h3>

              <div className="flex-1 flex flex-col gap-4">
                {activeTab === 'tts' && audioUrl && (
                  <AudioPlayer audioUrl={audioUrl} />
                )}

                {activeTab === 'avatar' && videoUrl && (
                  <VideoPlayer videoUrl={videoUrl} />
                )}

                {!audioUrl && !videoUrl && !isLoading && (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-sm border-2 border-dashed border-gray-800 rounded-xl">
                    Generated content will appear here
                  </div>
                )}

                {isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
