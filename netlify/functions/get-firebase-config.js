// Ganti kode Anda yang ada dengan ini untuk kompatibilitas Netlify Functions:
// File: /netlify/functions/get-firebase-config.js

// Import diperlukan jika Anda menggunakan module ES6 (Netlify biasanya mendukungnya)
// Pastikan tidak ada 'import' di sini, gunakan CommonJS (require) jika ada masalah.

exports.handler = async (event, context) => {
    // Netlify Functions menggunakan 'event' untuk data, bukan 'req'

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // Ambil variabel dari Environment Variables
    const FIREBASE_CONFIG = {
        // PERHATIKAN: Jika salah satu nilai ini undefined, JSON.stringify akan bermasalah.
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
    };

    // Pastikan semua variabel sudah diisi. Jika tidak, kembalikan error yang jelas.
    if (!FIREBASE_CONFIG.apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Firebase Environment Variables are missing in Netlify Dashboard.' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // Mengirim respons JSON yang benar
    return {
        statusCode: 200,
        body: JSON.stringify(FIREBASE_CONFIG),
        headers: { 'Content-Type': 'application/json' }
    };
};
