import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";
type Size = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  const classes = [
    "rounded-xl text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
    size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5",
    variant === "primary" && "bg-green-600 text-white hover:bg-green-700",
    variant === "secondary" &&
      "border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
    variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      {...props}
    />
  );
}
