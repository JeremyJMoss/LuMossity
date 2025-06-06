import { useState, useEffect } from "react";
import CallToActionButton from "../buttons/CallToActionButton";
import PrimaryFormButton from "../buttons/PrimaryFormButton";
import LoadingSpinner from "../ui/LoadingSpinner";
import SelectBoxFieldConfigField from "../ui/SelectBoxFieldConfigField";
import MultiSelect from "./partials/MultiSelect";

type SelectBoxOption = {
    value: string;
    label: string;
}

type FieldConfigPageProps = {
  setStep: (num: number) => void,
  fieldType: string,
  fieldPresetConfig: any
}

type FieldConfig = {
  label: string,
  required: boolean,
  defaultValue: any,
  inputType: string,
  options?: [
    {
      label: string,
      value: string
    }
  ],
  conditionRender?: Record<string, boolean>,
  options_render?: string
}

const FieldConfigPage = ({setStep, fieldType, fieldPresetConfig}: FieldConfigPageProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [databaseColumnSelected, setDatabaseColumnSelected] = useState(false);
    const [fieldSetup, setFieldSetup] = useState<Record<string, FieldConfig>>({});
    const [checkboxStates, setCheckboxStates] = useState<Record<string, boolean>>({});
    const [selectBoxOptions, setSelectBoxOptions] = useState<Record<string, SelectBoxOption[]>>({});
    const [multiSelectedOptions, setMultiSelectedOptions] = useState<Record<string, SelectBoxOption[]>>({});

    const shouldRenderInput = (config: FieldConfig) => {
        let renderState = true;
        if (config.conditionRender !== undefined) {
            const checkBoxState = checkboxStates[Object.keys(config.conditionRender as Record<string, boolean>)[0]];
            
            if (checkBoxState !== undefined) {
                renderState = checkBoxState === Object.values(config.conditionRender)[0];
            }
        }

        return renderState;
    }

    const renderTextInput = ([field_key, config]: [string, FieldConfig]) => {
        const label = <label className="font-semibold text-sm" htmlFor={field_key}>{config.label}</label>;
        
        const input = 
                <input 
                    type={config.inputType} 
                    required={config.required}
                    className="border border-gray-400 bg-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light rounded" 
                    defaultValue={fieldPresetConfig[field_key] ?? config.defaultValue}
                    name={field_key}
                    id={field_key}
                />;

        const renderState = shouldRenderInput(config);
        
        return ( renderState && 
                <div className="flex flex-col gap-2" key={field_key}>
                    {label}
                    {input}
                </div>
        )

    }

    const renderSelectBox = ([field_key, config]: [string, FieldConfig]) => {
        const renderState = shouldRenderInput(config);

        const label = <label className="font-semibold text-sm" htmlFor={field_key}>{config.label}</label>;

        let renderedSelect = null;
        if (config.inputType === 'select' && fieldPresetConfig[field_key] === undefined){
            renderedSelect = 
                <select className="border border-gray-400 bg-stone-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light rounded">
                    {config.options && config.options.map((option) => {
                        return <option value={option.value}>{option.label}</option>
                    })}
                </select>;
        } else if (config.inputType == 'multi-select' && config.options) {
            renderedSelect = 
            <MultiSelect
                options={config.options}
                selected={multiSelectedOptions[field_key] ?? []}
                onChange={(newOptions) =>
                    setMultiSelectedOptions((prev) => ({
                        ...prev,
                        [field_key]: newOptions,
                    }))
                }
            />
        }

        return ( renderState && renderedSelect &&
            <div className="flex flex-col gap-2" key={field_key}>
                {label}
                {renderedSelect}
            </div>
        )
    }

    const renderOptions = ([field_key, config]: [string, FieldConfig]) => {
        const renderState = shouldRenderInput(config);
        
        return renderState && (
                    <SelectBoxFieldConfigField
                    title={config.label}
                    selectBoxOptions={selectBoxOptions[field_key] ?? []}
                    onChange={(newOptions) => setSelectBoxOptions(prev => {
                        return {
                            ...prev,
                            [field_key]: newOptions
                        }
                    })}
                    key={field_key}
                    />
        )
    }

    const renderCheckboxes = ([field_key, config]: [string, FieldConfig]) => {
        const renderState = shouldRenderInput(config);

        const checkboxValue = checkboxStates[field_key] ?? false;

        const setCheckBox = (field_key: string) => {
            setCheckboxStates(prev => ({
                ...prev,
                [field_key]: !prev[field_key]
            }));
        };

        const label = (
            <label className="font-semibold text-sm" htmlFor={field_key}>
                {config.label}
            </label>
        );

        const input = (
            <input
                type={config.inputType}
                required={config.required}
                checked={checkboxValue}
                onChange={() => setCheckBox(field_key)}
                id={field_key}
            />
        );

        return (
            renderState && fieldPresetConfig[field_key] === undefined && (
                <div className="flex gap-3" key={field_key}>
                    {label}
                    {input}
                </div>
            )
        );
    };

    const loadFields = async () => {
        setIsLoading(true);
        setError('');
        try {
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/field-types/${fieldType}/field-setup`, {
                credentials: "include"
            })

            if (!request.ok) {
                const error = await request.json();
                setError(error.message);
                return;
            }

            const response = await request.json();

            setFieldSetup(response.field_setup.fields);
            const defaultCheckboxStates: Record<string, boolean> = {}
    
            Object.entries(response.field_setup.fields as Record<string, FieldConfig>).forEach(([field_key, config]) => {
                if (config.inputType === 'checkbox'){
                    defaultCheckboxStates[field_key] = config.defaultValue;
                }
            })
    
            setCheckboxStates(defaultCheckboxStates);

            setError('');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadFields();
    },[fieldType])

    const addField = async (formData: FormData) => {
        console.log(formData);
    }  

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const checkboxNames = ['is_db_column', 'is_queryable', 'is_required'];

        checkboxNames.forEach(name => {
            if (!formData.has(name)) {
                formData.append(name, 'false');
            }
        });
        addField(formData);
    }
    
    return (
      <>
        {isLoading && <LoadingSpinner width="40px" height="40px"/>}
        {error && 
            <div className="bg-red-300 max-w-2xl mx-auto text-center mb-2 rounded py-2 px-10">
                <p className="font-semibold">{error}</p>
            </div>
        }
        {fieldSetup && 
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
                { 
                    Object.entries(fieldSetup).filter(([_, config]) => {
                        return ['text', 'number'].includes(config.inputType);
                    }).map((field) => {
                        return renderTextInput(field);
                    })
                }
                {
                    Object.entries(fieldSetup).filter(([_, config]) => {
                        return ['select', 'multi-select'].includes(config.inputType);
                    }).map((field) => {
                        return renderSelectBox(field);
                    })
                }
            </div>
            {   
                Object.entries(fieldSetup).filter(([_, config]) => {
                    return config.inputType === 'create_options';
                }).map((field) => {
                    return renderOptions(field);
                })
            }
            <div className="p-4 border-moss-dark border flex flex-col gap-4 rounded">
                <h2 className="font-semibold text-lg">Options</h2>
                <div className="grid grid-cols-2 items-center w-3/4 gap-4">
                    {
                        Object.entries(fieldSetup).filter(([_, config]) => {
                            return config.inputType === 'checkbox';
                        }).map(field => {
                            return renderCheckboxes(field);
                        })
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
    )
}

export default FieldConfigPage