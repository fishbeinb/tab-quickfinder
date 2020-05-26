var storageDefaults = {
  audible: true,
  priority: ``
};

function save_options() {
  var audible = document.getElementById("audible").checked;
  var priority = document.getElementById("priority").value;

  chrome.storage.sync.set(
    {
      audible: audible,
      priority: priority
    },
    function() {
      var status = document.getElementById("status");
      status.textContent = "Options saved";
      setTimeout(function() {
        status.textContent = "";
      }, 1000);
    }
  );
}
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("save").addEventListener("click", save_options);
  chrome.storage.sync.get(storageDefaults, function(storage) {
    document.getElementById("audible").checked = storage.audible;
    document.getElementById("priority").value = storage.priority;
  });
  document.getElementById("shortcuts").addEventListener("click", function() {
        chrome.tabs.create({
                url: "chrome://extensions/shortcuts" 
            });
        }
  );
});
