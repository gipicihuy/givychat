// File: /netlify/functions/upload-file.js

// Gunakan CommonJS require() untuk Netlify Functions
const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        let body;
        if (event.body) {
            // Netlify Functions membaca body POST
            body = JSON.parse(event.body);
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'No request body received' }) };
        }
        
        const { file } = body; 

        if (!file) {
             return { statusCode: 400, body: JSON.stringify({ error: 'No file provided in the request body' }) };
        }
        
        // Ekstrak tipe file dan data Base64
        const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid file format or missing Base64 data' }) };
        }
        
        const contentType = matches[1];
        // Pastikan event.isBase64Encoded adalah true jika data base64 tidak di-decode otomatis
        // Dalam kasus ini, kita mengandalkan JSON.parse dan Buffer.from untuk menangani string Base64.
        const fileBuffer = Buffer.from(matches[2], 'base64');
        
        const fileExtension = contentType.split('/')[1] || 'bin';
        const fileName = `anon_upload_${Date.now()}.${fileExtension}`;

        const formData = new FormData();
        formData.append('files[]', fileBuffer, {
            filename: fileName,
            contentType: contentType
        });

        // Kirim ke Qu.ax
        const response = await fetch('https://qu.ax/upload.php', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed at Qu.ax: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const quaxData = await response.json();

        if (quaxData.success && quaxData.files && quaxData.files.length > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    url: quaxData.files[0].url
                }),
                headers: { 'Content-Type': 'application/json' }
            };
        } else {
            throw new Error('Upload failed - qu.ax returned no file URL');
        }

    } catch (error) {
        console.error('Upload error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Upload failed', 
                details: error.message 
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
