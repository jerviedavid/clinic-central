import { createContext, useEffect, useState } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

export { AuthContext }
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [availableClinics, setAvailableClinics] = useState([])
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  // Helper flags
  const userRole = roles && roles[0] ? roles[0].toLowerCase() : null
  const isAdmin = roles && roles.includes('ADMIN')
  const isDoctor = roles && roles.includes('DOCTOR')
  const isReceptionist = roles && roles.includes('RECEPTIONIST')
  const isSuperAdmin = roles && roles.includes('SUPER_ADMIN')

  async function signup(email, password, fullName) {
    // No longer requires role parameter
    const response = await api.post('/auth/signup', { email, password, fullName });
    setCurrentUser(response.data.user);
    setSelectedClinic({
      clinicId: response.data.clinic.id,
      clinicName: response.data.clinic.name,
      roles: response.data.roles
    });
    setRoles(response.data.roles);
    setAvailableClinics([{
      clinicId: response.data.clinic.id,
      clinicName: response.data.clinic.name,
      roles: response.data.roles
    }]);
    return response.data;
  }

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    setCurrentUser(response.data.user);
    setAvailableClinics(response.data.clinics || []);
    setSelectedClinic(response.data.selectedClinic || null);
    setRoles(response.data.selectedClinic?.roles || []);
    return response.data;
  }

  async function logout() {
    await api.post('/auth/logout');
    setCurrentUser(null);
    setAvailableClinics([]);
    setSelectedClinic(null);
    setRoles([]);
  }

  async function switchClinic(clinicId) {
    const response = await api.post('/clinics/switch', { clinicId });
    setSelectedClinic({
      clinicId: response.data.clinic.id,
      clinicName: response.data.clinic.name,
      roles: response.data.roles
    });
    setRoles(response.data.roles);
    return response.data;
  }

  async function resetPassword(email) {
    // Placeholder for reset password API
    console.log('Reset password req for:', email);
  }

  async function resendVerificationEmail() {
    // Placeholder for verify email API
    console.log('Resend verification email');
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data.user);
        setAvailableClinics(response.data.clinics);

        // Set current clinic from JWT
        if (response.data.currentClinic) {
          const currentClinicData = response.data.clinics.find(
            c => c.clinicId === response.data.currentClinic.clinicId
          );
          setSelectedClinic(currentClinicData || response.data.currentClinic);
          setRoles(response.data.currentClinic.roles);
        }
      } catch (error) {
        // Not logged in or error, try health check for debug
        api.get('/health').then(h => console.log('Server Health Context:', h.data)).catch(() => { });
        setCurrentUser(null);
        setAvailableClinics([]);
        setSelectedClinic(null);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [])

  const value = {
    currentUser,
    availableClinics,
    selectedClinic,
    roles,
    signup,
    login,
    logout,
    switchClinic,
    resetPassword,
    resendVerificationEmail,
    loading,
    userRole,
    isAdmin,
    isDoctor,
    isReceptionist,
    isSuperAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
