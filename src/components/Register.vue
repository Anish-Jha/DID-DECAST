<template>
    <div class="card p-3 mb-3">
        <h3>Register / Onboard DID</h3>

        <button class="btn btn-primary" :disabled="!selectedDid || isLoading || isRegistered" @click="registerDID"
            data-tooltip="Register or login the selected DID with Decast">
            {{ isRegistered ? 'Already Registered' : 'Register DID' }}
            <span v-if="isLoading" class="spinner-border spinner-border-sm spinner"></span>
        </button>

        <p v-if="isRegistered" class="text-success mt-2">
            ✅ This DID is now live on Decast.
        </p>

        <pre v-if="registerResponse" class="mt-2">{{ registerResponse }}</pre>
    </div>
</template>

<script>
import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';
import axios from 'axios';

export default {
    props: {
        selectedDid: {
            type: String,
            required: true
        },
        // Your Decast management token
        accessToken: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            isLoading: false,
            isRegistered: false,
            registerResponse: ''
        };
    },
    watch: {
        selectedDid: {
            immediate: true,
            handler(newDid) {
                this.isRegistered = false;
                this.registerResponse = '';
            }
        }
    },
    methods: {
        async registerDID() {
            if (!this.selectedDid) {
                this.$emit('response', 'Please select a DID first.');
                return;
            }

            // 1) decrypt your private key
            const password = prompt('🔑 Enter password to decrypt your private key:');
            if (!password) {
                this.$emit('response', 'Password is required to sign the nonce.');
                return;
            }

            let secretKeyBytes;
            try {
                const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
                const entry = stored[this.selectedDid];
                if (!entry) throw new Error('No key pair found for this DID.');

                const decrypted = CryptoJS.AES.decrypt(entry.secretKey, password);
                const secretBase58 = decrypted.toString(CryptoJS.enc.Utf8);
                if (!secretBase58) throw new Error('Incorrect password.');

                secretKeyBytes = bs58.decode(secretBase58);
                if (secretKeyBytes.length !== 64) throw new Error('Invalid private key.');
            } catch (err) {
                this.$emit('response', `Error decrypting key: ${err.message}`);
                return;
            }

            this.isLoading = true;
            try {
                // 2) build your DID Document
                const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
                const entry = stored[this.selectedDid];
                const didDocument = {
                    '@context': 'https://www.w3.org/ns/did/v1',
                    id: this.selectedDid,
                    verificationMethod: [
                        {
                            id: `${this.selectedDid}#keys-1`,
                            type: 'Ed25519VerificationKey2018',
                            controller: this.selectedDid,
                            publicKeyBase58: entry.publicKey
                        }
                    ],
                    authentication: [`${this.selectedDid}#keys-1`]
                };

                // 3) fetch nonce (token)
                const { data: nonceRes } = await axios.post(
                    'https://did.decast.live/api/v1/auth/did/nonce',
                    { did: this.selectedDid },
                    {
                        headers: {
                            Authorization: `Bearer ${this.accessToken}`
                        }
                    }
                );
                const { token, nonce } = nonceRes;
                const nonceBytes = new TextEncoder().encode(nonce);
                const sigBytes = ed.sign(secretKeyBytes, nonceBytes);
                const signature = bs58.encode(sigBytes);

                // 5) call login (will register on first‐time if you include didDocument)
                const loginPayload = {
                    token,
                    signature,
                    didDocument
                };
                const { data: loginRes } = await axios.post(
                    'https://did.decast.live/api/v1/auth/did/login',
                    loginPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${this.accessToken}`
                        }
                    }
                );

                this.registerResponse = JSON.stringify(loginRes, null, 2);
                this.isRegistered = true;
                this.$emit('response', 'DID onboarded & authenticated successfully!');
            } catch (err) {
                const msg = err.response?.data?.message || err.message;
                this.$emit('response', `Error during registration: ${msg}`);
                this.registerResponse = msg;
            } finally {
                this.isLoading = false;
            }
        }
    }
};
</script>
