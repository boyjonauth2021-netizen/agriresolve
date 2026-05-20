import { useState, useMemo } from "react";
import { useListPlants } from "@/lib/api";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Leaf, Sprout, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [_, setLocation] = useLocation();
  const { data: plants = [], isLoading } = useListPlants();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const sortedPlants = useMemo(() => {
    return [...plants].sort((a, b) => a.name.localeCompare(b.name));
  }, [plants]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 flex flex-col">
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between z-10 sticky top-0 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Leaf className="h-6 w-6 fill-primary/20" />
          AgriResolve
        </div>
        <Link href="/assistant">
          <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
            <Sprout className="h-4 w-4" />
            AI Green Assistant
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '10s' }} />

        <div className="max-w-3xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-4">
            <Sun className="h-4 w-4 text-accent" />
            Designed for Mauritian Growers
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-tight">
            Grow your perfect <br />
            <span className="text-primary italic">kitchen garden</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personal hydroponic crop advisor. Select a plant to see precise growing conditions, nutrient needs, and track growth over time.
          </p>

          <div className="max-w-md mx-auto mt-12 bg-card p-2 rounded-2xl shadow-xl shadow-primary/5 border border-border/50 flex flex-col gap-2">
            <label className="text-sm font-medium text-left px-2 text-muted-foreground pt-2">
              Choose what you want to plant
            </label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-14 text-lg bg-background border-border/50 hover:bg-muted/50 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="text-muted-foreground">Loading plants...</span>
                  ) : value ? (
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{sortedPlants.find((plant) => plant.id === value)?.emoji}</span>
                      {sortedPlants.find((plant) => plant.id === value)?.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-normal">Search for a vegetable...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-border/50 shadow-2xl overflow-hidden">
                <Command>
                  <CommandInput placeholder="Search vegetables..." className="h-12 text-base" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No plant found.</CommandEmpty>
                    <CommandGroup>
                      {sortedPlants.map((plant) => (
                        <CommandItem
                          key={plant.id}
                          value={plant.name}
                          onSelect={() => {
                            setValue(plant.id);
                            setOpen(false);
                            setLocation(`/plant/${plant.id}`);
                          }}
                          className="text-base py-3 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-5 w-5 text-primary",
                              value === plant.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="text-2xl mr-3">{plant.emoji}</span>
                          {plant.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </main>
    </div>
  );
}
