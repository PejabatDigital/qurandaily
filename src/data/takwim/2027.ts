import type { TakwimYearSource } from "./types";

const takwim2027: TakwimYearSource = {
  year: 2027,
  source: "JAKIM e-Solat (www.e-solat.gov.my), fetched 2026-10-12",
  jan1: [22, "REJ", 1448],
  monthStarts: [
    ["01-10", "SYB", 1448],
    ["02-08", "RAM", 1448],
    ["03-10", "SYW", 1448],
    ["04-09", "ZKH", 1448],
    ["05-08", "ZHJ", 1448],
    ["06-06", "MUH", 1449],
    ["07-06", "SAF", 1449],
    ["08-04", "RAW", 1449],
    ["09-02", "RAK", 1449],
    ["10-02", "JAW", 1449],
    ["10-31", "JAK", 1449],
    ["11-30", "REJ", 1449],
    ["12-29", "SYB", 1449],
  ],
};

export default takwim2027;
