class TabManager {
  constructor() {
    this.sessionDomains = [];
    this.lastDomainIndex = null;
    this.domainIndex = null;
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
      current = {
        id: null,
        url: null,
      };
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

  stopTraker() {
    // Set current tab as a not trackable
    this.last = this.current;
    this.current = {
      id: null,
      url: null,
    };

    // Stop tracker
    this.handeDomainChange();
  }

  startTraker() {
    // Get the current tab and start tracker
    this.updatedTab(true);
  }

  async handeDomainChange() {
    this.lastDomainIndex = this.domainIndex;
    this.domainIndex = tracking_time.domains.findIndex((value) => value.url == this.current.url);

    // This url is not a valid site
    if (this.current.url == null) {
      let session_tab = this.sessionDomains[this.lastDomainIndex];

      // Last url is a valid site, and we have in the array
      if (this.last.url != null && session_tab != null) {
        session_tab.ellapsedTime += Date.now() - session_tab.startTime;
        session_tab.startTime = null;
      }

      return;
    }

    // Domain yet not added
    if (this.domainIndex == -1) {
      tracking_time.domains.push({
        url: this.current.url,
        time: 0,
      });
      this.domainIndex = tracking_time.domains.length - 1;

      // Last url is a valid site
      if (this.last.url != null) {
        let session_tab = this.sessionDomains[this.lastDomainIndex];
        session_tab.ellapsedTime += Date.now() - session_tab.startTime;
        session_tab.startTime = null;
      }

      this.sessionDomains[this.domainIndex] = {
        url: this.current.url,
        startTime: Date.now(),
        ellapsedTime: 0,
      };
    } else if (this.lastDomainIndex != this.domainIndex) {
      // Domain is added, but changed tab with different domains
      // Last url is a valid site
      if (this.last.url != null) {
        let session_tab = this.sessionDomains[this.lastDomainIndex];
        session_tab.ellapsedTime += Date.now() - session_tab.startTime;
        session_tab.startTime = null;
      }

      this.sessionDomains[this.domainIndex].startTime = Date.now();
    }
  }

  async updateTodaysData() {
    tracking_time = await Storage.set(today.isoDate, tracking_time);
  }

  error(error) {
    console.error(error);
    console.trace();
    return false;
  }
}
