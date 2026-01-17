function onCheck() {
  const url = document.getElementById("url");
  const productUrl = new URL(`https://cors-header-proxy.dlaa.workers.dev/corsproxy/?apiurl=${url.value}`);
  fetch(productUrl).
    then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    }).
    then((responseText) => {
      const result = [ "SKU,Name,Color,Size,Availability"];
      const domParser = new DOMParser();
      const productDocument = domParser.parseFromString(responseText, "text/html");
      const productSKU = productDocument.querySelector("div.product-number span").textContent.trim();
      const productName = productDocument.querySelector("h1.product-name").textContent.trim();
      const productColor = productDocument.querySelector("div.color-attribute span.selected-value").textContent.trim();
      const queries = [
        [ "in-stock", "div.size-attribute li.selectable span.swatchanchor-text" ],
        [ "sold-out", "div.size-attribute li.unselectable span.swatchanchor-text" ]
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
    then((result) => document.getElementById("output").textContent = result)
}

document.getElementById("check").onclick = onCheck;
