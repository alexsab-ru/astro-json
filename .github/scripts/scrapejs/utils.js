const Selector = {
  IMG: 'img',
};

const Brand = {
  WEY: 'wey'
};

const checkBrandPrefix = (element, brand) => {
  if (element.toLowerCase().startsWith(brand)) {
    const regex = new RegExp('^' + brand + '-?', 'i');
    element = element.replace(regex, '').trim();
  }
  const regex = new RegExp(brand + '-?', 'ig');
  element = element.replace(regex, '').trim();
  return element;
};

const checkLink = (link, brand) => {
  return brand === Brand.WEY ? link : link.split('?')[0];
};

const getId = (brand, url) => {
  if (url) {
    url = url.replace(/\/$/, '');
    url = url.split('/').pop();
    if (brand === Brand.WEY) {
      url = url.split('=').pop();
      return url ? url : null;
    }
    return url ? `${brand}-${checkBrandPrefix(url, brand)}` : null;
  } else {
    return null;
  }
};

const getModel = async (element, selector, brand, url) => {
  if (selector === Selector.IMG) {
    if (url) {
      let modelText = checkLink(url);
      modelText = modelText.replace(/\/$/, '');
      modelText = modelText.split('/').pop();
      return modelText ? checkBrandPrefix(modelText, brand) : null;
    } else {
      return null;
    }
  }
  const modelElement = await element.$(selector);
  if (modelElement) {
    const modelText = await modelElement.evaluate(node => node.textContent);
    return modelText ? checkBrandPrefix(modelText, brand) : null;
  } else {
    return null;
  }
};

const getPrice = async (element, selector) => {
  const priceElement = await element.$(selector);
  if (priceElement) {
    const priceText = await priceElement.evaluate(node => {
      const childNodes = Array.from(node.childNodes);
    // Фильтруем только текстовые узлы (игнорируем элементы)
    const textNodes = childNodes.filter(n => n.nodeType === Node.TEXT_NODE);
    // Объединяем текст из текстовых узлов
    return textNodes.map(n => n.textContent.trim()).join(' ').trim();
    });
    return priceText ? priceText.replace(/\D/g, '') : null;
  } else {
    return null;
  }
};

const getLink = async (element, selector, brand) => {
  const elementHref = await element.evaluate(node => node.href);
  if (elementHref) {
    return checkLink(elementHref, brand);
  }
  
  const linkElement = await element.$(selector);
  if (linkElement) {
    const linkHref = await linkElement.evaluate(node => node.href);
    return linkHref ? checkLink(linkHref, brand) : null;
  } else {
    return null;
  }
};

module.exports = {
  getModel,
  getPrice,
  getLink,
  getId
};