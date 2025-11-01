import { BaseLanguageProcessor } from "../base/LanguageProcessor.js";
import type { FuzzyFeature } from "../../core/types.js";

/**
 * French language processor with specialized features:
 * - Accent normalization (à, é, è, ê, ç, etc.)
 * - French phonetic patterns
 * - Common French word endings
 * - French synonym support
 */
export class FrenchProcessor extends BaseLanguageProcessor {
  readonly language = "french";
  readonly displayName = "Français";
  readonly supportedFeatures: FuzzyFeature[] = [
    //
    "phonetic",
    "synonyms",
    "keyboard-neighbors",
    "partial-words",
    "missing-letters",
    "extra-letters",
  ];

  /**
   * French text normalization with accent handling
   */
  normalize(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        // Normalize accented characters
        .replace(/[àáâãä]/g, "a")
        .replace(/[èéêë]/g, "e")
        .replace(/[ìíîï]/g, "i")
        .replace(/[òóôõö]/g, "o")
        .replace(/[ùúûü]/g, "u")
        .replace(/ç/g, "c")
        .replace(/ñ/g, "n")
        .replace(/ÿ/g, "y")
    );
  }

  /**
   * French phonetic matching
   */
  getPhoneticCode(word: string): string {
    const normalized = this.normalize(word);
    if (normalized.length === 0) return "";

    let code = "";
    let prev = "";

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      const next = i < normalized.length - 1 ? normalized[i + 1] : "";
      const next2 = i < normalized.length - 2 ? normalized[i + 2] : "";
      let digit = "";

      switch (char) {
        case "a":
        case "e":
        case "i":
        case "o":
        case "u":
        case "y":
          digit = "0";
          break;
        case "b":
          digit = "1";
          break;
        case "c":
          if (next === "h") {
            digit = "2"; // CH sound
          } else if (next === "e" || next === "i") {
            digit = "8"; // CE, CI sounds like S
          } else {
            digit = "4";
          }
          break;
        case "d":
          digit = "3";
          break;
        case "f":
          digit = "5";
          break;
        case "g":
          if (next === "n") {
            digit = "6"; // GN sound
          } else if (next === "u" && (next2 === "e" || next2 === "i")) {
            digit = "4"; // GUE, GUI
          } else if (next === "e" || next === "i") {
            digit = "6"; // GE, GI sound like J
          } else {
            digit = "4";
          }
          break;
        case "h":
          // H is often silent in French
          if (i === 0) {
            digit = "0"; // Initial H
          }
          break;
        case "j":
          digit = "6";
          break;
        case "k":
          digit = "4";
          break;
        case "l":
          digit = "5";
          break;
        case "m":
          digit = "6";
          break;
        case "n":
          digit = "6";
          break;
        case "p":
          if (next === "h") {
            digit = "5"; // PH sounds like F
          } else {
            digit = "1";
          }
          break;
        case "q":
          digit = "4";
          break;
        case "r":
          digit = "7";
          break;
        case "s":
          digit = "8";
          break;
        case "t":
          if (next === "h") {
            digit = "3"; // TH sound
          } else {
            digit = "3";
          }
          break;
        case "v":
          digit = "5";
          break;
        case "w":
          digit = "5"; // Rare in French
          break;
        case "x":
          digit = "48";
          break;
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
   * French word endings
   */
  protected getCommonEndings(): string[] {
    return ["e", "es", "s", "x", "ent", "ant", "ment", "tion", "sion", "eur", "euse", "teur", "trice", "able", "ible", "ique", "aire", "oire", "ette", "elle", "esse", "asse", "isse", "age", "isme", "iste", "ite", "ude", "ade"];
  }

  /**
   * French synonyms
   */
  getSynonyms(word: string): string[] {
    const synonymMap: Record<string, string[]> = {
      medecin: [
        //
        "docteur",
        "praticien",
      ],
      hopital: [
        //
        "clinique",
        "centre medical",
      ],
      ecole: [
        //
        "etablissement",
        "institution",
      ],
      voiture: [
        //
        "automobile",
        "vehicule",
        "auto",
      ],
      maison: [
        //
        "domicile",
        "residence",
        "habitation",
      ],
      rue: [
        //
        "avenue",
        "boulevard",
        "voie",
      ],
      ville: [
        //
        "cite",
        "commune",
        "agglomeration",
      ],
      travail: [
        //
        "emploi",
        "occupation",
        "metier",
      ],
      argent: [
        //
        "monnaie",
        "especes",
        "capital",
      ],
      temps: [
        //
        "duree",
        "periode",
        "moment",
      ],
      grand: [
        //
        "enorme",
        "immense",
        "gigantesque",
      ],
      petit: [
        //
        "minuscule",
        "minime",
        "reduit",
      ],
      rapide: [
        //
        "vite",
        "accelere",
        "prompt",
      ],
      lent: [
        //
        "lentement",
        "doucement",
      ],
      bon: [
        //
        "excellent",
        "parfait",
        "formidable",
      ],
      mauvais: [
        //
        "terrible",
        "affreux",
        "horrible",
      ],
      heureux: [
        //
        "joyeux",
        "content",
        "ravi",
      ],
      triste: [
        //
        "malheureux",
        "chagrine",
        "melancolique",
      ],
    };

    const normalized = this.normalize(word);
    return synonymMap[normalized] || [];
  }

  /**
   * French keyboard layout (AZERTY)
   */
  protected getKeyboardNeighbors(): Record<string, string[]> {
    return {
      a: [
        //
        "z",
        "e",
        "r",
        "q",
        "s",
      ],
      z: [
        //
        "a",
        "e",
        "r",
        "q",
        "s",
        "d",
      ],
      e: [
        //
        "z",
        "r",
        "t",
        "s",
        "d",
        "f",
      ],
      r: [
        //
        "e",
        "t",
        "y",
        "d",
        "f",
        "g",
      ],
      t: [
        //
        "r",
        "y",
        "u",
        "f",
        "g",
        "h",
      ],
      y: [
        //
        "t",
        "u",
        "i",
        "g",
        "h",
        "j",
      ],
      u: [
        //
        "y",
        "i",
        "o",
        "h",
        "j",
        "k",
      ],
      i: [
        //
        "u",
        "o",
        "p",
        "j",
        "k",
        "l",
      ],
      o: [
        //
        "i",
        "p",
        "k",
        "l",
        "m",
      ],
      p: [
        //
        "o",
        "l",
        "m",
      ],
      q: [
        //
        "a",
        "z",
        "s",
        "w",
        "x",
      ],
      s: [
        //
        "a",
        "z",
        "e",
        "q",
        "d",
        "w",
        "x",
        "c",
      ],
      d: [
        //
        "z",
        "e",
        "r",
        "s",
        "f",
        "x",
        "c",
        "v",
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
        "b",
      ],
      g: [
        //
        "r",
        "t",
        "y",
        "f",
        "h",
        "v",
        "b",
        "n",
      ],
      h: [
        //
        "t",
        "y",
        "u",
        "g",
        "j",
        "b",
        "n",
      ],
      j: [
        //
        "y",
        "u",
        "i",
        "h",
        "k",
        "n",
      ],
      k: [
        //
        "u",
        "i",
        "o",
        "j",
        "l",
      ],
      l: [
        //
        "i",
        "o",
        "p",
        "k",
        "m",
      ],
      m: [
        //
        "o",
        "p",
        "l",
      ],
      w: [
        //
        "q",
        "s",
        "x",
      ],
      x: [
        //
        "q",
        "s",
        "d",
        "w",
        "c",
      ],
      c: [
        //
        "s",
        "d",
        "f",
        "x",
        "v",
      ],
      v: [
        //
        "d",
        "f",
        "g",
        "c",
        "b",
      ],
      b: [
        //
        "f",
        "g",
        "h",
        "v",
        "n",
      ],
      n: [
        //
        "g",
        "h",
        "j",
        "b",
      ],
    };
  }
}
