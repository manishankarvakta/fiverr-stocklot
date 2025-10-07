import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../ui";
import { Badge, MapPin, Plus } from "lucide-react";

function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await apiCall('GET', '/addresses');
      setAddresses(response || []);
    } catch (error) {
      console.error('Failed to fetch addresses');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-emerald-900">Delivery Addresses</h1>
            <p className="text-emerald-700">Manage your delivery and pickup locations</p>
          </div>
          
          <div className="grid gap-6">
            <Card className="shadow-xl border-emerald-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-emerald-900">Saved Addresses</CardTitle>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading addresses...</p>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No addresses saved yet</p>
                    <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-emerald-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-8 w-8 text-emerald-600" />
                          <div>
                            <p className="font-medium">{address.name}</p>
                            <p className="text-sm text-gray-600">{address.street_address}</p>
                            <p className="text-sm text-gray-600">{address.city}, {address.province} {address.postal_code}</p>
                          </div>
                          {address.is_default && (
                            <Badge className="bg-emerald-100 text-emerald-700">Default</Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm" className="text-red-600">Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AddressesPage;