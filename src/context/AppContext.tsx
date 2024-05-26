"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useRouter } from "next/navigation";

type AppProviderProps = {
  children: React.ReactNode;
};

type AppContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  selectedRoomId: string | null;
  setSelectedRoomId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedRoomName: string | null;
  setSelectedRoomName: React.Dispatch<React.SetStateAction<string | null>>;
};

const defaultContextData = {
  user: null,
  setUser: () => {},
  selectedRoomId: null,
  setSelectedRoomId: () => {},
  selectedRoomName: null,
  setSelectedRoomName: () => {},
};

const AppContext = createContext<AppContextType>(defaultContextData);

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, userAuth => {
      setUser(userAuth);
      if (!user) router.push("/auth/login");
    });

    return () => unsubscribe();
  }, [router, user]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        selectedRoomId,
        setSelectedRoomId,
        selectedRoomName,
        setSelectedRoomName,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
