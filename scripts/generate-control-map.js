#!/usr/bin/env node
/**
 * Generate Control Coverage Map for StockLot
 * Maps backend endpoints to frontend UI consumers per work spec
 */

const fs = require('fs').promises;

const WORK_SPEC = {
  "epics": [
    {
      "key": "ADMIN_ANALYTICS_UI",
      "goal": "Expose all admin analytics endpoints in dashboards with charts and export",
      "routes": [
        { "path": "/admin/analytics/overview", "component": "AdminAnalyticsOverview" },
        { "path": "/admin/analytics/pdp", "component": "AdminAnalyticsPDP" },
        { "path": "/admin/analytics/sellers/:id", "component": "AdminSellerPerformance" },
        { "path": "/admin/reports/revenue", "component": "AdminRevenueReport" }
      ],
      "bind": [
        "GET /api/admin/analytics/daily",
        "GET /api/admin/analytics/pdp",
        "GET /api/admin/analytics/seller/{id}",
        "GET /api/admin/dashboard/stats",
        "GET /api/admin/reports/revenue",
        "POST /api/admin/reports/export"
      ],
      "sse": ["flags.updated", "fees.updated"],
      "ui": ["line/bar charts", "date range", "CSV export"],
      "tests": ["e2e_admin_analytics_overview.spec.ts"]
    },
    {
      "key": "ADVANCED_MODERATION_UI",
      "goal": "Granular moderation for users, listings, buy-requests, reviews, role approvals",
      "routes": [
        { "path": "/admin/moderation/users", "component": "UserModeration" },
        { "path": "/admin/moderation/listings", "component": "ListingsModeration" },
        { "path": "/admin/moderation/buy-requests", "component": "BuyRequestModeration" },
        { "path": "/admin/moderation/reviews", "component": "ReviewModeration" },
        { "path": "/admin/moderation/roles", "component": "RolesQueue" }
      ],
      "bind": [
        "POST /api/admin/users/{id}/suspend",
        "POST /api/admin/listings/{id}/approve", 
        "POST /api/admin/listings/{id}/reject",
        "POST /api/admin/buy-requests/{id}/moderate",
        "POST /api/admin/reviews/{id}/approve",
        "POST /api/admin/roles/requests/{id}/approve",
        "POST /api/admin/roles/requests/{id}/reject"
      ],
      "sse": ["inbox.new_message", "role.upgrade.approved", "role.upgrade.rejected"],
      "tests": ["e2e_admin_moderation_actions.spec.ts"]
    },
    {
      "key": "SELLER_GROWTH_TOOLS",
      "goal": "Seller performance, bulk inventory, promotions, offers",
      "routes": [
        { "path": "/seller/analytics", "component": "SellerAnalytics" },
        { "path": "/seller/inventory/bulk", "component": "InventoryBulkUpdate" },
        { "path": "/seller/promotions", "component": "SellerCampaigns" },
        { "path": "/seller/offers", "component": "SellerOffers" }
      ],
      "bind": [
        "GET /api/seller/analytics/performance",
        "POST /api/seller/inventory/bulk-update", 
        "GET /api/seller/promotion/campaigns",
        "POST /api/seller/promotion/campaigns",
        "GET /api/seller/offers",
        "POST /api/seller/offers"
      ],
      "sse": ["orders.updated", "fees.updated"],
      "tests": ["e2e_seller_growth.spec.ts"]
    },
    {
      "key": "AB_TESTING_UI",
      "goal": "Enable A/B tests on PDP and track events",
      "routes": [
        { "path": "/admin/experiments", "component": "AdminExperiments" },
        { "path": "/admin/experiments/:id", "component": "AdminExperimentResults" }
      ],
      "bind": [
        "GET /api/admin/ab-tests",
        "POST /api/admin/ab-tests", 
        "GET /api/admin/ab-tests/{id}/results",
        "GET /api/ab-test/pdp-config/{id}",
        "POST /api/ab-test/track-event"
      ],
      "sse": ["flags.updated"],
      "tests": ["e2e_admin_abtests.spec.ts"]
    },
    {
      "key": "BUYER_PERSONALIZATION",
      "goal": "Recommendations, wishlist, price alerts, advanced search",
      "routes": [
        { "path": "/buyer/wishlist", "component": "Wishlist" },
        { "path": "/alerts/prices", "component": "PriceAlerts" }
      ],
      "bind": [
        "GET /api/buyer/recommendations/similar",
        "GET /api/buyer/wishlist",
        "POST /api/buyer/wishlist",
        "DELETE /api/buyer/wishlist/{id}",
        "POST /api/buyer/price-alerts",
        "GET /api/buyer/search/advanced"
      ],
      "sse": ["flags.updated"],
      "tests": ["e2e_buyer_personalization.spec.ts"]
    }
  ],
  "coverage": {
    "min_ui_consumers_pct": 90,
    "critical_endpoints": [
      "/api/admin/analytics/daily",
      "/api/admin/listings/{id}/approve",
      "/api/seller/analytics/performance", 
      "/api/ab-test/pdp-config/{id}",
      "/api/buyer/recommendations/similar"
    ]
  }
};

