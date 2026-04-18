import { useState, useRef, useCallback, useEffect } from 'react';
import { message, Select, Radio, Tag } from 'antd';
import {
  CameraOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ScanOutlined,
  BulbOutlined,
  WarningOutlined,
  RedoOutlined,
  FormOutlined
} from '@ant-design/icons';
import Webcam from 'react-webcam';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';

const GLOBAL_OFFICE_LOCATIONS = [
  {
    latitude: 19.0611456,
    longitude: 72.8727552,
    radius: 200,
    name: 'Mumbai Office',
    city: 'Mumbai',
    country: 'India'
  }
];

// MANUAL REQUEST MODAL
const ManualRequestModal = ({ onClose, defaultEventType }: { onClose: () => void; defaultEventType: 'check_in' | 'check_out' }) => {
  const webcamRef = useRef<Webcam>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [eventType, setEventType] = useState<'check_in' | 'check_out'>(defaultEventType);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    attendanceServiceInstance
      .getEmployees()
      .then((res: any) => setEmployees(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmployees(false));
  }, []);

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setCapturedImage(imageSrc);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) return message.warning('Please select an employee.');
    if (!capturedImage) return message.warning('Please capture a photo first.');

    const selectedEmp = employees.find((e) => e.employee_code === selectedEmployee);
    setIsSubmitting(true);
    try {
      const blob = await (await fetch(capturedImage)).blob();
      const form = new FormData();
      form.append('file', new File([blob], 'capture.jpg', { type: blob.type }));
      form.append('employee_code', selectedEmployee);
      form.append('event_type', eventType);
      form.append('requested_by', selectedEmp?.full_name ?? selectedEmp?.name ?? selectedEmployee ?? 'Unknown');

      const response = await attendanceServiceInstance.createAttendanceRequest(form);
      if (response?.success) {
        message.success(`Request submitted.`);
        onClose();
      } else {
        message.error('Failed to submit request.');
      }
    } catch (err: any) {
      message.error(err?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReady = !!selectedEmployee && !!capturedImage;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FormOutlined style={{ color: '#fff', fontSize: 12 }} />
              </div>
              <span className="font-semibold text-amber-900 text-sm">Manual Attendance Request</span>
            </div>
            <p className="text-amber-700 text-xs leading-snug">
              This is for exceptional cases only — when face recognition couldn't verify you.
            </p>
          </div>
          <button onClick={onClose} className="text-amber-400 hover:text-amber-600 transition-colors ml-3 mt-0.5 flex-shrink-0">
            <CloseOutlined />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <UserOutlined className="mr-1" />
              Employee
            </label>
            <Select
              showSearch
              placeholder="Search by code or name"
              value={selectedEmployee || undefined}
              onChange={setSelectedEmployee}
              style={{ width: '100%' }}
              size="middle"
              loading={loadingEmployees}
              optionFilterProp="label"
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
              options={employees.map((e) => ({
                value: e.employee_code,
                label: `${e.employee_code} — ${e.full_name}`
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</label>
            <Radio.Group value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ width: '100%' }}>
              <Radio.Button value="check_in" style={{ width: '50%', textAlign: 'center' }}>
                ✅ Check-In
              </Radio.Button>
              <Radio.Button value="check_out" style={{ width: '50%', textAlign: 'center' }}>
                🔴 Check-Out
              </Radio.Button>
            </Radio.Group>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <CameraOutlined className="mr-1" />
              Photo
            </label>
            <div className="flex justify-center">
              {!capturedImage ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={220}
                  height={220}
                  videoConstraints={{ facingMode: 'user' }}
                  style={{ borderRadius: 10, border: '2px solid #e5e7eb', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div className="relative inline-block">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    style={{
                      width: 220,
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: 10,
                      border: '2px solid #22c55e',
                      display: 'block'
                    }}
                  />
                  <Tag
                    color="success"
                    icon={<CheckCircleOutlined />}
                    style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
                  >
                    Photo Captured
                  </Tag>
                </div>
              )}
            </div>
            <div className="text-center mt-3 flex flex-col items-center gap-3">
              {!capturedImage ? (
                <button
                  onClick={capture}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <CameraOutlined /> Capture Photo
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={!isReady || isSubmitting}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                      isReady && !isSubmitting
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'Submitting…' : '✅ Submit Attendance Request'}
                  </button>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <RedoOutlined /> Retake Photo
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isReady || isSubmitting}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isReady && !isSubmitting
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AttendanceMarking = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState<'check-in' | 'check-out'>('check-in');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<'idle' | 'counting' | 'capturing' | 'success' | 'error'>('idle');
  const [successData, setSuccessData] = useState<any>(null);
  const [maxAttempts] = useState(3);
  const [isVoiceEnabled] = useState(true);

  const [showManualRequest, setShowManualRequest] = useState(false);
  const [, setManualRequestReason] = useState<string>('');

  const [userLocation, setUserLocation] = useState<any>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string>('');

  const AUTO_CONFIRM_DELAY_MS = 3000;
  const AUTO_CONFIRM_SECONDS = Math.floor(AUTO_CONFIRM_DELAY_MS / 1000);

  const [autoConfirmModal, setAutoConfirmModal] = useState(false);
  const [pendingAttendance, setPendingAttendance] = useState<any>(null);
  const [autoConfirmCountdown, setAutoConfirmCountdown] = useState<number>(AUTO_CONFIRM_SECONDS);
  const autoConfirmTimerRef = useRef<number | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const successShownAtRef = useRef<number | null>(null);
  const suppressSuccessUIRef = useRef<boolean>(false);

  const closeSuccessImmediate = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    successShownAtRef.current = null;
    setSuccessData(null);
    setStatus('idle');
  }, []);

  const getVideoConstraints = () => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1024;
    if (isMobile) return { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user', aspectRatio: 1 };
    if (isTablet) return { width: { ideal: 600 }, height: { ideal: 600 }, facingMode: 'user', aspectRatio: 1 };
    return { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: 'user', aspectRatio: 1 };
  };

  const getCameraContainerHeight = () => {
    if (window.innerWidth < 640) return '400px';
    if (window.innerWidth < 1024) return '400px';
    return '380px';
  };

  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
    return () => {
      speechSynthRef.current?.cancel();
      if (countdownRef.current) clearTimeout(countdownRef.current);
      if (autoConfirmTimerRef.current) clearInterval(autoConfirmTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!isVoiceEnabled || !speechSynthRef.current) {
          resolve();
          return;
        }
        speechSynthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        setTimeout(() => speechSynthRef.current!.speak(utterance), 100);
      });
    },
    [isVoiceEnabled]
  );

  const USE_MOCK_LOCATION = true;

  const getCurrentLocation = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (USE_MOCK_LOCATION) {
        resolve({
          latitude: 19.0611456,
          longitude: 72.8727552,
          accuracy: 5,
          officeCheck: { isInOffice: true, office: GLOBAL_OFFICE_LOCATIONS[0], distance: 0 },
          locationType: 'office',
          timestamp: new Date().toISOString()
        });
        return;
      }
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const officeCheck = checkOfficeProximity(latitude, longitude);
          resolve({
            latitude,
            longitude,
            accuracy,
            officeCheck,
            locationType: officeCheck.isInOffice ? 'office' : 'remote',
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          const msgs: Record<number, string> = {
            [error.PERMISSION_DENIED]: 'Location permission denied.',
            [error.POSITION_UNAVAILABLE]: 'Location information unavailable.',
            [error.TIMEOUT]: 'Location request timed out.'
          };
          reject(new Error(msgs[error.code] || 'Location error'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkOfficeProximity = (lat: number, lng: number) => {
    let nearestOffice = null;
    let minDistance = Infinity;
    for (const office of GLOBAL_OFFICE_LOCATIONS) {
      const d = calculateDistance(lat, lng, office.latitude, office.longitude);
      if (d < minDistance) {
        minDistance = d;
        nearestOffice = office;
      }
    }
    return {
      isInOffice: nearestOffice ? minDistance <= nearestOffice.radius : false,
      office: nearestOffice,
      distance: Math.round(minDistance)
    };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const detectFaceAngle = useCallback(async (imageSrc: string) => {
    try {
      const faceapi: any = await import('face-api.js');
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      } catch {
        const CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
        await faceapi.nets.tinyFaceDetector.loadFromUri(CDN);
        await faceapi.nets.faceLandmark68Net.loadFromUri(CDN);
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = imageSrc;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 1;
      canvas.height = img.height || 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, 0, 0);
      const detection = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 })).withFaceLandmarks();
      if (!detection?.landmarks) throw new Error('No landmarks');
      const lm = detection.landmarks as any;
      const avg = (pts: any[]) => pts.reduce((s: number, p: any) => s + p.x, 0) / pts.length;
      const avgY = (pts: any[]) => pts.reduce((s: number, p: any) => s + p.y, 0) / pts.length;
      const le = lm.getLeftEye(),
        re = lm.getRightEye(),
        nose = lm.getNose(),
        mouth = lm.getMouth();
      const ecX = (avg(le) + avg(re)) / 2,
        ecY = (avgY(le) + avgY(re)) / 2;
      const span = Math.max(1, Math.hypot(avg(re) - avg(le), avgY(re) - avgY(le)));
      const yaw = (Math.atan2(avg(nose) - ecX, span) * 180) / Math.PI;
      const roll = (Math.atan2(avgY(re) - avgY(le), avg(re) - avg(le)) * 180) / Math.PI;
      const pitch = (0.5 - (avgY(nose) - ecY) / Math.max(1, avgY(mouth) - ecY)) * 60;
      return { pitch, yaw, roll, isValid: Math.abs(yaw) <= 18 && Math.abs(pitch) <= 14 && Math.abs(roll) <= 12 };
    } catch {
      return { pitch: 0, yaw: 0, roll: 0, isValid: true };
    }
  }, []);

  const startAttendanceProcess = useCallback(async () => {
    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }
    try {
      setLocationStatus('fetching');
      await speak('Getting your location for attendance...');
      const location = await getCurrentLocation();
      setUserLocation(location);
      setLocationStatus('success');
      await speak(location.officeCheck.isInOffice ? 'You are at office location' : 'You are at remote location');
      setStatus('counting');
      setCountdown(3);
      await speak('Position your face within the green frame. Capturing in 3 seconds');
    } catch (error: any) {
      setLocationStatus('error');
      setLocationError(error.message);
      await speak('Location access required. Please enable location services.');
      message.error(`Location Required: ${error.message}`);
      setStatus('idle');
    }
  }, [attempts, maxAttempts, speak, getCurrentLocation]);

  useEffect(() => {
    if (isModalOpen && status === 'idle') startAttendanceProcess();
  }, [isModalOpen, status, startAttendanceProcess]);

  useEffect(() => {
    if (countdown > 0 && status === 'counting') {
      if (countdown <= 3) speak(countdown.toString());
      countdownRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && status === 'counting') {
      handleAutoCapture();
    }
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
        countdownRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, status, speak]);

  const handleAutoCapture = useCallback(async () => {
    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }
    if (!userLocation) {
      handleCaptureError();
      await speak('Location not available.');
      return;
    }
    setStatus('capturing');
    await speak('Capturing now');
    await new Promise((r) => setTimeout(r, 300));
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      handleCaptureError();
      return;
    }
    try {
      const facePose = await detectFaceAngle(imageSrc);
      if (!facePose.isValid) {
        await speak('Please face the camera directly.');
        message.warning('Face angle not optimal. Look directly at the camera.');
        handleCaptureError();
        return;
      }
    } catch {
      /* proceed */
    }
    await handleAutoSubmit(imageSrc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts, maxAttempts, speak, userLocation, detectFaceAngle]);

  const handleCaptureError = useCallback(async () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= maxAttempts) {
      setStatus('error');
      await speak('Maximum attempts reached.');
      message.error('Maximum attempts reached');
    } else {
      setStatus('counting');
      setCountdown(3);
      await speak(`Try again. ${maxAttempts - newAttempts} attempts left`);
    }
  }, [attempts, maxAttempts, speak]);

  const handleAutoConfirm = useCallback(
    async (capturedPendingAttendance: any) => {
      if (!capturedPendingAttendance) return;
      try {
        const confirmResponse = await attendanceServiceInstance.confirmAttendance({
          uuid: capturedPendingAttendance.uuid || capturedPendingAttendance.data?.uuid,
          confirmed_by: 'auto_system'
        });
        if (confirmResponse.success) {
          const employeeName = capturedPendingAttendance.recognized_employee?.name || capturedPendingAttendance.employee_name;
          setSuccessData({
            ...capturedPendingAttendance,
            status: 'confirmed',
            employeeName,
            employeeCode: capturedPendingAttendance.recognized_employee?.code || capturedPendingAttendance.employee_code,
            action
          });
          setStatus('success');
          await speak(`${employeeName}. ${action === 'check-in' ? 'Check in' : 'Check out'} done successfully.`);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          suppressSuccessUIRef.current = true;
          successTimerRef.current = window.setTimeout(() => {
            suppressSuccessUIRef.current = false;
            closeSuccessImmediate();
          }, 1000) as unknown as NodeJS.Timeout;
        } else throw new Error(confirmResponse.message || 'Confirmation failed');
      } catch {
        message.error('Automatic confirmation failed');
        await speak('Confirmation failed. Please try again.');
      } finally {
        if (autoConfirmTimerRef.current) {
          clearInterval(autoConfirmTimerRef.current);
          autoConfirmTimerRef.current = null;
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [speak, action]
  );

  const handleAutoSubmit = useCallback(
    async (imageSrc: string) => {
      try {
        setIsSubmitting(true);
        await speak('Processing recognition...');
        const blob = await fetch(imageSrc).then((r) => r.blob());
        const formData = new FormData();
        formData.append('action', action);
        formData.append('file', blob, 'face.jpg');
        formData.append('timestamp', new Date().toISOString().replace('T', ' ').substring(0, 19));
        formData.append('deviceType', navigator.userAgent);
        if (userLocation) {
          formData.append('latitude', String(userLocation.latitude));
          formData.append('longitude', String(userLocation.longitude));
          formData.append('accuracy', String(userLocation.accuracy));
          formData.append('locationType', userLocation.locationType);
          formData.append('isInOffice', userLocation.officeCheck.isInOffice ? '1' : '0');
        }

        const response = await attendanceServiceInstance.markAttendance(formData);

        if (response.success) {
          if (response.requires_confirmation) {
            setIsModalOpen(false);
            setAutoConfirmCountdown(AUTO_CONFIRM_SECONDS);
            setPendingAttendance(response.data || response);
            setAutoConfirmModal(true);
            const recognizedName = response.data?.recognized_employee?.name || 'Employee';
            await speak(`Recognized as ${recognizedName}. If this is not you, click cancel within 3 seconds.`);
            const timer = window.setInterval(() => {
              setAutoConfirmCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(timer as unknown as number);
                  setAutoConfirmModal(false);
                  handleAutoConfirm(response.data || response);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            autoConfirmTimerRef.current = timer as unknown as number;
          } else {
            const employeeName = response.recognized_employee?.name || response.employee_name;
            setSuccessData({
              ...response,
              status: 'confirmed',
              employeeName,
              employeeCode: response.recognized_employee?.code || response.employee_code,
              action
            });
            setStatus('success');
            setIsModalOpen(false);
            await speak(`${employeeName}. ${action === 'check-in' ? 'Check in' : 'Check out'} done successfully.`);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            // Suppress rendering of the success popup and close after 1s
            suppressSuccessUIRef.current = true;
            successTimerRef.current = window.setTimeout(() => {
              suppressSuccessUIRef.current = false;
              closeSuccessImmediate();
            }, 1000) as unknown as NodeJS.Timeout;
          }
        } else {
          throw new Error(response.message || 'Attendance failed');
        }
      } catch (error: any) {
        console.error('Submission error:', error);
        setIsModalOpen(false);
        const isNotFound = error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('employee');
        const isFaceError = error.message?.toLowerCase().includes('face') || error.message?.toLowerCase().includes('no face');

        if (isFaceError) {
          message.error('Face not detected. Please ensure your face is clearly visible.');
          await speak('Face not detected. Please try again.');
        } else if (isNotFound) {
          setManualRequestReason('Employee not found in the system.');
          setShowManualRequest(true);
          await speak('Employee not recognized. Please submit a manual request for HR approval.');
        } else {
          message.error('Attendance failed. Please try again.');
          await speak('Submission failed. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [action, speak, handleAutoConfirm, userLocation]
  );

  const handleNotMe = useCallback(async () => {
    if (!pendingAttendance) return;
    if (autoConfirmTimerRef.current) {
      clearInterval(autoConfirmTimerRef.current);
      autoConfirmTimerRef.current = null;
    }
    setAutoConfirmModal(false);
    message.info('Cancelling recognition...');
    await speak('Cancelling recognition...');
    try {
      const uuid = pendingAttendance.uuid || pendingAttendance.data?.uuid;
      if (!uuid) throw new Error('No UUID found');
      const cancelResponse = await attendanceServiceInstance.cancelAttendance({
        uuid,
        actual_employee_code: 'NOT_RECOGNIZED',
        actual_employee_name: 'User Cancelled',
        reason: 'proxy_detected_by_user'
      });
      if (cancelResponse.success) {
        message.success(cancelResponse.emailSent ? 'Cancelled. Proxy alert sent to admin.' : 'Recognition cancelled.');
        await speak(cancelResponse.emailSent ? 'Proxy detection reported. Admin notified.' : 'Recognition cancelled.');
      } else throw new Error(cancelResponse.message);
    } catch (error: any) {
      if (error.message?.includes('already confirmed')) {
        message.warning('Already confirmed automatically.');
      } else {
        message.error('Cancellation failed.');
      }
    }
    setPendingAttendance(null);
    setStatus('idle');
    setAttempts(0);
  }, [pendingAttendance, speak]);

  const handleActionClick = useCallback((selectedAction: 'check-in' | 'check-out') => {
    setAction(selectedAction);
    setAttempts(0);
    setStatus('idle');
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setIsSubmitting(false);
    setCountdown(0);
    setAttempts(0);
    setStatus('idle');
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    speechSynthRef.current?.cancel();
  }, []);

  const handleSuccessClose = useCallback(() => {
    const MIN_MS = 4000;
    if (successShownAtRef.current) {
      const elapsed = Date.now() - successShownAtRef.current;
      if (elapsed < MIN_MS) {
        const remaining = MIN_MS - elapsed;
        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
        }
        successTimerRef.current = window.setTimeout(() => handleSuccessClose(), remaining) as unknown as NodeJS.Timeout;
        return;
      }
    }
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    successShownAtRef.current = null;
    setSuccessData(null);
    setStatus('idle');
  }, []);

  const handleRetry = useCallback(async () => {
    setAttempts(0);
    setStatus('idle');
    setUserLocation(null);
    setLocationStatus('idle');
    setLocationError('');
    await speak('Restarting...');
    startAttendanceProcess();
  }, [startAttendanceProcess, speak]);

  const renderLocationStatus = () => {
    if (locationStatus === 'fetching')
      return (
        <div className="flex items-center text-blue-200 text-xs">
          <div className="w-3 h-3 border-2 border-blue-200 border-t-transparent rounded-full animate-spin mr-1.5" />
          Getting location...
        </div>
      );
    if (locationStatus === 'success')
      return (
        <div className="flex items-center text-emerald-200 text-xs">
          <EnvironmentOutlined className="mr-1" />
          {userLocation?.officeCheck?.isInOffice ? '🏢 Office' : '🌍 Remote'}
          <span className="mx-1.5 opacity-50">·</span>
          {userLocation?.officeCheck?.distance}m
        </div>
      );
    if (locationStatus === 'error')
      return (
        <div className="flex items-center text-red-300 text-xs">
          <ExclamationCircleOutlined className="mr-1" />
          {locationError}
        </div>
      );
    return null;
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col">
      {/* HEADER - Mobile/Tablet Only */}
      <div className="lg:hidden flex-shrink-0 px-3 pt-3 pb-2">
        {/* <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-3"> */}
        <div className="bg-white rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <img src="/bayanat-logo.png" alt="Logo" className="h-8 w-auto object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-gray-800">Smart Attendance</h1>
                <p className="text-xs text-gray-500">AI Face Recognition</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                <CalendarOutlined className="text-xs mr-1" />
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP HEADER - Hidden on Mobile/Tablet */}
      <div className="hidden lg:block px-6 pt-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl">
                    <img src="/bayanat-logo.png" alt="Bayanat Logo" className="w-14 h-14 object-contain" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-lg opacity-30 -z-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Smart Attendance
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">AI-Powered Face Recognition System</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow-lg min-w-[150px]">
                  <div className="flex items-center space-x-2 mb-2">
                    <CalendarOutlined className="text-blue-200 text-sm" />
                    <span className="text-blue-200 text-xs font-medium">TODAY</span>
                  </div>
                  <p className="text-lg font-bold">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-2xl shadow-lg min-w-[150px]">
                  <p className="text-lg font-bold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden px-2 pb-2 lg:px-6 lg:pb-6">
        <div className="h-full max-w-7xl mx-auto">
          {/* <div className="h-full bg-white/90 backdrop-blur-xl rounded-2xl lg:rounded-3xl shadow-xl lg:shadow-2xl border border-white/20 overflow-hidden"> */}
          <div className="h-full bg-white rounded-xl lg:rounded-3xl shadow-md lg:shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col justify-between p-3 sm:p-4 lg:p-12">
              {/* ACTION BUTTONS - Optimized for Mobile/Tablet */}
              <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 lg:gap-6 mb-3 lg:mb-8">
                {/* Check In */}
                <button
                  onClick={() => handleActionClick('check-in')}
                  className=" group relative bg-white border border-gray-200 rounded-2xl 
                              shadow-sm active:scale-95 active:shadow-inner transition-all duration-200 lg:rounded-3xl py-4 px-2 sm:p-4 lg:p-8 flex flex-col justify-center items-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-green-300"
                >
                  <div className="w-12 h-12 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg lg:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-2 lg:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <ArrowRightOutlined className="text-white text-sm sm:text-lg lg:text-2xl" />
                  </div>
                  <h3 className="text-xs sm:text-sm lg:text-xl font-bold text-gray-800 mb-0.5 lg:mb-2">Check In</h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-green-600 font-medium hidden sm:block">Start your day</p>
                  <div className="flex items-center gap-1 text-green-500 mt-1 lg:mt-2">
                    <ScanOutlined className="text-[10px] sm:text-xs lg:text-sm" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs font-medium">Face ID</span>
                  </div>
                </button>

                {/* Check Out */}
                <button
                  onClick={() => handleActionClick('check-out')}
                  className="group relative bg-white border border-gray-200 rounded-2xl 
shadow-sm active:scale-95 active:shadow-inner 
transition-all duration-200 lg:rounded-3xl py-4 px-2 sm:p-4 lg:p-8 flex flex-col justify-center items-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-300"
                >
                  <div className="w-12 h-12 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg lg:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-2 lg:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <ArrowLeftOutlined className="text-white text-sm sm:text-lg lg:text-2xl" />
                  </div>
                  <h3 className="text-xs sm:text-sm lg:text-xl font-bold text-gray-800 mb-0.5 lg:mb-2">Check Out</h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-blue-600 font-medium hidden sm:block">End your day</p>
                  <div className="flex items-center gap-1 text-blue-500 mt-1 lg:mt-2">
                    <ScanOutlined className="text-[10px] sm:text-xs lg:text-sm" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs font-medium">Face ID</span>
                  </div>
                </button>

                {/* Manual Request */}
                <button
                  onClick={() => {
                    setManualRequestReason('');
                    setShowManualRequest(true);
                  }}
                  className="group relative bg-white border border-amber-200 rounded-2xl 
                     shadow-sm active:scale-95 active:shadow-inner transition-all duration-200 lg:rounded-3xl py-4 px-2 sm:p-4 lg:p-8 flex flex-col justify-center items-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-amber-300"
                >
                  <div className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[8px] sm:text-[9px] lg:text-xs font-semibold px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full mb-1 lg:mb-3 border border-amber-200">
                    <WarningOutlined style={{ fontSize: 8 }} />
                    <span className="hidden sm:inline">Exception</span>
                  </div>
                  <div className="w-12 h-12 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg lg:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-2 lg:mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <FormOutlined className="text-white text-sm sm:text-lg lg:text-2xl" />
                  </div>
                  <h3 className="text-xs sm:text-sm lg:text-xl font-bold text-gray-800 mb-0.5 lg:mb-2">Manual</h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-amber-600 font-medium hidden sm:block">Face failed?</p>
                  <div className="flex items-center gap-1 text-amber-500 mt-1 lg:mt-2">
                    <span className="text-[9px] sm:text-[10px] lg:text-xs font-medium">HR Review</span>
                  </div>
                </button>
              </div>

              {/* FEATURES - Compact for Mobile/Tablet */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-6">
                {[
                  {
                    icon: <ScanOutlined className="text-white text-xs sm:text-sm lg:text-lg" />,
                    from: 'from-purple-500',
                    to: 'to-pink-500',
                    bg: 'from-purple-50 to-pink-50',
                    border: 'border-purple-200/50',
                    title: 'Auto Recognition',
                    desc: 'AI-powered face recognition'
                  },
                  {
                    icon: <EnvironmentOutlined className="text-white text-xs sm:text-sm lg:text-lg" />,
                    from: 'from-blue-500',
                    to: 'to-cyan-500',
                    bg: 'from-blue-50 to-cyan-50',
                    border: 'border-blue-200/50',
                    title: 'Location Smart',
                    desc: 'Office/remote detection'
                  },
                  {
                    icon: <UserOutlined className="text-white text-xs sm:text-sm lg:text-lg" />,
                    from: 'from-green-500',
                    to: 'to-emerald-500',
                    bg: 'from-green-50 to-emerald-50',
                    border: 'border-green-200/50',
                    title: 'Voice Guided',
                    desc: 'Step-by-step voice'
                  }
                ].map((f) => (
                  <div
                    key={f.title}
                    className={`bg-gradient-to-br ${f.bg} rounded-lg lg:rounded-2xl p-2 sm:p-3 lg:p-6 border ${f.border} text-center`}
                  >
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-gradient-to-br ${f.from} ${f.to} rounded-lg lg:rounded-xl flex items-center justify-center mx-auto mb-1 sm:mb-2 lg:mb-4`}
                    >
                      {f.icon}
                    </div>
                    <h4 className="font-bold text-gray-800 text-[10px] sm:text-xs lg:text-base mb-0.5 lg:mb-2">{f.title}</h4>
                    <p className="text-gray-600 text-[8px] sm:text-[10px] lg:text-sm hidden sm:block">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl w-full max-w-2xl mx-2 sm:mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center">
                  <CameraOutlined className="mr-2 text-lg sm:text-xl" />
                  {action === 'check-in' ? 'Check In' : 'Check Out'} — Face Recognition
                </h3>
                {renderLocationStatus()}
                {attempts > 0 && (
                  <span className="px-2 py-1 bg-blue-500/30 rounded-full text-blue-200 text-xs">
                    Attempt {attempts}/{maxAttempts}
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white hover:text-blue-200 p-1 rounded-full hover:bg-white/10 flex-shrink-0"
                disabled={isSubmitting}
              >
                <CloseOutlined className="text-base sm:text-lg" />
              </button>
            </div>

            <div className="p-3 sm:p-6">
              {status === 'error' ? (
                <div className="text-center py-8 sm:py-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExclamationCircleOutlined className="text-red-500 text-2xl sm:text-3xl" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Face Recognition Failed</h4>
                  <p className="text-gray-500 text-sm mb-6">Unable to verify your identity after {maxAttempts} attempts.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-sm transition-all hover:scale-105 shadow-md"
                    >
                      <RedoOutlined /> Try Again
                    </button>
                    <button
                      onClick={() => {
                        setManualRequestReason(`Face recognition failed after ${maxAttempts} attempts.`);
                        setIsModalOpen(false);
                        setShowManualRequest(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-xl font-semibold text-sm transition-all"
                    >
                      <FormOutlined /> Submit Manual Request
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">Manual requests are reviewed by HR and not instant.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div
                    className="relative rounded-2xl overflow-hidden bg-black border border-gray-300"
                    style={{ height: getCameraContainerHeight() }}
                  >
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={getVideoConstraints()}
                      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                      screenshotQuality={0.92}
                      mirrored
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-52 sm:w-48 sm:h-60 lg:w-56 lg:h-72 border-4 border-green-400 rounded-2xl flex items-center justify-center relative shadow-2xl">
                        <div className="w-32 sm:w-40 lg:w-48 h-12 sm:h-14 lg:h-16 border-t-2 border-green-400 flex items-center justify-center">
                          <span className="text-green-400 text-sm font-bold bg-black/50 px-3 py-1 rounded-lg">👤 Position Face Here</span>
                        </div>
                      </div>
                    </div>
                    {status === 'counting' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/95 rounded-full flex items-center justify-center mb-2 sm:mb-3 mx-auto shadow-lg">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-800">{countdown}</span>
                          </div>
                          <p className="text-white font-medium text-sm sm:text-base">Auto capture in {countdown}s</p>
                          {locationStatus === 'success' && <p className="text-green-300 text-xs mt-1">Location verified ✓</p>}
                        </div>
                      </div>
                    )}
                    {status === 'capturing' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
                          <p className="text-white font-medium text-sm sm:text-base">Processing...</p>
                          <p className="text-white/80 text-xs sm:text-sm mt-1">
                            Attempt {attempts + 1}/{maxAttempts}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-200">
                    <p className="text-blue-800 text-sm text-center font-medium mb-2">
                      {status === 'counting' ? `Capturing in ${countdown} seconds...` : 'Position your face within the green frame'}
                    </p>
                    {status === 'idle' && (
                      <div className="text-blue-600 text-xs text-center grid grid-cols-2 gap-1">
                        <div className="flex items-center justify-center">
                          <BulbOutlined className="mr-1" />
                          <span>Good lighting</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <WarningOutlined className="mr-1" />
                          <span>No sunglasses</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <UserOutlined className="mr-1" />
                          <span>Look at camera</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <ScanOutlined className="mr-1" />
                          <span>Fill the frame</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-Confirm Modal */}
      {autoConfirmModal && pendingAttendance && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 py-6 px-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Recognition Complete</h3>
              <p className="text-green-100 text-sm">Auto-confirm in {autoConfirmCountdown} seconds</p>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <img
                  src={pendingAttendance.recognized_employee?.image || '/default-avatar.png'}
                  alt="Recognized"
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-blue-400 shadow-lg mx-auto mb-4"
                />
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  {pendingAttendance.recognized_employee?.name || pendingAttendance.employee_name}
                </h4>
                <p className="text-gray-600 text-sm">{pendingAttendance.recognized_employee?.code || pendingAttendance.employee_code}</p>
                {userLocation && (
                  <div className="bg-blue-50 rounded-lg p-3 mt-3">
                    <div className="flex items-center justify-center text-blue-700 text-xs mb-1">
                      <EnvironmentOutlined className="mr-1" />
                      {userLocation.officeCheck.isInOffice ? '🏢 Office' : '🌍 Remote'}
                    </div>
                    <p className="text-blue-600 text-xs">{userLocation.officeCheck.distance}m from office center</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleNotMe}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3 px-6 rounded-xl font-semibold text-base transition-all hover:scale-105 shadow-lg"
              >
                ❌ It's Not Me — Cancel
              </button>
              <p className="text-gray-400 text-xs text-center mt-4">Attendance will be confirmed automatically if this is correct.</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {successData && !suppressSuccessUIRef.current && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircleOutlined className="text-green-500 text-3xl" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                {successData.action === 'check-in' ? 'Checked In! 🎉' : 'Checked Out! 👋'}
              </h4>
              <p className="text-gray-600 text-base mb-4">
                Attendance recorded for <strong className="text-gray-800">{successData.employeeName}</strong>
              </p>
              <p className="text-gray-500 text-sm mb-2">
                Code: <strong className="text-gray-700">{successData.employeeCode}</strong>
              </p>
              {userLocation && (
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-center text-blue-700 text-xs mb-1">
                    <EnvironmentOutlined className="mr-1" />
                    {userLocation.officeCheck.isInOffice ? '🏢 Office Location' : '🌍 Remote Location'}
                  </div>
                  <p className="text-blue-600 text-xs">Location verified</p>
                </div>
              )}
              <div className="text-gray-400 text-xs mb-4">Closes automatically in 4 seconds</div>
              <button
                onClick={handleSuccessClose}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-6 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Request Modal */}
      {showManualRequest && (
        <ManualRequestModal
          defaultEventType={action === 'check-in' ? 'check_in' : 'check_out'}
          onClose={() => {
            setShowManualRequest(false);
            setManualRequestReason('');
            setAttempts(0);
            setStatus('idle');
          }}
        />
      )}
    </div>
  );
};

export default AttendanceMarking;
