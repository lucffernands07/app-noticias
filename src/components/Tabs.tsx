import { useRef } from "react";
import { CATEGORIES, type Category } from "@/types";

type Props = {
  active: Category;
  onChange: (c: Category) => void;
};

export function Tabs({ active, onChange }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-[57px] z-20 border-b border-white/5 bg-[#0a0a0b]/85 backdrop-blur-xl">
      <div
        ref={stripRef}
        className="no-scrollbar mx-auto flex max-w-3xl gap-1.5 overflow-x-auto px-3 py-2.5"
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === active;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={[
                "whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-cyan-400 text-[#0a0a0b] shadow-[0_0_20px_-4px_rgba(34,211,238,0.5)]"
                  : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-200",
              ].join(" ")}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
