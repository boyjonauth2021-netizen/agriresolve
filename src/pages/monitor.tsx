import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useGetPlant } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Thermometer, Droplets, FlaskConical, Zap,
  Wind, Sprout, Lightbulb, RefreshCw, Wifi, WifiOff,
  CheckCircle2, AlertTriangle, XCircle, Activity
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SensorReading {
  plantId: string;
  airTemp?: number;
  waterTemp?: number;
  ph?: number;
  ec?: number;
  humidity?: number;
  tds?: number;
  lightIntensity?: number;
  pump?: boolean;
  light?: boolean;
  fan?: boolean;
  nutrientPump?: boolean;
  timestamp?: string;
}

// ---------------------------------------------------------------------------
// Status helper — compares a value to an ideal range
// ---------------------------------------------------------------------------
type Status = "good" | "warn" | "bad" | "unknown";

function getStatus(value: number | undefined, min: number, max: number): Status {
  if (value === undefined) return "unknown";
  if (value >= min && value <= max) return "good";
  const margin = (max - min) * 0.15;
  if (value >= min - margin && value <= max + margin) return "warn";
  return "bad";
}

const statusStyles: Record<Status, { badge: string; glow: string; icon: React.ReactNode; label: string }> = {
  good:    { badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",  glow: "shadow-emerald-100 dark:shadow-emerald-900/20", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "In range" },
  warn:    { badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",            glow: "shadow-amber-100 dark:shadow-amber-900/20",   icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,  label: "Marginal" },
  bad:     { badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400",                      glow: "shadow-red-100 dark:shadow-red-900/20",         icon: <XCircle className="h-4 w-4 text-red-500" />,          label: "Out of range" },
  unknown: { badge: "bg-muted text-muted-foreground border-border",                                                     glow: "",                                              icon: <Activity className="h-4 w-4 text-muted-foreground" />, label: "Waiting…" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Monitor() {
  const { plantId } = useParams<{ plantId: string }>();
  const { data: plant } = useGetPlant(plantId!);

  const [reading, setReading] = useState<SensorReading | null>(null);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReadings = useCallback(async () => {
    try {
      const res = await fetch(`/api/sensors/readings?plantId=${plantId}`);
      if (res.ok) {
        const data: SensorReading = await res.json();
        setReading(data);
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    }
    setLastPoll(new Date());
  }, [plantId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReadings();
    setIsRefreshing(false);
  };

  // Poll every 3 seconds
  useEffect(() => {
    fetchReadings();
    const id = setInterval(fetchReadings, 3000);
    return () => clearInterval(id);
  }, [fetchReadings]);

  const c = plant?.conditions;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <span className="absolute top-16 right-8 text-6xl opacity-5 rotate-12 select-none">📡</span>
        <span className="absolute bottom-32 left-8 text-5xl opacity-5 -rotate-12 select-none">🌱</span>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-emerald-50 to-green-100/50 dark:from-primary/20 dark:via-emerald-950/30 border-b border-primary/10">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-4">
          <Link href={`/plant/${plantId}`}>
            <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-white/50 text-foreground/70">
              <ArrowLeft className="h-4 w-4" />
              Back to {plant?.name ?? "plant"}
            </Button>
          </Link>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
              <div className="relative w-14 h-14 rounded-xl bg-white/80 dark:bg-white/10 shadow-lg flex items-center justify-center text-3xl border border-white/50">
                {plant?.emoji ?? "🌿"}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif text-foreground">
                {plant?.name ?? plantId} — Live Monitor
              </h1>
              <p className="text-sm text-muted-foreground">Real-time sensor feedback from your hydroponic system</p>
            </div>
          </div>

          {/* Connection status + refresh */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${connected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"}`}>
              {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {connected ? "ESP32 Connected" : "Waiting for ESP32"}
            </div>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}
              className="rounded-full bg-white/60 backdrop-blur-sm border-primary/20">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {lastPoll && (
          <p className="relative z-10 max-w-6xl mx-auto px-6 pb-3 text-xs text-muted-foreground">
            Last updated: {lastPoll.toLocaleTimeString()} · Auto-refreshes every 3 seconds
          </p>
        )}
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* No data yet */}
        {!reading && (
          <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
            <CardContent className="py-12 text-center space-y-4">
              <div className="text-5xl animate-pulse">📡</div>
              <p className="text-lg font-semibold text-foreground/70">Waiting for sensor data</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your ESP32 should POST JSON to <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/api/sensors/readings</code>. 
                See the connection guide below.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sensor readings grid */}
        {reading && (
          <>
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-emerald-400" />
                <h2 className="text-xl font-semibold font-serif">Sensor Readings</h2>
                {plant && <span className="text-xs text-muted-foreground">vs. ideal ranges for {plant.name}</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Air Temperature */}
                <SensorCard
                  icon={<Thermometer className="h-5 w-5" />}
                  label="Air Temperature"
                  value={reading.airTemp}
                  unit="°C"
                  ideal={c ? `${c.tempMin}–${c.tempMax}°C` : undefined}
                  status={getStatus(reading.airTemp, c?.tempMin ?? 18, c?.tempMax ?? 30)}
                  color="orange"
                />

                {/* Water Temperature */}
                <SensorCard
                  icon={<Droplets className="h-5 w-5" />}
                  label="Water Temperature"
                  value={reading.waterTemp}
                  unit="°C"
                  ideal={c ? `${c.waterTempMin}–${c.waterTempMax}°C` : undefined}
                  status={getStatus(reading.waterTemp, c?.waterTempMin ?? 18, c?.waterTempMax ?? 24)}
                  color="cyan"
                />

                {/* pH */}
                <SensorCard
                  icon={<FlaskConical className="h-5 w-5" />}
                  label="pH Level"
                  value={reading.ph}
                  unit="pH"
                  ideal={c ? `${c.phMin}–${c.phMax}` : undefined}
                  status={getStatus(reading.ph, c?.phMin ?? 5.5, c?.phMax ?? 6.5)}
                  color="blue"
                />

                {/* EC */}
                <SensorCard
                  icon={<Zap className="h-5 w-5" />}
                  label="Electrical Conductivity"
                  value={reading.ec}
                  unit="mS/cm"
                  ideal={c ? `${c.ecMin}–${c.ecMax} mS/cm` : undefined}
                  status={getStatus(reading.ec, c?.ecMin ?? 2, c?.ecMax ?? 4)}
                  color="yellow"
                />

                {/* Humidity */}
                <SensorCard
                  icon={<Wind className="h-5 w-5" />}
                  label="Humidity"
                  value={reading.humidity}
                  unit="%"
                  ideal="50–80%"
                  status={getStatus(reading.humidity, 50, 80)}
                  color="teal"
                />

                {/* TDS */}
                <SensorCard
                  icon={<Activity className="h-5 w-5" />}
                  label="TDS (Nutrient Strength)"
                  value={reading.tds}
                  unit="ppm"
                  ideal="800–2000 ppm"
                  status={getStatus(reading.tds, 800, 2000)}
                  color="purple"
                />
              </div>
            </section>

            {/* Actuator states */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-400" />
                <h2 className="text-xl font-semibold font-serif">Actuator States</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ActuatorCard icon="💧" label="Water Pump" active={reading.pump} />
                <ActuatorCard icon="💡" label="LED Light" active={reading.light} />
                <ActuatorCard icon="🌀" label="Fan" active={reading.fan} />
                <ActuatorCard icon="🧪" label="Nutrient Pump" active={reading.nutrientPump} />
              </div>
            </section>

            {/* Raw timestamp */}
            {reading.timestamp && (
              <p className="text-xs text-muted-foreground text-center">
                Last reading from ESP32: {new Date(reading.timestamp).toLocaleString()}
              </p>
            )}
          </>
        )}

        {/* ESP32 connection guide */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-slate-400 to-slate-300" />
            <h2 className="text-xl font-semibold font-serif">ESP32 Connection Guide</h2>
          </div>
          <Card className="border-border/50 bg-slate-950 dark:bg-slate-900 text-slate-100 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-slate-500 to-slate-400" />
            <CardContent className="pt-5 space-y-4">
              <p className="text-xs text-slate-400 font-mono">
                // POST to this URL from your ESP32 every few seconds:
              </p>
              <code className="block text-sm text-emerald-400 font-mono">
                POST /api/sensors/readings
              </code>
              <p className="text-xs text-slate-400 font-mono mt-1">// JSON body (add only the fields your sensors support):</p>
              <pre className="text-xs text-slate-200 font-mono bg-slate-900/50 rounded-lg p-4 overflow-x-auto leading-relaxed">{`{
  "plantId": "${plantId}",
  "airTemp": 26.5,       // °C  — DHT22 / BME280
  "waterTemp": 22.1,     // °C  — DS18B20 waterproof probe
  "ph": 6.2,             // pH  — analog pH sensor module
  "ec": 3.4,             // mS/cm — EC/TDS module
  "humidity": 65,        // %   — DHT22 / BME280
  "tds": 1700,           // ppm — TDS sensor
  "pump": true,          // bool — relay state
  "light": true,         // bool — relay state
  "fan": false,          // bool — relay state
  "nutrientPump": false  // bool — relay state
}`}</pre>
              <p className="text-xs text-slate-400 font-mono">
                // Arduino WiFiClientSecure or HTTPClient library — use your Replit HTTPS URL
              </p>
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const colorMap: Record<string, { bar: string; icon: string; cardBg: string }> = {
  orange: { bar: "from-orange-400 to-red-400",   icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400",  cardBg: "from-orange-50/60" },
  cyan:   { bar: "from-cyan-400 to-blue-400",     icon: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400",          cardBg: "from-cyan-50/60" },
  blue:   { bar: "from-blue-400 to-indigo-400",   icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",          cardBg: "from-blue-50/60" },
  yellow: { bar: "from-yellow-400 to-amber-400",  icon: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400",  cardBg: "from-yellow-50/60" },
  teal:   { bar: "from-teal-400 to-emerald-400",  icon: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",          cardBg: "from-teal-50/60" },
  purple: { bar: "from-purple-400 to-violet-400", icon: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",  cardBg: "from-purple-50/60" },
};

function SensorCard({
  icon, label, value, unit, ideal, status, color,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  unit: string;
  ideal?: string;
  status: Status;
  color: string;
}) {
  const c = colorMap[color] ?? colorMap.blue;
  const s = statusStyles[status];

  return (
    <div className={`relative bg-gradient-to-br ${c.cardBg} to-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md ${s.glow} transition-all`}>
      <div className={`h-1 bg-gradient-to-r ${c.bar}`} />
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.badge}`}>
            {s.icon}
            {s.label}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-0.5">
            {value !== undefined ? (
              <>{Number(value).toFixed(1)}<span className="text-base font-normal text-muted-foreground ml-1">{unit}</span></>
            ) : (
              <span className="text-lg text-muted-foreground animate-pulse">—</span>
            )}
          </p>
          {ideal && (
            <p className="text-xs text-muted-foreground mt-1">
              Ideal: <span className="font-medium text-foreground/70">{ideal}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActuatorCard({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  const isUnknown = active === undefined;
  return (
    <div className={`rounded-2xl border p-4 flex flex-col items-center gap-2 text-center transition-all shadow-sm ${
      isUnknown ? "border-border/40 bg-muted/30" :
      active    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30" :
                  "border-border/40 bg-muted/40"
    }`}>
      <span className={`text-2xl transition-all ${active ? "" : "opacity-40 grayscale"}`}>{icon}</span>
      <p className="text-xs font-semibold text-foreground/80">{label}</p>
      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
        isUnknown ? "text-muted-foreground border-border bg-muted" :
        active    ? "text-emerald-700 border-emerald-200 bg-emerald-100 dark:text-emerald-400 dark:border-emerald-800" :
                    "text-foreground/50 border-border bg-muted"
      }`}>
        {isUnknown ? "—" : active ? "ON" : "OFF"}
      </span>
    </div>
  );
}
