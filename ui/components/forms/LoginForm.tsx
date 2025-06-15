"use client";
//----------Dependencies----------//
import { useCallback, useMemo } from "react";
import { useFetch } from "@/hooks/useFetch";
import SecondaryFormButton from "../buttons/SecondaryFormButton";
//----------End Dependencies----------//

//----------Constants----------//
const inputContainerClassNames = 'flex justify-between items-center text-lg text-moss-dark';
const errorBorderClass = 'border-red-500 border';
//----------End Constants----------//

const LoginForm = () => {
    //----------State----------//
    const {loading: isSubmitting, error, callFetch} = useFetch<{access_token: string}>( `${process.env.NEXT_PUBLIC_API_URL}/auth/login`);
    //----------End State----------//

    //----------Derived State----------//
    const invalidFields = useMemo( () => {
        if (!Array.isArray(error?.issues)) return [];

        const seen = new Set<string>();

        for (const issue of error.issues) {
            seen.add(issue.path);
        }
        
        return Array.from(seen);
    }, [error]);

    const getInputClassNames = useCallback((field_name : string) => {
        let inputClassNames = 'bg-neutral-clay w-3/4 rounded px-3 py-2';

        if ( invalidFields.includes( field_name ) ) {
            inputClassNames += ' ' + errorBorderClass;
        }

        return inputClassNames;
    }, [invalidFields])
    //----------End Derived State----------//

    //----------API Calls----------//
    const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());
            
        const result = await callFetch({
            method: "POST",
            body
        });

        if (result) {
            window.location.reload();
        }
    }
    //----------End API Calls----------//

    return (
        <>
            { error.message &&
                    <div className="bg-red-300 max-w-2xl mx-auto text-center mb-2 rounded py-2 px-10">
                        <p className="font-semibold">{error.message}</p>
                    </div>
            }
            <form className="max-w-2xl mx-auto flex flex-col gap-3 min-w-xl" onSubmit={loginUser}>
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