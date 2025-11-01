import { BaseLanguageProcessor } from "../base/LanguageProcessor.js";
import type { FuzzyFeature } from "../../core/types.js";

/**
 * Spanish language processor with specialized features:
 * - Accent normalization (á, é, í, ó, ú, ñ)
 * - Spanish phonetic patterns
 * - Common Spanish word endings
 * - Spanish synonym support
 */
export class SpanishProcessor extends BaseLanguageProcessor {
  readonly language = "spanish";
  readonly displayName = "Español";
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
   * Spanish text normalization with accent handling
   */
  normalize(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        // Normalize accented characters
        .replace(/á/g, "a")
        .replace(/é/g, "e")
        .replace(/í/g, "i")
        .replace(/ó/g, "o")
        .replace(/ú/g, "u")
        .replace(/ñ/g, "n")
        .replace(/ü/g, "u")
    );
  }

  /**
   * Spanish phonetic matching
   */
  getPhoneticCode(word: string): string {
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
        case "o":
        case "u":
          digit = "0";
          break;
        case "b":
        case "v": // B and V sound similar in Spanish
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
          if (next === "u" && i + 2 < normalized.length && (normalized[i + 2] === "e" || normalized[i + 2] === "i")) {
            digit = "4"; // GUE, GUI
          } else if (next === "e" || next === "i") {
            digit = "6"; // GE, GI sound like J
          } else {
            digit = "4";
          }
          break;
        case "h":
          // H is silent in Spanish
          continue;
        case "j":
          digit = "6";
          break;
        case "k":
          digit = "4";
          break;
        case "l":
          if (next === "l") {
            digit = "7"; // LL sound
          } else {
            digit = "5";
          }
          break;
        case "m":
          digit = "6";
          break;
        case "n":
          if (next === "n") {
            digit = "7"; // NN sound (rare)
          } else {
            digit = "6";
          }
          break;
        case "ñ":
          digit = "7"; // Ñ sound
          break;
        case "p":
          digit = "1";
          break;
        case "q":
          digit = "4";
          break;
        case "r":
          if (next === "r" || i === 0) {
            digit = "8"; // RR or initial R
          } else {
            digit = "7";
          }
          break;
        case "s":
          digit = "8";
          break;
        case "t":
          digit = "3";
          break;
        case "w":
          digit = "1"; // Rare in Spanish
          break;
        case "x":
          digit = "48";
          break;
        case "y":
          digit = "7";
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
   * Spanish word endings
   */
  protected getCommonEndings(): string[] {
    return [
      //
      "o",
      "a",
      "os",
      "as",
      "e",
      "es",
      "ar",
      "er",
      "ir",
      "ado",
      "ada",
      "idos",
      "idas",
      "ando",
      "endo",
      "iendo",
      "cion",
      "sion",
      "dad",
      "tad",
      "mente",
      "oso",
      "osa",
      "ito",
      "ita",
      "illo",
      "illa",
    ];
  }

  /**
   * Spanish synonyms
   */
  getSynonyms(word: string): string[] {
    const synonymMap: Record<string, string[]> = {
      medico: [
        //
        "doctor",
        "facultativo",
      ],
      hospital: [
        //
        "clinica",
        "sanatorio",
      ],
      escuela: [
        //
        "colegio",
        "instituto",
      ],
      coche: [
        //
        "auto",
        "automovil",
        "vehiculo",
      ],
      casa: [
        //
        "hogar",
        "vivienda",
        "domicilio",
      ],
      calle: [
        //
        "via",
        "avenida",
        "carretera",
      ],
      ciudad: [
        //
        "urbe",
        "poblacion",
        "municipio",
      ],
      trabajo: [
        //
        "empleo",
        "ocupacion",
        "labor",
      ],
      dinero: [
        //
        "plata",
        "efectivo",
        "capital",
      ],
      tiempo: [
        //
        "momento",
        "periodo",
        "duracion",
      ],
      grande: [
        //
        "enorme",
        "gigante",
        "inmenso",
      ],
      pequeno: [
        //
        "chico",
        "diminuto",
        "minusculo",
      ],
      rapido: [
        //
        "veloz",
        "ligero",
        "acelerado",
      ],
      lento: [
        //
        "despacio",
        "pausado",
      ],
      bueno: [
        //
        "excelente",
        "magnifico",
        "estupendo",
      ],
      malo: [
        //
        "pesimo",
        "terrible",
        "horrible",
      ],
    };

    const normalized = this.normalize(word);
    return synonymMap[normalized] || [];
  }
}
