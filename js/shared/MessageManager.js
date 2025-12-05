class MessageManager {
  constructor() {}

  static async send(params = {}) {
    return await browser.runtime.sendMessage(params).then(this.handleResponse, this.handleError);
  }

  listen() {
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessageReceived(request, sender).then(sendResponse);
      return true;
    });
  }

  handleMessageReceived() {
    console.log("No handleMessageReceived defined, define one to do what you want with the data");
  }

  handleResponse(message) {
    if (!message || !message.isOk) {
      console.error("Message is not ok", message);
      return false;
    }
    return message;
  }

  handleError(error) {
    console.log(`Error: ${error}`);
  }
}
