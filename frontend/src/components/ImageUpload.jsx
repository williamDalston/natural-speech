import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({ image, setImage }) => {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!image) {
            setPreviewUrl(null);
        }
    }, [image]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                Avatar Image
            </label>

            <div
                onClick={() => !previewUrl && fileInputRef.current.click()}
                className={`relative w-full h-48 rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden group ${previewUrl
                        ? 'border-gray-700 bg-gray-900'
                        : 'border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/30 cursor-pointer'
                    }`}
            >
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="Avatar Preview"
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={handleClear}
                                className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors transform hover:scale-110"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-3">
                        <div className="p-4 rounded-full bg-gray-800/50 group-hover:bg-gray-800 transition-colors">
                            <Upload size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-300">Click to upload</p>
                            <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG</p>
                        </div>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
};

export default ImageUpload;
