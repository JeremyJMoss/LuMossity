"use client";
import PrimaryFormButton from "@/components/buttons/PrimaryFormButton";
import { useState } from "react";

type Errors = {
  message: string;
  invalid_fields: string[]
}

const CreateEntity = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<Errors>({
    message: '',
    invalid_fields: []
  });

  const createEntity = (e: React.FormEvent) => {
    e.preventDefault();
    const sendCreateEntity = async () => {
      setIsSubmitting(true);
      setError({
        message: '',
        invalid_fields: []
      })

      try {
        const request = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/entities/create`, {
            method: "POST",
            credentials: "include"
          }
        )

        if (!request.ok) {
          const response = await request.json();
          setError({
            message: response.error,
            invalid_fields: response.issues?.map((issue: {path: string, message: string}) => {
              return issue.path;
            })
          })
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

    sendCreateEntity()
  }

  return (
    <div className="px-10 py-5 flex flex-col gap-5 max-w-lg">
      <h1 className="text-2xl font-semibold">Create Entity</h1>
      <form className="border border-gray-300 p-5 rounded-lg shadow-md flex flex-col gap-4" onSubmit={(e) => createEntity(e)}>
        
        {/* Entity Name Field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="entityName" className="font-semibold text-sm">
            Entity Name
          </label>
          <input
            id="entityName"
            name="entityName"
            type="text"
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light"
            placeholder="Enter entity name"
          />
        </div>

        {/* Entity Key Field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="entityKey" className="font-semibold text-sm">
            Entity Key
          </label>
          <input
            id="entityKey"
            name="entityKey"
            type="text"
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light"
            placeholder="Enter unique key"
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