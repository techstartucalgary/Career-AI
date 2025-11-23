import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import styles from './JobsExplorePage.styles';

const JobsExplorePage = () => {
  const router = useRouter();
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(1); // student is at index 1

  const filters = ['Latest', 'Student', 'Label', 'Label', 'Label']; // add labels you see relevant when we have this part figured out

  // mock job data, in real app, this would come from whatever API we use
  const jobs = [
    { id: 1, title: 'PWC', updated: 'today' },
    { id: 2, title: 'Rogers', updated: 'yesterday' },
    { id: 3, title: 'Title', updated: '2 days ago' },
    { id: 4, title: 'Title', updated: 'today' },
    { id: 5, title: 'Title', updated: 'yesterday' },
    { id: 6, title: 'Title', updated: '2 days ago' },
    { id: 7, title: 'Title', updated: 'today' },
    { id: 8, title: 'Title', updated: 'yesterday' },
    { id: 9, title: 'Title', updated: '2 days ago' },
    { id: 10, title: 'Title', updated: 'today' },
  ];

  const handleJobPress = (jobId) => {
    router.push(`/job/${jobId}`);
  };

  const renderJobCard = ({ item, index }) => {
    const isLastInRow = (index + 1) % 3 === 0;
    return (
      <Pressable 
        style={[
          styles.jobCard,
          isLastInRow && styles.jobCardLast
        ]}
        onPress={() => handleJobPress(item.id)}
      >
        <View style={styles.cardIconContainer}>
          <View style={styles.cardIcon}>
            <View style={styles.iconShape1} />
            <View style={styles.iconShape2} />
            <View style={styles.iconShape3} />
          </View>
        </View>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobUpdated}>Updated {item.updated}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* top navigation bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.pageTitle}>Explore Opportunities</Text>
        <Pressable style={styles.menuButton}>
          <Text style={styles.menuIcon}>⋮</Text>
        </Pressable>
      </View>

      {/* filter bar */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter, index) => (
            <Pressable
              key={index}
              style={[
                styles.filterButton,
                selectedFilterIndex === index && styles.filterButtonSelected
              ]}
              onPress={() => setSelectedFilterIndex(index)}
            >
              {selectedFilterIndex === index && (
                <Text style={styles.checkmark}>✓</Text>
              )}
              <Text
                style={[
                  styles.filterText,
                  selectedFilterIndex === index && styles.filterTextSelected
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* jobs grid */}
      <View style={styles.gridWrapper}>
        <FlatList
          data={jobs}
          renderItem={({ item, index }) => renderJobCard({ item, index })}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default JobsExplorePage;

