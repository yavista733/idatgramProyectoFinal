import React, { useState, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/UI';

const CameraScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<any>(null);

  React.useEffect(() => {
    if (permission?.status !== 'granted') {
      requestPermission();
    }
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      navigation.navigate('EditPhoto', { imageUri: photo.uri });
    }
  };

  if (!permission?.granted) {
    return <LoadingSpinner />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        facing={cameraType}
        style={{ flex: 1 }}
      />
      {/* Overlay de controles usando posición absoluta */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
            style={{ padding: 8 }}
          >
            <Ionicons name="camera-reverse" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 40, gap: 32 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Ionicons name="image-outline" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takePicture}
            style={{ height: 72, width: 72, borderRadius: 36, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ height: 60, width: 60, borderRadius: 30, backgroundColor: 'white' }} />
          </TouchableOpacity>

          <TouchableOpacity style={{ padding: 8 }}>
            <Ionicons name="flash-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default CameraScreen;
