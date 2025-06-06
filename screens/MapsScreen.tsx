// MapScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, PermissionsAndroid, Platform, Text, ActivityIndicator, Image } from 'react-native';

const MapScreen = () => {
  const [isLoading, setIsLoading] = useState(false);


  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text>Place holder</Text>
      <Image source={require("../assets/placeholder.png")} style={{width: "100%", height: "100%"}} />
    </View>
  );
};

export default MapScreen;