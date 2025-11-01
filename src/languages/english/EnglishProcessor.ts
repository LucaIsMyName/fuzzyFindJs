import { BaseLanguageProcessor } from "../base/LanguageProcessor.js";
import type { FuzzyFeature } from "../../core/types.js";

/**
 * English language processor with specialized features:
 * - Metaphone phonetic algorithm
 * - Common English contractions
 * - English-specific word endings
 * - Comprehensive synonym support
 */
export class EnglishProcessor extends BaseLanguageProcessor {
  readonly language = "english";
  readonly displayName = "English";
  readonly supportedFeatures: FuzzyFeature[] = [
    //
    "phonetic",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters",
    "extra-letters",
    "transpositions",
  ];

  /**
   * English text normalization with contraction handling
   */
  normalize(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        // Handle common contractions
        .replace(/won't/g, "will not")
        .replace(/can't/g, "cannot")
        .replace(/n't/g, " not")
        .replace(/'re/g, " are")
        .replace(/'ve/g, " have")
        .replace(/'ll/g, " will")
        .replace(/'d/g, " would")
        .replace(/'m/g, " am")
        .replace(/'/g, "")
    ); // Remove remaining apostrophes
  }

  /**
   * Simplified Metaphone algorithm for English phonetic matching
   */
  getPhoneticCode(word: string): string {
    const normalized = this.normalize(word).replace(/[^a-z]/g, "");
    if (normalized.length === 0) return "";

    let metaphone = "";
    let current = 0;
    const length = normalized.length;

    // Handle initial letters
    if (normalized.startsWith("gn") || normalized.startsWith("kn") || normalized.startsWith("pn") || normalized.startsWith("wr")) {
      current = 1;
    }

    while (current < length && metaphone.length < 4) {
      const char = normalized[current];
      const next = current + 1 < length ? normalized[current + 1] : "";
      const prev = current > 0 ? normalized[current - 1] : "";

      switch (char) {
        case "a":
        case "e":
        case "i":
        case "o":
        case "u":
          if (current === 0) metaphone += char.toUpperCase();
          break;
        case "b":
          if (current === length - 1 && prev === "m") {
            // Silent B at end after M
          } else {
            metaphone += "B";
          }
          break;
        case "c":
          if (next === "h") {
            metaphone += "X";
            current++;
          } else if (next === "i" || next === "e" || next === "y") {
            metaphone += "S";
          } else {
            metaphone += "K";
          }
          break;
        case "d":
          if (next === "g") {
            metaphone += "J";
            current++;
          } else {
            metaphone += "T";
          }
          break;
        case "f":
          metaphone += "F";
          break;
        case "g":
          if (next === "h" && current !== 0) {
            // Silent GH
          } else if (next === "n") {
            metaphone += "N";
            current++;
          } else if (next === "i" || next === "e" || next === "y") {
            metaphone += "J";
          } else {
            metaphone += "K";
          }
          break;
        case "h":
          if (current === 0 || "aeiou".includes(prev) || "aeiou".includes(next)) {
            metaphone += "H";
          }
          break;
        case "j":
          metaphone += "J";
          break;
        case "k":
          if (prev !== "c") {
            metaphone += "K";
          }
          break;
        case "l":
          metaphone += "L";
          break;
        case "m":
          metaphone += "M";
          break;
        case "n":
          metaphone += "N";
          break;
        case "p":
          if (next === "h") {
            metaphone += "F";
            current++;
          } else {
            metaphone += "P";
          }
          break;
        case "q":
          metaphone += "K";
          break;
        case "r":
          metaphone += "R";
          break;
        case "s":
          if (next === "h") {
            metaphone += "X";
            current++;
          } else {
            metaphone += "S";
          }
          break;
        case "t":
          if (next === "h") {
            metaphone += "0";
            current++;
          } else if (next === "i" && current + 2 < length && (normalized[current + 2] === "a" || normalized[current + 2] === "o")) {
            metaphone += "X";
          } else {
            metaphone += "T";
          }
          break;
        case "v":
          metaphone += "F";
          break;
        case "w":
          if ("aeiou".includes(next)) {
            metaphone += "W";
          }
          break;
        case "x":
          metaphone += "KS";
          break;
        case "y":
          if ("aeiou".includes(next)) {
            metaphone += "Y";
          }
          break;
        case "z":
          metaphone += "S";
          break;
      }
      current++;
    }

    return metaphone || "A";
  }

  /**
   * English word variants
   */
  getWordVariants(word: string): string[] {
    const variants = new Set<string>();
    const normalized = this.normalize(word);

    variants.add(normalized);
    variants.add(word);

    // Add variants without English endings
    const englishEndings = this.getCommonEndings();
    for (const ending of englishEndings) {
      if (normalized.endsWith(ending) && normalized.length > ending.length + 2) {
        variants.add(normalized.slice(0, -ending.length));
      }
    }

    // Add plural/singular variants
    if (normalized.endsWith("s") && normalized.length > 3) {
      variants.add(normalized.slice(0, -1));
    }
    if (!normalized.endsWith("s")) {
      variants.add(normalized + "s");
    }

    // Add -ing/-ed variants
    if (normalized.endsWith("ing") && normalized.length > 5) {
      const base = normalized.slice(0, -3);
      variants.add(base);
      variants.add(base + "e"); // handle dropped 'e'
    }
    if (normalized.endsWith("ed") && normalized.length > 4) {
      const base = normalized.slice(0, -2);
      variants.add(base);
      variants.add(base + "e"); // handle dropped 'e'
    }

    // Add partial variants
    if (normalized.length > 4) {
      for (let i = 3; i < normalized.length; i++) {
        variants.add(normalized.slice(0, i));
      }
    }

    return Array.from(variants);
  }

  /**
   * English word endings
   */
  protected getCommonEndings(): string[] {
    return ["s", "es", "ed", "ing", "er", "est", "ly", "tion", "sion", "ness", "ment", "able", "ible", "ful", "less", "ous", "ious", "al", "ial", "ic", "ive", "ary", "ery", "ory"];
  }

  /**
   * English synonyms for common words
   */
  getSynonyms(word: string): string[] {
    const synonymMap: Record<string, string[]> = {
      doctor: [
        //
        "physician",
        "medic",
        "doc",
        "md",
      ],
      hospital: [
        //
        "clinic",
        "medical center",
        "infirmary",
      ],
      school: [
        //
        "academy",
        "institution",
        "college",
        "university",
      ],
      car: [
        //
        "vehicle",
        "automobile",
        "auto",
      ],
      house: [
        //
        "home",
        "residence",
        "dwelling",
        "building",
      ],
      street: [
        //
        "road",
        "avenue",
        "lane",
        "boulevard",
      ],
      city: [
        //
        "town",
        "municipality",
        "urban area",
      ],
      work: [
        //
        "job",
        "employment",
        "occupation",
        "career",
      ],
      money: [
        //
        "cash",
        "currency",
        "funds",
        "capital",
      ],
      time: [
        //
        "duration",
        "period",
        "moment",
        "hour",
      ],
      big: [
        //
        "large",
        "huge",
        "enormous",
        "massive",
        "giant",
      ],
      small: [
        //
        "little",
        "tiny",
        "miniature",
        "petite",
      ],
      fast: [
        //
        "quick",
        "rapid",
        "speedy",
        "swift",
      ],
      slow: [
        //
        "sluggish",
        "gradual",
        "leisurely",
      ],
      good: [
        //
        "excellent",
        "great",
        "wonderful",
        "fine",
      ],
      bad: [
        //
        "poor",
        "terrible",
        "awful",
        "horrible",
      ],
      happy: [
        //
        "joyful",
        "cheerful",
        "glad",
        "pleased",
      ],
      sad: [
        //
        "unhappy",
        "depressed",
        "melancholy",
        "sorrowful",
      ],
    };

    const normalized = this.normalize(word);
    return synonymMap[normalized] || [];
  }
}
