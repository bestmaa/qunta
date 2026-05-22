#[derive(Debug, Clone, Eq, PartialEq)]
pub struct LocalSetting {
    pub key: String,
    pub updated_at: String,
    pub value: String,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct RecentProject {
    pub id: String,
    pub last_opened_at: String,
    pub name: String,
    pub path: String,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct StoredSession {
    pub created_at: String,
    pub id: String,
    pub project_id: String,
    pub status: String,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct AuditEvent {
    pub created_at: String,
    pub id: String,
    pub kind: String,
    pub message: String,
    pub session_id: Option<String>,
}
