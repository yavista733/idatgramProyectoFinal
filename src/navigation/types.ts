/**
 * Rutas de navegación para Idatgram
 */

// Stack de Autenticación
export const AuthStack = {
  Login: 'Login',
  Register: 'Register',
};

// Stack Principal (Bottom Tabs)
export const MainStack = {
  Home: 'Home',
  Search: 'Search',
  Add: 'Add',
  Activity: 'Activity',
  Profile: 'Profile',
};

// Stack de Detalles
export const DetailStack = {
  PostDetail: 'PostDetail',
  UserProfile: 'UserProfile',
  Comments: 'Comments',
  Followers: 'Followers',
  Following: 'Following',
  StoryViewer: 'StoryViewer',
  EditProfile: 'EditProfile',
  Settings: 'Settings',
  SavedPosts: 'SavedPosts',
  Likes: 'Likes',
};

// Stack de Cámara
export const CameraStack = {
  TakePhoto: 'TakePhoto',
  EditPhoto: 'EditPhoto',
};

export type RootStackParamList = {
  // Auth
  [AuthStack.Login]: undefined;
  [AuthStack.Register]: undefined;

  // Main
  [MainStack.Home]: undefined;
  [MainStack.Search]: undefined;
  [MainStack.Add]: undefined;
  [MainStack.Activity]: undefined;
  [MainStack.Profile]: undefined;

  // Details
  [DetailStack.PostDetail]: { postId: string };
  [DetailStack.UserProfile]: { userId: string };
  [DetailStack.Comments]: { postId: string };
  [DetailStack.Followers]: { userId: string };
  [DetailStack.Following]: { userId: string };
  [DetailStack.StoryViewer]: { userId: string; storyIndex: number };
  [DetailStack.EditProfile]: undefined;
  [DetailStack.Settings]: undefined;
  [DetailStack.SavedPosts]: undefined;
  [DetailStack.Likes]: { postId: string };

  // Camera
  [CameraStack.TakePhoto]: undefined;
  [CameraStack.EditPhoto]: { imageUri: string };
};
