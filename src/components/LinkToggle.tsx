import Link from "next/link";

interface LinkToggleProps<T extends string> {
  label: string; // what the choice is about, for screen readers, e.g. "Search terms"
  param: string; // the URL parameter, e.g. "terms"
  options: { value: T; label: string }[];
  selected: T;
  defaultValue: T; // the option that needs no parameter in the URL, e.g. "all"
  pathname: string; // the page, e.g. "/website"
  keep?: Record<string, string>; // other filters to keep in the URL, e.g. { range: "28d" }
}

// A small row of options that look like buttons, e.g. All / Brand / Non-brand.
// Like DateRangeFilter, each option is a plain link to the same page with a different
// URL parameter, so the choice is shareable and needs no JavaScript.
// scroll={false}: the page stays where it is instead of jumping back to the top.
// self-start: only as wide as its options, even inside a Card (which stretches its children).
export default function LinkToggle<T extends string>({
  label,
  param,
  options,
  selected,
  defaultValue,
  pathname,
  keep = {},
}: LinkToggleProps<T>) {
  return (
    <nav aria-label={label} className="inline-flex self-start rounded-lg border border-gray-200 bg-white p-1">
      {options.map((option) => {
        const isSelected = option.value === selected;
        const query = new URLSearchParams(keep);
        if (option.value !== defaultValue) query.set(param, option.value);
        const search = query.toString();
        return (
          <Link
            key={option.value}
            href={search ? `${pathname}?${search}` : pathname}
            scroll={false}
            aria-current={isSelected ? "true" : undefined}
            // min-h-11 = 44px, like the date range buttons.
            className={
              isSelected
                ? "flex min-h-11 items-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors duration-200"
                : "flex min-h-11 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100"
            }
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
