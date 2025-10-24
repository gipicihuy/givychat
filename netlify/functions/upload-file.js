// Anda harus mengubah header file ini menjadi:
// const fetch = require('node-fetch');
// const FormData = require('form-data');
// Netlify Functions lebih suka CommonJS (require) daripada ES Modules (import)

const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // Data POST ada di event.body
        const body = JSON.parse(event.body);
        const { file } = body;
        
        // ... (Sisa logika Anda tetap sama) ...
        
        if (!file) {
             return { statusCode: 400, body: JSON.stringify({ error: 'No file provided' }) };
        }
        
        // ... (Logika fileToBase64, FormData, dan fetch ke Qu.ax tetap sama) ...
        
        // Ganti bagian return success di akhir:
        if (data.success && data.files && data.files.length > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    url: data.files[0].url
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
