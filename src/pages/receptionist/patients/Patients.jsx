import { useState, useEffect } from 'react'
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
    CalendarDays
} from 'lucide-react'
import api from '../../../utils/api'

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

    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        bloodType: '',
        allergies: '',
        medicalHistory: ''
    })

    useEffect(() => {
        fetchPatients()
    }, [])

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
                phone: patient.phone || '',
                email: patient.email || '',
                address: patient.address || '',
                emergencyContactName: patient.emergencyContactName || '',
                emergencyContactPhone: patient.emergencyContactPhone || '',
                bloodType: patient.bloodType || '',
                allergies: patient.allergies || '',
                medicalHistory: patient.medicalHistory || ''
            })
        } else {
            setSelectedPatient(null)
            setFormData({
                fullName: '',
                dateOfBirth: '',
                gender: '',
                phone: '',
                email: '',
                address: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                bloodType: '',
                allergies: '',
                medicalHistory: ''
            })
        }
        setShowModal(true)
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
                                        <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-xl">
                                            {patient.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{patient.fullName}</h3>
                                            <p className="text-xs text-slate-400">Patient ID: #{patient.id}</p>
                                        </div>
                                    </div>
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

                                <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
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
                                        <label className="block text-xs text-slate-400 mb-1">Gender</label>
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
                                        <label className="block text-xs text-slate-400 mb-1">Allergies</label>
                                        <input
                                            type="text"
                                            value={formData.allergies}
                                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors"
                                            placeholder="e.g., Penicillin, Peanuts, Pollen"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Pre-existing Conditions / Medical History</label>
                                    <textarea
                                        rows="3"
                                        value={formData.medicalHistory}
                                        onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-cyan-400 outline-none transition-colors resize-none"
                                        placeholder="List important past medical events or chronic conditions..."
                                    />
                                </div>
                            </section>

                            {/* Emergency Contact */}
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">Emergency Contact</h3>
                                    <div className="h-px flex-1 bg-orange-400/20"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </div>
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
