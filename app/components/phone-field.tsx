"use client";

const countryCodes = [
  { code: "+256", flag: "🇺🇬" },
  { code: "+254", flag: "🇰🇪" },
  { code: "+255", flag: "🇹🇿" },
  { code: "+250", flag: "🇷🇼" },
] as const;

export type CountryCode = (typeof countryCodes)[number]["code"];

export function PhoneField({
  code,
  onCode,
  number,
  onNumber,
  id,
}: {
  code: CountryCode;
  onCode: (code: CountryCode) => void;
  number: string;
  onNumber: (number: string) => void;
  id: string;
}) {
  return (
    <div className="flex gap-2">
      <label htmlFor={`${id}-code`} className="sr-only">
        Country code
      </label>
      <select
        id={`${id}-code`}
        value={code}
        onChange={(event) => onCode(event.target.value as CountryCode)}
        className="h-12 shrink-0 border-2 border-[#1B2129] bg-white px-2 font-mono text-sm outline-none"
      >
        {countryCodes.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.code}
          </option>
        ))}
      </select>
      <label htmlFor={id} className="sr-only">
        Phone
      </label>
      <input
        id={id}
        name="phone"
        type="tel"
        autoComplete="tel-national"
        placeholder="Phone"
        value={number}
        onChange={(event) => onNumber(event.target.value)}
        className="h-12 min-w-0 flex-1 border-2 border-[#1B2129] px-3 text-[15px] font-normal outline-none placeholder:text-[#28313D]/45"
      />
    </div>
  );
}

export function internationalPhone(code: string, local: string) {
  const digits = local.trim().replace(/\s/g, "").replace(/^0+/, "");
  if (!digits) return "";
  return `${code}${digits}`;
}
