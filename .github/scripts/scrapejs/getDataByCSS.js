const checkBrandPrefix = (element, brand) => {
  if (element.toLowerCase().startsWith(brand)) {
    const regex = new RegExp('^' + brand + '-?', 'i');
    element = element.replace(regex, '').trim();
  }
  return element.trim();
};

const getId = (brand, url) => {
  url = url.replace(/\/$/, '');
  url = url.split('/').pop();
  return url ? `${brand}-${checkBrandPrefix(url, brand)}` : null;
};

const getModel = async (element, selector, brand) => {
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
    return elementHref;
  }
  
  const linkElement = await element.$(selector);
  if (linkElement) {
    const linkHref = await linkElement.evaluate(node => node.href);
    return linkHref ? linkHref : null;
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