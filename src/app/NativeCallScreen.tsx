import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Button, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';

export default function NativeCallScreen({ onBack }: { onBack: () => void }) {
  const [hasPerm, setHasPerm] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPerm(status === 'granted');
    })();
  }, []);

  if (hasPerm === null) return <View style={styles.c}><Text style={styles.t}>جارٍ طلب الصلاحية...</Text></View>;
  if (hasPerm === false) return <View style={styles.c}><Text style={styles.t}>لا صلاحية كاميرا</Text><Button title="رجوع" onPress={onBack} /></View>;

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={Camera.Constants.Type.front} />
      <View style={styles.ctrl}>
        <TouchableOpacity onPress={onBack} style={styles.btn}><Text style={styles.btnt}>← رجوع للتطبيق (فيديو ويب يعمل)</Text></TouchableOpacity>
        <Text style={{color:'#0f0', marginTop:8, fontSize:12}}>الصوت الآن عبر Android Native — تجاوز WebView HAL كليًا</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c:{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0b0b14'},
  t:{color:'#fff', fontSize:18},
  container:{flex:1, backgroundColor:'#0b0b14'},
  camera:{flex:1},
  ctrl:{position:'absolute', bottom:30, alignSelf:'center', backgroundColor:'#111', padding:16, borderRadius:16},
  btn:{backgroundColor:'#2b6bff', padding:12, borderRadius:10},
  btnt:{color:'#fff', fontWeight:'bold'}
});
