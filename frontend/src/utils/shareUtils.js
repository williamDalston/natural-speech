/**
 * Sharing utilities for writings
 * Supports Web Share API, clipboard, social media, and QR codes
 */
import logger from './logger';

/**
 * Generate a shareable link for a writing
 * Note: This creates a client-side shareable link. For production,
 * you might want to create a backend endpoint that generates short URLs.
 */
export const generateShareLink = (writing) => {
    // For now, create a data URL or use the current page with query params
    // In production, this would be a backend-generated short link
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
        share: writing.id.toString(),
        title: writing.title || 'Untitled'
    });
    return `${baseUrl}?${params.toString()}`;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    } catch (error) {
        logger.error('Failed to copy to clipboard', error);
        return false;
    }
};

/**
 * Share using Web Share API (mobile-friendly)
 */
export const shareViaWebAPI = async (writing) => {
    if (!navigator.share) {
        return false; // Web Share API not supported
    }

    try {
        const shareData = {
            title: writing.title || 'Untitled Writing',
            text: writing.content.substring(0, 200) + (writing.content.length > 200 ? '...' : ''),
            url: generateShareLink(writing),
        };

        await navigator.share(shareData);
        return true;
    } catch (error) {
        if (error.name === 'AbortError') {
            // User cancelled share
            return false;
        }
        logger.error('Error sharing', error);
        return false;
    }
};

/**
 * Share to Twitter
 */
export const shareToTwitter = (writing) => {
    const text = encodeURIComponent(
        `"${writing.title || 'Untitled'}" by ${writing.author || 'Anonymous'}\n\n${writing.content.substring(0, 200)}...`
    );
    const url = encodeURIComponent(generateShareLink(writing));
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
};

/**
 * Share to Facebook
 */
export const shareToFacebook = (writing) => {
    const url = encodeURIComponent(generateShareLink(writing));
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
};

/**
 * Share to LinkedIn
 */
export const shareToLinkedIn = (writing) => {
    const url = encodeURIComponent(generateShareLink(writing));
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
};

/**
 * Share via email
 */
export const shareViaEmail = (writing) => {
    const subject = encodeURIComponent(`Check out: ${writing.title || 'Untitled'}`);
    const body = encodeURIComponent(
        `${writing.title || 'Untitled'}\n\n` +
        (writing.author ? `by ${writing.author}\n\n` : '') +
        `${writing.content.substring(0, 500)}${writing.content.length > 500 ? '...' : ''}\n\n` +
        `Read more: ${generateShareLink(writing)}`
    );
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
};

/**
 * Generate QR code data URL (using a simple API or library)
 * For production, you might want to use a QR code library like 'qrcode'
 */
export const generateQRCode = async (text) => {
    // Using a free QR code API service
    // In production, consider using a library like 'qrcode' or 'qrcode.react'
    const encodedText = encodeURIComponent(text);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedText}`;
    
    try {
        const response = await fetch(qrApiUrl);
        if (response.ok) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
        throw new Error('Failed to generate QR code');
    } catch (error) {
        logger.error('Error generating QR code', error);
        // Fallback: return a data URL with error message
        return null;
    }
};

/**
 * Check if Web Share API is supported
 */
export const isWebShareSupported = () => {
    return typeof navigator !== 'undefined' && navigator.share !== undefined;
};

/**
 * Check if clipboard API is supported
 */
export const isClipboardSupported = () => {
    return typeof navigator !== 'undefined' && 
           (navigator.clipboard !== undefined || document.execCommand !== undefined);
};

