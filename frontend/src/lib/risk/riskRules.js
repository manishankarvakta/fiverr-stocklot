// Risk assessment for livestock marketplace

export function assessRisk(cartLines) {
  let score = 0;
  const reasons = [];
  const total = cartLines.reduce((sum, line) => sum + line.line_total, 0);

  // High value threshold
  if (total > 10000) {
    score += 3;
    reasons.push('High value > R10,000');
  }

  // Species-based risk scoring
  for (const line of cartLines) {
    // High-risk large animals
    if (line.species === 'CATTLE' || line.species === 'PIG') {
      score += 4;
      reasons.push(`${line.species} present - requires compliance`);
    }
    
    // Medium-risk small ruminants
    if (line.product_type === 'LIVE' && (line.species === 'SHEEP' || line.species === 'GOAT')) {
      score += 2;
      reasons.push('Live small ruminants - health certificates required');
    }
    
    // Export consignments - highest risk
    if (line.product_type === 'EXPORT') {
      score += 6;
      reasons.push('Export consignment - full compliance required');
    }
    
    // Abattoir processing
    if (line.product_type === 'ABATTOIR') {
      score += 3;
      reasons.push('Abattoir processing - health documentation required');
    }
    
    // Bulk quantities
    if (line.qty > 50) {
      score += 2;
      reasons.push('Bulk quantity - commercial transaction');
    }
  }

  // Determine gate level
  let gate = 'ALLOW';
  let kyc_required = 0;
  
  if (score >= 7) {
    gate = 'BLOCK';
    kyc_required = 1;
  } else if (score >= 3) {
    gate = 'STEPUP';
    kyc_required = 1;
  }

  return {
    score,
    reasons,
    gate,
    kyc_required,
    total_value: total
  };
}

export const RISK_CATEGORIES = {
  LOW: {
    label: 'Low Risk',
    color: 'bg-green-100 text-green-800',
    description: 'Standard livestock items under R5,000'
  },
  MEDIUM: {
    label: 'Medium Risk', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Higher value or regulated items - may require verification'
  },
  HIGH: {
    label: 'High Risk',
    color: 'bg-red-100 text-red-800', 
    description: 'Large animals, exports, or high-value transactions - KYC required'
  }
};

export function getRiskCategory(score) {
  if (score >= 7) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}