"use client";

import { useState, useEffect, useRef } from "react";
import LoadingSpinner from "../ui/LoadingSpinner";
import CallToActionButton from "../buttons/CallToActionButton";
import PrimaryFormButton from "../buttons/PrimaryFormButton";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import SelectBoxFieldConfigField from "../ui/SelectBoxFieldConfigField";

type Props = {
  entityKey: string;
  onClose: () => void;
  onSuccess: () => void;
};

type FieldPreset = {
    name: string;
    ID: number;
    field_type: string;
    config: any
}

type SelectBoxOption = {
    value: string;
    label: string;
}

const AddFieldModal = ({ entityKey, onClose, onSuccess }: Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [fieldConfig, setFieldConfig] = useState<number | null>(null);
    const [fieldConfigurations, setFieldConfigurations] = useState<FieldPreset[]>([]);
    const [step, setStep] = useState<number>(1);
    const [databaseColumnSelected, setDatabaseColumnSelected] = useState(false);
    const [selectBoxOptions, setSelectBoxOptions] = useState<SelectBoxOption[]>([]);
    
    const currentSelectedField = fieldConfigurations.find(config => config.ID === fieldConfig) ?? null;
    const currentFieldConfiguration = currentSelectedField?.config;
    const field_type = currentSelectedField?.field_type;

    const modalRef = useRef<HTMLDivElement | null>(null);

    useFocusTrap(modalRef, true);

    const isDisabled = fieldConfig === null;

    const loadFieldConfigurations = async () => {
        setIsLoading(true);
        setError('');
        try {
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/entities/field-presets`, {
                credentials: "include"
            })

            if (!request.ok) {
                const error = await request.json();
                setError(error.message);
                return;
            }

            const response = await request.json();

            console.log(response);
            setFieldConfigurations(response.field_presets);
            setError('');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadFieldConfigurations();
    },[])

    const addField = async (formData: FormData) => {
        console.log(formData);
    }  

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const checkboxNames = ['is_db_column', 'is_queryable', 'is_required'];

        checkboxNames.forEach(name => {
            if (!formData.has(name)) {
                formData.append(name, 'false'); // or '0' depending on your backend expectation
            }
        });
        addField(formData);
    }


    return (   
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-moss-dark/50 flex items-center justify-center z-50" onClick={onClose}>
            <div ref={modalRef} className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold">Add New Field</h3>
                    { step === 1 &&
                        <>
                            {isLoading && <LoadingSpinner width="40px" height="40px"/>}
                            {error && 
                                <div className="bg-red-300 max-w-2xl mx-auto text-center mb-2 rounded py-2 px-10">
                                    <p className="font-semibold">{error}</p>
                                </div>
                            }
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {!isLoading && fieldConfigurations.length > 0 && fieldConfigurations.map((config) => (
                                    <button
                                        key={config.ID}
                                        onClick={() => setFieldConfig(config.ID)}
                                        className={`p-4 border rounded cursor-pointer transition ${fieldConfig === config.ID ? "border-moss bg-moss-light/50" : "border-gray-300 hover:border-moss"}`}
                                        >
                                        <h4 className="font-semibold">{config.name}</h4>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <CallToActionButton
                                    onClick={(e) => setStep(2)}
                                    className="px-3 py-2"
                                    isDisabled={isDisabled}
                                >
                                    Next
                                </CallToActionButton>
                            </div>
                        </>
                    }
                    { step === 2 &&
                        <>
                            {fieldConfig && currentFieldConfiguration &&
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <div className="grid grid-cols-3 gap-5 items-center">
                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-sm" htmlFor="uniqueFieldName">Unique Field Name</label>
                                            <input 
                                                className="border border-gray-400 bg-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light rounded"
                                                type="text" 
                                                name="field_name" 
                                                id="uniqueFieldName"
                                            />
                                        </div>
                                        {Object.entries(currentFieldConfiguration).map(([key, def_val]) => {
                                            if ((field_type === 'select' || field_type === 'radio') && ['displayType', 'options', 'multiple', 'sort', 'entity'].includes(key)){
                                                return;
                                            }
                                            if (field_type === 'checkbox' && key === 'checked') {
                                                return;
                                            }
                                            if ((field_type === 'image' || field_type === 'file') && key === 'accept') {
                                                return;
                                            }
                                            return (
                                                <div className="flex flex-col gap-2" key={key}>
                                                    <label className="font-semibold text-sm" htmlFor={key}>{key[0].toUpperCase() + key.slice(1)}</label>    
                                                    <input 
                                                        className="border border-gray-400 bg-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light rounded"
                                                        id={key} type="text" 
                                                        placeholder={String(def_val ?? "")}
                                                        name={key}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {(field_type === 'select' || field_type === 'radio') && currentFieldConfiguration.options &&
                                        <SelectBoxFieldConfigField
                                            selectBoxOptions={selectBoxOptions}
                                            onChange={setSelectBoxOptions}/>
                                    }
                                    <div className="p-4 border-moss-dark border flex flex-col gap-4 rounded">
                                        <h2 className="font-semibold text-lg">Options</h2>
                                        
                                        <div className="grid grid-cols-2 items-center w-3/4 gap-4">
                                            {field_type === 'select' && currentFieldConfiguration.sort !== undefined &&
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-3">
                                                        <label className="font-semibold text-sm" htmlFor="sortOptions">Sort Options</label>
                                                        <input type="checkbox" name="sort_options" id="sortOptions"/>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Sort select options</p>
                                                </div>
                                            }
                                            { field_type === 'checkbox' && currentFieldConfiguration.checked !== undefined &&
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-3">
                                                        <label className="font-semibold text-sm" htmlFor="isChecked">Checked</label>
                                                        <input type="checkbox" name="is_checked" id="isChecked"/>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Field checked by default</p>
                                                </div>
                                            }
                                            <div className="flex flex-col gap-1">
                                                <div className="flex gap-3">
                                                    <label className="font-semibold text-sm" htmlFor="isDbColumn">DB Column</label>
                                                    <input type="checkbox" onChange={(e) => setDatabaseColumnSelected((prev) => !prev)} name="is_db_column" id="isDbColumn" value="true" checked={databaseColumnSelected}/>
                                                </div>
                                                <p className="text-xs text-gray-500">Setup directly in database table</p>
                                            </div>
                                            {!databaseColumnSelected && 
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-3">
                                                        <label className="font-semibold text-sm" htmlFor="isQueryable">Queryable</label>
                                                        <input type="checkbox" name="is_queryable" id="isQueryable" value="true"/>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Metadata will be used in single search queries</p>
                                                </div>
                                            }
                                            <div className="flex flex-col gap-1">
                                                <div className="flex gap-3">
                                                    <label className="font-semibold text-sm" htmlFor="isRequired">Required</label>
                                                    <input type="checkbox" name="is_required" id="isRequired" value="true"/>
                                                </div>
                                                <p className="text-xs text-gray-500">Data is required</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-10">
                                        <CallToActionButton
                                            type="secondary"
                                            onClick={() => setStep(1)}
                                            className="px-3 py-2"
                                        >
                                            Back
                                        </CallToActionButton>
                                        <PrimaryFormButton
                                            isSubmitting={false}
                                            className="px-3 py-2">
                                            Submit
                                        </PrimaryFormButton>
                                    </div>
                                </form>
                            }
                        </>
                    }
            </div>
        </div>
    );
};

export default AddFieldModal;
