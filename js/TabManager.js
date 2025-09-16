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
    browser.tabs.onActivated.addListener(() => {
      this.updatedTab(true);
    });

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
      // Fully loaded the page
      if (tabInfo.status == "complete") {
        this.updatedTab(true);
      }
    });
  }

  async getCurrent() {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        let cur_tab = tabs[0];
        let cur_url = new URL(cur_tab.url);

        // Not a site
        if (/http/.test(cur_url.protocol) == false) {
          cur_url.host = "";
        }

        return {
          id: cur_tab.id,
          url: cur_url.host,
        };
      }
      return null;
    } catch (error) {
      console.error(`Error retrieving current tab: ${error}`);
      return this.error();
    }
  }

  async updatedTab(update_domain) {
    let current = await this.getCurrent();

    if (current.url == "") {
      this.current = {
        id: null,
        url: null,
      };
      this.last = {
        id: null,
        url: null,
      };
      return;
    }

    this.last = this.current;
    this.current = {
      id: current.id,
      url: current.url,
    };

    if (update_domain) {
      await this.handeDomainChange();
    }
  }

  async handeDomainChange() {
    if (this.current.url == null) return;

    this.domainIndex = tracking_time.domains.findIndex((value) => value.url == this.current.url);

    // Domain yet not added
    if (this.domainIndex == -1) {
      console.warn("Adding domain", this.current.url);
      tracking_time.domains.push({
        url: this.current.url,
        time: 0,
      });
      this.domainIndex = tracking_time.domains.length - 1;

      await this.updateTodaysData();
    }
  }

  async updateTodaysData() {
    tracking_time = await storage.set(today.isoDate, tracking_time);
  }

  error(error) {
    console.error(error);
    console.trace();
    return false;
  }
}
