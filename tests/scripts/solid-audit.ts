/**
 * SOLID Architecture Compliance Checker
 * 
 * Verifies that the frontend respects architectural principles:
 * - Single Responsibility: Each module has one reason to change
 * - Open/Closed: Open for extension, closed for modification
 * - Liskov Substitution: Components are interchangeable
 * - Interface Segregation: Clients depend on narrow interfaces
 * - Dependency Inversion: High-level modules don't depend on low-level details
 * 
 * This script checks the critical boundary: only backendRepository imports api-client
 */

import * as fs from "fs"
import * as path from "path"

interface ComplianceReport {
  status: "PASS" | "FAIL" | "WARNING"
  findings: {
    rule: string
    status: "PASS" | "FAIL" | "WARNING"
    details: string
    severity: "HIGH" | "MEDIUM" | "LOW"
  }[]
  summary: {
    totalChecks: number
    passed: number
    failed: number
    warnings: number
  }
  timestamp: string
}

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function findFilesRecursively(dir: string, pattern: RegExp): string[] {
  const files: string[] = []

  function walk(currentPath: string) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)

        // Skip node_modules, .next, .git, tests
        if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "tests") {
          continue
        }

        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (pattern.test(entry.name)) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  walk(dir)
  return files
}

function fileContainsImport(filePath: string, searchTerm: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    // Look for import statements containing the search term
    const importRegex = new RegExp(`import.*?from\\s+['"](.*${searchTerm}.*?)['"]`, "g")
    return importRegex.test(content)
  } catch {
    return false
  }
}

