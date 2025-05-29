"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "../ui/LoadingSpinner";
import CallToActionButton from "../buttons/CallToActionButton";
import PrimaryFormButton from "../buttons/PrimaryFormButton";

type Props = {
  entityKey: string;
  onClose: () => void;
  onSuccess: () => void;
};

type FieldPreset = {
    name: string;
    ID: number;
    config: any
}

const AddFieldModal = ({ entityKey, onClose, onSuccess }: Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [fieldConfig, setFieldConfig] = useState<number | null>(null);
    const [fieldConfigurations, setFieldConfigurations] = useState<FieldPreset[]>([]);
    const [step, setStep] = useState<number>(1);

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


    return (   
        <div className="fixed inset-0 bg-moss-dark/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
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
                                    <div
                                        key={config.ID}
                                        onClick={() => setFieldConfig(config.ID)}
                                        className={`p-4 border rounded cursor-pointer transition ${fieldConfig === config.ID ? "border-moss bg-moss-light/50" : "border-gray-300 hover:border-moss"}`}
                                        >
                                        <h4 className="font-semibold">{config.name}</h4>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <CallToActionButton
                                    onClick={(e) => setStep(2)}
                                    className="px-3 py-2"
                                >
                                    Next
                                </CallToActionButton>
                            </div>
                        </>
                    }
                    { step === 2 &&
                        <>
                            {fieldConfig !== null && fieldConfigurations.find(config => config.ID === fieldConfig)?.config &&
                                <form>
                                    <div className="grid grid-cols-3 gap-5 items-center">
                                        <div>
                                            <label className="font-semibold text-sm" htmlFor="uniqueFieldName">Unique Field Name</label>
                                            <input 
                                                className="border border-gray-400 bg-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light rounded"
                                                type="text" 
                                                name="field_name" 
                                                id="uniqueFieldName"
                                            />
                                        </div>
                                        {Object.entries(fieldConfigurations.find(config => config.ID === fieldConfig)!.config).map(([key, def_val]) => {
                                            return (
                                                <div className="flex flex-col">
                                                    <label className="font-semibold text-sm" htmlFor={key}>{key[0].toUpperCase() + key.slice(1)}</label>
                                                    <input 
                                                        className="border border-gray-400 bg-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light rounded"
                                                        id={key} type="text" 
                                                        defaultValue={String(def_val ?? "")} 
                                                    />
                                                </div>
                                            )
                                        })}
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <label className="font-semibold text-sm" htmlFor="isDbColumn">DB Column</label>
                                                <p className="text-xs font-medium">(setup database column<br/> or just metadata)</p>
                                            </div>
                                            <input type="checkbox" name="is_db_column" id="isDbColumn" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <label className="font-semibold text-sm" htmlFor="isQueryable">Queryable</label>
                                                <p className="text-xs font-medium">(Metadata will be used in <br/>single search queries)</p>
                                            </div>
                                            <input type="checkbox" name="is_queryable" id="isQueryable" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <label className="font-semibold text-sm" htmlFor="isRequired">Required</label>
                                                <p className="text-xs font-medium">(Data is required)</p>
                                            </div>
                                            <input type="checkbox" name="is_required" id="isRequired" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-10">
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
