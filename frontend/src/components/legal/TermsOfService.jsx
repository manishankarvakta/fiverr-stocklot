import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Shield, FileText, Users, AlertTriangle, Gavel, Clock } from 'lucide-react';

const TermsOfService = () => {
  const lastUpdated = "January 2, 2025";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Please read these terms carefully before using StockLot's livestock marketplace platform
          </p>
          <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            Last updated: {lastUpdated}
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                1. Introduction and Acceptance
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Welcome to StockLot, South Africa's premier online livestock marketplace ("Platform"). 
                These Terms of Service ("Terms") govern your use of our website, mobile applications, 
                and related services (collectively, the "Services").
              </p>
              <p>
                By accessing or using StockLot, you agree to be bound by these Terms and our Privacy Policy. 
                If you do not agree to these Terms, please do not use our Services.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <p className="text-blue-800 mb-0">
                  <strong>Important:</strong> StockLot is operated by StockLot (Pty) Ltd, 
                  a company registered in South Africa. Our services are primarily intended for 
                  users within South Africa and comply with South African laws and regulations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                2. User Accounts and Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>2.1 Account Creation</h4>
              <p>
                To use certain features of StockLot, you must create an account. You agree to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information</li>
                <li>Keep your login credentials secure</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h4>2.2 Account Verification</h4>
              <p>
                For certain transactions and services, we may require identity verification, including:
              </p>
              <ul>
                <li>Government-issued identification documents</li>
                <li>Business registration certificates (for commercial users)</li>
                <li>Banking information for payment processing</li>
                <li>Veterinary certificates for livestock listings</li>
              </ul>

              <h4>2.3 Account Suspension</h4>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms, 
                engage in fraudulent activity, or pose risks to other users or the Platform.
              </p>
            </CardContent>
          </Card>

          {/* Livestock Trading */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gavel className="h-5 w-5 mr-2 text-blue-600" />
                3. Livestock Trading and Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>3.1 Listing Requirements</h4>
              <p>When listing livestock for sale, sellers must:</p>
              <ul>
                <li>Provide accurate descriptions of animals, including age, breed, weight, and health status</li>
                <li>Upload recent, authentic photographs of the livestock</li>
                <li>Include valid veterinary health certificates where required</li>
                <li>Specify accurate location and availability information</li>
                <li>Comply with all applicable animal welfare and trading regulations</li>
              </ul>

              <h4>3.2 Prohibited Livestock</h4>
              <p>The following are prohibited on our Platform:</p>
              <ul>
                <li>Endangered or protected species</li>
                <li>Animals without proper documentation or health certificates</li>
                <li>Livestock from quarantined areas or with known diseases</li>
                <li>Stolen or illegally obtained animals</li>
                <li>Animals not suitable for the intended purpose (meat, breeding, etc.)</li>
              </ul>

              <h4>3.3 Transaction Process</h4>
              <p>All transactions on StockLot follow our secure process:</p>
              <ul>
                <li><strong>Order Placement:</strong> Buyers place orders through our platform</li>
                <li><strong>Payment Escrow:</strong> Funds are held in escrow for buyer protection</li>
                <li><strong>Delivery/Collection:</strong> Livestock is delivered or collected as agreed</li>
                <li><strong>Confirmation:</strong> Buyer confirms receipt and condition of livestock</li>
                <li><strong>Payment Release:</strong> Funds are released to the seller</li>
              </ul>

              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                <p className="text-amber-800 mb-0">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  <strong>Important:</strong> All livestock sales are subject to inspection upon delivery. 
                  Buyers have the right to reject animals that do not match the description or fail health inspections.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                4. Payment Terms and Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>4.1 Platform Fees</h4>
              <p>StockLot charges the following fees:</p>
              <ul>
                <li><strong>Transaction Fee:</strong> 5% of the sale price (paid by seller)</li>
                <li><strong>Payment Processing:</strong> 2.9% + R2.00 per transaction</li>
                <li><strong>Listing Fees:</strong> Free for basic listings, premium options available</li>
                <li><strong>Verification Fees:</strong> May apply for enhanced verification services</li>
              </ul>

              <h4>4.2 Payment Methods</h4>
              <p>We accept the following payment methods:</p>
              <ul>
                <li>Credit and debit cards (Visa, Mastercard)</li>
                <li>Electronic Fund Transfers (EFT)</li>
                <li>Paystack payment gateway</li>
                <li>Bank deposits (verified sellers only)</li>
              </ul>

              <h4>4.3 Refund Policy</h4>
              <p>
                Refunds are processed according to our Buyer Protection Policy. Generally, 
                refunds are available when livestock does not match the description, 
                fails health inspections, or is not delivered as agreed.
              </p>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                5. User Responsibilities and Code of Conduct
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>5.1 General Conduct</h4>
              <p>Users must:</p>
              <ul>
                <li>Comply with all applicable laws and regulations</li>
                <li>Treat other users with respect and professionalism</li>
                <li>Provide honest and accurate information</li>
                <li>Respect intellectual property rights</li>
                <li>Report suspicious or fraudulent activity</li>
              </ul>

              <h4>5.2 Prohibited Activities</h4>
              <p>Users may not:</p>
              <ul>
                <li>Engage in fraudulent or deceptive practices</li>
                <li>Harass, threaten, or abuse other users</li>
                <li>Circumvent platform fees or payment processes</li>
                <li>Use automated systems to access the platform</li>
                <li>Post inappropriate, offensive, or illegal content</li>
                <li>Interfere with platform operations or security</li>
              </ul>

              <h4>5.3 Animal Welfare</h4>
              <p>
                All users must comply with South African animal welfare laws, including:
              </p>
              <ul>
                <li>Animal Protection Act No. 71 of 1962</li>
                <li>Performing Animals Protection Act No. 24 of 1935</li>
                <li>Provincial and local animal welfare regulations</li>
                <li>Industry-specific welfare standards</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                6. Privacy and Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>6.1 Data Collection</h4>
              <p>
                We collect and process personal information as described in our Privacy Policy, 
                including user account information, transaction data, and communication records.
              </p>

              <h4>6.2 POPIA Compliance</h4>
              <p>
                StockLot complies with the Protection of Personal Information Act (POPIA) 
                and implements appropriate security measures to protect user data.
              </p>

              <h4>6.3 Data Retention</h4>
              <p>
                We retain user data for as long as necessary to provide services, 
                comply with legal obligations, and resolve disputes.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
                7. Limitation of Liability and Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>7.1 Platform Disclaimer</h4>
              <p>
                StockLot is a marketplace platform that connects buyers and sellers. 
                We do not own, sell, or control the livestock listed on our platform. 
                We are not responsible for the quality, safety, or legality of livestock, 
                the accuracy of listings, or the ability of users to complete transactions.
              </p>

              <h4>7.2 Limitation of Liability</h4>
              <p>
                To the maximum extent permitted by law, StockLot shall not be liable for:
              </p>
              <ul>
                <li>Direct, indirect, incidental, or consequential damages</li>
                <li>Lost profits, revenue, or business opportunities</li>
                <li>Damage to livestock during transport or delivery</li>
                <li>Disputes between users</li>
                <li>Acts of third parties, including fraudulent users</li>
              </ul>

              <h4>7.3 Indemnification</h4>
              <p>
                Users agree to indemnify and hold StockLot harmless from claims, 
                damages, and expenses arising from their use of the platform or 
                violation of these Terms.
              </p>
            </CardContent>
          </Card>

          {/* Dispute Resolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gavel className="h-5 w-5 mr-2 text-blue-600" />
                8. Dispute Resolution and Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>8.1 Dispute Resolution Process</h4>
              <p>For disputes between users, we encourage:</p>
              <ol>
                <li><strong>Direct Communication:</strong> Attempt to resolve issues directly</li>
                <li><strong>Platform Mediation:</strong> Use our mediation services</li>
                <li><strong>Professional Arbitration:</strong> Binding arbitration if necessary</li>
                <li><strong>Legal Action:</strong> Court proceedings as a last resort</li>
              </ol>

              <h4>8.2 Governing Law</h4>
              <p>
                These Terms are governed by the laws of South Africa. 
                Any disputes will be subject to the jurisdiction of South African courts.
              </p>

              <h4>8.3 Consumer Protection</h4>
              <p>
                Nothing in these Terms limits your rights under the Consumer Protection Act 
                or other applicable consumer protection laws.
              </p>
            </CardContent>
          </Card>

          {/* Terms Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                9. Changes to Terms and Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <h4>9.1 Terms Updates</h4>
              <p>
                We may update these Terms from time to time. Material changes will be 
                communicated via email or platform notifications. Continued use of the 
                platform constitutes acceptance of updated Terms.
              </p>

              <h4>9.2 Account Termination</h4>
              <p>You may terminate your account at any time by:</p>
              <ul>
                <li>Contacting our support team</li>
                <li>Following the account deletion process in your settings</li>
                <li>Ensuring all outstanding transactions are completed</li>
              </ul>

              <h4>9.3 Service Termination</h4>
              <p>
                We may suspend or terminate services for maintenance, legal compliance, 
                or business reasons. We will provide reasonable notice when possible.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                10. Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>For questions about these Terms of Service, please contact us:</p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>StockLot (Pty) Ltd</strong></p>
                <p>
                  Email: legal@stocklot.co.za<br />
                  Phone: +27 11 123 4567<br />
                  Address: 123 Business District, Johannesburg, 2000, South Africa
                </p>
                <p>
                  <strong>Business Hours:</strong><br />
                  Monday - Friday: 8:00 AM - 5:00 PM (SAST)<br />
                  Saturday: 9:00 AM - 1:00 PM (SAST)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400 mt-4">
                <p className="text-blue-800 mb-0">
                  <strong>Emergency Support:</strong> For urgent issues related to live animal 
                  welfare or safety concerns, please call our 24/7 emergency line: +27 82 123 4567
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptance Statement */}
          <div className="text-center py-8 border-t-2 border-gray-200">
            <p className="text-gray-600 italic">
              By using StockLot, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Document Version: 2.1 | Effective Date: {lastUpdated}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;