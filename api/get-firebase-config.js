// Struktur endpoint serverless untuk Next.js/Vercel
export default function handler(req, res) {
    if (req.method !== 'GET') {
        // Hanya izinkan metode GET
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Ambil variabel dari Environment Variables (disuntikkan ke server runtime)
    const FIREBASE_CONFIG = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
    };

    // Kirim konfigurasi client-side ke frontend
    res.status(200).json(FIREBASE_CONFIG);
}
