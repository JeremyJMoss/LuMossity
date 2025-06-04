import { useState, useEffect } from "react";
import CallToActionButton from "../buttons/CallToActionButton";
import PrimaryFormButton from "../buttons/PrimaryFormButton";
import LoadingSpinner from "../ui/LoadingSpinner";

type SelectBoxOption = {
    value: string;
    label: string;
}

type FieldConfigPageProps = {
  setStep: (num: number) => void,
  fieldType: string
}

type fieldConfig = {
  label: string,
  required: boolean,
  defaultValue: any,
  inputType: string,
  options?: [
    {
      label: string,
      value: any
    }
  ],
  conditionRender?: Record<string, boolean>,
  options_render?: string
}

const FieldConfigPage = ({setStep, fieldType}: FieldConfigPageProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [databaseColumnSelected, setDatabaseColumnSelected] = useState(false);
    const [fieldSetup, setFieldSetup] = useState<Record<string, fieldConfig>>({});

    const create_input = (field: Record<string, fieldConfig>) => {
      console.log(field);
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
            setError('');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadFields();
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
            </div>
            <div className="p-4 border-moss-dark border flex flex-col gap-4 rounded">
                <h2 className="font-semibold text-lg">Options</h2>
                <div className="grid grid-cols-2 items-center w-3/4 gap-4">
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