import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Monitor,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Send,
  Lock,
  Maximize2,
  Copy,
  Layers,
  HelpCircle,
  RefreshCw,
  Trophy,
  User,
  Info,
  FileText,
  BarChart2,
  Download,
  Calendar,
  Search,
  Trash2,
  Video,
  Play,
  FileVideo,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
  explanation: string;
}

interface AssessmentRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateEmpId: string;
  designation: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  pointsEarned: number;
  violations: number;
  passed: boolean;
  status: string;
  answersJson: string;
  recordingUrl?: string | null;
  submittedAt: string;
}

type ProctoringStatus = 'idle' | 'requesting' | 'active' | 'denied';
type AssessmentPhase = 'setup' | 'in-progress' | 'submitted';

// ─── 25 TECHNICAL QUESTIONS BASED ON ABHIJEET'S RESUME (DESKTOP ENGINEER) ─────
const TECHNICAL_QUESTIONS: Question[] = [
  {
    id: 1,
    category: 'Windows OS & Installation',
    text: 'When preparing a bootable USB drive to perform a clean Windows 11 installation on modern UEFI-based hardware, which partition scheme must be selected?',
    options: [
      'MBR (Master Boot Record)',
      'GPT (GUID Partition Table)',
      'FAT16 Legacy',
      'Dynamic Volume',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'Windows 11 with UEFI firmware requires the GPT (GUID Partition Table) partition scheme rather than legacy MBR to support Secure Boot and TPM 2.0.',
  },
  {
    id: 2,
    category: 'Windows OS & Troubleshooting',
    text: 'A user reports a Blue Screen of Death (BSOD) immediately after a cumulative Windows update. What is the recommended first recovery step?',
    options: [
      'Format the hard drive and reinstall Windows from scratch',
      'Boot into Windows Recovery Environment (WinRE) and uninstall the latest quality update',
      'Replace the motherboard and processor',
      'Run disk defragmentation on the C: drive',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'Booting into WinRE to uninstall the latest problematic quality update or using System Restore safely reverses software-induced update failures without data loss.',
  },
  {
    id: 3,
    category: 'Windows OS & System Tools',
    text: 'Which native Windows command-line utility scans system integrity and replaces damaged or corrupted operating system files from the local component store?',
    options: [
      'chkdsk /f',
      'sfc /scannow',
      'format c:',
      'ipconfig /all',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'System File Checker (`sfc /scannow`) inspects all protected operating system files and replaces corrupt versions with healthy copies from %WinDir%\\System32\\dllcache.',
  },
  {
    id: 4,
    category: 'Hardware & BIOS',
    text: 'A desktop fails to boot and displays the message "No bootable device found". What is the first hardware/BIOS check a Desktop Engineer should perform?',
    options: [
      'Replace the monitor HDMI display cable',
      'Check BIOS/UEFI boot order priority and verify if the SSD/HDD is recognized in SATA/NVMe configuration',
      'Re-apply thermal paste onto the CPU cooler',
      'Change the screen refresh rate',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'Checking BIOS/UEFI confirms whether the storage drive hardware is detected by the motherboard and whether the correct drive is set as priority #1 in boot sequence.',
  },
  {
    id: 5,
    category: 'Hardware Diagnostics',
    text: 'A computer powers on with fans spinning at maximum speed, but the screen remains blank and the motherboard emits 3 continuous long beeps. What does this beep code typically indicate?',
    options: [
      'Keyboard or mouse is disconnected',
      'RAM module is loose, unseated, or faulty',
      'Ethernet cable is unplugged',
      'Printer spooler service is stopped',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'Repeated beep codes during POST (Power-On Self-Test) usually signal a memory fault. Reseating or testing individual RAM sticks in different slots is the standard fix.',
  },
  {
    id: 6,
    category: 'Hardware Maintenance',
    text: 'A workstation loses its system date and time (resetting to year 2000 or manufacturer default) every time the wall power switch is turned off. What component needs replacement?',
    options: [
      'SMPS Power Supply Unit',
      'CR2032 Lithium CMOS Coin Battery on the motherboard',
      'Processor Cooling Fan',
      'PCIe Network Interface Card',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'The 3V CR2032 CMOS battery maintains volatile BIOS/RTC chip settings (time, date, boot parameters) when the computer is completely disconnected from AC power.',
  },
  {
    id: 7,
    category: 'Preventive Maintenance (PM)',
    text: 'During periodic Preventive Maintenance (PM), a laptop is observed overheating and thermal throttling under normal load. What physical maintenance action is necessary?',
    options: [
      'Clearing dust from the cooling radiator/fan exhaust and replacing dry CPU thermal paste',
      'Reformatting the operating system',
      'Lowering the display brightness to zero',
      'Replacing the laptop trackpad',
    ],
    correctIndex: 0,
    points: 4,
    explanation:
      'Dust build-up restricts airflow and degraded thermal interface material (TIM) prevents heat transfer from the processor die to the copper heat pipe assembly.',
  },
  {
    id: 8,
    category: 'Hardware Diagnostics',
    text: 'How can an IT support technician proactively check the mechanical and electrical health of a hard drive or SSD before total catastrophic data failure occurs?',
    options: [
      'Inspect S.M.A.R.T. health attributes (reallocated sectors, drive temperature, wear leveling) using diagnostic utilities',
      'Empty the Windows Recycle Bin',
      'Delete temporary browser cache files',
      'Run Windows Paint graphics test',
    ],
    correctIndex: 0,
    points: 4,
    explanation:
      'S.M.A.R.T. (Self-Monitoring, Analysis, and Reporting Technology) monitors critical drive health metrics like reallocated sectors, read errors, and power-on hours.',
  },
  {
    id: 9,
    category: 'Computer Networking',
    text: 'A desktop computer connected via Ethernet cable displays "No Internet Access" and an IP address of 169.254.85.120. What is the root cause?',
    options: [
      'The computer has successfully obtained a static public IP',
      'The DHCP server is unreachable or failing, causing Windows to assign an APIPA (Automatic Private IP) address',
      'The computer has a high-speed Gigabit fiber link',
      'The Windows firewall is completely disabled',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'Addresses in the 169.254.0.0/16 range are Automatic Private IP Addressing (APIPA), assigned when a client requests an IP from DHCP but receives no response.',
  },
  {
    id: 10,
    category: 'Computer Networking',
    text: 'Which command combination in Windows Command Prompt releases the current IP configuration and requests a fresh lease from the network DHCP router?',
    options: [
      'ping 127.0.0.1 && ping 8.8.8.8',
      'ipconfig /release && ipconfig /renew',
      'netstat -a && route print',
      'tracert www.google.com',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      '`ipconfig /release` releases the current DHCP lease back to the server, and `ipconfig /renew` broadcasts a fresh DHCP Discover request.',
  },
  {
    id: 11,
    category: 'Computer Networking',
    text: 'A user can ping internal servers using their IP address (e.g., 192.168.1.50) but fails to connect when typing the server hostname (e.g., fileserver.company.local). What network service is misconfigured?',
    options: [
      'DHCP Server',
      'DNS (Domain Name System) configuration',
      'ARP protocol',
      'SMTP Email gateway',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'DNS translates human-readable hostnames into numeric IP addresses. If IP connectivity succeeds but hostname lookup fails, DNS settings or cache are at fault.',
  },
  {
    id: 12,
    category: 'Networking Hardware & Cabling',
    text: 'Under the standard TIA/EIA T568B color code for RJ-45 Cat6 Ethernet cable crimping, which color wire corresponds to Pin 1?',
    options: [
      'White-Green',
      'White-Orange',
      'Solid Blue',
      'White-Brown',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'The standard T568B sequence from Pin 1 to 8 is: White-Orange, Orange, White-Green, Blue, White-Blue, Green, White-Brown, Brown.',
  },
  {
    id: 13,
    category: 'Computer Networking',
    text: 'Which diagnostic tool shows the exact path, intermediate gateway router hops, and latency delays taken by packets across a LAN/WAN to a destination host?',
    options: [
      'tracert (Traceroute)',
      'cls',
      'dxdiag',
      'mstsc',
    ],
    correctIndex: 0,
    points: 4,
    explanation:
      '`tracert` sends ICMP packets with incremental TTL values to discover and measure round-trip latency to each intermediate router along the network path.',
  },
  {
    id: 14,
    category: 'Computer Networking',
    text: 'When configuring a static IP on a newly installed office desktop with Subnet Mask 255.255.255.0, what does the "Default Gateway" IP address represent?',
    options: [
      'The IP address of the user’s computer monitor',
      'The internal LAN IP address of the local network router that forwards traffic outside the subnet',
      'The public IP of Google DNS (8.8.8.8)',
      'The loopback testing address 127.0.0.1',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'The default gateway is the node on a computer network that serves as an access point to another network (such as the Internet or corporate WAN).',
  },
  {
    id: 15,
    category: 'Printer Troubleshooting',
    text: 'Multiple print requests from office staff are stuck in the Windows queue with status "Deleting..." or "Error - Printing" and cannot be cancelled. What service should be stopped and restarted?',
    options: [
      'Windows Audio service',
      'Print Spooler service (spoolsv.exe)',
      'Bluetooth Support service',
      'Windows Update service',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'Stopping the Print Spooler service, deleting files from C:\\Windows\\System32\\spool\\PRINTERS, and restarting the service clears stubborn stuck print jobs.',
  },
  {
    id: 16,
    category: 'Printer Installation & Setup',
    text: 'An office shared printer cannot be discovered automatically on Windows. What is the standard enterprise method to add it manually?',
    options: [
      'Add Printer using a Standard TCP/IP Port with the printer’s static IP address and appropriate vendor driver',
      'Connect an HDMI cable to the printer',
      'Uninstall Windows Defender antivirus',
      'Restart the office Wi-Fi router',
    ],
    correctIndex: 0,
    points: 4,
    explanation:
      'Enterprise network printers are assigned reserved static IPs and added via "Add a printer using an IP address or hostname" using Standard TCP/IP port creation.',
  },
  {
    id: 17,
    category: 'Printer Troubleshooting',
    text: 'A laser printer generates documents with faint vertical streaks or uneven toner distribution across printed text. What is the initial recommended hardware check?',
    options: [
      'Check if the toner cartridge is low/depleted, or gently rock the cartridge to redistribute toner powder',
      'Replace the network Ethernet switch',
      'Reinstall the computer BIOS firmware',
      'Format the client hard drive',
    ],
    correctIndex: 0,
    points: 4,
    explanation:
      'Faint vertical white lines or light streaks indicate low toner powder or a damaged drum roller. Rocking the cartridge temporarily redistributes toner before replacement.',
  },
  {
    id: 18,
    category: 'Remote Support & Protocols',
    text: 'What is the default TCP listening port used by Microsoft Windows Remote Desktop Protocol (RDP / mstsc)?',
    options: [
      'Port 21',
      'Port 80',
      'Port 3389',
      'Port 443',
    ],
    correctIndex: 2,
    points: 4,
    explanation:
      'TCP port 3389 is the standardized listening port assigned by IANA for Microsoft Remote Desktop Protocol (RDP) remote administration sessions.',
  },
  {
    id: 19,
    category: 'Enterprise Applications',
    text: 'A corporate employee states that Microsoft Outlook instantly crashes on launch every time. Which run command starts Outlook with third-party COM add-ins disabled to isolate the fault?',
    options: [
      'outlook.exe /safe',
      'outlook.exe /resetnavpane',
      'outlook.exe /cleanreminders',
      'outlook.exe /reinstall',
    ],
    correctIndex: 0,
    points: 4,
    explanation:
      '`outlook.exe /safe` launches Outlook in Safe Mode with all add-ins, customizations, and reading pane extensions disabled, isolating misbehaving third-party plugins.',
  },
  {
    id: 20,
    category: 'ITIL & Helpdesk Ticketing',
    text: 'A Desktop Support Engineer receives a critical user ticket regarding network switch port failure that requires infrastructure access beyond L1 permissions. What is the correct standard operating procedure?',
    options: [
      'Close the ticket and inform the user that it cannot be done',
      'Document all diagnostic tests conducted and escalate the ticket with full logs to the L2/L3 Network Infrastructure team according to SLA protocol',
      'Ignore the ticket and wait for the user to follow up',
      'Attempt to rewire the building patch panel without authorization',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'ITIL service management mandates documenting initial L1 findings (cable tests, switch port numbers, IP config) and formally escalating to tier-2 network specialists within SLA limits.',
  },
  {
    id: 21,
    category: 'Helpdesk Logging & Documentation',
    text: 'Why is it mandatory for a Desktop Support Engineer to record thorough technical solutions and troubleshooting steps in the IT ticket management system?',
    options: [
      'To build a searchable internal knowledge base, maintain accountability, and establish recurring issue trends for asset audits',
      'To consume disk space on the server',
      'Only to satisfy government labor laws',
      'It is not necessary if the user is satisfied verbally',
    ],
    correctIndex: 0,
    points: 4,
    explanation:
      'Detailed ticket notes create an institutional knowledge base, improve first-contact resolution rates for other technicians, and provide auditable records of work done.',
  },
  {
    id: 22,
    category: 'Endpoint Security & Antivirus',
    text: 'A user calls the IT desk reporting that strange ransom notes appeared on their desktop and files are receiving encrypted extensions (.locked). What is the immediate first action to take?',
    options: [
      'Leave the computer connected and restart it 5 times',
      'Immediately isolate the computer by disconnecting the physical Ethernet cable and disabling Wi-Fi to stop lateral network malware spread',
      'Forward the encrypted files to all company employees to ask if they recognize it',
      'Pay the ransom using personal credit card',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'Isolating the endpoint from the network is the #1 containment rule in incident response to prevent ransomware from propagating laterally across shared network drives.',
  },
  {
    id: 23,
    category: 'Endpoint Security & Antivirus',
    text: 'Why is it critical for company endpoints to have daily automated Antivirus signature and definition updates enabled?',
    options: [
      'To change the user desktop wallpaper',
      'To protect the system against newly discovered zero-day malware signatures, polymorphic viruses, and exploit payloads',
      'To increase internet bandwidth speed',
      'To delete old user documents automatically',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'Antivirus engines rely on up-to-date signature definitions and behavioral heuristic patterns to identify newly compiled malware and exploit techniques released daily.',
  },
  {
    id: 24,
    category: 'Data Protection & Security',
    text: 'Which native Windows feature provides full-volume disk encryption to safeguard sensitive enterprise data on laptops against offline extraction if the device is lost or stolen?',
    options: [
      'Windows Defender SmartScreen',
      'BitLocker Drive Encryption',
      'System Restore',
      'Windows Media Player',
    ],
    correctIndex: 1,
    points: 4,
    explanation:
      'BitLocker uses AES encryption integrated with the motherboard’s TPM (Trusted Platform Module) chip to encrypt entire operating system and data drives.',
  },
  {
    id: 25,
    category: 'IT Asset Management (ITAM)',
    text: 'What is the primary operational objective of maintaining an up-to-date IT Asset Management (ITAM) record for desktop computers, laptops, and peripheral devices?',
    options: [
      'To track equipment serial numbers, hardware specs, employee assignments, warranty expiration, and maintenance lifecycle records',
      'To sell used hardware without management knowledge',
      'To track employee browsing history outside work hours',
      'To restrict computers to running only a single program',
    ],
    correctIndex: 0,
    points: 4,
    explanation:
      'ITAM ensures financial tracking, warranty support validity, software license compliance, and clear custody tracking of company-owned hardware assets throughout their lifecycle.',
  },
];

const ASSESSMENT_DURATION_SECONDS = 40 * 60; // 40 minutes for 25 questions
const MAX_VIOLATIONS = 3;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Synthesize distinct high-urgency two-tone alarm siren via Web Audio API
function playAlarmSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    // Two-tone high-low alarm pattern: 880Hz (A5) -> 587Hz (D5) -> 880Hz -> 587Hz
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(587, now + 0.15);
    osc.frequency.setValueAtTime(880, now + 0.3);
    osc.frequency.setValueAtTime(587, now + 0.45);
    osc.frequency.setValueAtTime(880, now + 0.6);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.setValueAtTime(0.4, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.85);
  } catch (err) {
    console.warn('Proctoring alarm audio playback restricted:', err);
  }
}

export const AssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'].includes(user?.role || '');

  // Admin View State: 'reports' | 'test'
  const [adminTab, setAdminTab] = useState<'reports' | 'test'>('reports');
  const [adminReports, setAdminReports] = useState<AssessmentRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AssessmentRecord | null>(null);
  const [reportSearch, setReportSearch] = useState('');

  // Candidate Details
  const candidateName = user?.employee
    ? `${user.employee.firstName} ${user.employee.lastName}`
    : 'Abhijeet kumar S';
  const candidateEmpId = user?.employee?.employeeId || 'DCT-26-004';
  const candidateEmail = user?.email || 'abhijeet.s@divinecoretech.com';
  const candidateDesignation =
    typeof user?.employee?.designation === 'object' && user?.employee?.designation !== null
      ? (user.employee.designation as { name?: string }).name || 'IT & Project support'
      : (user?.employee?.designation as unknown as string) || 'IT & Project support';

  // Proctoring States
  const [proctoringStatus, setProctoringStatus] = useState<ProctoringStatus>('idle');
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const videoHudRef = useRef<HTMLVideoElement>(null);

  // Screen Video Recording states
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Fullscreen lockdown state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Exam States
  const [phase, setPhase] = useState<AssessmentPhase>('setup');
  const [answers, setAnswers] = useState<(number | null)[]>(Array(TECHNICAL_QUESTIONS.length).fill(null));
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ASSESSMENT_DURATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Violation States
  const [violations, setViolations] = useState(0);
  const [violationAlertModal, setViolationAlertModal] = useState<string | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const lastViolationTimeRef = useRef<number>(0);

  // Session Recovery & Persistence State (handles page reloads without losing test progress)
  const [activeSessionToResume, setActiveSessionToResume] = useState<{
    answers: (number | null)[];
    currentQ: number;
    timeLeft: number;
    violations: number;
  } | null>(null);

  // Score states
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [finalAnswers, setFinalAnswers] = useState<(number | null)[]>([]);
  const [completedRecord, setCompletedRecord] = useState<AssessmentRecord | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // ── Single-Attempt Verification: Check if candidate already completed or had exam terminated ───
  const checkCandidateSubmission = useCallback(async () => {
    setCheckingExisting(true);
    try {
      const res = await api.get('/assessments');
      if (res.data.success && Array.isArray(res.data.data)) {
        if (isAdmin) {
          setAdminReports(res.data.data);
        }

        // For regular employees: enforce single-attempt policy
        // If employee has any submission in DB (COMPLETED or TERMINATED), load score report directly
        if (!isAdmin) {
          const candidateSubmissions = res.data.data.filter(
            (sub: AssessmentRecord) =>
              sub.candidateEmail.toLowerCase() === candidateEmail.toLowerCase() ||
              (sub.candidateEmpId && sub.candidateEmpId === candidateEmpId)
          );

          if (candidateSubmissions.length > 0) {
            const latest = candidateSubmissions[0];
            setCompletedRecord(latest);
            setScore(latest.score);
            setPassed(latest.passed);
            setViolations(latest.violations);

            // Parse saved answers
            try {
              const parsed = JSON.parse(latest.answersJson);
              const loadedAns: (number | null)[] = Array(TECHNICAL_QUESTIONS.length).fill(null);
              parsed.forEach((item: { selectedOptionIndex?: number; selectedOption?: string }, idx: number) => {
                if (typeof item.selectedOptionIndex === 'number') {
                  loadedAns[idx] = item.selectedOptionIndex;
                } else if (item.selectedOption) {
                  const optIdx = TECHNICAL_QUESTIONS[idx]?.options.indexOf(item.selectedOption);
                  loadedAns[idx] = optIdx !== -1 ? optIdx : null;
                }
              });
              setFinalAnswers(loadedAns);
              setAnswers(loadedAns);
            } catch {
              // ignore
            }

            // Remove any leftover in-progress session since assessment is officially completed
            try {
              localStorage.removeItem(`proctor_session_${candidateEmpId}`);
            } catch {}

            setPhase('submitted');
            setCheckingExisting(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Error checking existing submission:', err);
    } finally {
      setCheckingExisting(false);
    }
  }, [candidateEmail, candidateEmpId, isAdmin]);

  useEffect(() => {
    checkCandidateSubmission();
  }, [checkCandidateSubmission]);

  const fetchAdminReports = checkCandidateSubmission;

  // ── Session Recovery on Mount (Only if candidate has not already submitted) ───
  useEffect(() => {
    if (completedRecord || phase === 'submitted') return;
    try {
      const savedRaw = localStorage.getItem(`proctor_session_${candidateEmpId}`);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved && saved.phase === 'in-progress' && Array.isArray(saved.answers)) {
          const elapsed = Math.max(0, Math.floor((Date.now() - saved.lastSavedAt) / 1000));
          const remTime = Math.max(0, saved.timeLeft - elapsed);

          if (remTime > 0) {
            const newViolations = (saved.violations || 0) + 1;
            setActiveSessionToResume({
              answers: saved.answers,
              currentQ: saved.currentQ || 0,
              timeLeft: remTime,
              violations: newViolations,
            });
            setAnswers(saved.answers);
            setCurrentQ(saved.currentQ || 0);
            setTimeLeft(remTime);
            setViolations(newViolations);

            playAlarmSound();
            toast.error(
              `Active assessment recovered! Page reload recorded as Violation #${newViolations} of ${MAX_VIOLATIONS}. Answers preserved. Re-connect screen share to resume.`,
              { duration: 9000 }
            );
          } else {
            localStorage.removeItem(`proctor_session_${candidateEmpId}`);
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore active session:', e);
    }
  }, [candidateEmpId, completedRecord, phase]);

  // ── Continuous Session Persistence ─────────────────────────────────────────
  useEffect(() => {
    if (phase === 'in-progress') {
      try {
        localStorage.setItem(
          `proctor_session_${candidateEmpId}`,
          JSON.stringify({
            candidateEmpId,
            phase: 'in-progress',
            answers,
            currentQ,
            timeLeft,
            violations,
            lastSavedAt: Date.now(),
          })
        );
      } catch (err) {
        console.warn('Failed to save assessment session:', err);
      }
    }
  }, [phase, answers, currentQ, timeLeft, violations, candidateEmpId]);

  // ── BeforeUnload Protection (Warns candidate before reload/close) ───────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === 'in-progress') {
        e.preventDefault();
        e.returnValue = 'Assessment is in progress! Reloading will be recorded as an integrity violation.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  // Clear all exam history (Admin only)
  const [clearingHistory, setClearingHistory] = useState(false);
  const handleClearAllHistory = async () => {
    if (
      !window.confirm(
        'Are you sure you want to clear ALL previous assessment exam history? This will permanently delete all candidate records from the database.'
      )
    ) {
      return;
    }
    setClearingHistory(true);
    try {
      const res = await api.delete('/assessments');
      if (res.data.success) {
        toast.success(res.data.message || 'All previous exam history cleared successfully!');
        setAdminReports([]);
        setSelectedReport(null);
      }
    } catch {
      toast.error('Failed to clear assessment history. Please ensure admin privileges.');
    } finally {
      setClearingHistory(false);
    }
  };

  // Delete single candidate assessment record
  const handleDeleteReport = async (reportId: string, candidate: string) => {
    if (!window.confirm(`Delete the assessment report for ${candidate}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/assessments/${reportId}`);
      if (res.data.success) {
        toast.success('Assessment record deleted successfully');
        setAdminReports((prev) => prev.filter((r) => r.id !== reportId));
        if (selectedReport?.id === reportId) {
          setSelectedReport(null);
        }
      }
    } catch {
      toast.error('Failed to delete assessment record');
    }
  };

  // Navigation helper
  const handleGoBack = useCallback(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/');
    } else if (id) {
      navigate(`/employees/${id}`);
    } else {
      navigate('/employees');
    }
  }, [user, id, navigate]);

  // Request native fullscreen
  const requestBrowserFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch(() => {
          toast.error('Please click to permit Fullscreen mode.', { id: 'fs-err' });
        });
    }
  }, []);

  // Submit assessment logic & persist to DB
  const handleSubmit = useCallback(
    async (forced = false) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Exit fullscreen cleanly
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      let totalPoints = 0;
      let correctCount = 0;
      const currentAns = [...answers];

      TECHNICAL_QUESTIONS.forEach((q, i) => {
        if (currentAns[i] === q.correctIndex) {
          totalPoints += q.points;
          correctCount++;
        }
      });

      const totalPossible = TECHNICAL_QUESTIONS.reduce((a, q) => a + q.points, 0);
      const pct = Math.round((totalPoints / totalPossible) * 100);
      const isPass = pct >= 60;

      setScore(pct);
      setPassed(isPass);
      setFinalAnswers(currentAns);
      setPhase('submitted');
      setShowConfirmSubmit(false);
      setViolationAlertModal(null);
      setActiveSessionToResume(null);

      // Stop and finalize screen video recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      setIsRecording(false);

      // Brief wait to ensure all video chunks are flushed
      await new Promise((resolve) => setTimeout(resolve, 350));

      let uploadedRecordingUrl: string | null = null;
      if (recordedChunksRef.current.length > 0) {
        try {
          const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          if (videoBlob.size > 0) {
            const formData = new FormData();
            formData.append(
              'recording',
              videoBlob,
              `assessment-${candidateEmpId}-${Date.now()}.webm`
            );
            const uploadRes = await api.post('/assessments/upload-recording', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (uploadRes.data?.success && uploadRes.data.recordingUrl) {
              uploadedRecordingUrl = uploadRes.data.recordingUrl;
            }
          }
        } catch (uploadErr) {
          console.warn('Screen recording upload error:', uploadErr);
        }
      }

      // Clear persisted session from localStorage
      try {
        localStorage.removeItem(`proctor_session_${candidateEmpId}`);
      } catch {}

      // Save to Backend API
      setSubmittingResult(true);
      try {
        const payload = {
          candidateName,
          candidateEmail,
          candidateEmpId,
          designation: candidateDesignation,
          score: pct,
          totalQuestions: TECHNICAL_QUESTIONS.length,
          correctAnswers: correctCount,
          pointsEarned: totalPoints,
          violations,
          passed: isPass,
          status: forced ? 'TERMINATED' : 'COMPLETED',
          recordingUrl: uploadedRecordingUrl,
          answersJson: JSON.stringify(
            TECHNICAL_QUESTIONS.map((q, i) => ({
              questionId: q.id,
              question: q.text,
              category: q.category,
              selectedOptionIndex: currentAns[i],
              selectedOption: currentAns[i] !== null ? q.options[currentAns[i]!] : null,
              correctOption: q.options[q.correctIndex],
              isCorrect: currentAns[i] === q.correctIndex,
              points: q.points,
              explanation: q.explanation,
            }))
          ),
        };

        const res = await api.post('/assessments/submit', payload);
        if (res.data?.data) {
          setCompletedRecord(res.data.data);
        }
        toast.success('Assessment report and screen recording saved for Administrator review!');
      } catch (err) {
        console.error('Failed to save assessment to server:', err);
      } finally {
        setSubmittingResult(false);
      }

      if (forced) {
        toast.error('Assessment terminated due to repeated proctoring violations.', { duration: 6000 });
      }
    },
    [answers, candidateName, candidateEmail, candidateEmpId, candidateDesignation, violations]
  );

  // Trigger violation handler with cooldown debounce
  const triggerViolation = useCallback(
    (reason: string) => {
      const now = Date.now();
      // Debounce threshold: 3.5 seconds.
      // Switching tabs or losing focus triggers blur + visibilitychange + fullscreen exit simultaneously.
      // We must only count it as 1 single violation!
      if (now - lastViolationTimeRef.current < 3500) {
        return;
      }
      lastViolationTimeRef.current = now;

      setPhase((currentPhase) => {
        if (currentPhase !== 'in-progress') return currentPhase;

        playAlarmSound();

        setViolations((v) => {
          const newCount = v + 1;

          if (newCount >= MAX_VIOLATIONS) {
            setViolationAlertModal(
              `MAXIMUM SECURITY VIOLATIONS REACHED (${newCount}/${MAX_VIOLATIONS}): Disqualified due to repeated tab switching or focus loss.`
            );
            toast.error('Integrity threshold exceeded! Submitting assessment as terminated...', { duration: 6000 });
            setTimeout(() => handleSubmit(true), 2500);
          } else {
            setViolationAlertModal(
              `Security Warning #${newCount} of ${MAX_VIOLATIONS}: ${reason}. Tab switching and leaving the assessment arena are strictly prohibited.`
            );
            toast.error(
              `⚠️ Warning #${newCount}/${MAX_VIOLATIONS}: ${reason}. (${MAX_VIOLATIONS - newCount} warnings remaining)`,
              { duration: 6000 }
            );
          }
          return newCount;
        });

        return currentPhase;
      });
    },
    [handleSubmit]
  );

  // 1. FULLSCREEN CHANGE & TAB SWITCH / BLUR DETECTION
  useEffect(() => {
    if (phase !== 'in-progress') return;

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (!isNowFullscreen && phase === 'in-progress') {
        triggerViolation('Exited Fullscreen mode — browser tabs were exposed');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('Tab switched or browser minimized');
      } else {
        // User returned to this tab: sound alarm so candidate is instantly alerted
        playAlarmSound();
      }
    };

    const handleBlur = () => {
      triggerViolation('Window lost focus — clicked outside assessment or switched tabs');
    };

    const handleFocus = () => {
      // Re-sound alarm when window re-focused if warning is active
      if (violationAlertModal) {
        playAlarmSound();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [phase, triggerViolation, violationAlertModal]);

  // 2. BLOCK COPY, PASTE, CUT, RIGHT-CLICK & KEYBOARD SHORTCUTS
  useEffect(() => {
    if (phase !== 'in-progress') return;

    const blockEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const labels: Record<string, string> = {
        copy: 'Copying text is strictly prohibited',
        paste: 'Pasting content is prohibited',
        cut: 'Cutting text is prohibited',
        contextmenu: 'Right-click context menu is disabled',
        selectstart: 'Text selection is disabled',
        dragstart: 'Dragging content is disabled',
      };
      triggerViolation(labels[e.type] ?? `Blocked action: ${e.type}`);
    };

    const blockKeyboard = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isCmdOrCtrl && ['c', 'v', 'x', 'a', 'u', 's', 'p', 'tab'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation(`Shortcut "${isCmdOrCtrl ? 'Ctrl+' : ''}${key.toUpperCase()}" is blocked`);
        return;
      }

      if (
        e.key === 'F12' ||
        e.key === 'F11' ||
        e.key === 'PrintScreen' ||
        (isCmdOrCtrl && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.altKey && (e.key === 'Tab' || e.key === 'F4'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation(`Restricted key "${e.key}" detected`);
      }
    };

    document.addEventListener('copy', blockEvent);
    document.addEventListener('paste', blockEvent);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('contextmenu', blockEvent);
    document.addEventListener('selectstart', blockEvent);
    document.addEventListener('dragstart', blockEvent);
    document.addEventListener('keydown', blockKeyboard);

    return () => {
      document.removeEventListener('copy', blockEvent);
      document.removeEventListener('paste', blockEvent);
      document.removeEventListener('cut', blockEvent);
      document.removeEventListener('contextmenu', blockEvent);
      document.removeEventListener('selectstart', blockEvent);
      document.removeEventListener('dragstart', blockEvent);
      document.removeEventListener('keydown', blockKeyboard);
    };
  }, [phase, triggerViolation]);

  // 3. EXAM TIMER
  useEffect(() => {
    if (phase !== 'in-progress') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          toast('Time is up! Submitting answers automatically...', { icon: '⏰' });
          handleSubmit(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, handleSubmit]);

  // Cleanup screen stream on unmount
  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Request screen sharing
  const requestScreenShare = async () => {
    setProctoringStatus('requesting');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing API not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      if (videoHudRef.current) {
        videoHudRef.current.srcObject = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          setProctoringStatus('denied');
          triggerViolation('Screen sharing stream was disconnected by candidate');
        });
      }

      setProctoringStatus('active');
      toast.success('Screen sharing active! Verified successfully.');
    } catch (err) {
      console.error(err);
      setProctoringStatus('denied');
      toast.error('Screen sharing permission is required to launch the assessment.', { duration: 5000 });
    }
  };

  // Launch proctored assessment
  const startAssessment = () => {
    if (proctoringStatus !== 'active' || !screenStreamRef.current) {
      toast.error('Please share your screen first before starting the test.');
      return;
    }

    requestBrowserFullscreen();

    setPhase('in-progress');

    if (activeSessionToResume) {
      // Resume existing exam progress seamlessly
      setAnswers(activeSessionToResume.answers);
      setCurrentQ(activeSessionToResume.currentQ);
      setTimeLeft(activeSessionToResume.timeLeft);
      setViolations(activeSessionToResume.violations);

      if (activeSessionToResume.violations >= MAX_VIOLATIONS) {
        setViolationAlertModal(
          `MAXIMUM SECURITY VIOLATIONS REACHED (${activeSessionToResume.violations}/${MAX_VIOLATIONS}): Disqualified due to repeated page reloads.`
        );
        setTimeout(() => handleSubmit(true), 2500);
      } else {
        setViolationAlertModal(
          `Security Warning #${activeSessionToResume.violations} of ${MAX_VIOLATIONS}: Page reload detected. Your progress was restored at Question ${activeSessionToResume.currentQ + 1} of ${TECHNICAL_QUESTIONS.length}.`
        );
        playAlarmSound();
      }

      toast.success(`Resumed assessment at Question #${activeSessionToResume.currentQ + 1}!`);
    } else {
      // Fresh assessment session
      setViolations(0);
      setAnswers(Array(TECHNICAL_QUESTIONS.length).fill(null));
      setCurrentQ(0);
      setTimeLeft(ASSESSMENT_DURATION_SECONDS);
      setViolationAlertModal(null);
      toast.success('Technical assessment started in Secure Fullscreen Mode!');
    }

    // Start continuous Screen Video Recording of the session
    if (screenStreamRef.current) {
      try {
        recordedChunksRef.current = [];
        let mimeType = 'video/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else if (MediaRecorder.isTypeSupported('video/webm')) {
            mimeType = 'video/webm';
          } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          }

          const recorder = new MediaRecorder(screenStreamRef.current, { mimeType });
          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };
          recorder.start(1000); // collect chunk every 1 second
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
        }
      } catch (err) {
        console.warn('Failed to start MediaRecorder on screen stream:', err);
      }
    }

    setTimeout(() => {
      if (videoHudRef.current && screenStreamRef.current) {
        videoHudRef.current.srcObject = screenStreamRef.current;
      }
      setIsFullscreen(!!document.fullscreenElement);
    }, 200);
  };

  // Show clean spinner while checking if employee has already completed the assessment
  if (checkingExisting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Verifying candidate assessment records...
        </p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ADMIN OVERSIGHT VIEW (When Admin/HR views /assessment and is not testing)
  // ══════════════════════════════════════════════════════════════════════════════
  if (isAdmin && adminTab === 'reports' && phase === 'setup') {
    const filteredReports = adminReports.filter(
      (r) =>
        r.candidateName.toLowerCase().includes(reportSearch.toLowerCase()) ||
        r.candidateEmpId.toLowerCase().includes(reportSearch.toLowerCase()) ||
        r.candidateEmail.toLowerCase().includes(reportSearch.toLowerCase())
    );

    const totalPassed = adminReports.filter((r) => r.passed).length;
    const avgScore =
      adminReports.length > 0
        ? Math.round(adminReports.reduce((acc, r) => acc + r.score, 0) / adminReports.length)
        : 0;

    return (
      <div className="space-y-6">
        {/* Header with Switch Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-blue-600" /> Assessment Reports & Proctoring Oversight
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review employee technical competency evaluations, proctoring violation logs, and test results.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {adminReports.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                disabled={clearingHistory}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                title="Clear All Exam Records"
              >
                <Trash2 className="w-4 h-4" />
                {clearingHistory ? 'Clearing History...' : 'Clear All Exam History'}
              </button>
            )}
            <button
              onClick={() => {
                setAdminTab('test');
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" /> Preview / Take Assessment
            </button>
            <button
              onClick={fetchAdminReports}
              disabled={loadingReports}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Reports"
            >
              <RefreshCw className={`w-4 h-4 ${loadingReports ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{adminReports.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Submissions Recorded</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalPassed}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Passed Evaluations</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{avgScore}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Score</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {adminReports.reduce((acc, r) => acc + r.violations, 0)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Violations Logged</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            placeholder="Search candidate by name, employee ID (e.g. DCT-26-004), or email..."
            className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {reportSearch && (
            <button
              onClick={() => setReportSearch('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Reports Table */}
        <div className="rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0E1B2D] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Candidate</th>
                  <th className="py-4 px-4">Designation</th>
                  <th className="py-4 px-4">Score</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Violations</th>
                  <th className="py-4 px-4">Submitted At</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold text-sm">No assessment reports found</p>
                      <p className="text-xs mt-1">
                        When candidate Abhijeet kumar S completes the assessment, his proctoring audit and score will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#1A2C46]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">
                            {report.candidateName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{report.candidateName}</p>
                            <p className="text-[11px] text-slate-400">{report.candidateEmpId} &bull; {report.candidateEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {report.designation}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {report.score}%
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">
                          ({report.correctAnswers}/{report.totalQuestions})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            report.passed
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {report.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {report.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            report.violations > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500'
                          }`}
                        >
                          {report.violations > 0 ? `⚠️ ${report.violations} Logged` : '0 (Clean Integrity)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(report.submittedAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {report.recordingUrl && (
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                              title="Watch Proctored Screen Video"
                            >
                              <Play className="w-3 h-3 fill-current" /> Watch Video
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-bold transition-colors cursor-pointer"
                          >
                            View Report
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id, report.candidateName)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete this record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Candidate Detail Inspection Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#0E1B2D]">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Assessment & Proctoring Audit Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Candidate: <strong>{selectedReport.candidateName}</strong> ({selectedReport.candidateEmpId}) &bull;{' '}
                    {selectedReport.designation}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Score Summary Box */}
                <div
                  className={`p-6 rounded-2xl border flex items-center justify-between ${
                    selectedReport.passed
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl ${
                        selectedReport.passed ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {selectedReport.score}%
                    </div>
                    <div>
                      <p
                        className={`text-base font-black ${
                          selectedReport.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {selectedReport.passed ? 'EVALUATION PASSED (>=60%)' : 'EVALUATION FAILED (<60%)'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Answered {selectedReport.correctAnswers} of {selectedReport.totalQuestions} questions correctly ({selectedReport.pointsEarned} total points).
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Integrity Status</p>
                    <p
                      className={`text-sm font-black mt-0.5 ${
                        selectedReport.violations === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                      }`}
                    >
                      {selectedReport.violations === 0 ? 'Verified Clean (0 Violations)' : `${selectedReport.violations} Violations Logged`}
                    </p>
                  </div>
                </div>

                {/* Screen Recording Video Player Section */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          Proctored Screen Video Recording
                          {selectedReport.recordingUrl && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              Ready for Playback
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Screen feed captured live from candidate's browser during the assessment
                        </p>
                      </div>
                    </div>

                    {selectedReport.recordingUrl && (
                      <a
                        href={
                          selectedReport.recordingUrl.startsWith('http')
                            ? selectedReport.recordingUrl
                            : `http://localhost:5000${selectedReport.recordingUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Video
                      </a>
                    )}
                  </div>

                  {selectedReport.recordingUrl ? (
                    <div className="rounded-xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        src={
                          selectedReport.recordingUrl.startsWith('http')
                            ? selectedReport.recordingUrl
                            : `http://localhost:5000${selectedReport.recordingUrl}`
                        }
                        className="w-full max-h-96 rounded-xl bg-black"
                      />
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-[#0B1524] border border-slate-800 text-center space-y-1">
                      <FileVideo className="w-8 h-8 text-slate-500 mx-auto mb-1 opacity-60" />
                      <p className="text-xs text-slate-300 font-semibold">No Video Recording Available</p>
                      <p className="text-[11px] text-slate-500">
                        This session does not have an attached video recording file.
                      </p>
                    </div>
                  )}
                </div>

                {/* Candidate Answers Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Question-by-Question Review (25 Items)
                  </h4>

                  {(() => {
                    try {
                      const parsed = JSON.parse(selectedReport.answersJson);
                      return parsed.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                            item.isCorrect
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-900 dark:text-white">
                              Q{idx + 1} [{item.category}]: {item.question}
                            </p>
                            <span
                              className={`shrink-0 font-bold px-2 py-0.5 rounded text-[10px] ${
                                item.isCorrect ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100' : 'bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-100'
                              }`}
                            >
                              {item.isCorrect ? '+4 Pts' : '0 Pts'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            Candidate Answer:{' '}
                            <strong className={item.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {item.selectedOption || 'Not answered'}
                            </strong>
                          </p>
                          {!item.isCorrect && (
                            <p className="text-emerald-700 dark:text-emerald-300">
                              Correct Answer: <strong>{item.correctOption}</strong>
                            </p>
                          )}
                          <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                            <strong>Explanation:</strong> {item.explanation}
                          </p>
                        </div>
                      ));
                    } catch {
                      return <p className="text-xs text-slate-400">Detailed question log not available.</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-[#0E1B2D]">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SETUP PHASE (CANDIDATE SETUP OR ADMIN PREVIEW MODE)
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'setup') {
    return (
      <div className="min-h-full py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        {/* Back Link or Admin Switch */}
        <div className="flex items-center justify-between">
          <button
            id="assessment-back-btn"
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to {user?.role === 'EMPLOYEE' ? 'Dashboard' : 'Employees'}
          </button>

          {isAdmin && (
            <button
              onClick={() => setAdminTab('reports')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Switch to Admin Reports View
            </button>
          )}
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#1E3E62] to-[#152238] text-white shadow-2xl border border-slate-700/60">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Technical Evaluation Track
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Desktop Support & Systems Engineering Assessment
              </h1>
              <div className="flex items-center gap-2.5 pt-1 text-sm text-slate-200">
                <span className="w-8 h-8 rounded-full bg-blue-600/40 border border-blue-400 flex items-center justify-center font-bold text-xs text-white">
                  {candidateName[0]}
                </span>
                <div>
                  <p className="font-bold text-white leading-none">{candidateName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {candidateEmpId} &bull; {candidateDesignation}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0">
              <div className="p-4 rounded-2xl bg-[#0B192C]/80 border border-slate-600/60 text-center">
                <p className="text-2xl font-black text-white">{TECHNICAL_QUESTIONS.length}</p>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Questions</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B192C]/80 border border-slate-600/60 text-center">
                <p className="text-2xl font-black text-amber-400">40</p>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Minutes</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B192C]/80 border border-slate-600/60 text-center">
                <p className="text-2xl font-black text-emerald-400">60%</p>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Pass Mark</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume-Based Curriculum Overview */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Syllabus Aligned with Candidate Resume & Experience
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">Windows OS & Setup</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">UEFI/GPT, BSOD repair, SFC /scannow</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">Hardware & Diagnostics</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">RAM beeps, CMOS, SMART, PM cleaning</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">LAN/WAN & Cabling</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">DHCP, DNS, T568B pinout, Tracert</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-200 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white">Printers & Security</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Print spooler, BitLocker, Antivirus, ITAM</p>
            </div>
          </div>
        </div>

        {/* Rules & Requirements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Proctoring Rules */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" /> Mandatory Proctoring Policies
            </h2>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-100 dark:border-slate-800">
                <Maximize2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Strict Fullscreen Mode (Tabs Blocked)</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    The exam runs in pure fullscreen lockdown. All browser tabs and toolbars are hidden. Exiting fullscreen immediately halts the test.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-100 dark:border-slate-800">
                <Monitor className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Active Screen Sharing Required</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Your entire screen must remain shared throughout the assessment. Disconnecting triggers termination.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-100 dark:border-slate-800">
                <Layers className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Tab Switching & Focus Loss Blocked</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Switching browser tabs, minimizing the window, or clicking into other software is logged as an integrity violation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1B2D] border border-slate-100 dark:border-slate-800">
                <Copy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Copy, Paste & Shortcuts Disabled</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Clipboard shortcuts (Ctrl+C, Ctrl+V), right-click inspect, and screenshot tools are strictly disabled.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Screen Share Verification Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-500" /> Step 1: Screen Share Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Click below to grant screen sharing permission. For full verification, choose{' '}
                <span className="font-bold text-slate-700 dark:text-slate-200">"Entire Screen"</span> in the browser prompt.
              </p>

              {/* Status Box */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  proctoringStatus === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                    : proctoringStatus === 'denied'
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700'
                    : 'bg-slate-50 dark:bg-[#0E1B2D] border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {proctoringStatus === 'active' ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  ) : proctoringStatus === 'denied' ? (
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                      <Monitor className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {proctoringStatus === 'active'
                        ? 'Screen Sharing Active & Verified'
                        : proctoringStatus === 'denied'
                        ? 'Permission Denied — Retry Required'
                        : proctoringStatus === 'requesting'
                        ? 'Waiting for browser prompt...'
                        : 'Screen Share Not Connected'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {proctoringStatus === 'active'
                        ? 'Live video stream ready for secure proctoring'
                        : 'Grant screen share access to unlock test'}
                    </p>
                  </div>
                </div>

                {proctoringStatus === 'active' && (
                  <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-36 h-20 rounded-xl object-cover bg-black border border-emerald-500/50 shadow-md"
                    />
                    <div className="text-xs space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Stream OK
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Ready to enter lockdown mode.</p>
                    </div>
                  </div>
                )}
              </div>

              {proctoringStatus === 'active' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-[11px] text-blue-700 dark:text-blue-300">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Browser Hint:</strong> When Chrome displays <em>"sharing your screen"</em> at the bottom, click <strong>"Hide"</strong> so it does not block your view.
                  </span>
                </div>
              )}
              {activeSessionToResume && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-left space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Active Session Recovered (Page Reload Detected)</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Your answers were saved. You were at{' '}
                    <strong className="text-slate-900 dark:text-white">Question {activeSessionToResume.currentQ + 1} of {TECHNICAL_QUESTIONS.length}</strong> with{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {activeSessionToResume.answers.filter((a) => a !== null).length} answered
                    </strong>{' '}
                    and <strong className="text-blue-600 dark:text-blue-400">{formatTime(activeSessionToResume.timeLeft)}</strong> remaining.
                  </p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                    ⚠️ Page reload recorded: Violation #{activeSessionToResume.violations} of {MAX_VIOLATIONS}.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {proctoringStatus !== 'active' ? (
                <button
                  id="share-screen-btn"
                  onClick={requestScreenShare}
                  disabled={proctoringStatus === 'requesting'}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Monitor className="w-4 h-4" />
                  {proctoringStatus === 'requesting' ? 'Requesting Screen Permission...' : 'Share My Screen to Unlock'}
                </button>
              ) : activeSessionToResume ? (
                <button
                  id="start-assessment-btn"
                  onClick={startAssessment}
                  className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-base shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer animate-pulse-subtle"
                >
                  <Lock className="w-5 h-5" /> Resume Assessment (Question #{activeSessionToResume.currentQ + 1})
                </button>
              ) : (
                <button
                  id="start-assessment-btn"
                  onClick={startAssessment}
                  className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer animate-pulse-subtle"
                >
                  <Lock className="w-5 h-5" /> Launch Secure Fullscreen Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // IN-PROGRESS PHASE (Strict Fullscreen Lockdown Exam Arena)
  // ══════════════════════════════════════════════════════════════════════════════
  if (phase === 'in-progress') {
    const q = TECHNICAL_QUESTIONS[currentQ];
    const answeredCount = answers.filter((a) => a !== null).length;
    const pctComplete = Math.round(((currentQ + 1) / TECHNICAL_QUESTIONS.length) * 100);
    const isLowTime = timeLeft <= 300; // < 5 mins

    return (
      <div
        className="fixed inset-0 z-50 bg-[#0B192C] text-slate-100 flex flex-col select-none overflow-hidden"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Anti-Cheat Background Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035] overflow-hidden select-none flex flex-wrap gap-12 p-8 z-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="text-xs font-mono font-bold tracking-widest text-white rotate-[-25deg] whitespace-nowrap">
              {candidateName} &bull; {candidateEmpId} &bull; PROCTORED SESSION
            </div>
          ))}
        </div>

        {/* ── HIGH PRIORITY SECURITY ALERT VIOLATION MODAL (z-[120]) ─────────── */}
        {violationAlertModal && (
          <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#0E1B2D] border-2 border-rose-500 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border-2 border-rose-500/50 shadow-lg shadow-rose-500/25 animate-pulse">
                <ShieldAlert className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600 text-rose-300 text-xs font-black uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Warning #{violations} of {MAX_VIOLATIONS} Recorded
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Proctoring Alert: Tab Switch / Focus Lost
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800 text-left space-y-2">
                <p className="text-xs text-rose-200 font-semibold leading-relaxed">
                  {violationAlertModal}
                </p>
                <div className="text-[11px] text-slate-300 pt-2 border-t border-rose-900/60 space-y-1">
                  <p>&bull; Navigating away, switching tabs, or clicking outside this assessment is strictly logged.</p>
                  <p>
                    &bull; Warning limit:{' '}
                    <strong
                      className={
                        violations >= MAX_VIOLATIONS ? 'text-rose-400 font-black' : 'text-amber-400 font-bold'
                      }
                    >
                      {violations >= MAX_VIOLATIONS
                        ? 'DISQUALIFIED — Maximum violations reached'
                        : `${MAX_VIOLATIONS - violations} warning(s) remaining before automatic failure.`}
                    </strong>
                  </p>
                </div>
              </div>

              {violations < MAX_VIOLATIONS ? (
                <button
                  id="acknowledge-violation-btn"
                  onClick={() => {
                    setViolationAlertModal(null);
                    requestBrowserFullscreen();
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5" /> I Acknowledge — Return to Fullscreen & Resume
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600 text-xs text-rose-200 font-bold animate-pulse text-center">
                  Maximum violations exceeded. Assessment terminated and report is being saved...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MANDATORY FULLSCREEN LOCKDOWN OVERLAY (BLOCKS TABS WHEN NO VIOLATION MODAL) ───────────── */}
        {!isFullscreen && !violationAlertModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg p-8 rounded-3xl bg-[#0E1B2D] border-2 border-amber-500 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                  Fullscreen Lockdown Required
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Browser tabs, bookmarks, and desktop toolbars must be hidden to ensure examination integrity and prevent tab switching.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070F1B] border border-slate-700 text-left text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Proctoring Alert:</span>
                </div>
                <p>&bull; Fullscreen hides all browser tabs so you cannot switch away.</p>
                <p>&bull; Exiting fullscreen or pressing Esc is tracked as an integrity violation.</p>
                <p>
                  &bull; Violations recorded:{' '}
                  <strong className="text-rose-400">
                    {violations} of {MAX_VIOLATIONS}
                  </strong>
                </p>
              </div>

              <button
                id="enter-fullscreen-btn"
                onClick={requestBrowserFullscreen}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Maximize2 className="w-5 h-5" /> Click to Enter Fullscreen & Hide Tabs
              </button>
            </div>
          </div>
        )}

        {/* ── TOP SECURE PROCTORING HUD ────────────────────────────────────── */}
        <header className="bg-[#070F1B] border-b border-[#1E3E62] px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-md shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-emerald-400 uppercase">
                LOCKDOWN MODE ACTIVE
              </span>
              <span className="hidden sm:inline text-slate-600">|</span>
              <span className="hidden sm:inline text-xs text-slate-300 font-medium">
                Candidate: <strong className="text-white">{candidateName}</strong> ({candidateEmpId})
              </span>
              {isRecording && (
                <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  REC Live Screen
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={requestBrowserFullscreen}
              title="Ensure Fullscreen Mode"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Fullscreen</span>
            </button>

            {/* Violation Counter */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                violations > 0
                  ? 'bg-rose-500/20 border border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-800 border border-slate-700 text-slate-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                Violations: <strong className="text-white">{violations}</strong> / {MAX_VIOLATIONS}
              </span>
            </div>

            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm sm:text-base font-black ${
                isLowTime
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
                  : 'bg-slate-800 border border-slate-700 text-amber-400'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>

        {/* ── MAIN EXAM ARENA ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center relative z-10">
          <div className="w-full max-w-3xl space-y-5">
            {/* Progress and Question Counter */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="text-white">
                Question <strong className="text-blue-400">{currentQ + 1}</strong> of {TECHNICAL_QUESTIONS.length}{' '}
                <span className="text-slate-500">[{q.category}]</span>
              </span>
              <span>
                {answeredCount} of {TECHNICAL_QUESTIONS.length} Answered
              </span>
            </div>

            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${pctComplete}%` }}
              />
            </div>

            {/* Question Quick Palette (1 to 25) */}
            <div className="flex flex-wrap gap-1.5 justify-center p-3 rounded-2xl bg-[#152238]/80 border border-[#1E3E62]">
              {TECHNICAL_QUESTIONS.map((_, i) => {
                const isCurrent = i === currentQ;
                const isAnswered = answers[i] !== null;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentQ(i)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md scale-105'
                        : isAnswered
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-[#0E1B2D] text-slate-400 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Question Content Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#152238] border border-[#1E3E62] shadow-2xl space-y-6">
              <div className="flex items-start gap-3">
                <span className="shrink-0 px-2.5 py-1 rounded-xl bg-blue-600/20 border border-blue-400/40 text-blue-300 text-xs font-black">
                  Q{currentQ + 1}
                </span>
                <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">{q.text}</p>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-1">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[currentQ] === oi;
                  const letter = String.fromCharCode(65 + oi);
                  return (
                    <button
                      key={oi}
                      id={`opt-${currentQ}-${oi}`}
                      onClick={() => {
                        const updated = [...answers];
                        updated[currentQ] = oi;
                        setAnswers(updated);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                          : 'bg-[#0E1B2D] border-[#1E3E62] text-slate-200 hover:border-blue-400 hover:bg-[#1E3E62]/40'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-white text-blue-700 border-white'
                            : 'border-slate-600 text-slate-400'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm font-medium leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="px-5 py-3 rounded-2xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-3">
                {currentQ < TECHNICAL_QUESTIONS.length - 1 ? (
                  <button
                    onClick={() => setCurrentQ((prev) => Math.min(TECHNICAL_QUESTIONS.length - 1, prev + 1))}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all cursor-pointer"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    id="final-submit-assessment-btn"
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:from-emerald-600 hover:to-teal-700 shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Submit Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── FLOATING SCREEN SHARE PIP MONITOR ─────────────────────────────── */}
        <div className="fixed bottom-4 right-4 z-40 p-2 rounded-2xl bg-[#070F1B]/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md flex flex-col items-center gap-1.5 pointer-events-none">
          <video ref={videoHudRef} autoPlay playsInline muted className="w-36 h-20 rounded-xl object-cover bg-black" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>RECORDING SCREEN</span>
          </div>
        </div>

        {/* ── CONFIRMATION MODAL ───────────────────────────────────────────── */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md p-6 rounded-3xl bg-[#152238] border border-[#1E3E62] shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">Ready to Submit?</h3>
              <p className="text-xs text-slate-300">
                You have answered <strong className="text-white">{answeredCount}</strong> of{' '}
                <strong className="text-white">{TECHNICAL_QUESTIONS.length}</strong> technical questions. Your report will be automatically transmitted to the HR & IT Administrator.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Review Answers
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submittingResult}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:from-emerald-600 hover:to-teal-700 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingResult ? 'Saving...' : 'Yes, Submit Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RESULTS & SCORECARD PHASE
  // ══════════════════════════════════════════════════════════════════════════════
  const displayAnswers = finalAnswers.length > 0 ? finalAnswers : answers;
  const correctCount = displayAnswers.filter((a, i) => a === TECHNICAL_QUESTIONS[i].correctIndex).length;

  return (
    <div className="min-h-full py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Result Card */}
      <div
        className={`p-8 sm:p-10 rounded-3xl border shadow-2xl text-center space-y-6 ${
          passed
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60'
            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-700/60'
        }`}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-xl ${
            completedRecord?.status === 'TERMINATED'
              ? 'bg-rose-600 text-white animate-pulse'
              : passed
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          {completedRecord?.status === 'TERMINATED' ? (
            <ShieldAlert className="w-10 h-10" />
          ) : passed ? (
            <Trophy className="w-10 h-10" />
          ) : (
            <XCircle className="w-10 h-10" />
          )}
        </div>

        <div className="space-y-1">
          <h1
            className={`text-3xl sm:text-4xl font-black tracking-tight ${
              completedRecord?.status === 'TERMINATED'
                ? 'text-rose-700 dark:text-rose-400'
                : passed
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {completedRecord?.status === 'TERMINATED'
              ? 'Assessment Disqualified & Terminated'
              : passed
              ? 'Assessment Passed!'
              : 'Assessment Not Passed'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Candidate: <strong>{candidateName}</strong> ({candidateEmpId}) &bull;{' '}
            {completedRecord?.status === 'TERMINATED'
              ? 'The assessment was terminated due to security violations (tab switching or loss of focus). This result has been submitted to company management.'
              : passed
              ? 'Congratulations! You have satisfied the technical competency standards for Desktop & Systems Support.'
              : 'You did not meet the 60% passing threshold. Please review the solutions below.'}
          </p>
        </div>

        {/* Score Stats */}
        <div className="flex items-center justify-center gap-8 pt-2">
          <div className="text-center">
            <p
              className={`text-5xl font-black ${
                passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {score}%
            </p>
            <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Final Score</p>
          </div>
          <div className="w-px h-14 bg-slate-200 dark:bg-slate-700" />
          <div className="text-center">
            <p className="text-5xl font-black text-slate-700 dark:text-slate-200">
              {correctCount}
              <span className="text-2xl text-slate-400">/{TECHNICAL_QUESTIONS.length}</span>
            </p>
            <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Correct Answers</p>
          </div>
        </div>

        {/* Proctoring Log Summary */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-2">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xl font-bold text-amber-500">{violations}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Violations Logged</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xl font-bold text-blue-500">{correctCount * 4} pts</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Points Earned</p>
          </div>
        </div>
      </div>

      {/* Answer Review Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#152238] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500" /> Question & Answer Explanations (25 Questions)
        </h2>
        <div className="space-y-4">
          {TECHNICAL_QUESTIONS.map((q, i) => {
            const userAns = displayAnswers[i];
            const isCorrect = userAns === q.correctIndex;
            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                  isCorrect
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Q{i + 1} [{q.category}]: {q.text}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">
                      Your answer:{' '}
                      <span
                        className={`font-bold ${
                          isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {userAns !== null ? q.options[userAns] : 'Not answered'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Correct answer: <span className="font-bold">{q.options[q.correctIndex]}</span>
                      </p>
                    )}
                    <p className="text-slate-500 dark:text-slate-400 text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                      <strong>Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attempt Finalized Policy Notice for Employees */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-1">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-500" /> Assessment Attempt Finalized (Single Attempt Policy)
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            You have completed your allocated assessment attempt. This official evaluation report and proctoring audit have been logged with company management and cannot be retaken.
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex gap-4">
        <button
          onClick={handleGoBack}
          className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
        >
          Return to Dashboard
        </button>

        {isAdmin && (
          <button
            onClick={() => {
              try {
                localStorage.removeItem(`proctor_session_${candidateEmpId}`);
              } catch {}
              setActiveSessionToResume(null);
              setCompletedRecord(null);
              setAnswers(Array(TECHNICAL_QUESTIONS.length).fill(null));
              setCurrentQ(0);
              setTimeLeft(ASSESSMENT_DURATION_SECONDS);
              setViolations(0);
              setProctoringStatus('idle');
              setPhase('setup');
              screenStreamRef.current = null;
            }}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Admin Reset & Retake
          </button>
        )}
      </div>
    </div>
  );
};
