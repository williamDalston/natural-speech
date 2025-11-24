import React from 'react';

const TextInput = ({ text, setText }) => {
    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                Script
            </label>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-field h-48 resize-none font-light leading-relaxed"
                placeholder="Enter your script here..."
            />
            <div className="mt-2 text-right text-xs text-gray-500">
                {text.length} characters
            </div>
        </div>
    );
};

export default TextInput;
