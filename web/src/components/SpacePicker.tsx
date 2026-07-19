"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SPACE_OPTIONS, spaceMeta } from "@/lib/spaces";
import type { LabelOption } from "@/lib/use-labels";

type Props = {
  id?: string;
  label?: string;
  value: string;
  onChange: (key: string) => void;
  /** Extra options from admin labels (keys must match SPACE_OPTIONS for photos). */
  options?: LabelOption[];
  /** Allow clearing selection (browse filters). */
  allowAny?: boolean;
  anyLabel?: string;
  className?: string;
};

function photoFor(key: string) {
  return spaceMeta(key)?.image ?? null;
}

function hintFor(key: string) {
  return spaceMeta(key)?.hint ?? null;
}

export function SpacePicker({
  id,
  label = "Stuff will fit in",
  value,
  onChange,
  options,
  allowAny = false,
  anyLabel = "Any space",
  className = "",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const items =
    options && options.length > 0
      ? options.map((o) => ({
          key: o.key,
          label: o.label,
          image: photoFor(o.key),
          hint: hintFor(o.key),
        }))
      : SPACE_OPTIONS.map((s) => ({
          key: s.key,
          label: s.label,
          image: s.image,
          hint: s.hint,
        }));

  const selected =
    value === ""
      ? null
      : items.find((i) => i.key === value) ??
        (value
          ? { key: value, label: value, image: photoFor(value), hint: hintFor(value) }
          : null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(key: string) {
    onChange(key);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label ? (
        <label className="label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="field flex w-full items-center gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {selected?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.image}
            alt=""
            className="h-12 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : allowAny && !value ? (
          <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-mist text-xs text-slate">
            Any
          </span>
        ) : (
          <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-mist text-xs text-slate">
            —
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {selected?.label ?? (allowAny ? anyLabel : "Choose a space")}
          </span>
          {selected?.hint ? (
            <span className="mt-0.5 block truncate text-xs text-slate">{selected.hint}</span>
          ) : null}
        </span>
        <span className="shrink-0 text-slate" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-[var(--line)] bg-white p-2 shadow-[0_18px_40px_rgba(14,18,16,0.16)]"
        >
          {allowAny ? (
            <li role="option" aria-selected={value === ""}>
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-mist ${
                  value === "" ? "bg-sea-soft/60" : ""
                }`}
                onClick={() => choose("")}
              >
                <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-mist text-xs text-slate">
                  Any
                </span>
                <span className="font-medium">{anyLabel}</span>
              </button>
            </li>
          ) : null}
          {items.map((item) => (
            <li key={item.key} role="option" aria-selected={value === item.key}>
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-mist ${
                  value === item.key ? "bg-sea-soft/60" : ""
                }`}
                onClick={() => choose(item.key)}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-mist text-xs text-slate">
                    —
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block font-medium">{item.label}</span>
                  {item.hint ? (
                    <span className="mt-0.5 block text-xs text-slate">{item.hint}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Multi-select photo tiles for drivers listing available spaces. */
export function SpaceMultiPicker({
  label = "Stuff will fit in",
  values,
  onChange,
  options,
}: {
  label?: string;
  values: string[];
  onChange: (next: string[]) => void;
  options?: LabelOption[];
}) {
  const items =
    options && options.length > 0
      ? options.map((o) => ({
          key: o.key,
          label: o.label,
          image: photoFor(o.key),
          hint: hintFor(o.key),
        }))
      : SPACE_OPTIONS.map((s) => ({
          key: s.key,
          label: s.label,
          image: s.image,
          hint: s.hint,
        }));

  function toggle(key: string) {
    if (values.includes(key)) onChange(values.filter((v) => v !== key));
    else onChange([...values, key]);
  }

  return (
    <div>
      <p className="label">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const on = values.includes(item.key);
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(item.key)}
              className={`overflow-hidden rounded-2xl border text-left transition ${
                on
                  ? "border-sea ring-2 ring-sea/30"
                  : "border-[var(--line)] hover:border-sea/40"
              }`}
            >
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-mist text-xs text-slate">
                  {item.label}
                </div>
              )}
              <span className="block px-2.5 py-2">
                <span className="block text-sm font-semibold leading-tight">{item.label}</span>
                {item.hint ? (
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate">
                    {item.hint}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
