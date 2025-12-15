class Storage {
  static async get(key) {
    try {
      let result = await browser.storage.local.get(key);
      return result[key];
    } catch (e) {
      return this.error(e);
    }
  }

  static async set(key, value) {
    try {
      await browser.storage.local.set({ [key]: value });
      return value;
    } catch (e) {
      return this.error(e);
    }
  }

  static async delete(key) {
    try {
      await browser.storage.local.remove(key);
      return true;
    } catch (e) {
      return this.error(e);
    }
  }

  static async getOrAdd(key, value) {
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

  static async deleteAll() {
    try {
      await this.delete("configurations");
      await this.delete(today.isoDate);
      await this.delete("tracked_time_history");
      return true;
    } catch (e) {
      return this.error(e);
    }
  }

  static error(error) {
    console.error(error);
    console.trace();
    return false;
  }
}
