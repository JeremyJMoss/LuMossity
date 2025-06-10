"use client";
//----------Dependencies----------//
import { useCallback, useState } from "react";
//----------End Dependencies----------//

//----------Types----------//
type SelectBoxOption = {
    value: string;
    label: string;
}

type SelectBoxFieldConfigFieldProps = {
    selectBoxOptions: SelectBoxOption[],
    onChange: (value: SelectBoxOption[]) => void
    title: string
}
//----------End Dependencies----------//

const SelectBoxFieldConfigField = ({selectBoxOptions, onChange, title}: SelectBoxFieldConfigFieldProps) => {
    //----------State----------//
    const [option, setOption] = useState<SelectBoxOption>({
        value: '',
        label: ''
    });
    //----------End State----------//

    //----------Handlers----------//
    const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setOption((prev) => ({
            ...prev,
            value: e.currentTarget.value
        }))
    }, [setOption]);

    const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setOption((prev) => ({
            ...prev,
            label: e.currentTarget.value
        }))
    }, [setOption]);

    const removeOption = useCallback((value: string) => {
        const filteredOptions = selectBoxOptions.filter(option => option.value !== value);
        onChange(filteredOptions);
    }, [selectBoxOptions, onChange])

    const removeOptionHandler = useCallback((value: string) => () => removeOption(value), [removeOption]);

    const addOption = useCallback(() => {
        // Prevent blank values
        if (!option.label.trim() || !option.value.trim()) return;
        // Prevent duplicates
        if (selectBoxOptions.some(o => o.value === option.value)) return;

        const newSelectBoxOptions = [...selectBoxOptions, option];

        onChange(newSelectBoxOptions);
        setOption({ value: '', label: '' });

    }, [selectBoxOptions, option, onChange, setOption])
    //----------End Handlers----------// 

    return (
        <div className="flex flex-col p-4 border-moss-dark border gap-4 rounded">
            <h2 className="font-semibold text-lg">{title}</h2>
            <div className="flex flex-col gap-4">
                { selectBoxOptions.length > 0 &&
                    <div className="flex items-center gap-3 flex-wrap">
                        {selectBoxOptions.map(({label, value}) => (
                            <div 
                            key={value} 
                            className="flex justify-between items-center bg-sunlight-soft gap-3 px-4 py-1 rounded-3xl"
                            >
                                <span className="font-medium">{label}</span>
                                <button
                                type="button"
                                onClick={removeOptionHandler(value)}
                                className="text-red-500 hover:text-red-700 cursor-pointer font-semibold"
                                >
                                ✕
                                </button>
                            </div>
                        ))}
                    </div>
                }
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="selectOptionLabel" className="font-semibold text-sm">Label</label>
                        <input 
                            type="text" 
                            className="border border-gray-400 bg-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light rounded" 
                            name="select_option_label" 
                            id="selectOptionLabel" 
                            value={option.label}
                            onChange={handleLabelChange}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="selectOptionValue" className="font-semibold text-sm">Value</label>
                        <input 
                            type="text" 
                            className="border border-gray-400 bg-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light rounded" 
                            name="select_option_value" 
                            id="selectOptionValue" 
                            value={option.value} 
                            onChange={handleValueChange}/>
                    </div>
                    <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-moss hover:underline self-end mb-3 cursor-pointer"
                    >
                        + Add Option
                    </button>
                </div>
            </div>
        </div>
    )
}

//----------Exports----------//
export default SelectBoxFieldConfigField
//----------End Exports----------//