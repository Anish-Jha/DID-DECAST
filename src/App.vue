<template>
  <div id="app" class="bg-black text-white p-4 w-full h-auto m-0">
    <h1 class="mb-4 flex items-center gap-6 justify-start"><img style="width: 54px; height: 54px;" src="./assets/logot.svg" alt=""> DID:Decast</h1>
    <!-- Onboarding Modal -->
    <div v-if="state.showOnboarding" class="modal fade show" style="display: block;" @click.self="closeOnboarding"
      role="dialog" aria-labelledby="onboarding-title" tabindex="-1" @keydown.esc="closeOnboarding">
      <div class="modal-dialog modal-content">
        <div class="modal-header flex items-center gap-4">
          <img style="width: 36px; height: 36px;" src="./assets/logot.svg" alt="">
          <h3 id="onboarding-title" class="modal-title">Welcome to DID:Decast</h3>
        </div>
        <div class="modal-body">
          <p>
            To get started, go to the <strong>Manage Keys</strong> tab and generate a new key pair or restore an
            existing private key.
          </p>
          <div class="form-check mb-3">
            <input type="checkbox" class="form-check-input" v-model="state.dontShowOnboarding" id="dont-show-again"
              @change="persistDontShowOnboarding">
            <label class="form-check-label" for="dont-show-again">Don't show again</label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeOnboarding" aria-label="Get started">
            Get Started
          </button>
        </div>
      </div>
    </div>
    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item">
        <button class="nav-link text-white bg-black border-white" :class="{ active: state.activeTab === 'keys' }" @click="setActiveTab('keys')"
          role="tab" aria-selected="state.activeTab === 'keys'" data-tooltip="Generate or manage your DID key pairs">
          Manage Keys
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link text-white bg-black border-white"
          :class="{ active: state.activeTab === 'register', disabled: state.storedDids.length === 0 }"
          :disabled="state.storedDids.length === 0" @click="setActiveTab('register')" role="tab"
          aria-selected="state.activeTab === 'register'" data-tooltip="Register a DID with the Decast platform">
          Register
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link text-white bg-black border-white"
          :class="{ active: state.activeTab === 'login', disabled: state.storedDids.length === 0 }"
          :disabled="state.storedDids.length === 0" @click="setActiveTab('login')" role="tab"
          aria-selected="state.activeTab === 'login'" data-tooltip="Log in using a DID">
          Login
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link text-white bg-black border-white" :class="{ active: state.activeTab === 'responses' }" @click="setActiveTab('responses')"
          role="tab" aria-selected="state.activeTab === 'responses'"
          data-tooltip="View history of actions and responses">
          Responses
          <span v-if="state.responses.length" class="badge badge-responses bg-primary">
            {{ state.responses.length }}
          </span>
        </button>
      </li>
    </ul>
    <!-- Tab Content -->
    <div v-if="state.activeTab === 'keys'" class="tab-content">
      <KeyManager :selected-did="state.selectedDid" @key-generated="handleKeyGenerated" @response="addResponse"
        @show-backup="showBackupModal" />
      <DidSelector v-if="state.storedDids.length > 0" :dids="state.storedDids" @did-selected="handleDidSelected" />
    </div>
    <div v-if="state.activeTab === 'register'" class="tab-content">
      <DidSelector :dids="state.storedDids" @did-selected="handleDidSelected" />
      <Register :selected-did="state.selectedDid" @response="addResponse" @registered="handleRegistered" />
    </div>
    <div v-if="state.activeTab === 'login'" class="tab-content">
      <DidSelector :dids="state.storedDids" @did-selected="handleDidSelected" />
      <Login :selected-did="state.selectedDid" @response="addResponse" />
    </div>
    <div v-if="state.activeTab === 'responses'" class="tab-content">
      <ResponseDisplay :responses="state.responses" @clear-responses="state.responses = []" />
    </div>
    <!-- Backup Modal -->
    <div v-if="state.showBackupModal" class="modal fade show" style="display: block;"
      @click.self="state.showBackupModal = false" role="dialog" aria-labelledby="backup-title" tabindex="-1"
      @keydown.esc="state.showBackupModal = false">
      <div class="modal-dialog modal-content">
        <div class="modal-header">
          <h3 id="backup-title" class="modal-title">Backup Private Key</h3>
        </div>
        <div class="modal-body">
          <p>Download or copy the private key below and store it securely. Do not share it!</p>
          <pre>{{ state.backupKey }}</pre>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="downloadBackup" aria-label="Download private key">
            Download Key
          </button>
          <button class="btn btn-secondary" @click="state.showBackupModal = false" aria-label="Close backup modal">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue';
