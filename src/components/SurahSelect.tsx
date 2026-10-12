import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SURAHS } from "@/lib/quran-data";
import { cn } from "@/lib/utils";

interface SurahSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  invalid?: boolean;
}

const SurahSelect = ({ value, onValueChange, id, invalid }: SurahSelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger
      id={id}
      aria-invalid={invalid || undefined}
      className={cn(invalid && "border-2 border-destructive px-[11px]")}
    >
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
