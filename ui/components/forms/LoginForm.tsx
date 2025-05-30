"use client";
import { useState } from "react";
import SecondaryFormButton from "../buttons/SecondaryFormButton";
const APIURL = process.env.NEXT_PUBLIC_API_URL;

const LoginForm = () => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [ error, setError ] = useState<{ message: string; invalid_fields: string[] }>({
        message: '',
        invalid_fields: []
    });

    const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
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
                credentials: "include"
            });

            const result = await response.json();

            if (!response.ok) {
                const { error, issues = [] } = result;

                const compiledErrors: string[] = [];
                for (const issue of issues) {
                    const key = issue.path;
                    if (!compiledErrors.includes(key)) {
                        compiledErrors.push(key);
                    }
                }
    
                setError({
                    message: error || "Something went wrong.",
                    invalid_fields: compiledErrors,
                });
    
                return;
            }
    
            // Successful
            setError({ message: "", invalid_fields: [] });

            window.location.reload();
    
        } catch (err: unknown) {
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
        let inputClassNames = 'bg-neutral-clay w-3/4 rounded px-3 py-2';

        const errorBorderClass = 'border-red-500 border';

        if (error.invalid_fields.includes(field_name)){
            inputClassNames += ' ' + errorBorderClass;
        }

        return inputClassNames;

    }

    return (
        <>
            { error.message &&
                    <div className="bg-red-300 max-w-2xl mx-auto text-center mb-2 rounded py-2 px-10">
                        <p className="font-semibold">{error.message}</p>
                    </div>
            }
            <form className="max-w-2xl mx-auto flex flex-col gap-3 min-w-xl" onSubmit={loginUser} method="POST" action={APIURL + '/auth/login'}>
                <div className={inputContainerClassNames}>
                    <label htmlFor="emailAddress">Email Address:</label>
                    <input id="emailAddress" name="email" type="email" minLength={1} className={getInputClassNames('email')}/>
                </div>
                <div className={inputContainerClassNames}>
                    <label htmlFor="password">Password:</label>
                    <input id="password" name="password" type="password" minLength={1} className={getInputClassNames('password')}/>
                </div>
                <div className="flex justify-center">
                    <SecondaryFormButton
                    isSubmitting={isSubmitting}>
                        Submit
                    </SecondaryFormButton>
                </div>
            </form>
        </>
    )
}

export default LoginForm;