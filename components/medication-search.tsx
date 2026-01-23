"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchMedicationsByPrefix, type MedicationSearchResult, type APIError } from "@/lib/medication";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (medication: MedicationSearchResult) => void;
  placeholder?: string;
  className?: string;
};

export function MedicationSearch({ value, onChange, onSelect, placeholder = "Search for medication...", className }: Props) {
  const [searchResults, setSearchResults] = useState<MedicationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear results (so searching label doesn't stay up)
  useEffect(() => {
    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setError(null);
      setIsLoading(false);
      // Clear any pending search timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      return;
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    // Only search if input is at least 2 
    if (value.trim().length < 2) {
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set loading state
    setIsLoading(true);
    setError(null);

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchMedicationsByPrefix(value.trim(), 5);
        
        if (Array.isArray(results)) {
          setSearchResults(results);
          setShowResults(results.length > 0);
        } else {
          //API error
          const apiError = results as APIError;
          setError(apiError.message);
          setSearchResults([]);
          setShowResults(false);
        }
      } catch (err) {
        setError("Failed to search medications");
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

  // Close dropdown when clicking outside of the container (i think it looks better)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (medication: MedicationSearchResult) => {
    onChange(medication.name);
    setShowResults(false);
    if (onSelect) {
      onSelect(medication);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            onChange(newValue);
            // Only show results if there's text and we have results
            if (newValue.trim().length >= 2 && searchResults.length > 0) {
              setShowResults(true);
            } else if (!newValue.trim()) {
              // Immediately hide results when input is cleared, so the searching bar doesn't stay up 
              setShowResults(false);
            }
          }}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
          className="pl-9"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            Searching...
          </div>
        )}
      </div>

      {error && (
        <div className="mt-1 text-xs text-destructive">{error}</div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto border rounded-md bg-background shadow-lg">
          <div className="p-1">
            {searchResults.map((medication, index) => (
              <button
                key={`${medication.name}-${index}`}
                type="button"
                onClick={() => handleSelect(medication)}
                className="w-full text-left p-2 rounded hover:bg-accent transition-colors group"
              >
                <div className="font-medium">{medication.name}</div>
                {medication.brandName && medication.genericName && (
                  <div className="text-xs text-muted-foreground">
                    {medication.brandName === medication.name ? (
                      <div className="flex items-baseline gap-1">
                        <span>Generic:</span>
                        <span 
                          className="truncate inline-block max-w-full group-hover:max-w-none group-hover:whitespace-normal group-hover:break-words"
                          title={medication.genericName}
                        >
                          {(() => {
                            // Show first ingredient/word, or first 40 chars if it's a single long word
                            const firstComma = medication.genericName.indexOf(',');
                            const firstSpace = medication.genericName.indexOf(' ');
                            const hasMultiple = firstComma !== -1 || firstSpace !== -1;
                            
                            if (hasMultiple) {
                              // Show first ingredient/word
                              const firstPart = firstComma !== -1 
                                ? medication.genericName.substring(0, firstComma)
                                : medication.genericName.substring(0, firstSpace);
                              return `${firstPart}...`;
                            } else {
                              // Single long word - truncate to 40 chars
                              return medication.genericName.length > 40 
                                ? `${medication.genericName.substring(0, 40)}...` 
                                : medication.genericName;
                            }
                          })()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span>Brand:</span>
                        <span>{medication.brandName}</span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && value.trim().length >= 2 && !isLoading && searchResults.length === 0 && !error && (
        <div className="absolute z-50 w-full mt-1 border rounded-md bg-background shadow-lg">
          <div className="p-3 text-sm text-muted-foreground text-center">
            No medications found
          </div>
        </div>
      )}
    </div>
  );
}

