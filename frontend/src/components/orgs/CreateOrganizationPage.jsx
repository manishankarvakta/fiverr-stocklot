import CreateOrganizationForm from './CreateOrganizationForm';

export default function CreateOrganizationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Your Organization</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Set up your farm, company, or cooperative to manage livestock sales as a team with shared listings, documents, and payouts.
            </p>
          </div>
          
          <CreateOrganizationForm />
        </div>
      </div>
    </div>
  );
}