async function generateControlMap() {
  console.log('🗺️ GENERATING CONTROL COVERAGE MAP...\n');
  
  try {
    // Load current communication state
    const fetch = (await import('node-fetch')).default;
    const backendResponse = await fetch('http://localhost:8001/api/__introspection/endpoints');
    const backendData = await backendResponse.json();
    
    const frontendScan = JSON.parse(await fs.readFile('comm-scan.frontend.json', 'utf8'));
    
    // Generate control mapping
    const controlMap = {
      timestamp: new Date().toISOString(),
      work_spec: WORK_SPEC,
      current_state: {
        backend_endpoints: backendData.endpoints.length,
        frontend_consumers: frontendScan.discovered.apis.length,
        coverage_pct: Math.round((frontendScan.discovered.apis.length / backendData.endpoints.length) * 100)
      },
      epic_analysis: {},
      backend_only: [],
      frontend_only: [],
      by_route: {},
      by_endpoint: {},
      sse_coverage: {},
      missing_components: [],
      missing_tests: []
    };
    
    // Analyze each epic
    const frontendAPIs = new Set(frontendScan.discovered.apis);
    const backendPaths = backendData.endpoints.map(ep => ep.path);
    const backendSet = new Set(backendPaths);
    
    WORK_SPEC.epics.forEach(epic => {
      const epicAnalysis = {
        key: epic.key,
        goal: epic.goal,
        routes_planned: epic.routes.length,
        endpoints_to_bind: epic.bind.length,
        endpoints_available: 0,
        endpoints_missing: [],
        ui_coverage: 0
      };
      
      // Check which endpoints exist in backend
      epic.bind.forEach(binding => {
        const [method, path] = binding.split(' ');
        const normalizedPath = path.replace(/\{([^}]+)\}/g, ':param');
        
        const backendHas = backendPaths.some(bp => {
          const normalizedBp = bp.replace(/\{([^}]+)\}/g, ':param');
          return normalizedBp === normalizedPath;
        });
        
        if (backendHas) {
          epicAnalysis.endpoints_available++;
        } else {
          epicAnalysis.endpoints_missing.push(binding);
        }
      });
      
      epicAnalysis.ui_coverage = Math.round((epicAnalysis.endpoints_available / epic.bind.length) * 100);
      controlMap.epic_analysis[epic.key] = epicAnalysis;
      
      // Track missing components and tests
      epic.routes.forEach(route => {
        controlMap.missing_components.push({
          epic: epic.key,
          component: route.component,
          path: route.path,
          status: 'TO_BE_SCAFFOLDED'
        });
      });
      
      epic.tests.forEach(test => {
        controlMap.missing_tests.push({
          epic: epic.key,
          test_file: test,
          status: 'TO_BE_CREATED'
        });
      });
    });
    
    // Find backend-only endpoints (not consumed by current frontend)
    backendPaths.forEach(path => {
      const isConsumed = frontendAPIs.has(path) || frontendAPIs.has(path.replace(/\{([^}]+)\}/g, ':param'));
      if (!isConsumed && !path.includes('__introspection')) {
        controlMap.backend_only.push(path);
      }
    });
    
    // Find frontend-only calls (no backend match)
    frontendScan.discovered.apis.forEach(api => {
      const hasBackend = backendPaths.some(bp => {
        const normalizedApi = api.replace(/:param/g, '{id}').replace(/\?.*$/, '');
        const normalizedBp = bp.replace(/:param/g, '{id}');
        return normalizedApi === normalizedBp;
      });
      
      if (!hasBackend) {
        controlMap.frontend_only.push(api);
      }
    });
    
    // SSE coverage analysis
    const sseTopicsFromEpics = new Set();
    WORK_SPEC.epics.forEach(epic => {
      epic.sse.forEach(topic => sseTopicsFromEpics.add(topic));
    });
    
    controlMap.sse_coverage = {
      topics_in_epics: Array.from(sseTopicsFromEpics),
      topics_currently_used: frontendScan.discovered.sseTopics,
      topics_to_wire: Array.from(sseTopicsFromEpics).filter(topic => 
        !frontendScan.discovered.sseTopics.includes(topic)
      )
    };
    
    // Generate by_endpoint mapping
    backendPaths.forEach(path => {
      controlMap.by_endpoint[path] = {
        current_consumers: frontendScan.discovered.apis.includes(path) ? ['existing_ui'] : [],
        planned_consumers: []
      };
      
      // Find which epic routes will consume this endpoint
      WORK_SPEC.epics.forEach(epic => {
        epic.bind.forEach(binding => {
          const [, bindPath] = binding.split(' ');
          if (bindPath.replace(/\{([^}]+)\}/g, ':param') === path.replace(/\{([^}]+)\}/g, ':param')) {
            epic.routes.forEach(route => {
              controlMap.by_endpoint[path].planned_consumers.push({
                epic: epic.key,
                route: route.path,
                component: route.component
              });
            });
          }
        });
      });
    });
    
    // Calculate coverage metrics
    const totalNonInternalEndpoints = backendPaths.filter(p => !p.includes('__introspection')).length;
    const endpointsWithConsumers = Object.values(controlMap.by_endpoint).filter(
      ep => ep.current_consumers.length > 0 || ep.planned_consumers.length > 0
    ).length;
    
    controlMap.coverage_metrics = {
      total_endpoints: totalNonInternalEndpoints,
      endpoints_with_consumers: endpointsWithConsumers,
      coverage_pct: Math.round((endpointsWithConsumers / totalNonInternalEndpoints) * 100),
      target_pct: WORK_SPEC.coverage.min_ui_consumers_pct,
      meets_target: endpointsWithConsumers >= (totalNonInternalEndpoints * WORK_SPEC.coverage.min_ui_consumers_pct / 100)
    };
    
    // Save control map
    await fs.writeFile('control-map.json', JSON.stringify(controlMap, null, 2));
    
    // Generate Markdown report
    const markdownReport = generateMarkdownReport(controlMap);
    await fs.writeFile('control-map.md', markdownReport);
    
    console.log('✅ Control map generated successfully!');
    console.log(`📊 Current Coverage: ${controlMap.current_state.coverage_pct}%`);
    console.log(`🎯 Planned Coverage: ${controlMap.coverage_metrics.coverage_pct}%`);
    console.log(`📋 Components to scaffold: ${controlMap.missing_components.length}`);
    console.log(`🧪 Tests to create: ${controlMap.missing_tests.length}`);
    
    return controlMap;
    
  } catch (error) {
    console.error('❌ Error generating control map:', error);
    process.exit(1);
  }
}

