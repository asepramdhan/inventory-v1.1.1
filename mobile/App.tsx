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
  RefreshControl,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio, Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import * as LocalAuthentication from 'expo-local-authentication';

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
  packer_name?: string;
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
  const [userRole, setUserRole] = useState('staff');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [screen, setScreen] = useState<'LOGIN' | 'MAIN'>('LOGIN');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PACKING' | 'INVENTARIS' | 'KAS' | 'PROFILE'>('DASHBOARD');
  const [packingSubTab, setPackingSubTab] = useState<'SCANNER' | 'HISTORY'>('SCANNER');
  const [inventarisSubTab, setInventarisSubTab] = useState<'STOK' | 'BAHAN'>('STOK');

  // Biometric States woy
  const [isBiometricsSupported, setIsBiometricsSupported] = useState(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [savedPassword, setSavedPassword] = useState('');
  const [showBioPasswordModal, setShowBioPasswordModal] = useState(false);
  const [bioVerifyPasswordInput, setBioVerifyPasswordInput] = useState('');

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
  const [packedCount, setPackedCount] = useState<number>(0);
  const [processingCount, setProcessingCount] = useState<number>(0);
  const [todaySuccessCount, setTodaySuccessCount] = useState<number>(0);
  const [todayFailedCount, setTodayFailedCount] = useState<number>(0);
  const [activeChecklist, setActiveChecklist] = useState<{
    invoice: string;
    store: string;
    items: Array<{ id: number; product_name: string; quantity: number; sku: string }>;
  } | null>(null);
  const [viewingProofItem, setViewingProofItem] = useState<ScannedPackage | null>(null);
  const [supplies, setSupplies] = useState<any[]>([]);
  const [isLoadingSupplies, setIsLoadingSupplies] = useState(false);
  const [searchSupply, setSearchSupply] = useState('');

  // Quick Expense Tracker States
  const [financialAccounts, setFinancialAccounts] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState<boolean>(false);
  const [isLoadingExpenseMeta, setIsLoadingExpenseMeta] = useState<boolean>(false);

  // Proof Clean-up States (For Admin Only) woy!
  const [proofTotalSize, setProofTotalSize] = useState<number>(0);
  const [proofFilesCount, setProofFilesCount] = useState<number>(0);
  const [isLoadingProofStats, setIsLoadingProofStats] = useState<boolean>(false);
  const [cleanAgeDays, setCleanAgeDays] = useState<number>(30);
  const [isCleaningProofs, setIsCleaningProofs] = useState<boolean>(false);

  // Keuangan tab states woy!
  const [financeAccounts, setFinanceAccounts] = useState<any[]>([]);
  const [financeMutations, setFinanceMutations] = useState<any[]>([]);
  const [isLoadingFinance, setIsLoadingFinance] = useState<boolean>(false);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);

  // Staff Management States woy!
  const [showStaffListModal, setShowStaffListModal] = useState<boolean>(false);
  const [staffModalMode, setStaffModalMode] = useState<'LIST' | 'FORM'>('LIST');
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [staffRole, setStaffRole] = useState<'admin' | 'staff'>('staff');
  const [staffPermissions, setStaffPermissions] = useState<string[]>([]);

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
  const serverUrlRef = useRef('');
  const tokenRef = useRef('');

  useEffect(() => { isUploadingRef.current = isUploading; }, [isUploading]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);
  useEffect(() => { activeUploadsRef.current = activeUploads; }, [activeUploads]);
  useEffect(() => { autoCaptureRef.current = autoCapture; }, [autoCapture]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { serverUrlRef.current = serverUrl; }, [serverUrl]);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const hasMobilePermission = (perm: string) => {
    if (userRole === 'admin') return true;
    return Array.isArray(userPermissions) && userPermissions.includes(perm);
  };

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
        const savedRole = await AsyncStorage.getItem('@user_role');
        const savedPermissions = await AsyncStorage.getItem('@user_permissions');
        const savedHistory = await AsyncStorage.getItem('@scan_history');
        const savedMirror = await AsyncStorage.getItem('@mirror_preview');

        // Check biometric compatibility woy
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricsSupported(compatible && enrolled);

        const bioEnabled = await AsyncStorage.getItem('@biometric_login_enabled');
        if (bioEnabled === 'true') {
          setIsBiometricsEnabled(true);
        }

        const savedPass = await AsyncStorage.getItem('@saved_password');
        if (savedPass) {
          setSavedPassword(savedPass);
        }

        const savedSound = await AsyncStorage.getItem('@enable_sound');
        const savedHaptic = await AsyncStorage.getItem('@enable_haptic');
        if (savedSound !== null) setEnableSound(savedSound === 'true');
        if (savedHaptic !== null) setEnableHaptic(savedHaptic === 'true');

        if (savedUrl) setServerUrl(savedUrl);
        if (savedMirror) setMirrorPreview(savedMirror === 'true');
        if (savedToken) {
          setToken(savedToken);
          setScreen('MAIN');
        } else {
          // If token not present, and biometric is enabled woy, auto-trigger prompt woy
          if (compatible && enrolled && bioEnabled === 'true' && savedPass && savedEmail) {
            setTimeout(() => {
              handleBiometricLogin();
            }, 600);
          }
        }
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedName) setUserName(savedName);
        if (savedEmail) setEmail(savedEmail);
        if (savedRole) setUserRole(savedRole);
        if (savedPermissions) setUserPermissions(JSON.parse(savedPermissions));

        // Cek & muat penghitung pindaian hari ini
        const todayDateStr = new Date().toISOString().split('T')[0];
        const savedDate = await AsyncStorage.getItem('@today_date');
        const savedSuccessCount = await AsyncStorage.getItem('@today_success_count');
        const savedFailedCount = await AsyncStorage.getItem('@today_failed_count');

        if (savedDate === todayDateStr) {
          if (savedSuccessCount) setTodaySuccessCount(parseInt(savedSuccessCount, 10));
          if (savedFailedCount) setTodayFailedCount(parseInt(savedFailedCount, 10));
        } else {
          await AsyncStorage.setItem('@today_date', todayDateStr);
          await AsyncStorage.setItem('@today_success_count', '0');
          await AsyncStorage.setItem('@today_failed_count', '0');
          setTodaySuccessCount(0);
          setTodayFailedCount(0);
        }
      } catch (err) {
        console.error('Failed to load credentials:', err);
      }
    })();
  }, []);

  // Fetch scan history from server whenever the activeTab transitions to PACKING and sub-tab is HISTORY woy!
  useEffect(() => {
    if (activeTab === 'PACKING' && packingSubTab === 'HISTORY' && token) {
      fetchScanHistoryFromServer();
    }
  }, [activeTab, packingSubTab, token]);

  // Fetch finance data or expense meta from server whenever the activeTab transitions to KAS woy!
  useEffect(() => {
    if (activeTab === 'KAS' && token) {
      if (userRole === 'admin') {
        fetchFinanceData();
      }
      if (hasMobilePermission('expenses')) {
        fetchExpenseMeta();
      }
    }
  }, [activeTab, token, userRole]);

  // Fetch proof storage stats whenever activeTab is PROFILE woy!
  useEffect(() => {
    if (activeTab === 'PROFILE' && token && userRole === 'admin') {
      fetchProofStats();
    }
  }, [activeTab, token, userRole]);

  // Beep sound player
  const playBeep = async (isSuccess: boolean) => {
    if (!enableSound) return;
    // Hapus pemanggilan internet (soundjay.com) agar tidak memicu thread starvation / network contention di jaringan gudang
    console.log('Beep feedback triggered:', isSuccess ? 'SUCCESS' : 'FAILED');
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
    const activeUrl = serverUrlRef.current || serverUrl;
    const activeToken = tokenRef.current || token;
    if (!activeUrl || !activeToken) return;
    try {
      const response = await fetch(`${activeUrl}/api/mobile/stats`, {
        headers: {
          'X-Mobile-Token': activeToken,
          'Authorization': `Bearer ${activeToken}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPendingCount(data.pending_count);
        setConnectionError(false);
        if (typeof data.packed_count === 'number') {
          setPackedCount(data.packed_count);
        }
        if (typeof data.processing_count === 'number') {
          setProcessingCount(data.processing_count);
        }
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
          if (data.user.role) {
            setUserRole(data.user.role);
            await AsyncStorage.setItem('@user_role', data.user.role);
          }
          if (data.user.permissions) {
            const perms = Array.isArray(data.user.permissions) ? data.user.permissions : [];
            setUserPermissions(perms);
            await AsyncStorage.setItem('@user_permissions', JSON.stringify(perms));
          }
        }
      } else {
        if (
          response.status === 401 ||
          data.message?.toLowerCase().includes('sesi tidak valid') ||
          data.message?.toLowerCase().includes('login kembali') ||
          data.message?.toLowerCase().includes('unauthorized') ||
          data.message?.toLowerCase().includes('login terlebih dahulu')
        ) {
          handleLogout(true);
          return;
        }
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

  const fetchScanHistoryFromServer = async () => {
    try {
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;
      if (!activeUrl || !activeToken) return;

      const response = await fetch(`${activeUrl}/finance/transactions/scanner-history`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken || '',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.history)) {
        setHistory(data.history);
        await AsyncStorage.setItem('@scan_history', JSON.stringify(data.history));
      }
    } catch (err) {
      console.error('Failed to fetch scanner history:', err);
    }
  };

  const onRefreshHistory = async () => {
    setRefreshing(true);
    // Sync riwayat dari server database dan statistik secara paralel
    await Promise.all([
      fetchScanHistoryFromServer(),
      fetchStats(),
      new Promise(resolve => setTimeout(resolve, 700))
    ]);
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
        if (
          response.status === 401 ||
          data.message?.toLowerCase().includes('sesi tidak valid') ||
          data.message?.toLowerCase().includes('login kembali') ||
          data.message?.toLowerCase().includes('unauthorized') ||
          data.message?.toLowerCase().includes('login terlebih dahulu')
        ) {
          handleLogout(true);
          return;
        }
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
        if (
          response.status === 401 ||
          data.message?.toLowerCase().includes('sesi tidak valid') ||
          data.message?.toLowerCase().includes('login kembali') ||
          data.message?.toLowerCase().includes('unauthorized') ||
          data.message?.toLowerCase().includes('login terlebih dahulu')
        ) {
          handleLogout(true);
          return;
        }
        alert(data.message || 'Gagal memperbarui stok.');
      }
    } catch (err) {
      console.log('Error updating stock:', err);
      alert('Gagal menghubungi server.');
    } finally {
      setIsSearchingProduct(false);
    }
  };

  const fetchSupplies = async () => {
    if (!token) return;
    setIsLoadingSupplies(true);
    setConnectionError(false);
    try {
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;
      const response = await fetch(`${activeUrl}/operational/supplies/list-mobile`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken
        }
      });

      const data = await response.json();
      if (response.status === 401 || data.message === 'Unauthorized' || data.message === 'Sesi tidak valid') {
        handleLogout(true);
        return;
      }

      if (data.success) {
        setSupplies(data.supplies || []);
      } else {
        Alert.alert('Gagal', data.message || 'Gagal memuat data perlengkapan.');
      }
    } catch (error) {
      console.error('Fetch supplies error:', error);
      setConnectionError(true);
    } finally {
      setIsLoadingSupplies(false);
    }
  };

  const updateSupplyStock = async (id: number, newStock: number) => {
    if (!token) return;
    setConnectionError(false);
    try {
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;
      const response = await fetch(`${activeUrl}/operational/supplies/${id}/update-stock-mobile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken
        },
        body: JSON.stringify({ stock: newStock })
      });

      const data = await response.json();
      if (response.status === 401 || data.message === 'Unauthorized' || data.message === 'Sesi tidak valid') {
        handleLogout(true);
        return;
      }

      if (data.success && data.supply) {
        // Update local state
        setSupplies(prev => prev.map(s => s.id === id ? { ...s, stock: data.supply.stock } : s));
        triggerHaptic(true);
      } else {
        Alert.alert('Error', data.message || 'Gagal memperbarui stok.');
      }
    } catch (error) {
      console.error('Update supply stock error:', error);
      Alert.alert('Koneksi Error', 'Gagal terhubung ke server.');
    }
  };

  const fetchExpenseMeta = async () => {
    if (!token) return;
    setIsLoadingExpenseMeta(true);
    setConnectionError(false);
    try {
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;
      const response = await fetch(`${activeUrl}/api/mobile/expense/accounts-and-categories`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken
        }
      });

      const data = await response.json();
      if (response.status === 401 || data.message === 'Unauthorized' || data.message === 'Sesi tidak valid') {
        handleLogout(true);
        return;
      }

      if (data.success) {
        setFinancialAccounts(data.accounts || []);
        setExpenseCategories(data.categories || []);
        if (data.accounts && data.accounts.length > 0) {
          const defaultAcc = data.accounts.find((a: any) => a.is_default) || data.accounts[0];
          setSelectedAccountId(defaultAcc.id);
        }
        if (data.categories && data.categories.length > 0) {
          setSelectedCategory(data.categories[0]);
        }
      } else {
        Alert.alert('Gagal', data.message || 'Gagal memuat info keuangan.');
      }
    } catch (error) {
      console.error('Fetch expense meta error:', error);
      setConnectionError(true);
    } finally {
      setIsLoadingExpenseMeta(false);
    }
  };

  const formatRupiah = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    return parseInt(clean).toLocaleString('id-ID');
  };

  const submitExpense = async () => {
    if (!token) return false;
    const cleanAmount = expenseAmount.replace(/\./g, '').replace(/,/g, '');
    const amountVal = parseFloat(cleanAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Input Tidak Valid', 'Nominal pengeluaran harus berupa angka positif.');
      return false;
    }
    if (!selectedAccountId) {
      Alert.alert('Input Tidak Valid', 'Silakan pilih sumber dana/akun keuangan.');
      return false;
    }
    if (!selectedCategory) {
      Alert.alert('Input Tidak Valid', 'Silakan pilih kategori pengeluaran.');
      return false;
    }

    setIsSubmittingExpense(true);
    try {
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;
      const response = await fetch(`${activeUrl}/api/mobile/expense/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken
        },
        body: JSON.stringify({
          financial_account_id: selectedAccountId,
          category: selectedCategory,
          amount: amountVal,
          description: expenseDescription
        })
      });

      const data = await response.json();
      if (response.status === 401 || data.message === 'Unauthorized' || data.message === 'Sesi tidak valid') {
        handleLogout(true);
        return false;
      }

      if (data.success) {
        Alert.alert('Berhasil', data.message);
        setExpenseAmount('');
        setExpenseDescription('');
        triggerHaptic(true);
        fetchExpenseMeta();
        fetchStats();
        if (userRole === 'admin') {
          fetchFinanceData();
        }
        return true;
      } else {
        Alert.alert('Gagal', data.message || 'Gagal menyimpan pengeluaran.');
        return false;
      }
    } catch (error) {
      console.error('Submit expense error:', error);
      Alert.alert('Koneksi Error', 'Gagal menyimpan pengeluaran ke server.');
      return false;
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const fetchFinanceData = async () => {
    const activeUrl = serverUrlRef.current || serverUrl;
    const activeToken = tokenRef.current || token;
    const activeRole = userRole;
    if (activeRole !== 'admin' || !activeUrl || !activeToken) return;
    setIsLoadingFinance(true);
    try {
      const response = await fetch(`${activeUrl}/api/mobile/finance/mutations`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken || '',
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFinanceAccounts(data.accounts || []);
        setFinanceMutations(data.mutations || []);
      }
    } catch (err) {
      console.log('Failed to fetch finance data:', err);
    } finally {
      setIsLoadingFinance(false);
    }
  };

  const fetchStaffMembers = async () => {
    if (!token) return;
    setIsLoadingStaff(true);
    setConnectionError(false);
    try {
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;
      const response = await fetch(`${activeUrl}/api/mobile/users`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken
        }
      });

      const data = await response.json();
      if (response.status === 401 || data.message === 'Unauthorized' || data.message === 'Sesi tidak valid') {
        handleLogout(true);
        return;
      }

      if (data.success) {
        setStaffMembers(data.users || []);
      } else {
        Alert.alert('Gagal', data.message || 'Gagal memuat daftar petugas gudang.');
      }
    } catch (error) {
      console.error('Fetch staff error:', error);
      setConnectionError(true);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const submitStaffForm = async () => {
    if (!token) return;
    if (!staffName.trim() || !staffEmail.trim()) {
      Alert.alert('Input Tidak Valid', 'Nama dan Email wajib diisi woy.');
      return;
    }
    if (!editingStaff && !staffPassword) {
      Alert.alert('Input Tidak Valid', 'Password wajib diisi untuk petugas baru woy.');
      return;
    }

    setIsLoadingStaff(true);
    try {
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;
      
      const url = editingStaff 
        ? `${activeUrl}/api/mobile/users/${editingStaff.id}/update`
        : `${activeUrl}/api/mobile/users/store`;
      
      const method = 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken
        },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword || undefined,
          password_confirmation: staffPassword || undefined,
          role: staffRole,
          permissions: staffRole === 'staff' ? staffPermissions : [],
        })
      });

      console.log('Server response status:', response.status);
      const resText = await response.text();
      console.log('Raw response:', resText);

      let data;
      try {
        data = JSON.parse(resText);
      } catch (err) {
        console.error('Failed to parse json:', err);
        Alert.alert('Server Error', 'Respon server tidak valid (bukan JSON) woy.');
        return false;
      }

      if (response.status === 401 || data.message === 'Unauthorized' || data.message === 'Sesi tidak valid') {
        handleLogout(true);
        return false;
      }

      if (data.success) {
        Alert.alert('Berhasil', data.message);
        setEditingStaff(null);
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setStaffRole('staff');
        setStaffPermissions([]);
        fetchStaffMembers();
        return true;
      } else {
        Alert.alert('Gagal', data.message || 'Gagal menyimpan data petugas gudang.');
        return false;
      }
    } catch (error) {
      console.error('Submit staff error:', error);
      Alert.alert('Koneksi Error', 'Gagal terhubung ke server.');
      return false;
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const deleteStaffMember = async (id: number) => {
    if (!token) return;
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus petugas gudang ini woy?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setIsLoadingStaff(true);
            try {
               const activeUrl = serverUrlRef.current || serverUrl;
               const activeToken = tokenRef.current || token;
               const response = await fetch(`${activeUrl}/api/mobile/users/${id}/delete`, {
                 method: 'POST',
                 headers: {
                   'Accept': 'application/json',
                   'Authorization': `Bearer ${activeToken}`,
                   'X-Mobile-Token': activeToken
                 }
               });

               const data = await response.json();
               if (response.status === 401 || data.message === 'Unauthorized' || data.message === 'Sesi tidak valid') {
                 handleLogout(true);
                 return;
               }

               if (data.success) {
                 Alert.alert('Berhasil', data.message);
                 fetchStaffMembers();
               } else {
                 Alert.alert('Gagal', data.message || 'Gagal menghapus petugas.');
               }
            } catch (error) {
              console.error('Delete staff error:', error);
              Alert.alert('Koneksi Error', 'Gagal menghapus petugas dari server.');
            } finally {
               setIsLoadingStaff(false);
            }
          }
        }
      ]
    );
  };

  const fetchProofStats = async () => {
    const activeUrl = serverUrlRef.current || serverUrl;
    const activeToken = tokenRef.current || token;
    const activeRole = userRole;
    if (activeRole !== 'admin' || !activeUrl || !activeToken) return;
    setIsLoadingProofStats(true);
    try {
      const response = await fetch(`${activeUrl}/api/mobile/proof-stats`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken || '',
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProofTotalSize(data.proof_total_size);
        setProofFilesCount(data.proof_files_count);
      }
    } catch (err) {
      console.log('Failed to fetch proof stats:', err);
    } finally {
      setIsLoadingProofStats(false);
    }
  };

  const handleCleanProofs = async () => {
    const activeUrl = serverUrlRef.current || serverUrl;
    const activeToken = tokenRef.current || token;
    if (!activeUrl || !activeToken) return;

    Alert.alert(
      'Konfirmasi Pembersihan',
      `Apakah Anda yakin ingin menghapus seluruh berkas bukti packing (foto & video) yang berumur lebih dari ${cleanAgeDays} hari woy?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Bersihkan',
          style: 'destructive',
          onPress: async () => {
            setIsCleaningProofs(true);
            try {
              const response = await fetch(`${activeUrl}/api/mobile/clean-proofs`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${activeToken}`,
                  'X-Mobile-Token': activeToken
                },
                body: JSON.stringify({ age_days: cleanAgeDays })
              });
              const data = await response.json();
              if (response.ok && data.success) {
                Alert.alert('Berhasil', data.message || 'Storage bukti packing berhasil dibersihkan woy!');
                fetchProofStats();
              } else {
                Alert.alert('Gagal', data.message || 'Gagal membersihkan storage bukti.');
              }
            } catch (err) {
              console.log('Clean proofs error:', err);
              Alert.alert('Koneksi Error', 'Gagal menghubungkan ke server.');
            } finally {
              setIsCleaningProofs(false);
            }
          }
        }
      ]
    );
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

  // Fetch supplies whenever BAHAN tab is active woy!
  useEffect(() => {
    if (screen === 'MAIN' && activeTab === 'INVENTARIS' && inventarisSubTab === 'BAHAN' && serverUrl && token) {
      fetchSupplies();
    }
  }, [token, serverUrl, screen, activeTab, inventarisSubTab]);

  // Fetch expense meta whenever PROFILE or KAS tab is active woy!
  useEffect(() => {
    if (screen === 'MAIN' && (activeTab === 'PROFILE' || activeTab === 'KAS') && serverUrl && token) {
      fetchExpenseMeta();
    }
  }, [token, serverUrl, screen, activeTab]);

  // Auto-hide scanner tips with a smooth fade animation woy!
  useEffect(() => {
    if (activeTab === 'PACKING' && packingSubTab === 'SCANNER') {
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
        if (data.user.role) {
          await AsyncStorage.setItem('@user_role', data.user.role);
          setUserRole(data.user.role);
        } else {
          await AsyncStorage.setItem('@user_role', 'staff');
          setUserRole('staff');
        }
        if (data.user.permissions) {
          const perms = Array.isArray(data.user.permissions) ? data.user.permissions : [];
          await AsyncStorage.setItem('@user_permissions', JSON.stringify(perms));
          setUserPermissions(perms);
        } else {
          await AsyncStorage.setItem('@user_permissions', JSON.stringify([]));
          setUserPermissions([]);
        }

        setServerUrl(cleanUrl);
        setToken(data.token);
        setUserName(data.user.name);
        setEmail(data.user.email);
        setScreen('MAIN');
        setSavedPassword(password);
        setPassword('');

        // Offer biometric activation woy
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const bioEnabled = await AsyncStorage.getItem('@biometric_login_enabled');
        if (compatible && enrolled && bioEnabled !== 'true') {
          setTimeout(() => {
            Alert.alert(
              'Aktifkan Sidik Jari woy?',
              'Apakah Anda ingin mengaktifkan login sidik jari untuk masuk lebih cepat berikutnya woy?',
              [
                { text: 'Nanti Saja', style: 'cancel' },
                {
                  text: 'Aktifkan',
                  onPress: async () => {
                    const result = await LocalAuthentication.authenticateAsync({
                      promptMessage: 'Konfirmasi sidik jari Anda woy',
                    });
                    if (result.success) {
                      await AsyncStorage.setItem('@biometric_login_enabled', 'true');
                      await AsyncStorage.setItem('@saved_password', password);
                      setIsBiometricsEnabled(true);
                      Alert.alert('Berhasil', 'Login sidik jari berhasil diaktifkan woy!');
                    }
                  }
                }
              ]
            );
          }, 800);
        }
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

  const handleBiometricLogin = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('@user_email');
      const savedPass = await AsyncStorage.getItem('@saved_password');
      const savedUrl = await AsyncStorage.getItem('@server_url');

      if (!savedEmail || !savedPass || !savedUrl) {
        Alert.alert('Error', 'Tidak ada data sidik jari yang terdaftar di perangkat ini woy.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Pindai sidik jari atau wajah Anda untuk masuk woy',
        fallbackLabel: 'Gunakan Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsUploading(true);
        try {
          const response = await fetch(`${savedUrl}/api/mobile/login`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: savedEmail, password: savedPass })
          });

          const data = await response.json();
          if (response.ok && data.success) {
            await AsyncStorage.setItem('@auth_token', data.token);
            await AsyncStorage.setItem('@user_name', data.user.name);
            if (data.user.role) {
              await AsyncStorage.setItem('@user_role', data.user.role);
              setUserRole(data.user.role);
            }
            if (data.user.permissions) {
              const perms = Array.isArray(data.user.permissions) ? data.user.permissions : [];
              await AsyncStorage.setItem('@user_permissions', JSON.stringify(perms));
              setUserPermissions(perms);
            }

            setToken(data.token);
            setUserName(data.user.name);
            setEmail(data.user.email);
            setSavedPassword(savedPass);
            setScreen('MAIN');
            setPassword('');
            triggerHaptic(true);
            showStatus('Login sidik jari berhasil woy!', 'success');
          } else {
            Alert.alert('Gagal Masuk', data.message || 'Gagal login biometrik, silakan masuk manual woy.');
          }
        } catch (err) {
          Alert.alert('Koneksi Error', 'Gagal menghubungkan ke server woy.');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleVerifyBioPassword = async () => {
    if (!bioVerifyPasswordInput.trim()) {
      Alert.alert('Input Tidak Valid', 'Silakan masukkan password Anda woy.');
      return;
    }

    const activeUrl = serverUrlRef.current || serverUrl;
    if (!activeUrl || !email) {
      Alert.alert('Error', 'Data server atau email tidak ditemukan woy.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(`${activeUrl}/api/mobile/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password: bioVerifyPasswordInput })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Pindai sidik jari Anda untuk menyelesaikan aktivasi woy',
        });

        if (result.success) {
          await AsyncStorage.setItem('@biometric_login_enabled', 'true');
          await AsyncStorage.setItem('@saved_password', bioVerifyPasswordInput);
          setIsBiometricsEnabled(true);
          setSavedPassword(bioVerifyPasswordInput);
          setShowBioPasswordModal(false);
          setBioVerifyPasswordInput('');
          Alert.alert('Berhasil', 'Login sidik jari berhasil diaktifkan woy!');
          triggerHaptic(true);
        }
      } else {
        Alert.alert('Gagal Verifikasi', data.message || 'Password yang Anda masukkan salah woy.');
      }
    } catch (err) {
      Alert.alert('Koneksi Error', 'Gagal memverifikasi password ke server woy.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async (isSessionExpired: boolean = false) => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@user_name');
      await AsyncStorage.removeItem('@user_role');
      await AsyncStorage.removeItem('@user_permissions');
      setToken('');
      setUserName('');
      setUserRole('staff');
      setUserPermissions([]);
      setScreen('LOGIN');

      // Keep email if biometrics enabled woy
      const bioEnabled = await AsyncStorage.getItem('@biometric_login_enabled');
      if (bioEnabled !== 'true') {
        await AsyncStorage.removeItem('@user_email');
        setEmail('');
      }

      if (isSessionExpired) {
        Alert.alert(
          'Sesi Berakhir',
          'Sesi Anda telah kedaluwarsa. Silakan masuk kembali woy.'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle camera scanned barcode event (useCallback dengan dependensi kosong agar referensinya 100% statis & tidak merusak sesi kamera)
  const handleBarcodeScanned = useCallback(async (scanningResult: { data: string }) => {
    const { data } = scanningResult;
    if (!data) return;

    if (
      isUploadingRef.current ||
      isRecordingRef.current ||
      cameraModeRef.current === 'video'
    ) {
      return;
    }

    setActiveChecklist(null);

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
      // Kunci state kesibukan secara INSTAN agar scanner dinonaktifkan di level hardware khusus untuk mode Auto-Capture
      isUploadingRef.current = true;
      setIsUploading(true);

      // Tampilkan indikator persiapan agar petugas menahan HP dengan stabil
      showStatus('📸 Mempersiapkan kamera...', 'success', 1000);

      // Jeda 1200ms agar hardware kamera selesai menonaktifkan decoder barcode, menstabilkan fokus, dan merestart frame buffer sebelum jepret
      setTimeout(() => {
        checkAndStartRecording(cleanData);
      }, 1200);
    }
  }, []);

  const checkAndStartRecording = async (data: string) => {
    // Kunci kesibukan secara instan dan beri indikasi verifikasi
    setIsUploading(true);
    isUploadingRef.current = true;
    showStatus('🔍 Memverifikasi resi di database...', 'success', 2000);

    const isAlreadyScanned = historyRef.current.some(
      (item) =>
        item.status === 'success' &&
        (item.invoice_number === data || item.waybill_number === data)
    );

    try {
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;

      // Panggil API searchProof untuk cek keberadaan resi di database
      const response = await fetch(`${activeUrl}/finance/transactions/search-proof?query=${encodeURIComponent(data)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken || '',
          'Accept': 'application/json'
        }
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        if (
          response.status === 401 ||
          resData.message?.toLowerCase().includes('sesi tidak valid') ||
          resData.message?.toLowerCase().includes('login kembali') ||
          resData.message?.toLowerCase().includes('unauthorized') ||
          resData.message?.toLowerCase().includes('login terlebih dahulu')
        ) {
          handleLogout(true);
          return;
        }
        const errMsg = resData.message || 'Resi tidak ditemukan di database.';
        showStatus(`Gagal: ${errMsg}`, 'error');
        triggerHaptic(false);
        playBeep(false);
        saveFailedScan(data, errMsg);

        // Buka kembali kunci scanner
        setLastScannedBarcode('');
        lastScannedBarcodeRef.current = '';
        setIsUploading(false);
        isUploadingRef.current = false;
        return;
      }

      // Jika lolos verifikasi database, baru lanjut ke alur perekaman
      setActiveChecklist({
        invoice: resData.transaction.invoice_number,
        store: `${resData.transaction.store_name} (${resData.transaction.platform})`,
        items: resData.transaction.items || []
      });

      if (isAlreadyScanned) {
        Alert.alert(
          '⚠️ Resi Sudah Dipacking',
          `Resi "${data}" sudah dipacking sebelumnya hari ini. Apakah Anda yakin ingin memproses ulang?`,
          [
            {
              text: 'Batal', style: 'cancel', onPress: () => {
                setActiveChecklist(null);
                setLastScannedBarcode('');
                lastScannedBarcodeRef.current = '';
                setIsUploading(false);
                isUploadingRef.current = false;
              }
            },
            {
              text: 'Lanjutkan', onPress: () => {
                startVideoRecordingWorkflow(data);
              }
            }
          ]
        );
      } else {
        startVideoRecordingWorkflow(data);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || 'Error koneksi verifikasi.';
      showStatus(`Gagal verifikasi database: ${errMsg}`, 'error');
      triggerHaptic(false);
      playBeep(false);
      saveFailedScan(data, `Verifikasi Gagal: ${errMsg}`);

      // Buka kunci scanner
      setLastScannedBarcode('');
      lastScannedBarcodeRef.current = '';
      setIsUploading(false);
      isUploadingRef.current = false;
    }
  };

  const startVideoRecordingWorkflow = async (targetBarcode: string) => {
    setBarcode(targetBarcode);
    setStatusMsg(null);
    setIsUploading(true);
    isUploadingRef.current = true;

    // Jeda 300ms agar React selesai re-render dan menonaktifkan barcodeScannerSettings sebelum jepret foto!
    await new Promise(resolve => setTimeout(resolve, 300));

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
            maxDuration: 60, // Batasi 60 detik agar waktu packing cukup woy!
            quality: '480p', // Gunakan resolusi 480p agar size video di iOS & Android kecil woy!
            mute: true,      // Nonaktifkan suara (tidak dibutuhkan) agar file berkurang drastis woy!
            codec: Platform.OS === 'ios' ? 'avc1' : undefined
          }).then(async (video: any) => {
            if (video && video.uri) {
              // Berhentikan timer rekam di layar HP terlebih dahulu
              setIsRecording(false);
              isRecordingRef.current = false;
              if (recordTimerIdRef.current) {
                clearInterval(recordTimerIdRef.current);
                recordTimerIdRef.current = null;
              }
              // Berikan jeda 1 detik agar file video selesai ditulis & dilepas dari kunci OS sebelum diunggah!
              await new Promise(resolve => setTimeout(resolve, 1000));
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
      const activeUrl = serverUrlRef.current || serverUrl;
      const activeToken = tokenRef.current || token;

      const response = await fetch(`${activeUrl}/finance/transactions/barcode-upload-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'X-Mobile-Token': activeToken || '',
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

        // Tambah hitungan sukses hari ini secara lokal
        setTodaySuccessCount(prev => {
          const next = prev + 1;
          AsyncStorage.setItem('@today_success_count', next.toString());
          return next;
        });

        const newScan: ScannedPackage = {
          id: Math.random().toString(),
          invoice_number: data.transaction.invoice_number,
          waybill_number: data.transaction.waybill_number,
          package_proof: data.transaction.package_proof,
          store_name: data.transaction.store_name,
          platform: data.transaction.platform,
          scanned_at: new Date().toLocaleTimeString('id-ID'),
          status: 'success',
          packer_name: data.transaction.packer_name || userName || 'Petugas'
        };

        const updatedHistory = [newScan, ...(historyRef.current || history).slice(0, 19)];
        setHistory(updatedHistory);
        await AsyncStorage.setItem('@scan_history', JSON.stringify(updatedHistory));
      } else {
        if (
          response.status === 401 ||
          data.message?.toLowerCase().includes('sesi tidak valid') ||
          data.message?.toLowerCase().includes('login kembali') ||
          data.message?.toLowerCase().includes('unauthorized') ||
          data.message?.toLowerCase().includes('login terlebih dahulu')
        ) {
          handleLogout(true);
          return;
        }
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
    // Tambah hitungan gagal hari ini secara lokal
    setTodayFailedCount(prev => {
      const next = prev + 1;
      AsyncStorage.setItem('@today_failed_count', next.toString());
      return next;
    });

    const failedScan: ScannedPackage = {
      id: Math.random().toString(),
      invoice_number: failedBarcode,
      waybill_number: null,
      package_proof: '',
      store_name: 'Unknown',
      platform: 'Error',
      scanned_at: new Date().toLocaleTimeString('id-ID'),
      status: 'error',
      errorMessage: reason,
      packer_name: userName || 'Petugas'
    };

    const updatedHistory = [failedScan, ...(historyRef.current || history).slice(0, 19)];
    setHistory(updatedHistory);
    await AsyncStorage.setItem('@scan_history', JSON.stringify(updatedHistory));
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

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <TouchableOpacity 
              style={[styles.primaryButton, { flex: 1, marginTop: 0 }]} 
              onPress={handleLogin} 
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Hubungkan Scanner</Text>
              )}
            </TouchableOpacity>

            {isBiometricsSupported && isBiometricsEnabled && (
              <TouchableOpacity 
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  borderColor: '#6366f1',
                  borderWidth: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={handleBiometricLogin}
                disabled={isUploading}
              >
                <Ionicons name="finger-print-outline" size={24} color="#6366f1" />
              </TouchableOpacity>
            )}
          </View>
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
              {/* Dashboard Greeting Header */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#6366f1', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  STASIUN PACKING GUDANG
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>
                  Halo, {userName || 'Petugas'}! 👋
                </Text>
                <Text style={{ color: '#71717a', fontSize: 11, marginTop: 4 }}>
                  Pantau antrean pesanan dan lakukan packing dengan scan barcode resi.
                </Text>
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

              {/* Row 1: Status Pesanan */}
              <View style={[styles.statsRow, { marginBottom: 12 }]}>
                <View style={styles.statsCard}>
                  <Ionicons name="list-outline" size={18} color="#f43f5e" />
                  <Text style={[styles.statsValue, { color: '#f43f5e', marginTop: 6 }]}>{pendingCount}</Text>
                  <Text style={styles.statsLabel}>Antrean</Text>
                </View>
                <View style={styles.statsCard}>
                  <Ionicons name="archive-outline" size={18} color="#a855f7" />
                  <Text style={[styles.statsValue, { color: '#a855f7', marginTop: 6 }]}>{packedCount}</Text>
                  <Text style={styles.statsLabel}>Packed</Text>
                </View>
                <View style={styles.statsCard}>
                  <Ionicons name="cube-outline" size={18} color="#3b82f6" />
                  <Text style={[styles.statsValue, { color: '#3b82f6', marginTop: 6 }]}>{processingCount}</Text>
                  <Text style={styles.statsLabel}>Dikirim</Text>
                </View>
              </View>

              {/* Row 2: Aktivitas Pindaian Hari Ini */}
              <View style={styles.statsRow}>
                <View style={styles.statsCard}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#22c55e" />
                  <Text style={[styles.statsValue, { color: '#22c55e', marginTop: 6 }]}>{todaySuccessCount}</Text>
                  <Text style={styles.statsLabel}>Sukses Hari Ini</Text>
                </View>
                <View style={styles.statsCard}>
                  <Ionicons name="close-circle-outline" size={18} color="#f59e0b" />
                  <Text style={[styles.statsValue, { color: '#f59e0b', marginTop: 6 }]}>{todayFailedCount}</Text>
                  <Text style={styles.statsLabel}>Gagal Hari Ini</Text>
                </View>
              </View>

              {/* Real-time Stock Alerts */}
              {lowStockCount > 0 ? (
                <TouchableOpacity
                  style={styles.lowStockAlertCard}
                  onPress={() => {
                    setActiveTab('INVENTARIS');
                    setInventarisSubTab('STOK');
                  }}
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
                const totalCount = todaySuccessCount + todayFailedCount;
                const successRate = totalCount > 0 ? Math.round((todaySuccessCount / totalCount) * 100) : 0;

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
                      {todaySuccessCount} dari {totalCount} paket berhasil diproses hari ini
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

          {activeTab === 'PACKING' && packingSubTab === 'SCANNER' && (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={StyleSheet.absoluteFill}>
                {/* Segmented control toggle bar floating woy */}
                <View style={[styles.topTabBar, { position: 'absolute', top: 50, left: 16, right: 16, zIndex: 99999, marginHorizontal: 0, marginTop: 0, backgroundColor: 'rgba(24, 24, 27, 0.85)' }]}>
                  <TouchableOpacity
                    style={[styles.topTabButton, (packingSubTab as string) === 'SCANNER' && styles.topTabButtonActive]}
                    onPress={() => setPackingSubTab('SCANNER')}
                  >
                    <Text style={[styles.topTabText, (packingSubTab as string) === 'SCANNER' && styles.topTabTextActive]}>Stasiun Scan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topTabButton, (packingSubTab as string) === 'HISTORY' && styles.topTabButtonActive]}
                    onPress={() => {
                      setPackingSubTab('HISTORY');
                      fetchScanHistoryFromServer();
                    }}
                  >
                    <Text style={[styles.topTabText, (packingSubTab as string) === 'HISTORY' && styles.topTabTextActive]}>Riwayat Scan</Text>
                  </TouchableOpacity>
                </View>

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
                  videoBitrate={800000} // Batasi bitrate ke 800 kbps woy!
                  barcodeScannerSettings={
                    isUploading || isRecording || cameraMode === 'video'
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
                        transform: [{ translateY }],
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6
                      }
                    ]}>
                      <Ionicons 
                        name={statusMsg.type === 'success' ? "checkmark-circle" : "alert-circle"} 
                        size={15} 
                        color="#ffffff" 
                      />
                      <Text style={styles.floatingStatusText}>{statusMsg.text}</Text>
                    </Animated.View>
                  )}

                  {activeUploads > 0 && (
                    <View style={styles.backgroundUploadBadge}>
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.backgroundUploadText}>Mengunggah {activeUploads} bukti...</Text>
                    </View>
                  )}

                  {activeChecklist && (
                    <View style={styles.checklistCard}>
                      <View style={styles.checklistHeader}>
                        <Ionicons name="clipboard-outline" size={16} color="#22c55e" style={{ marginRight: 6 }} />
                        <Text style={styles.checklistInvoice} numberOfLines={1}>
                          {activeChecklist.invoice}
                        </Text>
                        <Text style={styles.checklistStore} numberOfLines={1}>
                          {activeChecklist.store}
                        </Text>
                      </View>
                      <View style={styles.checklistDivider} />
                      <ScrollView style={styles.checklistScroll} nestedScrollEnabled={true}>
                        {activeChecklist.items.map((item, index) => (
                          <View key={item.id || index} style={styles.checklistItemRow}>
                            <Ionicons name="checkbox-outline" size={14} color="#a1a1aa" style={{ marginRight: 6, marginTop: 2 }} />
                            <Text style={styles.checklistQty}>{item.quantity}x</Text>
                            <Text style={styles.checklistProductName} numberOfLines={2}>
                              {item.product_name}
                            </Text>
                            {item.sku && item.sku !== '-' && (
                              <Text style={styles.checklistSku}>({item.sku})</Text>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {isRecording && (
                    <View style={styles.floatingTimerBadge}>
                      <View style={[styles.recordingDot, { opacity: recordingSeconds % 2 === 0 ? 1 : 0.2 }]} />
                      <Text style={styles.floatingTimerText}>
                        {(() => {
                          const rem = Math.max(0, 60 - recordingSeconds);
                          return `REC 00:${rem < 10 ? `0${rem}` : rem}`;
                        })()}
                      </Text>
                    </View>
                  )}

                  {!isRecording && (
                    <>
                      {/* Floating Auto-Foto Toggle Button restored to top-right woy */}
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
                      {/* Toolbar: Flash, Flip Camera, Mirror, Manual Toggle (Clean 4 buttons woy!) */}
                      <View style={styles.bottomToolbar}>
                        <TouchableOpacity 
                          style={[styles.toolbarBtn, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} 
                          onPress={() => setFlash(!flash)}
                        >
                          <Ionicons name={flash ? "flash" : "flash-outline"} size={12} color={flash ? "#eab308" : "#ffffff"} />
                          <Text style={styles.toolbarBtnText}>Flash</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.toolbarBtn, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} 
                          onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}
                        >
                          <Ionicons name="camera-reverse" size={12} color="#ffffff" />
                          <Text style={styles.toolbarBtnText}>{facing === 'back' ? 'Belakang' : 'Depan'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.toolbarBtn, { flexDirection: 'row', alignItems: 'center', gap: 4 }]} 
                          onPress={toggleMirror}
                        >
                          <Ionicons name="swap-horizontal" size={12} color={mirrorPreview ? "#6366f1" : "#ffffff"} />
                          <Text style={styles.toolbarBtnText}>{mirrorPreview ? 'Mirror' : 'Normal'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.toolbarBtn, 
                            { flexDirection: 'row', alignItems: 'center', gap: 4 },
                            showManualInput && { backgroundColor: '#4f46e5', borderColor: '#4f46e5' }
                          ]}
                          onPress={() => setShowManualInput(!showManualInput)}
                        >
                          <Ionicons name="create-outline" size={12} color="#ffffff" />
                          <Text style={styles.toolbarBtnText}>Manual</Text>
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

          {activeTab === 'PACKING' && packingSubTab === 'HISTORY' && (
            <View style={styles.tabContent}>
              {/* Segmented control toggle bar woy */}
              <View style={[styles.topTabBar, { marginHorizontal: 0, marginTop: 0, marginBottom: 16 }]}>
                <TouchableOpacity
                  style={[styles.topTabButton, (packingSubTab as string) === 'SCANNER' && styles.topTabButtonActive]}
                  onPress={() => setPackingSubTab('SCANNER')}
                >
                  <Text style={[styles.topTabText, (packingSubTab as string) === 'SCANNER' && styles.topTabTextActive]}>Stasiun Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.topTabButton, (packingSubTab as string) === 'HISTORY' && styles.topTabButtonActive]}
                  onPress={() => {
                    setPackingSubTab('HISTORY');
                    fetchScanHistoryFromServer();
                  }}
                >
                  <Text style={[styles.topTabText, (packingSubTab as string) === 'HISTORY' && styles.topTabTextActive]}>Riwayat Scan</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tabHeaderRow}>
                <Text style={styles.tabHeaderTitle}>
                  Riwayat Scan Hari Ini {history.length > 0 ? `(${history.length})` : ''}
                </Text>
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
                renderItem={({ item }) => {
                  const CardWrapper = item.status === 'success' ? TouchableOpacity : View;

                  // Styles platform woy
                  const getPlatformStyles = (platform: string) => {
                    const name = (platform || '').toLowerCase();
                    if (name.includes('shopee')) return { bg: 'rgba(234, 88, 12, 0.12)', text: '#f97316', border: 'rgba(234, 88, 12, 0.25)' };
                    if (name.includes('tokopedia')) return { bg: 'rgba(22, 163, 74, 0.12)', text: '#22c55e', border: 'rgba(22, 163, 74, 0.25)' };
                    if (name.includes('lazada')) return { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' };
                    if (name.includes('tiktok')) return { bg: 'rgba(255, 255, 255, 0.08)', text: '#e4e4e7', border: 'rgba(255, 255, 255, 0.15)' };
                    return { bg: 'rgba(107, 114, 128, 0.12)', text: '#9ca3af', border: 'rgba(107, 114, 128, 0.25)' };
                  };

                  const pStyles = getPlatformStyles(item.platform);

                  return (
                    <CardWrapper
                      activeOpacity={item.status === 'success' ? 0.75 : 1}
                      onPress={item.status === 'success' ? () => setViewingProofItem(item) : undefined}
                      style={[
                        styles.historyItem,
                        item.status === 'success'
                          ? { borderLeftWidth: 4, borderLeftColor: '#22c55e' }
                          : { borderLeftWidth: 4, borderLeftColor: '#ef4444' }
                      ]}
                    >
                      <View style={{ marginRight: 10, justifyContent: 'center' }}>
                        {item.status === 'success' ? (
                          <View style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', padding: 6, borderRadius: 20 }}>
                            <Ionicons name="play" size={14} color="#22c55e" />
                          </View>
                        ) : (
                          <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: 6, borderRadius: 20 }}>
                            <Ionicons name="alert-circle" size={14} color="#ef4444" />
                          </View>
                        )}
                      </View>

                      <View style={styles.historyMain}>
                        <Text style={styles.itemBarcode}>{item.invoice_number}</Text>

                        {item.waybill_number && item.waybill_number !== '-' && (
                          <Text style={{ color: '#a1a1aa', fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>
                            Resi: {item.waybill_number}
                          </Text>
                        )}

                        <View style={styles.badgeRow}>
                          {item.status === 'success' ? (
                            <>
                              <View style={{
                                backgroundColor: pStyles.bg,
                                borderColor: pStyles.border,
                                borderWidth: 1,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 6
                              }}>
                                <Text style={{ color: pStyles.text, fontSize: 9, fontWeight: '700' }}>
                                  {item.store_name} ({item.platform})
                                </Text>
                              </View>
                              {item.packer_name && item.packer_name !== '-' && (
                                <View style={{
                                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                  borderColor: 'rgba(99, 102, 241, 0.25)',
                                  borderWidth: 1,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 6,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 3
                                }}>
                                  <Ionicons name="person-outline" size={8} color="#818cf8" />
                                  <Text style={{ color: '#818cf8', fontSize: 9, fontWeight: '700' }}>
                                    {item.packer_name}
                                  </Text>
                                </View>
                              )}
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Text style={styles.successText}>Success</Text>
                              </View>
                            </>
                          ) : (
                            <>
                              <Text style={styles.errorText} numberOfLines={1}>
                                Gagal: {item.errorMessage}
                              </Text>
                              {item.packer_name && item.packer_name !== '-' && (
                                <View style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  borderColor: 'rgba(255, 255, 255, 0.15)',
                                  borderWidth: 1,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 6,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 3
                                }}>
                                  <Ionicons name="person-outline" size={8} color="#a1a1aa" />
                                  <Text style={{ color: '#a1a1aa', fontSize: 9, fontWeight: '700' }}>
                                    {item.packer_name}
                                  </Text>
                                </View>
                              )}
                            </>
                          )}
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 }}>
                        <Text style={styles.itemTime}>{item.scanned_at}</Text>
                      </View>
                    </CardWrapper>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada paket yang dipindai.</Text>
                  </View>
                }
              />
            </View>
          )}

          {/* Stok Tab */}
          {activeTab === 'INVENTARIS' && inventarisSubTab === 'STOK' && (
            <ScrollView
              style={{ flex: 1, backgroundColor: '#09090b' }}
              contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
            >
              {/* Segmented control toggle bar woy */}
              {hasMobilePermission('products') && hasMobilePermission('supplies') && (
                <View style={[styles.topTabBar, { marginHorizontal: 0, marginTop: 0, marginBottom: 16 }]}>
                  <TouchableOpacity
                    style={[styles.topTabButton, (inventarisSubTab as string) === 'STOK' && styles.topTabButtonActive]}
                    onPress={() => setInventarisSubTab('STOK')}
                  >
                    <Text style={[styles.topTabText, (inventarisSubTab as string) === 'STOK' && styles.topTabTextActive]}>Stok Barang</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topTabButton, (inventarisSubTab as string) === 'BAHAN' && styles.topTabButtonActive]}
                    onPress={() => {
                      setInventarisSubTab('BAHAN');
                      fetchSupplies();
                    }}
                  >
                    <Text style={[styles.topTabText, (inventarisSubTab as string) === 'BAHAN' && styles.topTabTextActive]}>Bahan Packing</Text>
                  </TouchableOpacity>
                </View>
              )}

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

          {/* Keuangan Tab woy! */}
          {activeTab === 'KAS' && (userRole === 'admin' || hasMobilePermission('expenses')) && (
            <ScrollView
              style={{ flex: 1, backgroundColor: '#09090b' }}
              contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
              alwaysBounceVertical={true}
              refreshControl={
                userRole === 'admin' ? (
                  <RefreshControl
                    refreshing={isLoadingFinance}
                    onRefresh={fetchFinanceData}
                    tintColor="#4f46e5"
                    colors={["#4f46e5"]}
                  />
                ) : undefined
              }
            >
              <View style={styles.tabHeaderRow}>
                <Text style={styles.tabHeaderTitle}>Keuangan & Kas</Text>
                {userRole === 'admin' && (
                  <TouchableOpacity onPress={fetchFinanceData} disabled={isLoadingFinance}>
                    <Ionicons 
                      name="refresh" 
                      size={16} 
                      color="#4f46e5" 
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Saldo Akun Keuangan woy */}
              {userRole === 'admin' && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#a1a1aa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
                    Saldo Akun Terkini
                  </Text>
                  <ScrollView 
                    horizontal={true} 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingRight: 20 }}
                  >
                    {financeAccounts.map((acc) => (
                      <View 
                        key={acc.id}
                        style={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderWidth: 1,
                          borderRadius: 14,
                          padding: 12,
                          width: 145,
                        }}
                      >
                        <Text style={{ color: '#a1a1aa', fontSize: 10, fontWeight: '600' }} numberOfLines={1}>
                          {acc.name}
                        </Text>
                        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800', marginTop: 4 }}>
                          Rp {parseInt(acc.current_balance).toLocaleString('id-ID')}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Quick Expense Tracker Modal Trigger woy */}
              {hasMobilePermission('expenses') && (
                <>
                  {userRole === 'admin' ? (
                    <TouchableOpacity
                      style={{
                        backgroundColor: 'rgba(79, 70, 229, 0.08)',
                        borderColor: 'rgba(79, 70, 229, 0.25)',
                        borderWidth: 1,
                        borderRadius: 14,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 20
                      }}
                      onPress={() => {
                        setShowExpenseModal(true);
                        fetchExpenseMeta();
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ backgroundColor: '#4f46e5', padding: 8, borderRadius: 10 }}>
                          <Ionicons name="cash-outline" size={16} color="#ffffff" />
                        </View>
                        <View>
                          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Catat Pengeluaran Gudang</Text>
                          <Text style={{ color: '#a1a1aa', fontSize: 10, marginTop: 2 }}>Catat pengeluaran kecil / jajan gudang secara instan</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#4f46e5" />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
                      <View style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: 24, borderRadius: 50, marginBottom: 16 }}>
                        <Ionicons name="wallet-outline" size={48} color="#4f46e5" />
                      </View>
                      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', marginBottom: 8 }}>Pencatatan Keuangan</Text>
                      <Text style={{ color: '#a1a1aa', fontSize: 11, textAlign: 'center', marginHorizontal: 20, marginBottom: 24, lineHeight: 16 }}>
                        Anda memiliki akses untuk mencatat pengeluaran operasional / belanja jajanan gudang woy.
                      </Text>
                      <TouchableOpacity
                        style={[styles.primaryButton, { width: 220, height: 46 }]}
                        onPress={() => {
                          setShowExpenseModal(true);
                          fetchExpenseMeta();
                        }}
                      >
                        <Ionicons name="cash-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>Catat Pengeluaran Baru</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {/* Mutasi Kas Terakhir (Admin Only) woy */}
              {userRole === 'admin' && (
                <View>
                  <Text style={{ color: '#a1a1aa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>
                    20 Mutasi Kas Terakhir woy
                  </Text>
                  {financeMutations.map((item, idx) => {
                    const isIncome = item.type === 'income' || item.type === 'debit';
                    return (
                      <View 
                        key={item.id || idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        <View style={{ marginRight: 10 }}>
                          <View style={{
                            backgroundColor: isIncome ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            padding: 6,
                            borderRadius: 8,
                          }}>
                            <Ionicons 
                              name={isIncome ? "trending-up-outline" : "trending-down-outline"} 
                              size={14} 
                              color={isIncome ? "#22c55e" : "#ef4444"} 
                            />
                          </View>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                            {item.description}
                          </Text>
                          <Text style={{ color: '#a1a1aa', fontSize: 9, marginTop: 2 }}>
                            {item.account_name} • {item.category}
                          </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                          <Text style={{ 
                            color: isIncome ? '#22c55e' : '#ef4444', 
                            fontSize: 11, 
                            fontWeight: '800' 
                          }}>
                            {isIncome ? '+' : '-'} Rp {parseInt(item.amount).toLocaleString('id-ID')}
                          </Text>
                          <Text style={{ color: '#71717a', fontSize: 8, marginTop: 2 }}>
                            {item.date}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  {financeMutations.length === 0 && (
                    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                      <Text style={{ color: '#71717a', fontSize: 11, fontStyle: 'italic' }}>
                        Belum ada mutasi keuangan tercatat.
                      </Text>
                    </View>
                  )}
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
                <Text style={styles.profileRoleLarge}>
                  {userRole === 'admin' ? 'Owner / Admin Utama' : 'Petugas Gudang / Packing'}
                </Text>

                <View style={styles.divider} />

                <View style={styles.profileDetailRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="mail-outline" size={14} color="#71717a" style={{ marginRight: 6 }} />
                    <Text style={styles.profileDetailLabel}>Email</Text>
                  </View>
                  <Text style={styles.profileDetailValue}>{email || '-'}</Text>
                </View>
                <View style={styles.profileDetailRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <Ionicons name="server-outline" size={14} color="#71717a" style={{ marginRight: 6 }} />
                    <Text style={styles.profileDetailLabel}>Server URL</Text>
                  </View>
                  <Text style={[styles.profileDetailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                    {serverUrl}
                  </Text>
                </View>
                <View style={styles.profileDetailRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="link-outline" size={14} color="#71717a" style={{ marginRight: 6 }} />
                    <Text style={styles.profileDetailLabel}>Status</Text>
                  </View>
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

                {isBiometricsSupported && (
                  <View style={[styles.settingsRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(63, 63, 70, 0.2)', paddingTop: 12 }]}>
                    <View>
                      <Text style={styles.settingsLabel}>Login Sidik Jari</Text>
                      <Text style={styles.settingsDesc}>Masuk cepat dengan pemindai sidik jari/wajah</Text>
                    </View>
                    <Switch
                      trackColor={{ false: '#2c2c2e', true: '#4f46e5' }}
                      thumbColor={isBiometricsEnabled ? '#ffffff' : '#a1a1aa'}
                      value={isBiometricsEnabled}
                      onValueChange={async (value) => {
                        if (value) {
                          if (!savedPassword) {
                            setShowBioPasswordModal(true);
                          } else {
                            const result = await LocalAuthentication.authenticateAsync({
                              promptMessage: 'Konfirmasi sidik jari Anda woy',
                            });
                            if (result.success) {
                              setIsBiometricsEnabled(true);
                              await AsyncStorage.setItem('@biometric_login_enabled', 'true');
                              await AsyncStorage.setItem('@saved_password', savedPassword);
                              Alert.alert('Berhasil', 'Login sidik jari berhasil diaktifkan woy!');
                            }
                          }
                        } else {
                          setIsBiometricsEnabled(false);
                          await AsyncStorage.setItem('@biometric_login_enabled', 'false');
                          await AsyncStorage.removeItem('@saved_password');
                          Alert.alert('Berhasil', 'Login sidik jari dinonaktifkan woy.');
                        }
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Proof Clean-up Card (Admin Only) woy! */}
              {userRole === 'admin' && (
                <View style={styles.settingsCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.settingsTitle}>🧹 Pembersihan Storage Bukti</Text>
                    <TouchableOpacity 
                      onPress={fetchProofStats} 
                      disabled={isLoadingProofStats}
                      style={{ padding: 4 }}
                    >
                      <Ionicons 
                        name="refresh-outline" 
                        size={16} 
                        color="#a1a1aa" 
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={{ 
                    backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                    borderColor: 'rgba(245, 158, 11, 0.2)', 
                    borderWidth: 1, 
                    padding: 10, 
                    borderRadius: 8, 
                    marginVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <Ionicons name="server-outline" size={18} color="#f59e0b" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: '700' }}>
                        Kapasitas Bukti Terpakai:
                      </Text>
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800', marginTop: 2 }}>
                        {proofTotalSize > 1024 * 1024 
                          ? `${(proofTotalSize / (1024 * 1024)).toFixed(2)} MB` 
                          : `${(proofTotalSize / 1024).toFixed(2)} KB`} ({proofFilesCount} berkas)
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Batas Umur Bukti Yang Dihapus:</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
                    {[14, 30, 60].map((days) => {
                      const isSelected = cleanAgeDays === days;
                      return (
                        <TouchableOpacity
                          key={days}
                          onPress={() => setCleanAgeDays(days)}
                          style={{
                            flex: 1,
                            backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(24, 24, 27, 0.8)',
                            borderColor: isSelected ? '#f59e0b' : 'rgba(63, 63, 70, 0.4)',
                            borderWidth: 1,
                            borderRadius: 8,
                            paddingVertical: 8,
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{
                            color: isSelected ? '#f59e0b' : '#a1a1aa',
                            fontSize: 10,
                            fontWeight: '700'
                          }}>
                            {days} Hari
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      { marginTop: 12, height: 42, backgroundColor: '#ef4444', borderColor: '#ef4444' },
                      isCleaningProofs && { opacity: 0.7 }
                    ]}
                    onPress={handleCleanProofs}
                    disabled={isCleaningProofs}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryButtonText}>
                      {isCleaningProofs ? 'Membersihkan...' : 'Hapus Bukti Lama'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Staff Management (Admin Only) woy! */}
              {userRole === 'admin' && (
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    borderColor: 'rgba(99, 102, 241, 0.25)',
                    borderWidth: 1,
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20
                  }}
                  onPress={() => {
                    setShowStaffListModal(true);
                    setStaffModalMode('LIST');
                    fetchStaffMembers();
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ backgroundColor: '#6366f1', padding: 8, borderRadius: 10 }}>
                      <Ionicons name="people-outline" size={16} color="#ffffff" />
                    </View>
                    <View>
                      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Kelola Petugas Gudang</Text>
                      <Text style={{ color: '#a1a1aa', fontSize: 10, marginTop: 2 }}>Lihat, tambah, edit, & hapus staff packer</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6366f1" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.logoutBtnLarge} onPress={() => handleLogout()}>
                <Ionicons name="log-out-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.logoutBtnLargeText}>Keluar dari Sistem</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* Bahan Tab */}
          {activeTab === 'INVENTARIS' && inventarisSubTab === 'BAHAN' && (
            <View style={styles.tabContent}>
              {/* Segmented control toggle bar woy */}
              {hasMobilePermission('products') && hasMobilePermission('supplies') && (
                <View style={[styles.topTabBar, { marginHorizontal: 0, marginTop: 0, marginBottom: 16 }]}>
                  <TouchableOpacity
                    style={[styles.topTabButton, (inventarisSubTab as string) === 'STOK' && styles.topTabButtonActive]}
                    onPress={() => setInventarisSubTab('STOK')}
                  >
                    <Text style={[styles.topTabText, (inventarisSubTab as string) === 'STOK' && styles.topTabTextActive]}>Stok Barang</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topTabButton, (inventarisSubTab as string) === 'BAHAN' && styles.topTabButtonActive]}
                    onPress={() => {
                      setInventarisSubTab('BAHAN');
                      fetchSupplies();
                    }}
                  >
                    <Text style={[styles.topTabText, (inventarisSubTab as string) === 'BAHAN' && styles.topTabTextActive]}>Bahan Packing</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.tabHeaderRow}>
                <Text style={styles.tabHeaderTitle}>Perlengkapan Packing</Text>
              </View>

              <View style={styles.searchSection}>
                <View style={styles.searchInputWrapper}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari bahan (kardus, bubble, dll)..."
                    placeholderTextColor="#71717a"
                    value={searchSupply}
                    onChangeText={setSearchSupply}
                    autoCapitalize="none"
                  />
                  <Ionicons name="search-outline" size={16} color="#71717a" style={{ marginRight: 14 }} />
                </View>
              </View>

              <FlatList
                data={supplies.filter(s => s.name.toLowerCase().includes(searchSupply.toLowerCase()))}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 100 }}
                alwaysBounceVertical={true}
                refreshControl={
                  <RefreshControl
                    refreshing={isLoadingSupplies}
                    onRefresh={fetchSupplies}
                    tintColor="#4f46e5"
                    colors={["#4f46e5"]}
                  />
                }
                renderItem={({ item }) => {
                  const isLowStock = item.stock <= item.min_stock;
                  return (
                    <View style={styles.supplyCard}>
                      <View style={styles.supplyMainRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.supplyName}>{item.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <View style={[
                              styles.supplyBadge,
                              isLowStock
                                ? { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
                                : { backgroundColor: 'rgba(34, 197, 94, 0.15)' }
                            ]}>
                              <Ionicons
                                name={isLowStock ? "warning-outline" : "checkmark-circle-outline"}
                                size={10}
                                color={isLowStock ? "#ef4444" : "#22c55e"}
                              />
                              <Text style={[
                                styles.supplyBadgeText,
                                isLowStock ? { color: '#ef4444' } : { color: '#22c55e' }
                              ]}>
                                {isLowStock ? 'Stok Menipis' : 'Stok Aman'}
                              </Text>
                            </View>
                            <Text style={styles.supplyPriceText}>Rp {item.purchase_price.toLocaleString('id-ID')} / {item.unit}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.supplyStockQty, isLowStock && { color: '#ef4444' }]}>
                            {item.stock}
                          </Text>
                          <Text style={styles.supplyUnitText}>{item.unit}</Text>
                        </View>
                      </View>

                      <View style={styles.supplyAdjustDivider} />

                      {/* Quick Adjusters Row */}
                      <View style={styles.supplyAdjustRow}>
                        <TouchableOpacity
                          style={[styles.supplyAdjustCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                          onPress={() => updateSupplyStock(item.id, Math.max(0, item.stock - 10))}
                        >
                          <Text style={[styles.supplyAdjustText, { color: '#ef4444' }]}>-10</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.supplyAdjustCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                          onPress={() => updateSupplyStock(item.id, Math.max(0, item.stock - 1))}
                        >
                          <Text style={[styles.supplyAdjustText, { color: '#ef4444' }]}>-1</Text>
                        </TouchableOpacity>

                        <View style={styles.supplyInputWrapper}>
                          <TextInput
                            style={styles.supplyStockInput}
                            value={String(item.stock)}
                            keyboardType="numeric"
                            onChangeText={(text) => {
                              const val = parseInt(text);
                              if (!isNaN(val) && val >= 0) {
                                updateSupplyStock(item.id, val);
                              }
                            }}
                          />
                        </View>

                        <TouchableOpacity
                          style={[styles.supplyAdjustCircle, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}
                          onPress={() => updateSupplyStock(item.id, item.stock + 1)}
                        >
                          <Text style={[styles.supplyAdjustText, { color: '#22c55e' }]}>+1</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.supplyAdjustCircle, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}
                          onPress={() => updateSupplyStock(item.id, item.stock + 10)}
                        >
                          <Text style={[styles.supplyAdjustText, { color: '#22c55e' }]}>+10</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Tidak ada perlengkapan packing ditemukan.</Text>
                  </View>
                }
              />
            </View>
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
            {/* Tab 1: Home */}
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

            {/* Tab 2: Inventaris */}
            {(hasMobilePermission('products') || hasMobilePermission('supplies')) && (
              <TouchableOpacity
                style={styles.tabBarItem}
                onPress={() => {
                  setActiveTab('INVENTARIS');
                  if (hasMobilePermission('products')) {
                    setInventarisSubTab('STOK');
                  } else {
                    setInventarisSubTab('BAHAN');
                  }
                }}
              >
                <Ionicons
                  name={activeTab === 'INVENTARIS' ? 'cube' : 'cube-outline'}
                  size={20}
                  color={activeTab === 'INVENTARIS' ? '#4f46e5' : '#a1a1aa'}
                />
                <Text style={[styles.tabBarLabel, activeTab === 'INVENTARIS' && styles.tabActiveColor]}>Inventaris</Text>
              </TouchableOpacity>
            )}

            {/* Tab 3: Elevated Packing Center Button */}
            {hasMobilePermission('scanner') && (
              <View style={styles.centerTabContainer}>
                <TouchableOpacity
                  style={styles.centerScanBtn}
                  onPress={() => {
                    setActiveTab('PACKING');
                    setPackingSubTab('SCANNER');
                  }}
                >
                  <Ionicons name="camera" size={26} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Tab 4: Keuangan (Kas) */}
            {(userRole === 'admin' || hasMobilePermission('expenses')) && (
              <TouchableOpacity
                style={styles.tabBarItem}
                onPress={() => setActiveTab('KAS')}
              >
                <Ionicons
                  name={activeTab === 'KAS' ? 'wallet' : 'wallet-outline'}
                  size={20}
                  color={activeTab === 'KAS' ? '#4f46e5' : '#a1a1aa'}
                />
                <Text style={[styles.tabBarLabel, activeTab === 'KAS' && styles.tabActiveColor]}>Keuangan</Text>
              </TouchableOpacity>
            )}

            {/* Tab 5: Profil */}
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

          {/* Modal Verifikasi Password untuk Biometrik woy */}
          <Modal
            visible={showBioPasswordModal}
            animationType="fade"
            transparent={true}
            onRequestClose={() => {
              setShowBioPasswordModal(false);
              setBioVerifyPasswordInput('');
            }}
          >
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(9, 9, 11, 0.85)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20
            }}>
              <View style={{
                backgroundColor: '#18181b',
                borderRadius: 20,
                borderColor: 'rgba(63, 63, 70, 0.4)',
                borderWidth: 1,
                padding: 24,
                width: '100%',
                maxWidth: 340,
              }}>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    padding: 12,
                    borderRadius: 14,
                    marginBottom: 10
                  }}>
                    <Ionicons name="finger-print" size={28} color="#6366f1" />
                  </View>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
                    Verifikasi Password
                  </Text>
                  <Text style={{ color: '#a1a1aa', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                    Masukkan password akun Anda untuk mengaktifkan login sidik jari woy.
                  </Text>
                </View>

                <TextInput
                  style={{
                    backgroundColor: 'rgba(9, 9, 11, 0.8)',
                    borderColor: 'rgba(63, 63, 70, 0.4)',
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: '#ffffff',
                    fontSize: 13,
                    marginBottom: 16
                  }}
                  placeholder="Masukkan password Anda..."
                  placeholderTextColor="#71717a"
                  value={bioVerifyPasswordInput}
                  onChangeText={setBioVerifyPasswordInput}
                  secureTextEntry
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(24, 24, 27, 0.8)',
                      borderColor: 'rgba(63, 63, 70, 0.4)',
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      setShowBioPasswordModal(false);
                      setBioVerifyPasswordInput('');
                    }}
                  >
                    <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '700' }}>Batal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#6366f1',
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: 'center'
                    }}
                    onPress={handleVerifyBioPassword}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Aktifkan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal Catat Pengeluaran woy */}
          <Modal
            visible={showExpenseModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowExpenseModal(false)}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(9, 9, 11, 0.85)',
                justifyContent: 'flex-end'
              }}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={{
                    backgroundColor: '#18181b',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderColor: '#27272a',
                    borderWidth: 1,
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
                    maxHeight: '85%'
                  }}
                >
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    borderBottomColor: '#27272a',
                    borderBottomWidth: 1,
                    paddingBottom: 12
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="cash-outline" size={20} color="#4f46e5" />
                      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>
                        Catat Pengeluaran Gudang
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setShowExpenseModal(false)}
                      style={{
                        backgroundColor: '#27272a',
                        padding: 6,
                        borderRadius: 20
                      }}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.fieldLabel}>Sumber Kas/Dana:</Text>
                    <View style={styles.pickerWrapper}>
                      {financialAccounts.length === 0 ? (
                        <Text style={styles.emptyTextSimple}>Tidak ada akun kas aktif.</Text>
                      ) : (
                        <View style={styles.horizontalAccountsList}>
                          {financialAccounts.map((acc) => {
                            const isSelected = selectedAccountId === acc.id;
                            return (
                              <TouchableOpacity
                                key={acc.id}
                                style={[
                                  styles.accountSelectCard,
                                  isSelected && { borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)' }
                                ]}
                                onPress={() => setSelectedAccountId(acc.id)}
                              >
                                <Text style={styles.accountCardName}>{acc.name}</Text>
                                {userRole === 'admin' && (
                                  <Text style={[styles.accountCardBalance, isSelected && { color: '#818cf8' }]}>
                                    Rp {parseInt(acc.current_balance).toLocaleString('id-ID')}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    <Text style={styles.fieldLabel}>Kategori Pengeluaran:</Text>
                    <View style={styles.pickerWrapper}>
                      <View style={styles.horizontalCategoriesList}>
                        {expenseCategories.map((cat) => {
                          const isSelected = selectedCategory === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              style={[
                                styles.categorySelectBadge,
                                isSelected && { backgroundColor: '#4f46e5', borderColor: '#4f46e5' }
                              ]}
                              onPress={() => setSelectedCategory(cat)}
                            >
                              <Text style={[
                                styles.categoryBadgeText,
                                isSelected && { color: '#ffffff' }
                              ]}>
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <Text style={styles.fieldLabel}>Nominal Pengeluaran (Rupiah):</Text>
                    <View style={styles.inputContainerWithPrefix}>
                      <Text style={styles.currencyPrefix}>Rp</Text>
                      <TextInput
                        style={styles.currencyInput}
                        placeholder="Contoh: 15.000"
                        placeholderTextColor="#71717a"
                        keyboardType="numeric"
                        value={expenseAmount}
                        onChangeText={(val) => setExpenseAmount(formatRupiah(val))}
                      />
                    </View>

                    <Text style={styles.fieldLabel}>Keterangan / Catatan:</Text>
                    <TextInput
                      style={styles.textInputFull}
                      placeholder="Contoh: Beli lakban cokelat eceran 2 roll"
                      placeholderTextColor="#71717a"
                      value={expenseDescription}
                      onChangeText={setExpenseDescription}
                    />

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        { marginTop: 24, height: 46, borderRadius: 12 },
                        isSubmittingExpense && { opacity: 0.7 }
                      ]}
                      onPress={async () => {
                        const success = await submitExpense();
                        if (success) {
                          setShowExpenseModal(false);
                          if (userRole === 'admin') {
                            fetchFinanceData();
                          }
                        }
                      }}
                      disabled={isSubmittingExpense}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryButtonText}>
                        {isSubmittingExpense ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Modal Proof Player & Viewer */}
          {viewingProofItem && (() => {
            const files = viewingProofItem.package_proof ? viewingProofItem.package_proof.split(',') : [];
            const photoFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));
            const videoFile = files.find(f => f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.avi') || f.endsWith('.webm'));

            const getFullUrl = (filePath: string) => {
              if (!filePath) return '';
              const trimmed = filePath.trim();
              const activeUrl = serverUrlRef.current || serverUrl;

              // Cek jika ini file video, gunakan streamVideo controller agar support range requests woy!
              const isVideo = trimmed.endsWith('.mp4') || trimmed.endsWith('.mov') || trimmed.endsWith('.avi') || trimmed.endsWith('.webm');
              if (isVideo) {
                const filename = trimmed.substring(trimmed.lastIndexOf('/') + 1);
                return `${activeUrl}/finance/transactions/stream-video/${filename}`;
              }

              if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                return trimmed;
              }
              return `${activeUrl}/storage/${trimmed}`;
            };

            const photoUrl = photoFile ? getFullUrl(photoFile) : null;
            const videoUrl = videoFile ? getFullUrl(videoFile) : null;

            return (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Detail Bukti Packing</Text>
                    <TouchableOpacity onPress={() => setViewingProofItem(null)} style={styles.modalCloseBtn}>
                      <Ionicons name="close" size={22} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={styles.modalScrollContent}>
                    <View style={styles.modalMetaCard}>
                      <Text style={styles.modalMetaText}>Invoice: <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>{viewingProofItem.invoice_number}</Text></Text>
                      {viewingProofItem.waybill_number && viewingProofItem.waybill_number !== '-' && (
                        <Text style={styles.modalMetaText}>Resi: <Text style={{ fontWeight: 'bold', color: '#ffffff' }}>{viewingProofItem.waybill_number}</Text></Text>
                      )}
                      <Text style={styles.modalMetaText}>Toko: <Text style={{ color: '#ffffff', fontWeight: '600' }}>{viewingProofItem.store_name} ({viewingProofItem.platform})</Text></Text>
                      {viewingProofItem.packer_name && viewingProofItem.packer_name !== '-' && (
                        <Text style={styles.modalMetaText}>Petugas: <Text style={{ color: '#818cf8', fontWeight: '800' }}>{viewingProofItem.packer_name}</Text></Text>
                      )}
                      <Text style={styles.modalMetaText}>Waktu: <Text style={{ color: '#a1a1aa' }}>{viewingProofItem.scanned_at}</Text></Text>
                    </View>

                    {photoUrl && (
                      <View style={styles.mediaContainer}>
                        <Text style={styles.mediaLabel}>📸 Foto Bukti Packing</Text>
                        <RNImage
                          source={{ uri: photoUrl }}
                          style={styles.modalPhoto}
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    {videoUrl && (
                      <View style={styles.mediaContainer}>
                        <Text style={styles.mediaLabel}>🎥 Rekaman Video Packing</Text>
                        <Video
                          source={{ uri: videoUrl }}
                          rate={1.0}
                          volume={1.0}
                          isMuted={false}
                          resizeMode={ResizeMode.CONTAIN}
                          shouldPlay={false}
                          isLooping={false}
                          useNativeControls={true}
                          style={styles.modalVideo}
                        />
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            );
          })()}
          {/* Modal Kelola Petugas Gudang (Unified List & Form) woy */}
          <Modal
            visible={showStaffListModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              if (staffModalMode === 'FORM') {
                setStaffModalMode('LIST');
              } else {
                setShowStaffListModal(false);
              }
            }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{
                flex: 1,
                backgroundColor: 'rgba(9, 9, 11, 0.85)',
                justifyContent: 'flex-end'
              }}>
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={{
                    backgroundColor: '#18181b',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderColor: '#27272a',
                    borderWidth: 1,
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
                    height: staffModalMode === 'LIST' ? '80%' : '90%',
                    maxHeight: '95%'
                  }}
                >
                  {/* Header woy */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    borderBottomColor: '#27272a',
                    borderBottomWidth: 1,
                    paddingBottom: 12
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {staffModalMode === 'FORM' ? (
                        <TouchableOpacity onPress={() => setStaffModalMode('LIST')} style={{ paddingRight: 4 }}>
                          <Ionicons name="arrow-back" size={20} color="#6366f1" />
                        </TouchableOpacity>
                      ) : (
                        <Ionicons name="people-outline" size={20} color="#6366f1" />
                      )}
                      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>
                        {staffModalMode === 'FORM'
                          ? (editingStaff ? 'Edit Data Petugas' : 'Tambah Petugas Baru')
                          : 'Kelola Petugas Gudang'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setShowStaffListModal(false)}
                      style={{
                        backgroundColor: '#27272a',
                        padding: 6,
                        borderRadius: 20
                      }}
                    >
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  {/* Mode: LIST woy */}
                  {staffModalMode === 'LIST' && (
                    <>
                      {isLoadingStaff ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <ActivityIndicator size="large" color="#6366f1" />
                        </View>
                      ) : (
                        <FlatList
                          data={staffMembers}
                          keyExtractor={(item) => String(item.id)}
                          contentContainerStyle={{ paddingBottom: 20 }}
                          renderItem={({ item }) => (
                            <View style={{
                              backgroundColor: '#09090b',
                              borderColor: '#27272a',
                              borderWidth: 1,
                              borderRadius: 14,
                              padding: 14,
                              marginBottom: 10,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <View style={{ flex: 1, marginRight: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>{item.name}</Text>
                                  <View style={{
                                    backgroundColor: item.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(113, 113, 122, 0.15)',
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4
                                  }}>
                                    <Text style={{
                                      color: item.role === 'admin' ? '#818cf8' : '#a1a1aa',
                                      fontSize: 8,
                                      fontWeight: '700'
                                    }}>
                                      {item.role === 'admin' ? 'Owner / Admin' : 'Staff'}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={{ color: '#a1a1aa', fontSize: 10, marginTop: 2 }}>{item.email}</Text>
                                
                                {/* Permissions Badge woy */}
                                {item.role === 'staff' && (
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                    {(!item.permissions || item.permissions.length === 0) ? (
                                      <Text style={{ color: '#ef4444', fontSize: 8, fontStyle: 'italic' }}>Tanpa Izin Akses</Text>
                                    ) : (
                                      (Array.isArray(item.permissions) ? item.permissions : JSON.parse(item.permissions || '[]')).map((perm: string) => (
                                        <View 
                                          key={perm}
                                          style={{
                                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                            borderColor: 'rgba(34, 197, 94, 0.25)',
                                            borderWidth: 1,
                                            paddingHorizontal: 5,
                                            paddingVertical: 1,
                                            borderRadius: 4
                                          }}
                                        >
                                          <Text style={{ color: '#22c55e', fontSize: 8, fontWeight: '700' }}>{perm}</Text>
                                        </View>
                                      ))
                                    )}
                                  </View>
                                )}
                              </View>

                              {/* Actions woy */}
                              <View style={{ flexDirection: 'row', gap: 6 }}>
                                <TouchableOpacity
                                  onPress={() => {
                                    setEditingStaff(item);
                                    setStaffName(item.name);
                                    setStaffEmail(item.email);
                                    setStaffPassword('');
                                    setStaffRole(item.role || 'staff');
                                    const perms = item.permissions
                                      ? (Array.isArray(item.permissions) ? item.permissions : JSON.parse(item.permissions || '[]'))
                                      : [];
                                    setStaffPermissions(perms);
                                    setStaffModalMode('FORM');
                                  }}
                                  style={{
                                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                    padding: 8,
                                    borderRadius: 8
                                  }}
                                >
                                  <Ionicons name="pencil" size={14} color="#818cf8" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => deleteStaffMember(item.id)}
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                    padding: 8,
                                    borderRadius: 8
                                  }}
                                >
                                  <Ionicons name="trash-outline" size={14} color="#f87171" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                          ListEmptyComponent={
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                              <Text style={{ color: '#a1a1aa', fontSize: 12, fontStyle: 'italic' }}>Belum ada petugas gudang.</Text>
                            </View>
                          }
                        />
                      )}

                      <TouchableOpacity
                        style={[styles.primaryButton, { marginTop: 12, backgroundColor: '#6366f1', borderColor: '#6366f1' }]}
                        onPress={() => {
                          setEditingStaff(null);
                          setStaffName('');
                          setStaffEmail('');
                          setStaffPassword('');
                          setStaffRole('staff');
                          setStaffPermissions([]);
                          setStaffModalMode('FORM');
                        }}
                      >
                        <Ionicons name="person-add-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryButtonText}>Tambah Petugas Baru</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Mode: FORM woy */}
                  {staffModalMode === 'FORM' && (
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <Text style={styles.fieldLabel}>Nama Lengkap:</Text>
                      <TextInput
                        style={styles.textInputFull}
                        placeholder="Nama Petugas"
                        placeholderTextColor="#71717a"
                        value={staffName}
                        onChangeText={setStaffName}
                      />

                      <Text style={styles.fieldLabel}>Email:</Text>
                      <TextInput
                        style={styles.textInputFull}
                        placeholder="petugas@domain.com"
                        placeholderTextColor="#71717a"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={staffEmail}
                        onChangeText={setStaffEmail}
                      />

                      <Text style={styles.fieldLabel}>Password {editingStaff ? '(Kosongkan jika tidak diubah)' : ''}:</Text>
                      <TextInput
                        style={styles.textInputFull}
                        placeholder={editingStaff ? "Sandi Baru" : "Sandi Akun"}
                        placeholderTextColor="#71717a"
                        secureTextEntry={true}
                        autoCapitalize="none"
                        value={staffPassword}
                        onChangeText={setStaffPassword}
                      />

                      <Text style={styles.fieldLabel}>Role Akun:</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                        {(['staff', 'admin'] as const).map((r) => {
                          const isSelected = staffRole === r;
                          return (
                            <TouchableOpacity
                              key={r}
                              onPress={() => setStaffRole(r)}
                              style={{
                                flex: 1,
                                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#09090b',
                                borderColor: isSelected ? '#6366f1' : '#27272a',
                                borderWidth: 1,
                                borderRadius: 10,
                                paddingVertical: 12,
                                alignItems: 'center'
                              }}
                            >
                              <Text style={{
                                color: isSelected ? '#818cf8' : '#a1a1aa',
                                fontSize: 12,
                                fontWeight: '700',
                                textTransform: 'capitalize'
                              }}>
                                {r === 'admin' ? 'Owner / Admin' : 'Staff Gudang'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Permissions checklist woy (Only for Staff role!) */}
                      {staffRole === 'staff' && (
                        <View style={{ marginBottom: 16 }}>
                          <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Izin Akses Modul:</Text>
                          <View style={{
                            backgroundColor: '#09090b',
                            borderColor: '#27272a',
                            borderWidth: 1,
                            borderRadius: 12,
                            padding: 12,
                            gap: 10
                          }}>
                            {[
                              { key: 'transactions', label: 'Invoices / Penjualan (Web)' },
                              { key: 'scanner', label: 'Stasiun Packing & Scan (Web/HP)' },
                              { key: 'products', label: 'Master Stok Produk (Web/HP)' },
                              { key: 'supplies', label: 'Bahan Packing Gudang (Web/HP)' },
                              { key: 'expenses', label: 'Catat Pengeluaran Kas (HP)' },
                              { key: 'customers', label: 'Master Pelanggan (Web)' }
                            ].map((perm) => {
                              const isGranted = staffPermissions.includes(perm.key);
                              return (
                                <View 
                                  key={perm.key}
                                  style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>{perm.label}</Text>
                                  <Switch
                                    trackColor={{ false: '#27272a', true: '#22c55e' }}
                                    thumbColor={isGranted ? '#ffffff' : '#a1a1aa'}
                                    value={isGranted}
                                    onValueChange={(val) => {
                                      if (val) {
                                        setStaffPermissions([...staffPermissions, perm.key]);
                                      } else {
                                        setStaffPermissions(staffPermissions.filter(p => p !== perm.key));
                                      }
                                    }}
                                  />
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          { marginTop: 12, height: 46, borderRadius: 12 },
                          isLoadingStaff && { opacity: 0.7 }
                        ]}
                        onPress={async () => {
                          const success = await submitStaffForm();
                          if (success) {
                            setStaffModalMode('LIST');
                          }
                        }}
                        disabled={isLoadingStaff}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.primaryButtonText}>
                          {isLoadingStaff ? 'Menyimpan...' : 'Simpan Data'}
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  )}
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </Modal>


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
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 12,
    padding: 4,
  },
  topTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  topTabButtonActive: {
    backgroundColor: '#27272a',
  },
  topTabText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '700',
  },
  topTabTextActive: {
    color: '#ffffff',
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
    flex: 1,
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
    flex: 1,
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
    bottom: 220, // Floating above the bottom control panel woy
    alignSelf: 'center', // Centered horizontally woy
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20, // Rounded pill shape woy
    maxWidth: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 99999,
  },
  floatingStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  floatingAutoToggleBtn: {
    position: 'absolute',
    top: 105, // Floats in the top-right woy
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
    bottom: 160, // Positioned beautifully above the bottom toolbar woy!
    alignSelf: 'center', // Centered as a floating pill woy!
    backgroundColor: 'rgba(99, 102, 241, 0.95)', // Premium Indigo woy!
    borderRadius: 20, // Pill shape woy!
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.5)',
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
  checklistCard: {
    position: 'absolute',
    top: 150, // Shifted down to prevent overlapping woy
    left: 20,
    right: 20,
    backgroundColor: 'rgba(24, 24, 27, 0.90)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#22c55e',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 99,
    maxHeight: '40%', // Prevent checklist cards from taking too much height woy
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checklistInvoice: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  checklistStore: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600',
  },
  checklistDivider: {
    height: 1,
    backgroundColor: '#3f3f46',
    marginBottom: 8,
  },
  checklistScroll: {
    maxHeight: 220, // Increased height to prevent order items from being cut off woy
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  checklistQty: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
    minWidth: 20,
  },
  checklistProductName: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  checklistSku: {
    color: '#a1a1aa',
    fontSize: 10,
    marginLeft: 6,
    marginTop: 1,
  },
  floatingTimerBadge: {
    position: 'absolute',
    top: 105, // Shifted down to clear top subtabs woy
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)', // Neon red transparent bg woy!
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)', // Neon red outline woy!
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 9999,
  },
  floatingTimerText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', // Monospaced to stop number shaking woy!
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 9, 11, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#18181b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#09090b',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalMetaCard: {
    backgroundColor: '#09090b',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
    gap: 4,
  },
  modalMetaText: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  mediaContainer: {
    marginBottom: 16,
  },
  mediaLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#09090b',
  },
  modalVideo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#09090b',
  },
  supplyCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  supplyMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supplyName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  supplyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  supplyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  supplyPriceText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  supplyStockQty: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  supplyUnitText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  supplyAdjustDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 12,
  },
  supplyAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supplyAdjustCircle: {
    width: 44,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplyAdjustText: {
    fontSize: 12,
    fontWeight: '800',
  },
  supplyInputWrapper: {
    width: 64,
    height: 32,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplyStockInput: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },
  fieldLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    marginBottom: 6,
  },
  emptyTextSimple: {
    color: '#71717a',
    fontSize: 12,
    fontStyle: 'italic',
  },
  horizontalAccountsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountSelectCard: {
    width: '48%',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    padding: 10,
  },
  accountCardName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  accountCardBalance: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  horizontalCategoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categorySelectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#09090b',
  },
  categoryBadgeText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '800',
  },
  inputContainerWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  currencyPrefix: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  currencyInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    padding: 0,
  },
  textInputFull: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    height: 40,
  },
});
