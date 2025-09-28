const { default: InboxPage } = require("@/pages/InboxPage");

function UnifiedInbox() {
  const { user } = useAuth();
  return <InboxPage user={user} />;
}