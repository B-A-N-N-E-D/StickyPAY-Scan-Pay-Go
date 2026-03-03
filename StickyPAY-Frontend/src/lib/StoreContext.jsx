import { createContext, useState, useEffect } from "react";

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const [activeStore, setActiveStore] = useState(null);

    useEffect(() => {
        const savedStore = localStorage.getItem("sp_active_store");
        if (savedStore) {
            setActiveStore(JSON.parse(savedStore));
        }
    }, []);

    const saveStore = (storeData) => {
        localStorage.setItem("sp_active_store", JSON.stringify(storeData));
        setActiveStore(storeData);
    };

    const clearStore = () => {
        localStorage.removeItem("sp_active_store");
        setActiveStore(null);
    };

    return (
        <StoreContext.Provider value={{ activeStore, saveStore, clearStore }}>
            {children}
        </StoreContext.Provider>
    );
};