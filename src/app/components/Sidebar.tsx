"use client";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { auth, db } from "../../../firebase";
import { useAppContext } from "@/context/AppContext";

export type Room = {
  id: string;
  name: string;
  createdAt: Timestamp;
};

const Sidebar = () => {
  const { user, setSelectedRoomId, setSelectedRoomName } = useAppContext();

  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      const roomCollectionRef = collection(db, "rooms");
      const q = query(
        roomCollectionRef,
        where("userId", "==", user ? user.uid : ""),
        orderBy("createdAt"),
      );
      const unsubscribe = onSnapshot(q, querySnapshot => {
        const rooms: Room[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          createdAt: doc.data().createdAt,
        }));
        setRooms(rooms);
      });

      return () => unsubscribe();
    };
    fetchRooms();
  }, [user]);

  const selectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedRoomName(rooms.find(room => room.id === roomId)?.name || null);
  };

  const addNewRoom = async () => {
    const roomName = prompt("Enter room name");
    if (roomName) {
      await addDoc(collection(db, "rooms"), {
        name: roomName,
        userId: user ? user.uid : "",
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="bg-custom-blue h-full overflow-y-auto px-5 flex flex-col">
      <div className="flex-grow">
        <div
          onClick={addNewRoom}
          className="cursor-pointer flex justify-evenly items-center border mt-2 rounded-md hover:bg-blue-800 duration-150"
        >
          <span className="text-white p-4 text-2xl">＋</span>
          <h1 className="text-white text-xl font-semibold p-4">New Chat</h1>
        </div>
        <ul>
          {rooms.map(room => (
            <li
              key={room.id}
              className="cursor-pointer border-b p-4 text-slate-100 hover:bg-slate-700 duration-150"
              onClick={() => selectRoom(room.id)}
            >
              {room.name}
            </li>
          ))}
        </ul>
      </div>
      {user && (
        <div className="mb-2 p-4 text-slate-100 text-lg font-medium break-words">
          {user.email}
        </div>
      )}
      <div
        onClick={handleLogout}
        className="text-lg flex-grow-0 flex items-center justify-evenly mb-2 cursor-pointer p-4 text-slate-100 hover:bg-slate-700 duration-150"
      >
        <BiLogOut />
        <span>ログアウト</span>
      </div>
    </div>
  );
};

export default Sidebar;
