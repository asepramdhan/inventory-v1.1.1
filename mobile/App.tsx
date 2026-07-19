import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  Image as RNImage,
  Animated,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';

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

const BARCODE_SETTINGS = {
  barcodeTypes: ['qr', 'code128', 'code39', 'code93', 'pdf417', 'ean13', 'ean8'] as any[],
};

const DISABLED_BARCODE_SETTINGS = {
  barcodeTypes: [] as any[],
};

export default function App() {
  useKeepAwake();
  const [permission, requestPermission] = useCameraPermissions();
  const [serverUrl, setServerUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [userName, setUserName] = useState('');
  const [screen, setScreen] = useState<'LOGIN' | 'MAIN'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SCANNER' | 'HISTORY' | 'STOK' | 'PROFILE'>('DASHBOARD');

  // Cek & Update Stok States
  const [searchSku, setSearchSku] = useState('');
  const [scannedProduct, setScannedProduct] = useState<{
    id: number;
    sku: string;
    name: string;
    stock: number;
    price: string;
    category_name: string;
  } | null>(null);
  const [stockInput, setStockInput] = useState('');
  const [showProductScanner, setShowProductScanner] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [enableSound, setEnableSound] = useState<boolean>(true);
  const [enableHaptic, setEnableHaptic] = useState<boolean>(true);

  // Perekaman Video States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [activeUploads, setActiveUploads] = useState<number>(0);

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
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [mirrorPreview, setMirrorPreview] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cameraRef = useRef<any>(null);
  const capturedPhotoUriRef = useRef<string | null>(null);
  const recordTimerIdRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const statusFadeAnim = useRef(new Animated.Value(0)).current;
  const statusTimeoutRef = useRef<any>(null);

  const isUploadingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const cameraModeRef = useRef<'picture' | 'video'>('picture');
  const activeUploadsRef = useRef(0);
  const lastScannedBarcodeRef = useRef('');
  const lastScanTimeRef = useRef(0);
  const autoCaptureRef = useRef(true);
  const historyRef = useRef<ScannedPackage[]>([]);

  useEffect(() => { isUploadingRef.current = isUploading; }, [isUploading]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);
  useEffect(() => { activeUploadsRef.current = activeUploads; }, [activeUploads]);
  useEffect(() => { autoCaptureRef.current = autoCapture; }, [autoCapture]);
  useEffect(() => { historyRef.current = history; }, [history]);

  const translateY = statusFadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0]
  });

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
        const savedEmail = await AsyncStorage.getItem('@user_email');
        const savedHistory = await AsyncStorage.getItem('@scan_history');
        const savedMirror = await AsyncStorage.getItem('@mirror_preview');

        const savedSound = await AsyncStorage.getItem('@enable_sound');
        const savedHaptic = await AsyncStorage.getItem('@enable_haptic');
        if (savedSound !== null) setEnableSound(savedSound === 'true');
        if (savedHaptic !== null) setEnableHaptic(savedHaptic === 'true');

        if (savedUrl) setServerUrl(savedUrl);
        if (savedMirror) setMirrorPreview(savedMirror === 'true');
        if (savedToken) {
          setToken(savedToken);
          setScreen('MAIN');
        }
        if (savedName) setUserName(savedName);
        if (savedEmail) setEmail(savedEmail);
        if (savedHistory) setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to load credentials:', err);
      }
    })();
  }, []);

  // Beep sound player
  const playBeep = async (isSuccess: boolean) => {
    if (!enableSound) return;
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
    if (!enableHaptic) return;
    if (isSuccess) {
      Vibration.vibrate(80);
    } else {
      Vibration.vibrate([0, 100, 80, 200]);
    }
  };

  const showStatus = (text: string, type: 'success' | 'error', duration = 4000, keepAlive = false) => {
    setStatusMsg({ text, type });

    // Animate fade-in and slide-down (300ms)
    statusFadeAnim.setValue(0);
    Animated.timing(statusFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    if (!keepAlive) {
      statusTimeoutRef.current = setTimeout(() => {
        // Animate fade-out (400ms)
        Animated.timing(statusFadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setStatusMsg(null);
        });
      }, duration);
    }
  };

  const toggleMirror = async () => {
    const nextVal = !mirrorPreview;
    setMirrorPreview(nextVal);
    await AsyncStorage.setItem('@mirror_preview', nextVal ? 'true' : 'false');
  };

  const fetchStats = async () => {
    if (!serverUrl || !token) return;
    try {
      const response = await fetch(`${serverUrl}/api/mobile/stats`, {
        headers: {
          'X-Mobile-Token': token || '',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPendingCount(data.pending_count);
        setConnectionError(false);
        if (typeof data.low_stock_count === 'number') {
          setLowStockCount(data.low_stock_count);
        }
        if (data.user) {
          if (data.user.name) {
            setUserName(data.user.name);
            await AsyncStorage.setItem('@user_name', data.user.name);
          }
          if (data.user.email) {
            setEmail(data.user.email);
            await AsyncStorage.setItem('@user_email', data.user.email);
          }
        }
      } else {
        setConnectionError(true);
      }
    } catch (err) {
      setConnectionError(true);
      console.log('Failed to fetch stats:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch stats and force a minimum 700ms spin time for smooth visual feedback
    await Promise.all([
      fetchStats(),
      new Promise(resolve => setTimeout(resolve, 700))
    ]);
    triggerHaptic(true);
    setRefreshing(false);
  };

  const onRefreshHistory = async () => {
    setRefreshing(true);
    // Reload history local storage dan sync statistik kasir di background secara pararel
    const [savedHistory] = await Promise.all([
      AsyncStorage.getItem('@scan_history'),
      fetchStats(),
      new Promise(resolve => setTimeout(resolve, 700))
    ]);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    triggerHaptic(true);
    setRefreshing(false);
  };

  const searchProductBySku = async (skuCode: string) => {
    if (!skuCode.trim()) return;
    setIsSearchingProduct(true);
    try {
      const response = await fetch(`${serverUrl}/api/mobile/product/scan?sku=${encodeURIComponent(skuCode.trim())}`, {
        method: 'GET',
        headers: {
          'X-Mobile-Token': token || '',
          'Accept': 'application/json',
        }
      });
      const data = await response.json();
      if (data.success && data.product) {
        setScannedProduct(data.product);
        setStockInput(String(data.product.stock));
        triggerHaptic(true);
      } else {
        alert(data.message || 'Produk tidak ditemukan');
        setScannedProduct(null);
      }
    } catch (err) {
      console.log('Error searching product:', err);
      alert('Gagal mencari produk. Periksa koneksi internet Anda.');
    } finally {
      setIsSearchingProduct(false);
    }
  };

  const updateProductStock = async () => {
    if (!scannedProduct) return;
    const newStock = parseInt(stockInput);
    if (isNaN(newStock) || newStock < 0) {
      alert('Stok harus berupa angka positif.');
      return;
    }

    setIsSearchingProduct(true);
    try {
      const response = await fetch(`${serverUrl}/api/mobile/product/update-stock`, {
        method: 'POST',
        headers: {
          'X-Mobile-Token': token || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          product_id: scannedProduct.id,
          stock: newStock,
        })
      });
      const data = await response.json();
      if (data.success && data.product) {
        setScannedProduct(prev => prev ? { ...prev, stock: data.product.stock } : null);
        alert('Stok produk berhasil diperbarui!');
        triggerHaptic(true);
        fetchStats();
      } else {
        alert(data.message || 'Gagal memperbarui stok.');
      }
    } catch (err) {
      console.log('Error updating stock:', err);
      alert('Gagal menghubungi server.');
    } finally {
      setIsSearchingProduct(false);
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
        await AsyncStorage.setItem('@user_email', data.user.email);

        setServerUrl(cleanUrl);
        setToken(data.token);
        setUserName(data.user.name);
        setEmail(data.user.email);
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
      await AsyncStorage.removeItem('@user_email');
      await AsyncStorage.removeItem('@user_name');
      setToken('');
      setEmail('');
      setUserName('');
      setScreen('LOGIN');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle camera scanned barcode event (useCallback dengan dependensi kosong agar referensinya 100% statis & tidak merusak sesi kamera)
  const handleBarcodeScanned = useCallback(async (scanningResult: { data: string }) => {
    const { data } = scanningResult;
    if (!data) return;

    // Filter jika sedang sibuk merekam atau mengunggah agar sesi kamera stabil
    if (
      isUploadingRef.current || 
      isRecordingRef.current || 
      cameraModeRef.current === 'video' || 
      activeUploadsRef.current > 0
    ) {
      return;
    }

    // Bersihkan barcode secara total dari spasi, newline, carriage return (\r\n), dan karakter non-alphanumeric/punctuation agar tidak merusak format HTTP FormData
    const cleanData = data.replace(/[^a-zA-Z0-9\-_./]/g, '').trim();
    if (!cleanData) return;

    // Debounce to prevent multiple quick trigger scans of the same barcode
    const now = Date.now();
    if (cleanData === lastScannedBarcodeRef.current && now - lastScanTimeRef.current < 4000) {
      return;
    }

    lastScannedBarcodeRef.current = cleanData;
    lastScanTimeRef.current = now;
    setLastScannedBarcode(cleanData);
    setLastScanTime(now);
    setBarcode(cleanData);

    triggerHaptic(true);
    playBeep(true);

    if (autoCaptureRef.current) {
      checkAndStartRecording(cleanData);
    }
  }, []);

  const checkAndStartRecording = (data: string) => {
    const isAlreadyScanned = historyRef.current.some(
      (item) => 
        item.status === 'success' && 
        (item.invoice_number === data || item.waybill_number === data)
    );

    if (isAlreadyScanned) {
      Alert.alert(
        '⚠️ Resi Sudah Dipacking',
        `Resi "${data}" sudah dipacking sebelumnya hari ini. Apakah Anda yakin ingin memproses ulang?`,
        [
          { text: 'Batal', style: 'cancel', onPress: () => {
            setLastScannedBarcode('');
            lastScannedBarcodeRef.current = '';
          }},
          { text: 'Lanjutkan', onPress: () => {
            startVideoRecordingWorkflow(data);
          }}
        ]
      );
    } else {
      startVideoRecordingWorkflow(data);
    }
  };

  const startVideoRecordingWorkflow = async (targetBarcode: string) => {
    setBarcode(targetBarcode);
    setStatusMsg(null);
    setIsUploading(true);
    isUploadingRef.current = true;

    let photoUri = '';
    try {
      if (cameraRef.current) {
        // Ambil gambar terlebih dahulu dengan kompresi 0.3 (sangat ringan namun tetap terbaca jelas)
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.3,
        });
        photoUri = photo.uri;
        capturedPhotoUriRef.current = photo.uri;
      }
    } catch (err) {
      console.error('Failed to take picture before recording:', err);
      showStatus('Gagal mengambil foto resi.', 'error');
      setIsUploading(false);
      isUploadingRef.current = false;
      return;
    }

    // Jeda 500ms agar hardware iOS selesai menulis file jepretan ke disk
    await new Promise(resolve => setTimeout(resolve, 500));

    // Bersihkan status banner agar hanya timer rekam yang tampil
    setStatusMsg(null);

    // Pindah ke mode video dan mulai merekam
    setCameraMode('video');
    cameraModeRef.current = 'video';
    setRecordingSeconds(0);
    setIsRecording(true);
    isRecordingRef.current = true;

    // Mulai interval detik timer SEGERA menggunakan React Ref (Sangat Aman!)
    if (recordTimerIdRef.current) {
      clearInterval(recordTimerIdRef.current);
    }
    const intervalId = setInterval(() => {
      setRecordingSeconds(prev => {
        console.log('Countdown Timer Ticked:', prev + 1);
        return prev + 1;
      });
    }, 1000);
    recordTimerIdRef.current = intervalId;

    setTimeout(() => {
      try {
        if (cameraRef.current) {
          cameraRef.current.recordAsync({
            maxDuration: 10, // Batasi 10 detik biar file sangat kecil & otomatis stop!
            videoBitrate: 500000, // 500 kbps (sangat kecil & hemat kuota!)
            codec: Platform.OS === 'ios' ? 'avc1' : undefined
          }).then((video: any) => {
            if (video && video.uri) {
              uploadDualProof(targetBarcode, capturedPhotoUriRef.current || '', video.uri);
            }
          }).catch((err: any) => {
            console.error('Failed to record video inside promise:', err);
            showStatus('Gagal merekam video.', 'error');
            setCameraMode('picture');
            cameraModeRef.current = 'picture';
            setIsRecording(false);
            isRecordingRef.current = false;
            setIsUploading(false);
            isUploadingRef.current = false;
          });
        }
      } catch (err) {
        console.error('Failed to record video:', err);
        showStatus('Gagal memulai perekaman video.', 'error');
        setCameraMode('picture');
        cameraModeRef.current = 'picture';
        setIsRecording(false);
        isRecordingRef.current = false;
        setIsUploading(false);
        isUploadingRef.current = false;
      }
    }, 1000); // Jeda transisi 1000ms yang aman untuk iOS AVFoundation
  };

  const stopVideoRecordingWorkflow = async () => {
    if (recordTimerIdRef.current) {
      clearInterval(recordTimerIdRef.current);
      recordTimerIdRef.current = null;
    }
    if (cameraRef.current) {
      try {
        cameraRef.current.stopRecording();
      } catch (err) {
        console.error('Failed to stop recording:', err);
      }
    }
    setIsRecording(false);
    isRecordingRef.current = false;
  };

  const uploadDualProof = async (targetBarcode: string, photoUri: string, videoUri: string) => {
    // LANGSUNG PINDAH LAGI KE SCAN (TIDAK MENUNGGU BERES KIRIM)
    activeUploadsRef.current = activeUploadsRef.current + 1;
    setActiveUploads(prev => prev + 1);
    
    setIsUploading(false);
    isUploadingRef.current = false;
    
    setCameraMode('picture');
    cameraModeRef.current = 'picture';
    
    setIsRecording(false);
    isRecordingRef.current = false;
    
    setBarcode('');
    setLastScannedBarcode(''); // Reset debouncer agar bisa langsung scan barcode selanjutnya
    capturedPhotoUriRef.current = null;
    
    // Perbarui waktu scan terakhir dengan waktu saat ini agar mendapatkan masa tenggang 4 detik baru setelah scanning aktif kembali
    const nowTime = Date.now();
    lastScanTimeRef.current = nowTime;
    setLastScanTime(nowTime);
    
    if (recordTimerIdRef.current) {
      clearInterval(recordTimerIdRef.current);
      recordTimerIdRef.current = null;
    }
    
    showStatus('📤 Mengirim bukti foto & video di latar belakang...', 'success', 0, true);
    
    const formData = new FormData();
    formData.append('barcode', targetBarcode);
    
    // Lampirkan Foto
    if (photoUri) {
      formData.append('package_proof_photo', {
        uri: photoUri,
        name: 'proof_photo.jpg',
        type: 'image/jpeg'
      } as any);
    }

    // Lampirkan Video (Paksa simpan sebagai .mp4)
    if (videoUri) {
      formData.append('package_proof_video', {
        uri: videoUri,
        name: 'proof_video.mp4',
        type: 'video/mp4'
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
        showStatus(`Sukses menyimpan bukti: ${targetBarcode}`, 'success');
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
        showStatus(`Gagal menyimpan ${targetBarcode}: ${data.message || 'Resi tidak ditemukan'}`, 'error');
        triggerHaptic(false);
        playBeep(false);
        saveFailedScan(targetBarcode, data.message || 'Resi tidak terdaftar.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || 'Error tidak diketahui';
      showStatus(`Koneksi error (${errMsg}), gagal mengunggah bukti ${targetBarcode}`, 'error');
      triggerHaptic(false);
      playBeep(false);
      saveFailedScan(targetBarcode, `Error: ${errMsg}`);
    } finally {
      activeUploadsRef.current = Math.max(0, activeUploadsRef.current - 1);
      setActiveUploads(prev => Math.max(0, prev - 1));
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

  const deleteHistoryItem = async (itemId: string) => {
    const updated = history.filter((item) => item.id !== itemId);
    setHistory(updated);
    await AsyncStorage.setItem('@scan_history', JSON.stringify(updated));
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
          {/* Global Floating Loading Indicator */}
          {refreshing && (
            <View style={styles.globalLoadingOverlay}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.globalLoadingText}>Memperbarui...</Text>
            </View>
          )}

          {/* Active Tab Screen Render */}
          {activeTab === 'DASHBOARD' && (
            <ScrollView
              style={{ flex: 1, backgroundColor: '#09090b' }}
              contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
              alwaysBounceVertical={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#22c55e"
                  colors={["#22c55e"]}
                />
              }
            >
              {/* Dashboard Title */}
              <View style={styles.tabHeaderRow}>
                <Text style={styles.tabHeaderTitle}>Dashboard Gudang</Text>
              </View>

              {/* Connection Error Alert */}
              {connectionError && (
                <View style={styles.connectionErrorCard}>
                  <Ionicons name="wifi-outline" size={18} color="#ef4444" style={{ marginRight: 4 }} />
                  <Text style={styles.connectionErrorText}>
                    Koneksi terputus ke server. Pastikan URL Server di tab Profil sudah benar.
                  </Text>
                </View>
              )}

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

              {/* Real-time Stock Alerts */}
              {lowStockCount > 0 ? (
                <TouchableOpacity
                  style={styles.lowStockAlertCard}
                  onPress={() => setActiveTab('STOK')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="warning" size={22} color="#f43f5e" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lowStockAlertTitle}>Stok Kritis Terdeteksi!</Text>
                    <Text style={styles.lowStockAlertDesc}>
                      Ada {lowStockCount} produk yang stoknya hampir habis (≤ 10). Ketuk di sini untuk cek & sesuaikan.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#f43f5e" />
                </TouchableOpacity>
              ) : (
                <View style={styles.allStockSafeCard}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.allStockSafeText}>Semua persediaan produk gudang terpantau aman.</Text>
                </View>
              )}

              {/* Progress Bar Rasio Sukses */}
              {(() => {
                const successCount = history.filter((h) => h.status === 'success').length;
                const errorCount = history.filter((h) => h.status === 'error').length;
                const totalCount = successCount + errorCount;
                const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

                if (totalCount === 0) return null;

                return (
                  <View style={styles.progressCard}>
                    <View style={styles.progressHeaderRow}>
                      <Text style={styles.progressLabel}>Rasio Sukses Packing</Text>
                      <Text style={[
                        styles.progressPercentage,
                        successRate >= 90 ? { color: '#10b981' } : successRate >= 70 ? { color: '#818cf8' } : { color: '#f59e0b' }
                      ]}>
                        {successRate}%
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[
                        styles.progressBarFill,
                        { width: `${successRate}%` },
                        successRate >= 90 ? { backgroundColor: '#10b981' } : successRate >= 70 ? { backgroundColor: '#4f46e5' } : { backgroundColor: '#f59e0b' }
                      ]} />
                    </View>
                    <Text style={styles.progressSubtext}>
                      {successCount} dari {totalCount} paket berhasil diproses hari ini
                    </Text>
                  </View>
                );
              })()}

              {/* Prosedur Kerja & Tips Gudang */}
              <View style={styles.guideCard}>
                <View style={styles.guideHeader}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#22c55e" />
                  <Text style={styles.guideTitle}>Prosedur Operasional Gudang</Text>
                </View>

                <View style={styles.guideItem}>
                  <View style={styles.guideStepNumber}>
                    <Text style={styles.guideStepText}>1</Text>
                  </View>
                  <View style={styles.guideItemContent}>
                    <Text style={styles.guideItemTitle}>Periksa Antrean</Text>
                    <Text style={styles.guideItemDesc}>Pastikan jumlah Antrean Packing di atas terpantau berkala.</Text>
                  </View>
                </View>

                <View style={styles.guideItem}>
                  <View style={styles.guideStepNumber}>
                    <Text style={styles.guideStepText}>2</Text>
                  </View>
                  <View style={styles.guideItemContent}>
                    <Text style={styles.guideItemTitle}>Scan Barcode Paket</Text>
                    <Text style={styles.guideItemDesc}>Gunakan tombol kamera di tengah bawah untuk memindai resi pesanan dan merekam bukti foto packing.</Text>
                  </View>
                </View>

                <View style={styles.guideItem}>
                  <View style={styles.guideStepNumber}>
                    <Text style={styles.guideStepText}>3</Text>
                  </View>
                  <View style={styles.guideItemContent}>
                    <Text style={styles.guideItemTitle}>Penyelarasan Stok Fisik</Text>
                    <Text style={styles.guideItemDesc}>Jika ada ketidaksesuaian stok di rak, gunakan tab Stok untuk memperbarui jumlah secara instan.</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {activeTab === 'SCANNER' && (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={StyleSheet.absoluteFill}>
                {/* Full Screen Camera in the background */}
                <CameraView
                  ref={cameraRef}
                  style={[
                    StyleSheet.absoluteFill,
                    mirrorPreview && { transform: [{ scaleX: -1 }] }
                  ]}
                  facing={facing}
                  enableTorch={flash}
                  mode={cameraMode}
                  videoQuality="480p"
                  barcodeScannerSettings={
                    isUploading || isRecording || cameraMode === 'video' || activeUploads > 0
                      ? DISABLED_BARCODE_SETTINGS
                      : BARCODE_SETTINGS
                  }
                  onBarcodeScanned={handleBarcodeScanned}
                />


                {/* Target Reticle box overlay (Middle) */}
                <View style={styles.overlayContainer}>
                  {/* Floating Status Banner */}
                  {statusMsg && (
                    <Animated.View style={[
                      styles.floatingStatusBanner,
                      statusMsg.type === 'success' ? { backgroundColor: 'rgba(21, 128, 61, 0.95)' } : { backgroundColor: 'rgba(185, 28, 28, 0.95)' },
                      {
                        opacity: statusFadeAnim,
                        transform: [{ translateY }]
                      }
                    ]}>
                      <Text style={styles.floatingStatusText}>{statusMsg.text}</Text>
                    </Animated.View>
                  )}

                  {activeUploads > 0 && (
                    <View style={styles.backgroundUploadBadge}>
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.backgroundUploadText}>Mengunggah {activeUploads} bukti...</Text>
                    </View>
                  )}

                  {isRecording ? (
                    <View style={styles.recordingTimerContainer}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingTimerText}>
                        SISA WAKTU REKAM: {Math.max(0, 10 - recordingSeconds)}s
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Floating Auto-Foto Toggle Button */}
                      <TouchableOpacity
                        style={[
                          styles.floatingAutoToggleBtn,
                          autoCapture ? styles.autoActiveBtn : styles.autoInactiveBtn
                        ]}
                        onPress={() => setAutoCapture(!autoCapture)}
                      >
                        <Ionicons
                          name={autoCapture ? "flash" : "flash-outline"}
                          size={11}
                          color={autoCapture ? "#22c55e" : "#a1a1aa"}
                        />
                        <Text style={[
                          styles.floatingAutoToggleText,
                          autoCapture ? { color: '#22c55e' } : { color: '#a1a1aa' }
                        ]}>
                          Auto
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.reticleBox} />
                      <Text style={styles.scanInstruction}>Arahkan barcode ke dalam kotak</Text>
                      {showTips && (
                        <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
                          <Text style={styles.scanTips}>💡 Tips: Tutupi barcode resi besar dengan jari/kertas agar kamera fokus membaca barcode nomor pesanan kecil.</Text>
                        </Animated.View>
                      )}
                    </>
                  )}
                </View>

                {/* Floating Control Panel */}
                <View style={[
                  styles.floatingBottomPanel,
                  { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : 85 }
                ]}>
                  {isRecording ? (
                    <View style={styles.recordingControlPanel}>
                      <TouchableOpacity
                        style={styles.stopRecordingBtn}
                        onPress={stopVideoRecordingWorkflow}
                      >
                        <View style={styles.stopIconSquare} />
                        <Text style={styles.stopRecordingBtnText}>HENTIKAN & KIRIM REKAMAN</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      {/* Toolbar: Flash, Flip Camera, Mirror, Manual Toggle */}
                      <View style={styles.bottomToolbar}>
                        <TouchableOpacity style={styles.toolbarBtn} onPress={() => setFlash(!flash)}>
                          <Text style={styles.toolbarBtnText}>{flash ? '⚡ Flash On' : '⚡ Flash Off'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.toolbarBtn} onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}>
                          <Text style={styles.toolbarBtnText}>🔄 {facing === 'back' ? 'Belakang' : 'Depan'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.toolbarBtn} onPress={toggleMirror}>
                          <Text style={styles.toolbarBtnText}>🪞 {mirrorPreview ? 'Mirror' : 'Normal'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.toolbarBtn, showManualInput && { backgroundColor: '#4f46e5', borderColor: '#4f46e5' }]}
                          onPress={() => setShowManualInput(!showManualInput)}
                        >
                          <Text style={styles.toolbarBtnText}>✍️ Manual</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Auto-Foto dedicated row is now floating inside the camera view */}

                      {/* Manual scan input panel if Auto mode is off */}
                      {!autoCapture && barcode !== '' && (
                        <View style={styles.manualActionPanel}>
                          <Text style={styles.manualBarcodeText}>Resi Terdeteksi: {barcode}</Text>
                          <TouchableOpacity
                            style={styles.manualCaptureBtn}
                            onPress={() => checkAndStartRecording(barcode)}
                          >
                            <Text style={styles.manualCaptureBtnText}>📹 Mulai Rekam Packing</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Manual Order Input Form */}
                      {showManualInput && (
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
                                checkAndStartRecording(manualBarcode.trim());
                                setManualBarcode('');
                              }
                            }}
                            disabled={isUploading}
                          >
                            <Text style={styles.manualInputBtnText}>Kirim</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}

          {activeTab === 'HISTORY' && (
            <View style={styles.tabContent}>
              <View style={styles.tabHeaderRow}>
                <Text style={styles.tabHeaderTitle}>
                  Riwayat Scan Hari Ini {history.length > 0 ? `(${history.length})` : ''}
                </Text>
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
                alwaysBounceVertical={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefreshHistory}
                    tintColor="#22c55e"
                    colors={["#22c55e"]}
                  />
                }
                renderItem={({ item }) => (
                  <View style={[
                    styles.historyItem,
                    item.status === 'success'
                      ? { borderLeftWidth: 4, borderLeftColor: '#22c55e' }
                      : { borderLeftWidth: 4, borderLeftColor: '#ef4444' }
                  ]}>
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
                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                      <Text style={styles.itemTime}>{item.scanned_at}</Text>
                      <TouchableOpacity
                        onPress={() => deleteHistoryItem(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" style={{ opacity: 0.8 }} />
                      </TouchableOpacity>
                    </View>
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

          {/* Stok Tab */}
          {activeTab === 'STOK' && (
            <ScrollView
              style={{ flex: 1, backgroundColor: '#09090b' }}
              contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
            >
              <View style={styles.tabHeaderRow}>
                <Text style={styles.tabHeaderTitle}>Cek & Update Stok</Text>
              </View>

              {/* Search input and scan button */}
              <View style={styles.searchSection}>
                <View style={styles.searchInputWrapper}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Ketik SKU Produk..."
                    placeholderTextColor="#71717a"
                    value={searchSku}
                    onChangeText={setSearchSku}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={() => searchProductBySku(searchSku)}
                    disabled={isSearchingProduct}
                  >
                    {isSearchingProduct ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="search-outline" size={18} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.scanSkuBtn}
                  onPress={() => setShowProductScanner(true)}
                >
                  <Ionicons name="camera-outline" size={18} color="#ffffff" />
                  <Text style={styles.scanSkuBtnText}>Scan SKU</Text>
                </TouchableOpacity>
              </View>

              {/* Product Info Card */}
              {scannedProduct ? (
                <View style={styles.productCard}>
                  <View style={styles.productCardHeader}>
                    <Text style={styles.productCardSku}>{scannedProduct.sku}</Text>
                    <Text style={styles.productCardCategory}>{scannedProduct.category_name}</Text>
                  </View>
                  <Text style={styles.productCardName}>{scannedProduct.name}</Text>
                  <Text style={styles.productCardPrice}>
                    Harga: Rp {parseInt(scannedProduct.price).toLocaleString('id-ID')}
                  </Text>

                  {/* Stock Health Status Badge */}
                  <View style={styles.stockBadgeRow}>
                    <View style={[
                      styles.stockBadge,
                      scannedProduct.stock <= 10
                        ? { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                        : { backgroundColor: 'rgba(34, 197, 94, 0.15)' }
                    ]}>
                      <Ionicons
                        name={scannedProduct.stock <= 10 ? "warning-outline" : "checkmark-circle-outline"}
                        size={12}
                        color={scannedProduct.stock <= 10 ? "#ef4444" : "#22c55e"}
                      />
                      <Text style={[
                        styles.stockBadgeText,
                        scannedProduct.stock <= 10 ? { color: '#ef4444' } : { color: '#22c55e' }
                      ]}>
                        {scannedProduct.stock <= 10 ? 'Stok Menipis / Perlu Restok' : 'Stok Aman / Sehat'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.stockTitle}>Sesuaikan Jumlah Stok:</Text>
                  <View style={styles.stockAdjustRow}>
                    <TouchableOpacity
                      style={[styles.adjustCircle, styles.adjustCircleMinus]}
                      onPress={() => {
                        const val = parseInt(stockInput) || 0;
                        setStockInput(String(Math.max(0, val - 5)));
                      }}
                    >
                      <Text style={styles.adjustTextMinus}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.adjustCircle, styles.adjustCircleMinus]}
                      onPress={() => {
                        const val = parseInt(stockInput) || 0;
                        setStockInput(String(Math.max(0, val - 1)));
                      }}
                    >
                      <Text style={styles.adjustTextMinus}>-1</Text>
                    </TouchableOpacity>

                    <TextInput
                      style={styles.stockInput}
                      keyboardType="numeric"
                      value={stockInput}
                      onChangeText={setStockInput}
                    />

                    <TouchableOpacity
                      style={[styles.adjustCircle, styles.adjustCirclePlus]}
                      onPress={() => {
                        const val = parseInt(stockInput) || 0;
                        setStockInput(String(val + 1));
                      }}
                    >
                      <Text style={styles.adjustTextPlus}>+1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.adjustCircle, styles.adjustCirclePlus]}
                      onPress={() => {
                        const val = parseInt(stockInput) || 0;
                        setStockInput(String(val + 5));
                      }}
                    >
                      <Text style={styles.adjustTextPlus}>+5</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.updateStockBtn}
                    onPress={updateProductStock}
                    disabled={isSearchingProduct}
                  >
                    {isSearchingProduct ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.updateStockBtnText}>Simpan Perubahan Stok</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyProductContainer}>
                  <Ionicons name="cube-outline" size={48} color="#71717a" />
                  <Text style={styles.emptyProductText}>
                    Silakan scan barcode produk di rak gudang atau ketik kode SKU di atas untuk mengecek stok.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyScanBtn}
                    onPress={() => setShowProductScanner(true)}
                  >
                    <Ionicons name="camera-outline" size={16} color="#818cf8" />
                    <Text style={styles.emptyScanBtnText}>Mulai Scan Barcode</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* Profile Tab */}
          {activeTab === 'PROFILE' && (
            <ScrollView
              style={{ flex: 1, backgroundColor: '#09090b' }}
              contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
            >
              <View style={styles.tabHeaderRow}>
                <Text style={styles.tabHeaderTitle}>Akun Petugas</Text>
              </View>

              <View style={styles.profileCardFull}>
                <View style={styles.avatarCircleLarge}>
                  <Text style={styles.avatarLetterLarge}>{userName ? userName.charAt(0).toUpperCase() : 'P'}</Text>
                </View>
                <Text style={styles.profileNameLarge}>{userName || 'Petugas'}</Text>
                <Text style={styles.profileRoleLarge}>Petugas Gudang / Packing</Text>

                <View style={styles.divider} />

                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileDetailLabel}>Email</Text>
                  <Text style={styles.profileDetailValue}>{email || '-'}</Text>
                </View>
                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileDetailLabel}>Server URL</Text>
                  <Text style={styles.profileDetailValue}>{serverUrl}</Text>
                </View>
                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileDetailLabel}>Status</Text>
                  <Text style={[styles.profileDetailValue, { color: '#22c55e', fontWeight: 'bold' }]}>● Terhubung</Text>
                </View>
              </View>

              {/* Scan Response Settings */}
              <View style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>Pengaturan Respon Scan</Text>

                <View style={styles.settingsRow}>
                  <View>
                    <Text style={styles.settingsLabel}>Suara Beep</Text>
                    <Text style={styles.settingsDesc}>Bunyi beep saat memindai barcode resi</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#2c2c2e', true: '#4f46e5' }}
                    thumbColor={enableSound ? '#ffffff' : '#a1a1aa'}
                    value={enableSound}
                    onValueChange={async (value) => {
                      setEnableSound(value);
                      await AsyncStorage.setItem('@enable_sound', String(value));
                    }}
                  />
                </View>

                <View style={[styles.settingsRow, { marginBottom: 0 }]}>
                  <View>
                    <Text style={styles.settingsLabel}>Getaran (Haptic)</Text>
                    <Text style={styles.settingsDesc}>Efek getar dinamis pada perangkat</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#2c2c2e', true: '#4f46e5' }}
                    thumbColor={enableHaptic ? '#ffffff' : '#a1a1aa'}
                    value={enableHaptic}
                    onValueChange={async (value) => {
                      setEnableHaptic(value);
                      await AsyncStorage.setItem('@enable_haptic', String(value));
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.logoutBtnLarge} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.logoutBtnLargeText}>Keluar dari Sistem</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Product Scanner Modal */}
          {showProductScanner && (
            <View style={StyleSheet.absoluteFill}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={BARCODE_SETTINGS}
                onBarcodeScanned={({ data }) => {
                  setShowProductScanner(false);
                  setSearchSku(data);
                  searchProductBySku(data);
                }}
              />
              <View style={styles.overlayContainer}>
                <View style={styles.reticleBox} />
                <Text style={styles.scanInstruction}>Scan Barcode/SKU Produk</Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 40, width: 200 }]}
                  onPress={() => setShowProductScanner(false)}
                >
                  <Text style={styles.primaryButtonText}>Batal</Text>
                </TouchableOpacity>
              </View>
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
                size={20}
                color={activeTab === 'DASHBOARD' ? '#4f46e5' : '#a1a1aa'}
              />
              <Text style={[styles.tabBarLabel, activeTab === 'DASHBOARD' && styles.tabActiveColor]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBarItem}
              onPress={() => setActiveTab('STOK')}
            >
              <Ionicons
                name={activeTab === 'STOK' ? 'cube' : 'cube-outline'}
                size={20}
                color={activeTab === 'STOK' ? '#4f46e5' : '#a1a1aa'}
              />
              <Text style={[styles.tabBarLabel, activeTab === 'STOK' && styles.tabActiveColor]}>Stok</Text>
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
                size={20}
                color={activeTab === 'HISTORY' ? '#4f46e5' : '#a1a1aa'}
              />
              <Text style={[styles.tabBarLabel, activeTab === 'HISTORY' && styles.tabActiveColor]}>Riwayat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBarItem}
              onPress={() => setActiveTab('PROFILE')}
            >
              <Ionicons
                name={activeTab === 'PROFILE' ? 'person' : 'person-outline'}
                size={20}
                color={activeTab === 'PROFILE' ? '#4f46e5' : '#a1a1aa'}
              />
              <Text style={[styles.tabBarLabel, activeTab === 'PROFILE' && styles.tabActiveColor]}>Profil</Text>
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
  autoCaptureDedicatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.2)',
  },
  autoCaptureTextDedicated: {
    color: '#e4e4e7',
    fontSize: 12,
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
    width: '20%',
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
    width: '20%',
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
  globalLoadingOverlay: {
    position: 'absolute',
    top: 60, // Float below the status bar
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 9999, // Ensure it is on top of everything!
  },
  globalLoadingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingStatusBanner: {
    position: 'absolute',
    top: 100, // Floats below the top Auto-Foto pill
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  floatingStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  floatingAutoToggleBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    zIndex: 9999,
  },
  autoActiveBtn: {
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  autoInactiveBtn: {
    borderColor: 'rgba(63, 63, 70, 0.5)',
  },
  floatingAutoToggleText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  searchSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    borderRadius: 12,
    alignItems: 'center',
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  searchBtn: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
  },
  scanSkuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scanSkuBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  productCard: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  productCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productCardSku: {
    color: '#818cf8',
    fontWeight: '800',
    fontSize: 11,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  productCardCategory: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productCardName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 26,
  },
  productCardPrice: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#2c2c2e',
    marginVertical: 18,
  },
  stockTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  adjustCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  adjustCircleMinus: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  adjustCirclePlus: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  adjustTextMinus: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 14,
  },
  adjustTextPlus: {
    color: '#22c55e',
    fontWeight: '800',
    fontSize: 14,
  },
  stockInput: {
    width: 70,
    height: 46,
    borderWidth: 1.5,
    borderColor: '#4f46e5',
    backgroundColor: '#09090b',
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    borderRadius: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  updateStockBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateStockBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  emptyProductContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2c2c2e',
    gap: 16,
    marginTop: 10,
  },
  emptyProductText: {
    color: '#a1a1aa',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  emptyScanBtnText: {
    color: '#818cf8',
    fontWeight: '700',
    fontSize: 14,
  },
  stockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileCardFull: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  avatarCircleLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLetterLarge: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  profileNameLarge: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileRoleLarge: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  profileDetailLabel: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
  },
  profileDetailValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtnLarge: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnLargeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  guideCard: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    paddingBottom: 10,
  },
  guideTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  guideStepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  guideStepText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '800',
  },
  guideItemContent: {
    flex: 1,
  },
  guideItemTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  guideItemDesc: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
  },
  lowStockAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginTop: 18,
  },
  lowStockAlertTitle: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '800',
  },
  lowStockAlertDesc: {
    color: '#a1a1aa',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  allStockSafeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginTop: 18,
  },
  allStockSafeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsCard: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  settingsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    paddingBottom: 10,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsDesc: {
    color: '#a1a1aa',
    fontSize: 10,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2c2c2e',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#09090b',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressSubtext: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '500',
  },
  connectionErrorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionErrorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  recordingTimerContainer: {
    position: 'absolute',
    top: 160,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  backgroundUploadBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  backgroundUploadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  recordingTimerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  recordingControlPanel: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopRecordingBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stopIconSquare: {
    width: 14,
    height: 14,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  stopRecordingBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
