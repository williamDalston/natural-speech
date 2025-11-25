/**
 * Export utilities for writings
 * Supports PDF, Markdown, HTML, and TXT formats
 */

/**
 * Export writing as plain text
 */
export const exportAsTxt = (writing) => {
    const content = formatWritingContent(writing, 'txt');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${sanitizeFilename(writing.title || 'writing')}.txt`);
};

/**
 * Export writing as Markdown
 */
export const exportAsMarkdown = (writing) => {
    const content = formatWritingContent(writing, 'markdown');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${sanitizeFilename(writing.title || 'writing')}.md`);
};

/**
 * Export writing as HTML
 */
export const exportAsHTML = (writing) => {
    const content = formatWritingContent(writing, 'html');
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, `${sanitizeFilename(writing.title || 'writing')}.html`);
};

/**
 * Export writing as PDF using browser print API
 */
export const exportAsPDF = (writing) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups to export as PDF.');
    }

    const html = formatWritingContent(writing, 'html');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${writing.title || 'Writing'}</title>
            <style>
                @media print {
                    @page {
                        margin: 2cm;
                        size: A4;
                    }
                    body {
                        font-family: 'Georgia', 'Times New Roman', serif;
                        font-size: 12pt;
                        line-height: 1.6;
                        color: #000;
                        max-width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    h1 {
                        font-size: 24pt;
                        margin-bottom: 0.5em;
                        page-break-after: avoid;
                    }
                    .author {
                        font-size: 14pt;
                        color: #666;
                        margin-bottom: 1em;
                        font-style: italic;
                    }
                    .metadata {
                        font-size: 10pt;
                        color: #888;
                        margin-bottom: 2em;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 1em;
                    }
                    .content {
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    .footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        text-align: center;
                        font-size: 9pt;
                        color: #888;
                        border-top: 1px solid #ddd;
                        padding-top: 0.5em;
                    }
                }
                @media screen {
                    body {
                        font-family: 'Georgia', 'Times New Roman', serif;
                        font-size: 12pt;
                        line-height: 1.6;
                        color: #000;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2cm;
                    }
                }
            </style>
        </head>
        <body>
            ${html}
            <div class="footer">
                <p>Exported from Prose & Pause - ${new Date().toLocaleDateString()}</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    setTimeout(() => {
        printWindow.print();
        // Close window after print dialog closes (user may cancel)
        setTimeout(() => {
            printWindow.close();
        }, 1000);
    }, 250);
};

/**
 * Format writing content for different export formats
 */
const formatWritingContent = (writing, format) => {
    const title = writing.title || 'Untitled';
    const author = writing.author || '';
    const content = writing.content || '';
    const date = writing.created_at 
        ? new Date(writing.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : new Date().toLocaleDateString();

    switch (format) {
        case 'txt':
            let txt = title + '\n';
            if (author) txt += `by ${author}\n`;
            txt += `\n${'='.repeat(50)}\n\n`;
            txt += content;
            txt += `\n\n${'='.repeat(50)}\n`;
            txt += `Exported: ${new Date().toLocaleDateString()}`;
            return txt;

        case 'markdown':
            let md = `# ${title}\n\n`;
            if (author) md += `**by ${author}**\n\n`;
            md += `*Created: ${date}*\n\n`;
            md += `---\n\n`;
            md += content.split('\n').map(line => line || ' ').join('\n');
            md += `\n\n---\n\n*Exported from Prose & Pause on ${new Date().toLocaleDateString()}*`;
            return md;

        case 'html':
            let html = `
                <div style="max-width: 800px; margin: 0 auto; padding: 2cm; font-family: 'Georgia', 'Times New Roman', serif;">
                    <h1 style="font-size: 24pt; margin-bottom: 0.5em;">${escapeHtml(title)}</h1>
                    ${author ? `<p class="author" style="font-size: 14pt; color: #666; margin-bottom: 1em; font-style: italic;">by ${escapeHtml(author)}</p>` : ''}
                    <div class="metadata" style="font-size: 10pt; color: #888; margin-bottom: 2em; border-bottom: 1px solid #ddd; padding-bottom: 1em;">
                        Created: ${date} • ${content.length} characters
                    </div>
                    <div class="content" style="white-space: pre-wrap; word-wrap: break-word; line-height: 1.6;">
                        ${escapeHtml(content)}
                    </div>
                </div>
            `;
            return html;

        default:
            return content;
    }
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Sanitize filename by removing invalid characters
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100);
};

/**
 * Download blob as file
 */
const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Batch export multiple writings
 */
export const batchExport = (writings, format) => {
    if (writings.length === 0) {
        throw new Error('No writings selected for export');
    }

    if (format === 'pdf') {
        // PDF batch export - create a combined document
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('Popup blocked. Please allow popups to export as PDF.');
        }

        let combinedHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Writings Export</title>
                <style>
                    @media print {
                        @page {
                            margin: 2cm;
                            size: A4;
                        }
                        .writing {
                            page-break-after: always;
                            margin-bottom: 2cm;
                        }
                        .writing:last-child {
                            page-break-after: auto;
                        }
                    }
                    body {
                        font-family: 'Georgia', 'Times New Roman', serif;
                        font-size: 12pt;
                        line-height: 1.6;
                        color: #000;
                    }
                    h1 {
                        font-size: 24pt;
                        margin-bottom: 0.5em;
                    }
                    .author {
                        font-size: 14pt;
                        color: #666;
                        margin-bottom: 1em;
                        font-style: italic;
                    }
                    .content {
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                </style>
            </head>
            <body>
        `;

        writings.forEach((writing, index) => {
            combinedHTML += `
                <div class="writing">
                    ${formatWritingContent(writing, 'html')}
                </div>
            `;
        });

        combinedHTML += `
                <div style="text-align: center; margin-top: 2cm; font-size: 9pt; color: #888;">
                    <p>Exported ${writings.length} writing(s) from Prose & Pause - ${new Date().toLocaleDateString()}</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(combinedHTML);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            setTimeout(() => {
                printWindow.close();
            }, 1000);
        }, 250);
    } else {
        // For other formats, create a ZIP-like structure or individual files
        // For simplicity, we'll export them one by one with a delay
        writings.forEach((writing, index) => {
            setTimeout(() => {
                switch (format) {
                    case 'txt':
                        exportAsTxt(writing);
                        break;
                    case 'markdown':
                        exportAsMarkdown(writing);
                        break;
                    case 'html':
                        exportAsHTML(writing);
                        break;
                }
            }, index * 500); // Stagger downloads to avoid browser blocking
        });
    }
};

