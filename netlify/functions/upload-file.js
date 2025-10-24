import fetch from 'node-fetch';
import FormData from 'form-data';

// Konfigurasi untuk menaikkan batas ukuran body parser jika diperlukan (misalnya di Next.js)
/*
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', 
    },
  },
};
*/

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { file } = req.body;
        
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Ekstrak tipe file dan data Base64
        const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid file format or missing Base64 data' });
        }

        const contentType = matches[1];
        const fileBuffer = Buffer.from(matches[2], 'base64');
        
        // Buat nama file unik
        const fileExtension = contentType.split('/')[1] || 'bin';
        const fileName = `anon_upload_${Date.now()}.${fileExtension}`;

        const formData = new FormData();
        // Menggunakan 'files[]' sesuai permintaan API qu.ax
        formData.append('files[]', fileBuffer, {
            filename: fileName,
            contentType: contentType
        });

        const response = await fetch('https://qu.ax/upload.php', {
            method: 'POST',
            body: formData,
            // Headers harus mencakup headers yang dihasilkan oleh FormData untuk boundary
            headers: {
                ...formData.getHeaders()
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();

        if (data.success && data.files && data.files.length > 0) {
            res.status(200).json({
                success: true,
                url: data.files[0].url // URL file yang diunggah dari qu.ax
            });
        } else {
            throw new Error('Upload failed - qu.ax returned no file URL');
        }

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Upload failed', 
            details: error.message 
        });
    }
}
