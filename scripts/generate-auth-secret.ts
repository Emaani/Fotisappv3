import crypto from 'crypto';

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('\n🔐 Generated NEXTAUTH_SECRET:', generateSecret()); 