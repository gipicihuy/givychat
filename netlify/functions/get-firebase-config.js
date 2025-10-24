// File: /netlify/functions/get-firebase-config.js

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    const FIREBASE_CONFIG = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
    };

    if (!FIREBASE_CONFIG.apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Firebase Environment Variables are missing in Netlify Dashboard.' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(FIREBASE_CONFIG),
        headers: { 'Content-Type': 'application/json' }
    };
};
