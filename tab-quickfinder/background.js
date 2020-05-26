chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "quick_mute_tab":
      chrome.tabs.getSelected(null, (tab) => {
        chrome.tabs.update(tab.id, {muted: !tab.mutedInfo.muted});
      });
      break;

    case "quick_pin_tab":
      chrome.tabs.getSelected(null, (tab) => {
        chrome.tabs.update(tab.id, {pinned: !tab.pinned});
      });
      break;

    default:
      break;
  }
});
