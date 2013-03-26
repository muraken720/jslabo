self.addEventListener("message", onMessage, false);

function onMessage(e) {
  var data = e.data;
  self.postMessage("Hello, " + data + " !");
}