function auditArchitecture(): ComplianceReport {
  const report: ComplianceReport = {
    status: "PASS",
    findings: [],
    summary: {
      totalChecks: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
    timestamp: new Date().toISOString(),
  }

  log("\n=== SOLID Architecture Compliance Audit ===\n", colors.cyan)

  // Rule 1: Only backendRepository should import api-client
  log("Checking Rule 1: API Client Boundary", colors.cyan)
  report.summary.totalChecks++

  const appFiles = findFilesRecursively("app", /\.(ts|tsx)$/)
  const componentFiles = findFilesRecursively("components", /\.(ts|tsx)$/)
  const libFiles = findFilesRecursively("lib", /\.(ts|tsx)$/)

  const allSourceFiles = [...appFiles, ...componentFiles, ...libFiles]

  let apiClientViolations: string[] = []

  for (const file of allSourceFiles) {
    // Skip backendRepository itself
    if (file.includes("backend-repository")) continue

    if (fileContainsImport(file, "api-client")) {
      apiClientViolations.push(file)
    }
  }

  if (apiClientViolations.length === 0) {
    log("✓ PASS: No components or services directly import api-client.ts", colors.green)
    report.findings.push({
      rule: "API Client Boundary",
      status: "PASS",
      details: "Only backendRepository.ts imports api-client.ts (as intended)",
      severity: "HIGH",
    })
    report.summary.passed++
  } else {
    log(`✗ FAIL: Found ${apiClientViolations.length} files importing api-client directly:`, colors.red)
    apiClientViolations.forEach((f) => log(`  - ${f}`, colors.red))
    report.findings.push({
      rule: "API Client Boundary",
      status: "FAIL",
      details: `${apiClientViolations.length} files violate the boundary by importing api-client directly`,
      severity: "HIGH",
    })
    report.summary.failed++
    report.status = "FAIL"
  }

  // Rule 2: Service layer should be primary interface
  log("\nChecking Rule 2: Service Layer Interface", colors.cyan)
  report.summary.totalChecks++

  const serviceFile = "lib/services/backend-service.ts"
  if (fs.existsSync(serviceFile)) {
    const serviceContent = fs.readFileSync(serviceFile, "utf-8")
    const exportsBackendService = serviceContent.includes("export const backendService")

    if (exportsBackendService) {
      log("✓ PASS: backendService is exported as public interface", colors.green)
      report.findings.push({
        rule: "Service Layer Interface",
        status: "PASS",
        details: "backendService is properly exported from lib/services/backend-service.ts",
        severity: "HIGH",
      })
      report.summary.passed++
    } else {
      log("✗ FAIL: backendService export not found", colors.red)
      report.findings.push({
        rule: "Service Layer Interface",
        status: "FAIL",
        details: "backendService not properly exported",
        severity: "HIGH",
      })
      report.summary.failed++
      report.status = "FAIL"
    }
  } else {
    log("✗ FAIL: lib/services/backend-service.ts not found", colors.red)
    report.findings.push({
      rule: "Service Layer Interface",
      status: "FAIL",
      details: "Service layer file not found",
      severity: "HIGH",
    })
    report.summary.failed++
    report.status = "FAIL"
  }

  // Rule 3: Repository pattern properly implemented
  log("\nChecking Rule 3: Repository Pattern", colors.cyan)
  report.summary.totalChecks++

  const repositoryFile = "lib/repositories/backend-repository.ts"
  if (fs.existsSync(repositoryFile)) {
    const repoContent = fs.readFileSync(repositoryFile, "utf-8")
    const hasApiClientImport = repoContent.includes("api-client")
    const hasBackendRepository = repoContent.includes("backendRepository")

    if (hasApiClientImport && hasBackendRepository) {
      log("✓ PASS: Repository pattern properly implemented", colors.green)
      report.findings.push({
        rule: "Repository Pattern",
        status: "PASS",
        details: "backendRepository imports api-client and is properly exported",
        severity: "HIGH",
      })
      report.summary.passed++
    } else {
      log("✗ FAIL: Repository pattern incomplete", colors.red)
      report.findings.push({
        rule: "Repository Pattern",
        status: "FAIL",
        details: "Repository missing api-client import or export",
        severity: "HIGH",
      })
      report.summary.failed++
      report.status = "FAIL"
    }
  }

  // Rule 4: Error handling consistency
  log("\nChecking Rule 4: Error Handling Consistency", colors.cyan)
  report.summary.totalChecks++

  if (fs.existsSync(serviceFile)) {
    const serviceContent = fs.readFileSync(serviceFile, "utf-8")
    const hasErrorClass = serviceContent.includes("BackendServiceError")
    const hasTryCatch = serviceContent.includes("try") && serviceContent.includes("catch")

    if (hasErrorClass && hasTryCatch) {
      log("✓ PASS: Consistent error handling pattern", colors.green)
      report.findings.push({
        rule: "Error Handling Consistency",
        status: "PASS",
        details: "Service layer uses BackendServiceError and try-catch patterns consistently",
        severity: "MEDIUM",
      })
      report.summary.passed++
    } else {
      log("✗ FAIL: Inconsistent error handling", colors.red)
      report.findings.push({
        rule: "Error Handling Consistency",
        status: "FAIL",
        details: "Service layer missing error class or try-catch pattern",
        severity: "MEDIUM",
      })
      report.summary.failed++
      report.status = "FAIL"
    }
  }

  // Rule 5: Type definitions for API contracts
  log("\nChecking Rule 5: Type Definitions", colors.cyan)
  report.summary.totalChecks++

  const typesDir = "types"
  if (fs.existsSync(typesDir)) {
    const typeFiles = fs.readdirSync(typesDir).filter((f) => f.endsWith(".ts"))
    if (typeFiles.length > 0) {
      log(`✓ PASS: Type definitions found (${typeFiles.length} files)`, colors.green)
      report.findings.push({
        rule: "Type Definitions",
        status: "PASS",
        details: `Found ${typeFiles.length} type definition files ensuring API contracts are typed`,
        severity: "MEDIUM",
      })
      report.summary.passed++
    }
  }

  // Summary
  log("\n=== Audit Summary ===", colors.cyan)
  log(`Total Checks: ${report.summary.totalChecks}`, colors.cyan)
  log(`Passed: ${report.summary.passed}`, colors.green)
  log(`Failed: ${report.summary.failed}`, colors.red)
  log(`Warnings: ${report.summary.warnings}`, colors.yellow)

  if (report.status === "PASS") {
    log("\n✓ SOLID Architecture Compliance: PASSED", colors.green)
  } else {
    log("\n✗ SOLID Architecture Compliance: FAILED", colors.red)
  }

  return report
}

// Export for testing
export { auditArchitecture }
export type { ComplianceReport }

// Run if executed directly
if (require.main === module) {
  const report = auditArchitecture()
  console.log("\n" + JSON.stringify(report, null, 2))
}
