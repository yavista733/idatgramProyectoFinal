/**
 * Pantalla de Visor de Historias
 */

import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserActiveStories, recordStoryView } from '../../database/storyRepository';
import type { Story } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/UI';

const { width, height } = Dimensions.get('window');

const StoryViewerScreen = ({ route, navigation }: any) => {
  const { userId, storyIndex = 0 } = route.params;
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(storyIndex);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadStories();
  }, [userId]);

  const loadStories = async () => {
    setIsLoading(true);
    try {
      const data = await getUserActiveStories(userId);
      setStories(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (user && currentIndex < stories.length - 1) {
      const next = currentIndex + 1;
      await recordStoryView(stories[next].id, user.id);
      setCurrentIndex(next);
    } else {
      navigation.goBack();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else navigation.goBack();
  };

  if (isLoading) return <LoadingSpinner />;

  if (stories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sin historias</Text>
      </View>
    );
  }

  const story = stories[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={{ uri: story.imageUrl }} style={styles.image} resizeMode="cover" />

      {/* Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top']}>
        {/* Progress bars */}
        <View style={styles.progressRow}>
          {stories.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                { backgroundColor: i <= currentIndex ? '#fff' : 'rgba(255,255,255,0.3)' },
              ]}
            />
          ))}
        </View>

        {/* Close btn */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Text overlay */}
        {story.text ? (
          <View
            style={[
              styles.textOverlay,
              { backgroundColor: story.backgroundColor || 'rgba(0,0,0,0.5)' },
            ]}
          >
            <Text style={[styles.storyText, { color: story.textColor || '#fff' }]}>
              {story.text}
            </Text>
          </View>
        ) : null}

        {/* Tap areas for navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navArea} onPress={handlePrev} />
          <TouchableOpacity style={styles.navArea} onPress={handleNext} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { width, height },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  progressRow: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  progressBar: { flex: 1, height: 2, borderRadius: 1 },
  topRow: { flexDirection: 'row', paddingHorizontal: 12 },
  closeBtn: { padding: 8 },
  textOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 10,
    padding: 14,
  },
  storyText: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  navRow: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  navArea: { flex: 1 },
  emptyContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', fontSize: 18 },
});

export default StoryViewerScreen;
