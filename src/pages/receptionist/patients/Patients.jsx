import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LogoutButton from '../../../components/LogoutButton'
import {
    Users,
    Plus,
    Edit,
    Search,
    User,
    Phone,
    Mail,
    MapPin,
    Heart,
    AlertCircle,
    Stethoscope,
    ArrowLeft,
    Calendar,
    X,
    UserPlus,
    History,
    FileText,
    Pill,
    DollarSign,
    Clock,
    CheckCircle2,
    CalendarDays,
    Camera,
    Upload,
    Image as ImageIcon,
    Paperclip,
    Trash2,
    Download,
    File
} from 'lucide-react'
import api from '../../../utils/api'
import { takePhoto, pickImage, hasNativeCamera } from '../../../utils/camera'
import SpecialtyFields from '../../../components/SpecialtyFields'

export default function Patients() {
    const { currentUser } = useAuth()
    const [patients, setPatients] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [historyData, setHistoryData] = useState(null)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('appointments')
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [previewAttachment, setPreviewAttachment] = useState(null)
    const [clinicSpecialization, setClinicSpecialization] = useState('')
    
    // New refs for file inputs
    const fileInputRef = useRef(null)
    const cameraInputRef = useRef(null)
    const attachmentInputRef = useRef(null)
    const attachmentCameraInputRef = useRef(null)

    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        civilStatus: '',
        nationalId: '',
        phone: '',
        email: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
        insuranceProvider: '',
        insurancePolicyNumber: '',
        hmoAccount: '',
        referredBy: '',
        firstVisitDate: '',
        preferredCommunication: '',
        bloodType: '',
        allergies: '',
        currentMedications: '',
        medicalHistory: '',
        surgicalHistory: '',
        familyHistory: '',
        smokingAlcoholUse: '',
        height: '',
        weight: '',
        vaccinationStatus: '',
        profileImage: null,
        attachments: [],
        specialtyData: {}
    })

    useEffect(() => {
        fetchPatients()
        fetchClinicSpecialty()
    }, [])

    const fetchClinicSpecialty = async () => {
        try {
            const response = await api.get('/patients/clinic-specialty')
            const specs = response.data.specializations || []
            setClinicSpecialization(specs.join(', '))
        } catch (error) {
            console.error('Error fetching clinic specialty:', error)
        }
    }

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients')
            setPatients(response.data)
        } catch (error) {
            console.error('Error fetching patients:', error)
            toast.error('Failed to load patients')
        }
    }

    const handleOpenModal = (patient = null) => {
        if (patient) {
            setSelectedPatient(patient)
            setFormData({
                fullName: patient.fullName || '',
                dateOfBirth: patient.dateOfBirth || '',
                gender: patient.gender || '',
                civilStatus: patient.civilStatus || '',
                nationalId: patient.nationalId || '',
                phone: patient.phone || '',
                email: patient.email || '',
                address: patient.address || '',
                emergencyContactName: patient.emergencyContactName || '',
                emergencyContactPhone: patient.emergencyContactPhone || '',
                emergencyContactRelationship: patient.emergencyContactRelationship || '',
                insuranceProvider: patient.insuranceProvider || '',
                insurancePolicyNumber: patient.insurancePolicyNumber || '',
                hmoAccount: patient.hmoAccount || '',
                referredBy: patient.referredBy || '',
                firstVisitDate: patient.firstVisitDate || '',
                preferredCommunication: patient.preferredCommunication || '',
                bloodType: patient.bloodType || '',
                allergies: patient.allergies || '',
                currentMedications: patient.currentMedications || '',
                medicalHistory: patient.medicalHistory || '',
                surgicalHistory: patient.surgicalHistory || '',
                familyHistory: patient.familyHistory || '',
                smokingAlcoholUse: patient.smokingAlcoholUse || '',
                height: patient.height || '',
                weight: patient.weight || '',
                vaccinationStatus: patient.vaccinationStatus || '',
                profileImage: patient.profileImage || null,
                attachments: patient.attachments || [],
                specialtyData: patient.specialtyData || {}
            })
        } else {
            setSelectedPatient(null)
            setFormData({
                fullName: '',
                dateOfBirth: '',
                gender: '',
                civilStatus: '',
                nationalId: '',
                phone: '',
                email: '',
                address: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                emergencyContactRelationship: '',
                insuranceProvider: '',
                insurancePolicyNumber: '',
                hmoAccount: '',
                referredBy: '',
                firstVisitDate: '',
                preferredCommunication: '',
                bloodType: '',
                allergies: '',
                currentMedications: '',
                medicalHistory: '',
                surgicalHistory: '',
                familyHistory: '',
                smokingAlcoholUse: '',
                height: '',
                weight: '',
                vaccinationStatus: '',
                profileImage: null,
                attachments: [],
                specialtyData: {}
            })
        }
        setShowModal(true)
    }

    // Handle profile image upload / camera capture
    const handleImageUpload = async (e) => {
        // Try native gallery/camera first (mobile)
        if (hasNativeCamera()) {
            const dataUrl = await pickImage({ quality: 90 })
            if (dataUrl) {
                setFormData({ ...formData, profileImage: dataUrl })
                toast.success('Profile image loaded')
                return
            }
        }
        // Web fallback
        const file = e?.target?.files?.[0]
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                toast.error('Image size should be less than 50MB')
                return
            }
            
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData({ ...formData, profileImage: reader.result })
                toast.success('Profile image loaded')
            }
            reader.readAsDataURL(file)
        }
    }

    // Handle attachments upload (from file or camera)
    const handleAttachmentUpload = (e) => {
        const files = Array.from(e.target.files)
        
        // Check total size (limit to 10MB per file)
        const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024)
        if (oversizedFiles.length > 0) {
            toast.error('Each file should be less than 10MB')
            return
        }
        
        const filePromises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    resolve({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: reader.result,
                        uploadedAt: new Date().toISOString()
                    })
                }
                reader.readAsDataURL(file)
            })
        })
        
        Promise.all(filePromises).then(newAttachments => {
            setFormData({ 
                ...formData, 
                attachments: [...formData.attachments, ...newAttachments] 
            })
            toast.success(`${newAttachments.length} file(s) added`)
        })
    }

    // Handle camera capture for attachments (documents/images)
    const handleAttachmentCamera = async (e) => {
        // Try native camera first (mobile)
        if (hasNativeCamera()) {
            const dataUrl = await takePhoto({ quality: 90 })
            if (dataUrl) {
                const newAttachment = {
                    name: `Camera_Capture_${new Date().getTime()}.jpg`,
                    type: 'image/jpeg',
                    size: Math.round(dataUrl.length * 0.75),
                    data: dataUrl,
                    uploadedAt: new Date().toISOString()
                }
                setFormData({ 
                    ...formData, 
                    attachments: [...formData.attachments, newAttachment] 
                })
                toast.success('Document captured')
                return
            }
        }
        // Web fallback
        const files = Array.from(e?.target?.files || [])
        
        const filePromises = files.map((file, index) => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    resolve({
                        name: `Camera_Capture_${new Date().getTime()}_${index + 1}.jpg`,
                        type: file.type,
                        size: file.size,
                        data: reader.result,
                        uploadedAt: new Date().toISOString()
                    })
                }
                reader.readAsDataURL(file)
            })
        })
        
        Promise.all(filePromises).then(newAttachments => {
            setFormData({ 
                ...formData, 
                attachments: [...formData.attachments, ...newAttachments] 
            })
            toast.success(`${newAttachments.length} document(s) captured`)
        })
    }

    // Remove attachment
    const removeAttachment = (index) => {
        const updated = formData.attachments.filter((_, i) => i !== index)
        setFormData({ ...formData, attachments: updated })
        toast.success('Attachment removed')
    }

    // Remove profile image
    const removeProfileImage = () => {
        setFormData({ ...formData, profileImage: null })
        toast.success('Profile image removed')
    }

    // View attachment in modal
    const viewAttachment = (attachment) => {
        setPreviewAttachment(attachment)
        setShowPreviewModal(true)
    }

    // Download attachment
    const downloadAttachment = (attachment) => {
        try {
            const link = document.createElement('a')
            link.href = attachment.data
            link.download = attachment.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success('Download started')
        } catch (error) {
            console.error('Error downloading file:', error)
            toast.error('Failed to download file')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (selectedPatient) {
                await api.patch(`/patients/${selectedPatient.id}`, formData)
                toast.success('Patient updated successfully')
            } else {
                await api.post('/patients', formData)
                toast.success('Patient registered successfully')
            }
            setShowModal(false)
            fetchPatients()
        } catch (error) {
            console.error('Error saving patient:', error)
            toast.error(error.response?.data?.message || 'Error saving patient')
        } finally {
            setLoading(false)
        }
    }

    const handleViewHistory = async (patient) => {
        setSelectedPatient(patient)
        setHistoryLoading(true)
        setShowHistoryModal(true)
        setActiveTab('appointments')
        try {
            const response = await api.get(`/patients/${patient.id}/history`)
            setHistoryData(response.data)
        } catch (error) {
            console.error('Error fetching history:', error)
            toast.error('Failed to load patient history')
            setShowHistoryModal(false)
        } finally {
            setHistoryLoading(false)
        }
    }

    const filteredPatients = patients.filter(p =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link
                            to="/receptionist"
                            className="flex items-center space-x-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Patient Management</h1>
                            <p className="text-sm text-slate-400">Total Patients: {patients.length}</p>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Register New Patient</span>
                    </button>
                </div>

                {/* Patients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-white/5 border border-white/10 rounded-2xl">
                            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">No patients found</p>
                        </div>
                    ) : (
                        filteredPatients.map((patient) => (
                            <div key={patient.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        {patient.profileImage ? (
                                            <img 
                                                src={patient.profileImage} 
                                                alt={patient.fullName}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/30"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-xl">
                                                {patient.fullName.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-lg">{patient.fullName}</h3>
                                            <p className="text-xs text-slate-400">Patient ID: #{patient.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleOpenModal(patient)}
                                            className="p-2 bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors"
                                            title="Edit Profile"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleViewHistory(patient)}
                                            className="p-2 bg-white/5 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 rounded-lg transition-colors"
                                            title="View History"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center space-x-2 text-slate-300">
                                        <Phone className="w-4 h-4 text-slate-500" />
                                        <span>{patient.phone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-slate-300">
                                        <Mail className="w-4 h-4 text-slate-500" />
                                        <span className="truncate">{patient.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-start space-x-2 text-slate-300">
                                        <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                                        <span className="line-clamp-1">{patient.address || 'No address'}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                                    {patient.bloodType && (
                                        <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                            <Heart className="w-3 h-3" /> {patient.bloodType}
                                        </span>
                                    )}
                                    {patient.allergies && (
                                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold rounded flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Allergies
                                        </span>
                                    )}
                                    {patient.insuranceProvider && (
                                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold rounded flex items-center gap-1">
                                            Insurance
                                        </span>
                                    )}
                                    {patient.dateOfBirth && (
                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {(() => {
                                                const today = new Date();
                                                const birth = new Date(patient.dateOfBirth);
                                                let age = today.getFullYear() - birth.getFullYear();
                                                const m = today.getMonth() - birth.getMonth();
                                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                                return `${age}y`;
                                            })()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Register/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-slate-900 p-6 border-b border-white/10 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {selectedPatient ? <Edit className="w-5 h-5 text-cyan-400" /> : <UserPlus className="w-5 h-5 text-orange-400" />}
                                {selectedPatient ? 'Edit Patient Record' : 'Register New Patient'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Profile Image Section */}
                            <section>
                                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">Profile Photo</h3>
                                <div className="flex items-start gap-6">
                                    {/* Image Preview */}
                                    <div className="relative">
                                        {formData.profileImage ? (
                                            <div className="relative group">
                                                <img 
                                                    src={formData.profileImage} 
                                                    alt="Patient profile" 
                                                    className="w-32 h-32 rounded-xl object-cover border-2 border-purple-500/30"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeProfileImage}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove Image"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-slate-600" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Upload Controls */}
                                    <div className="flex-1 space-y-3">
                                        <p className="text-xs text-slate-400">Upload a profile photo or capture using camera</p>
                                        <div className="flex gap-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <input
                                                ref={cameraInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors border border-purple-500/30"
                                            >
                                                <Upload className="w-4 h-4" />
                                                <span className="text-sm font-medium">Upload Image</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => cameraInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
                                            >
                                                <Camera className="w-4 h-4" />
                                                <span className="text-sm font-medium">Take Photo</span>
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500">Maximum file size: 50MB. Supported formats: JPG, PNG, WEBP</p>
                                    </div>
                                </div>
                            </section>

                            {/* Personal Information */}
                            <section>
                                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="Enter full legal name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Sex / Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white [&>option]:text-black"
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Age</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.dateOfBirth ? (() => {
                                                const today = new Date();
                                                const birth = new Date(formData.dateOfBirth);
                                                let age = today.getFullYear() - birth.getFullYear();
                                                const m = today.getMonth() - birth.getMonth();
                                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                                return age >= 0 ? `${age} years old` : '';
                                            })() : 'Auto-calculated'}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Civil Status</label>
                                        <select
                                            value={formData.civilStatus}
                                            onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white [&>option]:text-black"
                                        >
                                            <option value="">Select status</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Widowed">Widowed</option>
                                            <option value="Separated">Separated</option>
                                            <option value="Divorced">Divorced</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">National ID / Passport</label>
                                        <input
                                            type="text"
                                            value={formData.nationalId}
                                            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="ID or Passport number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="+1234567890"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="patient@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs text-slate-400 mb-1">Residential Address</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                        placeholder="Street, City, Province, Zip"
                                    />
                                </div>
                            </section>

                            {/* Emergency Contact */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Emergency Contact</h3>
                                    <div className="h-px flex-1 bg-orange-400/20"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Contact Name</label>
                                        <input
                                            type="text"
                                            value={formData.emergencyContactName}
                                            onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="Next of kin or close relative"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.emergencyContactPhone}
                                            onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="Emergency phone number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Relationship</label>
                                        <select
                                            value={formData.emergencyContactRelationship}
                                            onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white [&>option]:text-black"
                                        >
                                            <option value="">Select relationship</option>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Parent">Parent</option>
                                            <option value="Sibling">Sibling</option>
                                            <option value="Child">Child</option>
                                            <option value="Friend">Friend</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Administrative Information */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider">Administrative Information</h3>
                                    <div className="h-px flex-1 bg-green-400/20"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Insurance Provider</label>
                                        <input
                                            type="text"
                                            value={formData.insuranceProvider}
                                            onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="e.g., PhilHealth, Maxicare"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Insurance Policy Number</label>
                                        <input
                                            type="text"
                                            value={formData.insurancePolicyNumber}
                                            onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="Policy number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">HMO / Corporate Account</label>
                                        <input
                                            type="text"
                                            value={formData.hmoAccount}
                                            onChange={(e) => setFormData({ ...formData, hmoAccount: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="HMO or corporate account name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Referred By</label>
                                        <input
                                            type="text"
                                            value={formData.referredBy}
                                            onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="Referring doctor or source"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">First Visit Date</label>
                                        <input
                                            type="date"
                                            value={formData.firstVisitDate}
                                            onChange={(e) => setFormData({ ...formData, firstVisitDate: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Preferred Communication</label>
                                        <select
                                            value={formData.preferredCommunication}
                                            onChange={(e) => setFormData({ ...formData, preferredCommunication: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white [&>option]:text-black"
                                        >
                                            <option value="">Select method</option>
                                            <option value="SMS">SMS</option>
                                            <option value="Email">Email</option>
                                            <option value="WhatsApp">WhatsApp</option>
                                            <option value="Phone Call">Phone Call</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Health & Medical */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Health & Medical History</h3>
                                    <div className="h-px flex-1 bg-red-400/20"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Blood Type</label>
                                        <select
                                            value={formData.bloodType}
                                            onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white [&>option]:text-black"
                                        >
                                            <option value="">Unknown</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs text-slate-400 mb-1">Allergies (Drug / Food / Environmental)</label>
                                        <input
                                            type="text"
                                            value={formData.allergies}
                                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="e.g., Penicillin, Peanuts, Pollen, Latex"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.height}
                                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="e.g., 170"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="e.g., 65"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">BMI</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.height && formData.weight ? (() => {
                                                const h = parseFloat(formData.height) / 100;
                                                const w = parseFloat(formData.weight);
                                                if (h > 0 && w > 0) {
                                                    const bmi = (w / (h * h)).toFixed(1);
                                                    let category = '';
                                                    if (bmi < 18.5) category = 'Underweight';
                                                    else if (bmi < 25) category = 'Normal';
                                                    else if (bmi < 30) category = 'Overweight';
                                                    else category = 'Obese';
                                                    return `${bmi} (${category})`;
                                                }
                                                return '';
                                            })() : 'Auto-computed'}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Current Medications</label>
                                        <textarea
                                            rows="2"
                                            value={formData.currentMedications}
                                            onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors resize-none"
                                            placeholder="List current medications, dosages..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Smoking / Alcohol Use</label>
                                        <select
                                            value={formData.smokingAlcoholUse}
                                            onChange={(e) => setFormData({ ...formData, smokingAlcoholUse: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors text-white [&>option]:text-black"
                                        >
                                            <option value="">Select</option>
                                            <option value="None">None</option>
                                            <option value="Smoker">Smoker</option>
                                            <option value="Occasional Drinker">Occasional Drinker</option>
                                            <option value="Regular Drinker">Regular Drinker</option>
                                            <option value="Smoker & Drinker">Smoker & Drinker</option>
                                            <option value="Former Smoker">Former Smoker</option>
                                            <option value="Former Drinker">Former Drinker</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs text-slate-400 mb-1">Past Medical History</label>
                                    <textarea
                                        rows="2"
                                        value={formData.medicalHistory}
                                        onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors resize-none"
                                        placeholder="List important past medical events or chronic conditions..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Surgical History</label>
                                        <textarea
                                            rows="2"
                                            value={formData.surgicalHistory}
                                            onChange={(e) => setFormData({ ...formData, surgicalHistory: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors resize-none"
                                            placeholder="Previous surgeries and dates..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Family History</label>
                                        <textarea
                                            rows="2"
                                            value={formData.familyHistory}
                                            onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors resize-none"
                                            placeholder="Family medical conditions (diabetes, heart disease, etc.)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Vaccination Status</label>
                                    <input
                                        type="text"
                                        value={formData.vaccinationStatus}
                                        onChange={(e) => setFormData({ ...formData, vaccinationStatus: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                        placeholder="e.g., COVID-19 fully vaccinated, Flu shot 2025, etc."
                                    />
                                </div>
                            </section>

                            {/* Specialty-Specific Dynamic Fields */}
                            <SpecialtyFields
                                specialization={clinicSpecialization}
                                specialtyData={formData.specialtyData}
                                onChange={(newSpecialtyData) => setFormData({ ...formData, specialtyData: newSpecialtyData })}
                                manualOverride={true}
                            />

                            {/* Attachments Section */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Attachments & Documents</h3>
                                        <div className="h-px flex-1 bg-blue-400/20"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => attachmentInputRef.current?.click()}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm border border-blue-500/30"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>Upload Files</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => attachmentCameraInputRef.current?.click()}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors text-sm border border-cyan-500/30"
                                        >
                                            <Camera className="w-4 h-4" />
                                            <span>Capture Document</span>
                                        </button>
                                    </div>
                                    <input
                                        ref={attachmentInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleAttachmentUpload}
                                        className="hidden"
                                    />
                                    <input
                                        ref={attachmentCameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        multiple
                                        onChange={handleAttachmentCamera}
                                        className="hidden"
                                    />
                                </div>
                                
                                {formData.attachments.length === 0 ? (
                                    <div className="text-center py-8 bg-white/5 border border-dashed border-white/10 rounded-xl">
                                        <File className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No attachments added yet</p>
                                        <p className="text-xs text-slate-600 mt-1">Medical reports, test results, X-rays, etc.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {formData.attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0">
                                                        <File className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => viewAttachment(file)}
                                                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                                        title="View"
                                                    >
                                                        <ImageIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadAttachment(file)}
                                                        className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(index)}
                                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-500 mt-2">Maximum 10MB per file. Upload files or capture documents using camera.</p>
                            </section>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : (selectedPatient ? 'Update Record' : 'Complete Registration')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                    <History className="w-6 h-6 text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedPatient?.fullName}'s History</h2>
                                    <p className="text-sm text-slate-400">Complete record of appointments, prescriptions, and billing</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 bg-slate-900/50">
                            {[
                                { id: 'appointments', label: 'Appointments', icon: CalendarDays },
                                { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
                                { id: 'billing', label: 'Billing & Invoices', icon: DollarSign }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative ${activeTab === tab.id ? 'text-cyan-400 bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/30">
                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                    <div className="w-12 h-12 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                                    <p className="text-slate-400">Loading history details...</p>
                                </div>
                            ) : !historyData ? (
                                <div className="text-center py-20 text-slate-500">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>Could not load history data</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {activeTab === 'appointments' && (
                                        <div className="space-y-4">
                                            {historyData.appointments.length === 0 ? (
                                                <EmptyHistory message="No appointment records found" />
                                            ) : (
                                                historyData.appointments.map(apt => (
                                                    <div key={apt.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="font-bold text-white flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-cyan-400" />
                                                                    {new Date(apt.appointmentDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                                                </h4>
                                                                <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                                                    <Clock className="w-3 h-3" /> {apt.appointmentTime} — Dr. {apt.doctorName}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${apt.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                                                    apt.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                                                }`}>
                                                                {apt.status}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-black/20 p-3 rounded-lg border border-white/5">
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Symptoms:</p>
                                                                <p className="text-slate-300 italic">{apt.symptoms || 'None recorded'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-500 mb-1">Vital Signs:</p>
                                                                {apt.vitalSigns ? (
                                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cyan-400 font-mono">
                                                                        <span>BP: {apt.vitalSigns.bloodPressure || '-'}</span>
                                                                        <span>Temp: {apt.vitalSigns.temperature || '-'}</span>
                                                                        <span>WT: {apt.vitalSigns.weight || '-'}</span>
                                                                    </div>
                                                                ) : <p className="text-slate-500 text-xs">Not taken</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'prescriptions' && (
                                        <div className="space-y-4">
                                            {historyData.prescriptions.length === 0 ? (
                                                <EmptyHistory message="No prescription history found" />
                                            ) : (
                                                historyData.prescriptions.map(presc => (
                                                    <div key={presc.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h4 className="font-bold text-white flex items-center gap-2">
                                                                    <Pill className="w-4 h-4 text-red-400" />
                                                                    Prescription — {new Date(presc.createdAt).toLocaleDateString()}
                                                                </h4>
                                                                <p className="text-xs text-slate-400 mt-1">Dr. {presc.doctorName}</p>
                                                            </div>
                                                            <div className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20">
                                                                {presc.status || 'Active'}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {presc.medicines.map((med, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-white/5 rounded border border-white/5">
                                                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                                    <span className="font-bold text-slate-200">{med.name}</span>
                                                                    <span className="text-slate-400 text-xs">— {med.dosage} ({med.frequency})</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {presc.instructions && (
                                                            <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/5">
                                                                <p className="text-xs text-slate-500 mb-1">Doctor Instructions:</p>
                                                                <p className="text-sm text-slate-300 italic">"{presc.instructions}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'billing' && (
                                        <div className="space-y-4">
                                            {historyData.invoices.length === 0 ? (
                                                <EmptyHistory message="No billing history found" />
                                            ) : (
                                                historyData.invoices.map(inv => (
                                                    <div key={inv.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400">
                                                                <DollarSign className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-white">Invoice #{inv.invoiceNumber}</h4>
                                                                <p className="text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-white">₱{inv.totalAmount.toLocaleString()}</p>
                                                            <span className={`text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'text-green-400' : 'text-yellow-400'
                                                                }`}>
                                                                {inv.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 bg-slate-900 flex justify-between items-center">
                            <p className="text-xs text-slate-500">Record verification complete. History synced from clinic servers.</p>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                            >
                                Close History
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachment Preview Modal */}
            {showPreviewModal && previewAttachment && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowPreviewModal(false)}>
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <File className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{previewAttachment.name}</h2>
                                    <p className="text-xs text-slate-500">
                                        {(previewAttachment.size / 1024).toFixed(1)} KB • {new Date(previewAttachment.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto p-6">
                            {previewAttachment.type.startsWith('image/') ? (
                                <div className="flex items-center justify-center">
                                    <img 
                                        src={previewAttachment.data} 
                                        alt={previewAttachment.name}
                                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                    />
                                </div>
                            ) : previewAttachment.type === 'application/pdf' ? (
                                <iframe
                                    src={previewAttachment.data}
                                    className="w-full h-[70vh] rounded-lg border border-white/10"
                                    title={previewAttachment.name}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                                    <File className="w-16 h-16 text-slate-600 mb-4" />
                                    <p className="text-slate-400 font-medium mb-2">Preview not available</p>
                                    <p className="text-sm text-slate-500 mb-6">This file type cannot be previewed in the browser</p>
                                    <button
                                        onClick={() => downloadAttachment(previewAttachment)}
                                        className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download File
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                            <button
                                onClick={() => downloadAttachment(previewAttachment)}
                                className="px-6 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/20 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmptyHistory({ message }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
            <FileText className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-slate-500 font-medium">{message}</p>
        </div>
    )
}
