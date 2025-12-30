import React from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useMessages } from '../contexts/MessagesContext';
import styles from './MessagesOverlay.styles';

const MessagesOverlay = () => {
  const { isMessagesOpen, closeMessages } = useMessages();
  // mock conversation data, in real app, this would come from API
  const conversations = [
    { id: 1, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
    { id: 2, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
    { id: 3, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
    { id: 4, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
    { id: 5, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
    { id: 6, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
    { id: 7, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
    { id: 8, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
    { id: 9, name: 'Name', preview: 'Supporting line text lore...', time: '10 min' },
  ];

  const handleConversationPress = (conversationId) => {
    console.log('Open conversation:', conversationId);
    // navigate to conversation detail
  };

  return (
    <Modal
      visible={isMessagesOpen}
      transparent
      animationType="none"
      onRequestClose={closeMessages}
    >
      <Pressable style={styles.backdrop} onPress={closeMessages}>
        <Pressable 
          style={styles.overlay}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Conversations</Text>
            <Pressable onPress={closeMessages} style={styles.closeButton}>
              <Text style={styles.closeIcon}>×</Text>
            </Pressable>
          </View>

          <ScrollView 
            style={styles.conversationList}
            contentContainerStyle={styles.conversationListContent}
            showsVerticalScrollIndicator={false}
          >
            {conversations.map((conversation) => (
              <Pressable
                key={conversation.id}
                style={styles.conversationItem}
                onPress={() => handleConversationPress(conversation.id)}
              >
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <View style={styles.avatarShape1} />
                    <View style={styles.avatarShape2} />
                    <View style={styles.avatarShape3} />
                  </View>
                </View>
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{conversation.name}</Text>
                    <Text style={styles.conversationTime}>{conversation.time}</Text>
                  </View>
                  <Text style={styles.conversationPreview} numberOfLines={1}>
                    {conversation.preview}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default MessagesOverlay;
