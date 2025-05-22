import { notFound } from 'next/navigation';
import { INTERNAL_API_URL } from '@/constants/constants';

interface Field {
  name: string;
  label: string;
  type: string;
}

interface EntityData {
  name: string;
  display_name: string;
  fields: Field[];
}

async function fetchEntityData(entity: string): Promise<EntityData | null> {
  const res = await fetch(`${INTERNAL_API_URL}/entities/${entity}`, {
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

interface EntityPageProps {
  params: {
    entity: string;
  };
}

export default async function EntityPage({ params }: EntityPageProps) {
  const { entity } = params;

  const data = await fetchEntityData(entity);
  if (!data) notFound();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{data.display_name}</h1>
      {data.fields.map((field) => (
        <div key={field.name} className="mb-4">
          <strong>{field.label}: </strong>
        </div>
      ))}
    </div>
  );
}
