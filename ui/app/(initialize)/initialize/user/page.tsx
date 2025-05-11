"use client";
const APIURL = process.env.NEXT_PUBLIC_API_URL;
import { useState } from "react";

const InitializeUser = () => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<{message: string, invalid_fields: string[]}>({
        message: '',
        invalid_fields: []
    });

    const submitInitialUser = async (e: React.FormEvent<HTMLFormElement>) => {
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

            const result = await response.json();

            if (!response.ok) {
                const { error, missing } = result;
    
                setError({
                    message: error || "Something went wrong.",
                    invalid_fields: Array.isArray(missing) ? missing : [],
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

  return (
    <form onSubmit={submitInitialUser} method="POST" action={APIURL + '/api/user/initial-user'}>
        <div>
            <label htmlFor=""></label>
            <input type="text" />
        </div>
        <div>
            <label htmlFor=""></label>
            <input type="text" />
        </div>
        <div>
            <label htmlFor=""></label>
            <input type="text" />
        </div>
    </form>
  )
}

export default InitializeUser;