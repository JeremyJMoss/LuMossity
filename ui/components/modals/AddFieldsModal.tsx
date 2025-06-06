"use client";

import { useState, useEffect, useRef } from "react";
import LoadingSpinner from "../ui/LoadingSpinner";
import CallToActionButton from "../buttons/CallToActionButton";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import FieldConfigPage from "./FieldConfigPage";

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

const AddFieldModal = ({ entityKey, onClose, onSuccess }: Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [fieldConfig, setFieldConfig] = useState<number | null>(null);
    const [fieldConfigurations, setFieldConfigurations] = useState<FieldPreset[]>([]);
    const [step, setStep] = useState<number>(1);

    const field_type = fieldConfigurations.find(config => config.ID === fieldConfig)?.field_type ?? null;
    const fieldPresetConfig = fieldConfigurations.find(config => config.ID === fieldConfig)?.config ?? null;

    const modalRef = useRef<HTMLDivElement | null>(null);

    useFocusTrap(modalRef, true);

    const isDisabled = fieldConfig === null;

    const loadFieldConfigurations = async () => {
        setIsLoading(true);
        setError('');
        try {
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/field-types/field-presets`, {
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-moss-dark/50 flex items-center justify-center z-50" onClick={onClose}>
            <div ref={modalRef} className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
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
                                    onClick={() => setStep(2)}
                                    className="px-3 py-2"
                                    isDisabled={isDisabled}
                                >
                                    Next
                                </CallToActionButton>
                            </div>
                        </>
                    }
                    { step === 2 && field_type &&
                        <FieldConfigPage
                        setStep={setStep}
                        fieldType={field_type}
                        fieldPresetConfig={fieldPresetConfig}/>
                    }
            </div>
        </div>
    );
};

export default AddFieldModal;
