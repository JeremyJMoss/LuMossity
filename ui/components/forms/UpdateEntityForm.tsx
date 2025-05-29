"use client";
import PrimaryFormButton from "../buttons/PrimaryFormButton";
import { useState } from "react";

const UpdateEntityForm = () => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  return (
    <form className="border border-gray-300 p-5 rounded-lg shadow-md flex flex-col gap-4 bg-neutral-clay">
        {/* Entity Name Field */}
        <div className="flex flex-col gap-1">
            <label htmlFor="entityName" className="font-semibold text-sm">
                Entity Name
            </label>
            <input
                id="entityName"
                name="name"
                type="text"
                className="border border-gray-400 bg-stone-50 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-light"
                placeholder="Enter entity name"
            />
        </div>
        {/* Update Button */}
        <PrimaryFormButton
        className="mt-2 py-2 px-4"
        isSubmitting={isSubmitting}
        >
            Update
        </PrimaryFormButton>
    </form>
  )
}

export default UpdateEntityForm