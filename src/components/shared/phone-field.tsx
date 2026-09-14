'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { COUNTRIES, DIAL_CODES, findCountry } from '@/lib/config/countries';
import { locale } from '@/lib/config/brand';
import { cn } from '@/lib/utils';

/** The dial code for the configured country, e.g. 233 for Ghana. */
export const DEFAULT_DIAL_CODE =
  findCountry(locale.countryCode)?.dialCode ?? COUNTRIES[0].dialCode;

// Longest first, so +233 is not mistaken for +23.
const BY_LENGTH = [...DIAL_CODES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

/**
 * Splits a stored number into its dial code and the rest.
 *
 * Numbers are stored as one string, so an existing record has to be read back
 * into the two controls. Anything that does not start with a recognised prefix
 * keeps its digits and falls back to the configured country, rather than being
 * silently rewritten.
 */
export function splitPhone(value: string | null | undefined): {
  dialCode: string;
  national: string;
} {
  const trimmed = (value ?? '').trim();

  if (trimmed.startsWith('+')) {
    // Written by this control: "+233 24 123 4567". Everything after the first
    // space is the caller's own spacing and is handed back untouched.
    const spaced = trimmed.match(/^\+(\d+)\s([\s\S]*)$/);
    if (spaced && BY_LENGTH.some((entry) => entry.dialCode === spaced[1])) {
      return { dialCode: spaced[1], national: spaced[2] };
    }

    // Written anywhere else, or seeded: "+14155550200". Match the longest
    // known prefix and take the remainder.
    const digits = trimmed.slice(1).replace(/[^\d]/g, '');
    const match = BY_LENGTH.find((entry) => digits.startsWith(entry.dialCode));
    if (match) {
      return { dialCode: match.dialCode, national: digits.slice(match.dialCode.length) };
    }
  }

  return { dialCode: DEFAULT_DIAL_CODE, national: trimmed.replace(/^\+/, '') };
}

/**
 * Phone number with a country prefix.
 *
 * The value stays a single E.164-ish string so nothing downstream has to know
 * this control exists; the split is only for editing. An empty national part
 * stores an empty string rather than a bare dial code, so "no phone number"
 * does not become "+233".
 */
export function PhoneField({
  value,
  onChange,
  onBlur,
  name,
  id,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { dialCode, national } = splitPhone(value);

  /*
    The national part is stored exactly as typed, after a single space. Stripping
    the spacing on every keystroke would delete the separators out from under
    someone mid-number, because what is displayed is read back from the stored
    value. An empty national part stores nothing at all, so "no phone number"
    never becomes a bare "+233".
  */
  const compose = (nextDial: string, nextNational: string) => {
    const cleaned = nextNational.replace(/[^\d\s()-]/g, '');
    onChange(cleaned.trim() ? `+${nextDial} ${cleaned}` : '');
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Select
        value={dialCode}
        onValueChange={(next) => compose(next, national)}
        disabled={disabled}
      >
        {/* The trigger shows just the code so it stays narrow; the list carries
            the country name, which is what makes the code recognisable. */}
        <SelectTrigger className="w-[6rem] shrink-0" aria-label="Country dialling code">
          <span className="tabular">+{dialCode}</span>
        </SelectTrigger>
        <SelectContent>
          {DIAL_CODES.map((entry) => (
            <SelectItem key={entry.dialCode} value={entry.dialCode}>
              +{entry.dialCode} · {entry.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="24 123 4567"
        className="flex-1"
        disabled={disabled}
        value={national}
        onBlur={onBlur}
        onChange={(event) => compose(dialCode, event.target.value)}
      />
    </div>
  );
}
