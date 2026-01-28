import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../components/LogoutButton'
import {
    FaUserShield, FaUsers, FaHouseMedical,
    FaArrowLeft, FaTrashCan, FaPenToSquare, FaFloppyDisk, FaXmark,
    FaHospital, FaEnvelope, FaClock, FaPlus, FaTrash
} from 'react-icons/fa6'
import api from '../../utils/api'
import { toast } from 'react-hot-toast'

export default function MasterDashboard() {
    const { isSuperAdmin } = useAuth()
    const [clinics, setClinics] = useState([])
    const [users, setUsers] = useState([])
    const [allClinics, setAllClinics] = useState([]) // For selection dropdown
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('clinics') // 'clinics' or 'users'
    const [editingClinic, setEditingClinic] = useState(null)
    const [editingUser, setEditingUser] = useState(null)
    const [associatingUser, setAssociatingUser] = useState(null)
    const [assocData, setAssocData] = useState({
        clinicId: '',
        role: 'ADMIN'
    })

    useEffect(() => {
        if (isSuperAdmin) {
            fetchData()
            fetchAllClinics()
        }
    }, [isSuperAdmin, activeTab])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            if (activeTab === 'clinics') {
                const response = await api.get('/superadmin/clinics')
                setClinics(response.data)
            } else {
                const response = await api.get('/superadmin/users')
                setUsers(response.data)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to fetch data')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchAllClinics = async () => {
        try {
            const response = await api.get('/superadmin/clinics')
            setAllClinics(response.data)
        } catch (error) {
            console.error('Error fetching all clinics:', error)
        }
    }

    const handleLinkClinic = async (e) => {
        e.preventDefault()
        if (!assocData.clinicId) {
            toast.error('Please select a clinic')
            return
        }
        try {
            await api.post(`/superadmin/users/${associatingUser.id}/clinics`, assocData)
            toast.success('User linked to clinic')
            setAssociatingUser(null)
            fetchData()
        } catch (error) {
            toast.error('Failed to link clinic')
        }
    }

    const handleUnlinkClinic = async (userId, clinicId) => {
        if (!window.confirm('Are you sure you want to remove this association?')) return
        try {
            await api.delete(`/superadmin/users/${userId}/clinics/${clinicId}`)
            toast.success('Association removed')
            fetchData()
        } catch (error) {
            toast.error('Failed to remove association')
        }
    }

    const handleDeleteClinic = async (id) => {
        if (!window.confirm('Are you sure you want to delete this clinic? This action cannot be undone.')) return
        try {
            await api.delete(`/superadmin/clinics/${id}`)
            toast.success('Clinic deleted')
            fetchData()
        } catch (error) {
            toast.error('Failed to delete clinic')
        }
    }

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return
        try {
            await api.delete(`/superadmin/users/${id}`)
            toast.success('User deleted')
            fetchData()
        } catch (error) {
            toast.error('Failed to delete user')
        }
    }

    const handleUpdateClinic = async (e) => {
        e.preventDefault()
        try {
            await api.patch(`/superadmin/clinics/${editingClinic.id}`, editingClinic)
            toast.success('Clinic updated')
            setEditingClinic(null)
            fetchData()
        } catch (error) {
            toast.error('Failed to update clinic')
        }
    }

    const handleUpdateUser = async (e) => {
        e.preventDefault()
        try {
            await api.patch(`/superadmin/users/${editingUser.id}`, editingUser)
            toast.success('User updated')
            setEditingUser(null)
            fetchData()
        } catch (error) {
            toast.error('Failed to update user')
        }
    }

    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">403</h1>
                    <p className="text-slate-400">Access Denied. Super Admin only.</p>
                    <Link to="/" className="mt-4 inline-block text-blue-400 hover:underline">Go Home</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-12">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Link to="/admin" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <FaArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <FaUserShield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Master Dashboard</h1>
                            <p className="text-sm text-slate-400">System-wide Management</p>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">
                {/* Tabs */}
                <div className="flex space-x-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('clinics')}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2 ${activeTab === 'clinics' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <FaHouseMedical className="w-4 h-4" />
                        <span>Clinics</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center space-x-2 ${activeTab === 'users' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <FaUsers className="w-4 h-4" />
                        <span>Users</span>
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 animate-pulse">Loading data...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {activeTab === 'clinics' ? (
                            clinics.map(clinic => (
                                <div key={clinic.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:bg-white/[0.07] transition-all group">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                                    <FaHospital className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <h3 className="text-xl font-bold">{clinic.name}</h3>
                                                <span className="text-xs text-slate-500 font-mono">ID: {clinic.id}</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 text-sm text-slate-400">
                                                <div className="flex items-center space-x-2">
                                                    <FaEnvelope className="w-4 h-4" />
                                                    <span>{clinic.email || 'No email'}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <FaClock className="w-4 h-4" />
                                                    <span>Created: {new Date(clinic.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <FaUsers className="w-4 h-4" />
                                                    <span>{clinic.staff?.length || 0} Staff Members</span>
                                                </div>
                                            </div>

                                            {/* Staff List */}
                                            <div className="mt-6">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Staff List</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {clinic.staff?.map(s => (
                                                        <div key={`${s.id}-${s.role}`} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs flex items-center space-x-2">
                                                            <span className="text-white font-medium">{s.fullName}</span>
                                                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] uppercase font-bold">{s.role}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingClinic(clinic)}
                                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-blue-400"
                                                title="Edit Clinic"
                                            >
                                                <FaPenToSquare className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClinic(clinic.id)}
                                                className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors text-red-400"
                                                title="Delete Clinic"
                                            >
                                                <FaTrashCan className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            users.map(user => (
                                <div key={user.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:bg-white/[0.07] transition-all group">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                                    <FaUserShield className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold">{user.fullName}</h3>
                                                    <p className="text-sm text-slate-400">{user.email}</p>
                                                </div>
                                                <span className="text-xs text-slate-500 font-mono">ID: {user.id}</span>
                                            </div>

                                            <div className="mt-4">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Clinic Associations</h4>
                                                <div className="space-y-2">
                                                    {user.associations?.map((assoc, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl text-sm">
                                                            <div className="flex items-center space-x-3">
                                                                <FaHouseMedical className="text-blue-400 w-4 h-4" />
                                                                <span className="font-medium">{assoc.clinicName}</span>
                                                                <span className="text-xs text-slate-500 font-mono">ID: {assoc.clinicId}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                                    {assoc.role}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleUnlinkClinic(user.id, assoc.clinicId)}
                                                                    className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                                                                    title="Remove Association"
                                                                >
                                                                    <FaTrash className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            setAssociatingUser(user)
                                                            setAssocData({ clinicId: '', role: 'ADMIN' })
                                                        }}
                                                        className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs text-slate-500 hover:text-purple-400 hover:border-purple-400/50 transition-all flex items-center justify-center space-x-2"
                                                    >
                                                        <FaPlus className="w-3 h-3" />
                                                        <span>Link to Clinic</span>
                                                    </button>
                                                    {(!user.associations || user.associations.length === 0) && (
                                                        <p className="text-sm text-slate-500 italic">No clinic associations</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-purple-400"
                                            >
                                                <FaPenToSquare className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors text-red-400"
                                            >
                                                <FaTrashCan className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Edit Clinic Modal */}
            {editingClinic && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center space-x-3">
                                <FaPenToSquare className="text-blue-400" />
                                <span>Edit Clinic</span>
                            </h2>
                            <button onClick={() => setEditingClinic(null)} className="p-2 hover:bg-white/5 rounded-full">
                                <FaXmark className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateClinic} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Clinic Name</label>
                                <input
                                    type="text"
                                    value={editingClinic.name}
                                    onChange={e => setEditingClinic({ ...editingClinic, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={editingClinic.email || ''}
                                    onChange={e => setEditingClinic({ ...editingClinic, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={editingClinic.phone || ''}
                                    onChange={e => setEditingClinic({ ...editingClinic, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-400 transition-colors"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all"
                                >
                                    <FaFloppyDisk className="w-5 h-5" />
                                    <span>Save Changes</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingClinic(null)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center space-x-3">
                                <FaPenToSquare className="text-purple-400" />
                                <span>Edit User</span>
                            </h2>
                            <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/5 rounded-full">
                                <FaXmark className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={editingUser.fullName}
                                    onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400 transition-colors"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-purple-500 hover:bg-purple-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all"
                                >
                                    <FaFloppyDisk className="w-5 h-5" />
                                    <span>Save Changes</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Link Clinic Modal */}
            {associatingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center space-x-3">
                                <FaPlus className="text-purple-400" />
                                <span>Link Clinic</span>
                            </h2>
                            <button onClick={() => setAssociatingUser(null)} className="p-2 hover:bg-white/5 rounded-full">
                                <FaXmark className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-400 mb-6">
                            Associate <strong>{associatingUser.fullName}</strong> with a clinic.
                        </p>
                        <form onSubmit={handleLinkClinic} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Select Clinic</label>
                                <select
                                    required
                                    value={assocData.clinicId}
                                    onChange={e => setAssocData({ ...assocData, clinicId: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400 transition-colors appearance-none"
                                >
                                    <option value="" className="bg-slate-800 italic">Select a clinic...</option>
                                    {allClinics.map(clinic => (
                                        <option key={clinic.id} value={clinic.id} className="bg-slate-800">
                                            {clinic.name} (ID: {clinic.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Assign Role</label>
                                <select
                                    value={assocData.role}
                                    onChange={e => setAssocData({ ...assocData, role: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-400 transition-colors appearance-none"
                                >
                                    <option value="DOCTOR" className="bg-slate-800">Doctor</option>
                                    <option value="RECEPTIONIST" className="bg-slate-800">Receptionist</option>
                                    <option value="ADMIN" className="bg-slate-800">Admin</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-purple-500 hover:bg-purple-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all"
                                >
                                    <span>Link User</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAssociatingUser(null)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
