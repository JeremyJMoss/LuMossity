import { useState, useRef, useEffect } from "react";

type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selected: Option[]; // Controlled
  onChange: (options: Option[]) => void;
};

const MultiSelect = ({ options, selected, onChange }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Toggle selected option
  const toggleOption = (option: Option) => {
    const alreadySelected = selected.find((o) => o.value === option.value);
    if (alreadySelected) {
      onChange(selected.filter((o) => o.value !== option.value));
    } else {
      onChange([...selected, option]);
    }
  };

  // Detect outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className="border border-gray-400 bg-stone-50 px-3 py-2 rounded cursor-pointer flex flex-wrap gap-1"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selected.length > 0 ? (
          selected.map((option) => (
            <span
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(option);
              }}
              className="bg-moss-light text-sm text-moss-dark px-2 py-1 rounded"
            >
              {option.label}
            </span>
          ))
        ) : (
          <span className="text-gray-400">Select options</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-md max-h-60 overflow-y-auto">
          {options.filter(option => !selected.includes(option)).map((option) => (
            <div
              key={option.value}
              onClick={() => toggleOption(option)}
              className={`px-3 py-2 cursor-pointer hover:bg-moss-light`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
