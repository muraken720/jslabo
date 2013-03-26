self.addEventListener("message", onMessage, false);

function onMessage(e) {
  var result = doHeavyDuty();
  self.postMessage(result);
}

function doHeavyDuty() {
  var result = "";
  for (var i = 0; i <= 10 * 1000 * 1000; i++) {
    result += i;
  }

  return result.length;
}
