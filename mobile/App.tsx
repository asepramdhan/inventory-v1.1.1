import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Vibration,
  SafeAreaView,
  StatusBar,
  Switch,
  Image as RNImage,
  Animated,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface ScannedPackage {
  id: string;
  invoice_number: string;
  waybill_number: string | null;
  package_proof: string;
  store_name: string;
  platform: string;
  scanned_at: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [serverUrl, setServerUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [userName, setUserName] = useState('');
  const [screen, setScreen] = useState<'LOGIN' | 'MAIN'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SCANNER' | 'HISTORY'>('DASHBOARD');

  // Scanner States
  const [barcode, setBarcode] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [history, setHistory] = useState<ScannedPackage[]>([]);
  const [autoCapture, setAutoCapture] = useState(true);
  const [flash, setFlash] = useState<boolean>(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const [manualBarcode, setManualBarcode] = useState('');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [showHistory, setShowHistory] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showTips, setShowTips] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const cameraRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load saved credentials on startup
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const savedUrl = await AsyncStorage.getItem('@server_url');
        const savedToken = await AsyncStorage.getItem('@auth_token');
        const savedName = await AsyncStorage.getItem('@user_name');
        const savedHistory = await AsyncStorage.getItem('@scan_history');

        if (savedUrl) setServerUrl(savedUrl);
        if (savedToken) {
          setToken(savedToken);
          setScreen('MAIN');
        }
        if (savedName) setUserName(savedName);
        if (savedHistory) setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to load credentials:', err);
      }
    })();
  }, []);

  // Beep sound player
  const playBeep = async (isSuccess: boolean) => {
    try {
      const soundObject = new Audio.Sound();
      const soundUrl = isSuccess
        ? 'https://www.soundjay.com/buttons/button-3.mp3'
        : 'https://www.soundjay.com/buttons/button-10.mp3';
      await soundObject.loadAsync({ uri: soundUrl });
      await soundObject.playAsync();
      soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          soundObject.unloadAsync();
        }
      });
    } catch (err) {
      console.log('Failed to play sound beep, falling back to vibration');
    }
  };

  // Vibe feedback
  const triggerHaptic = (isSuccess: boolean) => {
    if (isSuccess) {
      Vibration.vibrate(80);
    } else {
      Vibration.vibrate([0, 100, 80, 200]);
    }
  };

  const fetchStats = async () => {
    if (!serverUrl || !token) return;
    try {
      const response = await fetch(`${serverUrl}/api/mobile/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPendingCount(data.pending_count);
      }
    } catch (err) {
      console.log('Failed to fetch stats:', err);
    }
  };

  // Listen to keyboard show/hide events to dynamically push up inputs
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Fetch stats whenever we are on dashboard tab or credentials load
  useEffect(() => {
    if (screen === 'MAIN' && serverUrl && token) {
      fetchStats();
    }
  }, [token, serverUrl, screen, activeTab]);

  // Auto-hide scanner tips with a smooth fade animation
  useEffect(() => {
    if (activeTab === 'SCANNER') {
      setShowTips(true);
      fadeAnim.setValue(0);
      
      // Fade in (350ms)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      // Fade out after 4 seconds (takes 1 second to fade out)
      const fadeOutTimer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setShowTips(false);
        });
      }, 4000);

      return () => clearTimeout(fadeOutTimer);
    } else {
      setShowTips(false);
      fadeAnim.setValue(0);
    }
  }, [activeTab]);

  const handleLogin = async () => {
    if (!serverUrl || !email || !password) {
      alert('Silakan lengkapi semua bidang input.');
      return;
    }

    setIsUploading(true);
    let cleanUrl = serverUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    try {
      const response = await fetch(`${cleanUrl}/api/mobile/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await AsyncStorage.setItem('@server_url', cleanUrl);
        await AsyncStorage.setItem('@auth_token', data.token);
        await AsyncStorage.setItem('@user_name', data.user.name);

        setServerUrl(cleanUrl);
        setToken(data.token);
        setUserName(data.user.name);
        setScreen('MAIN');
        setPassword('');
      } else {
        alert(data.message || 'Login gagal, email atau password salah.');
      }
    } catch (err) {
      console.error(err);
      alert('Koneksi bermasalah. Pastikan domain Server URL valid.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      setToken('');
      setScreen('LOGIN');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle camera scanned barcode event
  const handleBarcodeScanned = async (scanningResult: { data: string }) => {
    const { data } = scanningResult;
    if (!data) return;

    // Debounce to prevent multiple quick trigger scans of the same barcode
    const now = Date.now();
    if (data === lastScannedBarcode && now - lastScanTime < 4000) {
      return;
    }

    setLastScannedBarcode(data);
    setLastScanTime(now);
    setBarcode(data);

    triggerHaptic(true);
    playBeep(true);

    if (autoCapture) {
      uploadPackageProof(data);
    }
  };

  const uploadPackageProof = async (targetBarcode: string) => {
    if (isUploading) return;
    setIsUploading(true);
    setStatusMsg(null);

    let photoUri = '';
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        photoUri = photo.uri;
      }
    } catch (err) {
      console.error('Failed to capture frame:', err);
      setStatusMsg({ text: 'Gagal mengambil gambar dari kamera.', type: 'error' });
      triggerHaptic(false);
      playBeep(false);
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('barcode', targetBarcode);
    if (photoUri) {
      formData.append('package_proof', {
        uri: photoUri,
        name: 'proof.jpg',
        type: 'image/jpeg'
      } as any);
    }

    try {
      const response = await fetch(`${serverUrl}/finance/transactions/barcode-upload-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStatusMsg({ text: `Sukses menyimpan resi: ${targetBarcode}`, type: 'success' });
        triggerHaptic(true);
        playBeep(true);
        fetchStats();

        const newScan: ScannedPackage = {
          id: data.transaction.id.toString(),
          invoice_number: data.transaction.invoice_number,
          waybill_number: data.transaction.waybill_number,
          package_proof: data.transaction.package_proof,
          store_name: data.transaction.store_name,
          platform: data.transaction.platform,
          scanned_at: new Date().toLocaleTimeString('id-ID'),
          status: 'success'
        };

        const updatedHistory = [newScan, ...history.slice(0, 19)];
        setHistory(updatedHistory);
        await AsyncStorage.setItem('@scan_history', JSON.stringify(updatedHistory));
      } else {
        setStatusMsg({ text: data.message || 'Resi tidak ditemukan.', type: 'error' });
        triggerHaptic(false);
        playBeep(false);
        saveFailedScan(targetBarcode, data.message || 'Resi tidak terdaftar.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: 'Koneksi error, gagal mengunggah.', type: 'error' });
      triggerHaptic(false);
      playBeep(false);
      saveFailedScan(targetBarcode, 'Masalah koneksi internet.');
    } finally {
      setIsUploading(false);
    }
  };

  const saveFailedScan = async (failedBarcode: string, reason: string) => {
    const failedScan: ScannedPackage = {
      id: Math.random().toString(),
      invoice_number: failedBarcode,
      waybill_number: null,
      package_proof: '',
      store_name: 'Unknown',
      platform: 'Error',
      scanned_at: new Date().toLocaleTimeString('id-ID'),
      status: 'error',
      errorMessage: reason
    };

    const updatedHistory = [failedScan, ...history.slice(0, 19)];
    setHistory(updatedHistory);
    await AsyncStorage.setItem('@scan_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem('@scan_history');
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Aplikasi membutuhkan akses kamera untuk melakukan pemindaian barcode resi.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      
      {screen === 'LOGIN' ? (
        <View style={styles.loginCard}>
          <Text style={styles.logoText}>📦 STASIUN PACKING</Text>
          <Text style={styles.subLogoText}>Hubungkan pemindai resi seluler Anda ke sistem kasir</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Server URL (HTTPS / Domain)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://inventory-kasir.com"
              placeholderTextColor="#71717a"
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Pengguna</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@example.com"
              placeholderTextColor="#71717a"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password..."
              placeholderTextColor="#71717a"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Hubungkan Scanner</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.scannerWrapper}>
          {/* Active Tab Screen Render */}
          {activeTab === 'DASHBOARD' && (
            <View style={styles.tabContent}>
              {/* Profile Card Section */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>{userName ? userName.charAt(0).toUpperCase() : 'P'}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{userName || 'Petugas'}</Text>
                  <Text style={styles.profileRole}>Petugas Gudang / Packing</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtnSmall} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={16} color="#ef4444" />
                  <Text style={styles.logoutBtnSmallText}>Keluar</Text>
                </TouchableOpacity>
              </View>

              {/* 3-Column Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statsCard}>
                  <Text style={[styles.statsValue, { color: '#f43f5e' }]}>{pendingCount}</Text>
                  <Text style={styles.statsLabel}>Antrean Packing</Text>
                </View>
                <View style={styles.statsCard}>
                  <Text style={[styles.statsValue, { color: '#22c55e' }]}>
                    {history.filter((h) => h.status === 'success').length}
                  </Text>
                  <Text style={styles.statsLabel}>Sukses Hari Ini</Text>
                </View>
                <View style={styles.statsCard}>
                  <Text style={[styles.statsValue, { color: '#f59e0b' }]}>
                    {history.filter((h) => h.status === 'error').length}
                  </Text>
                  <Text style={styles.statsLabel}>Gagal Hari Ini</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Status Koneksi</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Server URL:</Text>
                  <Text style={styles.infoValue}>{serverUrl}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={[styles.infoValue, { color: '#22c55e', fontWeight: 'bold' }]}>● Terhubung</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => setActiveTab('SCANNER')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="camera" size={18} color="#ffffff" />
                  <Text style={styles.primaryButtonText}>Mulai Scanning Sekarang</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'SCANNER' && (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={StyleSheet.absoluteFill}>
              {/* Full Screen Camera in the background */}
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                enableTorch={flash}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'code128', 'code39', 'code93', 'pdf417', 'ean13', 'ean8'],
                }}
                onBarcodeScanned={isUploading ? undefined : handleBarcodeScanned}
              />


              {/* Target Reticle box overlay (Middle) */}
              <View style={styles.overlayContainer}>
                <View style={styles.reticleBox} />
                <Text style={styles.scanInstruction}>Arahkan barcode ke dalam kotak</Text>
                {showTips && (
                  <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
                    <Text style={styles.scanTips}>💡 Tips: Tutupi barcode resi besar dengan jari/kertas agar kamera fokus membaca barcode nomor pesanan kecil.</Text>
                  </Animated.View>
                )}
              </View>

              {/* Floating Control Panel */}
              <View style={[
                styles.floatingBottomPanel, 
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 85 }
              ]}>
                {/* Toolbar: Flash, Flip Camera, Auto-Foto */}
                <View style={styles.bottomToolbar}>
                  <TouchableOpacity style={styles.toolbarBtn} onPress={() => setFlash(!flash)}>
                    <Text style={styles.toolbarBtnText}>{flash ? '⚡ Flash On' : '⚡ Flash Off'}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.toolbarBtn} onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}>
                    <Text style={styles.toolbarBtnText}>🔄 {facing === 'back' ? 'Belakang' : 'Depan'}</Text>
                  </TouchableOpacity>

                  <View style={styles.autoCaptureRow}>
                    <Text style={styles.autoCaptureText}>Auto-Foto</Text>
                    <Switch
                      value={autoCapture}
                      onValueChange={setAutoCapture}
                      trackColor={{ false: '#27272a', true: '#22c55e' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                {/* Status Message Display */}
                {statusMsg && (
                  <View style={[styles.statusBanner, statusMsg.type === 'success' ? styles.successBg : styles.errorBg]}>
                    <Text style={styles.statusText}>{statusMsg.text}</Text>
                  </View>
                )}

                {/* Manual scan input panel if Auto mode is off */}
                {!autoCapture && barcode !== '' && (
                  <View style={styles.manualActionPanel}>
                    <Text style={styles.manualBarcodeText}>Resi Terdeteksi: {barcode}</Text>
                    <TouchableOpacity
                      style={styles.manualCaptureBtn}
                      onPress={() => uploadPackageProof(barcode)}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.manualCaptureBtnText}>📷 Ambil & Kirim Bukti</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Manual Order Input Form */}
                <View style={styles.manualInputContainer}>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="Ketik No. Pesanan secara manual..."
                    placeholderTextColor="#71717a"
                    value={manualBarcode}
                    onChangeText={setManualBarcode}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.manualInputBtn}
                    onPress={() => {
                      if (manualBarcode.trim()) {
                        uploadPackageProof(manualBarcode.trim());
                        setManualBarcode('');
                      }
                    }}
                    disabled={isUploading}
                  >
                    <Text style={styles.manualInputBtnText}>Kirim</Text>
                  </TouchableOpacity>
                </View>
              </View>
              </View>
            </TouchableWithoutFeedback>
          )}

          {activeTab === 'HISTORY' && (
            <View style={styles.tabContent}>
              <View style={styles.tabHeaderRow}>
                <Text style={styles.tabHeaderTitle}>Riwayat Scan Hari Ini</Text>
                {history.length > 0 && (
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={styles.clearText}>Hapus Semua</Text>
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <View style={styles.historyMain}>
                      <Text style={styles.itemBarcode}>{item.invoice_number}</Text>
                      {item.status === 'success' ? (
                        <View style={styles.badgeRow}>
                          <Text style={styles.itemStore}>{item.store_name} ({item.platform})</Text>
                          <Text style={styles.successText}>Success</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeRow}>
                          <Text style={styles.errorText}>Failed: {item.errorMessage}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemTime}>{item.scanned_at}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada paket yang dipindai.</Text>
                  </View>
                }
              />
            </View>
          )}

          {/* Bottom Tab Navigation Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={styles.tabBarItem} 
              onPress={() => setActiveTab('DASHBOARD')}
            >
              <Ionicons 
                name={activeTab === 'DASHBOARD' ? 'home' : 'home-outline'} 
                size={22} 
                color={activeTab === 'DASHBOARD' ? '#4f46e5' : '#a1a1aa'} 
              />
              <Text style={[styles.tabBarLabel, activeTab === 'DASHBOARD' && styles.tabActiveColor]}>Dashboard</Text>
            </TouchableOpacity>

            {/* Elevated Scanner Center Button */}
            <View style={styles.centerTabContainer}>
              <TouchableOpacity 
                style={styles.centerScanBtn} 
                onPress={() => setActiveTab('SCANNER')}
              >
                <Ionicons name="camera" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.tabBarItem} 
              onPress={() => setActiveTab('HISTORY')}
            >
              <Ionicons 
                name={activeTab === 'HISTORY' ? 'list' : 'list-outline'} 
                size={22} 
                color={activeTab === 'HISTORY' ? '#4f46e5' : '#a1a1aa'} 
              />
              <Text style={[styles.tabBarLabel, activeTab === 'HISTORY' && styles.tabActiveColor]}>Riwayat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
    padding: 30,
  },
  permissionText: {
    color: '#e4e4e7',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  loginCard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#09090b',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subLogoText: {
    color: '#a1a1aa',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  scannerWrapper: {
    flex: 1,
    position: 'relative',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    borderBottomWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.4)',
    zIndex: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  headerSub: {
    color: '#a1a1aa',
    fontSize: 10,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#e4e4e7',
    fontSize: 11,
    fontWeight: '700',
  },
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  reticleBox: {
    width: 240,
    height: 110,
    borderWidth: 2.5,
    borderColor: '#4f46e5',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  scanInstruction: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scanTips: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 14,
  },
  toolbarBtn: {
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(39, 39, 42, 0.5)',
  },
  toolbarBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  autoCaptureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(39, 39, 42, 0.5)',
  },
  autoCaptureText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },
  statusBanner: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBg: {
    backgroundColor: '#15803d',
  },
  errorBg: {
    backgroundColor: '#b91c1c',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  manualActionPanel: {
    padding: 16,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    borderBottomWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  manualBarcodeText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  manualCaptureBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  manualCaptureBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  historyContainer: {
    padding: 16,
    maxHeight: 180,
  },
  floatingBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.4)',
    paddingTop: 12,
    zIndex: 10,
  },
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.3)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  clearText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '700',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.4)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  historyMain: {
    flex: 1,
  },
  itemBarcode: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  itemStore: {
    color: '#a1a1aa',
    fontSize: 10,
  },
  successText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 10,
    fontWeight: '600',
  },
  itemTime: {
    color: '#71717a',
    fontSize: 10,
    marginLeft: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 12,
    fontStyle: 'italic',
  },
  manualInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.3)',
    gap: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
  },
  manualInputBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualInputBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.3)',
  },
  tipsText: {
    color: '#e4e4e7',
    fontSize: 10,
    lineHeight: 14,
  },
  historyToggleBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderBottomWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.3)',
  },
  historyToggleText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 15,
    zIndex: 100,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '33%',
  },
  tabBarIcon: {
    fontSize: 20,
    color: '#a1a1aa',
  },
  tabBarLabel: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: '700',
    marginTop: 2,
  },
  tabActiveColor: {
    color: '#4f46e5',
  },
  centerTabContainer: {
    width: '33%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
  },
  centerScanBtn: {
    position: 'absolute',
    top: -32,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#09090b',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerScanBtnText: {
    fontSize: 26,
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 90,
  },
  dashboardHeader: {
    marginTop: 24,
    marginBottom: 28,
  },
  dashboardWelcome: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  dashboardUser: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statsLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '600',
  },
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  tabHeaderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  profileRole: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutBtnSmallText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
});
