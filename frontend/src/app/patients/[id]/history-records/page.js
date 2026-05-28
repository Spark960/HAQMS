'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Calendar, User, Phone, Activity, Clock, FileText, 
  ChevronLeft, ChevronRight, CheckCircle, XCircle, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function HistoryRecords() {
  const { user, token, API_BASE_URL } = useAuth();
  const router = useRouter();
  const params = useParams();
  const patientId = params?.id;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);

  // Authentication Route Guard
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || !patientId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}/history-records?page=${page}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.success) {
          setPatient(data.patient);
          setTotalPages(data.pagination.totalPages);
          setTotalAppointments(data.pagination.totalAppointments);
        } else {
          setError(data.error || 'Failed to fetch patient history');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, patientId, page, token, API_BASE_URL]);

  if (!user) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Activity className="h-4 w-4 animate-pulse" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 rounded-full glass hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Clinical Record <ShieldAlert className="h-5 w-5 text-teal-600" />
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Comprehensive patient history and diagnostic overview
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="glass p-8 text-center text-rose-500 font-semibold rounded-2xl border border-rose-200">
            {error}
          </div>
        ) : loading && !patient ? (
          <div className="flex justify-center items-center h-64">
            <div className="pulse-loader">
              <div></div><div></div>
            </div>
          </div>
        ) : patient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Sidebar: Demographics & Medical History */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl font-bold">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {patient.name}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 mt-1">
                      Patient ID: {patient.id.substring(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <User className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">{patient.gender}, {patient.age} years old</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <Phone className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">{patient.phoneNumber}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <FileText className="h-4 w-4 text-teal-600" />
                      <span className="font-medium">{patient.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Medical History
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium">
                    {patient.medicalHistory || 'NO MEDICAL HISTORY RECORDED'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Main Column: Timeline */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-6 shadow-sm h-full">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-600" /> 
                    Appointment Timeline
                  </h3>
                  <span className="text-sm text-slate-500 font-medium">
                    Total: {totalAppointments}
                  </span>
                </div>

                {patient.appointments?.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                    <p>No past appointments found.</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                    {patient.appointments.map((apt, index) => (
                      <div key={apt.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-teal-100 dark:bg-teal-900/40 text-teal-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                          {getStatusIcon(apt.status)}
                        </div>
                        
                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                              {new Date(apt.appointmentDate).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </span>
                          </div>
                          <h4 className="text-md font-bold text-slate-900 dark:text-white mb-1">
                            Dr. {apt.doctor.user.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
                            {apt.doctor.specialization} • {apt.doctor.department}
                          </p>
                          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {apt.reason || 'Routine checkup'}
                          </div>
                          {apt.consultationFee > 0 && (
                            <div className="mt-3 text-right">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Assessed: </span>
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">${apt.consultationFee.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-4">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg glass disabled:opacity-50 hover:bg-white/50 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Page {page} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg glass disabled:opacity-50 hover:bg-white/50 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}

              </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
