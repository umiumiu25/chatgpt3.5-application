"use client";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { db } from "../../../firebase";
import { useAppContext } from "@/context/AppContext";
import OpenAI from "openai";
import LoadingIcons, { Bars } from "react-loading-icons";

type Message = {
  id: string;
  text: string;
  sender: string;
  createdAt: Timestamp;
};

const Chat = () => {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const { selectedRoomId, selectedRoomName } = useAppContext();
  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [composing, setComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // 各Roomにおけるメッセージを取得
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedRoomId === null) return;
      const roomDocRef = doc(db, "rooms", selectedRoomId);
      const messagesCollectionRef = collection(roomDocRef, "messages");
      const q = query(messagesCollectionRef, orderBy("createdAt"));
      const unsubscribe = onSnapshot(q, querySnapshot => {
        const messages = querySnapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Message),
        );
        setMessages(messages);
      });

      return () => unsubscribe();
    };
    fetchMessages();
  }, [selectedRoomId]);

  const sendMessage = async () => {
    if (selectedRoomId === null) return;
    if (inputMessage.trim() === "") return;
    const roomDocRef = doc(db, "rooms", selectedRoomId);
    const messagesCollectionRef = collection(roomDocRef, "messages");
    const messageData = {
      text: inputMessage,
      sender: "user",
      createdAt: serverTimestamp(),
    };
    await addDoc(messagesCollectionRef, messageData);

    setIsLoading(true);

    // openAIからの返信
    const gpt3Response = await openai.chat.completions.create({
      messages: [{ role: "user", content: inputMessage }],
      model: "gpt-3.5-turbo",
    });

    const botResponse = gpt3Response.choices[0].message.content;
    const messageBotData = {
      text: botResponse,
      sender: "bot",
      createdAt: serverTimestamp(),
    };
    await addDoc(messagesCollectionRef, messageBotData);
    setIsLoading(false);
    setInputMessage("");
  };

  return (
    <div className="bg-gray-500 h-full p-4 flex flex-col">
      <h1 className="text-2xl text-white font-semibold mb-4">
        {selectedRoomId ? selectedRoomName : "Select a Room"}
      </h1>
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`${
              message.sender === "user" ? "text-right" : "text-left"
            } mb-2`}
          >
            <div
              className={`${
                message.sender === "user" ? "bg-blue-500" : "bg-green-500"
              } inline-block rounded px-4 py-2`}
            >
              <p className="text-white font-medium">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef}></div>
        {isLoading && <LoadingIcons.TailSpin />}
      </div>
      <div className="flex-grow-0 relative">
        <input
          type="text"
          placeholder="Send a Message"
          className="border-2 rounded w-full focus:outline-none p-2"
          onChange={e => setInputMessage(e.target.value)}
          value={inputMessage}
          onKeyDown={e => e.key === "Enter" && !composing && sendMessage()}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
        />
        <button
          className="absolute inset-y-0 top-0 right-4 flex items-center"
          onClick={() => sendMessage()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default Chat;
