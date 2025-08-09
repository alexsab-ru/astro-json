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

/**
 * Возвращает идентификатор модели.
 * ВАЖНО: если идентификатор нельзя получить, выбрасывается ошибка с указанием бренда.
 */
const getId = (brand, url) => {
  // Если ссылки нет, дальше вычислять нечего — кидаем понятную ошибку.
  if (!url) {
    throw new Error(`${brand.toUpperCase()}: Не удалось получить id — отсутствует ссылка (url).`);
  }

  // Убираем возможный завершающий слэш и берём последний сегмент пути
  let lastPathSegment = url.replace(/\/$/, '').split('/').pop();

  if (brand === Brand.WEY) {
    // Для WEY id хранится в query-параметре после '='
    const idFromQuery = lastPathSegment.split('=').pop();
    if (!idFromQuery) {
      throw new Error(`${brand.toUpperCase()}: Не удалось получить id — пустой параметр в ссылке.`);
    }
    return idFromQuery;
  }

  if (!lastPathSegment) {
    throw new Error(`${brand.toUpperCase()}: Не удалось получить id — пустой хвост ссылки.`);
  }

  return `${brand}-${checkBrandPrefix(lastPathSegment, brand)}`;
};

/**
 * Возвращает название модели.
 * Если модель не обнаружена — бросается ошибка с пояснением и брендом.
 */
const getModel = async (element, selector, brand, url) => {
  // Вариант, когда модель берём из ссылки на картинку/страницу
  if (selector === Selector.IMG) {
    if (!url) {
      throw new Error(`${brand.toUpperCase()}: Не удалось определить модель — отсутствует ссылка (url) для IMG.`);
    }
    let modelText = checkLink(url, brand);
    modelText = modelText.replace(/\/$/, '').split('/').pop();
    if (!modelText) {
      throw new Error(`${brand.toUpperCase()}: Не удалось определить модель — пустое значение в ссылке.`);
    }
    return checkBrandPrefix(modelText, brand);
  }

  // Ищем элемент модели по селектору
  const modelElement = await element.$(selector);
  if (!modelElement) {
    throw new Error(`${brand.toUpperCase()}: Не найден элемент модели по селектору "${selector}".`);
  }
  const modelText = await modelElement.evaluate(node => node.textContent);
  if (!modelText) {
    throw new Error(`${brand.toUpperCase()}: Не удалось определить модель — пустой текст в элементе "${selector}".`);
  }
  return checkBrandPrefix(modelText, brand);
};

/**
 * Возвращает цену в числовой строке (только цифры).
 * Если цену получить нельзя — выбрасывает ошибку с брендом и селектором.
 */
const getPrice = async (element, selector, brand) => {
  const priceElement = await element.$(selector);
  if (!priceElement) {
    throw new Error(`${brand.toUpperCase()}: Не найден элемент цены по селектору "${selector}".`);
  }
  const priceText = await priceElement.evaluate(node => {
    const childNodes = Array.from(node.childNodes);
    // Фильтруем только текстовые узлы (игнорируем элементы)
    const textNodes = childNodes.filter(n => n.nodeType === Node.TEXT_NODE);
    // Объединяем текст из текстовых узлов
    return textNodes.map(n => n.textContent.trim()).join(' ').trim();
  });
  if (!priceText) {
    throw new Error(`${brand.toUpperCase()}: Не удалось получить цену — пустое содержимое в "${selector}".`);
  }
  const onlyDigits = priceText.replace(/\D/g, '');
  if (!onlyDigits) {
    throw new Error(`${brand.toUpperCase()}: Не удалось получить цену — нет цифр в значении "${priceText}".`);
  }
  return onlyDigits;
};

/**
 * Возвращает нормализованную ссылку.
 * Если ссылка недоступна — бросает ошибку с брендом и селектором.
 */
const getLink = async (element, selector, brand) => {
  // Пробуем получить href прямо из текущего узла (вдруг это <a>)
  const elementHref = await element.evaluate(node => node.href);
  if (elementHref) {
    return checkLink(elementHref, brand);
  }

  // Иначе пытаемся найти дочерний элемент по селектору
  const linkElement = await element.$(selector);
  if (!linkElement) {
    throw new Error(`${brand.toUpperCase()}: Не найден элемент ссылки по селектору "${selector}".`);
  }
  const linkHref = await linkElement.evaluate(node => node.href);
  if (!linkHref) {
    throw new Error(`${brand.toUpperCase()}: Не удалось получить href из элемента ссылки "${selector}".`);
  }
  return checkLink(linkHref, brand);
};

module.exports = {
  getModel,
  getPrice,
  getLink,
  getId
};