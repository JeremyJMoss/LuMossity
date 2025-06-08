//----------Dependencies----------//
import { create } from 'zustand';
//----------End Dependencies----------//

//----------Types----------//
type SideMenuItem = {
    entity_name: string,
    entity_key: string
}

type SideMenuState = {
  items: SideMenuItem[];
  fetchError: string;
  isLoading: boolean;
  fetchItems: () => Promise<void>;
}
//----------End Types----------//

//----------Global State Object----------//
export const useSideMenuStore = create<SideMenuState>((set) => ({
  items: [],
  fetchItems: async () => {
    set({isLoading: true});
    try {
      const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/entities/all`);
      if (!request.ok) {
        const error = await request.json();
        set({fetchError: error.message})
        return;
      }
      const data: {entities: SideMenuItem[]} = await request.json();
      set({ items: data.entities });
    } catch (error: any) {
      set({fetchError: error.message});
    } finally {
        set({isLoading: false});
    }
  },
  fetchError: '',
  isLoading: false
}));
//----------End Global State Object----------//
