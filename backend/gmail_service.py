import os
import base64
import re
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

class GmailService:
    def __init__(self, token_data=None):
        self.creds = None
        if token_data:
            self.creds = Credentials.from_authorized_user_info(token_data, SCOPES)
            self.creds.refresh = lambda request: None

    def get_service(self):
        if not self.creds:
            raise RuntimeError('Gmail credentials missing.')
        return build('gmail', 'v1', credentials=self.creds)

    def fetch_unread_messages(self, user_id='me'):
        """
        OPTIMIZED TARGET SEARCH: Instead of filtering purely by unread or read status,
        we tell Google's server to search ALL folders (including spam and trash) for 
        specific offer/selection/action keywords. This prevents pulling junk while 
        guaranteeing we catch the hidden internship email.
        """
        service = self.get_service()
        try:
            # We explicitly includeSpamTrash=True and target career/action words directly in the query
            target_query = "selection OR offer OR internship OR " \
                           "\"offer letter\" OR \"invited to join\" OR " \
                           "\"mandatory form\" OR \"fill out\" OR \"action required\""
            
            results = service.users().messages().list(
                userId=user_id,
                q=target_query,
                maxResults=40, # Limits total network pull to 40 highly targeted emails for speed
                includeSpamTrash=True # CRITICAL: Looks inside Spam and Trash folders
            ).execute()
            
            return results.get('messages', [])
        except Exception as e:
            print(f"[GMAIL ERROR] {e}")
            return []

    def fetch_every_message(self, user_id='me'):
        return self.fetch_unread_messages(user_id)

    def get_message_details(self, message_id, user_id='me'):
        service = self.get_service()
        try:
            message = service.users().messages().get(userId=user_id, id=message_id, format='full').execute()
            payload = message.get('payload', {})
            headers = payload.get('headers', [])
            
            subject = "No Subject"
            sender = "Unknown Sender"
            for header in headers:
                if header.get('name') == 'Subject':
                    subject = header.get('value')
                if header.get('name') == 'From':
                    sender = header.get('value')
            
            snippet = message.get('snippet', '')
            received_at = int(message.get('internalDate', 0)) / 1000
            
            # Identify which folder it lived in so the user knows if it was hiding in Spam!
            label_ids = message.get('labelIds', [])
            folder = 'INBOX'
            if 'SPAM' in label_ids: 
                folder = 'SPAM / JUNK FOLDER'
            elif 'TRASH' in label_ids:
                folder = 'TRASH'
            elif 'CATEGORY_PROMOTIONS' in label_ids: 
                folder = 'PROMOTIONS'
            elif 'CATEGORY_UPDATES' in label_ids: 
                folder = 'UPDATES'
            
            return {
                'id': message_id,
                'subject': subject,
                'sender': sender,
                'snippet': snippet,
                'received_at': received_at,
                'folder': folder,
                'label_ids': label_ids
            }
        except Exception:
            return None