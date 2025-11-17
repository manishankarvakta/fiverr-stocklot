import { useAuth } from "@/auth/AuthProvider";

function BuyerOffersInbox() {
  const { user } = useAuth();
  return <BuyerOffersPage user={user} />;
}
export default BuyerOffersInbox;