// File: /netlify/functions/upload-file.js

const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

    try {
        let body;
        
        // Handle rawBody for binary data
        if (event.isBase64Encoded && event.body) {
            body = JSON.parse(Buffer.from(event.body, 'base64').toString('utf8'));
        } else if (event.body) {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } else {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'No request body received' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        const { file } = body; 

        if (!file) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'No file provided in the request body' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        // Ekstrak tipe file dan data Base64
        // Format: data:image/jpeg;base64,/9j/4AAQSkZJRgABA...
        const matches = file.match(/^data:([A-Za-z0-9+\-\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'Invalid file format. Expected data URI with base64 encoding' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        const contentType = matches[1];
        const base64Data = matches[2];
        
        // Validasi base64
        if (!base64Data || base64Data.length === 0) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'Base64 data is empty' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        let fileBuffer;
        try {
            fileBuffer = Buffer.from(base64Data, 'base64');
        } catch (e) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ error: 'Invalid base64 encoding: ' + e.message }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        // Cek ukuran file (6MB max)
        if (fileBuffer.length > 6 * 1024 * 1024) {
            return { 
                statusCode: 413, 
                body: JSON.stringify({ error: 'File too large. Maximum 6MB allowed' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const fileExtension = contentType.split('/')[1]?.split(';')[0] || 'bin';
        const fileName = `anon_upload_${Date.now()}.${fileExtension}`;

        const formData = new FormData();
        formData.append('files[]', fileBuffer, {
            filename: fileName,
            contentType: contentType
        });

        console.log(`Uploading file: ${fileName}, size: ${fileBuffer.length} bytes, type: ${contentType}`);

        // Kirim ke Qu.ax dengan timeout
        const response = await Promise.race([
            fetch('https://qu.ax/upload.php', {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders(),
                timeout: 30000
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Upload timeout')), 30000)
            )
        ]);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Qu.ax error: ${response.status} - ${errorText.substring(0, 200)}`);
            throw new Error(`Upload failed at Qu.ax: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        let quaxData;
        try {
            quaxData = await response.json();
        } catch (e) {
            const responseText = await response.text();
            console.error(`Failed to parse Qu.ax response: ${responseText.substring(0, 200)}`);
            throw new Error('Invalid response from upload service');
        }

        console.log('Qu.ax response:', quaxData);

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
            throw new Error('Upload failed - qu.ax returned no file URL. Response: ' + JSON.stringify(quaxData));
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
