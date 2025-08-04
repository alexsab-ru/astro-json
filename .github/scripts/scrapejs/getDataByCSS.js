const { Selector } = require('./variables');

const checkBrandPrefix = (element, brand) => {
  if (element.toLowerCase().startsWith(brand)) {
    const regex = new RegExp('^' + brand + '-?', 'i');
    element = element.replace(regex, '').trim();
  }
  return element.trim();
};

const checkLink = (link) => {
  return link.split('?')[0];
};

const getId = (brand, url) => {
  if (url) {
    url = url.replace(/\/$/, '');
    url = url.split('/').pop();
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
    const priceText = await priceElement.evaluate(node => node.textContent);
    return priceText ? priceText.replace(/\D/g, '') : null;
  } else {
    return null;
  }
};

const getLink = async (element, selector) => {
  const elementHref = await element.evaluate(node => node.href);
  if (elementHref) {
    return checkLink(elementHref);
  }
  
  const linkElement = await element.$(selector);
  if (linkElement) {
    const linkHref = await linkElement.evaluate(node => node.href);
    return linkHref ? checkLink(linkHref) : null;
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