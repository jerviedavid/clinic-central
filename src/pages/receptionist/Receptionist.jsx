import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LogoutButton from '../../components/LogoutButton'
import EmailVerificationStatus from '../../components/EmailVerificationStatus'
import { Bell, UserPlus, CalendarCheck, Users, Calendar, FileText, FileDown, Hash, DollarSign } from 'lucide-react'
import api from '../../utils/api'

export default function Receptionist() {
  const { currentUser, userRole } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [todayAppointments, setTodayAppointments] = useState(0)
  const [todayPrescriptions, setTodayPrescriptions] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [clinicInfo, setClinicInfo] = useState(null)

  // Fetch real appointment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsRes, prescriptionsRes, clinicRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/prescriptions'),
          currentUser?.clinicId ? api.get(`/clinics/${currentUser.clinicId}`) : Promise.resolve({ data: null })
        ]);

        const appointmentsData = apptsRes.data;
        const prescriptionsData = prescriptionsRes.data;

        setAppointments(appointmentsData);
        setTotalAppointments(appointmentsData.length);
        setClinicInfo(clinicRes.data);

        const today = new Date().toISOString().split('T')[0];

        const todayApptCount = appointmentsData.filter(apt => apt.appointmentDate === today).length;
        setTodayAppointments(todayApptCount);

        const todayPresCount = prescriptionsData.filter(pres => pres.prescriptionDate === today).length;
        setTodayPrescriptions(todayPresCount);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.clinicId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{clinicInfo?.name || 'Receptionist Dashboard'}</h1>
              <p className="text-sm text-slate-400">
                {clinicInfo?.address ? `${clinicInfo.address} | ` : ''}
                Welcome, {currentUser?.fullName || 'Receptionist'}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick Stats */}
          <Link to="/receptionist/billing" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-semibold">Billing & Payments</h3>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{totalAppointments}</p>
            <p className="text-sm text-slate-400 mt-2">Total invoices</p>
            <p className="text-xs text-cyan-400 mt-2">Click to manage billing →</p>
          </Link>

          <Link to="/receptionist/appointments" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CalendarCheck className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold">Today's Appointments</h3>
              </div>
              <Calendar className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-green-400">{todayAppointments}</p>
            <p className="text-sm text-slate-400 mt-2">Scheduled today</p>
            <p className="text-xs text-green-400 mt-2">Click to manage appointments →</p>
          </Link>

          <Link to="/receptionist/prescriptions" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold">Today's Prescriptions</h3>
              </div>
              <FileDown className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-purple-400">{todayPrescriptions}</p>
            <p className="text-sm text-slate-400 mt-2">Issued today</p>
            <p className="text-xs text-purple-400 mt-2">Click to manage prescriptions →</p>
          </Link>

          <Link to="/receptionist/tokens" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Hash className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold">Token Management</h3>
              </div>
              <Hash className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400">{appointments.filter(apt => apt.tokenNumber).length}</p>
            <p className="text-sm text-slate-400 mt-2">Tokens generated today</p>
            <p className="text-xs text-blue-400 mt-2">Click to manage tokens →</p>
          </Link>

          <Link to="/receptionist/patients" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-orange-400" />
                <h3 className="text-lg font-semibold">Patient Directory</h3>
              </div>
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-orange-400">Manage</p>
            <p className="text-sm text-slate-400 mt-2">Patient records</p>
            <p className="text-xs text-orange-400 mt-2">Click to manage patients →</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/receptionist/appointments" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-semibold">Manage Appointments</h3>
                  <p className="text-sm text-slate-400">View and manage appointments</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/prescriptions" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold">View Prescriptions</h3>
                  <p className="text-sm text-slate-400">Manage patient prescriptions</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/appointments" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-semibold">Create Appointment</h3>
                  <p className="text-sm text-slate-400">Schedule new appointment</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/tokens" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Hash className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold">Token Management</h3>
                  <p className="text-sm text-slate-400">Manage patient tokens</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/patients" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-semibold">Manage Patients</h3>
                  <p className="text-sm text-slate-400">Register and manage patient records</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-semibold">Billing & Payments</h3>
                  <p className="text-sm text-slate-400">Manage invoices and payments</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/reports" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FileDown className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-semibold">Download Reports</h3>
                  <p className="text-sm text-slate-400">Generate and download reports</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/create" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-semibold">Create Invoice</h3>
                  <p className="text-sm text-slate-400">Generate new invoice</p>
                </div>
              </div>
            </Link>

            <Link to="/receptionist/billing/payments" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold">Process Payments</h3>
                  <p className="text-sm text-slate-400">Handle patient payments</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Email</p>
              <p className="text-white font-medium">{currentUser?.email}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Role</p>
              <p className="text-cyan-400 font-medium capitalize">{userRole}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Full Name</p>
              <p className="text-white font-medium">{currentUser?.fullName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Email Verified</p>
              <EmailVerificationStatus />
            </div>
          </div>

          {clinicInfo && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-lg font-bold mb-4 text-cyan-400">Clinic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Clinic Name</p>
                  <p className="text-white font-medium">{clinicInfo.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Address</p>
                  <p className="text-white font-medium">{clinicInfo.address}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Phone</p>
                  <p className="text-white font-medium">{clinicInfo.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Clinic Email</p>
                  <p className="text-white font-medium">{clinicInfo.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


