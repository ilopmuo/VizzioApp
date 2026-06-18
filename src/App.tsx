import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import LogHours from './pages/employee/LogHours'
import MyHours from './pages/employee/MyHours'
import EmployeeHours from './pages/boss/EmployeeHours'
import Resources from './pages/boss/Resources'
import CreateEmployee from './pages/boss/CreateEmployee'
import HojaFirma from './pages/boss/HojaFirma'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Rutas empleado */}
          <Route
            path="/imputar-horas"
            element={
              <ProtectedRoute requiredRole="empleado">
                <LogHours />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-horas"
            element={
              <ProtectedRoute requiredRole="empleado">
                <MyHours />
              </ProtectedRoute>
            }
          />

          {/* Rutas jefe */}
          <Route
            path="/horas-empleados"
            element={
              <ProtectedRoute requiredRole="jefe">
                <EmployeeHours />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recursos"
            element={
              <ProtectedRoute requiredRole="jefe">
                <Resources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empleados"
            element={
              <ProtectedRoute requiredRole="jefe">
                <CreateEmployee />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hoja-firma"
            element={
              <ProtectedRoute requiredRole="jefe">
                <HojaFirma />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
