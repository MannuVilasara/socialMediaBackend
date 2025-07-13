#!/bin/bash

# API Testing Script for Social Media Backend

echo "🚀 Social Media Backend API Testing"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:8000"}
API_URL="$BASE_URL/api/v1"

# Check if server is running
echo -e "${BLUE}Checking if server is running...${NC}"
if curl -s "$API_URL/healthcheck" >/dev/null; then
    echo -e "${GREEN}✅ Server is running at $BASE_URL${NC}"
else
    echo -e "${RED}❌ Server is not running at $BASE_URL${NC}"
    echo -e "${YELLOW}Please start your server with: npm run dev${NC}"
    exit 1
fi

# Check if dependencies are installed
echo -e "${BLUE}Checking dependencies...${NC}"
if npm list axios >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Dependencies are installed${NC}"
else
    echo -e "${YELLOW}⚠️  Installing test dependencies...${NC}"
    npm install axios form-data --save-dev
fi

# Run tests
echo -e "${BLUE}Running API tests...${NC}"
echo "=================================="

if [ "$1" = "full" ]; then
    echo -e "${YELLOW}Running comprehensive tests...${NC}"
    node test-endpoints.js
else
    echo -e "${YELLOW}Running simple tests...${NC}"
    node test-endpoints-simple.js
fi

echo "=================================="
echo -e "${BLUE}Testing completed!${NC}"

# Provide next steps
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "• Check test results above"
echo "• Import postman_collection.json for manual testing"
echo "• Run 'npm test' for quick testing"
echo "• Run './test.sh full' for comprehensive testing"
