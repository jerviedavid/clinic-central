import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaFloppyDisk, FaUser, FaUserDoctor, FaIdCard, FaStethoscope, FaClock, FaQuoteLeft, FaGraduationCap, FaBriefcase, FaMoneyBillWave } from 'react-icons/fa6'
import { Camera, Upload, Image as ImageIcon, X } from 'lucide-react'
import api from '../../utils/api'
import { toast } from 'react-hot-toast'
import { takePhoto, pickImage, hasNativeCamera } from '../../utils/camera'

export default function ProfileModal({ isOpen, onClose, onUpdate }) {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        specialization: '',
        licenseNumber: '',
        bio: '',
        consultationFee: '',
        clinicHours: '',
        education: '',
        experience: '',
        profileImage: null
    })
    
    // Refs for profile image inputs
    const profileImageInputRef = useRef(null)
    const profileCameraInputRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            fetchProfile()
        }
    }, [isOpen])

    const fetchProfile = async () => {
        setIsLoading(true)
        try {
            const response = await api.get('/auth/profile')
            const { user, doctorProfile } = response.data
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                specialization: doctorProfile?.specialization || '',
                licenseNumber: doctorProfile?.licenseNumber || '',
                bio: doctorProfile?.bio || '',
                consultationFee: doctorProfile?.consultationFee || '',
                clinicHours: doctorProfile?.clinicHours || '',
                education: doctorProfile?.education || '',
                experience: doctorProfile?.experience || '',
                profileImage: user.profileImage || null
            })
        } catch (error) {
            toast.error('Failed to load profile')
            console.error('Profile fetch error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await api.post('/auth/profile', formData)
            toast.success('Profile updated successfully!')
            if (onUpdate) onUpdate()
            onClose()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    // Handle profile image upload
    const handleProfileImageUpload = async (e) => {
        // Try native gallery picker first (mobile)
        if (hasNativeCamera()) {
            const dataUrl = await pickImage({ quality: 90 })
            if (dataUrl) {
                setFormData({ ...formData, profileImage: dataUrl })
                toast.success('Profile photo added')
                return
            }
        }
        // Web fallback
        const file = e?.target?.files?.[0]
        if (!file) return

        if (file.size > 50 * 1024 * 1024) {
            toast.error('Image should be less than 50MB')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setFormData({ ...formData, profileImage: reader.result })
            toast.success('Profile photo added')
        }
        reader.readAsDataURL(file)
    }

    // Handle camera capture for profile image
    const handleProfileCamera = async (e) => {
        // Try native camera first (mobile)
        if (hasNativeCamera()) {
            const dataUrl = await takePhoto({ quality: 90 })
            if (dataUrl) {
                setFormData({ ...formData, profileImage: dataUrl })
                toast.success('Photo captured')
                return
            }
        }
        // Web fallback
        const file = e?.target?.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            setFormData({ ...formData, profileImage: reader.result })
            toast.success('Photo captured')
        }
        reader.readAsDataURL(file)
    }

    // Remove profile image
    const removeProfileImage = () => {
        setFormData({ ...formData, profileImage: null })
        toast.success('Profile photo removed')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative my-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold flex items-center space-x-3">
                        <FaUserDoctor className="text-blue-400" />
                        <span>Professional Profile</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <FaXmark className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 animate-pulse">Loading your profile...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Photo Section */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Profile Photo</h3>
                            <div className="flex items-start gap-6">
                                {/* Image Preview */}
                                <div className="relative">
                                    {formData.profileImage ? (
                                        <div className="relative group">
                                            <img 
                                                src={formData.profileImage} 
                                                alt="Doctor profile" 
                                                className="w-32 h-32 rounded-xl object-cover border-2 border-blue-500/30"
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
                                    <p className="text-xs text-slate-400">Upload a professional photo or capture using camera</p>
                                    <div className="flex gap-3">
                                        <input
                                            ref={profileImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfileImageUpload}
                                            className="hidden"
                                        />
                                        <input
                                            ref={profileCameraInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            onChange={handleProfileCamera}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => profileImageInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors border border-blue-500/20"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span className="text-sm font-medium">Upload Photo</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => profileCameraInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors border border-purple-500/20"
                                        >
                                            <Camera className="w-4 h-4" />
                                            <span className="text-sm font-medium">Capture Photo</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500">Maximum 50MB. Supports JPG, PNG, GIF formats.</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Section 1: Basic Account Information */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                                    <div className="relative">
                                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 outline-none focus:border-blue-400 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Professional Details */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Medical Credentials</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Specialization</label>
                                    <div className="relative">
                                        <FaStethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                        <input
                                            type="text"
                                            placeholder="e.g. General Physician, Dentist"
                                            value={formData.specialization}
                                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">License Number</label>
                                    <div className="relative">
                                        <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                        <input
                                            type="text"
                                            placeholder="e.g. PRC-1234567"
                                            value={formData.licenseNumber}
                                            onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Clinic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Clinic Hours</label>
                                <div className="relative">
                                    <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Mon-Fri 9AM-5PM"
                                        value={formData.clinicHours}
                                        onChange={e => setFormData({ ...formData, clinicHours: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-blue-400 transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Consultation Fee</label>
                                <div className="relative">
                                    <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.consultationFee}
                                        onChange={e => setFormData({ ...formData, consultationFee: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-blue-400 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Background */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Professional Background</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Education</label>
                                        <div className="relative">
                                            <FaGraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                            <input
                                                type="text"
                                                placeholder="e.g. MD from University X"
                                                value={formData.education}
                                                onChange={e => setFormData({ ...formData, education: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-blue-400 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Experience (Years)</label>
                                        <div className="relative">
                                            <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                            <input
                                                type="number"
                                                placeholder="e.g. 10"
                                                value={formData.experience}
                                                onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-blue-400 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Professional Bio</label>
                                    <div className="relative">
                                        <FaQuoteLeft className="absolute left-3 top-3 text-slate-500 text-xs" />
                                        <textarea
                                            rows="3"
                                            placeholder="Tell patients about yourself..."
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-blue-400 transition-colors resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-4 sticky bottom-0 bg-slate-900 pb-2">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <FaFloppyDisk className="w-5 h-5" />
                                        <span>Save Profile</span>
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all border border-white/10"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
