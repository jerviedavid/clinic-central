import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../components/LogoutButton'
import {
    FaUserShield, FaUsers, FaUserPlus, FaHouseMedical,
    FaEnvelope, FaShieldHalved, FaArrowLeft, FaIdCard,
    FaCircleCheck, FaClock, FaCircleXmark, FaEye, FaEyeSlash, FaCopy,
    FaPenToSquare, FaXmark, FaFloppyDisk, FaTrashCan, FaRotate, FaCircleInfo
} from 'react-icons/fa6'
import api from '../../utils/api'
import { toast } from 'react-hot-toast'

export default function AdminDashboard() {
    const { currentUser, selectedClinic, roles, isSuperAdmin } = useAuth()
    const [inviteData, setInviteData] = useState({
        email: '',
        role: 'RECEPTIONIST',
        fullName: ''
    })
    const [generatedPassword, setGeneratedPassword] = useState(null)
    const [isSending, setIsSending] = useState(false)
    const [staff, setStaff] = useState([])
    const [isLoadingStaff, setIsLoadingStaff] = useState(true)
    const [activeTab, setActiveTab] = useState('staff')
    const [showPasswords, setShowPasswords] = useState({})
    const [clinicData, setClinicData] = useState(null)
    const [isEditingClinic, setIsEditingClinic] = useState(false)
    const [isUpdatingClinic, setIsUpdatingClinic] = useState(false)
    const [editingStaff, setEditingStaff] = useState(null)
    const [viewingStaff, setViewingStaff] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        fetchStaff()
        fetchClinicDetails()
    }, [selectedClinic])

    const fetchClinicDetails = async () => {
        if (!selectedClinic) return
        try {
            const response = await api.get(`/clinics/${selectedClinic.clinicId}`)
            setClinicData(response.data)
        } catch (error) {
            console.error('Error fetching clinic details:', error)
        }
    }

    const fetchStaff = async () => {
        if (!selectedClinic) return
        try {
            const response = await api.get(`/clinics/${selectedClinic.clinicId}/staff`)
            setStaff(response.data)
        } catch (error) {
            console.error('Error fetching staff:', error)
        } finally {
            setIsLoadingStaff(false)
        }
    }

    const handleAddStaff = async (e) => {
        e.preventDefault()
        if (!inviteData.email || !inviteData.fullName) {
            toast.error('Email and Full Name are required')
            return
        }

        setIsSending(true)
        setGeneratedPassword(null)
        try {
            const response = await api.post(`/clinics/${selectedClinic.clinicId}/add-staff`, {
                email: inviteData.email,
                role: inviteData.role,
                fullName: inviteData.fullName
            })

            toast.success('Staff member added successfully!')
            if (response.data.temporaryPassword) {
                setGeneratedPassword(response.data.temporaryPassword)
            }
            setInviteData({ email: '', role: 'RECEPTIONIST', fullName: '' })
            fetchStaff()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add staff member')
        } finally {
            setIsSending(false)
        }
    }

    const handleUpdateClinic = async (e) => {
        e.preventDefault()
        setIsUpdatingClinic(true)
        try {
            await api.patch(`/clinics/${selectedClinic.clinicId}`, clinicData)
            toast.success('Clinic details updated!')
            setIsEditingClinic(false)
            fetchClinicDetails()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update clinic')
        } finally {
            setIsUpdatingClinic(false)
        }
    }

    const handleUpdateStaff = async (e) => {
        e.preventDefault()
        setIsProcessing(true)
        try {
            await api.patch(`/clinics/${selectedClinic.clinicId}/staff/${editingStaff.id}`, editingStaff)
            toast.success('Staff member updated!')
            setEditingStaff(null)
            fetchStaff()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update staff')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDeleteStaff = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this staff member from the clinic?')) return
        setIsProcessing(true)
        try {
            await api.delete(`/clinics/${selectedClinic.clinicId}/staff/${userId}`)
            toast.success('Staff member removed from clinic')
            fetchStaff()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove staff member')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleResetPassword = async (userId) => {
        if (!window.confirm('Reset this user\'s password? They will be given a new temporary password.')) return
        setIsProcessing(true)
        try {
            const response = await api.post(`/clinics/${selectedClinic.clinicId}/staff/${userId}/reset-password`)
            toast.success('Password reset successfully!')
            setGeneratedPassword(response.data.temporaryPassword)
            fetchStaff()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password')
        } finally {
            setIsProcessing(false)
        }
    }

    const togglePasswordVisibility = (userId) => {
        setShowPasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link to="/doctor" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <FaArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <FaUserShield className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Admin Panel</h1>
                            <p className="text-sm text-slate-400">{selectedClinic?.clinicName}</p>
                        </div>
                        {isSuperAdmin && (
                            <Link
                                to="/master"
                                className="ml-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg border border-purple-500/30 transition-colors flex items-center space-x-2 text-sm font-bold"
                            >
                                <FaUserShield className="w-4 h-4" />
                                <span>Master Admin</span>
                            </Link>
                        )}
                    </div>
                    <LogoutButton />
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Add Staff */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="flex items-center space-x-3 mb-6">
                                <FaUserPlus className="w-6 h-6 text-green-400" />
                                <h2 className="text-xl font-bold">Add Staff Member</h2>
                            </div>

                            <form onSubmit={handleAddStaff} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="staff@example.com"
                                            value={inviteData.email}
                                            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:border-blue-400 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="John Doe"
                                            value={inviteData.fullName}
                                            onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:border-blue-400 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={inviteData.role}
                                        onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:border-blue-400 outline-none transition-colors appearance-none"
                                    >
                                        <option value="RECEPTIONIST" className="bg-slate-800">Receptionist</option>
                                        <option value="DOCTOR" className="bg-slate-800">Doctor</option>
                                        <option value="ADMIN" className="bg-slate-800">Admin</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                                >
                                    {isSending ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FaUserPlus className="w-5 h-5" />
                                            <span>Add Staff</span>
                                        </>
                                    )}
                                </button>

                                {generatedPassword && (
                                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                        <p className="text-sm text-green-400 mb-2">Temporary Password Generated:</p>
                                        <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                                            <code className="text-lg font-mono text-white select-all">{generatedPassword}</code>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedPassword)
                                                    toast.success('Password copied!')
                                                }}
                                                className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 italic">Please share this password securely with the staff member. They can change it after their first login.</p>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="flex items-center space-x-3 mb-4">
                                <FaShieldHalved className="w-6 h-6 text-purple-400" />
                                <h2 className="text-lg font-bold">Permissions</h2>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                As an admin of <strong>{selectedClinic?.clinicName}</strong>, you can add new staff members, manage roles, and update clinic information.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Staff Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-white/10">
                                <div className="flex-1 py-4 px-6 flex items-center justify-center space-x-2 font-medium bg-white/5 border-b-2 border-cyan-400 text-white">
                                    <FaUsers className="w-4 h-4" />
                                    <span>Staff Management</span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <FaUsers className="w-6 h-6 text-cyan-400" />
                                        <h2 className="text-xl font-bold">Staff Directory</h2>
                                    </div>
                                </div>

                                {isLoadingStaff ? (
                                    <div className="py-12 flex justify-center">
                                        <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                                    </div>
                                ) : staff.length === 0 ? (
                                    <div className="py-12 text-center text-slate-500">
                                        <p>No staff members found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left text-sm text-slate-400 border-b border-white/10">
                                                    <th className="pb-4 font-medium">Staff Member</th>
                                                    <th className="pb-4 font-medium">Role</th>
                                                    <th className="pb-4 font-medium">Shared Password</th>
                                                    <th className="pb-4 font-medium text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {staff.map((member) => (
                                                    <tr key={member.id} className="text-sm">
                                                        <td className="py-4">
                                                            <div>
                                                                <p className="font-medium text-white">{member.fullName}</p>
                                                                <p className="text-xs text-slate-500">{member.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-md text-xs font-bold">
                                                                {member.roleName || member.role}
                                                            </span>
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex items-center space-x-2">
                                                                <code className="bg-black/20 px-2 py-1 rounded border border-white/5 font-mono text-slate-300">
                                                                    {showPasswords[member.id] ? member.tempPassword || '••••••••' : '••••••••'}
                                                                </code>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => togglePasswordVisibility(member.id)}
                                                                    disabled={!member.tempPassword}
                                                                    className="text-slate-500 hover:text-white transition-colors"
                                                                    title={showPasswords[member.id] ? "Hide Password" : "Show Password"}
                                                                >
                                                                    {showPasswords[member.id] ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <div className="flex items-center justify-end space-x-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingStaff(member)}
                                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                                                    title="View Details"
                                                                >
                                                                    <FaCircleInfo className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingStaff({
                                                                        id: member.id,
                                                                        fullName: member.fullName,
                                                                        email: member.email,
                                                                        role: member.roleName || member.role
                                                                    })}
                                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                                                                    title="Edit Staff"
                                                                >
                                                                    <FaPenToSquare className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleResetPassword(member.id)}
                                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-yellow-400"
                                                                    title="Reset Password"
                                                                >
                                                                    <FaRotate className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteStaff(member.id)}
                                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
                                                                    title="Delete Staff"
                                                                >
                                                                    <FaTrashCan className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="flex items-center space-x-3 mb-6">
                                <FaHouseMedical className="w-6 h-6 text-cyan-400" />
                                <h2 className="text-xl font-bold">Clinic Settings</h2>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Clinic Name:</span>
                                    <span className="text-white font-medium">{clinicData?.name || selectedClinic?.clinicName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Email:</span>
                                    <span className="text-white font-medium">{clinicData?.email || 'Not set'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Phone:</span>
                                    <span className="text-white font-medium">{clinicData?.phone || 'Not set'}</span>
                                </div>
                                <div className="flex items-start justify-between text-sm">
                                    <span className="text-slate-500 shrink-0">Address:</span>
                                    <span className="text-white font-medium text-right max-w-[150px] truncate" title={clinicData?.address}>
                                        {clinicData?.address || 'Not set'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Clinic ID:</span>
                                    <span className="text-white font-mono">{selectedClinic?.clinicId}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditingClinic(true)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
                            >
                                <FaPenToSquare className="w-4 h-4 text-cyan-400" />
                                <span>Edit Clinic Details</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit Clinic Modal */}
            {isEditingClinic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center space-x-3">
                                <FaHouseMedical className="text-cyan-400" />
                                <span>Clinic Settings</span>
                            </h2>
                            <button type="button" onClick={() => setIsEditingClinic(false)} className="p-2 hover:bg-white/5 rounded-full">
                                <FaXmark className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateClinic} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Clinic Name</label>
                                <input
                                    type="text"
                                    required
                                    value={clinicData?.name || ''}
                                    onChange={e => setClinicData({ ...clinicData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Official Email</label>
                                <input
                                    type="email"
                                    value={clinicData?.email || ''}
                                    onChange={e => setClinicData({ ...clinicData, email: e.target.value })}
                                    placeholder="contact@clinic.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    value={clinicData?.phone || ''}
                                    onChange={e => setClinicData({ ...clinicData, phone: e.target.value })}
                                    placeholder="+1 234 567 890"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Physical Address</label>
                                <textarea
                                    value={clinicData?.address || ''}
                                    onChange={e => setClinicData({ ...clinicData, address: e.target.value })}
                                    rows="3"
                                    placeholder="123 Health St, Medical City"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 transition-colors resize-none"
                                ></textarea>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isUpdatingClinic}
                                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                                >
                                    {isUpdatingClinic ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FaFloppyDisk className="w-5 h-5" />
                                            <span>Save Settings</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingClinic(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center space-x-3">
                                <FaPenToSquare className="text-blue-400" />
                                <span>Edit Staff Member</span>
                            </h2>
                            <button type="button" onClick={() => setEditingStaff(null)} className="p-2 hover:bg-white/5 rounded-full">
                                <FaXmark className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateStaff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingStaff.fullName}
                                    onChange={e => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={editingStaff.email}
                                    onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                                <select
                                    value={editingStaff.role}
                                    onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition-colors appearance-none"
                                >
                                    <option value="RECEPTIONIST" className="bg-slate-800">Receptionist</option>
                                    <option value="DOCTOR" className="bg-slate-800">Doctor</option>
                                    <option value="ADMIN" className="bg-slate-800">Admin</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <FaFloppyDisk className="w-5 h-5" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingStaff(null)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Staff Modal */}
            {viewingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-md shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold flex items-center space-x-3">
                                <FaCircleInfo className="text-cyan-400" />
                                <span>Staff Details</span>
                            </h2>
                            <button type="button" onClick={() => setViewingStaff(null)} className="p-2 hover:bg-white/5 rounded-full">
                                <FaXmark className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="flex flex-col items-center pb-6 border-b border-white/10">
                                <div className="w-20 h-20 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-4">
                                    <FaUsers className="w-10 h-10 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-bold">{viewingStaff.fullName}</h3>
                                <p className="text-slate-400">{viewingStaff.roleName || viewingStaff.role}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-sm text-slate-500">Email Address</span>
                                    <span className="text-sm text-white font-medium">{viewingStaff.email}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-sm text-slate-500">Staff ID</span>
                                    <span className="text-sm text-white font-mono">{viewingStaff.id}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-sm text-slate-500">Shared Password</span>
                                    <div className="flex items-center space-x-2">
                                        <code className="text-sm bg-black/20 px-2 py-1 rounded text-cyan-400 font-mono">
                                            {viewingStaff.tempPassword || 'Not set'}
                                        </code>
                                        {viewingStaff.tempPassword && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(viewingStaff.tempPassword)
                                                    toast.success('Copied!')
                                                }}
                                                className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                                            >
                                                <FaCopy className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setViewingStaff(null)}
                            className="w-full mt-8 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all border border-white/10"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
