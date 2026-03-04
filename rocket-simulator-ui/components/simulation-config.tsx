"use client";

import { useState } from "react";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEFAULT_PARAMS, type SimulationParams } from "@/lib/simulation-engine";

interface SimulationConfigProps {
  params: SimulationParams;
  onParamsChange: (params: SimulationParams) => void;
  disabled: boolean;
}

export function SimulationConfig({
  params,
  onParamsChange,
  disabled,
}: SimulationConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field: keyof SimulationParams, value: string) => {
    const numValue = parseFloat(value) || 0;
    onParamsChange({ ...params, [field]: numValue });
  };

  const handleReset = () => {
    onParamsChange(DEFAULT_PARAMS);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-left transition-colors hover:text-primary"
          disabled={disabled}
        >
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            Simulation Parameters
            {disabled && (
              <span className="text-xs text-muted-foreground">(Stop simulation to edit)</span>
            )}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pb-4">
          {/* Stage 1 */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Stage 1 - First Stage Booster
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="s1MaxThrust" className="text-xs">
                  Max Thrust (N)
                </Label>
                <Input
                  id="s1MaxThrust"
                  type="number"
                  value={params.s1MaxThrust}
                  onChange={(e) => handleChange("s1MaxThrust", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s1Propellant" className="text-xs">
                  Propellant Mass (kg)
                </Label>
                <Input
                  id="s1Propellant"
                  type="number"
                  value={params.s1Propellant}
                  onChange={(e) => handleChange("s1Propellant", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s1DryMass" className="text-xs">
                  Dry Mass (kg)
                </Label>
                <Input
                  id="s1DryMass"
                  type="number"
                  value={params.s1DryMass}
                  onChange={(e) => handleChange("s1DryMass", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s1BurnDuration" className="text-xs">
                  Burn Duration (ms)
                </Label>
                <Input
                  id="s1BurnDuration"
                  type="number"
                  value={params.s1BurnDuration}
                  onChange={(e) => handleChange("s1BurnDuration", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Stage 2 - Upper Stage
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="s2MaxThrust" className="text-xs">
                  Max Thrust (N)
                </Label>
                <Input
                  id="s2MaxThrust"
                  type="number"
                  value={params.s2MaxThrust}
                  onChange={(e) => handleChange("s2MaxThrust", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s2Propellant" className="text-xs">
                  Propellant Mass (kg)
                </Label>
                <Input
                  id="s2Propellant"
                  type="number"
                  value={params.s2Propellant}
                  onChange={(e) => handleChange("s2Propellant", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s2DryMass" className="text-xs">
                  Dry Mass (kg)
                </Label>
                <Input
                  id="s2DryMass"
                  type="number"
                  value={params.s2DryMass}
                  onChange={(e) => handleChange("s2DryMass", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s2Payload" className="text-xs">
                  Payload Mass (kg)
                </Label>
                <Input
                  id="s2Payload"
                  type="number"
                  value={params.s2Payload}
                  onChange={(e) => handleChange("s2Payload", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s2IgnitionTime" className="text-xs">
                  Ignition Time (ms)
                </Label>
                <Input
                  id="s2IgnitionTime"
                  type="number"
                  value={params.s2IgnitionTime}
                  onChange={(e) => handleChange("s2IgnitionTime", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="s2BurnDuration" className="text-xs">
                  Burn Duration (ms)
                </Label>
                <Input
                  id="s2BurnDuration"
                  type="number"
                  value={params.s2BurnDuration}
                  onChange={(e) => handleChange("s2BurnDuration", e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={disabled}
              className="text-xs"
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
