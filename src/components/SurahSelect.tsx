import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SURAHS } from "@/lib/quran-data";

interface SurahSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const SurahSelect = ({ value, onValueChange }: SurahSelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="max-h-60">
      {SURAHS.map((s) => (
        <SelectItem key={s.number} value={String(s.number)}>
          {s.number}. {s.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default SurahSelect;
