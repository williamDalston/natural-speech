const API_BASE_URL = "http://localhost:8000/api";

export const getVoices = async () => {
    const response = await fetch(`${API_BASE_URL}/voices`);
    if (!response.ok) {
        throw new Error("Failed to fetch voices");
    }
    return response.json();
};

export const generateSpeech = async (text, voice, speed) => {
    const response = await fetch(`${API_BASE_URL}/tts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voice, speed }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate speech");
    }

    return response.blob();
};

export const generateAvatar = async (text, voice, speed, imageFile) => {
    const formData = new FormData();
    formData.append("text", text);
    formData.append("voice", voice);
    formData.append("speed", speed);
    formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/avatar`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate avatar");
    }

    return response.blob();
};
