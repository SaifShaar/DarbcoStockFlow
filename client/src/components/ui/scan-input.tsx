import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanInputProps {
  placeholder?: string;
  onScan?: (code: string) => void;
  className?: string;
  'data-testid'?: string;
}

export default function ScanInput({ 
  placeholder = "Scan or enter code...", 
  onScan, 
  className,
  'data-testid': testId 
}: ScanInputProps) {
  const [value, setValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isScanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isScanning]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onScan?.(value.trim());
      setValue("");
      setIsScanning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onScan?.(value.trim());
      setValue("");
      setIsScanning(false);
    }
  };

  if (isScanning) {
    return (
      <div className={cn("space-y-4", className)}>
        <form onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="scan-input"
            data-testid={testId}
            autoComplete="off"
          />
        </form>
        <div className="flex gap-2">
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex-1"
            data-testid="scan-submit"
          >
            Process
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsScanning(false);
              setValue("");
            }}
            data-testid="scan-cancel"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button 
      onClick={() => setIsScanning(true)}
      className={cn("w-full", className)}
      data-testid={testId}
    >
      <QrCode className="h-4 w-4 mr-2" />
      Scan Code
    </Button>
  );
}
