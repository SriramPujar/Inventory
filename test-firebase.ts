import { db } from './lib/db';

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
