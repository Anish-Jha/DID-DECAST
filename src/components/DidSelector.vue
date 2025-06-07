<template>
  <div class="card p-3 mb-3">
    <h3>Select DID</h3>
    <input v-model="searchQuery" type="text" class="form-control mb-2" placeholder="Search DIDs..."
      aria-label="DID search" />
    <select v-model="localSelectedDid" class="form-select" :disabled="filteredDids.length === 0"
      @change="emitSelectedDid" aria-label="DID selector">
      <option value="">Select a DID</option>
      <option v-for="did in filteredDids" :key="did.did" :value="did.did">
        {{ did.did }} (Created: {{ new Date(did.createdAt).toLocaleDateString() }})
      </option>
    </select>
  </div>
</template>

<script>
export default {
  props: {
    dids: Array,
  },
  data() {
    return {
      localSelectedDid: '',
      searchQuery: '',
    };
  },
  computed: {
    filteredDids() {
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      return this.dids
        .map((did) => ({
          did,
          createdAt: stored[did]?.createdAt || new Date().toISOString(),
        }))
        .filter((did) => did.did.toLowerCase().includes(this.searchQuery.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  },
  methods: {
    emitSelectedDid() {
      this.$emit('did-selected', this.localSelectedDid);
    },
  },
};
</script>