import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetDashboardStats, 
  useGetRecentConsultations, 
  useListConsultations,
  ListConsultationsStatus
} from "@workspace/api-client-react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Search,
  ArrowRight,
  Filter,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Pill
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  
  const { data: listData, isLoading: listLoading } = useListConsultations({
    status: statusFilter !== "all" ? statusFilter as ListConsultationsStatus : undefined,
    limit: 50
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-semibold px-3 py-1">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none font-semibold px-3 py-1">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none font-semibold px-3 py-1">Rejected</Badge>;
      case "more_info_needed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none font-semibold px-3 py-1">More Info Needed</Badge>;
      case "referred":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none font-semibold px-3 py-1">Referred</Badge>;
      case "red_flag":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none font-semibold px-3 py-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Urgent</Badge>;
      default:
        return <Badge variant="outline" className="font-semibold px-3 py-1">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-secondary text-white shrink-0 md:h-screen md:sticky top-0 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-lg shadow-sm">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight">PharmaCare</span>
          </div>
        </div>
        
        <div className="p-4 px-6 flex-1">
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4 mt-4">Menu</div>
          <nav className="space-y-2">
            <button className="w-full flex items-center justify-between bg-primary/20 text-primary-foreground font-medium rounded-xl p-3 transition-colors">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5" />
                Queue
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
            <button className="w-full flex items-center justify-between text-white/70 hover:bg-white/5 hover:text-white font-medium rounded-xl p-3 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                Patients
              </div>
            </button>
            <button className="w-full flex items-center justify-between text-white/70 hover:bg-white/5 hover:text-white font-medium rounded-xl p-3 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                Reports
              </div>
            </button>
            <button className="w-full flex items-center justify-between text-white/70 hover:bg-white/5 hover:text-white font-medium rounded-xl p-3 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                Settings
              </div>
            </button>
          </nav>
        </div>
        
        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
              {(localStorage.getItem("pharmacist_name") ?? "P").charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm">{localStorage.getItem("pharmacist_name") ?? "Pharmacist"}</p>
              <p className="text-xs text-white/60">{localStorage.getItem("pharmacist_role") ?? "Pharmacist Prescriber (GPhC)"}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => {
              localStorage.removeItem("pharmacist_token");
              localStorage.removeItem("pharmacist_name");
              localStorage.removeItem("pharmacist_role");
              window.location.href = "/";
            }}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-secondary tracking-tight">Clinical Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">Review pending consultations and manage patient care.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white border-border text-secondary rounded-full shadow-sm">
              <FileText className="w-4 h-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-white border-border shadow-sm hover:shadow-md transition-shadow rounded-2xl relative overflow-hidden border-l-4 border-l-amber-500">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                  <Clock className="w-16 h-16 text-amber-500" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Pending Review</p>
                  <p className="text-5xl font-bold text-secondary">{stats.pendingReview}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-amber-600 bg-amber-50 inline-flex px-2 py-1 rounded-md">
                    Requires attention
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-white border-border shadow-sm hover:shadow-md transition-shadow rounded-2xl relative overflow-hidden border-l-4 border-l-red-500">
                <div className="absolute right-4 top-4">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                </div>
                <div className="absolute right-0 top-0 p-4 opacity-5">
                  <AlertTriangle className="w-16 h-16 text-red-500" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Red Flags</p>
                  <p className="text-5xl font-bold text-red-600">{stats.redFlagsToday}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-red-600 bg-red-50 inline-flex px-2 py-1 rounded-md">
                    Urgent review needed
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-white border-border shadow-sm hover:shadow-md transition-shadow rounded-2xl relative overflow-hidden border-l-4 border-l-green-500">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Approved Today</p>
                  <p className="text-5xl font-bold text-secondary">{stats.approvedToday}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-green-600 bg-green-50 inline-flex px-2 py-1 rounded-md">
                    Prescriptions issued
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-white border-border shadow-sm hover:shadow-md transition-shadow rounded-2xl relative overflow-hidden border-l-4 border-l-secondary">
                <div className="absolute right-0 top-0 p-4 opacity-5">
                  <Users className="w-16 h-16 text-secondary" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Consults</p>
                  <p className="text-5xl font-bold text-secondary">{stats.totalConsultations}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-secondary/60 bg-muted inline-flex px-2 py-1 rounded-md">
                    Lifetime total
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : null}

        {/* Consultation Queue */}
        <Card className="border-border shadow-md bg-white rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sticky top-0 z-10">
            <h2 className="text-2xl font-serif font-bold text-secondary flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              Consultation Queue
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search patients or conditions..." className="pl-11 h-11 rounded-full bg-white border-border shadow-sm focus-visible:ring-primary" />
              </div>
              
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                <TabsList className="h-11 rounded-full bg-muted/50 p-1 w-full sm:w-auto">
                  <TabsTrigger value="all" className="rounded-full px-4">All</TabsTrigger>
                  <TabsTrigger value="pending" className="rounded-full px-4">Pending</TabsTrigger>
                  <TabsTrigger value="approved" className="rounded-full px-4">Approved</TabsTrigger>
                  <TabsTrigger value="red_flag" className="rounded-full px-4 text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">Urgent</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {listLoading ? (
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : listData?.consultations && listData.consultations.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                    <th className="px-6 py-4 font-bold">Patient</th>
                    <th className="px-6 py-4 font-bold">Condition</th>
                    <th className="px-6 py-4 font-bold">Submitted</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listData.consultations.map((consultation) => (
                    <motion.tr 
                      key={consultation.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setLocation(`/dashboard/consultation/${consultation.id}`)}
                      className={`group cursor-pointer transition-colors ${
                        consultation.status === 'red_flag' ? 'bg-red-50/30 hover:bg-red-50/60' : 
                        consultation.status === 'pending' ? 'hover:bg-amber-50/30' : 
                        'hover:bg-muted/30'
                      }`}
                      data-testid={`consultation-row-${consultation.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                            ${consultation.patientSex === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                            {getInitials(consultation.patientName)}
                          </div>
                          <div>
                            <p className="font-bold text-secondary group-hover:text-primary transition-colors">{consultation.patientName}</p>
                            <p className="text-xs font-medium text-muted-foreground">{consultation.patientAge} yrs • {consultation.patientSex.charAt(0).toUpperCase() + consultation.patientSex.slice(1)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-secondary">{consultation.conditionName}</p>
                        {consultation.hasPhoto && (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wide mt-1 inline-block">Includes Photo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-secondary">{formatDistanceToNow(new Date(consultation.createdAt), { addSuffix: true })}</p>
                        <p className="text-xs font-medium text-muted-foreground">{format(new Date(consultation.createdAt), 'MMM d, yyyy HH:mm')}</p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(consultation.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" className="rounded-full text-primary hover:text-primary hover:bg-primary/10 font-bold px-4">
                          Review <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-secondary mb-2">Queue is empty</p>
                <p className="text-lg text-muted-foreground">No consultations match the current filters.</p>
                {statusFilter !== 'all' && (
                  <Button variant="outline" className="mt-6 rounded-full" onClick={() => setStatusFilter('all')}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
