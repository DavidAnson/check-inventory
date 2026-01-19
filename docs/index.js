const vendor = {
  productSkuSelector: "div.product-number span",
  productNameSelector: "h1.product-name",
  productColorSelector: "div.color-attribute span.selected-value",
  productVariantSelector: "div.color-attribute li.variation-value:not(.selected, .unselectable) span.swatchanchor",
  productInStockSelector: "div.size-attribute li.selectable span.swatchanchor-text",
  productSoldOutSelector: "div.size-attribute li.unselectable span.swatchanchor-text",
  categoryProductSelector: "div.search-result-content a.name-link",
};

const checkElement = document.getElementById("check");
const outputElement = document.getElementById("output");
const progressElement = document.getElementById("progress");
const urlElement = document.getElementById("url");
const domParser = new DOMParser();

function setOutput(message) {
  console.log(message);
  outputElement.textContent = message;
}

function setProgress(value) {
  progress.value = value;
}

function checkProductPage(productUrls, index, resultLines) {
  const { productUrl, isVariant } = productUrls[index];
  setOutput(`${productUrl}...`);
  const proxiedProductUrl = new URL("https://cors-header-proxy.dlaa.workers.dev/corsproxy/");
  proxiedProductUrl.searchParams.append("apiurl", productUrl);
  return fetch(proxiedProductUrl).
    then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    }).
    then((responseText) => {
      const productDocument = domParser.parseFromString(responseText, "text/html");
      const categoryProducts = productDocument.querySelectorAll(vendor.categoryProductSelector);
      if (categoryProducts.length > 0) {
        for (const categoryProduct of categoryProducts) {
          productUrls.push({ "productUrl": new URL(categoryProduct.dataset.href, productUrl), "isVariant": false });
        }
      } else {
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
            resultLines.push(`"${productSKU}","${productName}","${productColor}","${productSize}","${availability}"`);
          }
        }
        if (!isVariant) {
          for (const productVariant of productDocument.querySelectorAll(vendor.productVariantSelector)) {
            productUrls.push({ "productUrl": new URL(productVariant.dataset.swatchProductUrl, productUrl), "isVariant": true });
          }
        }
      }
    });
}

async function onCheckInventory() {
  setOutput("Loading...");
  const productUrls = [];
  productUrls.push({ "productUrl": new URL(urlElement.value), "isVariant": false });
  const resultLines = [ "SKU,Name,Color,Size,Availability" ];
  let output = "";
  try {
    for (let index = 0; index < productUrls.length; index++) {
      setProgress((index + 0.5) / productUrls.length);
      await checkProductPage(productUrls, index, resultLines);
    }
    output = resultLines.join("\n");
  } catch (error) {
    output = error.message || error.toString();
  }
  setOutput(output);
  setProgress(1);
}

urlElement.onkeydown = (event) => {
  if (event.key === "Enter") {
    onCheckInventory();
  }
};
checkElement.onclick = onCheckInventory;
