import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIRESTORE_PROJECT_ID,
                clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
                privateKey: process.env.FIRESTORE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        process.exit(1);
    }
}

const db = admin.firestore();

async function testConnection() {
    try {
        console.log('Attempting to connect to Firestore...');
        const testDoc = db.collection('test_connection').doc('ping');
        await testDoc.set({
            timestamp: new Date(),
            message: 'Hello from Firebase Admin SDK!',
        });
        console.log('Successfully wrote to Firestore!');

        const doc = await testDoc.get();
        console.log('Read back from Firestore:', doc.data());

        // Clean up
        await testDoc.delete();
        console.log('Test document deleted.');
        process.exit(0);
    } catch (error) {
        console.error('Error connecting to Firestore:', error);
        process.exit(1);
    }
}

testConnection();
