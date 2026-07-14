import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { inputClass } from "@/components/formStyles";

export default function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select className={`${inputClass} w-full appearance-none pr-9`} {...props}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}
