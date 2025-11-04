import { BaseLanguageProcessor } from "../base/LanguageProcessor.js";
class GermanProcessor extends BaseLanguageProcessor {
  language = "german";
  displayName = "Deutsch";
  supportedFeatures = ["phonetic", "compound", "synonyms", "keyboard-neighbors", "partial-words", "missing-letters", "extra-letters"];
  /**
   * German text normalization with umlaut handling
   */
  normalize(text) {
    return text.toLowerCase().trim().replace(/\s+/g, " ").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  }
  /**
   * Kölner Phonetik algorithm for German phonetic matching
   */
  getPhoneticCode(word) {
    const normalized = this.normalize(word);
    if (normalized.length === 0) return "";
    let code = "";
    let prev = "";
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      const next = i < normalized.length - 1 ? normalized[i + 1] : "";
      let digit = "";
      switch (char) {
        case "a":
        case "e":
        case "i":
        case "j":
        case "o":
        case "u":
        case "y":
          digit = "0";
          break;
        case "h":
          continue;
        case "b":
        case "p":
          digit = "1";
          break;
        case "d":
        case "t":
          if (next === "c" || next === "s" || next === "z") {
            digit = "8";
          } else {
            digit = "2";
          }
          break;
        case "f":
        case "v":
        case "w":
          digit = "3";
          break;
        case "g":
        case "k":
        case "q":
          digit = "4";
          break;
        case "c":
          if (i === 0) {
            if (next === "a" || next === "h" || next === "k" || next === "l" || next === "o" || next === "q" || next === "r" || next === "u" || next === "x") {
              digit = "4";
            } else {
              digit = "8";
            }
          } else {
            if (prev === "s" || prev === "z") {
              digit = "8";
            } else if (next === "h") {
              digit = "4";
            } else if (next === "k" || next === "q") {
              digit = "4";
            } else {
              digit = "8";
            }
          }
          break;
        case "x":
          if (prev === "c" || prev === "k" || prev === "q") {
            digit = "8";
          } else {
            digit = "48";
          }
          break;
        case "l":
          digit = "5";
          break;
        case "m":
        case "n":
          digit = "6";
          break;
        case "r":
          digit = "7";
          break;
        case "s":
        case "z":
          digit = "8";
          break;
        default:
          continue;
      }
      if (digit && digit !== prev) {
        code += digit;
      }
      prev = digit;
    }
    return code || "0";
  }
  /**
   * German compound word splitting
   * Uses common German compound patterns and a dictionary approach
   */
  splitCompoundWords(word) {
    const normalized = this.normalize(word);
    if (normalized.length < 6) return [word];
    const parts = [];
    const commonPrefixes = this.getCommonPrefixes();
    const commonSuffixes = this.getCommonSuffixes();
    const commonWords = this.getCommonWords();
    for (const prefix of commonPrefixes) {
      if (normalized.startsWith(prefix) && normalized.length > prefix.length + 3) {
        const remainder = normalized.slice(prefix.length);
        parts.push(prefix);
        parts.push(...this.splitCompoundWords(remainder));
        break;
      }
    }
    if (parts.length === 0) {
      for (const suffix of commonSuffixes) {
        if (normalized.endsWith(suffix) && normalized.length > suffix.length + 3) {
          const remainder = normalized.slice(0, -suffix.length);
          parts.push(...this.splitCompoundWords(remainder));
          parts.push(suffix);
          break;
        }
      }
    }
    if (parts.length === 0) {
      for (let i = 3; i <= normalized.length - 3; i++) {
        const leftPart = normalized.slice(0, i);
        const rightPart = normalized.slice(i);
        if (commonWords.has(leftPart) && rightPart.length >= 3) {
          parts.push(leftPart);
          parts.push(...this.splitCompoundWords(rightPart));
          break;
        }
      }
    }
    return parts.length > 0 ? parts : [word];
  }
  /**
   * German word variants including common endings
   * Uses optimized base implementation with German-specific additions
   */
  getWordVariants(word, performanceMode) {
    const variants = new Set(super.getWordVariants(word, performanceMode));
    const compoundParts = this.splitCompoundWords(word);
    if (compoundParts.length > 1) {
      compoundParts.forEach((part) => {
        if (part.length >= 3) {
          variants.add(this.normalize(part));
        }
      });
    }
    return Array.from(variants);
  }
  /**
   * German word endings
   */
  getCommonEndings() {
    return [
      //
      "en",
      "e",
      "er",
      "n",
      "r",
      "s",
      "es",
      "t",
      "ung",
      "heit",
      "keit",
      "schaft",
      "chen",
      "lein",
      "lich",
      "ig",
      "isch",
      "bar",
      "los",
      "voll"
    ];
  }
  /**
   * German synonyms for common words
   */
  getSynonyms(word) {
    const synonymMap = {
      arzt: [
        //
        "doktor",
        "mediziner",
        "doc"
      ],
      krankenhaus: [
        //
        "spital",
        "klinik",
        "hospital"
      ],
      schule: [
        //
        "bildungseinrichtung",
        "lehranstalt"
      ],
      auto: [
        //
        "wagen",
        "fahrzeug",
        "pkw"
      ],
      haus: [
        //
        "gebaeude",
        "heim",
        "wohnhaus"
      ],
      strasse: [
        //
        "weg",
        "gasse",
        "allee"
      ],
      stadt: [
        //
        "ort",
        "gemeinde",
        "ortschaft"
      ],
      arbeit: [
        //
        "job",
        "beruf",
        "taetigkeit"
      ],
      geld: [
        //
        "waehrung",
        "kapital",
        "finanzen"
      ],
      zeit: [
        //
        "dauer",
        "periode",
        "zeitraum"
      ]
    };
    const normalized = this.normalize(word);
    return synonymMap[normalized] || [];
  }
  /**
   * German keyboard layout (QWERTZ)
   */
  getKeyboardNeighbors() {
    return {
      q: [
        //
        "w",
        "a",
        "s"
      ],
      w: [
        //
        "q",
        "e",
        "a",
        "s",
        "d"
      ],
      e: [
        //
        "w",
        "r",
        "s",
        "d",
        "f"
      ],
      r: [
        //
        "e",
        "t",
        "d",
        "f",
        "g"
      ],
      t: [
        //
        "r",
        "z",
        "f",
        "g",
        "h"
      ],
      z: [
        //
        "t",
        "u",
        "g",
        "h",
        "j"
      ],
      // QWERTZ difference
      u: [
        //
        "z",
        "i",
        "h",
        "j",
        "k"
      ],
      i: [
        //
        "u",
        "o",
        "j",
        "k",
        "l"
      ],
      o: [
        //
        "i",
        "p",
        "k",
        "l",
        "oe"
      ],
      p: [
        //
        "o",
        "ue",
        "l",
        "oe"
      ],
      ue: [
        //
        "p",
        "ae"
      ],
      // German umlaut
      a: [
        //
        "q",
        "w",
        "s",
        "y",
        "x"
      ],
      s: [
        //
        "q",
        "w",
        "e",
        "a",
        "d",
        "y",
        "x",
        "c"
      ],
      d: [
        //
        "w",
        "e",
        "r",
        "s",
        "f",
        "x",
        "c",
        "v"
      ],
      f: [
        //
        "e",
        "r",
        "t",
        "d",
        "g",
        "c",
        "v",
        "b"
      ],
      g: [
        //
        "r",
        "t",
        "z",
        "f",
        "h",
        "v",
        "b",
        "n"
      ],
      h: [
        //
        "t",
        "z",
        "u",
        "g",
        "j",
        "b",
        "n",
        "m"
      ],
      j: [
        //
        "z",
        "u",
        "i",
        "h",
        "k",
        "n",
        "m"
      ],
      k: [
        //
        "u",
        "i",
        "o",
        "j",
        "l",
        "m"
      ],
      l: [
        //
        "i",
        "o",
        "p",
        "k",
        "oe"
      ],
      oe: [
        //
        "o",
        "p",
        "ue",
        "l",
        "ae"
      ],
      // German umlaut
      ae: [
        //
        "ue",
        "oe"
      ],
      // German umlaut
      y: [
        //
        "a",
        "s",
        "x"
      ],
      // QWERTZ difference
      x: [
        //
        "a",
        "s",
        "d",
        "y",
        "c"
      ],
      c: [
        //
        "s",
        "d",
        "f",
        "x",
        "v"
      ],
      v: [
        //
        "d",
        "f",
        "g",
        "c",
        "b"
      ],
      b: [
        //
        "f",
        "g",
        "h",
        "v",
        "n"
      ],
      n: [
        //
        "g",
        "h",
        "j",
        "b",
        "m"
      ],
      m: [
        //
        "h",
        "j",
        "k",
        "n"
      ]
    };
  }
  /**
   * Common German prefixes for compound word splitting
   */
  getCommonPrefixes() {
    return ["un", "vor", "nach", "bei", "mit", "ab", "an", "auf", "aus", "ein", "gegen", "hinter", "neben", "ueber", "unter", "zwischen", "selbst"];
  }
  /**
   * Common German suffixes for compound word splitting
   */
  getCommonSuffixes() {
    return ["haus", "platz", "strasse", "weg", "hof", "berg", "tal", "feld", "stadt", "dorf", "heim", "werk", "bau", "anlage", "zentrum"];
  }
  /**
   * Common German words for compound splitting
   */
  getCommonWords() {
    return /* @__PURE__ */ new Set(["kranken", "kinder", "frauen", "maenner", "alt", "neu", "gross", "klein", "hoch", "tief", "lang", "kurz", "breit", "schmal", "dick", "duenn", "stark", "schwach", "schnell", "langsam", "heiss", "kalt", "warm", "auto", "bahn", "bus", "zug", "flug", "schiff", "rad", "motor", "wasser", "feuer", "erde", "luft", "licht", "schatten", "sonne", "mond", "tag", "nacht", "morgen", "abend", "mittag", "zeit", "jahr", "monat"]);
  }
}
export {
  GermanProcessor
};
//# sourceMappingURL=GermanProcessor.js.map
