// JAKIM zones (static — sourced from api.waktusolat.app/zones)
export type Zone = { code: string; negeri: string; daerah: string };

export const ZONES: Zone[] = [
  { code: "JHR01", negeri: "Johor", daerah: "Pulau Aur dan Pulau Pemanggil" },
  { code: "JHR02", negeri: "Johor", daerah: "Johor Bahru, Kota Tinggi, Mersing, Kulai" },
  { code: "JHR03", negeri: "Johor", daerah: "Kluang, Pontian" },
  { code: "JHR04", negeri: "Johor", daerah: "Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak" },
  { code: "KDH01", negeri: "Kedah", daerah: "Kota Setar, Kubang Pasu, Pokok Sena" },
  { code: "KDH02", negeri: "Kedah", daerah: "Kuala Muda, Yan, Pendang" },
  { code: "KDH03", negeri: "Kedah", daerah: "Padang Terap, Sik" },
  { code: "KDH04", negeri: "Kedah", daerah: "Baling" },
  { code: "KDH05", negeri: "Kedah", daerah: "Bandar Baharu, Kulim" },
  { code: "KDH06", negeri: "Kedah", daerah: "Langkawi" },
  { code: "KDH07", negeri: "Kedah", daerah: "Puncak Gunung Jerai" },
  { code: "KTN01", negeri: "Kelantan", daerah: "Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku" },
  { code: "KTN02", negeri: "Kelantan", daerah: "Gua Musang (Galas, Bertam), Jeli, Lojing" },
  { code: "MLK01", negeri: "Melaka", daerah: "Seluruh Negeri Melaka" },
  { code: "NGS01", negeri: "Negeri Sembilan", daerah: "Tampin, Jempol" },
  { code: "NGS02", negeri: "Negeri Sembilan", daerah: "Jelebu, Kuala Pilah, Rembau" },
  { code: "NGS03", negeri: "Negeri Sembilan", daerah: "Port Dickson, Seremban" },
  { code: "PHG01", negeri: "Pahang", daerah: "Pulau Tioman" },
  { code: "PHG02", negeri: "Pahang", daerah: "Kuantan, Pekan, Muadzam Shah" },
  { code: "PHG03", negeri: "Pahang", daerah: "Jerantut, Temerloh, Maran, Bera, Chenor, Jengka" },
  { code: "PHG04", negeri: "Pahang", daerah: "Bentong, Lipis, Raub" },
  { code: "PHG05", negeri: "Pahang", daerah: "Genting Sempah, Janda Baik, Bukit Tinggi" },
  { code: "PHG06", negeri: "Pahang", daerah: "Cameron Highlands, Genting Highlands, Bukit Fraser" },
  { code: "PHG07", negeri: "Pahang", daerah: "Rompin (Mukim Rompin, Endau, Pontian)" },
  { code: "PRK01", negeri: "Perak", daerah: "Tapah, Slim River, Tanjung Malim" },
  { code: "PRK02", negeri: "Perak", daerah: "Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar" },
  { code: "PRK03", negeri: "Perak", daerah: "Lenggong, Pengkalan Hulu, Grik" },
  { code: "PRK04", negeri: "Perak", daerah: "Temengor, Belum" },
  { code: "PRK05", negeri: "Perak", daerah: "Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor" },
  { code: "PRK06", negeri: "Perak", daerah: "Selama, Taiping, Bagan Serai, Parit Buntar" },
  { code: "PRK07", negeri: "Perak", daerah: "Bukit Larut" },
  { code: "PLS01", negeri: "Perlis", daerah: "Seluruh Negeri Perlis" },
  { code: "PNG01", negeri: "Pulau Pinang", daerah: "Seluruh Negeri Pulau Pinang" },
  { code: "SBH01", negeri: "Sabah", daerah: "Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Sukau" },
  { code: "SBH02", negeri: "Sabah", daerah: "Beluran, Telupid, Pinangah, Terusan, Kuamut" },
  { code: "SBH03", negeri: "Sabah", daerah: "Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Tawau (Timur)" },
  { code: "SBH04", negeri: "Sabah", daerah: "Bandar Tawau, Balong, Merotai, Kalabakan" },
  { code: "SBH05", negeri: "Sabah", daerah: "Kudat, Kota Marudu, Pitas, Pulau Banggi" },
  { code: "SBH06", negeri: "Sabah", daerah: "Gunung Kinabalu" },
  { code: "SBH07", negeri: "Sabah", daerah: "Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan" },
  { code: "SBH08", negeri: "Sabah", daerah: "Pensiangan, Keningau, Tambunan, Nabawan" },
  { code: "SBH09", negeri: "Sabah", daerah: "Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pasia, Membakut, Weston" },
  { code: "SWK01", negeri: "Sarawak", daerah: "Limbang, Lawas, Sundar, Trusan" },
  { code: "SWK02", negeri: "Sarawak", daerah: "Miri, Niah, Bekenu, Sibuti, Marudi" },
  { code: "SWK03", negeri: "Sarawak", daerah: "Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu" },
  { code: "SWK04", negeri: "Sarawak", daerah: "Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit" },
  { code: "SWK05", negeri: "Sarawak", daerah: "Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai" },
  { code: "SWK06", negeri: "Sarawak", daerah: "Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkelili, Betong, Spaoh, Pusa, Saratok" },
  { code: "SWK07", negeri: "Sarawak", daerah: "Serian, Simunjan, Samarahan, Sebuyau, Meludam" },
  { code: "SWK08", negeri: "Sarawak", daerah: "Kuching, Bau, Lundu, Sematan" },
  { code: "SWK09", negeri: "Sarawak", daerah: "Zon Khas (Kampung Patarikan)" },
  { code: "SGR01", negeri: "Selangor", daerah: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
  { code: "SGR02", negeri: "Selangor", daerah: "Kuala Selangor, Sabak Bernam" },
  { code: "SGR03", negeri: "Selangor", daerah: "Klang, Kuala Langat" },
  { code: "TRG01", negeri: "Terengganu", daerah: "Kuala Terengganu, Marang, Kuala Nerus" },
  { code: "TRG02", negeri: "Terengganu", daerah: "Besut, Setiu" },
  { code: "TRG03", negeri: "Terengganu", daerah: "Hulu Terengganu" },
  { code: "TRG04", negeri: "Terengganu", daerah: "Dungun, Kemaman" },
  { code: "WLY01", negeri: "Wilayah Persekutuan", daerah: "Kuala Lumpur, Putrajaya" },
  { code: "WLY02", negeri: "Wilayah Persekutuan", daerah: "Labuan" },
];

export const DEFAULT_ZONE = "WLY01";

export function zoneByCode(code: string): Zone | undefined {
  return ZONES.find((z) => z.code === code);
}

export type DayPrayer = {
  day: number;
  hijri: string;
  fajr: number;
  syuruk: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

export type MonthResponse = {
  zone: string;
  year: number;
  month: string;
  month_number: number;
  prayers: DayPrayer[];
};

export async function fetchSolatMonth(
  zone: string,
  year: number,
  month: number,
): Promise<MonthResponse> {
  const url = `https://api.waktusolat.app/v2/solat/${zone}?year=${year}&month=${month}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Solat API ${res.status}`);
  return res.json();
}

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kuala_Lumpur",
});

export function formatPrayerTime(unix: number): string {
  return TIME_FMT.format(new Date(unix * 1000));
}

export const PRAYER_LABELS: { key: keyof Omit<DayPrayer, "day" | "hijri">; label: string }[] = [
  { key: "fajr", label: "Subuh" },
  { key: "syuruk", label: "Syuruk" },
  { key: "dhuhr", label: "Zohor" },
  { key: "asr", label: "Asar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isyak" },
];
