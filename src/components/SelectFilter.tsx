"use client";

// A dropdown filter that stores its choice in the URL, e.g. ?group=… .
// Reacting to a dropdown choice happens in the browser, so this is a client component.
// Like the date range buttons, the URL is the filter: links stay shareable.

import { useRouter } from "next/navigation";
import { useId } from "react";

interface SelectFilterProps {
  label: string; // visible label, e.g. "Campaign group"
  param: string; // the URL parameter, e.g. "group"
  allLabel: string; // the "no filter" option, e.g. "All campaign groups"
  options: { value: string; label: string }[];
  selected: string | null; // the chosen value, or null for "all"
  pathname: string; // the page, e.g. "/linkedin"
  keep?: Record<string, string>; // other filters to keep in the URL, e.g. { range: "28d" }
}

export default function SelectFilter({
  label,
  param,
  allLabel,
  options,
  selected,
  pathname,
  keep = {},
}: SelectFilterProps) {
  const router = useRouter();
  const id = useId(); // links the <label> to the <select> for screen readers

  function choose(value: string) {
    const query = new URLSearchParams(keep);
    if (value) query.set(param, value); // "all" removes the parameter instead
    const search = query.toString();
    router.push(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-600">
        {label}
      </label>
      <select
        id={id}
        value={selected ?? ""}
        onChange={(event) => choose(event.target.value)}
        // min-h-11 = 44px tall, like the date range buttons.
        className="min-h-11 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
