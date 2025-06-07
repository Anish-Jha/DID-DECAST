<template>
    <div class="card p-3 mb-3">
        <h3>Manage Keys</h3>
        <div class="mb-3">
            <button class="btn btn-primary" :disabled="isLoading" @click="generateKeyPair">
                Generate Key Pair
                <span v-if="isLoading && action === 'generate'" class="spinner-border spinner-border-sm spinner"></span>
            </button>
            <pre v-if="keyInfo" class="mt-2">{{ keyInfo }}</pre>
        </div>
        <div class="mb-3">
            <h4>Restore Private Key</h4>
            <input v-model="restoreKeyInput" type="text" class="form-control"
                placeholder="Paste your private key (base58)" aria-label="Private key input" />
            <input v-model="password" type="password" class="form-control mt-2"
                placeholder="Enter password for encryption" aria-label="Password input" />
            <button class="btn btn-primary mt-2" :disabled="isLoading || !restoreKeyInput || !password"
                @click="restorePrivateKey">
                Restore Key
                <span v-if="isLoading && action === 'restore'" class="spinner-border spinner-border-sm spinner"></span>
            </button>
        </div>
        <div v-if="selectedDid" class="mb-3">
            <button class="btn btn-warning" :disabled="isLoading" @click="backupPrivateKey">
                Backup Private Key
            </button>
            <button class="btn btn-danger ms-2" :disabled="isLoading" @click="deleteKeyPair">
                Delete Key Pair
                <span v-if="isLoading && action === 'delete'" class="spinner-border spinner-border-sm spinner"></span>
            </button>
        </div>
    </div>
</template>

<script>
import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';

export default {
    props: {
        selectedDid: String,
    },
    data() {
        return {
            keyInfo: '',
            restoreKeyInput: '',
            password: '',
            isLoading: false,
            action: '',
        };
    },
    methods: {
        async generateKeyPair() {
            this.isLoading = true;
            this.action = 'generate';
            try {
                const keyPair = ed.generateKeyPair();
                const publicKey = keyPair.publicKey;
                const secretKey = keyPair.secretKey;
                const did = `did:decast:${bs58.encode(publicKey)}`;

                const password = prompt('Enter a password to encrypt your private key (save this!):');
                if (!password) {
                    this.$emit('response', 'Password is required for key encryption.');
                    this.isLoading = false;
                    return;
                }

                // Encrypt private key
                const encryptedSecretKey = CryptoJS.AES.encrypt(bs58.encode(secretKey), password).toString();

                const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
                stored[did] = {
                    publicKey: bs58.encode(publicKey),
                    secretKey: encryptedSecretKey,
                    createdAt: new Date().toISOString(),
                };
                localStorage.setItem('didKeyPairs', JSON.stringify(stored));

                this.keyInfo = `DID: ${did}\nPublic Key (base58): ${bs58.encode(publicKey)}\nSecret Key: [hidden]`;
                this.$emit('response', 'Key pair generated and stored successfully!');
                this.$emit('key-generated');
            } catch (error) {
                this.$emit('response', `Error generating key pair: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
        async restorePrivateKey() {
            this.isLoading = true;
            this.action = 'restore';
            try {
                const secretKey = bs58.decode(this.restoreKeyInput);
                if (secretKey.length !== 64) {
                    throw new Error('Invalid private key length.');
                }
                const publicKey = ed.extractPublicKeyFromSecretKey(secretKey);
                const did = `did:decast:${bs58.encode(publicKey)}`;

                // Encrypt private key
                const encryptedSecretKey = CryptoJS.AES.encrypt(this.restoreKeyInput, this.password).toString();

                const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
                stored[did] = {
                    publicKey: bs58.encode(publicKey),
                    secretKey: encryptedSecretKey,
                    createdAt: new Date().toISOString(),
                };
                localStorage.setItem('didKeyPairs', JSON.stringify(stored));

                this.keyInfo = `DID: ${did}\nPublic Key (base58): ${bs58.encode(publicKey)}\nSecret Key: [hidden]`;
                this.$emit('response', 'Private key restored successfully!');
                this.$emit('key-generated');
                this.restoreKeyInput = '';
                this.password = '';
            } catch (error) {
                this.$emit('response', `Error restoring private key: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
        backupPrivateKey() {
            if (!this.selectedDid) {
                this.$emit('response', 'Please select a DID first.');
                return;
            }
            const password = prompt('Enter the password used to encrypt this key:');
            if (!password) {
                this.$emit('response', 'Password is required for backup.');
                return;
            }
            const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
            const keyPair = stored[this.selectedDid];
            if (keyPair) {
                try {
                    const decryptedBytes = CryptoJS.AES.decrypt(keyPair.secretKey, password);
                    const decryptedKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
                    if (!decryptedKey) {
                        throw new Error('Incorrect password');
                    }
                    this.$emit('show-backup', `Private Key (base58): ${decryptedKey}\nCopy this key and store it securely!`);
                    this.$emit('response', 'Backup private key requested.');
                } catch (error) {
                    this.$emit('response', `Error decrypting private key: ${error.message}`);
                }
            } else {
                this.$emit('response', 'No key pair found for the selected DID.');
            }
        },
        async deleteKeyPair() {
            if (!this.selectedDid) {
                this.$emit('response', 'Please select a DID first.');
                return;
            }
            if (!confirm(`Are you sure you want to delete DID ${this.selectedDid}? This cannot be undone.`)) {
                return;
            }
            this.isLoading = true;
            this.action = 'delete';
            try {
                const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
                delete stored[this.selectedDid];
                localStorage.setItem('didKeyPairs', JSON.stringify(stored));
                this.$emit('response', `DID ${this.selectedDid} deleted successfully.`);
                this.$emit('key-generated');
                this.keyInfo = '';
            } catch (error) {
                this.$emit('response', `Error deleting key pair: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
    },
};
</script>