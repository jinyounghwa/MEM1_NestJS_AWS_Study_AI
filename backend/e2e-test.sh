#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test variables
BASE_URL="http://localhost:3001/api/nestjs-aws-learn"
USER_ID="e2e-test-$(date +%s)"
SESSION_ID=""
MESSAGE_ID=""

# Counter
PASS=0
FAIL=0

# Test helper function
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local payload="$4"
    local expected_status="$5"

    printf "${BLUE}[TEST]${NC} $test_name... "

    if [ -z "$payload" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$payload")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_status" ] || [ "$expected_status" = "*" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        PASS=$((PASS + 1))
        echo "$body"
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code, expected $expected_status)"
        FAIL=$((FAIL + 1))
        echo "$body"
    fi
    echo ""
}

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     🧪 NestJS AWS Learning Tutor - End-to-End Test       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Test User ID: $USER_ID"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}═══ PHASE 1: Health Check ═══${NC}"
echo ""
test_endpoint "Backend Health Check" "GET" "/health" "" "200"

# Test 2: Session Creation
echo -e "${YELLOW}═══ PHASE 2: Create Learning Session ═══${NC}"
echo ""

cat > /tmp/create_session.json << EOF
{"userId": "$USER_ID", "topics": ["NestJS Fundamentals", "TypeORM Integration", "PostgreSQL Setup"]}
EOF

response=$(curl -s -X POST "$BASE_URL/start" \
    -H "Content-Type: application/json" \
    -d @/tmp/create_session.json)

SESSION_ID=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('sessionId', ''))" 2>/dev/null)

printf "${BLUE}[TEST]${NC} Create Learning Session... "
if [ ! -z "$SESSION_ID" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Session ID: $SESSION_ID)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (No session ID returned)"
    FAIL=$((FAIL + 1))
    echo "$response"
fi
echo "$response" | python3 -m json.tool
echo ""

# Test 3: Get Sessions List
echo -e "${YELLOW}═══ PHASE 3: Get Previous Sessions ═══${NC}"
echo ""

response=$(curl -s -X GET "$BASE_URL/sessions/$USER_ID")
session_count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('sessions', [])))" 2>/dev/null)

printf "${BLUE}[TEST]${NC} Get Sessions List... "
if [ "$session_count" -gt "0" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Found $session_count session(s))"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (No sessions found)"
    FAIL=$((FAIL + 1))
fi
echo "$response" | python3 -m json.tool
echo ""

# Test 4: Send Chat Message with IS Tag
echo -e "${YELLOW}═══ PHASE 4: Send Chat Message (with IS tag) ═══${NC}"
echo ""

cat > /tmp/chat_message.json << 'EOF'
{
  "userId": "$USER_ID",
  "sessionId": "$SESSION_ID",
  "message": "<IS>NestJS is a TypeScript framework for building efficient and scalable server-side applications</IS>"
}
EOF

# Replace variables
sed -i "" "s|\$USER_ID|$USER_ID|g" /tmp/chat_message.json
sed -i "" "s|\$SESSION_ID|$SESSION_ID|g" /tmp/chat_message.json

response=$(curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d @/tmp/chat_message.json)

printf "${BLUE}[TEST]${NC} Send Chat Message with IS Tag... "
has_is=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('hasIS', False))" 2>/dev/null)

if [ "$has_is" = "True" ]; then
    echo -e "${GREEN}✅ PASS${NC} (IS tag detected)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (IS tag not detected)"
    FAIL=$((FAIL + 1))
fi
echo "$response" | python3 -m json.tool
echo ""

# Test 5: Send Another Message
echo -e "${YELLOW}═══ PHASE 5: Send Second Chat Message ═══${NC}"
echo ""

cat > /tmp/chat_message2.json << 'EOF'
{
  "userId": "$USER_ID",
  "sessionId": "$SESSION_ID",
  "message": "Could you explain how TypeORM works with PostgreSQL?"
}
EOF

