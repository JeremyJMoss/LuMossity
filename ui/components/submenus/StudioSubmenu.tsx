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

type Entities = Entity[];

const StudioSubmenu = () => {
    const [submenuItems, setSubmenuItems] = useState<Entities | []>([]);
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

            setSubmenuItems(response.entities);

        } catch (err) {
            setError('Failed to load menu items');
        } finally {
            setLoading(false);
        }
    
    }

    useEffect(() => {
        getEntities();
    }, [])

    const retryFetchMenu = () => {
        getEntities();
    }

    const handleGoToStudio = (e: React.MouseEvent, href: string) => {

        router.push(href);
    }

    return (
        <>
            <h2 className="whitespace-nowrap text-lg border-b border-solid border-gray-300 pb-3 font-medium mb-4">Entity Studio</h2>
            <div className="flex flex-col items-center gap-2">
                {submenuItems.length > 0 && !loading && !error &&
                    submenuItems.map((entity) => {
                        return (
                            <Link href={`/entity/${entity.entity_key}`} key={entity.entity_key}>{entity.entity_name}</Link>
                        )
                    })
                }
                {submenuItems.length === 0 && !loading && !error &&
                    <>
                        <p className="text-sm text-center">No entities yet...</p>
                        <CallToActionButton className="text-sm px-3 py-2" onClick={(e) => handleGoToStudio(e, "/entity-manager")}>
                            Get Started
                        </CallToActionButton>
                    </>
                }
                {loading &&
                    <LoadingSpinner
                    width="30px"
                    height="30px"/> 
                }
                {error && 
                    <div className="menu-error text-center mb">
                        <p className="text-xs text-red-500 mb-2">{error}</p>
                        <button onClick={retryFetchMenu} className="text-xs bg-moss-light px-3 py-1 rounded font-semibold">Refresh</button>
                    </div>
                }
            </div>
        </>
    )
}

export default StudioSubmenu