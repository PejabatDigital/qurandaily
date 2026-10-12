import type { TakwimYearSource } from "./types";

const takwim2026: TakwimYearSource = {
  year: 2026,
  source: "JAKIM e-Solat (www.e-solat.gov.my), fetched 2026-10-12",
  jan1: [11, "REJ", 1447],
  monthStarts: [
    ["01-20", "SYB", 1447],
    ["02-19", "RAM", 1447],
    ["03-21", "SYW", 1447],
    ["04-19", "ZKH", 1447],
    ["05-18", "ZHJ", 1447],
    ["06-17", "MUH", 1448],
    ["07-16", "SAF", 1448],
    ["08-14", "RAW", 1448],
    ["09-13", "RAK", 1448],
    ["10-12", "JAW", 1448],
    ["11-11", "JAK", 1448],
    ["12-11", "REJ", 1448],
  ],
};

export default takwim2026;
