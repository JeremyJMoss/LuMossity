"use client";
//----------Dependencies----------//
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import LoadingSpinner from "../ui/LoadingSpinner";
import CallToActionButton from "../buttons/CallToActionButton";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import FieldConfigPage from "./FieldConfigPage";
import { useAutoFetch } from "@/hooks/useAutoFetch";
//----------End Dependencies----------//

//----------Types----------//
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
//----------End Types----------//

const AddFieldModal = ({ entityKey, onClose, onSuccess }: Props) => {
    //----------State----------//
    const {isLoading, error, data} = useAutoFetch<{ field_presets: FieldPreset[]}>(`${process.env.NEXT_PUBLIC_API_URL}/field-types/field-presets`)
    const [fieldConfig, setFieldConfig] = useState<number | null>(null);
    const [step, setStep] = useState<number>(1);
    const modalRef = useRef<HTMLDivElement | null>(null);
    //----------End State----------//

    //----------Derived State----------//

    const fieldConfigurations: FieldPreset[] = data?.field_presets ?? [];
    const field_type = useMemo(() => fieldConfigurations.find(config => config.ID === fieldConfig)?.field_type ?? null, [fieldConfig, fieldConfigurations]);
    const fieldPresetConfig = useMemo(() => fieldConfigurations.find(config => config.ID === fieldConfig)?.config ?? null, [fieldConfig, fieldConfigurations]);
    const isDisabled = fieldConfig === null;
    //----------End Derived State----------//

    //----------Effects----------//
    useFocusTrap(modalRef, true);
    //----------End Effects----------//

    //----------Handlers----------//
    const handleChooseFieldType = useCallback((id: number) => () => setFieldConfig(id), []);
    //----------End Handlers----------//

    //----------Renderers----------//
    const fieldButtons = useMemo(() => {
        return fieldConfigurations.map((config) => (
            <button
                key={config.ID}
                onClick={handleChooseFieldType(config.ID)}
                className={`p-4 border rounded cursor-pointer transition ${fieldConfig === config.ID ? "border-moss bg-moss-light/50" : "border-gray-300 hover:border-moss"}`}
                >
                <h4 className="font-semibold">{config.name}</h4>
            </button>
        ))
    }, [fieldConfigurations, fieldConfig])
    //----------End Renderers----------//

    return (   
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-moss-dark/50 flex items-center justify-center z-50" onClick={onClose}>
            <div ref={modalRef} className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold">Add New Field</h3>
                    { step === 1 &&
                        <>
                            {isLoading && <LoadingSpinner width="40px" height="40px"/>}
                            {error?.message && 
                                <div className="bg-red-300 max-w-2xl mx-auto text-center mb-2 rounded py-2 px-10">
                                    <p className="font-semibold">{error.message}</p>
                                </div>
                            }
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {!isLoading && fieldButtons}
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
                            fieldPresetConfig={fieldPresetConfig}
                        />
                    }
            </div>
        </div>
    );
};

//----------Exports----------//
export default AddFieldModal;
//----------End Exports----------//