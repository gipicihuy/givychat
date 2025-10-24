// Anda harus mengubah header file ini menjadi:
const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // --- PERHATIKAN BAGIAN INI: Parsing event.body ---
        let body;
        if (event.body) {
            // Netlify Functions sering mengirimkan body sebagai string Base64 jika data asalnya binary.
            // Namun, karena frontend Anda mengirim JSON (file: base64string), kita asumsikan event.body adalah JSON string.
            // Coba parsing JSON dari body
            body = JSON.parse(event.body);
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'No request body received' }) };
        }
        // --- AKHIR BAGIAN KRUSIAL ---
        
        const { file } = body; // Ambil properti 'file' dari body yang sudah di-parse

        if (!file) {
             return { statusCode: 400, body: JSON.stringify({ error: 'No file provided in the request body' }) };
        }
        
        // Ekstrak tipe file dan data Base64
        const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid file format or missing Base64 data' }) };
        }
        
        const contentType = matches[1];
        const fileBuffer = Buffer.from(matches[2], 'base64');
        
        // Buat nama file unik, dsb...
        const fileExtension = contentType.split('/')[1] || 'bin';
        const fileName = `anon_upload_${Date.now()}.${fileExtension}`;

        const formData = new FormData();
        formData.append('files[]', fileBuffer, {
            filename: fileName,
            contentType: contentType
        });

        // Pengaturan headers untuk FormData agar boundary terkirim
        const response = await fetch('https://qu.ax/upload.php', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });
        
        // ... (Sisa logika penanganan response Qu.ax) ...

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed at Qu.ax: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const quaxData = await response.json(); // Gunakan nama variabel berbeda untuk menghindari konflik

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
