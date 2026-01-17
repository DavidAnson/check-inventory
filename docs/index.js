const vendor = {
  productSkuSelector: "div.product-number span",
  productNameSelector: "h1.product-name",
  productColorSelector: "div.color-attribute span.selected-value",
  productInStockSelector: "div.size-attribute li.selectable span.swatchanchor-text",
  productSoldOutSelector: "div.size-attribute li.unselectable span.swatchanchor-text",
};

const checkElement = document.getElementById("check");
const outputElement = document.getElementById("output");
const progressElement = document.getElementById("progress");
const urlElement = document.getElementById("url");

function logMessage(message) {
  outputElement.textContent = message;
}

function setProgress(value) {
  progress.value = value;
}

function onCheckInventory() {
  setProgress(0.5);
  logMessage("Loading...");
  const productUrl = new URL(`https://cors-header-proxy.dlaa.workers.dev/corsproxy/?apiurl=${urlElement.value}`);
  fetch(productUrl).
    then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    }).
    then((responseText) => {
      const result = [ "SKU,Name,Color,Size,Availability" ];
      const domParser = new DOMParser();
      const productDocument = domParser.parseFromString(responseText, "text/html");
      const productSKU = productDocument.querySelector(vendor.productSkuSelector).textContent.trim();
      const productName = productDocument.querySelector(vendor.productNameSelector).textContent.trim();
      const productColor = productDocument.querySelector(vendor.productColorSelector).textContent.trim();
      const queries = [
        [ "in-stock", vendor.productInStockSelector ],
        [ "sold-out", vendor.productSoldOutSelector ]
      ]
      for (const [ availability, selector ] of queries) {
        for (const sizeElement of productDocument.querySelectorAll(selector)) {
          const productSize = sizeElement.textContent.trim();
          result.push(`"${productSKU}","${productName}","${productColor}","${productSize}","${availability}"`);
        }
      }
      return result.join("\n");
    }).
    catch((error) => error.message || error).
    then(logMessage).
    then(() => setProgress(1));
}

urlElement.onkeydown = (event) => {
  if (event.key === "Enter") {
    onCheckInventory();
  }
};
checkElement.onclick = onCheckInventory;
