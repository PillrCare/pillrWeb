export type OpenFDADrugLabel = {
  meta?: {
    results?: {
      total?: number;
      skip?: number;
      limit?: number;
    };
  };
  results?: Array<{
    openfda?: {
      brand_name?: string[];
      generic_name?: string[];
    };
    dosage_and_administration?: string | string[];
    adverse_reactions?: string | string[];
    warnings_and_precautions?: string | string[];
    drug_interactions?: string | string[];
  }>;
};

export type MedicationInfo = {
  name: string;
  brandName?: string;
  genericName?: string;
  dosages?: string[];
  sideEffects?: string[];
  warnings?: string[];
  drugInteractions?: string[];
};

export type APIError = {
  message: string;
  code?: number;
};

export type MedicationSearchResult = {
  name: string;
  brandName?: string;
  genericName?: string;
};

const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/label.json';

/**
 * Search for medications by prefix (for autocomplete)
 * @param searchTerm - The prefix to search for
 * @param limit - Maximum number of results to return (default: 5)
 * @returns Promise with array of medication search results or error
 */
export async function searchMedicationsByPrefix(
  searchTerm: string,
  limit: number = 5
): Promise<MedicationSearchResult[] | APIError> {
  if (!searchTerm.trim()) {
    return [];
  }

  try {
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // OpenFDA API research notes:
    // - Uses Lucene query syntax
    // - Field names are case-sensitive: openfda.brand_name, openfda.generic_name
    // - For array fields, need to search without quotes for partial matching
    // - OR queries need proper syntax: field1:term+OR+field2:term (URL encoded)
    
    // Based on debug logs: Need prefix matching (e.g., "oxyc" should match "OxyContin")
    // OpenFDA uses Lucene query syntax - use wildcard (*) for prefix matching
    // Format: openfda.brand_name:term*+OR+openfda.generic_name:term*
    // This searches for medications where EITHER brand_name OR generic_name STARTS WITH the term
    
    const searchQuery = `openfda.brand_name:${searchTermLower}*+OR+openfda.generic_name:${searchTermLower}*`;
    const searchUrl = `${OPENFDA_BASE_URL}?search=${searchQuery}&limit=${limit}`;
    
    const response = await fetch(searchUrl);
    
    // Handle rate limiting (this is 240 requests a minute, doubt we will hit thi)
    if (response.status === 429) {
      console.log('[OpenFDA Debug] Rate limited');
      return {
        message: 'API rate limit exceeded. Please try again in a moment. This should not happen.',
        code: 429,
      };
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.log('[OpenFDA Debug] HTTP Error:', response.status, response.statusText);
      console.log('[OpenFDA Debug] Error body:', errorText);
      
      // If 404, it means no matches found (which is valid - user might be typing)
      // dont just show error on this, just show nothing
      if (response.status === 404) {
        return [];
      }
      
      return {
        message: `Failed to fetch medication data: ${response.statusText}`,
        code: response.status,
      };
    }

    const data: OpenFDADrugLabel = await response.json();

    // Check if results are empty
    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Process results into search results format
    // Filter to only include medications where the FIRST WORD of brand_name or generic_name starts with the search term
    // was pretty weird when matching every word
    const results: MedicationSearchResult[] = [];
    const seenNames = new Set<string>();

    for (const drugLabel of data.results) {
      const brandName = drugLabel.openfda?.brand_name?.[0];
      const genericName = drugLabel.openfda?.generic_name?.[0];
      
      // Check if first word of brand name or generic name starts with search term
      const brandFirstWord = brandName?.toLowerCase().split(/\s+/)[0] || '';
      const genericFirstWord = genericName?.toLowerCase().split(/\s+/)[0] || '';
      
      const brandMatches = brandFirstWord.startsWith(searchTermLower);
      const genericMatches = genericFirstWord.startsWith(searchTermLower);
      
      // Only include if first word of brand OR generic name starts with search term
      if (brandMatches || genericMatches) {
        const name = brandName || genericName;
        
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          results.push({
            name,
            brandName: brandName || undefined,
            genericName: genericName || undefined,
          });

          if (results.length >= limit) break;
        }
      }
    }
    return results;
  } catch (error) {
    if (error instanceof Error) {
      return {
        message: `Network error: ${error.message}`,
      };
    }
    return {
      message: 'An unexpected error occurred while fetching medication data.',
    };
  }
}

