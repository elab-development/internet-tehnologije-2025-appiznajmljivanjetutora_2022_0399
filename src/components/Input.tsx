import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className, ...props }: Props) {
  const classes = [
    "rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-200 transition focus:ring-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <input className={classes} {...props} />
  );
}
