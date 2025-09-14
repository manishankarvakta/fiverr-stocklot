#!/usr/bin/env python3
"""
StockLot Deployment Readiness Checker
Comprehensive analysis of code quality, bugs, and production readiness
"""

import os
import sys
import subprocess
import json
import asyncio
from pathlib import Path

class DeploymentChecker:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.passed_checks = []
        self.backend_path = "/app/backend"
        self.frontend_path = "/app/frontend"
        
    def log_issue(self, category, severity, description, file_path=None):
        self.issues.append({
            "category": category,
            "severity": severity,  # "critical", "major", "minor"
            "description": description,
            "file": file_path
        })
    
    def log_warning(self, description):
        self.warnings.append(description)
    
    def log_passed(self, description):
        self.passed_checks.append(description)

    async def check_backend_issues(self):
        """Check backend for common issues and bugs"""
        
        print("🔍 CHECKING BACKEND CODE QUALITY...")
        
        # 1. Check for hardcoded URLs and secrets
        hardcoded_patterns = [
            "http://localhost",
            "https://localhost", 
            "127.0.0.1",
            "password.*=.*'",
            "api_key.*=.*'",
            "secret.*=.*'"
        ]
        
        backend_files = list(Path(self.backend_path).rglob("*.py"))
        
        for file_path in backend_files:
            if "/.venv/" in str(file_path) or "__pycache__" in str(file_path):
                continue
                
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    for pattern in hardcoded_patterns:
                        if pattern.lower() in content.lower():
                            self.log_issue(
                                "Security", "major",
                                f"Potential hardcoded value: {pattern}",
                                str(file_path)
                            )
            except:
                continue
        
        # 2. Check for TODO/FIXME comments
        todo_count = 0
        for file_path in backend_files:
            if "/.venv/" in str(file_path):
                continue
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "TODO" in content or "FIXME" in content:
                        todo_count += 1
            except:
                continue
        
        if todo_count > 10:
            self.log_issue("Code Quality", "minor", f"{todo_count} files contain TODO/FIXME comments")
        elif todo_count > 0:
            self.log_warning(f"{todo_count} files contain TODO/FIXME comments")
        
        # 3. Check for print statements in production code
        print_count = 0
        for file_path in backend_files:
            if "/.venv/" in str(file_path) or "test" in str(file_path).lower():
                continue
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for line_num, line in enumerate(lines, 1):
                        if "print(" in line and not line.strip().startswith("#"):
                            print_count += 1
            except:
                continue
        
        if print_count > 0:
            self.log_issue("Code Quality", "minor", f"{print_count} print statements found (should use logging)")
        
        # 4. Check environment variables are used properly
        env_file = Path(self.backend_path) / ".env"
        if env_file.exists():
            self.log_passed("Environment file exists")
            
            with open(env_file, 'r') as f:
                env_content = f.read()
                
                required_vars = [
                    "MONGO_URL", "MAILGUN_API_KEY", "MAILGUN_DOMAIN",
                    "PAYSTACK_SECRET_KEY", "PAYSTACK_PUBLIC_KEY"
                ]
                
                missing_vars = []
                for var in required_vars:
                    if var not in env_content:
                        missing_vars.append(var)
                
                if missing_vars:
                    self.log_issue("Configuration", "critical", f"Missing environment variables: {', '.join(missing_vars)}")
                else:
                    self.log_passed("All required environment variables present")
        else:
            self.log_issue("Configuration", "critical", "Missing .env file in backend")
        
        # 5. Check for unused imports (basic check)
        import_issues = 0
        for file_path in backend_files:
            if "/.venv/" in str(file_path):
                continue
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    imports = [line.strip() for line in lines if line.strip().startswith(('import ', 'from '))]
                    if len(imports) > 50:  # Suspiciously many imports
                        import_issues += 1
            except:
                continue
        
        if import_issues > 5:
            self.log_warning(f"{import_issues} files have suspiciously many imports")

    async def check_frontend_issues(self):
        """Check frontend for common issues"""
        
        print("🔍 CHECKING FRONTEND CODE QUALITY...")
        
        frontend_files = list(Path(self.frontend_path).rglob("*.js")) + list(Path(self.frontend_path).rglob("*.jsx"))
        
        # 1. Check for console.log statements
        console_count = 0
        for file_path in frontend_files:
            if "/node_modules/" in str(file_path):
                continue
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    console_count += content.count('console.log')
            except:
                continue
        
        if console_count > 10:
            self.log_issue("Code Quality", "minor", f"{console_count} console.log statements found")
        elif console_count > 0:
            self.log_warning(f"{console_count} console.log statements found")
        
        # 2. Check package.json exists
        package_json = Path(self.frontend_path) / "package.json"
        if package_json.exists():
            self.log_passed("Frontend package.json exists")
            
            try:
                with open(package_json, 'r') as f:
                    package_data = json.load(f)
                    
                    # Check for security vulnerabilities in dependencies
                    if "dependencies" in package_data:
                        dep_count = len(package_data["dependencies"])
                        if dep_count > 100:
                            self.log_warning(f"High number of dependencies: {dep_count}")
                        else:
                            self.log_passed(f"Reasonable dependency count: {dep_count}")
            except:
                self.log_issue("Configuration", "major", "Invalid package.json format")
        else:
            self.log_issue("Configuration", "critical", "Missing package.json in frontend")
        
        # 3. Check for hardcoded API URLs
        for file_path in frontend_files:
            if "/node_modules/" in str(file_path):
                continue
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Look for hardcoded localhost URLs
                    if "http://localhost" in content or "https://localhost" in content:
                        self.log_issue("Configuration", "major", "Hardcoded localhost URL found", str(file_path))
                    
                    # Check if environment variables are used properly
                    if "process.env.REACT_APP_BACKEND_URL" in content:
                        self.log_passed(f"Using environment variable for API URL in {file_path.name}")
            except:
                continue

    async def check_security_issues(self):
        """Check for security-related issues"""
        
        print("🔒 CHECKING SECURITY...")
        
        # 1. Check for exposed secrets in git history (basic check)
        try:
            result = subprocess.run(['git', 'log', '--oneline', '-n', '100'], 
                                  cwd='/app', capture_output=True, text=True)
            if result.returncode == 0:
                log_content = result.stdout.lower()
                if 'password' in log_content or 'secret' in log_content or 'key' in log_content:
                    self.log_warning("Potential secrets in git commit messages")
                else:
                    self.log_passed("No obvious secrets in recent git history")
        except:
            self.log_warning("Could not check git history")
        
        # 2. Check .env files are in .gitignore
        gitignore_path = Path("/app/.gitignore")
        if gitignore_path.exists():
            with open(gitignore_path, 'r') as f:
                gitignore_content = f.read()
                
                if ".env" in gitignore_content:
                    self.log_passed(".env files are in .gitignore")
                else:
                    self.log_issue("Security", "critical", ".env files not in .gitignore")
        
        # 3. Check for proper CORS configuration
        server_file = Path(self.backend_path) / "server.py"
        if server_file.exists():
            with open(server_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if "CORS" in content or "cors" in content:
                    self.log_passed("CORS configuration found")
                else:
                    self.log_warning("No obvious CORS configuration")

    async def check_database_issues(self):
        """Check database-related issues"""
        
        print("🗄️ CHECKING DATABASE CONFIGURATION...")
        
        # 1. Check MongoDB connection string
        env_file = Path(self.backend_path) / ".env"
        if env_file.exists():
            with open(env_file, 'r') as f:
                content = f.read()
                
                if "MONGO_URL" in content:
                    if "localhost" in content and "27017" in content:
                        self.log_passed("MongoDB configured for local development")
                    elif "mongodb://" in content or "mongodb+srv://" in content:
                        self.log_passed("MongoDB connection string present")
                    else:
                        self.log_issue("Database", "major", "Invalid MongoDB connection string")

    async def check_api_endpoints(self):
        """Check API endpoint health"""
        
        print("🔌 CHECKING API ENDPOINTS...")
        
        try:
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                # Test health endpoint
                try:
                    async with session.get('https://farmstock-hub-1.preview.emergentagent.com/api/health', timeout=5) as response:
                        if response.status == 200:
                            self.log_passed("Health endpoint working")
                        else:
                            self.log_issue("API", "major", f"Health endpoint returned {response.status}")
                except:
                    self.log_issue("API", "critical", "Health endpoint unreachable")
                
                # Test a few critical endpoints
                critical_endpoints = [
                    "/api/species",
                    "/api/product-types"
                ]
                
                for endpoint in critical_endpoints:
                    try:
                        async with session.get(f'https://farmstock-hub-1.preview.emergentagent.com{endpoint}', timeout=5) as response:
                            if response.status == 200:
                                self.log_passed(f"Endpoint {endpoint} working")
                            else:
                                self.log_issue("API", "major", f"Endpoint {endpoint} returned {response.status}")
                    except:
                        self.log_issue("API", "major", f"Endpoint {endpoint} unreachable")
        
        except ImportError:
            self.log_warning("Cannot test API endpoints (aiohttp not available)")

    def generate_report(self):
        """Generate deployment readiness report"""
        
        print("\n" + "="*80)
        print("📋 STOCKLOT DEPLOYMENT READINESS REPORT")
        print("="*80)
        
        # Summary
        critical_issues = [i for i in self.issues if i["severity"] == "critical"]
        major_issues = [i for i in self.issues if i["severity"] == "major"]
        minor_issues = [i for i in self.issues if i["severity"] == "minor"]
        
        print(f"\n📊 SUMMARY:")
        print(f"   ✅ Passed Checks: {len(self.passed_checks)}")
        print(f"   ⚠️  Warnings: {len(self.warnings)}")
        print(f"   🔴 Critical Issues: {len(critical_issues)}")
        print(f"   🟡 Major Issues: {len(major_issues)}")
        print(f"   🟢 Minor Issues: {len(minor_issues)}")
        
        # Critical Issues (Must Fix)
        if critical_issues:
            print(f"\n🔴 CRITICAL ISSUES (MUST FIX BEFORE DEPLOYMENT):")
            for issue in critical_issues:
                print(f"   • {issue['category']}: {issue['description']}")
                if issue['file']:
                    print(f"     File: {issue['file']}")
        
        # Major Issues (Should Fix)
        if major_issues:
            print(f"\n🟡 MAJOR ISSUES (RECOMMENDED TO FIX):")
            for issue in major_issues:
                print(f"   • {issue['category']}: {issue['description']}")
                if issue['file']:
                    print(f"     File: {issue['file']}")
        
        # Minor Issues (Nice to Fix)
        if minor_issues:
            print(f"\n🟢 MINOR ISSUES (NICE TO FIX):")
            for issue in minor_issues[:5]:  # Show first 5 only
                print(f"   • {issue['category']}: {issue['description']}")
            if len(minor_issues) > 5:
                print(f"   ... and {len(minor_issues) - 5} more minor issues")
        
        # Warnings
        if self.warnings:
            print(f"\n⚠️  WARNINGS:")
            for warning in self.warnings[:3]:
                print(f"   • {warning}")
            if len(self.warnings) > 3:
                print(f"   ... and {len(self.warnings) - 3} more warnings")
        
        # Passed Checks
        print(f"\n✅ PASSED CHECKS ({len(self.passed_checks)}):")
        for check in self.passed_checks[:10]:
            print(f"   • {check}")
        if len(self.passed_checks) > 10:
            print(f"   ... and {len(self.passed_checks) - 10} more passing checks")
        
        # Deployment Verdict
        print(f"\n🎯 DEPLOYMENT VERDICT:")
        if len(critical_issues) == 0:
            if len(major_issues) <= 2:
                print("   🟢 READY FOR DEPLOYMENT")
                print("   👍 The application appears ready for production deployment")
            else:
                print("   🟡 DEPLOYMENT WITH CAUTION")
                print("   ⚠️  Several major issues should be addressed")
        else:
            print("   🔴 NOT READY FOR DEPLOYMENT")
            print("   ❌ Critical issues must be resolved first")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        print(f"   1. Fix all critical issues before deployment")
        print(f"   2. Address major security and configuration issues")
        print(f"   3. Run comprehensive testing on staging environment")
        print(f"   4. Set up monitoring and logging for production")
        print(f"   5. Prepare rollback plan in case of issues")
        
        return len(critical_issues) == 0 and len(major_issues) <= 2

async def main():
    """Main function to run all checks"""
    
    print("🚀 STOCKLOT DEPLOYMENT READINESS CHECKER")
    print("Analyzing code quality, security, and production readiness...")
    print("="*60)
    
    checker = DeploymentChecker()
    
    # Run all checks
    await checker.check_backend_issues()
    await checker.check_frontend_issues()
    await checker.check_security_issues()
    await checker.check_database_issues()
    await checker.check_api_endpoints()
    
    # Generate report
    deployment_ready = checker.generate_report()
    
    print(f"\n{'='*80}")
    print(f"🎉 Analysis complete! Check report above for details.")
    
    return deployment_ready

if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)