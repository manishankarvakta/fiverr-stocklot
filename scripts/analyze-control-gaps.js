#!/usr/bin/env node
/**
 * Analyze Control Gaps Between Frontend and Backend
 * Identifies what frontend functionality lacks backend control and vice versa
 */

const fs = require('fs').promises;

async function analyzeControlGaps() {
  console.log('🔍 ANALYZING FRONTEND-BACKEND CONTROL MAPPING...\n');
  
  try {
    // Load communication audit results
    const frontendScan = JSON.parse(await fs.readFile('comm-scan.frontend.json', 'utf8'));
    const auditReport = JSON.parse(await fs.readFile('comm-report.json', 'utf8'));
    
    // Load backend endpoints from introspection
    const fetch = (await import('node-fetch')).default;
    const backendResponse = await fetch('http://localhost:8001/api/__introspection/endpoints');
    const backendData = await backendResponse.json();
    
    const frontendAPIs = new Set(frontendScan.discovered.apis);
    const backendEndpoints = backendData.endpoints.map(ep => ep.path);
    const unusedBackendEndpoints = new Set(auditReport.gaps.unusedInFrontend);
    
    console.log('📊 SUMMARY STATISTICS:');
    console.log(`   Frontend API Calls: ${frontendAPIs.size}`);
    console.log(`   Backend Endpoints: ${backendEndpoints.length}`);
    console.log(`   Unused Backend: ${unusedBackendEndpoints.size}`);
    console.log('');
    
    // Categorize frontend functionality
    const frontendCategories = {
      'Admin Controls': [],
      'User Authentication': [],
      'Organization Management': [],
      'Product Management': [],
      'Order & Payment': [],
      'Profile & Reviews': [],
      'Notifications': [],
      'Other': []
    };
    
    // Categorize backend capabilities
    const backendCategories = {
      'Admin Analytics': [],
      'Admin Moderation': [],
      'A/B Testing': [],
      'Seller Tools': [],
      'Buyer Tools': [],
      'System Management': [],
      'Reporting': [],
      'Other': []
    };
    
    // Categorize frontend APIs
    frontendAPIs.forEach(api => {
      if (api.includes('/admin/')) {
        frontendCategories['Admin Controls'].push(api);
      } else if (api.includes('/auth/')) {
        frontendCategories['User Authentication'].push(api);
      } else if (api.includes('/org')) {
        frontendCategories['Organization Management'].push(api);
      } else if (api.includes('/product') || api.includes('/species') || api.includes('/taxonomy')) {
        frontendCategories['Product Management'].push(api);
      } else if (api.includes('/checkout') || api.includes('/payouts') || api.includes('/orders')) {
        frontendCategories['Order & Payment'].push(api);
      } else if (api.includes('/profile') || api.includes('/reviews')) {
        frontendCategories['Profile & Reviews'].push(api);
      } else if (api.includes('/notifications')) {
        frontendCategories['Notifications'].push(api);
      } else {
        frontendCategories['Other'].push(api);
      }
    });
    
    // Categorize unused backend endpoints
    unusedBackendEndpoints.forEach(api => {
      if (api.includes('/admin/analytics') || api.includes('/admin/reports')) {
        backendCategories['Admin Analytics'].push(api);
      } else if (api.includes('/admin/') && (api.includes('/moderate') || api.includes('/approve') || api.includes('/suspend'))) {
        backendCategories['Admin Moderation'].push(api);
      } else if (api.includes('/ab-test')) {
        backendCategories['A/B Testing'].push(api);
      } else if (api.includes('/seller/') && !api.includes('/admin/')) {
        backendCategories['Seller Tools'].push(api);
      } else if (api.includes('/buyer/') && !api.includes('/admin/')) {
        backendCategories['Buyer Tools'].push(api);
      } else if (api.includes('/system/') || api.includes('/__')) {
        backendCategories['System Management'].push(api);
      } else if (api.includes('/export') || api.includes('/report')) {
        backendCategories['Reporting'].push(api);
      } else {
        backendCategories['Other'].push(api);
      }
    });
    
    console.log('🎛️ FRONTEND FUNCTIONALITY WITH BACKEND CONTROL:');
    console.log('='.repeat(60));
    Object.entries(frontendCategories).forEach(([category, apis]) => {
      if (apis.length > 0) {
        console.log(`\n📱 ${category} (${apis.length} APIs):`);
        apis.slice(0, 8).forEach(api => {
          console.log(`   ✅ ${api}`);
        });
        if (apis.length > 8) {
          console.log(`   ... and ${apis.length - 8} more`);
        }
      }
    });
    
    console.log('\n\n🔧 BACKEND CAPABILITIES WITHOUT FRONTEND CONTROL:');
    console.log('='.repeat(60));
    Object.entries(backendCategories).forEach(([category, apis]) => {
      if (apis.length > 0) {
        console.log(`\n⚙️ ${category} (${apis.length} endpoints):`);
        apis.slice(0, 10).forEach(api => {
          console.log(`   ❌ ${api}`);
        });
        if (apis.length > 10) {
          console.log(`   ... and ${apis.length - 10} more`);
        }
      }
    });
    
    // Identify specific control gaps
    console.log('\n\n🕳️ SPECIFIC CONTROL GAPS ANALYSIS:');
    console.log('='.repeat(60));
    
    // Frontend features that might need more backend support
    const potentialGaps = {
      'Frontend has basic admin, Backend has advanced admin': {
        frontend: frontendCategories['Admin Controls'].length,
        backend: backendCategories['Admin Analytics'].length + backendCategories['Admin Moderation'].length,
        gap: 'Frontend admin is basic CRUD, backend has advanced analytics & moderation'
      },
      'No seller advanced tools on frontend': {
        frontend: 0,
        backend: backendCategories['Seller Tools'].length,
        gap: 'Seller dashboard could leverage advanced seller tools'
      },
      'No buyer personalization on frontend': {
        frontend: 0,
        backend: backendCategories['Buyer Tools'].length,
        gap: 'Buyer experience could be enhanced with recommendations'
      },
      'No A/B testing in frontend': {
        frontend: 0,
        backend: backendCategories['A/B Testing'].length,
        gap: 'Frontend could implement A/B testing for optimization'
      }
    };
    
    Object.entries(potentialGaps).forEach(([description, data]) => {
      console.log(`\n📋 ${description}:`);
      console.log(`   Frontend endpoints: ${data.frontend}`);
      console.log(`   Backend endpoints: ${data.backend}`);
      console.log(`   Gap: ${data.gap}`);
    });
    
    // Component-specific analysis
    console.log('\n\n🧩 COMPONENT-SPECIFIC CONTROL ANALYSIS:');
    console.log('='.repeat(60));
    
    const componentAnalysis = frontendScan.componentApiMap || {};
    const highImpactComponents = Object.entries(componentAnalysis)
      .filter(([name, data]) => data.apis.length > 5)
      .sort((a, b) => b[1].apis.length - a[1].apis.length)
      .slice(0, 10);
      
    console.log('\n🎯 HIGH-IMPACT COMPONENTS (Top 10 by API usage):');
    highImpactComponents.forEach(([componentName, data]) => {
      console.log(`\n   ${componentName}:`);
      console.log(`     APIs used: ${data.apis.length}`);
      console.log(`     Could leverage: ${Math.floor(unusedBackendEndpoints.size / 10)} additional backend endpoints`);
      
      // Suggest specific enhancements
      if (componentName.includes('Admin')) {
        console.log(`     Enhancement: Add analytics dashboard, advanced moderation`);
      } else if (componentName.includes('Seller')) {
        console.log(`     Enhancement: Add performance metrics, inventory tools`);
      } else if (componentName.includes('Dashboard')) {
        console.log(`     Enhancement: Add personalization, recommendations`);
      }
    });
    
    // Summary recommendations
    console.log('\n\n🎯 CONTROL GAP RECOMMENDATIONS:');
    console.log('='.repeat(60));
    console.log('1. 🏆 HIGH PRIORITY - Admin Enhancement:');
    console.log('   • Integrate 25+ admin analytics endpoints');
    console.log('   • Add advanced moderation controls');
    console.log('   • Implement system management dashboard');
    console.log('');
    console.log('2. 📈 MEDIUM PRIORITY - Seller Tools:');
    console.log('   • Connect seller dashboard to performance analytics');
    console.log('   • Add inventory management tools');
    console.log('   • Implement promotion campaign controls');
    console.log('');
    console.log('3. 🎨 LOW PRIORITY - User Experience:');
    console.log('   • Add A/B testing for optimization');
    console.log('   • Implement buyer recommendations');
    console.log('   • Add personalization features');
    
    // Generate detailed report
    const detailedReport = {
      timestamp: new Date().toISOString(),
      summary: {
        frontend_controls: frontendAPIs.size,
        backend_capabilities: backendEndpoints.length,
        unused_backend: unusedBackendEndpoints.size,
        control_utilization_pct: Math.round((frontendAPIs.size / backendEndpoints.length) * 100)
      },
      frontend_by_category: frontendCategories,
      backend_unused_by_category: backendCategories,
      recommendations: {
        high_priority: ['Admin Analytics Integration', 'Advanced Moderation Tools'],
        medium_priority: ['Seller Performance Dashboard', 'Inventory Management'],
        low_priority: ['A/B Testing Implementation', 'Buyer Personalization']
      }
    };
    
    await fs.writeFile('control-gaps-analysis.json', JSON.stringify(detailedReport, null, 2));
    console.log('\n📄 Detailed analysis saved to: control-gaps-analysis.json');
    
  } catch (error) {
    console.error('❌ Error analyzing control gaps:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  analyzeControlGaps();
}

module.exports = { analyzeControlGaps };