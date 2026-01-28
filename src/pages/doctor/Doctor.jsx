import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../components/LogoutButton'
import EmailVerificationStatus from '../../components/EmailVerificationStatus'
import {
  FaUserDoctor, FaCalendar, FaUserInjured, FaPills,
  FaCalendarDay, FaFileLines, FaPlus, FaHashtag, FaUserShield,
  FaPenToSquare, FaStethoscope, FaIdCard, FaMoneyBillWave, FaClock,
  FaGraduationCap, FaBriefcase
} from 'react-icons/fa6'
import api from '../../utils/api'
import ProfileModal from './ProfileModal'

export default function Doctor() {
  const { currentUser, userRole, isAdmin } = useAuth()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [stats, setStats] = useState({
    todayAppointments: 0,
    waitingPatients: 0,
    weeklyPrescriptions: 0,
    loading: true
  })

  // Fetch real-time stats and profile
  const fetchAllData = async () => {
    if (!currentUser) return

    try {
      const [apptsRes, prescriptionsRes, profileRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/prescriptions'),
        api.get('/auth/profile')
      ]);

      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const todayAppts = apptsRes.data.filter(a => a.appointmentDate === today && (a.doctorName === currentUser.fullName || a.doctorName === 'Dr. Jervie Montejar'));
      const waitingCount = todayAppts.filter(a => a.status === 'token_generated' || a.status === 'in_progress').length;

      const weeklyPrescriptions = prescriptionsRes.data.filter(p => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= weekStart && p.doctorId === currentUser.id;
      }).length;

      setStats({
        todayAppointments: todayAppts.length,
        waitingPatients: waitingCount,
        weeklyPrescriptions: weeklyPrescriptions,
        loading: false
      });

      setProfileData(profileRes.data.doctorProfile);
    } catch (error) {
      console.error('Error fetching data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [currentUser])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <FaUserDoctor className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Doctor Dashboard</h1>
              <p className="text-sm text-slate-400">Welcome, {currentUser?.fullName || 'Doctor'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all font-medium text-sm"
            >
              <FaUserDoctor className="w-4 h-4 text-blue-400" />
              <span>My Profile</span>
            </button>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-xl transition-all font-medium text-sm"
              >
                <FaUserShield className="w-4 h-4" />
                <span>Admin Panel</span>
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Link to="/doctor/appointments" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaCalendar className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold">Today's Appointments</h3>
              </div>
              <FaCalendarDay className="w-4 h-4 text-blue-400" />
            </div>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <p className="text-lg text-slate-400">Loading...</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-blue-400">{stats.todayAppointments}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {stats.todayAppointments === 0 ? 'No appointments today' :
                    stats.todayAppointments === 1 ? 'appointment scheduled' :
                      'appointments scheduled'}
                </p>
              </>
            )}
            <p className="text-xs text-blue-400 mt-2">Click to view all appointments →</p>
          </Link>

          <Link to="/doctor/tokens" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaHashtag className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold">Patient Queue</h3>
              </div>
              <FaHashtag className="w-4 h-4 text-yellow-400" />
            </div>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                <p className="text-lg text-slate-400">Loading...</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-yellow-400">{stats.waitingPatients}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {stats.waitingPatients === 0 ? 'No patients waiting' :
                    stats.waitingPatients === 1 ? 'patient waiting' :
                      'patients waiting'}
                </p>
              </>
            )}
            <p className="text-xs text-yellow-400 mt-2">Click to view queue →</p>
          </Link>

          <Link to="/doctor/prescriptions" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaPills className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold">Prescriptions</h3>
              </div>
              <FaFileLines className="w-4 h-4 text-purple-400" />
            </div>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                <p className="text-lg text-slate-400">Loading...</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-purple-400">{stats.weeklyPrescriptions}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {stats.weeklyPrescriptions === 0 ? 'No prescriptions this week' :
                    'prescriptions this week'}
                </p>
              </>
            )}
            <p className="text-xs text-purple-400 mt-2">Click to manage prescriptions →</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/doctor/appointments" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaCalendar className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold">View Appointments</h3>
                  <p className="text-sm text-slate-400">Manage patient appointments</p>
                </div>
              </div>
            </Link>

            <Link to="/doctor/prescriptions/create" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaPlus className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-semibold">New Prescription</h3>
                  <p className="text-sm text-slate-400">Create prescription for patient</p>
                </div>
              </div>
            </Link>

            <Link to="/doctor/prescriptions" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaFileLines className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold">View Prescriptions</h3>
                  <p className="text-sm text-slate-400">Manage all prescriptions</p>
                </div>
              </div>
            </Link>

            <Link to="/doctor/prescriptions/medicines" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaPills className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-semibold">Manage Medicines</h3>
                  <p className="text-sm text-slate-400">Add/edit medicine inventory</p>
                </div>
              </div>
            </Link>

            <Link to="/doctor/tokens" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaHashtag className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold">Patient Queue</h3>
                  <p className="text-sm text-slate-400">View and manage patient tokens</p>
                </div>
              </div>
            </Link>

            {isAdmin && (
              <Link to="/admin" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center space-x-3">
                  <FaUserShield className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-semibold">Clinic Admin</h3>
                    <p className="text-sm text-slate-400">Manage staff and settings</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Professional Profile Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Info */}
          <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Account Info</h2>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                title="Edit Account"
              >
                <FaPenToSquare className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Full Name</p>
                <p className="text-white font-medium">{currentUser?.fullName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Email</p>
                <p className="text-white font-medium">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">System Role</p>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold uppercase border border-blue-500/20">
                  {userRole}
                </span>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Status</p>
                <EmailVerificationStatus />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center space-x-3">
                <FaStethoscope className="text-blue-400" />
                <span>Professional Details</span>
              </h2>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-xl transition-all font-medium text-sm flex items-center space-x-2"
              >
                <FaPenToSquare className="w-3 h-3" />
                <span>Manage Profile</span>
              </button>
            </div>

            {profileData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FaStethoscope className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Specialization</p>
                      <p className="text-white">{profileData.specialization || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FaIdCard className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">License Number</p>
                      <p className="text-white font-mono">{profileData.licenseNumber || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FaMoneyBillWave className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Consultation Fee</p>
                      <p className="text-white">
                        {profileData.consultationFee ? `₱${parseFloat(profileData.consultationFee).toLocaleString()}` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FaClock className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Clinic Hours</p>
                      <p className="text-white">{profileData.clinicHours || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FaGraduationCap className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Education</p>
                      <p className="text-white">{profileData.education || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FaBriefcase className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Experience</p>
                      <p className="text-white">{profileData.experience ? `${profileData.experience} Years` : 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                <FaUserDoctor className="w-12 h-12 text-slate-700 mb-4" />
                <p className="text-slate-500 text-center max-w-xs mb-6">Your professional profile is incomplete. Add your credentials to help patients know you better.</p>
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 font-bold"
                >
                  Complete Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={fetchAllData}
      />
    </div>
  )
}
