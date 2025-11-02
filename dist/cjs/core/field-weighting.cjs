"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function extractFieldValues(item, fields) {
  if (!fields || fields.length === 0) {
    return null;
  }
  if (typeof item === "string") {
    return null;
  }
  if (typeof item === "object" && item !== null) {
    const fieldValues = {};
    for (const field of fields) {
      const value = item[field];
      if (value !== void 0 && value !== null) {
        fieldValues[field] = String(value);
      }
    }
    return Object.keys(fieldValues).length > 0 ? fieldValues : null;
  }
  return null;
}
function normalizeFieldWeights(fields, fieldWeights) {
  const normalized = {};
  for (const field of fields) {
    normalized[field] = fieldWeights?.[field] ?? 1;
  }
  return normalized;
}
exports.extractFieldValues = extractFieldValues;
exports.normalizeFieldWeights = normalizeFieldWeights;
//# sourceMappingURL=field-weighting.cjs.map
