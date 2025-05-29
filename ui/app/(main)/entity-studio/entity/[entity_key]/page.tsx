"use client";
import FieldConfigurationSection from "@/components/FieldConfigurationSection";
import AddFieldsModal from "@/components/modals/AddFieldsModal";
import UpdateEntityForm from "@/components/forms/UpdateEntityForm";
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from "react";

type Entity = {
    name: string;
    key: string;
    fields: []
}

const EntityFieldsPage = ()  => {
    const params = useParams() as {entity_key: string};
    const {entity_key} = params;

    const [addFieldsModalOpen, setAddFieldsModalOpen] = useState<boolean>(false);
    const [entity, setEntity] = useState<Entity>({
        name: '',
        key: '',
        fields: []
    });


    const getEntity = async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/entities/${entity_key}`, {
            cache: 'no-store',
            credentials: "include"
        });

        if (!res.ok) {
            return notFound();
        }

        const data = await res.json();

        const entity = data.entity;

        setEntity(entity);
    }

    useEffect(() => { 
        getEntity();
    }, []);

    

  return (
    <>
        <div className="px-10 py-5 flex flex-col gap-x-5">
            <h1 className="text-2xl font-semibold">{entity.name}</h1>
            <div className="flex gap-x-10 py-5">
                <FieldConfigurationSection
                    fields={entity.fields}
                    fieldReset={getEntity}
                    onAddFieldsClick={() => setAddFieldsModalOpen(true)}/>
                <UpdateEntityForm/>
            </div>
        </div>
        {
            addFieldsModalOpen && 
            <AddFieldsModal
                onClose={() => setAddFieldsModalOpen(false)}
                onSuccess={() => { getEntity() }}
                entityKey={entity_key}
            />
        }
    </>
  )
}

export default EntityFieldsPage