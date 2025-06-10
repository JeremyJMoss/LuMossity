"use client";
//----------Dependencies----------//
import { useCallback, useEffect } from "react";
import LoadingSpinner from "../ui/LoadingSpinner";
import Link from "next/link";
import CallToActionButton from "../buttons/CallToActionButton";
import { useRouter } from "next/navigation";
import { useSideMenuStore } from "@/state_management/SidebarStore";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
//----------End Dependencies----------//


const StudioSubmenu = () => {
    //----------State----------//
    const {entities, getEntities, error, loading} = useStoreWithEqualityFn(
        useSideMenuStore,
        (state) => ({
            entities: state.items,
            getEntities: state.fetchItems,
            error: state.fetchError,
            loading: state.isLoading
        }), 
        shallow
    );

    const router = useRouter();
    //----------End State----------//

    //----------Derived State----------//
    const hasEntities = entities.length > 0;
    //----------End Derived State----------//


    //----------Effects----------//
    useEffect(() => { getEntities() }, [getEntities])
    //----------End Effects----------//
    
    //----------Handlers----------//
    const handleRouteToNewPage = useCallback((route: string) => () => router.push(route), [router]);
    //----------End Handlers----------//

    return (
        <>
            <h2 className="whitespace-nowrap text-lg border-b border-solid border-gray-300 pb-3 font-medium mb-4">Entity Studio</h2>
            <div className="flex flex-col items-center gap-2">
                {loading && <LoadingSpinner width="30px" height="30px"/> }
                {!loading && error && 
                    <div className="menu-error text-center">
                        <p className="text-xs text-red-500 mb-2">{error}</p>
                        <button onClick={getEntities} className="text-xs bg-moss-light px-3 py-1 rounded font-semibold">Refresh</button>
                    </div>
                }
                {hasEntities && !loading && !error &&
                    <div className="flex flex-col gap-2" role="list">
                        {entities.map((entity) => {
                            return (
                                <Link role="listitem" className="whitespace-nowrap hover:bg-moss-light/25 px-3 rounded py-1" href={`/entity-studio/entity/${entity.entity_key}`} key={entity.entity_key}>{entity.entity_name}</Link>
                            )
                        })}
                        <button role="listitem" className="text-left cursor-pointer text-moss whitespace-nowrap" onClick={handleRouteToNewPage("/entity-studio/create")}>
                            + Create new entity
                        </button>
                    </div>
                }
                {!hasEntities && !loading && !error &&
                    <>
                        <p className="text-sm text-center">No entities yet...</p>
                        <CallToActionButton className="text-sm px-3 py-2" onClick={handleRouteToNewPage("/entity-studio/create")}>
                            Get Started
                        </CallToActionButton>
                    </>
                }
            </div>
        </>
    )
}

//----------Exports----------//
export default StudioSubmenu
//----------End Exports----------//