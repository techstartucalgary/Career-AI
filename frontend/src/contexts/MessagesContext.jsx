import React, { createContext, useContext, useState } from 'react';

const MessagesContext = createContext();

export const useMessages = () => {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider');
  }
  return context;
};

export const MessagesProvider = ({ children }) => {
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

  const openMessages = () => setIsMessagesOpen(true);
  const closeMessages = () => setIsMessagesOpen(false);
  const toggleMessages = () => setIsMessagesOpen(prev => !prev);

  return (
    <MessagesContext.Provider
      value={{
        isMessagesOpen,
        openMessages,
        closeMessages,
        toggleMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};

