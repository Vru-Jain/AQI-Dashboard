"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Activity, Users, Stethoscope, Wind, AlertTriangle, TrendingUp,
} from "lucide-react";
import { api, type Stats, type ChartItem, type Filters, type PredictionResult } from "@/lib/api";

const CHART_COLORS = [
  "hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)", "hsl(330, 81%, 60%)",
  "hsl(24, 94%, 53%)", "hsl(142, 71%, 45%)", "hsl(47, 96%, 53%)",
  "hsl(199, 89%, 48%)", "hsl(355, 78%, 56%)",
];

/* ── Animated number counter ── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display}{suffix}</>;
}

/* ── Custom chart tooltip ── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-card-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} responses</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [doctorVisits, setDoctorVisits] = useState<ChartItem[]>([]);
  const [seasonData, setSeasonData] = useState<ChartItem[]>([]);
  const [housingData, setHousingData] = useState<ChartItem[]>([]);
  const [symptomsData, setSymptomsData] = useState<ChartItem[]>([]);
  const [dustData, setDustData] = useState<ChartItem[]>([]);
  const [ageData, setAgeData] = useState<ChartItem[]>([]);
  const [chestData, setChestData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prediction state
  const [predInputs, setPredInputs] = useState<Record<string, string>>({});
  const [predResult, setPredResult] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch all data in one request for performance
        const data = await api.getDashboardData();
        const { stats, charts } = data;

        setStats(stats);

        // Load charts
        setDoctorVisits(charts.doctor_visits);
        setSeasonData(charts.season);
        setHousingData(charts.housing);
        setSymptomsData(charts.symptoms);
        setDustData(charts.dust_entry);
        setAgeData(charts.age_distribution);
        setChestData(charts.chest_heaviness);

        // Fetch filters in parallel (static data)
        const f = await api.getFilters();
        setFilters(f);

      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePredict = useCallback(async () => {
    if (!predInputs.age_group) return;
    setPredicting(true);
    try {
      const result = await api.predict(predInputs);
      setPredResult(result);
    } catch {
      setPredResult(null);
    } finally {
      setPredicting(false);
    }
  }, [predInputs]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Could not connect to the API server. Make sure the backend is running on{" "}
            <code className="text-xs">http://localhost:8000</code>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Community Health & Air Quality Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Loading..." : `Analyzing ${stats?.total_responses} survey responses on respiratory health and pollution exposure`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex">
              British Council Climate Action
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* ── KPI Cards ── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-16" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <AnimatedNumber value={stats!.total_responses} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Survey participants across all age groups</p>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Healthcare Utilization</CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <AnimatedNumber value={stats!.healthcare_utilization} suffix="%" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Visited a doctor for breathing problems</p>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AQI Awareness</CardTitle>
                <Wind className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <AnimatedNumber value={stats!.aqi_awareness} suffix="%" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Respondents aware of Air Quality Index</p>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wheezing Reports</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  <AnimatedNumber value={stats!.wheezing_prevalence} suffix="%" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Reported wheezing or whistling sound</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Separator />

        {/* ── Tabs ── */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="prediction">Prediction Tool</TabsTrigger>
          </TabsList>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics" className="space-y-6">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : (
              <>
                {/* Row 1: Doctor visits + Season */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Doctor Visits by Age Group</CardTitle>
                      <CardDescription>Respondents who visited a doctor for breathing issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={doctorVisits} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" className="text-xs" />
                          <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[0, 6, 6, 0]} animationDuration={1200} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Worst Season for Pollution</CardTitle>
                      <CardDescription>When respondents feel air quality is worst</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={seasonData} margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200}>
                            {seasonData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Row 2: Symptoms pie + Housing */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Health Symptoms Distribution</CardTitle>
                      <CardDescription>Most frequently reported symptoms</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={symptomsData.slice(0, 6)}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                            animationDuration={1200}
                            label={({ name, percent }: { name?: string; percent?: number }) => `${(name ?? "").split(" ").slice(0, 2).join(" ")} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {symptomsData.slice(0, 6).map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Housing Type Distribution</CardTitle>
                      <CardDescription>Types of housing reported by respondents</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={housingData} layout="vertical" margin={{ left: 50 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" className="text-xs" />
                          <YAxis dataKey="name" type="category" width={140} className="text-xs" tick={{ fontSize: 11 }} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="value" fill="hsl(262, 83%, 58%)" radius={[0, 6, 6, 0]} animationDuration={1200} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Row 3: Dust entry + Chest heaviness */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Dust Entry Frequency</CardTitle>
                      <CardDescription>How often outside dust enters homes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={dustData} margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="value" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} animationDuration={1200} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-base">Morning Chest Heaviness</CardTitle>
                      <CardDescription>Phlegm or heaviness reported in the morning</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={chestData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={100}
                            paddingAngle={4}
                            dataKey="value"
                            animationDuration={1200}
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          >
                            {chestData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Prediction Tab ── */}
          <TabsContent value="prediction" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle>Respiratory Risk Prediction</CardTitle>
                </div>
                <CardDescription>
                  Random Forest model trained on survey data (10 features, 200 estimators, 63.3% accuracy)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {filters ? (
                  <>
                    {/* Row 1 */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { key: "age_group", label: "Age Group", field: "Age Group" },
                        { key: "housing_type", label: "Housing Type", field: "Housing Type" },
                        { key: "dust_entry", label: "Dust Entry Frequency", field: "Dust Entry Frequency" },
                      ].map(({ key, label, field }) => (
                        <div key={key} className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">{label}</label>
                          <Select onValueChange={(v) => setPredInputs((p) => ({ ...p, [key]: v }))}>
                            <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
                            <SelectContent>
                              {filters[field]?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {/* Row 2 */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { key: "season", label: "Worst Pollution Season", field: "Worst Pollution Season" },
                        { key: "chest_heaviness", label: "Morning Chest Heaviness", field: "Morning Chest Heaviness" },
                        { key: "wheezing", label: "Wheezing Sound", field: "Wheezing Sound" },
                      ].map(({ key, label, field }) => (
                        <div key={key} className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">{label}</label>
                          <Select onValueChange={(v) => setPredInputs((p) => ({ ...p, [key]: v }))}>
                            <SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
                            <SelectContent>
                              {filters[field]?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {/* Row 3 */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { key: "eye_irritation", label: "Eye/Throat Irritation", field: "Eye/Throat Irritation" },
                        { key: "open_drains", label: "Open Drains Nearby", field: "Open Drains Nearby" },
                        { key: "foul_smell", label: "Foul Smell Daily", field: "Foul Smell Daily" },
                        { key: "construction", label: "Construction Pollution", field: "Construction Pollution" },
                      ].map(({ key, label, field }) => (
                        <div key={key} className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">{label}</label>
                          <Select onValueChange={(v) => setPredInputs((p) => ({ ...p, [key]: v }))}>
                            <SelectTrigger><SelectValue placeholder={`Select`} /></SelectTrigger>
                            <SelectContent>
                              {filters[field]?.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handlePredict}
                      disabled={predicting || Object.keys(predInputs).length < 10}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      {predicting ? "Running Model..." : "Run Risk Prediction"}
                    </Button>
                  </>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                )}

                {/* Prediction Result */}
                {predResult && (
                  <Card className={`border-2 ${predResult.risk_level === "Low Risk" ? "border-green-500/50 bg-green-500/5" :
                    predResult.risk_level === "Moderate Risk" ? "border-yellow-500/50 bg-yellow-500/5" :
                      "border-red-500/50 bg-red-500/5"
                    }`}>
                    <CardContent className="pt-6">
                      <div className="flex items-baseline gap-3">
                        <span className={`text-5xl font-extrabold ${predResult.risk_level === "Low Risk" ? "text-green-500" :
                          predResult.risk_level === "Moderate Risk" ? "text-yellow-500" :
                            "text-red-500"
                          }`}>
                          {predResult.probability}%
                        </span>
                        <Badge variant={
                          predResult.risk_level === "Low Risk" ? "outline" :
                            predResult.risk_level === "Moderate Risk" ? "secondary" :
                              "destructive"
                        }>
                          {predResult.risk_level}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Probability of visiting a doctor for respiratory issues
                      </p>
                      <Separator className="my-4" />
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        {Object.entries(predResult.inputs).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-muted-foreground">{k}</span>
                            <span className="font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── Footer ── */}
        <footer className="border-t pt-6 pb-8">
          <p className="text-center text-xs text-muted-foreground">
            Community Health & Air Quality Dashboard — British Council Climate Skills Project &middot;
            Data from {stats?.total_responses ?? "..."} survey responses
          </p>
        </footer>
      </main>
    </div>
  );
}
