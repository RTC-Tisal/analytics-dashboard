import { Info } from "lucide-react";

interface InfoTipProps {
  id: string; // unique on the page, links the button to its text for screen readers
  label: string; // what the tip explains, e.g. "Sessions"
  text: string; // the explanation itself
}

// A small ⓘ button that shows `text` on hover (mouse), focus (keyboard Tab) or tap (phone).
// Pure CSS (Tailwind's group-hover / group-focus-within), so no browser JavaScript is needed.
//
// Placement: the pop-up is positioned against the nearest parent with `relative` (Card's
// header), so it spans the card's width and can never run off the edge of the screen.
export default function InfoTip({ id, label, text }: InfoTipProps) {
  return (
    <span className="group">
      {/* 44×44px tap area (h-11 w-11), pulled in with -m-3.5 so the icon looks small. */}
      <button
        type="button"
        aria-label={`What is ${label}?`}
        aria-describedby={id}
        className="-m-3.5 flex h-11 w-11 items-center justify-center rounded-full text-gray-400 transition-colors duration-150 hover:text-gray-700 focus-visible:text-gray-700 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Info aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
      </button>
      {/* Hidden until hover/focus. Screen readers still read it through aria-describedby. */}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute inset-x-0 top-full z-10 mt-2 rounded-md bg-gray-900 px-3 py-2 text-xs leading-relaxed font-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 motion-reduce:transition-none"
      >
        {text}
      </span>
    </span>
  );
}
