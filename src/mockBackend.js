let registeredDids = {};
let challenges = {};
let sessions = {};

export const mockBackend = {
  async registerDid(did, didDocument) {
    if (registeredDids[did]) {
      throw new Error('DID already registered');
    }
    registeredDids[did] = didDocument;
    return { status: 'success', message: `DID ${did} registered`, didDocument };
  },
  async getDidStatus(did) {
    return { isRegistered: !!registeredDids[did] };
  },
  async getChallenge(did) {
    const challenge = btoa(Math.random().toString(36).substring(2));
    challenges[did] = challenge;
    return { challenge };
  },
  async login(did, signature) {
    if (!registeredDids[did]) {
      throw new Error('DID not registered');
    }
    if (!challenges[did]) {
      throw new Error('No challenge issued');
    }
    const isValid = signature.length > 0; // Dummy check
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    const token = `session-${did}-${Date.now()}`;
    sessions[token] = { did, expires: Date.now() + 3600000 }; // 1 hour expiry
    delete challenges[did];
    return { status: 'success', token, expires: sessions[token].expires };
  },
  async getSessionStatus(token) {
    const session = sessions[token];
    if (!session) {
      return { isValid: false };
    }
    return { isValid: Date.now() < session.expires, expires: session.expires };
  },
};