#!/bin/bash

# BoltDIY V2.0 - Quick Setup Script
# This script guides you through the database setup process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  BoltDIY V2.0 - Quick Setup${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ .env.local file not found!${NC}"
    echo ""
    echo -e "${YELLOW}Please create .env.local from .env.example:${NC}"
    echo -e "  ${BLUE}cp .env.example .env.local${NC}"
    echo ""
    exit 1
fi

# Load environment variables
if command -v dotenv &> /dev/null; then
    source <(dotenv -f .env.local)
elif [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check for required variables
echo -e "${CYAN}[1/4] Checking environment variables...${NC}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}✗ Missing required Supabase credentials${NC}"
    echo ""
    echo -e "${YELLOW}Please add to your .env.local:${NC}"
    echo -e "  ${BLUE}SUPABASE_URL=https://your-project.supabase.co${NC}"
    echo -e "  ${BLUE}SUPABASE_SERVICE_ROLE_KEY=your-service-role-key${NC}"
    echo ""
    echo -e "${YELLOW}Get these from:${NC}"
    echo -e "  ${BLUE}https://app.supabase.com/project/_/settings/api${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Environment variables found${NC}"
echo -e "  URL: ${BLUE}${SUPABASE_URL}${NC}"

# Check if schema.sql exists
echo ""
echo -e "${CYAN}[2/4] Checking schema file...${NC}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_FILE="${SCRIPT_DIR}/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}✗ Schema file not found: ${SCHEMA_FILE}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Schema file found${NC}"
echo -e "  File: ${BLUE}${SCHEMA_FILE}${NC}"

# Copy schema to clipboard if possible
echo ""
echo -e "${CYAN}[3/4] Preparing database setup...${NC}"

if command -v pbcopy &> /dev/null; then
    cat "$SCHEMA_FILE" | pbcopy
    echo -e "${GREEN}✓ Schema SQL copied to clipboard!${NC}"
elif command -v xclip &> /dev/null; then
    cat "$SCHEMA_FILE" | xclip -selection clipboard
    echo -e "${GREEN}✓ Schema SQL copied to clipboard!${NC}"
elif command -v xsel &> /dev/null; then
    cat "$SCHEMA_FILE" | xsel --clipboard
    echo -e "${GREEN}✓ Schema SQL copied to clipboard!${NC}"
else
    echo -e "${YELLOW}⚠ Could not copy to clipboard (command not available)${NC}"
    echo -e "  You'll need to manually copy: ${BLUE}${SCHEMA_FILE}${NC}"
fi

# Show manual instructions
echo ""
echo -e "${CYAN}[4/4] Manual setup required${NC}"
echo ""
echo -e "${BOLD}${YELLOW}Please complete these steps:${NC}"
echo ""
echo -e "${BOLD}1.${NC} Open your Supabase SQL Editor:"
echo -e "   ${BLUE}https://app.supabase.com/project/_/sql${NC}"
echo ""
echo -e "${BOLD}2.${NC} Click 'New Query' button"
echo ""
echo -e "${BOLD}3.${NC} Paste the schema SQL (already in your clipboard!)"
echo -e "   Or manually copy from: ${BLUE}${SCHEMA_FILE}${NC}"
echo ""
echo -e "${BOLD}4.${NC} Click 'Run' to execute the schema"
echo ""
echo -e "${BOLD}5.${NC} Enable Email Authentication:"
echo -e "   ${BLUE}https://app.supabase.com/project/_/auth/providers${NC}"
echo ""
echo -e "${BOLD}6.${NC} Configure Site URL (use http://localhost:5173 for dev):"
echo -e "   ${BLUE}https://app.supabase.com/project/_/auth/url-configuration${NC}"
echo ""

# Ask if they want to open the browser
echo -e "${YELLOW}Would you like to open the Supabase SQL Editor now? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # Extract project ref from URL
    if [[ $SUPABASE_URL =~ ([a-z]+)\.supabase\.co ]]; then
        PROJECT_REF="${BASH_REMATCH[1]}"
        SQL_EDITOR_URL="https://app.supabase.com/project/${PROJECT_REF}/sql"
        
        # Open in browser
        if command -v open &> /dev/null; then
            open "$SQL_EDITOR_URL"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$SQL_EDITOR_URL"
        else
            echo -e "${YELLOW}Could not open browser automatically${NC}"
            echo -e "Please visit: ${BLUE}${SQL_EDITOR_URL}${NC}"
        fi
        
        echo -e "${GREEN}✓ Opening Supabase SQL Editor...${NC}"
    else
        echo -e "${RED}✗ Could not extract project reference from SUPABASE_URL${NC}"
        echo -e "Please open manually: ${BLUE}https://app.supabase.com/project/_/sql${NC}"
    fi
fi

echo ""
echo -e "${BOLD}${GREEN}========================================${NC}"
echo -e "${BOLD}${GREEN}  Setup Instructions Displayed!${NC}"
echo -e "${BOLD}${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}After completing the SQL setup, run:${NC}"
echo -e "  ${GREEN}npm run dev${NC}"
echo ""
echo -e "${CYAN}Then open:${NC}"
echo -e "  ${BLUE}http://localhost:5173${NC}"
echo ""
