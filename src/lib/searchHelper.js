/**
 * Utilidad universal de búsqueda para RUMBO
 * Totalmente insensible a:
 * - Tildes y acentos (á -> a, é -> e, í -> i, ó -> o, ú -> u, ü -> u)
 * - Letra Ñ y variantes (ñ -> n)
 * - Mayúsculas / Minúsculas
 * - Signos de puntuación, guiones, símbolos
 * - Orden de las palabras (búsqueda por palabras clave/tokens)
 */

/**
 * Normaliza cualquier texto removiendo acentos, puntuación y convirtiendo a minúsculas.
 * @param {string|any} text 
 * @returns {string}
 */
export const normalizeSearchText = (text) => {
  if (text === null || text === undefined) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes, virgulillas)
    .replace(/[^a-z0-9\s]/g, ' ')    // Reemplaza signos de puntuación por espacios
    .replace(/\s+/g, ' ')            // Colapsa múltiples espacios en uno solo
    .trim();
};

/**
 * Determina si uno o varios textos/campos coinciden con una consulta de búsqueda.
 * Si la consulta tiene múltiples palabras ("quimica cepre"), todas las palabras deben encontrarse
 * en el conjunto de campos analizados.
 * 
 * @param {string|string[]|object} target - Texto, arreglo de textos u objeto a inspeccionar.
 * @param {string} query - Consulta ingresada por el usuario en el buscador.
 * @returns {boolean}
 */
export const searchMatches = (target, query) => {
  if (!query || !query.trim()) return true;

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  // Extraer todo el contenido relevante a un solo string unificado
  let combinedTarget = '';
  if (Array.isArray(target)) {
    combinedTarget = target.map(t => (typeof t === 'object' ? JSON.stringify(t) : t)).join(' ');
  } else if (typeof target === 'object' && target !== null) {
    combinedTarget = Object.values(target)
      .map(v => (typeof v === 'string' || typeof v === 'number' ? v : ''))
      .join(' ');
  } else {
    combinedTarget = String(target || '');
  }

  const normalizedTarget = normalizeSearchText(combinedTarget);
  if (!normalizedTarget) return false;

  // Búsqueda por tokens: cada palabra ingresada debe existir en el objetivo
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  return tokens.every(token => normalizedTarget.includes(token));
};

/**
 * Filtra una lista de elementos según una consulta y campos opcionales.
 * @param {Array} list 
 * @param {string} query 
 * @param {Function} [fieldSelector] - Función que recibe el elemento y retorna un string o array de campos.
 * @returns {Array}
 */
export const filterBySearch = (list, query, fieldSelector) => {
  if (!Array.isArray(list)) return [];
  if (!query || !query.trim()) return list;

  return list.filter(item => {
    const target = fieldSelector ? fieldSelector(item) : item;
    return searchMatches(target, query);
  });
};
