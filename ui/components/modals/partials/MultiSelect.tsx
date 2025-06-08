//----------Dependencies----------//
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
//----------End Dependencies----------//

//----------Types----------//
type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selected: Option[]; // Controlled
  onChange: (options: Option[]) => void;
};
//----------End Types----------//

const MultiSelect = ({ options, selected, onChange }: MultiSelectProps) => {
  //----------State----------//
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  //----------End State----------//

  //----------Derived State---------//
  const filteredOptions = useMemo(
    () => options.filter(option => !selected.includes(option)),
    [options, selected]
  );
  //----------End Derived State----------//

  //----------Effects----------//
  // Detect click outside of multi select
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
  //----------End Effects----------//

  //----------Handlers----------//
  // Toggle selected option
  const toggleOption = useCallback((option: Option) => {
    const alreadySelected = selected.find((selected_option) => selected_option.value === option.value);
    if (alreadySelected) {
      onChange(selected.filter((selected_option) => selected_option.value !== option.value));
    } else {
      onChange([...selected, option]);
    }
  }, [onChange, selected]);

  const handleToggleOption = useCallback((option: Option) => (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleOption(option);
  }, [toggleOption]);

  const handleOpen = useCallback(() => setIsOpen(prev => !prev), []);
  //----------End Handlers----------//

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className="border border-gray-400 bg-stone-50 px-3 py-2 rounded cursor-pointer flex flex-wrap gap-1"
        onClick={handleOpen}
      >
        {selected.length > 0 ? (
          selected.map((option) => (
            <span
              key={option.value}
              onClick={handleToggleOption(option)}
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
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={handleToggleOption(option)}
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
