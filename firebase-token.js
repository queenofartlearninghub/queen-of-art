// Verifies the Netlify Identity login and returns a Firebase custom token.
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  // Netlify fills this in only when a valid Identity token is sent
  const user = context.clientContext && context.clientContext.user;
  if (!user || !user.email) return { statusCode: 401, body: 'Not logged in' };

  const email = user.email.toLowerCase();
  const roles = (user.app_metadata && user.app_metadata.roles) || [];
  const isAdmin = ADMIN_EMAILS.includes(email) || roles.includes('admin');

  try {
    const token = await admin.auth().createCustomToken(email, { email, admin: isAdmin });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    };
  } catch (e) {
    return { statusCode: 500, body: 'Could not create token' };
  }
};
