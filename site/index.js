function onCheck() {
  const productUrl = new URL("TODO.htm", document.location);
  fetch(productUrl).
    then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    }).
    catch((error) => error.message || error).
    then((result) => document.getElementById("output").textContent = result)
}

document.getElementById("check").onclick = onCheck;
