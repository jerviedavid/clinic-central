import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaFloppyDisk, FaUser, FaEnvelope, FaPhone, FaLocationDot, FaBriefcase, FaClock, FaIdBadge } from 'react-icons/fa6'
import { Camera, Upload, Image as ImageIcon, X, UserCircle, Calendar, Users } from 'lucide-react'
import api from '../../utils/api'
import { toast } from 'react-hot-toast'
import { takePhoto, pickImage, hasNativeCamera } from '../../utils/camera'

export default function ProfileModal({ isOpen, onClose, onUpdate }) {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        profileImage: null,
        dateOfBirth: '',
        address: '',
        phone: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        position: '',
        yearsOfExperience: '',
        skills: ''
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
            const { user, receptionistProfile } = response.data
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                profileImage: user.profileImage || null,
                dateOfBirth: receptionistProfile?.dateOfBirth || '',
                address: receptionistProfile?.address || '',
                phone: receptionistProfile?.phone || '',
                emergencyContactName: receptionistProfile?.emergencyContactName || '',
                emergencyContactPhone: receptionistProfile?.emergencyContactPhone || '',
                position: receptionistProfile?.position || '',
                yearsOfExperience: receptionistProfile?.yearsOfExperience || '',
                skills: receptionistProfile?.skills || ''
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
                        <UserCircle className="text-cyan-400" />
                        <span>Professional Profile</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <FaXmark className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
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
                                                alt="Profile" 
                                                className="w-32 h-32 rounded-xl object-cover border-2 border-cyan-500/30"
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
                                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors border border-cyan-500/20"
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
                        
                        {/* Basic Account Information */}
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
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Date of Birth</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                        <input
                                            type="tel"
                                            placeholder="e.g. +639123456789"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Address</label>
                                    <div className="relative">
                                        <FaLocationDot className="absolute left-3 top-3 text-slate-500 text-xs" />
                                        <textarea
                                            rows="2"
                                            placeholder="Full address"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Contact Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="e.g. John Doe"
                                            value={formData.emergencyContactName}
                                            onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Contact Phone</label>
                                    <div className="relative">
                                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                        <input
                                            type="tel"
                                            placeholder="e.g. +639123456789"
                                            value={formData.emergencyContactPhone}
                                            onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Information */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Professional Information</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Position/Title</label>
                                        <div className="relative">
                                            <FaIdBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                            <input
                                                type="text"
                                                placeholder="e.g. Medical Receptionist"
                                                value={formData.position}
                                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Years of Experience</label>
                                        <div className="relative">
                                            <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                                            <input
                                                type="number"
                                                placeholder="e.g. 5"
                                                value={formData.yearsOfExperience}
                                                onChange={e => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Skills & Expertise</label>
                                    <div className="relative">
                                        <FaBriefcase className="absolute left-3 top-3 text-slate-500 text-xs" />
                                        <textarea
                                            rows="3"
                                            placeholder="e.g. Patient scheduling, medical billing, EMR systems, customer service..."
                                            value={formData.skills}
                                            onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-cyan-400 transition-colors resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-4 sticky bottom-0 bg-slate-900 pb-2">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
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
