"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const ACCENT_MAP = {
  // Latin Extended-A
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  ā: "a",
  ă: "a",
  ą: "a",
  À: "A",
  Á: "A",
  Â: "A",
  Ã: "A",
  Ä: "A",
  Å: "A",
  Ā: "A",
  Ă: "A",
  Ą: "A",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ē: "e",
  ĕ: "e",
  ė: "e",
  ę: "e",
  ě: "e",
  È: "E",
  É: "E",
  Ê: "E",
  Ë: "E",
  Ē: "E",
  Ĕ: "E",
  Ė: "E",
  Ę: "E",
  Ě: "E",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ĩ: "i",
  ī: "i",
  ĭ: "i",
  į: "i",
  Ì: "I",
  Í: "I",
  Î: "I",
  Ï: "I",
  Ĩ: "I",
  Ī: "I",
  Ĭ: "I",
  Į: "I",
  "ò": "o",
  "ó": "o",
  "ô": "o",
  "õ": "o",
  "ö": "o",
  "ø": "o",
  "ō": "o",
  "ŏ": "o",
  "ő": "o",
  "Ò": "O",
  "Ó": "O",
  "Ô": "O",
  "Õ": "O",
  "Ö": "O",
  "Ø": "O",
  "Ō": "O",
  "Ŏ": "O",
  "Ő": "O",
  "ù": "u",
  "ú": "u",
  "û": "u",
  "ü": "u",
  "ũ": "u",
  "ū": "u",
  "ŭ": "u",
  "ů": "u",
  "ű": "u",
  "ų": "u",
  "Ù": "U",
  "Ú": "U",
  "Û": "U",
  "Ü": "U",
  "Ũ": "U",
  "Ū": "U",
  "Ŭ": "U",
  "Ů": "U",
  "Ű": "U",
  "Ų": "U",
  ý: "y",
  ÿ: "y",
  ŷ: "y",
  Ý: "Y",
  Ÿ: "Y",
  Ŷ: "Y",
  ñ: "n",
  ń: "n",
  ņ: "n",
  ň: "n",
  Ñ: "N",
  Ń: "N",
  Ņ: "N",
  Ň: "N",
  ç: "c",
  ć: "c",
  ĉ: "c",
  ċ: "c",
  č: "c",
  Ç: "C",
  Ć: "C",
  Ĉ: "C",
  Ċ: "C",
  Č: "C",
  ß: "ss",
  // German sharp s
  ð: "d",
  đ: "d",
  Ð: "D",
  Đ: "D",
  ĝ: "g",
  ğ: "g",
  ġ: "g",
  ģ: "g",
  Ĝ: "G",
  Ğ: "G",
  Ġ: "G",
  Ģ: "G",
  ĥ: "h",
  ħ: "h",
  Ĥ: "H",
  Ħ: "H",
  ĵ: "j",
  Ĵ: "J",
  ķ: "k",
  Ķ: "K",
  ĺ: "l",
  ļ: "l",
  ľ: "l",
  ŀ: "l",
  ł: "l",
  Ĺ: "L",
  Ļ: "L",
  Ľ: "L",
  Ŀ: "L",
  Ł: "L",
  ŕ: "r",
  ŗ: "r",
  ř: "r",
  Ŕ: "R",
  Ŗ: "R",
  Ř: "R",
  ś: "s",
  ŝ: "s",
  ş: "s",
  š: "s",
  Ś: "S",
  Ŝ: "S",
  Ş: "S",
  Š: "S",
  ţ: "t",
  ť: "t",
  ŧ: "t",
  Ţ: "T",
  Ť: "T",
  Ŧ: "T",
  ŵ: "w",
  Ŵ: "W",
  ź: "z",
  ż: "z",
  ž: "z",
  Ź: "Z",
  Ż: "Z",
  Ž: "Z",
  æ: "ae",
  œ: "oe",
  Æ: "AE",
  Œ: "OE",
  þ: "th",
  Þ: "TH"
};
const accentCache = /* @__PURE__ */ new Map();
const MAX_CACHE_SIZE = 1e4;
function removeAccents(text) {
  if (!text) return text;
  const cached = accentCache.get(text);
  if (cached !== void 0) {
    return cached;
  }
  const chars = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    chars.push(ACCENT_MAP[char] || char);
  }
  let result = chars.join("");
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (accentCache.size < MAX_CACHE_SIZE) {
    accentCache.set(text, result);
  } else if (accentCache.size === MAX_CACHE_SIZE) {
    accentCache.clear();
    accentCache.set(text, result);
  }
  return result;
}
function hasAccents(text) {
  if (!text) return false;
  for (let i = 0; i < text.length; i++) {
    if (ACCENT_MAP[text[i]]) {
      return true;
    }
  }
  return /[\u0300-\u036f]/.test(text.normalize("NFD"));
}
function normalizeForComparison(text) {
  return removeAccents(text.toLowerCase());
}
function getAccentVariants(word) {
  const normalized = removeAccents(word);
  if (normalized !== word) {
    return [word, normalized];
  }
  return [word];
}
exports.getAccentVariants = getAccentVariants;
exports.hasAccents = hasAccents;
exports.normalizeForComparison = normalizeForComparison;
exports.removeAccents = removeAccents;
//# sourceMappingURL=accent-normalization.cjs.map
