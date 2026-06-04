import re
import dateparser
from datetime import datetime
from typing import Optional, Tuple

CAREER_KEYWORDS = [
    "internship", "job", "hiring", "recruitment",
    "interview", "interview invite", "assessment", "test", "offer", "offer letter", "application",
    "shortlisted", "selected", "selection", "shortlist", "placement", "campus drive", "campus placement", "campus recruitment",
    "coding test", "online test", "call letter", "results", "result", "job offer", "hired"
]

ACTION_KEYWORDS = [
    "deadline", "submit", "form", "required",
    "complete", "schedule", "assessment link", "action required",
    "due by", "expires on", "at your earliest convenience", "please respond", "please confirm"
]

DEADLINE_PATTERNS = [
    r"submit before ([\d\w\s,]+)",
    r"deadline:? ([\d\w\s,]+)",
    r"complete by ([\d\w\s,]+)",
    r"due on ([\d\w\s,]+)",
    r"by ([\d\s\w]+,?\s?202\d)",  # e.g., June 10, 2026
]

def is_important_email(subject: str, snippet: str) -> bool:
    content = (subject + " " + snippet).lower()
    
    # Check for career keywords
    has_career = any(kw in content for kw in CAREER_KEYWORDS)
    
    # Check for action keywords
    has_action = any(kw in content for kw in ACTION_KEYWORDS)
    
    return has_career or has_action

def detect_opportunity_type(subject: str, snippet: str) -> str:
    content = (subject + " " + snippet).lower()
    
    if "interview" in content:
        return "Interview"
    if "assessment" in content or "test" in content:
        return "Assessment"
    if "offer" in content:
        return "Offer"
    if "internship" in content:
        return "Internship"
    if "job" in content:
        return "Job"
    
    return "Opportunity"

def extract_deadline(snippet: str) -> Optional[datetime]:
    for pattern in DEADLINE_PATTERNS:
        match = re.search(pattern, snippet, re.IGNORECASE)
        if match:
            date_str = match.group(1).strip()
            parsed_date = dateparser.parse(date_str)
            if parsed_date:
                return parsed_date
    return None
