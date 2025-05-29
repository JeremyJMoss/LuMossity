"use client";
import PrimaryFormButton from "@/components/buttons/PrimaryFormButton";
import { useState } from "react";
import { redirect } from "next/navigation";

type APIErrorResponse = {
  message: string;
  invalid_fields: string[]
}

type APIIssue = {
  path: string;
  message: string
}

const CreateEntity = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<APIErrorResponse>({
    message: '',
    invalid_fields: []
  });

  const createEntity = (e: React.FormEvent<HTMLFormElement>) => {
    
    const sendCreateEntity = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);
      const name = formData.get("name");
      const entity_key = formData.get("entity_key");

      setIsSubmitting(true);
      setError({
        message: '',
        invalid_fields: []
      })

      try {
        const request = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/entities/create`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              entity_key,
            }),
          }
        )

        if (!request.ok) {
          const error = await request.json();
          setError({
            message: error.message,
            invalid_fields: error.issues?.map((issue: APIIssue) => {
              return issue.path;
            }) ?? []
          })
          return;
        }

        const response = await request.json();

        if (response.entity_key) {
          const entity_key = response.entity_key;
          redirect(`/entity-studio/${entity_key}`);
        } else {
          window.location.reload();
        }

      } catch (err: any) {
        setError({
          message: err.message,
          invalid_fields: []
        })
      } finally {
        setIsSubmitting(false);
      }
    }

    sendCreateEntity(e);
  }

  const getInputClassNames = (field_name : string) => {
      let inputClassNames = 'border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light';

      const errorBorderClass = 'border-red-500 bg-rose-100';
      const noErrorClass = 'border-gray-400 bg-stone-50';

      if (error.invalid_fields.includes(field_name)){
          inputClassNames += ' ' + errorBorderClass;
      } else {
          inputClassNames += ' ' + noErrorClass;
      }

      return inputClassNames;

  }

  return (
    <div className="px-10 py-5 flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Create Entity</h1>
      { error.message &&
              <div className="bg-red-300 text-center mb-2 rounded py-2 px-10">
                  <p className="font-semibold">{error.message}</p>
              </div>
      }
      <form className="border border-gray-300 p-5 rounded-lg shadow-md flex flex-col gap-4 bg-neutral-clay max-w-lg" onSubmit={(e) => createEntity(e)}>
        
        {/* Entity Name Field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="entityName" className="font-semibold text-sm">
            Entity Name
          </label>
          <input
            id="entityName"
            name="name"
            type="text"
            className={getInputClassNames('name')}
            placeholder="Enter entity name"
            aria-invalid={error.invalid_fields.includes("name")}
          />
        </div>

        {/* Entity Key Field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="entityKey" className="font-semibold text-sm">
            Entity Key
          </label>
          <input
            id="entityKey"
            name="entity_key"
            type="text"
            className={getInputClassNames('entity_key')}
            placeholder="Enter unique key"
            aria-invalid={error.invalid_fields.includes("entity_key")}
          />
        </div>

        {/* Submit Button */}
        <PrimaryFormButton
          className="mt-4 py-2 px-4"
          isSubmitting={isSubmitting}
        >
          Create Entity
        </PrimaryFormButton>
      </form>
    </div>
  )
}

export default CreateEntity;