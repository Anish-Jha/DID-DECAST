<template>
    <div class="card p-3 mb-3">
        <h3>Login with DID</h3>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
            {{ errorMessage }}
            <button class="btn btn-link btn-sm ms-2" @click="errorMessage = ''" aria-label="Clear error message">
                Clear
            </button>
        </div>
        <div class="mb-3">
            <input v-model="password" type="password" class="form-control"
                placeholder="Enter password to decrypt private key" aria-label="Password" @keyup.enter="login" />
        </div>
        <button class="btn btn-primary" :disabled="isLoginDisabled" @click="login" aria-label="Login with DID">
            Login
            <span v-if="isLoading" class="spinner-border spinner-border-sm spinner"></span>
        </button>
        <p v-if="sessionToken" class="text-success mt-2">
            Logged in! Session Token: {{ sessionToken }}
            <span v-if="sessionExpires"> (Expires: {{ new Date(sessionExpires).toLocaleString() }})</span>
        </p>
        <button v-if="sessionToken" class="btn btn-warning mt-2" @click="logout" aria-label="Logout">
            Logout
        </button>
        <button v-if="errorMessage" class="btn btn-secondary mt-2" @click="retryLogin" aria-label="Retry login">
            Retry
        </button>
        <pre v-if="loginResponse" class="mt-2">{{ loginResponse }}</pre>
    </div>
</template>

<script>
import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';
import { mockBackend } from '../mockBackend';

export default {
    props: {
        selectedDid: String,
    },
    data() {
        return {
            password: '',
            loginResponse: '',
            errorMessage: '',
            isLoading: false,
            sessionToken: '',
            sessionExpires: null,
        };
    },
    computed: {
        isLoginDisabled() {
            return !this.selectedDid || this.isLoading || !!this.sessionToken;
        },
    },
    watch: {
        selectedDid(newDid) {
            if (newDid) {
                this.sessionToken = '';
                this.sessionExpires = null;
                this.loginResponse = '';
                this.errorMessage = '';
                this.password = '';
            }
        },
    },
    methods: {
        async login() {
            if (!this.selectedDid) {
                this.errorMessage = 'Please select a DID first.';
                this.$emit('response', this.errorMessage);
                return;
            }
            if (!this.password) {
                this.errorMessage = 'Password is required for login.';
                this.$emit('response', this.errorMessage);
                return;
            }
            this.isLoading = true;
            this.errorMessage = '';
            try {
                const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
                const keyPair = stored[this.selectedDid];
                if (!keyPair) {
                    throw new Error('No key pair found for the selected DID.');
                }

                const decryptedBytes = CryptoJS.AES.decrypt(keyPair.secretKey, this.password);
                const secretKey = bs58.decode(decryptedBytes.toString(CryptoJS.enc.Utf8));
                if (secretKey.length !== 64) {
                    throw new Error('Incorrect password or invalid private key.');
                }

                // Replace with real endpoint: http://localhost:3000/did/challenge/:did
                const challengeRes = await mockBackend.getChallenge(this.selectedDid);
                const { challenge } = challengeRes;

                // Sign challenge
                const challengeBytes = Uint8Array.from(atob(challenge), (c) => c.charCodeAt(0));
                const signature = ed.sign(secretKey, challengeBytes);
                const signatureBase58 = bs58.encode(signature);

                // Send login request
                // Expected response: { status: 'success', token: string, expires?: number }
                const loginRes = await mockBackend.login(this.selectedDid, signatureBase58);
                this.loginResponse = JSON.stringify(loginRes, null, 2);
                this.sessionToken = loginRes.token;
                this.sessionExpires = loginRes.expires || null;
                this.$emit('response', 'Login successful!');
                this.password = '';
            } catch (error) {
                this.errorMessage = `Error logging in: ${error.message}`;
                this.$emit('response', this.errorMessage);
                this.loginResponse = error.message;
            } finally {
                this.isLoading = false;
            }
        },
        logout() {
            this.sessionToken = '';
            this.sessionExpires = null;
            this.loginResponse = '';
            this.errorMessage = '';
            this.password = '';
            this.$emit('response', 'Logged out successfully.');
        },
        retryLogin() {
            this.errorMessage = '';
            this.loginResponse = '';
            this.login();
        },
    },
};
</script>