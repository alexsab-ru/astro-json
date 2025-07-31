async function getDataByXPath(element, xpath) {
  console.log('element', element, 'xpaht: ', xpath);
  return await element.evaluate((el, xpath) => {
    const result = document.evaluate(
      xpath,
      el,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const node = result.singleNodeValue;
    

    if (!node) return null;

    // Случай 1: Это текстовая нода (если XPath содержит /text())
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue.trim();
    }

    // Случай 2: Это атрибут (если XPath содержит @)
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
      return node.value.trim();
    }

    // Случай 3: Это обычный элемент (берём textContent)
    return node.textContent.trim();
  }, xpath);
}

module.exports = { getDataByXPath };