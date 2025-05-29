#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Systematic Code Review...${NC}\n"

# 1. Static Analysis
echo -e "${YELLOW}Running Static Analysis...${NC}"
npm run lint
npm run type-check

# 2. Security Audit
echo -e "\n${YELLOW}Running Security Audit...${NC}"
npm audit
# Run SonarQube analysis if available
if command -v sonar-scanner &> /dev/null; then
    sonar-scanner
fi

# 3. Test Coverage
echo -e "\n${YELLOW}Running Tests and Coverage Analysis...${NC}"
npm run test:coverage

# 4. Bundle Analysis
echo -e "\n${YELLOW}Analyzing Bundle Size...${NC}"
npm run build
if command -v source-map-explorer &> /dev/null; then
    source-map-explorer 'build/static/js/*.js'
fi

# 5. Performance Analysis
echo -e "\n${YELLOW}Running Performance Tests...${NC}"
# Run Lighthouse CI if available
if command -v lighthouse &> /dev/null; then
    lighthouse http://localhost:3000 --output json --output html --output-path ./lighthouse-report
fi

# 6. Dependency Check
echo -e "\n${YELLOW}Checking Dependencies...${NC}"
npm outdated
npm audit

# 7. Code Complexity Analysis
echo -e "\n${YELLOW}Analyzing Code Complexity...${NC}"
npx ts-complexity . --max-complexity 15

# 8. Authentication Flow Check
echo -e "\n${YELLOW}Checking Authentication Components...${NC}"
echo "Reviewing authentication files..."
find . -type f -name "*auth*.ts" -o -name "*auth*.tsx" | while read -r file; do
    echo "Reviewing: $file"
    # Add specific checks for authentication files
    grep -n "password" "$file" || true
    grep -n "token" "$file" || true
    grep -n "session" "$file" || true
done

# 9. API Integration Check
echo -e "\n${YELLOW}Checking API Integration...${NC}"
echo "Reviewing API files..."
find . -type f -name "*api*.ts" -o -name "*api*.tsx" | while read -r file; do
    echo "Reviewing: $file"
    # Add specific checks for API files
    grep -n "fetch" "$file" || true
    grep -n "axios" "$file" || true
    grep -n "http" "$file" || true
done

# 10. Component Structure Analysis
echo -e "\n${YELLOW}Analyzing Component Structure...${NC}"
echo "Reviewing React components..."
find . -type f -name "*.tsx" | while read -r file; do
    echo "Reviewing: $file"
    # Add specific checks for React components
    grep -n "React.memo" "$file" || true
    grep -n "useCallback" "$file" || true
    grep -n "useMemo" "$file" || true
done

# Generate Report
echo -e "\n${YELLOW}Generating Review Report...${NC}"
cat << EOF > code-review-report.md
# Code Review Report
Generated on $(date)

## Static Analysis
- ESLint: $(npm run lint 2>&1 | grep "problem" || echo "No issues found")
- TypeScript: $(npm run type-check 2>&1 | grep "error" || echo "No issues found")

## Security Audit
- npm audit: $(npm audit 2>&1 | grep "vulnerabilities" || echo "No vulnerabilities found")

## Test Coverage
$(npm run test:coverage 2>&1 | grep "%" || echo "No coverage data available")

## Performance Metrics
$(lighthouse http://localhost:3000 --output json 2>/dev/null | jq '.categories.performance.score' || echo "No performance data available")

## Dependencies
$(npm outdated --json || echo "All dependencies up to date")

## Code Complexity
$(npx ts-complexity . --max-complexity 15 2>/dev/null || echo "No complexity issues found")
EOF

echo -e "${GREEN}Code review completed! Check code-review-report.md for details.${NC}" 