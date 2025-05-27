"use client";
import { useState, useEffect } from "react";
import LoadingSpinner from "../ui/LoadingSpinner";
import Link from "next/link";
import CallToActionButton from "../buttons/CallToActionButton";
import { useRouter } from "next/navigation";

interface Entity {
    entity_name: string,
    entity_key: string
}


const StudioSubmenu = () => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const router = useRouter();

    const getEntities = async () => {
        setError('');
        setLoading(true);
        try {
            const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/entities/all`);
    
            if (!request.ok) {
                setError('Failed to load menu items');
            }

            const response = await request.json();

            setEntities(response.entities);

        } catch (err) {
            setError('Failed to load menu items');
        } finally {
            setLoading(false);
        }
    
    }

    useEffect(() => {
        getEntities();
    }, [])

    return (
        <>
            <h2 className="whitespace-nowrap text-lg border-b border-solid border-gray-300 pb-3 font-medium mb-4">Entity Studio</h2>
            <div className="flex flex-col items-center gap-2">
                {loading && <LoadingSpinner width="30px" height="30px"/> }
                {!loading && error && 
                    <div className="menu-error text-center mb">
                        <p className="text-xs text-red-500 mb-2">{error}</p>
                        <button onClick={getEntities} className="text-xs bg-moss-light px-3 py-1 rounded font-semibold">Refresh</button>
                    </div>
                }
                {entities.length > 0 && !loading && !error &&
                    <>
                        {entities.map((entity) => {
                            return (
                                <Link href={`/entity/${entity.entity_key}`} key={entity.entity_key}>{entity.entity_name}</Link>
                            )
                        })}
                        <CallToActionButton className="text-sm px-3 py-2" onClick={() => router.push("/entity-studio/create")}>
                            Add Entity
                        </CallToActionButton>
                    </>
                }
                {entities.length === 0 && !loading && !error &&
                    <>
                        <p className="text-sm text-center">No entities yet...</p>
                        <CallToActionButton className="text-sm px-3 py-2" onClick={() => router.push("/entity-studio/create")}>
                            Get Started
                        </CallToActionButton>
                    </>
                }
            </div>
        </>
    )
}

export default StudioSubmenu