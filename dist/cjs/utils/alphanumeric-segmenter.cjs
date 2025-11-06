"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function isAlphanumeric(str) {
  const hasLetters = /[a-zA-Z]/.test(str);
  const hasNumbers = /[0-9]/.test(str);
  return hasLetters && hasNumbers;
}
function segmentString(str) {
  const segments = [];
  let currentType = null;
  let currentValue = "";
  let currentStart = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    let charType;
    if (/[a-zA-Z]/.test(char)) {
      charType = "alpha";
    } else if (/[0-9]/.test(char)) {
      charType = "numeric";
    } else {
      charType = "other";
    }
    if (currentType === null) {
      currentType = charType;
      currentValue = char;
      currentStart = i;
    } else if (currentType === charType) {
      currentValue += char;
    } else {
      segments.push({
        type: currentType,
        value: currentValue,
        start: currentStart,
        end: i
      });
      currentType = charType;
      currentValue = char;
      currentStart = i;
    }
  }
  if (currentType !== null && currentValue.length > 0) {
    segments.push({
      type: currentType,
      value: currentValue,
      start: currentStart,
      end: str.length
    });
  }
  return segments;
}
function getAlphaSegments(str) {
  return segmentString(str).filter((s) => s.type === "alpha");
}
function getNumericSegments(str) {
  return segmentString(str).filter((s) => s.type === "numeric");
}
function extractAlphaPart(str) {
  return getAlphaSegments(str).map((s) => s.value).join("");
}
function extractNumericPart(str) {
  return getNumericSegments(str).map((s) => s.value).join("");
}
function compareSegments(str1, str2) {
  const alpha1 = extractAlphaPart(str1);
  const alpha2 = extractAlphaPart(str2);
  const numeric1 = extractNumericPart(str1);
  const numeric2 = extractNumericPart(str2);
  const hasAlpha = alpha1.length > 0 || alpha2.length > 0;
  const hasNumeric = numeric1.length > 0 || numeric2.length > 0;
  let alphaSimilarity = 0;
  if (hasAlpha) {
    if (alpha1 === alpha2) {
      alphaSimilarity = 1;
    } else if (alpha1.length === 0 || alpha2.length === 0) {
      alphaSimilarity = 0;
    } else {
      let commonLength = 0;
      const minLen = Math.min(alpha1.length, alpha2.length);
      for (let i = 0; i < minLen; i++) {
        if (alpha1[i].toLowerCase() === alpha2[i].toLowerCase()) {
          commonLength++;
        } else {
          break;
        }
      }
      const maxLen = Math.max(alpha1.length, alpha2.length);
      alphaSimilarity = commonLength / maxLen;
    }
  }
  let numericSimilarity = 0;
  if (hasNumeric) {
    if (numeric1 === numeric2) {
      numericSimilarity = 1;
    } else if (numeric1.length === 0 || numeric2.length === 0) {
      numericSimilarity = 0;
    } else {
      const longer = numeric1.length > numeric2.length ? numeric1 : numeric2;
      const shorter = numeric1.length > numeric2.length ? numeric2 : numeric1;
      if (longer.includes(shorter)) {
        numericSimilarity = shorter.length / longer.length;
      } else {
        let matchingDigits = 0;
        const minLen = Math.min(numeric1.length, numeric2.length);
        for (let i = 0; i < minLen; i++) {
          if (numeric1[i] === numeric2[i]) {
            matchingDigits++;
          }
        }
        numericSimilarity = matchingDigits / Math.max(numeric1.length, numeric2.length);
      }
    }
  }
  return {
    alphaSimilarity,
    numericSimilarity,
    hasAlpha,
    hasNumeric
  };
}
exports.compareSegments = compareSegments;
exports.extractAlphaPart = extractAlphaPart;
exports.extractNumericPart = extractNumericPart;
exports.getAlphaSegments = getAlphaSegments;
exports.getNumericSegments = getNumericSegments;
exports.isAlphanumeric = isAlphanumeric;
exports.segmentString = segmentString;
//# sourceMappingURL=alphanumeric-segmenter.cjs.map
