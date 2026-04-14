/**
 * Pantalla de Búsqueda / Explorar
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSearchStore } from '../store/searchStore';
import { Avatar, EmptyState, LoadingSpinner } from '../components/UI';

const SearchScreen = ({ navigation }: any) => {
  const [searchInput, setSearchInput] = useState('');
  const { results, isLoading, searchUsersAndPosts, clearSearch } = useSearchStore();

  const handleSearch = (text: string) => {
    setSearchInput(text);
    if (text.trim()) searchUsersAndPosts(text);
    else clearSearch();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color="#8e8e8e" />
          <TextInput
            placeholder="Buscar usuarios..."
            value={searchInput}
            onChangeText={handleSearch}
            style={styles.input}
            placeholderTextColor="#8e8e8e"
            returnKeyType="search"
          />
          {searchInput ? (
            <TouchableOpacity onPress={() => { setSearchInput(''); clearSearch(); }}>
              <Ionicons name="close-circle" size={18} color="#8e8e8e" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
              style={styles.userRow}
            >
              <Avatar source={item.profileImageUrl} size="md" />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.username}</Text>
                <Text style={styles.userSub}>{item.displayName}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={searchInput ? 'Sin resultados' : 'Explorar'}
              message={searchInput ? `Sin resultados para "${searchInput}"` : 'Busca personas en Idatgram'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: { paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#dbdbdb' },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#efefef', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  input: { flex: 1, marginLeft: 6, fontSize: 14, color: '#000' },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#dbdbdb' },
  userInfo: { marginLeft: 12, flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#000' },
  userSub: { fontSize: 13, color: '#8e8e8e', marginTop: 2 },
});

export default SearchScreen;