sed -i "" "s|\$USER_ID|$USER_ID|g" /tmp/chat_message2.json
sed -i "" "s|\$SESSION_ID|$SESSION_ID|g" /tmp/chat_message2.json

response=$(curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d @/tmp/chat_message2.json)

printf "${BLUE}[TEST]${NC} Send Question Message... "
has_response=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('response', '')) > 0)" 2>/dev/null)

if [ "$has_response" = "True" ]; then
    echo -e "${GREEN}✅ PASS${NC} (AI response received)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (No AI response)"
    FAIL=$((FAIL + 1))
fi
echo "$response" | python3 -m json.tool | head -20
echo ""

# Test 6: Get Session Messages
echo -e "${YELLOW}═══ PHASE 6: Retrieve Session Messages ═══${NC}"
echo ""

response=$(curl -s -X GET "$BASE_URL/session/$SESSION_ID/messages")
message_count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('messages', [])))" 2>/dev/null)

printf "${BLUE}[TEST]${NC} Get Session Messages... "
if [ "$message_count" -gt "0" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Retrieved $message_count message(s))"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (No messages found)"
    FAIL=$((FAIL + 1))
fi
echo "Found $message_count messages in session"
echo "$response" | python3 -m json.tool | head -30
echo ""

# Test 7: Resume Session
echo -e "${YELLOW}═══ PHASE 7: Resume Previous Session ═══${NC}"
echo ""

cat > /tmp/resume_session.json << EOF
{"userId": "$USER_ID"}
EOF

response=$(curl -s -X POST "$BASE_URL/resume/$SESSION_ID" \
    -H "Content-Type: application/json" \
    -d @/tmp/resume_session.json)

printf "${BLUE}[TEST]${NC} Resume Session... "
is_success=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$is_success" = "True" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Session resumed successfully)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (Session resume failed)"
    FAIL=$((FAIL + 1))
fi
echo "$response" | python3 -m json.tool
echo ""

# Test 8: Export Markdown
echo -e "${YELLOW}═══ PHASE 8: Export Learning Notes ═══${NC}"
echo ""

printf "${BLUE}[TEST]${NC} Export Markdown... "
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/export/$USER_ID")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP 200)"
    PASS=$((PASS + 1))
    # Save markdown file
    markdown_body=$(echo "$response" | head -n-1)
    echo "$markdown_body" > "/tmp/export_$USER_ID.md"
    echo "Markdown exported to: /tmp/export_$USER_ID.md"
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
    FAIL=$((FAIL + 1))
fi
echo ""

# Test 9: Verify Database Persistence
echo -e "${YELLOW}═══ PHASE 9: Verify Database Persistence ═══${NC}"
echo ""

printf "${BLUE}[TEST]${NC} Check PostgreSQL Data... "

# Check students table
student_count=$(psql -U postgres -d nestjs_aws_learn -t -c "SELECT COUNT(*) FROM students WHERE userId = '$USER_ID';" 2>/dev/null)

if [ "$student_count" -gt "0" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Student record found)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}❌ FAIL${NC} (No student record)"
    FAIL=$((FAIL + 1))
fi

# Check sessions table
session_db_count=$(psql -U postgres -d nestjs_aws_learn -t -c "SELECT COUNT(*) FROM learning_sessions WHERE \"userId\" = '$USER_ID';" 2>/dev/null)
echo "Sessions in DB: $session_db_count"

# Check messages table
message_db_count=$(psql -U postgres -d nestjs_aws_learn -t -c "SELECT COUNT(*) FROM conversation_messages WHERE \"sessionId\" = '$SESSION_ID';" 2>/dev/null)
echo "Messages in DB: $message_db_count"
echo ""

# Final Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     TEST SUMMARY                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
printf "${GREEN}✅ Passed: $PASS${NC}\n"
printf "${RED}❌ Failed: $FAIL${NC}\n"
echo ""

total=$((PASS + FAIL))
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All $total tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  $FAIL out of $total tests failed${NC}"
    exit 1
fi
