const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backfillUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const update = {};
    if (!Array.isArray(data.friends)) {
      update.friends = [];
    }
    if (!Array.isArray(data.friendRequests)) {
      update.friendRequests = [];
    }
    if (Object.keys(update).length > 0) {
      await doc.ref.update(update);
      updated++;
      console.log(`Updated user: ${doc.id}`);
    }
  }
  console.log(`Backfill complete. Updated ${updated} user(s).`);
}

backfillUsers().catch(console.error);