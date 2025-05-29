"use client";

import CallToActionButton from "./buttons/CallToActionButton"

type Field = {
    field_name: string;
    field_type: string;
    is_queryable: boolean;
    is_required: boolean;
    is_db_column: boolean;
}

type FieldConfigurationProps = {
    fields: Field[],
    fieldReset: () => void,
    onAddFieldsClick: (e: React.MouseEvent) => void
}

const FieldConfigurationSection = ({fields, fieldReset, onAddFieldsClick}: FieldConfigurationProps) => {
  return (
    <div className="border border-gray-300 p-5 rounded-lg shadow-md flex flex-col gap-4 bg-neutral-clay">
        <div className="flex gap-3 items-center">
            <h2 className="text-xl font-semibold">Create and Update Fields</h2>
            <CallToActionButton
                onClick={onAddFieldsClick}
                className="px-3 py-1"
            >
                + Add Field
            </CallToActionButton>

        </div>
        {/* Table */}
      <form className="overflow-x-auto w-full">
        <table className="min-w-full table-auto border border-gray-300 rounded-md text-sm sm:text-base">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left border-b whitespace-nowrap">Name</th>
              <th className="px-4 py-2 text-left border-b whitespace-nowrap">Type</th>
              <th className="px-4 py-2 text-left border-b whitespace-nowrap">Required</th>
              <th className="px-4 py-2 text-left border-b whitespace-nowrap">DB Column</th>
              <th className="px-4 py-2 text-left border-b whitespace-nowrap">Queryable</th>
              <th className="px-4 py-2 text-left border-b whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.length > 0 && fields.map((field) => (
              <tr key={field.field_name} className="bg-white hover:bg-gray-50">
                <td className="px-4 py-2 border-b whitespace-nowrap">{field.field_name}</td>
                <td className="px-4 py-2 border-b whitespace-nowrap">{field.field_type}</td>
                <td className="px-4 py-2 border-b whitespace-nowrap">
                  {field.is_required ? "Yes" : "No"}
                </td>
                <td className="px-4 py-2 border-b whitespace-nowrap">
                  {field.is_db_column ? "Yes" : "No"}
                </td>
                <td className="px-4 py-2 border-b whitespace-nowrap">
                  {field.is_db_column ? "N/A" : (field.is_queryable ? "Yes" : "No")}
                </td>
                <td className="px-4 py-2 border-b whitespace-nowrap space-x-2">
                  <button
                    type="button"
                    className="text-moss hover:underline"
                    onClick={() => {}}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-500 hover:underline"
                    onClick={() => {}}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {fields.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No fields yet. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </form>
    </div>
  )
}

export default FieldConfigurationSection