import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetDashboardStats, 
  useGetRecentConsultations, 
  useListConsultations,
  getGetDashboardStatsQueryKey,
  getGetRecentConsultationsQueryKey,
  getListConsultationsQueryKey,
  ListConsultationsStatus
} from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Search,
  ArrowRight,
  Filter,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

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
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Rejected</Badge>;
      case "more_info_needed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">More Info Needed</Badge>;
      case "referred":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Referred</Badge>;
      case "red_flag":
        return <Badge variant="destructive">Urgent Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between px-6 py-4 bg-secondary text-white border-b border-secondary/80 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-white text-secondary flex items-center justify-center font-bold text-sm">
            Rx
          </div>
          <span className="text-xl font-bold">PharmaCare Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-secondary-foreground/80 bg-secondary-foreground/10 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Pharmacist Prescriber (GPhC)
          </div>
          <Link href="/" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Exit to Public Site
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">Review pending consultations and manage patient care.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white border-border text-secondary">
              <FileText className="w-4 h-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-4xl font-bold text-secondary mt-4">{stats.pendingReview}</p>
                <p className="text-sm text-muted-foreground mt-1">Requires immediate attention</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Approved Today</p>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-4xl font-bold text-secondary mt-4">{stats.approvedToday}</p>
                <p className="text-sm text-muted-foreground mt-1">Prescriptions issued</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Red Flags</p>
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <p className="text-4xl font-bold text-destructive mt-4">{stats.redFlagsToday}</p>
                <p className="text-sm text-muted-foreground mt-1">Potentially unsafe combinations</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Total Consultations</p>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <p className="text-4xl font-bold text-secondary mt-4">{stats.totalConsultations}</p>
                <p className="text-sm text-muted-foreground mt-1">Lifetime total</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Card className="border-border shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-border bg-gray-50/50 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl font-bold text-secondary flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Consultation Queue
              </CardTitle>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Search patients..." className="pl-9 h-9 w-full md:w-64" />
                </div>
                
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="hidden md:block">
                  <TabsList className="h-9">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="red_flag">Red Flags</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {listLoading ? (
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : listData?.consultations && listData.consultations.length > 0 ? (
              <div className="divide-y divide-border">
                <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-muted-foreground bg-muted/20">
                  <div className="col-span-3">Patient</div>
                  <div className="col-span-3">Condition</div>
                  <div className="col-span-3">Submitted</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>
                {listData.consultations.map((consultation) => (
                  <div 
                    key={consultation.id} 
                    className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors cursor-pointer ${
                      consultation.status === 'pending' ? 'bg-amber-50/20' : 
                      consultation.status === 'red_flag' ? 'bg-destructive/5' : ''
                    }`}
                    onClick={() => setLocation(`/dashboard/consultation/${consultation.id}`)}
                    data-testid={`consultation-row-${consultation.id}`}
                  >
                    <div className="col-span-12 md:col-span-3">
                      <p className="font-semibold text-secondary">{consultation.patientName}</p>
                      <p className="text-xs text-muted-foreground">{consultation.patientAge} yrs • {consultation.patientSex}</p>
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <p className="font-medium text-secondary">{consultation.conditionName}</p>
                      {consultation.hasPhoto && (
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded mt-1 inline-block">Includes Photo</span>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <p className="text-sm text-secondary">{formatDistanceToNow(new Date(consultation.createdAt), { addSuffix: true })}</p>
                      <p className="text-xs text-muted-foreground">{new Date(consultation.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      {getStatusBadge(consultation.status)}
                    </div>
                    <div className="col-span-12 md:col-span-1 text-right">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                        Review <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-secondary">Queue is empty</p>
                <p className="text-sm">No consultations match the current filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
