/**
 * Navegador Principal de Idatgram
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';

// Screens
import HomeScreen from '../screens/Home';
import SearchScreen from '../screens/Search';
import AddPostScreen from '../screens/AddPost';
import ActivityScreen from '../screens/Activity';
import ProfileScreen from '../screens/Profile';
import LoginScreen from '../screens/auth/Login';
import RegisterScreen from '../screens/auth/Register';
import PostDetailScreen from '../screens/details/PostDetail';
import UserProfileScreen from '../screens/details/UserProfile';
import CommentsScreen from '../screens/details/Comments';
import FollowersScreen from '../screens/details/Followers';
import FollowingScreen from '../screens/details/Following';
import StoryViewerScreen from '../screens/details/StoryViewer';
import EditProfileScreen from '../screens/settings/EditProfile';
import SettingsScreen from '../screens/settings/Settings';
import SavedPostsScreen from '../screens/profile/SavedPosts';
import LikesScreen from '../screens/details/Likes';
import CameraScreen from '../screens/camera/Camera';
import EditPhotoScreen from '../screens/camera/EditPhoto';

import { AuthStack, MainStack, DetailStack, CameraStack, RootStackParamList } from './types';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/**
 * Stack de autenticación
 */
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={AuthStack.Login} component={LoginScreen} />
      <Stack.Screen name={AuthStack.Register} component={RegisterScreen} />
    </Stack.Navigator>
  );
};

/**
 * Stack de tabs principales
 */
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeFeed" component={HomeScreen} />
      <Stack.Screen name={DetailStack.PostDetail} component={PostDetailScreen} />
      <Stack.Screen name={DetailStack.StoryViewer} component={StoryViewerScreen} />
      <Stack.Screen name={DetailStack.UserProfile} component={UserProfileScreen} />
      <Stack.Screen name={DetailStack.Likes} component={LikesScreen} />
      <Stack.Screen name={DetailStack.Comments} component={CommentsScreen} />
      <Stack.Screen name={DetailStack.Followers} component={FollowersScreen} />
      <Stack.Screen name={DetailStack.Following} component={FollowingScreen} />
    </Stack.Navigator>
  );
};

const SearchStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SearchFeed" component={SearchScreen} />
      <Stack.Screen name={DetailStack.UserProfile} component={UserProfileScreen} />
      <Stack.Screen name={DetailStack.Followers} component={FollowersScreen} />
      <Stack.Screen name={DetailStack.Following} component={FollowingScreen} />
    </Stack.Navigator>
  );
};

const AddStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AddFeed" component={AddPostScreen} />
      <Stack.Screen name={CameraStack.TakePhoto} component={CameraScreen} />
      <Stack.Screen name={CameraStack.EditPhoto} component={EditPhotoScreen} />
    </Stack.Navigator>
  );
};

const ActivityStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ActivityFeed" component={ActivityScreen} />
      <Stack.Screen name={DetailStack.PostDetail} component={PostDetailScreen} />
      <Stack.Screen name={DetailStack.UserProfile} component={UserProfileScreen} />
      <Stack.Screen name={DetailStack.Likes} component={LikesScreen} />
      <Stack.Screen name={DetailStack.Comments} component={CommentsScreen} />
      <Stack.Screen name={DetailStack.Followers} component={FollowersScreen} />
      <Stack.Screen name={DetailStack.Following} component={FollowingScreen} />
    </Stack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileFeed" component={ProfileScreen} />
      <Stack.Screen name={DetailStack.PostDetail} component={PostDetailScreen} />
      <Stack.Screen name={DetailStack.Comments} component={CommentsScreen} />
      <Stack.Screen name={DetailStack.Likes} component={LikesScreen} />
      <Stack.Screen name={DetailStack.UserProfile} component={UserProfileScreen} />
      <Stack.Screen name={DetailStack.Followers} component={FollowersScreen} />
      <Stack.Screen name={DetailStack.Following} component={FollowingScreen} />
      <Stack.Screen name={DetailStack.SavedPosts} component={SavedPostsScreen} />
      <Stack.Screen name={DetailStack.EditProfile} component={EditProfileScreen} />
      <Stack.Screen name={DetailStack.Settings} component={SettingsScreen} />
    </Stack.Navigator>
  );
};

/**
 * Stack principal con bottom tabs
 */
const MainStackNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopColor: '#E4E4E4',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home-outline';

          if (route.name === MainStack.Home) {
            iconName = 'home-outline';
          } else if (route.name === MainStack.Search) {
            iconName = 'search-outline';
          } else if (route.name === MainStack.Add) {
            iconName = 'add-circle-outline';
          } else if (route.name === MainStack.Activity) {
            iconName = 'heart-outline';
          } else if (route.name === MainStack.Profile) {
            iconName = 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name={MainStack.Home} 
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen 
        name={MainStack.Search} 
        component={SearchStackNavigator}
        options={{ tabBarLabel: 'Explorar' }}
      />
      <Tab.Screen 
        name={MainStack.Add} 
        component={AddStackNavigator}
        options={{ tabBarLabel: 'Crear' }}
      />
      <Tab.Screen 
        name={MainStack.Activity} 
        component={ActivityStackNavigator}
        options={{ tabBarLabel: 'Actividad' }}
      />
      <Tab.Screen 
        name={MainStack.Profile} 
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Navegador raíz
 */
export const RootNavigator = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <NavigationContainer>
      {user ? <MainStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
