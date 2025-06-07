<template>
    <div class="card p-3 mb-3">
        <h3>Register DID</h3>
        <button class="btn btn-primary" :disabled="!selectedDid || isLoading || isRegistered" @click="registerDID"
            data-tooltip="Register the selected DID with the Decast platform">
            Register DID
            <span v-if="isLoading" class="spinner-border spinner-border-sm spinner"></span>
        </button>
        <p v-if="isRegistered" class="text-success mt-2">
            This DID is already registered.
        </p>
        <pre v-if="registerResponse" class="mt-2">{{ registerResponse }}</pre>
    </div>
</template>

<script>
import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';
import axios from 'axios';
import { mockBackend } from '../mockBackend';

export default {
    props: {
        selectedDid: String,
    },
    data() {
        return {
            registerResponse: '',
            isLoading: false,
            isRegistered: false,
        };
    },
    watch: {
        selectedDid: {
            immediate: true,
            handler(newDid) {
                if (newDid) {
                    this.checkRegistrationStatus();
                } else {
                    this.isRegistered = false;
                    this.registerResponse = '';
                }
            },
        },
    },
    methods: {
        async checkRegistrationStatus() {
            this.isLoading = true;
            try {
                // Replace with real endpoint: http://localhost:3000/api/v1/dids/:did/status
                const res = await mockBackend.getDidStatus(this.selectedDid);
                this.isRegistered = res.isRegistered;
            } catch (error) {
                this.$emit('response', `Error checking DID status: ${error.message}`);
            } finally {
                this.isLoading = false;
            }
        },
        async registerDID() {
            if (!this.selectedDid) {
                this.$emit('response', 'Please select a DID first.');
                return;
            }
            this.isLoading = true;
            try {
                const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
                const keyPair = stored[this.selectedDid];
                if (!keyPair) {
                    this.$emit('response', 'No key pair found for the selected DID.');
                    return;
                }

                const publicKey = bs58.decode(keyPair.publicKey);
                const didDocument = {
                    '@context': 'https://www.w3.org/ns/did/v1',
                    id: this.selectedDid,
                    verificationMethod: [
                        {
                            id: `${this.selectedDid}#keys-1`,
                            type: 'Ed25519VerificationKey2018',
                            controller: this.selectedDid,
                            publicKeyBase58: keyPair.publicKey,
                        },
                    ],
                    authentication: [`${this.selectedDid}#keys-1`],
                };

                // Replace with real endpoint: http://localhost:3000/api/v1/dids/register
                const res = await mockBackend.registerDid(this.selectedDid, didDocument);
                this.registerResponse = JSON.stringify(res, null, 2);
                this.isRegistered = true;
                this.$emit('response', 'DID registered successfully!');
                this.$emit('registered', true); 
            } catch (error) {
                this.$emit('response', `Error registering DID: ${error.message}`);
                this.registerResponse = error.message;
            } finally {
                this.isLoading = false;
            }
        },
    },
};
</script>