/**
 * Search for medication information by name
 * @param medicationName - The name of the medication to search for
 * @returns Promise with medication information or error
 */
export async function searchMedication(medicationName: string): Promise<MedicationInfo | APIError> {
  if (!medicationName.trim()) {
    return { message: 'Please enter a medication name' };
  }

  try {
    const medicationNameLower = medicationName.toLowerCase().trim();
    
    // Use the same working query format as searchMedicationsByPrefix
    // For exact match, we can use quotes or no quotes - both work
    const searchQuery = `openfda.brand_name:"${medicationNameLower}"+OR+openfda.generic_name:"${medicationNameLower}"`;
    const searchUrl = `${OPENFDA_BASE_URL}?search=${searchQuery}&limit=1`;

    const response = await fetch(searchUrl);

    // Handle rate limiting
    if (response.status === 429) {
      return {
        message: 'API rate limit exceeded. Please try again in a moment.',
        code: 429,
      };
    }

    // Handle other HTTP errors
    if (!response.ok) {
      if (response.status === 404) {
        return {
          message: `No medication found with the name "${medicationName}". Please check the spelling and try again.`,
        };
      }
      return {
        message: `Failed to fetch medication data: ${response.statusText}`,
        code: response.status,
      };
    }

    const data: OpenFDADrugLabel = await response.json();

    // Check if results are empty
    if (!data.results || data.results.length === 0) {
      return {
        message: `No medication found with the name "${medicationName}". Please check the spelling and try again.`,
      };
    }

    // Process the first result
    const drugLabel = data.results[0];
    return processDrugLabel(drugLabel);
  } catch (error) {
    if (error instanceof Error) {
      return {
        message: `Network error: ${error.message}`,
      };
    }
    return {
      message: 'An unexpected error occurred while fetching medication data.',
    };
  }
}

/**
 * Process raw drug label data into a more usable format
 */
function processDrugLabel(drugLabel: any): MedicationInfo {
  const brandName = drugLabel.openfda?.brand_name?.[0];
  const genericName = drugLabel.openfda?.generic_name?.[0];
  const name = brandName || genericName || 'Unknown Medication';

  // Extract dosages
  const dosages: string[] = [];
  if (drugLabel.dosage_and_administration) {
    if (Array.isArray(drugLabel.dosage_and_administration)) {
      dosages.push(...drugLabel.dosage_and_administration);
    } else if (typeof drugLabel.dosage_and_administration === 'string') {
      dosages.push(drugLabel.dosage_and_administration);
    }
  }

  // Extract side effects from adverse_reactions or warnings
  const sideEffects: string[] = [];
  if (drugLabel.adverse_reactions) {
    if (Array.isArray(drugLabel.adverse_reactions)) {
      sideEffects.push(...drugLabel.adverse_reactions);
    } else if (typeof drugLabel.adverse_reactions === 'string') {
      sideEffects.push(drugLabel.adverse_reactions);
    }
  }

  // Extract warnings
  const warnings: string[] = [];
  if (drugLabel.warnings_and_precautions) {
    if (Array.isArray(drugLabel.warnings_and_precautions)) {
      warnings.push(...drugLabel.warnings_and_precautions);
    } else if (typeof drugLabel.warnings_and_precautions === 'string') {
      warnings.push(drugLabel.warnings_and_precautions);
    }
  }

  // If no side effects in adverse_reactions, use warnings
  if (sideEffects.length === 0 && warnings.length > 0) {
    sideEffects.push(...warnings);
  }

  // Extract drug interactions
  const drugInteractions: string[] = [];
  if (drugLabel.drug_interactions) {
    if (Array.isArray(drugLabel.drug_interactions)) {
      drugInteractions.push(...drugLabel.drug_interactions);
    } else if (typeof drugLabel.drug_interactions === 'string') {
      drugInteractions.push(drugLabel.drug_interactions);
    }
  }


  // we can store this in the db, and just reference it when needed
  //or we can just save the name and hit the api when needed
  return {
    name,
    brandName,
    genericName,
    dosages,
    sideEffects,
    warnings: warnings.length > 0 ? warnings : undefined,
    drugInteractions: drugInteractions.length > 0 ? drugInteractions : undefined,
  };
}