import KeyManager from './components/KeyManager.vue';
import DidSelector from './components/DidSelector.vue';
import Register from './components/Register.vue';
import Login from './components/Login.vue';
import ResponseDisplay from './components/ResponseDisplay.vue';
import { toast } from 'vue3-toastify';

export default {
  components: { KeyManager, DidSelector, Register, Login, ResponseDisplay },
  setup() {
    const state = reactive({
      storedDids: [],
      selectedDid: '',
      responses: [],
      showBackupModal: false,
      backupKey: '',
      showOnboarding: false,
      dontShowOnboarding: false,
      activeTab: 'keys',
    });

    // Load DIDs from localStorage
    const loadStoredDids = () => {
      const stored = localStorage.getItem('didKeyPairs');
      state.storedDids = stored ? Object.keys(JSON.parse(stored)) : [];
      if (!state.storedDids.includes(state.selectedDid)) {
        state.selectedDid = state.storedDids.length > 0 ? state.storedDids[0] : '';
      }
      // Update onboarding visibility
      state.showOnboarding = state.storedDids.length === 0 && !state.dontShowOnboarding;
    };

    // Load persisted settings
    const loadSettings = () => {
      const dontShow = localStorage.getItem('dontShowOnboarding');
      state.dontShowOnboarding = dontShow ? JSON.parse(dontShow) : false;
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab && (state.storedDids.length > 0 || savedTab === 'keys' || savedTab === 'responses')) {
        state.activeTab = savedTab;
      }
    };

    // Persist "Don't show again" setting
    const persistDontShowOnboarding = () => {
      localStorage.setItem('dontShowOnboarding', JSON.stringify(state.dontShowOnboarding));
    };

    // Close onboarding modal
    const closeOnboarding = () => {
      state.showOnboarding = false;
      persistDontShowOnboarding();
      toast.info('Welcome! You are now in the Manage Keys tab.');
    };

    const handleKeyGenerated = () => {
      loadStoredDids();
      if (state.storedDids.length > 0) {
        toast.success('Key pair created or restored!');
        if (state.activeTab === 'keys') {
          state.activeTab = 'register';
          localStorage.setItem('activeTab', 'register');
          toast.info('Switched to Register tab to register your new DID.');
        }
      }
    };

    // Handle DID selection
    const handleDidSelected = (did) => {
      state.selectedDid = did;
      toast.info(`Selected DID: ${did}`);
    };

    // Handle successful registration
    const handleRegistered = (isRegistered) => {
      if (isRegistered && state.activeTab === 'register') {
        state.activeTab = 'login';
        localStorage.setItem('activeTab', 'login');
        toast.info('DID registered! Switched to Login tab.');
      }
    };

    const addResponse = (response) => {
      state.responses.unshift({
        message: response,
        timestamp: new Date().toLocaleString(),
        type: response.includes('Error') ? 'error' : 'success',
      });
      if (state.responses.length > 10) {
        state.responses.pop();
      }
      toast[response.includes('Error') ? 'error' : 'success'](response);
    };

    const showBackupModal = (key) => {
      state.backupKey = key;
      state.showBackupModal = true;
    };

    const downloadBackup = () => {
      const blob = new Blob([state.backupKey], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `did-private-key-${state.selectedDid}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      state.showBackupModal = false;
      addResponse('Private key downloaded successfully!');
    };

    const setActiveTab = (tab) => {
      state.activeTab = tab;
      localStorage.setItem('activeTab', tab);
      toast.info(`Switched to ${tab.charAt(0).toUpperCase() + tab.slice(1)} tab.`);
    };

    // Initialize
    loadSettings();
    loadStoredDids();

    return {
      state,
      closeOnboarding,
      handleKeyGenerated,
      handleDidSelected,
      addResponse,
      showBackupModal,
      downloadBackup,
      setActiveTab,
    };
  },
};
</script>