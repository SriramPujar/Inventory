import * as admin from 'firebase-admin';

function formatPrivateKey(key: string | undefined) {
    if (!key) return undefined;

    // Check if it's a Base64 string (no spaces, valid chars) and doesn't look like a PEM key
    if (!key.includes('-----BEGIN PRIVATE KEY-----') && /^[A-Za-z0-9+/=]+$/.test(key.replace(/\s/g, ''))) {
        try {
            return Buffer.from(key, 'base64').toString('utf8');
        } catch (e) {
            console.error('Failed to decode Base64 key', e);
        }
    }

    // Remove surrounding quotes if present
    if (key.startsWith('"') && key.endsWith('"')) {
        key = key.slice(1, -1);
    }

    // Handle literal \n characters
    return key.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    const rawProjectId = process.env.FIRESTORE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const rawClientEmail = process.env.FIRESTORE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;

    // Strip quotes if present
    const projectId = rawProjectId?.replace(/^["']|["']$/g, '');
    const clientEmail = rawClientEmail?.replace(/^["']|["']$/g, '');

    const rawPrivateKey = process.env.FIRESTORE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = formatPrivateKey(rawPrivateKey);

    console.log('Firebase Admin Init Debug:', {
        projectId,
        clientEmail,
        privateKeyLength: privateKey?.length,
        hasPrivateKey: !!privateKey,
        rawKeyStart: rawPrivateKey ? rawPrivateKey.substring(0, 10) : 'N/A'
    });

    if (!projectId || !clientEmail || !privateKey) {
        console.error('Firebase Admin Init Error: Missing environment variables', {
            projectId: !!projectId,
            clientEmail: !!clientEmail,
            privateKey: !!privateKey
        });
    } else {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('Firebase Admin Initialized successfully');
        } catch (error: any) {
            console.error('Firebase Admin Initialization Error:', error);
        }
    }
}

export const firestore = admin.firestore();
export const auth = admin.auth();
