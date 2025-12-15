import { useEffect, useState } from "react";
import { Button } from "../ui";
import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { MapPin, Plus } from "lucide-react";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);

  // 🔹 Load addresses from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("addresses") || "[]");
    setAddresses(stored);
  }, []);

  // 🔹 Delete address
  const handleDelete = (id) => {
    const updated = addresses.filter(addr => addr.id !== id);
    setAddresses(updated);
    localStorage.setItem("addresses", JSON.stringify(updated));
  };

  // 🔹 Edit address (send back to checkout)
  const handleEdit = (address) => {
    localStorage.setItem("edit_address", JSON.stringify(address));
    window.location.href = "/checkout"; // change if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved Delivery Addresses</CardTitle>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => (window.location.href = "/checkout")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </CardHeader>

          <CardContent>
            {addresses.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <MapPin className="h-10 w-10 mx-auto mb-3" />
                No saved addresses yet
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="flex items-start justify-between p-4 border rounded-lg bg-white"
                  >
                    <div className="flex gap-3">
                      <MapPin className="text-emerald-600 mt-1" />
                      <div>
                        <p className="font-semibold">
                          {address.address_line_1}
                        </p>
                        {address.address_line_2 && (
                          <p className="text-sm text-gray-600">
                            {address.address_line_2}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.province} {address.postal_code}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(address)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(address.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