function generateMarkdownReport(controlMap) {
  const sections = [];
  
  sections.push('# 🗺️ StockLot Control Coverage Map');
  sections.push(`Generated: ${controlMap.timestamp}`);
  sections.push('');
  
  sections.push('## 📊 Coverage Summary');
  sections.push('| Metric | Current | Planned | Target |');
  sections.push('|--------|---------|---------|--------|');
  sections.push(`| Total Endpoints | ${controlMap.current_state.backend_endpoints} | ${controlMap.current_state.backend_endpoints} | - |`);
  sections.push(`| UI Consumers | ${controlMap.current_state.frontend_consumers} | ${controlMap.coverage_metrics.endpoints_with_consumers} | ${Math.round(controlMap.current_state.backend_endpoints * controlMap.work_spec.coverage.min_ui_consumers_pct / 100)} |`);
  sections.push(`| Coverage % | ${controlMap.current_state.coverage_pct}% | ${controlMap.coverage_metrics.coverage_pct}% | ${controlMap.work_spec.coverage.min_ui_consumers_pct}% |`);
  sections.push(`| Meets Target | ${controlMap.current_state.coverage_pct >= controlMap.work_spec.coverage.min_ui_consumers_pct ? '✅' : '❌'} | ${controlMap.coverage_metrics.meets_target ? '✅' : '❌'} | - |`);
  sections.push('');
  
  sections.push('## 🎯 Epic Analysis');
  Object.values(controlMap.epic_analysis).forEach(epic => {
    sections.push(`### ${epic.key}`);
    sections.push(`**Goal**: ${epic.goal}`);
    sections.push(`**Routes**: ${epic.routes_planned} planned`);
    sections.push(`**Endpoints**: ${epic.endpoints_available}/${epic.endpoints_to_bind} available (${epic.ui_coverage}%)`);
    
    if (epic.endpoints_missing.length > 0) {
      sections.push('**Missing Endpoints**:');
      epic.endpoints_missing.forEach(missing => {
        sections.push(`- ${missing}`);
      });
    }
    sections.push('');
  });
  
  sections.push('## 🧩 Components to Scaffold');
  sections.push('| Epic | Component | Route | Status |');
  sections.push('|------|-----------|-------|--------|');
  controlMap.missing_components.forEach(comp => {
    sections.push(`| ${comp.epic} | ${comp.component} | ${comp.path} | ${comp.status} |`);
  });
  sections.push('');
  
  sections.push('## 🧪 Tests to Create');
  controlMap.missing_tests.forEach(test => {
    sections.push(`- **${test.epic}**: ${test.test_file}`);
  });
  sections.push('');
  
  sections.push('## 📡 SSE Coverage');
  sections.push(`**Topics in Epics**: ${controlMap.sse_coverage.topics_in_epics.join(', ')}`);
  sections.push(`**Currently Used**: ${controlMap.sse_coverage.topics_currently_used.join(', ')}`);
  sections.push(`**To Wire**: ${controlMap.sse_coverage.topics_to_wire.join(', ')}`);
  sections.push('');
  
  return sections.join('\n');
}

if (require.main === module) {
  generateControlMap();
}

module.exports = { generateControlMap, WORK_SPEC };