import { useAuth } from "@/auth/AuthProvider";
import EnhancedPublicBuyRequestsPage from "@/pages/EnhancedPublicBuyRequestsPage";
// import EnhancedPublicBuyRequestsPage from './EnhancedPublicBuyRequestsPage';
// or maybe
// import EnhancedPublicBuyRequestsPage from '../components/EnhancedPublicBuyRequestsPage';
// import EnhancedPublicBuyRequestsPage from "@/components/pages/EnhancedPublicBuyRequestsPage";


 function BuyRequestsPage({ onLogin }) {
   const { user } = useAuth();
   return <EnhancedPublicBuyRequestsPage user={user} onLogin={onLogin} />;
 }
    export default BuyRequestsPage;