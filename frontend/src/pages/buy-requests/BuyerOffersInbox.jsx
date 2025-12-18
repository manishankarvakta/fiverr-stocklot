import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Inbox } from 'lucide-react';

// function BuyerOffersInbox() {
//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="container mx-auto px-4 py-16">
//         <div className="max-w-4xl mx-auto">
//           <h1 className="text-4xl font-bold text-emerald-900 mb-8">Buyer Offers Inbox</h1>
//           <Card className="border-emerald-200">
//             <CardContent className="p-8">
//               <Inbox className="h-12 w-12 text-emerald-600 mb-6" />
//               <p className="text-emerald-700 mb-6">
//                 Buyer offers inbox. Please use the main App.js version for full features.
//               </p>
//               <Button 
//                 onClick={() => window.location.href = '/buy-requests'}
//                 className="bg-emerald-600 hover:bg-emerald-700 text-white"
//               >
//                 Back to Buy Requests
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default BuyerOffersInbox;

import { useAuth } from "@/auth/AuthProvider";
import BuyerOffersPage from '../BuyerOffersPage';

function BuyerOffersInbox() {
  const { user } = useAuth();
  return <BuyerOffersPage user={user} />;
}
export default BuyerOffersInbox;