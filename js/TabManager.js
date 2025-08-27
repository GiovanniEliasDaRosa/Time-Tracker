class TabManager {
  constructor() {
    this.domainIndex = 0;
    this.current = {
      id: null,
      url: null,
    };
    this.last = {
      id: null,
      url: null,
    };

    // On change tabs update tab_control:
    browser.tabs.onActivated.addListener(this.updatedTab);
  }

  async getCurrent() {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) return tabs[0];
      return null;
    } catch (error) {
      console.error(`Error retrieving current tab: ${error}`);
      return this.error();
    }
  }

  async updatedTab(update = true) {
    let current = await this.getCurrent();

    this.last = this.current;
    this.current = {
      id: current.id,
      url: current.url,
    };

    if (update) {
      await this.handeDomainChange();
    }
  }

  async handeDomainChange() {
    this.domainIndex = tracking_time.domains.findIndex((value) => value.url == this.current.url);

    // Domain yet not added
    if (this.domainIndex == -1) {
      console.warn("Adding domain");
      tracking_time.domains.push({
        url: this.current.url,
        time: 0,
      });
      this.domainIndex = tracking_time.domains.length - 1;

      await this.updateTodaysData();
    }
  }

  async updateTodaysData() {
    tracking_time = await storage.set(today.date, tracking_time);
  }

  error(error) {
    console.error(error);
    console.trace();
    return false;
  }
}
