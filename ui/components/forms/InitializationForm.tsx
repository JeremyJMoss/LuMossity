"use client";
import { useState } from "react";
import SecondaryFormButton from "../buttons/SecondaryFormButton";
import CallToActionButton from "../buttons/CallToActionButton";
const APIURL = process.env.NEXT_PUBLIC_API_URL;

const InitializationForm = () => {
    const [getStartedPressed, setGetStartedPressed] = useState<boolean>(false);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [ error, setError ] = useState<{ message: string; invalid_fields: string[] }>({
        message: '',
        invalid_fields: []
    });

    const submitInitializationConfig = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                let result;
                if (contentType?.includes("application/json")) {
                    result = await response.json();
                } else {
                    result = { message: await response.text(), issues: [] };
                }

                const { message, issues = [] } = result;

                const compiledErrors: string[] = [];
                for (const issue of issues) {
                    const key = issue.path;
                    if (!compiledErrors.includes(key)) {
                        compiledErrors.push(key);
                    }
                }
    
                setError({
                    message: message || "Something went wrong.",
                    invalid_fields: compiledErrors,
                });
    
                return;
            }
    
            // Successful
            setError({ message: "", invalid_fields: [] });

            window.location.reload();
    
        } catch (err: unknown) {
            console.error(err);
            setError({
                message: "A network error occurred. Please try again.",
                invalid_fields: [],
            });
        }
        finally {
            setIsSubmitting(false);
        }
    }

    let inputContainerClassNames = 'flex justify-between items-center text-lg text-moss-dark';

    const getInputClassNames = (field_name : string) => {
        let inputClassNames = 'bg-neutral-clay w-1/2 rounded px-3 py-2';

        const errorBorderClass = 'border-red-500 border';

        if (error.invalid_fields.includes(field_name)){
            inputClassNames += ' ' + errorBorderClass;
        }

        return inputClassNames;

    }

    return (
        <>
            { !getStartedPressed &&
                <div className="flex justify-center">
                    <CallToActionButton onClick={() => setGetStartedPressed(true)} className="px-6 py-2">
                        Get Started
                    </CallToActionButton>
                </div>
            }
            { error.message &&
                <div className="bg-red-300 max-w-xl mx-auto text-center mb-5 rounded py-2 px-10">
                    <p className="font-semibold">{error.message}</p>
                </div>
            }
            { getStartedPressed && 
                <form className="max-w-xl mx-auto flex flex-col gap-3" onSubmit={submitInitializationConfig} method="POST" action={APIURL + '/setup/database'}>
                    <div className={inputContainerClassNames}>
                        <label htmlFor="dbName">Database Name:</label>
                        <input id="dbName" name="database" type="text" className={getInputClassNames('database')}/>
                    </div>
                    <div className={inputContainerClassNames}>
                        <label htmlFor="dbUser">Database User:</label>
                        <input id="dbUser" name="user" type="text" className={getInputClassNames('user')}/>
                    </div>
                    <div className={inputContainerClassNames}>
                        <label htmlFor="dbPassword">Database Password:</label>
                        <input id="dbPassword" name="password" type="password" className={getInputClassNames('password')}/>
                    </div>
                    <div className="flex justify-center">
                        <SecondaryFormButton
                        isSubmitting={isSubmitting}>
                            Connect
                        </SecondaryFormButton>
                    </div>
                    
                </form>
            }
        </>
    )
}

export default InitializationForm;