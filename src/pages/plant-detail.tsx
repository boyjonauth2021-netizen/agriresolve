import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetPlant, useGetPlantGrowthData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Droplets, ThermometerSun, Sun, FlaskConical, Sprout, 
  Wind, Zap, CheckCircle2, MessageSquareText, Leaf, Star
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

export default function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: plant, isLoading: isLoadingPlant } = useGetPlant(id!);
  const { data: growthData, isLoading: isLoadingGrowth } = useGetPlantGrowthData(id!);

  const [isApplying, setIsApplying] = useState(false);

  const handleApplySettings = async () => {
    setIsApplying(true);
    try {
      await fetch(`/api/esp32/apply/${id}`, { method: "POST" });
      toast({
        title: "Settings applied! 🌱",
        description: "Opening live sensor monitor…",
        variant: "default",
        className: "border-primary bg-primary/5 text-primary-foreground",
      });
      setLocation(`/monitor/${id}`);
    } catch {
      toast({
        title: "Could not apply settings",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleAskAssistant = () => {
    setLocation(`/assistant?plant=${id}`);
  };

  if (isLoadingPlant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl object-cover opacity-80" aria-hidden />
          <p className="text-muted-foreground text-lg">Loading plant data...</p>
        </div>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Plant not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Floating decorative leaves - background layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <span className="absolute top-16 right-8 text-6xl opacity-5 rotate-12 select-none">🌿</span>
        <span className="absolute top-1/3 left-4 text-5xl opacity-5 -rotate-20 select-none">🍃</span>
        <span className="absolute top-2/3 right-16 text-7xl opacity-5 rotate-45 select-none">🌱</span>
        <span className="absolute bottom-32 left-8 text-5xl opacity-5 rotate-12 select-none">🍀</span>
        <span className="absolute top-1/2 right-1/4 text-4xl opacity-5 -rotate-12 select-none">🌾</span>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-emerald-50 to-green-100/50 dark:from-primary/20 dark:via-emerald-950/30 dark:to-green-900/20 border-b border-primary/10">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-green-300/10 blur-2xl" />

        {/* Back button row */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-white/50 text-foreground/70">
              <ArrowLeft className="h-4 w-4" />
              Back to plants
            </Button>
          </Link>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Big emoji with glow ring */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
              <div className="relative w-20 h-20 rounded-2xl bg-white/80 dark:bg-white/10 shadow-xl flex items-center justify-center text-5xl border border-white/50 backdrop-blur-sm">
                {plant.emoji}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-primary/15 text-primary text-xs font-semibold rounded-full border border-primary/20 uppercase tracking-wide">
                  {plant.category}
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  Mauritius Approved
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-serif">{plant.name}</h1>
              <p className="text-sm text-muted-foreground italic mt-0.5">{plant.scientificName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="outline" 
              className="gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm border-primary/20 text-primary hover:bg-white/80 rounded-full px-5 shadow-sm"
              onClick={handleAskAssistant}
            >
              <MessageSquareText className="h-4 w-4" />
              Ask AI Assistant
            </Button>
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95"
              onClick={handleApplySettings}
              disabled={isApplying}
            >
              {isApplying ? <Zap className="h-4 w-4 animate-pulse" /> : <CheckCircle2 className="h-4 w-4" />}
              {isApplying ? "Applying..." : "Apply to ESP32"}
            </Button>
          </div>
        </div>

        {/* Harvest days banner strip */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-5">
          <p className="text-foreground/75 leading-relaxed max-w-2xl text-sm sm:text-base">
            {plant.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1.5 bg-white/70 dark:bg-white/10 backdrop-blur-sm text-foreground/80 text-sm font-medium rounded-full border border-white/50 shadow-sm flex items-center gap-1.5">
              <Sprout className="h-3.5 w-3.5 text-primary" />
              {plant.growthDays} Days to harvest
            </span>
            <span className="px-3 py-1.5 bg-white/70 dark:bg-white/10 backdrop-blur-sm text-foreground/80 text-sm font-medium rounded-full border border-white/50 shadow-sm flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-emerald-500" />
              Hydroponic Ready
            </span>
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-12">

        {/* Ideal Conditions Grid */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-emerald-400" />
            <h2 className="text-xl font-semibold font-serif flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Ideal Hydroponic Conditions
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <ConditionCard 
              icon={<FlaskConical className="h-5 w-5" />}
              title="pH Level"
              value={`${plant.conditions.phMin} – ${plant.conditions.phMax}`}
              color="blue"
            />
            <ConditionCard 
              icon={<Zap className="h-5 w-5" />}
              title="EC (mS/cm)"
              value={`${plant.conditions.ecMin} – ${plant.conditions.ecMax}`}
              color="yellow"
            />
            <ConditionCard 
              icon={<ThermometerSun className="h-5 w-5" />}
              title="Air Temp"
              value={`${plant.conditions.tempMin}°C – ${plant.conditions.tempMax}°C`}
              color="orange"
            />
            <ConditionCard 
              icon={<Droplets className="h-5 w-5" />}
              title="Water Temp"
              value={`${plant.conditions.waterTempMin}°C – ${plant.conditions.waterTempMax}°C`}
              color="cyan"
            />
            <ConditionCard 
              icon={<Sun className="h-5 w-5" />}
              title="Light"
              value={`${plant.conditions.lightHoursPerDay} hrs/day`}
              color="amber"
            />
          </div>
        </section>

        {/* Decorative divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <span className="text-xl opacity-40">🌿</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Nutrients & Tips */}
          <div className="md:col-span-1 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700 delay-200 fill-mode-both">
            <Card className="border-border/50 shadow-md bg-card/80 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <span className="text-lg">🧪</span>
                  Nutrient Needs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <NutrientRow label="Nitrogen (N)" level={plant.nutrients.nitrogen} />
                <NutrientRow label="Phosphorus (P)" level={plant.nutrients.phosphorus} />
                <NutrientRow label="Potassium (K)" level={plant.nutrients.potassium} />
                <NutrientRow label="Calcium (Ca)" level={plant.nutrients.calcium} />
                <NutrientRow label="Magnesium (Mg)" level={plant.nutrients.magnesium} />
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-md overflow-hidden bg-gradient-to-br from-primary/5 to-emerald-50/50 dark:from-primary/10 dark:to-emerald-950/20">
              <div className="h-1 bg-gradient-to-r from-primary to-emerald-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-serif text-primary flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plant.tips.map((tip, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-foreground/80 leading-relaxed">
                      <span className="mt-0.5 text-primary font-bold shrink-0 text-xs w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">{idx + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Mauritius tip card */}
            <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">🇲🇺</span>
                  <div>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Mauritius Climate Note</p>
                    <p className="text-xs text-amber-900/70 leading-relaxed">
                      Tropical heat in Mauritius can raise water temps quickly. 
                      Use a shaded reservoir and monitor EC closely during summer months (Nov–Mar).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Charts */}
          <div className="md:col-span-2 space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
            <Card className="border-border/50 shadow-md overflow-hidden bg-card/80">
              <div className="h-1 bg-gradient-to-r from-primary via-emerald-400 to-teal-400" />
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  Estimated Growth Timeline
                </CardTitle>
                <CardDescription>Height projection in cm over {plant.growthDays} days</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px] w-full">
                {!isLoadingGrowth && growthData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData.dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="day" 
                        tickFormatter={(val) => `Day ${val}`} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', background: 'hsl(var(--card))' }}
                        formatter={(value: number) => [`${value} cm`, 'Height']}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="heightCm" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorHeight)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-blue-100 dark:border-blue-900/30 shadow-sm overflow-hidden bg-gradient-to-br from-blue-50/80 to-card dark:from-blue-950/20">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <FlaskConical className="h-4 w-4" />
                    pH Progression
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[140px]">
                  {!isLoadingGrowth && growthData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={growthData.dataPoints} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="day" hide />
                        <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid hsl(var(--border))' }}
                          formatter={(v: number) => [v.toFixed(1), 'pH']}
                          labelFormatter={(l) => `Day ${l}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="phLevel" 
                          stroke="#3b82f6" 
                          strokeWidth={2.5} 
                          dot={false}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-yellow-100 dark:border-yellow-900/30 shadow-sm overflow-hidden bg-gradient-to-br from-yellow-50/80 to-card dark:from-yellow-950/20">
                <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-400" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                    <Zap className="h-4 w-4" />
                    EC Progression
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[140px]">
                  {!isLoadingGrowth && growthData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={growthData.dataPoints} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="day" hide />
                        <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid hsl(var(--border))' }}
                          formatter={(v: number) => [v.toFixed(2), 'EC mS/cm']}
                          labelFormatter={(l) => `Day ${l}`}
                        />
                        <Line 
                          type="step" 
                          dataKey="ecLevel" 
                          stroke="#eab308" 
                          strokeWidth={2.5} 
                          dot={false}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Systems banner */}
            <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/5 via-emerald-50/50 to-teal-50/50 dark:from-primary/10 dark:via-emerald-950/20 dark:to-teal-950/20 p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>💧</span> Compatible Hydroponic Systems
              </p>
              <div className="flex flex-wrap gap-2">
                {["DWC", "NFT", "Dutch Bucket", "Kratky", "Ebb & Flow"].map((sys) => (
                  <span key={sys} className="px-3 py-1 bg-white/70 dark:bg-white/10 text-foreground/80 text-xs font-medium rounded-full border border-primary/15 shadow-sm">
                    {sys}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const colorMap: Record<string, { bg: string; icon: string; border: string; bar: string }> = {
  blue:   { bg: "from-blue-50 to-blue-50/30 dark:from-blue-950/20",   icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",   border: "border-blue-100 dark:border-blue-900/30",   bar: "from-blue-400 to-cyan-400" },
  yellow: { bg: "from-yellow-50 to-yellow-50/30 dark:from-yellow-950/20", icon: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400", border: "border-yellow-100 dark:border-yellow-900/30", bar: "from-yellow-400 to-amber-400" },
  orange: { bg: "from-orange-50 to-orange-50/30 dark:from-orange-950/20", icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400", border: "border-orange-100 dark:border-orange-900/30", bar: "from-orange-400 to-red-400" },
  cyan:   { bg: "from-cyan-50 to-cyan-50/30 dark:from-cyan-950/20",   icon: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400",   border: "border-cyan-100 dark:border-cyan-900/30",   bar: "from-cyan-400 to-blue-400" },
  amber:  { bg: "from-amber-50 to-amber-50/30 dark:from-amber-950/20", icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/30",  bar: "from-amber-400 to-yellow-400" },
};

function ConditionCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className={`relative bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl overflow-hidden flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
      <div className={`h-1 bg-gradient-to-r ${c.bar}`} />
      <div className="px-4 pb-4 flex flex-col gap-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-0.5">{title}</p>
          <p className="font-bold text-foreground text-sm">{value}</p>
        </div>
      </div>
    </div>
  );
}

function NutrientRow({ label, level }: { label: string, level: string }) {
  const cfg: Record<string, { bar: string; badge: string; width: string }> = {
    "High":   { bar: "bg-red-400",    badge: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400",    width: "w-full" },
    "Medium": { bar: "bg-amber-400",  badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400", width: "w-2/3" },
    "Low":    { bar: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400", width: "w-1/3" },
  };
  const c = cfg[level] ?? { bar: "bg-muted", badge: "bg-muted text-muted-foreground border-border", width: "w-1/4" };

  return (
    <div className="space-y-1.5 pb-3 border-b border-border/40 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/80">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-md border font-semibold ${c.badge}`}>{level}</span>
      </div>
      <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
        <div className={`h-full ${c.bar} ${c.width} rounded-full transition-all duration-700`} />
      </div>
    </div>
  );
}
