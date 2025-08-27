class Storage {
  constructor() {}
  async get(key) {
    try {
      let result = await browser.storage.local.get(key);
      return result[key];
    } catch (e) {
      return this.error(e);
    }
  }

  async set(key, value) {
    try {
      await browser.storage.local.set({ [key]: value });
      return value;
    } catch (e) {
      return this.error(e);
    }
  }

  async delete(key) {
    try {
      await browser.storage.local.remove(key);
      return true;
    } catch (e) {
      return this.error(e);
    }
  }

  async getOrAdd(key, value) {
    try {
      let storage_item = await this.get(key);

      // Have in storage
      if (storage_item != undefined) {
        return storage_item;
      }

      // Don't have in storage
      storage_item = await this.set(key, value);
      return value;
    } catch (e) {
      return this.error(e);
    }
  }

  error(error) {
    console.error(error);
    console.trace();
    return false;
  }
}
